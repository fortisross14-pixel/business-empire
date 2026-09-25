import type { InventoryLot, ProductTestingLevel, SKU, World } from "./types";
import { clamp } from "./industries";
import { archetypeByKey, type ProductArchetype } from "./productCatalog";

export const TESTING_LEVELS: Record<ProductTestingLevel, { label: string; safety: number; timeMult: number; costMult: number; desc: string }> = {
  standard: { label: "Standard", safety: 0.68, timeMult: 1.0, costMult: 1.0, desc: "Meets normal category requirements with limited extra validation." },
  enhanced: { label: "Enhanced", safety: 0.84, timeMult: 1.12, costMult: 1.035, desc: "More validation and play/use testing. Lower recall risk." },
  rigorous: { label: "Rigorous", safety: 0.96, timeMult: 1.28, costMult: 1.08, desc: "Extensive validation for safety-sensitive or premium products." },
};

export function testingRequired(productKey: string): boolean {
  const p = archetypeByKey(productKey);
  if (!p) return false;
  return p.regulation !== "standard" || p.modules.some((m) => m.includes("safety"));
}

export function testingLevelForSku(sku: SKU): ProductTestingLevel {
  return sku.testingLevel ?? "standard";
}

export function deriveSafetyScore(productKey: string, testingLevel: ProductTestingLevel, designQuality: number, manufacturingQuality: number): number {
  const p = archetypeByKey(productKey);
  if (!p || p.regulation === "standard") return 0.98;
  const test = TESTING_LEVELS[testingLevel].safety;
  const complexityPenalty = clamp((p.manufacturingFamilies.length - 1) * 0.035 + (p.modules.includes("technology") ? 0.07 : 0), 0, 0.18);
  return clamp(test * 0.58 + designQuality * 0.2 + manufacturingQuality * 0.22 - complexityPenalty, 0.35, 0.995);
}

export function seasonalityMultiplier(profile: ProductArchetype["lifecycle"]["seasonality"], tick: number): number {
  const d = ((tick % 360) + 360) % 360;
  if (profile === "flat") return 1;
  if (profile === "summer") {
    // northern-hemisphere style annual cycle: strongest around mid-year.
    const wave = Math.cos(((d - 180) / 360) * Math.PI * 2);
    return clamp(1 + wave * 0.42, 0.62, 1.42);
  }
  if (profile === "winter") {
    const wave = Math.cos((d / 360) * Math.PI * 2);
    return clamp(1 + wave * 0.38, 0.65, 1.38);
  }
  if (profile === "christmas") {
    if (d >= 300 && d < 345) return 1.35 + ((d - 300) / 45) * 0.9;
    if (d >= 345) return 2.25 - ((d - 345) / 15) * 0.35;
    if (d < 35) return 0.62 + (d / 35) * 0.18;
    if (d >= 250) return 1 + ((d - 250) / 50) * 0.35;
    return 0.88;
  }
  if (profile === "back_to_school") {
    const dist = Math.abs(d - 235);
    return clamp(1.7 - dist / 95, 0.72, 1.7);
  }
  if (profile === "fashion") {
    const spring = Math.exp(-Math.pow((d - 105) / 40, 2));
    const fall = Math.exp(-Math.pow((d - 285) / 42, 2));
    return clamp(0.72 + spring * 0.7 + fall * 0.9, 0.7, 1.65);
  }
  return 1;
}

export function productDemandMultiplier(sku: SKU, tick: number): number {
  const p = archetypeByKey(sku.productKey);
  if (!p) return 1;
  const seasonal = seasonalityMultiplier(p.lifecycle.seasonality, tick);
  const momentum = clamp(sku.marketMomentum ?? 1, 0.35, 3);
  const inventoryAge = inventoryFreshnessMultiplier(sku, tick, p);
  return seasonal * momentum * inventoryAge;
}

export function updateProductMomentum(w: World, sku: SKU) {
  const p = archetypeByKey(sku.productKey);
  if (!p || sku.status !== "active" || sku.releasedToMarket !== true) return;
  if (w.tick % 30 !== 0) return;
  const volatility = p.lifecycle.hitVolatility;
  const age = Math.max(1, w.tick - Math.max(1, sku.launchTick));
  const velocity = sku.unitsSoldTotal / age;
  const qualitySignal = sku.designQuality * 0.26 + sku.perceivedQuality * 0.22 + sku.fame * 0.24;
  const velocitySignal = clamp(Math.log10(1 + velocity) / 3.2, 0, 0.34);
  // High-volatility products can meaningfully break out or fade. Low-volatility products stay close to 1x.
  const noise = (Math.random() - 0.5) * 2 * volatility * 0.58;
  const ceiling = 1.08 + volatility * 2.0;
  const floor = Math.max(0.42, 0.88 - volatility * 0.42);
  const target = clamp(0.66 + qualitySignal + velocitySignal + noise, floor, ceiling);
  const current = sku.marketMomentum ?? 1;
  sku.marketMomentum = clamp(current + (target - current) * (0.18 + volatility * 0.22), floor, ceiling);
  sku.peakMomentum = Math.max(sku.peakMomentum ?? 1, sku.marketMomentum);

  const nowBreakout = sku.marketMomentum >= 1.65 && volatility >= 0.45;
  if (nowBreakout && !sku.breakout && (sku.lastMomentumEventTick == null || w.tick - sku.lastMomentumEventTick > 180)) {
    sku.breakout = true;
    sku.lastMomentumEventTick = w.tick;
    w.events.push({ tick: w.tick, kind: "market", text: `🔥 ${sku.name} is breaking out — demand momentum has accelerated sharply.` });
  } else if (sku.breakout && sku.marketMomentum < 1.18) {
    sku.breakout = false;
    if (sku.lastMomentumEventTick == null || w.tick - sku.lastMomentumEventTick > 180) {
      sku.lastMomentumEventTick = w.tick;
      w.events.push({ tick: w.tick, kind: "market", text: `📉 ${sku.name}'s breakout momentum has cooled.` });
    }
  }
}

export function ensureInventoryLots(sku: SKU, tick: number) {
  if (!sku.inventoryLots) sku.inventoryLots = [];
  const tracked = sku.inventoryLots.reduce((a, lot) => a + lot.units, 0);
  const gap = Math.max(0, sku.inventory - tracked);
  if (gap > 0.001) sku.inventoryLots.push({ id: `legacy_${sku.id}_${tick}`, units: gap, receivedTick: tick, unitCost: sku.unitCost });
}

export function receiveInventoryLot(sku: SKU, units: number, tick: number, unitCost = sku.unitCost) {
  if (units <= 0) return;
  sku.inventoryLots = sku.inventoryLots ?? [];
  sku.inventoryLots.push({ id: `lot_${sku.id}_${tick}_${sku.inventoryLots.length}`, units, receivedTick: tick, unitCost });
  sku.inventory = sku.inventoryLots.reduce((a, lot) => a + lot.units, 0);
}

export function consumeInventoryLots(sku: SKU, units: number, tick: number): number {
  ensureInventoryLots(sku, tick);
  let left = Math.max(0, units);
  const lots = sku.inventoryLots!;
  lots.sort((a, b) => a.receivedTick - b.receivedTick);
  for (const lot of lots) {
    if (left <= 0) break;
    const take = Math.min(left, lot.units);
    lot.units -= take;
    left -= take;
  }
  sku.inventoryLots = lots.filter((lot) => lot.units > 0.001);
  sku.inventory = sku.inventoryLots.reduce((a, lot) => a + lot.units, 0);
  return units - left;
}

function lotFreshness(lot: InventoryLot, tick: number, p: ProductArchetype): number {
  const age = Math.max(0, tick - lot.receivedTick);
  if (p.lifecycle.shelfLifeDays != null) {
    const ratio = age / Math.max(1, p.lifecycle.shelfLifeDays);
    if (ratio >= 1) return 0;
    if (ratio <= 0.65) return 1;
    return clamp(1 - (ratio - 0.65) * 1.5, 0.48, 1);
  }
  // Non-perishables can still become commercially stale because the archetype itself is trend/tech sensitive.
  const commercialWindow = Math.max(180, p.lifecycle.lifetimeDays * (0.32 + (1 - p.lifecycle.obsolescence) * 0.35));
  const ratio = age / commercialWindow;
  if (ratio <= 0.55) return 1;
  return clamp(1 - (ratio - 0.55) * p.lifecycle.obsolescence * 0.85, 0.55, 1);
}

export function inventoryFreshnessMultiplier(sku: SKU, tick: number, p = archetypeByKey(sku.productKey)): number {
  if (!p || !sku.inventoryLots?.length) return 1;
  let units = 0, weighted = 0;
  for (const lot of sku.inventoryLots) {
    units += lot.units;
    weighted += lot.units * lotFreshness(lot, tick, p);
  }
  return units > 0 ? clamp(weighted / units, 0.35, 1) : 1;
}

export function inventoryAgeStatus(sku: SKU, tick: number): { label: string; freshness: number; riskUnits: number } {
  const p = archetypeByKey(sku.productKey);
  const freshness = inventoryFreshnessMultiplier(sku, tick, p);
  let riskUnits = 0;
  if (p && sku.inventoryLots?.length) {
    for (const lot of sku.inventoryLots) if (lotFreshness(lot, tick, p) < 0.75) riskUnits += lot.units;
  }
  const label = freshness > 0.92 ? "Fresh" : freshness > 0.78 ? "Normal" : freshness > 0.58 ? "Aging" : "Clearance risk";
  return { label, freshness, riskUnits };
}

export function processInventoryAgeing(w: World, sku: SKU) {
  const p = archetypeByKey(sku.productKey);
  if (!p) return;
  ensureInventoryLots(sku, w.tick);
  let expired = 0;
  if (p.lifecycle.shelfLifeDays != null && sku.inventoryLots?.length) {
    for (const lot of sku.inventoryLots) {
      if (w.tick - lot.receivedTick >= p.lifecycle.shelfLifeDays) expired += lot.units;
    }
    if (expired > 0) {
      sku.inventoryLots = sku.inventoryLots.filter((lot) => w.tick - lot.receivedTick < p.lifecycle.shelfLifeDays!);
      sku.inventory = sku.inventoryLots.reduce((a, lot) => a + lot.units, 0);
      const writeOff = expired * sku.unitCost;
      w.player.cash -= writeOff * 0.08; // disposal / handling; production cost was already paid.
      w.events.push({ tick: w.tick, kind: "inventory", text: `🗑 ${sku.name}: ${Math.round(expired).toLocaleString()} units expired and were written off.` });
    }
  }
  const status = inventoryAgeStatus(sku, w.tick);
  if (status.riskUnits > 1000 && status.freshness < 0.72 && (sku.lastInventoryAgeAlertTick == null || w.tick - sku.lastInventoryAgeAlertTick >= 90)) {
    sku.lastInventoryAgeAlertTick = w.tick;
    w.events.push({ tick: w.tick, kind: "inventory", text: `🏷 ${sku.name} has ${Math.round(status.riskUnits).toLocaleString()} aging units — discounting or faster sell-through may be needed.` });
  }
}

export function maybeTriggerRecall(w: World, sku: SKU) {
  const p = archetypeByKey(sku.productKey);
  if (!p || p.regulation === "standard" || sku.status !== "active" || sku.releasedToMarket !== true || sku.inventory <= 0 || w.tick % 30 !== 0) return;
  const safety = clamp(sku.safetyScore ?? 0.75, 0.2, 0.999);
  const baseMonthly = p.regulation === "food_safety" ? 0.010 : p.regulation === "electronics_safety" ? 0.008 : p.regulation === "child_safety" ? 0.007 : 0.0035;
  const complexity = 1 + Math.max(0, p.manufacturingFamilies.length - 1) * 0.18 + (p.modules.includes("technology") ? 0.3 : 0);
  const risk = baseMonthly * complexity * Math.pow((1 - safety) / 0.25, 2);
  if (Math.random() >= risk) return;
  const severity = clamp(0.35 + Math.random() * 0.45, 0.3, 0.85);
  const recalled = sku.inventory * severity;
  consumeInventoryLots(sku, recalled, w.tick);
  const directCost = recalled * (sku.unitCost + sku.listPrice * 0.08);
  w.player.cash -= directCost;
  sku.recallCount = (sku.recallCount ?? 0) + 1;
  sku.fame = clamp(sku.fame - 0.18, 0, 1);
  sku.marketMomentum = clamp((sku.marketMomentum ?? 1) * 0.55, 0.35, 3);
  w.events.push({ tick: w.tick, kind: "product", text: `🚨 ${sku.name} recall — ${Math.round(recalled).toLocaleString()} units removed after a safety issue. Direct cost ${Math.round(directCost).toLocaleString()}.` });
}

export function applyFacetSelections(productKey: string, baseTarget: SKU["target"], baseAttributes: Record<string, number>, selections: Record<string, string> | undefined) {
  const p = archetypeByKey(productKey);
  if (!p?.designFacets?.length) return { target: baseTarget, attributes: baseAttributes };
  const target = { ...baseTarget };
  const attributes = { ...baseAttributes };
  for (const facet of p.designFacets) {
    const chosenId = selections?.[facet.id] ?? facet.defaultOptionId;
    const option = facet.options.find((x) => x.id === chosenId) ?? facet.options[0];
    if (!option) continue;
    for (const [axis, lean] of Object.entries(option.consumerLean ?? {})) {
      const key = axis as keyof typeof target;
      target[key] = clamp(target[key] * 0.7 + Number(lean) * 0.3, 0, 1);
    }
    for (const [attr, bias] of Object.entries(option.attributeBias ?? {})) attributes[attr] = clamp((attributes[attr] ?? 0) + Number(bias), 0, 1);
  }
  return { target, attributes };
}
