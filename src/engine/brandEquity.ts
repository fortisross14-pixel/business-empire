// ============================================================================
// Brand Equity — distinct per BRAND and CATEGORY.
// A company may own a mass brand and a luxury brand without their reputations
// collapsing into one shared number. New products inherit mostly from their own
// brand/category, with only a small corporate halo across sister brands.
// ============================================================================
import type { World, Cell } from "./types";
import { TICK_RATE_SCALE } from "./types";
import { clamp, sum } from "./industries";
import { primaryBrand } from "./brands";

export type Equity = { trust: number; prestige: number; value: number; innovation: number };
const ZERO: Equity = { trust: 0, prestige: 0, value: 0, innovation: 0 };

function brandMap(w: World, brandId: string): Record<string, Record<number, Equity>> {
  if (!w.brandEquity[brandId]) w.brandEquity[brandId] = {};
  return w.brandEquity[brandId];
}

function catMap(w: World, brandId: string, cat: string): Record<number, Equity> {
  const bm = brandMap(w, brandId);
  if (!bm[cat]) bm[cat] = {};
  return bm[cat];
}

function averageEquities(items: Equity[]): Equity {
  if (!items.length) return { ...ZERO };
  const acc = items.reduce((a, e) => ({ trust: a.trust + e.trust, prestige: a.prestige + e.prestige, value: a.value + e.value, innovation: a.innovation + e.innovation }), { ...ZERO });
  return { trust: acc.trust / items.length, prestige: acc.prestige / items.length, value: acc.value / items.length, innovation: acc.innovation / items.length };
}

export function getEquity(w: World, cellIndex: number, productKey?: string, brandId?: string): Equity {
  if (brandId) {
    const bm = w.brandEquity[brandId] ?? {};
    if (productKey) return bm[productKey]?.[cellIndex] ?? ZERO;
    return averageEquities(Object.values(bm).map((m) => m[cellIndex]).filter(Boolean));
  }
  // Company-level display / customer trust: aggregate all brand-category reputations.
  const values: Equity[] = [];
  for (const bid of Object.keys(w.brandEquity)) {
    const bm = w.brandEquity[bid];
    if (productKey) {
      const e = bm[productKey]?.[cellIndex];
      if (e) values.push(e);
    } else {
      for (const cat of Object.keys(bm)) {
        const e = bm[cat]?.[cellIndex];
        if (e) values.push(e);
      }
    }
  }
  return averageEquities(values);
}

export function brandAverageEquity(w: World, productKey?: string, brandId?: string): Equity {
  let tw = 0;
  const acc: Equity = { ...ZERO };
  const brandIds = brandId ? [brandId] : Object.keys(w.brandEquity);
  for (const bid of brandIds) {
    const bm = w.brandEquity[bid] ?? {};
    const cats = productKey ? [productKey] : Object.keys(bm);
    for (const cat of cats) {
      const m = bm[cat];
      if (!m) continue;
      for (const k in m) {
        const ci = Number(k); const head = w.cube[ci]?.head ?? 0; const e = m[ci];
        tw += head;
        acc.trust += e.trust * head; acc.prestige += e.prestige * head;
        acc.value += e.value * head; acc.innovation += e.innovation * head;
      }
    }
  }
  if (tw <= 0) return { ...ZERO };
  return { trust: acc.trust / tw, prestige: acc.prestige / tw, value: acc.value / tw, innovation: acc.innovation / tw };
}

export function equityDemandMult(w: World, cellIndex: number, cell: Cell, productKey?: string, brandId?: string): number {
  const e = getEquity(w, cellIndex, productKey, brandId);
  const p = cell.equityPref;
  const prefMass = (p.trust + p.prestige + p.value + p.innovation) || 1;
  const weighted = (e.trust * p.trust + e.prestige * p.prestige + e.value * p.value + e.innovation * p.innovation) / prefMass;
  return 0.8 + weighted * 0.55;
}

export function pricingPower(w: World, cellIndex: number, productKey?: string, brandId?: string): number {
  const e = getEquity(w, cellIndex, productKey, brandId);
  return clamp(e.prestige * 0.6, 0, 0.6);
}

export function trustAwarenessLift(w: World, cellIndex: number, productKey?: string, brandId?: string): number {
  return 1 + getEquity(w, cellIndex, productKey, brandId).trust * 0.25;
}

export function updateEquity(
  w: World, cellIndex: number, brandId: string, productKey: string, brandPower: number, focusMatch: number,
  signals: { prestige: number; value: number; trust: number; innovation: number }
) {
  const m = catMap(w, brandId, productKey);
  const cur = m[cellIndex] ?? { ...ZERO };
  const drive = clamp(0.004 * TICK_RATE_SCALE * (0.4 + brandPower * focusMatch));
  const decay = 0.0012 * TICK_RATE_SCALE;
  const step = (val: number, target: number) => clamp(val + (target - val) * drive - (brandPower < 0.05 ? val * decay : 0), 0, 1);
  m[cellIndex] = {
    trust: step(cur.trust, signals.trust),
    prestige: step(cur.prestige, signals.prestige),
    value: step(cur.value, signals.value),
    innovation: step(cur.innovation, signals.innovation),
  };
}

export function earnedSignals(w: World, brandId?: string): { prestige: number; value: number; trust: number; innovation: number } {
  const skus = brandId ? w.player.skus.filter((s) => s.brandId === brandId) : w.player.skus;
  if (skus.length === 0) return { prestige: 0.2, value: 0.4, trust: 0.3, innovation: 0.3 };
  const avgPrice = sum(skus.map((s) => s.listPrice)) / skus.length;
  const avgQuality = sum(skus.map((s) => s.quality)) / skus.length;
  const avgOnline = sum(skus.map((s) => s.online)) / skus.length;
  const priceLevel = clamp((avgPrice / 45 - 0.6) / 1.2, 0, 1);
  const allCh = skus.flatMap((s) => s.channels);
  const flagshipShare = allCh.length ? allCh.filter((c) => c === "flagship").length / allCh.length : 0;
  const marketplaceShare = allCh.length ? allCh.filter((c) => c === "marketplace").length / allCh.length : 0;
  const sci = sum(skus.map((s) => (s.attributes["scientific"] ?? 0) + (s.attributes["creative"] ?? 0))) / skus.length;
  return {
    prestige: clamp(priceLevel * 0.7 + flagshipShare * 0.4 - marketplaceShare * 0.3, 0, 1),
    value: clamp((1 - priceLevel) * 0.8 + marketplaceShare * 0.2, 0, 1),
    trust: clamp(0.25 + avgQuality * 0.7, 0, 1),
    innovation: clamp(0.3 + sci * 0.4 + avgOnline * 0.3, 0, 1),
  };
}

export function launchInheritance(w: World, cellIndex: number, productKey: string, brandId?: string): number {
  const bid = brandId ?? primaryBrand(w).id;
  const catEq = getEquity(w, cellIndex, productKey, bid);
  const brandEq = getEquity(w, cellIndex, undefined, bid);
  const companyEq = getEquity(w, cellIndex);
  const strengthOf = (e: Equity) => (e.trust + e.prestige + e.innovation) / 3;
  const catStr = strengthOf(catEq);
  const brandStr = strengthOf(brandEq);
  const companyStr = strengthOf(companyEq);
  const strength = catStr > 0.01 ? catStr : brandStr > 0.01 ? brandStr * 0.45 : companyStr * 0.15;
  return clamp(strength * 0.4, 0, 0.4);
}
