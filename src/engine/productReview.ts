import type { Cell, ProductMarketStudyReport, ProductProjectTier, SKU, World } from "./types";
import { PRODUCT_PROJECT_TIERS } from "./types";
import { AXES, AXIS_KEYS, CHANNEL_TYPES, axisPos, clamp } from "./industries";
import { cellsInSegment } from "./segments";
import { archetypeByKey } from "./productCatalog";

function stableUnit(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  return (Math.abs(hash) % 10_000) / 9_999;
}

export function reviewScoreForDesign(id: string, tier: ProductProjectTier, designQuality: number): number {
  const q = clamp(designQuality, 0, 1);
  const jitter = (stableUnit(`${id}|product-review`) - .5) * .24;
  let raw = 1;
  let cap = 5;
  if (tier === "A") {
    raw = 1.15 + 1.65 * Math.pow(clamp(q / PRODUCT_PROJECT_TIERS.A.designQualityCap), 1.05);
    cap = 2.9;
  } else if (tier === "AA") {
    raw = 2.15 + 1.95 * Math.pow(clamp(q / PRODUCT_PROJECT_TIERS.AA.designQualityCap), 1.08);
    cap = 4.1;
  } else {
    raw = 2.6 + 2.4 * Math.pow(q, 1.05);
    // A perfect 5.0 is deliberately exceptional even for a top AAA project.
    cap = q >= .985 && stableUnit(`${id}|perfect-review`) > .82 ? 5 : 4.9;
  }
  return Math.round(clamp(raw + jitter, 1, cap) * 10) / 10;
}

export function ensureReviewScore(sku: SKU): number {
  if (typeof sku.reviewScore === "number") return sku.reviewScore;
  const tier = sku.projectTier ?? (sku.designDepth === "breakthrough" ? "AAA" : sku.designDepth === "advanced" ? "AA" : "A");
  sku.reviewScore = reviewScoreForDesign(sku.id, tier, sku.designQuality);
  return sku.reviewScore;
}

export function reviewPricePower(sku: SKU, cell: Cell): number {
  const score = ensureReviewScore(sku);
  // Reviews do not create reach or demand. They only give quality-sensitive buyers a modest
  // willingness-to-pay lift, enabling a narrow loved product to pursue margin over volume.
  return clamp((score - 3) / 2, 0, 1) * cell.qualitySens * .32;
}

function targetCells(w: World, sku: SKU): Cell[] {
  const baseLabel = (sku.targetLabel ?? "Broad market").split(" · ")[0];
  const saved = w.savedSegments.find((segment) => segment.name === baseLabel);
  if (saved) {
    const exact = cellsInSegment(w, saved.filter);
    if (exact.length) return exact;
  }
  if (baseLabel === "Broad market" || baseLabel === "Legacy target") return w.cube;
  const distance = (cell: Cell) => AXIS_KEYS.reduce((sum, axis) => {
    const position = axisPos(axis, AXES[axis].indexOf(cell.coord[axis]));
    return sum + Math.pow(position - (sku.target[axis] ?? .5), 2);
  }, 0);
  return [...w.cube].sort((a, b) => distance(a) - distance(b)).slice(0, Math.max(24, Math.round(w.cube.length * .08)));
}

function weightedAverage(cells: Cell[], value: (cell: Cell) => number): number {
  // Preference research represents people in the selected audience, not a spending-weighted
  // sample that would silently turn every broad market into an affluent niche.
  const total = cells.reduce((sum, cell) => sum + cell.head, 0) || 1;
  return cells.reduce((sum, cell) => sum + value(cell) * cell.head, 0) / total;
}

function qualityDiagnosis(sku: SKU, reviewScore: number): string[] {
  const tier = sku.projectTier ?? "A";
  const cap = PRODUCT_PROJECT_TIERS[tier].designQualityCap;
  const attributes = Object.values(sku.attributes ?? {});
  const spread = attributes.length ? Math.max(...attributes) - Math.min(...attributes) : 0;
  const reasons: string[] = [];
  if (tier === "A" && reviewScore < 2.8) reasons.push("The A-class program limited refinement; AA unlocks a materially higher review ceiling.");
  else if (tier === "AA" && reviewScore >= 3.8) reasons.push("This is close to the AA ceiling; moving beyond roughly 4.1 requires a flagship AAA program.");
  if (sku.designQuality < cap * .72) reasons.push("Team execution captured less than three quarters of this project class's potential.");
  if (spread < .35) reasons.push("The brief spread priority points too evenly instead of making a few customer promises exceptional.");
  if ((sku.testingLevel ?? "standard") === "standard") reasons.push("Standard validation controlled time and cost but left less room for a standout execution score.");
  if (!reasons.length) reasons.push("The team, focus and validation were coherent; the remaining limit is primarily the selected project class.");
  return reasons;
}

export function buildProductMarketStudy(w: World, sku: SKU): ProductMarketStudyReport {
  const cells = targetCells(w, sku);
  const totalMarket = w.cube.reduce((sum, cell) => sum + cell.head * cell.spend, 0) || 1;
  const targetMarket = cells.reduce((sum, cell) => sum + cell.head * cell.spend, 0);
  const baseTargetMarket = cells.reduce((sum, cell) => sum + cell.baseHead * cell.spend, 0) || targetMarket || 1;
  const audienceTrend = targetMarket / baseTargetMarket - 1;
  const needAverages = w.cfg.needs.map((need) => ({
    key: need.key,
    label: need.label,
    raw: weightedAverage(cells, (cell) => cell.needPref[need.key] ?? 0),
  }));
  const maxNeed = Math.max(.01, ...needAverages.map((need) => need.raw));
  const preferences = needAverages.map((need) => {
    const importance = clamp(need.raw / maxNeed);
    return {
      key: need.key,
      label: need.label,
      importance,
      recommendedStars: Math.max(1, Math.min(5, Math.round(1 + importance * 4))),
      currentStars: Math.max(1, Math.min(5, Math.round(1 + (sku.attributes[need.key] ?? 0) * 4))),
    };
  }).sort((a, b) => b.importance - a.importance);
  const qualityImportance = weightedAverage(cells, (cell) => cell.qualitySens);
  const valueImportance = clamp(weightedAverage(cells, (cell) => cell.priceSens) / 2);
  const channelRank = (Object.keys(CHANNEL_TYPES) as (keyof typeof CHANNEL_TYPES)[]).map((type) => ({
    type,
    label: CHANNEL_TYPES[type].label,
    importance: weightedAverage(cells, (cell) => cell.channelPref[type] ?? 0),
  })).sort((a, b) => b.importance - a.importance);
  const bestChannel = channelRank[0];
  const reviewScore = ensureReviewScore(sku);
  const awareness = weightedAverage(cells, (cell) => cell.awareness[sku.id] ?? 0);
  const materialCostBase = (archetypeByKey(sku.productKey)?.materials ?? []).reduce((sum, material) => sum + material.baseCostContribution, 0) || 1;
  const materialCostIndex = (archetypeByKey(sku.productKey)?.materials ?? []).reduce((sum, material) => sum + material.baseCostContribution * (w.materialPriceIndex[material.materialId] ?? 1), 0) / materialCostBase;
  const lessons: ProductMarketStudyReport["lessons"] = [];

  for (const preference of preferences.slice(0, 3)) {
    if (preference.recommendedStars <= preference.currentStars) continue;
    lessons.push({
      id: `priority:${preference.key}`,
      kind: "priority",
      title: `${preference.label} is underbuilt`,
      finding: `${sku.targetLabel ?? "The target audience"} expects roughly ${preference.recommendedStars}★ ${preference.label.toLowerCase()}, but this product brief delivered ${preference.currentStars}★.`,
      action: `On the next ${archetypeByKey(sku.productKey)?.label ?? "product"}, move priority points into ${preference.label} instead of relying on a hidden research bonus.`,
      priorityKey: preference.key,
      currentStars: preference.currentStars,
      recommendedStars: preference.recommendedStars,
    });
  }

  const licensed = preferences.find((preference) => preference.key === "licensed");
  const archetype = archetypeByKey(sku.productKey);
  if (!sku.ipId && archetype && archetype.ipPotential >= .45 && (licensed?.importance ?? 0) >= .72) {
    lessons.push({ id: "ip:add", kind: "ip", title: "IP can unlock this audience", finding: `${sku.targetLabel ?? "The target audience"} places licensed/IP appeal among its strongest purchase drivers.`, action: "License or develop a well-matched IP for the next version; an unrelated IP can still hurt fit." });
  }

  const band = archetype?.priceBand ?? [Math.max(1, sku.listPrice * .6), Math.max(2, sku.listPrice * 1.4)];
  const pricePercentile = clamp((sku.listPrice - band[0]) / Math.max(1, band[1] - band[0]));
  if (valueImportance >= .58 && pricePercentile > .48) lessons.push({ id: "price:value", kind: "price", title: "Value matters more than another refinement", finding: `This audience is price sensitive (${Math.round(valueImportance * 100)}/100) and the product sits in the upper half of its category price band.`, action: "Test a lower price, cheaper production standard, or a value-positioned V2 before spending more on quality." });
  if (!sku.channels.includes(bestChannel.type) && bestChannel.importance >= .55) lessons.push({ id: `channel:${bestChannel.type}`, kind: "channel", title: `The audience shops through ${bestChannel.label}`, finding: `Your strongest target-channel preference is ${bestChannel.label}, but this SKU is not distributed there.`, action: `Sign and assign a ${bestChannel.label} partner; this can be changed on the live SKU without redesigning it.` });
  if (audienceTrend < -.02) lessons.push({ id: "audience:declining", kind: "audience", title: "The target audience is shrinking", finding: `The selected audience's available market is ${Math.abs(Math.round(audienceTrend * 100))}% below its starting level. Even stable share can now produce declining sales.`, action: "Retarget an adjacent growing segment, widen the audience, or protect margin instead of planning for old volume." });
  if (sku.releasedToMarket && awareness < .12) lessons.push({ id: "awareness:low", kind: "awareness", title: "Too few target customers know the product", finding: `Only about ${Math.round(awareness * 100)}% of the selected audience is aware of this SKU. Product quality cannot convert customers who never encounter it.`, action: "Increase focused advertising or add a higher-reach channel before redesigning the product." });
  if (materialCostIndex > 1.06) lessons.push({ id: "margin:materials", kind: "margin", title: "Input inflation is compressing margin", finding: `The product's material basket is about ${Math.round((materialCostIndex - 1) * 100)}% above baseline. Sales can stay flat while contribution declines.`, action: "Reprice, change production economics, negotiate supply, or redesign toward less exposed inputs." });
  if ((sku.unitsLostTotal ?? 0) > Math.max(500, (sku.unitsSoldTotal ?? 0) * .08)) lessons.push({ id: "operations:stockout", kind: "operations", title: "Availability is suppressing recorded sales", finding: `${Math.round(sku.unitsLostTotal).toLocaleString()} lifetime units of demand were lost while stock was unavailable.`, action: "Increase reorder size or shorten the supply route before concluding that customer demand is weak." });
  if (reviewScore >= 4 && qualityImportance < .62 && valueImportance > qualityImportance) lessons.push({ id: "quality:overbuilt", kind: "quality", title: "The product is over-engineered for this audience", finding: `A ${reviewScore.toFixed(1)}★ review is strong, but these customers value affordability and proposition fit more than extreme quality.`, action: "Protect the successful concept, but redirect the next brief toward value, IP or the top unmet priority." });
  if (reviewScore < 3 && qualityImportance >= .58) lessons.push({ id: "quality:shortfall", kind: "quality", title: "Quality is below target expectations", finding: `The ${reviewScore.toFixed(1)}★ product review is weak for a group with high quality sensitivity.`, action: "Use the quality diagnosis below: sharpen priorities, strengthen the team, improve validation, or unlock the next project class." });
  if (targetMarket / totalMarket < .22 && reviewScore >= 4) lessons.push({ id: "margin:niche", kind: "margin", title: "Small audience, strong willingness to pay", finding: `The selected audience is only ${Math.round(targetMarket / totalMarket * 100)}% of the market, but it strongly values this ${reviewScore.toFixed(1)}★ proposition.`, action: "Pursue margin rather than volume: test premium pricing and direct/low-cut channels while monitoring conversion." });

  const topPriority = preferences[0];
  const headline = reviewScore >= 4 && valueImportance > qualityImportance
    ? `${sku.targetLabel ?? "The target"} values ${topPriority.label.toLowerCase()} and value more than extreme quality.`
    : lessons[0]?.title ?? `${sku.name} is broadly coherent with its selected audience.`;
  const summary = `Product review ${reviewScore.toFixed(1)}/5. Review quality, sales volume and margin are separate: audience size, price, channels, awareness and proposition fit still determine the commercial result.`;
  return {
    skuId: sku.id, completedTick: w.tick, targetLabel: sku.targetLabel ?? "Broad market", headline, summary,
    targetMarketShare: clamp(targetMarket / totalMarket), preferences,
    quality: { reviewScore, importance: qualityImportance, diagnosis: qualityDiagnosis(sku, reviewScore) },
    bestChannel, lessons,
  };
}
