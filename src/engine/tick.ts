import type {
  World, Cell, SKU, Competitor, CellFinance, IncomeStatement, CashFlow, SkuResult,
} from "./types";
import { TICKS_PER_QUARTER, TICK_RATE_SCALE, TICKS_PER_MONTH, TICKS_PER_YEAR, computeProductRarity } from "./types";
import { AXES, AXIS_KEYS, axisPos, clamp, ease, sum, CHANNEL_TYPES, INDUSTRIES, MARKETING_AGENCIES } from "./industries";
import { fit, effectiveTarget, applyDriftAndShocks, needMatch, effectiveAttributes, packagingResonance } from "./cube";
import { distributionMetricsForSku, partnerFitForCell } from "./distribution";
import { productionLeadDays } from "./capacity";
import { runCompetitorBrains, competitorAwareness } from "./competitorBrain";
import { cellsInSegment } from "./segments";
import { earnedSignals, updateEquity, equityDemandMult, pricingPower, trustAwarenessLift, getEquity } from "./brandEquity";
import { brandPositioningFit } from "./brands";
import { categoryExpansionSpeed, companyScale } from "./growth";
import { completeIndustryEntry, industryEntrySpeed, refreshCorporateCapabilities, syncPrimaryBusinessLegacy } from "./businesses";
import { satisfactionTarget, updateCustomers, applyWordOfMouthSpillover, buildAdjacency } from "./customers";
import { productManagerEffectiveness, teamEffectiveness, updatePeopleQuarter, updatePeopleYear, updateTalentSearch, updatePersonnelTraining } from "./people";
import { facilityEffectMultiplier, roomFacilityType, roomSupportsProductDesign, syncDerivedDepartments } from "./infrastructure";
import { recordChronicle, recordProductDesignComplete, updateChronicleTick } from "./chronicle";
import { archetypeByKey } from "./productCatalog";
import { simulateSecondaryIndustryMarket } from "./secondaryMarket";
import { consumeInventoryLots, maybeTriggerRecall, processInventoryAgeing, productDemandMultiplier, receiveInventoryLot, updateProductMomentum } from "./productDynamics";
import { ensureIndustryMarket, syncPrimaryMarketFromAliases } from "./markets";
import { accrueIPRoyaltiesAndDynamics, expireIPContracts, ipAwarenessFloor, ipDemandMultiplier, royaltyCostQuarterly } from "./ip";
import { productMarketFitForCell, bestFitDiagnosis, partnerRecommendations } from "./productMarketFit";
import { updateResearch } from "./research";
import { difficultyConfig } from "./difficulty";

const REF_PRICE = 45;
let adjacencyCache: { size: number; adj: Record<number, number[]> } | null = null;
const cellKey = (c: { coord: { gender: string; age: string; class: string; leaning: string; geography: string; family: string } }) =>
  `${c.coord.gender}|${c.coord.age}|${c.coord.class}|${c.coord.leaning}|${c.coord.geography}|${c.coord.family}`;

function skuEffectiveTarget(w: World, sku: SKU) {
  const pt = w.cfg.products.find((p) => p.key === sku.productKey);
  return effectiveTarget(sku.target, pt);
}

import { VISION_GOALS } from "./types";

// vision bonus: ramps from 1/5 to 5/5 over 4 quarters. Product scope = 20%, industry = 10%.
function visionBonus(w: World, bonusType: "quality" | "sales" | "recognition"): number {
  const v = w.player.vision;
  if (!v || VISION_GOALS[v.goal].bonusType !== bonusType) return 0;
  const ramp = (1 + v.quartersPassed) / 5; // 0.2 → 1.0
  // is scope an industry id or a product key? If it matches an industry, lower bonus.
  const isIndustry = Object.keys(INDUSTRIES).includes(v.scope);
  const max = isIndustry ? VISION_GOALS[v.goal].bonusMaxIndustry : VISION_GOALS[v.goal].bonusMaxProduct;
  return max * ramp;
}

export function step(w: World): World {
  const cfg = w.cfg;
  const primarySkus = w.player.skus.filter((s) => s.industryId === w.industryId);
  w.tick += 1;
  expireIPContracts(w);
  updateTalentSearch(w);
  updatePersonnelTraining(w);

  applyDriftAndShocks(w);
  runCompetitorBrains(w);

  // ease player spend toward targets
  w.player.marketing = ease(w.player.marketing, w.player.marketingTarget, 0.08);
  // marketing requires marketing personnel — no team, no spend
  const marketingRooms = w.player.operatingRooms.filter(r => r.kind === "office" && r.team === "marketing");
  const seatedMarketing = new Set(marketingRooms.flatMap(r => r.assignedPersonnelIds));
  const hasMarketingTeam = w.player.personnel.some((p) => p.role === "marketing" && seatedMarketing.has(p.id));
  if (!hasMarketingTeam) { w.player.marketing = 0; w.player.brandMarketing = 0; }
  w.player.brandMarketing = ease(w.player.brandMarketing, w.player.brandMarketingTarget, 0.08);

  const contracts = w.player.contracts;
  const skuDistribution = primarySkus.map((sku) => distributionMetricsForSku(w, sku));
  const activeDistribution = primarySkus
    .map((sku, i) => ({ sku, dist: skuDistribution[i] }))
    .filter(({ sku }) => sku.status === "active" && sku.releasedToMarket === true);
  let totalReach = activeDistribution.length
    ? sum(activeDistribution.map(({ dist }) => dist.reach)) / activeDistribution.length
    : 0;
  let onlineCoverage = activeDistribution.length
    ? sum(activeDistribution.map(({ dist }) => dist.onlineCoverage)) / activeDistribution.length
    : 0;
  const marketingTeam = teamEffectiveness(w, "marketing");
  const marketingPower = clamp((w.player.marketing - 20000) / 300000, 0, 1.2) * (hasMarketingTeam ? (0.78 + marketingTeam * 0.44) : 0) * facilityEffectMultiplier(w, "marketing");
  const brandPower = clamp((w.player.brandMarketing) / 300000, 0, 1.2) * facilityEffectMultiplier(w, "brand");
  const brandSignals = Object.fromEntries(w.brands.map((b) => [b.id, earnedSignals(w, b.id)]));

  const playerTargets = primarySkus.map((s) => skuEffectiveTarget(w, s));

  // resolve marketing focus: "all", an age band, or "seg:<id>" (a saved segment)
  const focusSeg = w.player.marketingFocus.startsWith("seg:")
    ? w.savedSegments.find((s) => s.id === w.player.marketingFocus.slice(4))
    : null;
  const focusCellKeys = focusSeg ? new Set(cellsInSegment(w, focusSeg.filter).map((c) => cellKey(c))) : null;
  // concentration boost: a narrower focus (fewer cells targeted) lifts the awareness ceiling more.
  // ranges ~1 (broad, half the cube) to ~2.2 (very narrow, a handful of cells).
  const concentrationBoost = focusCellKeys
    ? clamp(1 + (1 - focusCellKeys.size / w.cube.length) * 1.5, 1, 2.4)
    : 1;

  // refresh static-fit cache if products/segments changed (cheap: only on edits, not per tick)
  if (w.fitCacheDirty) {
    w.fitCache = {};
    for (const p of primarySkus) {
      const arr = new Array(w.cube.length);
      const tgt = skuEffectiveTarget(w, p);
      const effAttrs = effectiveAttributes(cfg.id, p.packaging, p.attributes);
      for (let ci = 0; ci < w.cube.length; ci++) {
        const cell = w.cube[ci];
        const cat = cell.categoryPref[p.productKey] ?? 0.5;
        const pkg = packagingResonance(p.packaging, cell);
        const chFit = partnerFitForCell(w, p, cell);
        const brandFit = brandPositioningFit(w, p.brandId, cell, p.positioning);
        arr[ci] = fit(tgt, cell, cfg) * needMatch(effAttrs, cell, cfg) * cat * pkg * chFit * brandFit;
      }
      w.fitCache[p.id] = arr;
    }
    w.fitCacheDirty = false;
  }

  // per-cell finance accumulators
  const cellFinance: CellFinance[] = [];
  // per-sku quarterly accumulators (annual run-rate in $ and units demanded)
  const skuRevAnnual = primarySkus.map(() => 0);
  const skuUnitsAnnual = primarySkus.map(() => 0);
  // for marketing allocation by cell: track awareness-weighted exposure
  const skuCellRev: number[][] = primarySkus.map(() => []);

  // ---- corporate / industry-entry foundation ----
  refreshCorporateCapabilities(w);
  updateResearch(w);
  if (w.player.industryEntryProjects?.length) {
    const speed = industryEntrySpeed(w);
    for (const project of w.player.industryEntryProjects) project.daysLeft = Math.max(0, project.daysLeft - speed);
    const completedEntries = w.player.industryEntryProjects.filter(p => p.daysLeft <= 0);
    for (const project of completedEntries) {
      completeIndustryEntry(w, project.industryId);
      const label = INDUSTRIES[project.industryId]?.label ?? project.industryId;
      w.events.push({ tick: w.tick, kind: "strategy", text: `🌐 ${label} business entry complete — the company now has the foundation to operate in this industry.` });
      recordChronicle(w, {
        kind: "milestone", importance: 3, title: `Entered ${label}`,
        text: `${w.company} completed its organic entry program and established ${label} as a second business.`,
        icon: "🌐", entityType: "market", entityId: project.industryId, tags: ["growth", "industry", "iconic"],
        dedupeKey: `industry_entry_${project.industryId}`,
      });
    }
    if (completedEntries.length) w.player.industryEntryProjects = w.player.industryEntryProjects.filter(p => p.daysLeft > 0);
  }
  syncPrimaryBusinessLegacy(w);

  // ---- category expansion projects (all active businesses) ----
  const expansionSpeed = categoryExpansionSpeed(w);
  for (const business of Object.values(w.player.businesses ?? {})) {
    if (!business || business.status !== "active" || !business.categoryExpansionProjects.length) continue;
    for (const project of business.categoryExpansionProjects) project.daysLeft = Math.max(0, project.daysLeft - expansionSpeed);
    const completed = business.categoryExpansionProjects.filter((p) => p.daysLeft <= 0);
    for (const project of completed) {
      if (!business.unlockedCategories.includes(project.productKey)) business.unlockedCategories.push(project.productKey);
      const archetype = archetypeByKey(project.productKey);
      const label = archetype?.label ?? project.productKey;
      w.events.push({ tick: w.tick, kind: "strategy", text: `🧭 ${label} category entry complete — new products can now be developed.` });
      recordChronicle(w, {
        kind: "milestone", importance: 2, title: `Entered ${label}`,
        text: `${w.company} completed the capability build required to compete in ${label}.`,
        icon: "🧭", entityType: "market", entityId: project.productKey, tags: ["growth", "category", business.industryId],
        dedupeKey: `category_${business.industryId}_${project.productKey}`,
      });
    }
    if (completed.length) business.categoryExpansionProjects = business.categoryExpansionProjects.filter((p) => p.daysLeft > 0);
  }
  syncPrimaryBusinessLegacy(w);

  // ---- design & manufacturing timers ----
  for (const p of w.player.skus) {
    if (p.status === "designing") {
      const productIndustry = archetypeByKey(p.productKey)?.industryId;
      let pm = w.player.personnel.find(x => x.id === p.assignedPmId);
      let pmRoom = w.player.operatingRooms.find(r => roomSupportsProductDesign(r, productIndustry) && r.assignedPersonnelIds.includes(p.assignedPmId ?? ""));
      if (!pm || !pmRoom) {
        const locked = new Set(w.player.skus.filter((s) => s !== p && s.status === "designing" && s.assignedPmId).map((s) => s.assignedPmId));
        const productRooms = w.player.operatingRooms.filter((r) => roomSupportsProductDesign(r, productIndustry));
        const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
        const replacement = w.player.personnel.filter((x) => x.role === "product_manager" && seated.has(x.id) && !locked.has(x.id)).sort((a, b) => productManagerEffectiveness(b, p.productKey) - productManagerEffectiveness(a, p.productKey))[0];
        if (replacement) {
          p.leadHistory = p.leadHistory ?? [];
          const previousLead = p.leadHistory[p.leadHistory.length - 1];
          if (previousLead && previousLead.toTick == null) previousLead.toTick = w.tick;
          p.leadHistory.push({ personId: replacement.id, personName: replacement.name, fromTick: w.tick });
          p.assignedPmId = replacement.id; p.assignedPmName = replacement.name; pm = replacement;
          pmRoom = productRooms.find((r) => r.assignedPersonnelIds.includes(replacement.id));
          replacement.careerEvents.push({ tick: w.tick, kind: "milestone", text: `Took over development of ${p.name}.` });
          w.events.push({ tick: w.tick, kind: "people", text: `👤 ${replacement.name} took over ${p.name} development.` });
        }
      }
      const centerType = pmRoom ? roomFacilityType(pmRoom) : "office";
      const centerBonus = centerType === "beauty_center" || centerType === "toy_center" ? 1 + (pmRoom?.upgradeLevel ?? 1) * .10 : 1;
      const designSpeed = pmRoom && pm ? (0.75 + productManagerEffectiveness(pm, p.productKey) * 0.75) * centerBonus : 0.25;
      p.designDaysLeft = Math.max(0, p.designDaysLeft - designSpeed);
      if (p.designDaysLeft <= 0) {
        p.status = "designed";
        if (pm) pm.careerEvents.push({ tick: w.tick, kind: "milestone", text: `Completed development of ${p.name}.` });
        w.events.push({ tick: w.tick, kind: "product", text: `🎨 ${p.name} design complete — ready to manufacture.` });
        recordProductDesignComplete(w, p);
        // PM is freed (assignedPmId stays for reference but they're no longer locked)
      }
    }
    if ((p.mfgBatchSize ?? 0) > 0 && (p.mfgDaysLeft ?? 0) > 0) {
      p.mfgDaysLeft = Math.max(0, p.mfgDaysLeft - 1);
      if (p.mfgDaysLeft <= 0) {
        const landed = p.mfgBatchSize;
        const firstBatch = p.status === "manufacturing" && p.inventory <= 0 && p.releasedToMarket !== true;
        receiveInventoryLot(p, landed, w.tick, p.unitCost);
        p.mfgBatchSize = 0;
        if (p.status === "manufacturing") p.status = "active";
        w.events.push({ tick: w.tick, kind: "operations", text: firstBatch
          ? `📦 ${p.name} first batch is ready — ${Math.round(landed).toLocaleString()} units are in the warehouse. Set price, channels and launch when ready.`
          : `📦 ${p.name} replenishment landed — ${Math.round(landed).toLocaleString()} units received.` });
      }
    }
  }

  // perceived quality eases toward actual quality, but a large existing customer base ANCHORS the
  // old reputation — so raising quality on a popular product moves perception slowly (the inertia
  // Oscar described: 0.1→0.5 actual lands perception in the middle for a while). New/small products
  // adopt their true quality fast; established ones are sticky (which is also why leveraging a known
  // product can beat launching fresh — its perception, once earned, is durable).
  {
    const totalCust = (() => { let t = 0; for (const k in w.customers) t += w.customers[k].count; return t; })();
    for (const p of w.player.skus) {
      // anchoring 0..~0.85 based on how big the base is (200k customers ≈ heavily anchored)
      const anchor = clamp(totalCust / 250000, 0, 0.85);
      const baseRate = 0.02 * TICK_RATE_SCALE;       // fast when unknown
      const rate = baseRate * (1 - anchor) + 0.0015 * TICK_RATE_SCALE; // floor so it always drifts
      p.perceivedQuality = clamp(p.perceivedQuality + (p.quality - p.perceivedQuality) * rate, 0, 1);

      // novelty: decays over the product's lifetime (reaches ~0.1 at end of life)
      const age = p.launchTick > 0 ? w.tick - p.launchTick : 0;
      if (p.launchTick > 0 && p.lifetimeDays > 0) {
        p.novelty = clamp(1 - (age / p.lifetimeDays) * 0.9, 0.05, 1);
      } else {
        p.novelty = 1;
      }

      // fame: grows with sales volume + marketing exposure + satisfaction, decays slowly without
      const dailySales = p.unitsSoldTotal / Math.max(1, age);
      const salesFame = clamp(dailySales / 500, 0, 0.5); // ~500 units/day = max sales fame
      const mktgFame = clamp(marketingPower * 0.15, 0, 0.2);
      const custSat = (() => { let s = 0, n = 0; for (const k in w.customers) { s += w.customers[k].satisfaction * w.customers[k].count; n += w.customers[k].count; } return n > 0 ? s / n : 0.5; })();
      const fameTarget = clamp(salesFame + mktgFame + custSat * 0.2, 0, 1);
      p.fame = clamp(p.fame + (fameTarget - p.fame) * 0.003 * TICK_RATE_SCALE, 0, 1);

      // rarity: recalculated from current quality + design + novelty + fame + expertise
      updateProductMomentum(w, p);
      processInventoryAgeing(w, p);
      maybeTriggerRecall(w, p);
      const exp = Math.max(w.player.expertise.category[p.productKey] ?? 0, w.player.expertise.industry[p.industryId] ?? 0);
      const rarityScore = p.quality * 0.2 + p.designQuality * 0.25 + p.novelty * 0.15 + p.fame * 0.25 + exp * 0.06;
      p.rarity = computeProductRarity(rarityScore);
    }
  }

  for (let ci = 0; ci < w.cube.length; ci++) {
    const cell = w.cube[ci];
    const cellMarket = cell.head * cell.spend;

    // dormancy: if no player product has meaningful static fit here AND player has no awareness yet, skip.
    // (Competitors still hold this cell among themselves, but it doesn't affect the player's P&L.)
    let maxStatic = 0;
    for (const p of primarySkus) { const s = w.fitCache[p.id]?.[ci] ?? 0; if (s > maxStatic) maxStatic = s; }
    const isSelected = w.selectedCell &&
      cell.coord.gender === w.selectedCell.gender && cell.coord.age === w.selectedCell.age &&
      cell.coord.class === w.selectedCell.class && cell.coord.leaning === w.selectedCell.leaning &&
      cell.coord.geography === w.selectedCell.geography && cell.coord.family === w.selectedCell.family;
    const hasCustomers = (w.customers[ci]?.count ?? 0) > 1;
    if (maxStatic < 0.02 && !isSelected && !hasCustomers) continue; // dormant — no fit, no base, not selected

    // brand equity: update independently per BRAND + CATEGORY. Umbrella brand spend is diluted
    // across the portfolio; product performance then pulls each brand toward its own earned identity.
    const brandFocusMatch = focusCellKeys
      ? (focusCellKeys.has(cellKey(cell)) ? 1.2 : 0.15)
      : (w.player.marketingFocus === "all" || cell.coord.age === w.player.marketingFocus) ? 1 : 0.5;
    const seenBrandCats = new Set<string>();
    const primaryBrands = w.brands.filter((b) => b.industryId === w.industryId);
    const portfolioDilution = 1 / Math.sqrt(Math.max(1, primaryBrands.length));
    for (const p of primarySkus) {
      const pair = `${p.brandId}|${p.productKey}`;
      if (!seenBrandCats.has(pair)) {
        seenBrandCats.add(pair);
        updateEquity(w, ci, p.brandId, p.productKey, brandPower * portfolioDilution * (1 + visionBonus(w, "recognition")), brandFocusMatch, brandSignals[p.brandId] ?? earnedSignals(w, p.brandId));
      }
    }

    // update player awareness — equity effects are per brand + category
    for (let i = 0; i < primarySkus.length; i++) {
      const p = primarySkus[i];
      const fStatic = w.fitCache[p.id]?.[ci] ?? 0;
      const onlineFit = 0.5 + 0.5 * p.online;
      const focusMatch = focusCellKeys
        ? (focusCellKeys.has(cellKey(cell)) ? 1.2 : 0.15)
        : (w.player.marketingFocus === "all" || cell.coord.age === w.player.marketingFocus) ? 1 : 0.3;
      const skuDist = skuDistribution[i];
      const distPresence = skuDist.reach * 0.6 + skuDist.onlineCoverage * onlineFit * 0.4;
      const focusLift = 1 + marketingPower * (focusMatch - 1) * 0.6 * concentrationBoost;
      const eqAwareLift = trustAwarenessLift(w, ci, p.productKey, p.brandId);
      // ceiling: distribution alone gets you moderate awareness (people see it on shelves).
      // Marketing raises the ceiling further. No marketing + no distribution = zero.
      const shelfVisibility = clamp(distPresence * 0.5, 0, 0.3); // shelf presence alone -> up to 30% aware
      const mktgCeil = shelfVisibility + clamp(marketingPower * focusMatch, 0, 1) * 0.7;
      const organicPush = clamp(fStatic * (0.35 + 0.65 * distPresence) * Math.max(0.2, focusLift) * eqAwareLift * mktgCeil);
      const ipFloor = ipAwarenessFloor(w, p, cell);
      const push = Math.max(organicPush, ipFloor);
      const cur = cell.awareness[p.id] || 0;
      const speed = push >= cur
        ? clamp(0.012 * TICK_RATE_SCALE * (0.4 + marketingPower * focusMatch + 0.5 * distPresence + 0.6 * skuDist.awarenessBoost))
        : 0.010 * TICK_RATE_SCALE;
      cell.awareness[p.id] = clamp(cur + (push - cur) * speed);
    }

    // update competitor awareness (their marketing builds it, focused, with exit-decay)
    for (const comp of w.comps) competitorAwareness(w, comp, cell);

    // effective appeal. Static factor (fit×need×category) is cached; price & quality-sensitivity are live.
    const playerEff = primarySkus.map((p, i) => {
      if (p.status !== "active" || p.releasedToMarket !== true) return 0; // inventory may exist, but the product is not commercially released yet
      const fStatic = w.fitCache[p.id]?.[ci] ?? 0;
      // per-category equity effects
      const eqDemand = equityDemandMult(w, ci, cell, p.productKey, p.brandId);
      const eqPricePower = pricingPower(w, ci, p.productKey, p.brandId);
      const effPriceSens = cell.priceSens * (1 - eqPricePower);
      const priceTerm = 1 - clamp(p.listPrice / REF_PRICE - 1, -0.6, 0.9) * effPriceSens * 0.5;
      const qTerm = 1 - cell.qualitySens + cell.qualitySens * p.perceivedQuality;
      const aware = (cell.awareness[p.id] ?? 0) * (0.4 + 0.6 * skuDistribution[i].reach);
      const commercialFit = productMarketFitForCell(w, p, cell).overall;
      // Marketing can make people aware of a bad proposition, but cannot brute-force them into buying it.
      const commercialConversion = 0.10 + commercialFit * 0.90;
      return Math.max(0, fStatic * qTerm * (1 + visionBonus(w, "quality")) * priceTerm * eqDemand * (1 + visionBonus(w, "sales")))
        * aware * productDemandMultiplier(p, w.tick) * ipDemandMultiplier(w, p, cell) * commercialConversion;
    });
    // each competitor's appeal = sum over their products
    const compEff = w.comps.map((c) => {
      let e = 0;
      for (const cp of c.products) {
        const f = fit(cp.target, cell, cfg);
        const nm = needMatch(cp.attributes, cell, cfg);
        const cat = cell.categoryPref[cp.productKey ?? ""] ?? 0.6;
        const priceTerm = 1 - clamp(cp.price / REF_PRICE - 1, -0.6, 0.9) * cell.priceSens * 0.5;
        const qTerm = 1 - cell.qualitySens + cell.qualitySens * cp.quality;
        const aware = cell.awareness[cp.awarenessKey] ?? 0;
        e += Math.max(0, f * nm * cat * qTerm * priceTerm) * aware;
      }
      return e;
    });
    const denom = sum(playerEff) + sum(compEff) || 1;

    // ---- customer base: acquire → retain → repeat (the primary revenue driver) ----
    const playerAppeal = sum(playerEff);
    const acquireShare = playerAppeal / denom;          // our pull vs the whole field
    const bestRival = compEff.length ? Math.max(...compEff) : 0;
    const trust = playerAppeal > 0
      ? primarySkus.reduce((acc, p, i) => acc + (playerEff[i] / playerAppeal) * getEquity(w, ci, p.productKey, p.brandId).trust, 0)
      : getEquity(w, ci).trust;
    // absolute experience: how good our products actually are for this segment (quality + price fairness),
    // weighted by our appeal mix. A bad/overpriced product dissatisfies even with no competitor present.
    let qualityValue = 0.5;
    if (playerAppeal > 0) {
      let acc = 0;
      primarySkus.forEach((p, i) => {
        const wgt = playerEff[i] / playerAppeal;
        const qExp = 1 - cell.qualitySens + cell.qualitySens * p.perceivedQuality;       // perceived quality
        const fair = clamp(1 - clamp(p.listPrice / REF_PRICE - 1, -0.5, 1.2) * cell.priceSens * 0.4, 0.1, 1.2); // price fairness
        acc += wgt * clamp(qExp * fair, 0, 1);
      });
      qualityValue = acc;
    }
    const satTarget = satisfactionTarget(playerAppeal, bestRival, trust, qualityValue);
    // revenue this tick from our retained+growing base in this cell
    const cellGrossFromBase = (playerAppeal > 0 || (w.customers[ci]?.count ?? 0) > 0)
      ? updateCustomers(w, ci, cell, acquireShare, satTarget, cell.spend)
      : 0;

    let cellRev = 0, cellUnits = 0, cellCogs = 0;
    // attribute the cell's customer revenue across our SKUs by their relative appeal here
    primarySkus.forEach((p, i) => {
      const skuShareOfOurs = playerAppeal > 0 ? playerEff[i] / playerAppeal : (i === 0 ? 1 : 0);
      const grossRev = cellGrossFromBase * skuShareOfOurs;
      const units = grossRev / (p.listPrice || 1);
      skuRevAnnual[i] += grossRev;
      skuUnitsAnnual[i] += units;
      skuCellRev[i].push(grossRev);
      cellRev += grossRev;
      cellUnits += units;
      cellCogs += units * p.unitCost;
    });

    // record finance for this cell (net of channel cut applied later uniformly)
    if (cellRev > 0) {
      cellFinance.push({
        coord: cell.coord,
        revenue: cellRev,
        units: cellUnits,
        grossMargin: cellRev - cellCogs,
        marketingAllocated: 0, // filled after we know totals
        contribution: 0,
      });
    }

    // selected cell inspection
    if (isSelected) {
      const all = [
        ...primarySkus.map((p, i) => ({ name: p.name, isComp: false, share: playerEff[i] / denom })),
        ...w.comps.map((c, i) => ({ name: c.name, isComp: true, share: compEff[i] / denom })),
      ].filter((x) => x.share > 0.001).sort((a, b) => b.share - a.share);
      w.selectedInfo = { head: cell.head, spend: cell.spend, market: cellMarket, breakdown: all };
    }
  }

  // word-of-mouth spillover to adjacent segments (cheap: iterates only cells with customers)
  if (!adjacencyCache || adjacencyCache.size !== w.cube.length) {
    adjacencyCache = { size: w.cube.length, adj: buildAdjacency(w) };
  }
  applyWordOfMouthSpillover(w, adjacencyCache.adj);

  // ---- active campaigns: time-limited, segment-targeted awareness boosts ----
  for (const camp of w.activeCampaigns) {
    if (camp.daysRemaining <= 0) continue;
    const seg = w.savedSegments.find((s) => s.id === camp.segmentId);
    if (!seg) { camp.daysRemaining = 0; continue; }
    const campCells = cellsInSegment(w, seg.filter);
    const dailySpend = camp.budget / camp.totalDays;
    const campPower = clamp(dailySpend / 8000, 0, 1.5) * (camp.effectivenessMult ?? 1); // agency quality matters
    const agency = MARKETING_AGENCIES.find((a) => a.id === camp.agencyId);
    for (const cell of campCells) {
      let agencyFit = 1;
      if (agency) {
        for (const [axisRaw, skew] of Object.entries(agency.strengthSkew)) {
          const axis = axisRaw as keyof typeof AXES;
          const vals = AXES[axis];
          const idx = Math.max(0, vals.indexOf(cell.coord[axis]));
          const pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
          agencyFit *= clamp(1 + Number(skew) * (pos - 0.5) * 0.8, 0.7, 1.3);
        }
      }
      const campaignProducts = camp.scope === "company"
        ? primarySkus
        : camp.scope.startsWith("brand:")
          ? primarySkus.filter((p) => p.brandId === camp.scope.slice(6))
          : primarySkus.filter((p) => p.id === camp.scope);
      for (const p of campaignProducts) {
        // Campaigns may build pre-launch awareness while a product is being developed,
        // but only active products can actually convert that awareness into customers/sales.
        const fStatic = w.fitCache[p.id]?.[w.cube.indexOf(cell)] ?? 0;
        if (fStatic < 0.02) continue;
        const boost = clamp(0.006 * TICK_RATE_SCALE * campPower * agencyFit * fStatic, 0, 0.02);
        cell.awareness[p.id] = clamp((cell.awareness[p.id] ?? 0) + boost, 0, 1);
      }
    }
    w.player.cash -= dailySpend;
    camp.daysRemaining -= 1;
  }
  // completed campaigns build agency relationships
  for (const c of w.activeCampaigns) {
    if (c.daysRemaining <= 0 && c.agencyId) {
      w.agencyRelationships[c.agencyId] = (w.agencyRelationships[c.agencyId] ?? 0) + 1;
    }
  }
  w.activeCampaigns = w.activeCampaigns.filter((c) => c.daysRemaining > 0);

  // ---- fulfil demand from inventory; each SKU uses its own assigned partners ----
  let grossRevenue = 0, channelCut = 0, cogs = 0, totalUnits = 0, lostTick = 0, actualUnitsTick = 0;
  let paymentWeightedGross = 0;
  const receivableAdds: { amount: number; paymentDays: number }[] = [];
  const skuResultById: Record<string, SkuResult> = {};
  const primaryResults: SkuResult[] = primarySkus.map((sku, i) => {
    const dist = skuDistribution[i];
    const demandTick = skuUnitsAnnual[i] / (TICKS_PER_QUARTER * 4);
    const sold = Math.min(demandTick, sku.inventory);
    const lost = Math.max(0, demandTick - sold);
    consumeInventoryLots(sku, sold, w.tick);
    lostTick += lost;
    sku.unitsLostTotal = (sku.unitsLostTotal ?? 0) + lost;
    actualUnitsTick += sold;

    const unitsQ = sold * TICKS_PER_QUARTER;
    const demandUnitsQ = demandTick * TICKS_PER_QUARTER;
    const lostUnitsQ = lost * TICKS_PER_QUARTER;
    const gross = unitsQ * sku.listPrice;
    const cut = gross * dist.marginCut;
    const net = gross - cut;
    const varc = unitsQ * sku.unitCost;
    grossRevenue += gross;
    channelCut += cut;
    cogs += varc;
    totalUnits += unitsQ;
    paymentWeightedGross += gross * dist.paymentDays;
    if (net > 0) receivableAdds.push({ amount: net / TICKS_PER_QUARTER, paymentDays: dist.paymentDays });

    // lifetime accumulators use ACTUAL per-tick amounts, not annualized run-rates
    sku.unitsSoldTotal += sold;
    sku.contributionTotal += (sold * sku.listPrice * (1 - dist.marginCut)) - (sold * sku.unitCost);
    const daysCover = demandTick > 0 ? sku.inventory / demandTick : 999;
    if (lost > 0.25 && (sku.lastStockoutAlertTick == null || w.tick - sku.lastStockoutAlertTick >= 30)) {
      sku.lastStockoutAlertTick = w.tick;
      w.events.push({ tick: w.tick, kind: "stockout", text: `⚠ ${sku.name} is stocked out — demand is being lost until inventory arrives.` });
    } else if (sku.status === "active" && sku.mfgBatchSize <= 0 && demandTick > 0) {
      const planningBatch = Math.max(5_000, Math.ceil(demandTick * 60 / 1000) * 1000);
      const leadDays = productionLeadDays(w, sku, planningBatch);
      if (daysCover < leadDays + 10 && (sku.lastLowStockAlertTick == null || w.tick - sku.lastLowStockAlertTick >= 30)) {
        sku.lastLowStockAlertTick = w.tick;
        w.events.push({ tick: w.tick, kind: "inventory", text: `📉 ${sku.name} has about ${Math.max(0, Math.round(daysCover))} days of cover vs ~${leadDays} days replenishment lead time.` });
      }
    }
    const result = {
      units: unitsQ, demandUnits: demandUnitsQ, lostUnits: lostUnitsQ,
      revenue: net, gross, margin: net - varc, inventory: sku.inventory,
      daysCover, channelCutPct: dist.marginCut, paymentDays: dist.paymentDays,
    };
    skuResultById[sku.id] = result;
    return result;
  });

  // Every additional active business runs through the same generic market runtime.
  // Its demand is then fulfilled through the same inventory/distribution/finance pipeline.
  const primaryFulfilledGross = grossRevenue;
  let reachWeighted = totalReach * activeDistribution.length;
  let onlineWeighted = onlineCoverage * activeDistribution.length;
  let distributionWeight = activeDistribution.length;
  const secondaryMarketAnnual: Record<string, number> = {};
  const activeSecondaryIndustries = Object.values(w.player.businesses ?? {})
    .filter((b): b is NonNullable<typeof b> => Boolean(b && b.status === "active" && b.industryId !== w.industryId))
    .map((b) => b.industryId);
  for (const industryId of activeSecondaryIndustries) {
    const sim = simulateSecondaryIndustryMarket(w, industryId, marketingPower, brandPower);
    secondaryMarketAnnual[industryId] = sim.marketAnnual;
    const industrySkus = w.player.skus.filter((s) => s.industryId === industryId);
    const activeIndustrySkus = industrySkus.filter((s) => s.status === "active" && s.releasedToMarket === true).length;
    if (activeIndustrySkus > 0) {
      reachWeighted += sim.avgReach * activeIndustrySkus;
      onlineWeighted += sim.avgOnlineCoverage * activeIndustrySkus;
      distributionWeight += activeIndustrySkus;
    }
    for (const sku of industrySkus) {
      const dist = distributionMetricsForSku(w, sku);
      const demandTick = sim.demandTickBySkuId[sku.id] ?? 0;
      const sold = Math.min(demandTick, sku.inventory);
      const lost = Math.max(0, demandTick - sold);
      consumeInventoryLots(sku, sold, w.tick);
      lostTick += lost;
      sku.unitsLostTotal = (sku.unitsLostTotal ?? 0) + lost;
      actualUnitsTick += sold;

      const unitsQ = sold * TICKS_PER_QUARTER;
      const demandUnitsQ = demandTick * TICKS_PER_QUARTER;
      const lostUnitsQ = lost * TICKS_PER_QUARTER;
      const gross = unitsQ * sku.listPrice;
      const cut = gross * dist.marginCut;
      const net = gross - cut;
      const varc = unitsQ * sku.unitCost;
      grossRevenue += gross; channelCut += cut; cogs += varc; totalUnits += unitsQ;
      paymentWeightedGross += gross * dist.paymentDays;
      if (net > 0) receivableAdds.push({ amount: net / TICKS_PER_QUARTER, paymentDays: dist.paymentDays });
      sku.unitsSoldTotal += sold;
      sku.contributionTotal += (sold * sku.listPrice * (1 - dist.marginCut)) - (sold * sku.unitCost);
      const daysCover = demandTick > 0 ? sku.inventory / demandTick : 999;
      if (lost > 0.25 && (sku.lastStockoutAlertTick == null || w.tick - sku.lastStockoutAlertTick >= 30)) {
        sku.lastStockoutAlertTick = w.tick;
        w.events.push({ tick: w.tick, kind: "stockout", text: `⚠ ${sku.name} is stocked out — demand is being lost until inventory arrives.` });
      } else if (sku.status === "active" && sku.mfgBatchSize <= 0 && demandTick > 0) {
        const planningBatch = Math.max(5_000, Math.ceil(demandTick * 60 / 1000) * 1000);
        const leadDays = productionLeadDays(w, sku, planningBatch);
        if (daysCover < leadDays + 10 && (sku.lastLowStockAlertTick == null || w.tick - sku.lastLowStockAlertTick >= 30)) {
          sku.lastLowStockAlertTick = w.tick;
          w.events.push({ tick: w.tick, kind: "inventory", text: `📉 ${sku.name} has about ${Math.max(0, Math.round(daysCover))} days of cover vs ~${leadDays} days replenishment lead time.` });
        }
      }
      skuResultById[sku.id] = { units: unitsQ, demandUnits: demandUnitsQ, lostUnits: lostUnitsQ, revenue: net, gross, margin: net - varc, inventory: sku.inventory, daysCover, channelCutPct: dist.marginCut, paymentDays: dist.paymentDays };
    }
  }
  if (distributionWeight > 0) {
    totalReach = reachWeighted / distributionWeight;
    onlineCoverage = onlineWeighted / distributionWeight;
  }
  const skuResults: SkuResult[] = w.player.skus.map((sku) => skuResultById[sku.id] ?? ({ units: 0, demandUnits: 0, lostUnits: 0, revenue: 0, gross: 0, margin: 0, inventory: sku.inventory, daysCover: 999, channelCutPct: 0, paymentDays: 0 }));
  accrueIPRoyaltiesAndDynamics(w, skuResults);
  w.player.lostSales += lostTick;

  // Cell finance is initially demand-based so we can attribute demand by segment. When inventory
  // constrains sales, scale it back to what was actually fulfilled; otherwise analysis would report
  // revenue the company never earned during a stockout.
  const demandGross = sum(primarySkus.map((sku, i) => (skuUnitsAnnual[i] / 4) * sku.listPrice));
  const fulfillmentRatio = demandGross > 0 ? clamp(primaryFulfilledGross / demandGross, 0, 1) : 1;
  for (const cf of cellFinance) {
    cf.revenue *= fulfillmentRatio;
    cf.units *= fulfillmentRatio;
    cf.grossMargin *= fulfillmentRatio;
  }
  const totalCellRev = sum(cellFinance.map((c) => c.revenue)) || 1;
  for (const cf of cellFinance) {
    cf.marketingAllocated = w.player.marketing * (cf.revenue / totalCellRev);
    cf.contribution = cf.grossMargin - cf.marketingAllocated;
  }

  const avgMarginCut = grossRevenue > 0 ? channelCut / grossRevenue : 0;
  const avgPaymentDays = grossRevenue > 0 ? paymentWeightedGross / grossRevenue : 0;
  const netRevenue = grossRevenue - channelCut;
  const contribution = netRevenue - cogs;
  const usedPartnerIds = new Set(w.player.skus.filter((s) => s.status === "active" || s.status === "manufacturing").flatMap((s) => s.assignedPartnerIds ?? []));
  const slotting = sum(contracts.filter((c) => usedPartnerIds.has(c.partnerId)).map((c) => c.slotting ?? CHANNEL_TYPES[c.type].slotting));
  const marketing = w.player.marketing;
  const brandMarketing = w.player.brandMarketing;
  const backOffice = 0;
  // Department capability is now produced by staffed offices, so there is no separate abstract department fee.
  const deptOverhead = 0;
  // Physical operating footprint is the single source of infrastructure cost.
  const locationCost = w.player.operatingRooms.reduce((a, room) => a + room.monthlyCost * 3, 0);
  // personnel salaries (monthly, prorated to quarterly)
  const personnelCost = w.player.personnel.reduce((a, p) => a + p.salary * 3, 0);
  // Universal IP licensing: active external contracts charge a royalty on net licensed-product revenue.
  // Minimum guarantees are paid in cash at signing; player-owned IPs carry no royalty expense.
  const licensingCost = royaltyCostQuarterly(w, skuResults);
  const ebitda = contribution - marketing - brandMarketing - slotting - backOffice - deptOverhead - licensingCost - locationCost - personnelCost;
  const interest = w.player.debt * 0.10 / 4; // 10% annual, per quarter
  const profit = ebitda - interest;

  const income: IncomeStatement = {
    grossRevenue, channelCut, netRevenue, cogs, contribution,
    marketing, brandMarketing, slotting, backOffice, deptOverhead, licensingCost, locationCost, personnelCost, ebitda, interest, profit,
  };

  // ---- working capital / cash flow ----
  // Each SKU's retailer mix has its own payment terms, so receivables mature separately.
  const daysPerTick = 365 / (TICKS_PER_QUARTER * 4);
  for (const add of receivableAdds) {
    const dueInTicks = Math.max(0, Math.round(add.paymentDays / daysPerTick));
    if (add.amount > 0) w.player.receivables.push({ amount: add.amount, dueTick: w.tick + dueInTicks });
  }

  // collect matured receivables
  let collected = 0;
  w.player.receivables = w.player.receivables.filter((r) => {
    if (r.dueTick <= w.tick) { collected += r.amount; return false; }
    return true;
  });
  const receivablesOutstanding = sum(w.player.receivables.map((r) => r.amount));

  // costs paid out immediately this tick (COGS already paid when produced as inventory; here pay opex)
  const opexTick = (marketing + brandMarketing + slotting + backOffice + deptOverhead + licensingCost + locationCost + personnelCost + interest) / TICKS_PER_QUARTER;
  // cash moves by collections minus opex (COGS was paid at production time)
  w.player.cash += collected - opexTick;

  const inventoryValue = sum(w.player.skus.map((s) => s.inventory * s.unitCost));
  // Days Inventory Outstanding: inventory value / quarterly COGS * 90, bounded.
  const dio = cogs > 0 ? clamp((inventoryValue / cogs) * 90, 0, 365) : 0;
  const dso = avgPaymentDays; // Days Sales Outstanding ~ channel payment terms
  const cashCycleDays = dio + dso;

  const cashflow: CashFlow = {
    cash: w.player.cash,
    inventoryValue,
    receivables: receivablesOutstanding,
    cashCycleDays,
    operatingCashFlow: (collected - opexTick) * TICKS_PER_QUARTER,
    debt: w.player.debt,
  };

  // Difficulty pressure is financial runway + expectations, never hidden demand cheats.
  if (w.tick > 0 && w.tick % TICKS_PER_QUARTER === 0) {
    const d = difficultyConfig(w.difficulty);
    const quarter = Math.floor(w.tick / TICKS_PER_QUARTER);
    if (d.investorExpectations > 0 && quarter > d.graceQuarters) {
      const recent = w.history.at(-1);
      const fourBack = w.history[Math.max(0, w.history.length - TICKS_PER_QUARTER)] ?? recent;
      const growth = recent && fourBack && Math.abs(fourBack.revenue) > 1 ? recent.revenue / fourBack.revenue - 1 : (netRevenue > 100_000 ? .2 : 0);
      const margin = netRevenue > 1 ? ebitda / netRevenue : -1;
      const growthScore = clamp((growth + .05) / Math.max(.05, d.expectationTargetGrowth + .05), 0, 1.2);
      const marginScore = clamp((margin + .08) / Math.max(.08, d.expectationTargetMargin + .08), 0, 1.2);
      const traction = clamp((netRevenue / 500_000), 0, 1);
      const score = growthScore * .40 + marginScore * .35 + traction * .25;
      w.investorConfidence = clamp(w.investorConfidence + (score - .72) * .09 * d.investorExpectations, 0, 1);
      if (score < .42) w.expectationStrikes += 1;
      else if (score > .82) w.expectationStrikes = Math.max(0, w.expectationStrikes - 1);
      if (score < .42) w.events.push({ tick: w.tick, kind: "finance", text: `📋 Investor review: traction is below plan. Confidence ${(w.investorConfidence * 100).toFixed(0)}%.` });
      else if (score > .88) w.events.push({ tick: w.tick, kind: "finance", text: `📈 Investor review: the company is ahead of plan. Confidence ${(w.investorConfidence * 100).toFixed(0)}%.` });
    }
  }

  // ---- overall share & history ----
  const primaryMarketAnnual = sum(w.cube.map((c) => c.head * c.spend));
  const totalMarket = primaryMarketAnnual + sum(Object.values(secondaryMarketAnnual));
  const overallShare = totalMarket ? grossRevenue / totalMarket : 0;

  // rolling day/month/year share: actual units sold vs actual market units available per tick.
  // market units this tick = total category spend for the day / average price (approx via REF basket).
  const avgPrice = w.player.skus.length ? sum(w.player.skus.map((s) => s.listPrice)) / w.player.skus.length : REF_PRICE;
  const marketUnitsTick = (totalMarket / TICKS_PER_YEAR) / Math.max(1, avgPrice);
  w.unitsTickHistory.push(actualUnitsTick);
  w.marketTickHistory.push(marketUnitsTick);
  if (w.unitsTickHistory.length > TICKS_PER_YEAR) w.unitsTickHistory.shift();
  if (w.marketTickHistory.length > TICKS_PER_YEAR) w.marketTickHistory.shift();
  const windowShare = (n: number) => {
    const u = w.unitsTickHistory.slice(-n); const m = w.marketTickHistory.slice(-n);
    const us = u.reduce((a, b) => a + b, 0); const ms = m.reduce((a, b) => a + b, 0);
    return ms > 0 ? clamp(us / ms, 0, 1) : 0;
  };
  const shareMonth = windowShare(TICKS_PER_MONTH);
  const shareYear = windowShare(TICKS_PER_YEAR);

  for (const st of w.studies) {
    if (!st.done) { st.ticksLeft -= (0.70 + teamEffectiveness(w, "strategy") * 0.60) * facilityEffectMultiplier(w, "insights"); if (st.ticksLeft <= 0) { st.done = true; w.revealed[st.type] = { ...computeStudyFact(w, st.type), asOfTick: w.tick }; } }
  }

  // ---- expertise: grows with cumulative sales per category ----
  // thresholds: 0→1 at 10k units, 1→2 at 50k, 2→3 at 200k, 3→4 at 800k, 4→5 at 3M
  const EXP_THRESHOLDS = [0, 10_000, 50_000, 200_000, 800_000, 3_000_000];
  const catUnits: Record<string, number> = {};
  const industryUnits: Record<string, number> = {};
  for (const s of w.player.skus) {
    catUnits[s.productKey] = (catUnits[s.productKey] ?? 0) + s.unitsSoldTotal;
    industryUnits[s.industryId] = (industryUnits[s.industryId] ?? 0) + s.unitsSoldTotal;
  }
  for (const pk in catUnits) {
    let stars = 0;
    for (let i = 1; i < EXP_THRESHOLDS.length; i++) { if (catUnits[pk] >= EXP_THRESHOLDS[i]) stars = i; }
    w.player.expertise.category[pk] = stars;
  }
  for (const [industryId, indUnits] of Object.entries(industryUnits)) {
    let indStars = 0;
    for (let i = 1; i < EXP_THRESHOLDS.length; i++) { if (indUnits >= EXP_THRESHOLDS[i] * 2) indStars = i; }
    w.player.expertise.industry[industryId] = indStars;
  }

  // ---- people development. Recruiting slates now come only from explicit agency searches. ----
  if (w.tick % TICKS_PER_QUARTER === 0) updatePeopleQuarter(w);
  if (w.tick % TICKS_PER_YEAR === 0) { updatePeopleYear(w); syncDerivedDepartments(w); }

  // ---- vision bonus ramp: 1/5 at creation, +1/5 per quarter, max at 4 quarters ----
  if (w.player.vision) {
    const ticksSinceSet = w.tick - w.player.vision.setTick;
    w.player.vision.quartersPassed = Math.min(4, Math.floor(ticksSinceSet / TICKS_PER_QUARTER));
  }

  w.history.push({
    tick: w.tick, quarter: Math.floor(w.tick / TICKS_PER_QUARTER),
    revenue: netRevenue, profit, share: overallShare, cash: w.player.cash,
    operatingCashFlow: cashflow.operatingCashFlow,
  });
  if (w.history.length > 700) w.history.shift();

  if (w.events.length > 160) w.events.splice(0, w.events.length - 160);

  syncPrimaryMarketFromAliases(w);

  w.live = {
    income, cashflow, cellFinance, skuResults, totalUnits, overallShare,
    shareMonth, shareYear,
    totalMarket, totalReach, onlineCoverage, avgMarginCut,
  };
  updateChronicleTick(w, { netRevenueQuarterRunRate: netRevenue, profitQuarterRunRate: profit, actualUnits: actualUnitsTick });
  const scale = companyScale(w);
  if (scale.id !== "startup") {
    recordChronicle(w, {
      kind: "milestone", importance: scale.id === "enterprise" ? 3 : 2,
      title: `${scale.label} reached`,
      text: `${w.company} grew into the ${scale.label.toLowerCase()} stage, supporting a broader brand portfolio and deeper category expansion.`,
      icon: scale.id === "enterprise" ? "🌐" : "🏢", entityType: "company", entityId: "player", tags: ["growth", "scale"],
      dedupeKey: `scale_${scale.id}`,
    });
  }
  return w;
}

// studies (kept here to avoid cycles; small)
export function computeStudyFact(w: World, type: string): any {
  if (type === "market_map") return { ok: true };
  if (type === "gap_analysis") {
    const all = [
      ...w.player.skus.filter((s) => s.industryId === w.industryId).map((s) => ({ tgt: skuEffectiveTarget(w, s), attrs: s.attributes })),
      ...w.comps.flatMap((c) => c.products.map((p) => ({ tgt: p.target, attrs: p.attributes }))),
    ];
    const gaps = w.cube.map((c) => {
      const best = all.length ? Math.max(...all.map((p) => fit(p.tgt, c, w.cfg) * needMatch(p.attrs, c, w.cfg))) : 0;
      return { coord: c.coord, market: c.head * c.spend, bestFit: best, gap: c.head * c.spend * (1 - best) };
    }).sort((a, b) => b.gap - a.gap).slice(0, 6);
    return { gaps };
  }
  if (type === "competitor_benchmark") {
    return {
      rivals: w.comps.map((c) => ({ name: c.name, price: Math.round(c.price), personality: c.personality, margin: 0.55 })),
      you: w.player.skus.filter((s) => s.industryId === w.industryId).map((s) => ({ name: s.name, price: s.listPrice, unitCost: Math.round(s.unitCost * 10) / 10, margin: (s.listPrice - s.unitCost) / s.listPrice })),
    };
  }
  if (type === "product_diagnosis") {
    const diagnoses = w.player.skus.filter((s) => s.industryId === w.industryId).map((s) => {
      const result = bestFitDiagnosis(w, s);
      if (!result.best) return { sku: s.name, verdict: "weak", message: `${s.name}: insufficient market data.` };
      const { cell, diag } = result.best;
      const segLabel = `${cell.coord.age} ${cell.coord.gender}, ${cell.coord.class}, ${cell.coord.geography}, ${cell.coord.family}`;
      const recommendations = partnerRecommendations(w, s, cell).map(r => r.partner.name);
      const issueOrder = [
        { key: "channel", score: diag.channelFit, label: "Channel" },
        { key: "price", score: diag.priceFit, label: "Price" },
        { key: "ip", score: diag.ipFit, label: "IP / audience transfer" },
        { key: "brand", score: diag.brandFit, label: "Brand positioning" },
        { key: "product", score: diag.productFit, label: "Product proposition" },
      ].sort((a,b) => a.score - b.score);
      const worst = issueOrder[0];
      const verdict = diag.overall < .42 ? "weak" : diag.overall < .70 ? "mismatch" : "healthy";
      const message = verdict === "healthy"
        ? `${s.name} is commercially coherent for ${segLabel}. No major mismatch found.`
        : `${s.name} is strongest with ${segLabel}, but ${worst.label.toLowerCase()} is holding it back.`;
      return {
        sku: s.name, skuId: s.id, segLabel, verdict, message,
        overall: diag.overall, stars: diag.stars, issues: diag.issues, positives: diag.positives,
        recommendations,
      };
    });
    return { diagnoses };
  }
  if (type === "market_report") {
    const totalMarket = sum(w.cube.map((c) => c.head * c.spend));
    const baseMarket = sum(w.cube.map((c) => c.baseHead * c.spend));
    const marketGrowth = baseMarket > 0 ? (totalMarket / baseMarket - 1) : 0;
    const competitorCount = w.comps.length;
    const totalProducts = w.comps.reduce((a, c) => a + c.products.length, 0);
    // concentration: compute share for player + each competitor, sort, find top-3 and how many cover 60%
    const shares: { name: string; share: number }[] = [];
    const playerRev = w.live?.income.grossRevenue ?? 0;
    const playerShare = totalMarket > 0 ? playerRev / totalMarket : 0;
    shares.push({ name: w.company, share: playerShare });
    // estimate competitor revenue from their awareness × strength (rough proxy)
    for (const c of w.comps) {
      const compRev = c.strength * (totalMarket / (w.comps.length + 1));
      shares.push({ name: c.name, share: totalMarket > 0 ? compRev / totalMarket : 0 });
    }
    shares.sort((a, b) => b.share - a.share);
    const top3 = shares.slice(0, 3);
    const top3Share = sum(top3.map((s) => s.share));
    let cover60 = 0, accum = 0;
    for (const s of shares) { accum += s.share; cover60++; if (accum >= 0.6) break; }
    const direction = marketGrowth > 0.02 ? "growing" : marketGrowth < -0.02 ? "declining" : "stable";
    return {
      totalMarket, marketGrowth, direction,
      competitorCount, totalProducts,
      top3: top3.map((s) => ({ name: s.name, share: s.share })),
      top3Share, cover60,
      summary: `The ${w.cfg.label} market is ${direction} (${(marketGrowth * 100).toFixed(1)}% vs base). ${competitorCount} competitors field ${totalProducts} products total. The top 3 players control ${(top3Share * 100).toFixed(0)}% of the market, and it takes ${cover60} player${cover60 > 1 ? "s" : ""} to cover 60%.`,
    };
  }
  return {};
}
