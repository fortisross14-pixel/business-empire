import type { AnnualReview, ChronicleEntry, ChronicleImportance, ChronicleKind, ChronicleState, SKU, World } from "./types";
import { TICKS_PER_QUARTER, TICKS_PER_YEAR } from "./types";

const moneyCompact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e9) return `$${(a / 1e9).toFixed(a >= 10e9 ? 0 : 1)}B`;
  if (a >= 1e6) return `$${(a / 1e6).toFixed(a >= 10e6 ? 0 : 1)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(0)}k`;
  return `$${a.toFixed(0)}`;
};

export function createChronicle(company: string, industryLabel: string, startingCash: number): ChronicleState {
  const state: ChronicleState = {
    entries: [],
    annualReviews: [],
    unlockedMilestones: ["company_founded"],
    lifetimeRevenue: 0,
    lifetimeProfit: 0,
    yearAccumulator: {
      year: 1,
      revenue: 0,
      profit: 0,
      units: 0,
      startCash: startingCash,
      minCash: startingCash,
      maxCash: startingCash,
      peakShare: 0,
      startEmployees: 0,
    },
  };
  state.entries.push({
    id: "founding_0",
    tick: 0,
    year: 1,
    kind: "founding",
    importance: 3,
    title: `${company} founded`,
    text: `The company began in ${industryLabel} with ${moneyCompact(startingCash)} of starting capital and a small operating campus.`,
    icon: "🏁",
    entityType: "company",
    entityId: "player",
    tags: ["founding", "iconic"],
  });
  return state;
}

export function migrateChronicleFromLegacy(w: World): ChronicleState {
  const estimatedStartCash = w.history?.[0]?.cash ?? w.player.cash;
  const state = createChronicle(w.company, w.cfg.label, estimatedStartCash);
  const pushLegacy = (entry: Omit<ChronicleEntry, "id" | "year"> & { id?: string; year?: number }) => {
    state.entries.push({
      ...entry,
      id: entry.id ?? `legacy_${entry.kind}_${entry.tick}_${state.entries.length}`,
      year: entry.year ?? Math.floor(entry.tick / TICKS_PER_YEAR) + 1,
    });
  };

  // Rebuild durable product history from launch ticks that already existed before Chronicle.
  const launched = [...(w.player.skus ?? [])].filter((sku) => sku.launchTick > 0).sort((a, b) => a.launchTick - b.launchTick);
  launched.forEach((sku, index) => {
    state.unlockedMilestones.push(`launch_${sku.id}`);
    pushLegacy({
      tick: sku.launchTick,
      kind: "product",
      importance: index === 0 ? 3 : 2,
      title: `${sku.name} launched`,
      text: `${sku.name} entered the market${sku.assignedPmName ? ` after development led by ${sku.assignedPmName}` : ""}.`,
      icon: index === 0 ? "🚀" : "📦",
      entityType: "product",
      entityId: sku.id,
      tags: index === 0 ? ["product", "launch", "iconic", "imported"] : ["product", "launch", "imported"],
    });
  });

  // Careers already store exact historic ticks, so preserve important human moments.
  const everyone = [...(w.player.personnel ?? []), ...(w.player.formerPersonnel ?? [])];
  for (const p of everyone) {
    if (p.hiredTick > 0) pushLegacy({ tick: p.hiredTick, kind: "people", importance: p.level >= 3 ? 2 : 1, title: `${p.name} joined`, text: `${p.name} joined the company.`, icon: "👤", entityType: "person", entityId: p.id, tags: ["people", "hire", "imported"] });
    for (const e of p.careerEvents ?? []) {
      if (e.kind !== "promotion" || e.tick === p.hiredTick) continue;
      pushLegacy({ tick: e.tick, kind: "people", importance: 1, title: `${p.name} promoted`, text: e.text, icon: "⬆️", entityType: "person", entityId: p.id, tags: ["people", "promotion", "imported"] });
    }
    if ("leftTick" in p && Number((p as any).leftTick) > 0) pushLegacy({ tick: Number((p as any).leftTick), kind: "people", importance: p.level >= 3 ? 2 : 1, title: `${p.name} left the company`, text: String((p as any).leftReason ?? "Left the company."), icon: "👋", entityType: "person", entityId: p.id, tags: ["people", "departure", "imported"] });
  }
  state.entries.sort((a, b) => a.tick - b.tick || a.importance - b.importance);

  // If the old rolling history still contains a complete historical year, rebuild that annual review too.
  // (Actual daily units were not stored before v5, so imported reviews leave units at zero.)
  const completedYears = Math.floor(w.tick / TICKS_PER_YEAR);
  for (let year = 1; year <= completedYears; year++) {
    const start = (year - 1) * TICKS_PER_YEAR;
    const end = year * TICKS_PER_YEAR;
    const hist = (w.history ?? []).filter((h) => h.tick > start && h.tick <= end);
    if (hist.length < TICKS_PER_YEAR * .9) continue;
    const yearEntries = state.entries.filter((e) => e.tick > start && e.tick <= end);
    const review: AnnualReview = {
      year,
      revenue: hist.reduce((sum, h) => sum + (h.revenue ?? 0) / TICKS_PER_QUARTER, 0),
      profit: hist.reduce((sum, h) => sum + (h.profit ?? 0) / TICKS_PER_QUARTER, 0),
      units: 0,
      startCash: hist[0]?.cash ?? estimatedStartCash,
      endCash: hist.at(-1)?.cash ?? w.player.cash,
      peakShare: Math.max(0, ...hist.map((h) => h.share ?? 0)),
      yearEndShare: hist.at(-1)?.share ?? 0,
      productsLaunched: launched.filter((sku) => sku.launchTick > start && sku.launchTick <= end).map((sku) => sku.name),
      hires: everyone.filter((p) => p.hiredTick > start && p.hiredTick <= end).length,
      promotions: everyone.flatMap((p) => p.careerEvents ?? []).filter((e) => e.kind === "promotion" && e.tick > start && e.tick <= end).length,
      departures: everyone.filter((p) => "leftTick" in p && Number((p as any).leftTick) > start && Number((p as any).leftTick) <= end).length,
      endingEmployees: everyone.filter((p) => p.hiredTick <= end && (!("leftTick" in p) || Number((p as any).leftTick) > end)).length,
      headline: "",
      highlightEntryIds: yearEntries.filter((e) => e.importance >= 2).sort((a, b) => b.importance - a.importance || a.tick - b.tick).slice(0, 6).map((e) => e.id),
    };
    review.headline = annualHeadline(w, review, state.annualReviews.at(-1));
    state.annualReviews.push(review);
    state.unlockedMilestones.push(`annual_review_${year}`);
  }

  // Reconstruct the current year's revenue/profit/cash envelope from the rolling history buffer.
  const currentYear = Math.floor(w.tick / TICKS_PER_YEAR) + 1;
  const startTick = (currentYear - 1) * TICKS_PER_YEAR;
  const currentHist = (w.history ?? []).filter((h) => h.tick > startTick && h.tick <= w.tick);
  state.yearAccumulator = {
    year: currentYear,
    revenue: currentHist.reduce((sum, h) => sum + (h.revenue ?? 0) / TICKS_PER_QUARTER, 0),
    profit: currentHist.reduce((sum, h) => sum + (h.profit ?? 0) / TICKS_PER_QUARTER, 0),
    units: 0, // old history did not store actual units per day; tracking becomes exact after migration.
    startCash: currentHist[0]?.cash ?? w.player.cash,
    minCash: currentHist.length ? Math.min(...currentHist.map((h) => h.cash)) : w.player.cash,
    maxCash: currentHist.length ? Math.max(...currentHist.map((h) => h.cash)) : w.player.cash,
    peakShare: currentHist.length ? Math.max(...currentHist.map((h) => h.share ?? 0)) : 0,
    startEmployees: w.player.personnel.length,
  };
  // Conservative estimate so old long-running companies don't immediately unlock implausible lifetime records.
  state.lifetimeRevenue = Math.max(state.yearAccumulator.revenue, 0);
  state.lifetimeProfit = state.yearAccumulator.profit;
  return state;
}

export function ensureChronicle(w: World): ChronicleState {
  if (!w.chronicle) w.chronicle = createChronicle(w.company, w.cfg.label, w.player.cash);
  w.chronicle.entries = w.chronicle.entries ?? [];
  w.chronicle.annualReviews = w.chronicle.annualReviews ?? [];
  w.chronicle.unlockedMilestones = w.chronicle.unlockedMilestones ?? [];
  w.chronicle.lifetimeRevenue = w.chronicle.lifetimeRevenue ?? 0;
  w.chronicle.lifetimeProfit = w.chronicle.lifetimeProfit ?? 0;
  if (!w.chronicle.yearAccumulator) {
    const year = Math.floor(w.tick / TICKS_PER_YEAR) + 1;
    w.chronicle.yearAccumulator = { year, revenue: 0, profit: 0, units: 0, startCash: w.player.cash, minCash: w.player.cash, maxCash: w.player.cash, peakShare: w.live?.shareYear ?? 0, startEmployees: w.player.personnel.length };
  }
  return w.chronicle;
}

export function recordChronicle(w: World, data: {
  kind: ChronicleKind;
  importance?: ChronicleImportance;
  title: string;
  text: string;
  icon?: string;
  entityType?: ChronicleEntry["entityType"];
  entityId?: string;
  tags?: string[];
  metricValue?: number;
  dedupeKey?: string;
}): ChronicleEntry | null {
  const c = ensureChronicle(w);
  if (data.dedupeKey && c.unlockedMilestones.includes(data.dedupeKey)) return null;
  if (data.dedupeKey) c.unlockedMilestones.push(data.dedupeKey);
  const seq = c.entries.filter((e) => e.tick === w.tick).length;
  const entry: ChronicleEntry = {
    id: `${data.dedupeKey ?? data.kind}_${w.tick}_${seq}`,
    tick: w.tick,
    year: Math.floor(w.tick / TICKS_PER_YEAR) + 1,
    kind: data.kind,
    importance: data.importance ?? 1,
    title: data.title,
    text: data.text,
    icon: data.icon ?? "•",
    entityType: data.entityType,
    entityId: data.entityId,
    tags: data.tags,
    metricValue: data.metricValue,
  };
  c.entries.push(entry);
  return entry;
}

function milestone(w: World, key: string, importance: ChronicleImportance, title: string, text: string, icon: string, metricValue?: number) {
  return recordChronicle(w, { kind: "milestone", importance, title, text, icon, tags: importance === 3 ? ["milestone", "iconic"] : ["milestone"], metricValue, dedupeKey: key, entityType: "company", entityId: "player" });
}

function productMilestones(w: World, sku: SKU) {
  const thresholds = [
    { units: 10_000, importance: 1 as ChronicleImportance, label: "10,000", icon: "📦" },
    { units: 100_000, importance: 2 as ChronicleImportance, label: "100,000", icon: "🔥" },
    { units: 1_000_000, importance: 3 as ChronicleImportance, label: "1 million", icon: "🏆" },
    { units: 10_000_000, importance: 3 as ChronicleImportance, label: "10 million", icon: "🌍" },
  ];
  for (const t of thresholds) {
    if (sku.unitsSoldTotal >= t.units) {
      recordChronicle(w, {
        kind: "product", importance: t.importance,
        title: `${sku.name} passes ${t.label} units`,
        text: `${sku.name} reached ${t.label} lifetime units sold${sku.assignedPmName ? ` under the product lineage led by ${sku.assignedPmName}` : ""}.`,
        icon: t.icon, entityType: "product", entityId: sku.id,
        tags: t.importance === 3 ? ["product", "sales", "iconic"] : ["product", "sales"],
        metricValue: sku.unitsSoldTotal, dedupeKey: `sku_${sku.id}_units_${t.units}`,
      });
    }
  }
  const age = sku.launchTick > 0 ? w.tick - sku.launchTick : 0;
  if (sku.launchTick > 0 && age >= TICKS_PER_YEAR && sku.unitsSoldTotal < 5_000) {
    recordChronicle(w, {
      kind: "product", importance: 2,
      title: `${sku.name} fails to find a market`,
      text: `${sku.name} completed its first year with fewer than 5,000 lifetime units sold and became a commercial disappointment.`,
      icon: "📉", entityType: "product", entityId: sku.id, tags: ["product", "failure"],
      metricValue: sku.unitsSoldTotal, dedupeKey: `sku_${sku.id}_year1_failure`,
    });
  }
}

function companyMilestones(w: World) {
  const c = ensureChronicle(w);
  const revenueMarks = [
    [1_000_000, 2, "$1M"],
    [10_000_000, 2, "$10M"],
    [100_000_000, 3, "$100M"],
    [1_000_000_000, 3, "$1B"],
    [10_000_000_000, 3, "$10B"],
  ] as const;
  for (const [amount, importance, label] of revenueMarks) {
    if (c.lifetimeRevenue >= amount) milestone(w, `lifetime_revenue_${amount}`, importance, `${label} lifetime revenue`, `${w.company} passed ${label} in cumulative net revenue.`, "💰", c.lifetimeRevenue);
  }
  const share = w.live?.shareYear ?? w.live?.overallShare ?? 0;
  const shareMarks = [
    [.05, 1, "5%"],
    [.10, 2, "10%"],
    [.25, 3, "25%"],
    [.50, 3, "50%"],
  ] as const;
  for (const [value, importance, label] of shareMarks) {
    if (share >= value) milestone(w, `market_share_${Math.round(value * 100)}`, importance, `${label} market share`, `${w.company} reached ${label} trailing-year share in ${w.cfg.label}.`, "📈", share);
  }
  if (w.player.personnel.length >= 10) milestone(w, "employees_10", 1, "Team reaches 10", `${w.company} grew to 10 named managers and specialists.`, "👥", w.player.personnel.length);
  if (w.player.personnel.length >= 25) milestone(w, "employees_25", 2, "Team reaches 25", `${w.company} grew to 25 named managers and specialists.`, "🏢", w.player.personnel.length);
}

function annualHeadline(w: World, a: AnnualReview, prior?: AnnualReview): string {
  if (a.revenue <= 1 && a.units <= 1) return `A building year: ${w.company} was still preparing its commercial engine.`;
  if (prior && prior.profit < 0 && a.profit > 0) return `Turnaround: ${w.company} returned to annual profitability.`;
  if (a.profit < 0 && a.revenue > 0) return `Growth came at a cost: revenue reached ${moneyCompact(a.revenue)}, but the year ended with a loss.`;
  if (a.productsLaunched.length >= 3) return `Portfolio expansion defined the year, with ${a.productsLaunched.length} products launched.`;
  if (a.peakShare >= .25) return `${w.company} became a major force in ${w.cfg.label}, peaking at ${(a.peakShare * 100).toFixed(1)}% share.`;
  if (a.profit > 0) return `${w.company} generated ${moneyCompact(a.revenue)} revenue and ${moneyCompact(a.profit)} profit.`;
  return `${w.company} generated ${moneyCompact(a.revenue)} revenue while continuing to build the business.`;
}

function closeYear(w: World) {
  const c = ensureChronicle(w);
  const acc = c.yearAccumulator;
  const startTick = (acc.year - 1) * TICKS_PER_YEAR;
  const endTick = acc.year * TICKS_PER_YEAR;
  const entries = c.entries.filter((e) => e.tick > startTick && e.tick <= endTick);
  const productLaunches = entries.filter((e) => e.tags?.includes("launch") && e.entityType === "product");
  const peopleEvents = entries.filter((e) => e.kind === "people");
  const review: AnnualReview = {
    year: acc.year,
    revenue: acc.revenue,
    profit: acc.profit,
    units: acc.units,
    startCash: acc.startCash,
    endCash: w.player.cash,
    peakShare: acc.peakShare,
    yearEndShare: w.live?.shareYear ?? w.live?.overallShare ?? 0,
    productsLaunched: productLaunches.map((e) => e.title.replace(/ launched$/, "")),
    hires: peopleEvents.filter((e) => e.tags?.includes("hire")).length,
    promotions: peopleEvents.filter((e) => e.tags?.includes("promotion")).length,
    departures: peopleEvents.filter((e) => e.tags?.includes("departure")).length,
    endingEmployees: w.player.personnel.length,
    headline: "",
    highlightEntryIds: entries.filter((e) => e.importance >= 2).sort((a, b) => b.importance - a.importance || a.tick - b.tick).slice(0, 6).map((e) => e.id),
  };
  review.headline = annualHeadline(w, review, c.annualReviews.at(-1));
  c.annualReviews.push(review);
  recordChronicle(w, {
    kind: "annual", importance: 1,
    title: `Year ${review.year} in review`,
    text: review.headline,
    icon: "📘", entityType: "company", entityId: "player", tags: ["annual-review"],
    dedupeKey: `annual_review_${review.year}`,
  });
  if (review.profit > 0 && c.annualReviews.filter((r) => r.year < review.year).every((r) => r.profit <= 0)) {
    milestone(w, "first_profitable_year", 2, "First profitable year", `${w.company} closed its first profitable year with ${moneyCompact(review.profit)} in profit.`, "✅", review.profit);
  }
  if (review.profit > 0 && c.annualReviews.length > 1 && c.annualReviews[c.annualReviews.length - 2].profit < 0) {
    milestone(w, `turnaround_year_${review.year}`, 3, "The turnaround", `${w.company} moved from an annual loss to ${moneyCompact(review.profit)} profit in Year ${review.year}.`, "🔄", review.profit);
  }
  if (acc.minCash < 0 && review.endCash > 0) {
    milestone(w, `cash_crisis_survived_${review.year}`, 3, "Cash crisis survived", `${w.company} fell below zero cash during Year ${review.year} but recovered to finish with ${moneyCompact(review.endCash)}.`, "🛟", review.endCash);
  }
  c.yearAccumulator = {
    year: review.year + 1,
    revenue: 0,
    profit: 0,
    units: 0,
    startCash: w.player.cash,
    minCash: w.player.cash,
    maxCash: w.player.cash,
    peakShare: w.live?.shareYear ?? 0,
    startEmployees: w.player.personnel.length,
  };
  w.events.push({ tick: w.tick, kind: "chronicle", text: `📘 Year ${review.year} review is ready — ${review.headline}` });
}

/** Called once per simulation tick after P&L and share have been calculated. */
export function updateChronicleTick(w: World, actual: { netRevenueQuarterRunRate: number; profitQuarterRunRate: number; actualUnits: number }) {
  const c = ensureChronicle(w);
  const acc = c.yearAccumulator;
  // Revenue/profit in the live model are quarterly run-rates. Divide by quarter length to accumulate realized daily amounts.
  const revenueToday = actual.netRevenueQuarterRunRate / TICKS_PER_QUARTER;
  const profitToday = actual.profitQuarterRunRate / TICKS_PER_QUARTER;
  acc.revenue += revenueToday;
  acc.profit += profitToday;
  acc.units += actual.actualUnits;
  acc.minCash = Math.min(acc.minCash, w.player.cash);
  acc.maxCash = Math.max(acc.maxCash, w.player.cash);
  acc.peakShare = Math.max(acc.peakShare, w.live?.shareYear ?? w.live?.overallShare ?? 0);
  c.lifetimeRevenue += revenueToday;
  c.lifetimeProfit += profitToday;

  for (const sku of w.player.skus) productMilestones(w, sku);
  companyMilestones(w);

  if (w.tick > 0 && w.tick % TICKS_PER_YEAR === 0 && c.yearAccumulator.year <= Math.floor(w.tick / TICKS_PER_YEAR)) closeYear(w);
}

export function recordProductLaunch(w: World, sku: SKU) {
  const firstLaunch = !w.chronicle?.unlockedMilestones?.some((k) => k.startsWith("launch_"));
  recordChronicle(w, {
    kind: "product", importance: firstLaunch ? 3 : 2,
    title: `${sku.name} launched`,
    text: `${sku.name} became commercially available at $${sku.listPrice.toFixed(2)}${sku.assignedPmName ? `, following development led by ${sku.assignedPmName}` : ""}.`,
    icon: firstLaunch ? "🚀" : "📦", entityType: "product", entityId: sku.id,
    tags: firstLaunch ? ["product", "launch", "iconic"] : ["product", "launch"],
    dedupeKey: `launch_${sku.id}`,
  });
}

export function recordProductDesignComplete(w: World, sku: SKU) {
  recordChronicle(w, {
    kind: "product", importance: 1,
    title: `${sku.name} design completed`,
    text: `${sku.name} completed ${sku.designDepth} development and moved into launch preparation.`,
    icon: "🎨", entityType: "product", entityId: sku.id, tags: ["product", "development"],
    dedupeKey: `design_${sku.id}`,
  });
}

export function recordPeopleEvent(w: World, personId: string, title: string, text: string, tag: "hire" | "promotion" | "departure", importance: ChronicleImportance = 1) {
  return recordChronicle(w, {
    kind: "people", importance, title, text, icon: tag === "promotion" ? "⬆️" : tag === "departure" ? "👋" : "👤",
    entityType: "person", entityId: personId, tags: ["people", tag, ...(importance === 3 ? ["iconic"] : [])],
  });
}

export function recordBuildingEvent(w: World, room: World["player"]["operatingRooms"][number]) {
  if (room.kind !== "factory" && room.kind !== "warehouse") return null;
  const firstOfKind = !w.player.operatingRooms.some((r) => r.id !== room.id && r.kind === room.kind);
  if (!firstOfKind) return null;
  return recordChronicle(w, {
    kind: "operations", importance: room.kind === "factory" ? 2 : 1,
    title: room.kind === "factory" ? "First factory opened" : "Warehouse network expanded",
    text: `${room.name} opened with ${Math.round(room.capacity).toLocaleString()} ${room.kind === "factory" ? "units/month of production capacity" : "units of storage capacity"}.`,
    icon: room.kind === "factory" ? "🏭" : "🏬", entityType: "building", entityId: room.id, tags: ["operations", "building"],
    dedupeKey: `first_building_${room.kind}`,
  });
}

export function productLegacyTags(w: World, sku: SKU): string[] {
  const tags: string[] = [];
  const age = sku.launchTick > 0 ? w.tick - sku.launchTick : 0;
  if (sku.unitsSoldTotal >= 1_000_000) tags.push("Blockbuster");
  else if (sku.unitsSoldTotal >= 100_000) tags.push("Bestseller");
  if (sku.rarity === "legendary" && sku.fame >= .65) tags.push("Breakthrough");
  if (sku.fame >= .55 && sku.unitsSoldTotal < 100_000 && age >= 360) tags.push("Cult favorite");
  if (age >= 1800 && sku.status === "active") tags.push("Long runner");
  if (age >= 360 && sku.unitsSoldTotal < 5_000) tags.push("Commercial disappointment");
  if (!tags.length && sku.launchTick > 0) tags.push("Portfolio product");
  return tags;
}

export function chronicleRecords(w: World) {
  const reviews = w.chronicle?.annualReviews ?? [];
  const launched = w.player.skus.filter((s) => s.launchTick > 0);
  const people = [...w.player.personnel, ...(w.player.formerPersonnel ?? [])];
  const bestBy = <T,>(arr: T[], score: (x: T) => number): T | null => arr.length ? [...arr].sort((a, b) => score(b) - score(a))[0] : null;
  const topUnits = bestBy(launched, (s) => s.unitsSoldTotal);
  const topContribution = bestBy(launched, (s) => s.contributionTotal ?? 0);
  const longestProduct = bestBy(launched, (s) => w.tick - s.launchTick);
  const bestRevenueYear = bestBy(reviews, (r) => r.revenue);
  const bestProfitYear = bestBy(reviews, (r) => r.profit);
  const bestShareYear = bestBy(reviews, (r) => r.peakShare);
  const worstProfitYear = reviews.length ? [...reviews].sort((a, b) => a.profit - b.profit)[0] : null;
  const longestPerson = bestBy(people, (p) => (("leftTick" in p ? Number((p as any).leftTick) : w.tick) - p.hiredTick));
  const pmImpact = people.filter((p) => p.role === "product_manager").map((p) => ({ p, units: w.player.skus.filter((s) => (s.leadHistory ?? []).some((h) => h.personId === p.id)).reduce((a, s) => a + s.unitsSoldTotal, 0) }));
  const topPm = bestBy(pmImpact, (x) => x.units);
  return { topUnits, topContribution, longestProduct, bestRevenueYear, bestProfitYear, bestShareYear, worstProfitYear, longestPerson, topPm };
}
