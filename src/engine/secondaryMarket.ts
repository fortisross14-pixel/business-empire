// Generic multi-industry market runtime used by every non-primary business while the
// original primary market remains a compatibility alias. Nothing here is Toys-specific:
// ProductArchetype data supplies needs, lifecycle, seasonality, retail fit and volatility.
import type { SKU, World } from "./types";
import { INDUSTRIES, clamp, sum } from "./industries";
import { fit, effectiveTarget, needMatch, effectiveAttributes, packagingResonance, applyDriftAndShocks } from "./cube";
import { distributionMetricsForSku, partnerFitForCell } from "./distribution";
import { brandPositioningFit } from "./brands";
import { earnedSignals, equityDemandMult, getEquity, pricingPower, trustAwarenessLift, updateEquity } from "./brandEquity";
import { competitorAwareness, runCompetitorBrains } from "./competitorBrain";
import { satisfactionTarget, updateCustomers } from "./customers";
import { archetypeByKey } from "./productCatalog";
import { marketWorldView, commitMarketView } from "./markets";
import { productDemandMultiplier } from "./productDynamics";
import { ipAwarenessFloor, ipDemandMultiplier } from "./ip";
import { productMarketFitForCell } from "./productMarketFit";

export interface SecondaryMarketDemand {
  industryId: string;
  demandTickBySkuId: Record<string, number>;
  marketAnnual: number;
  avgReach: number;
  avgOnlineCoverage: number;
}

function cellMatchesSegment(cell: World["cube"][number], filter: Record<string, string[] | undefined>): boolean {
  return Object.entries(filter).every(([axis, values]) => !values || values.length === 0 || values.includes((cell.coord as any)[axis]));
}

function campaignPowerForSku(w: World, sku: SKU, cell: World["cube"][number]): number {
  let power = 0;
  for (const camp of w.activeCampaigns) {
    if (camp.daysRemaining <= 0) continue;
    const applies = camp.scope === "company" || camp.scope === sku.id || (camp.scope.startsWith("brand:") && camp.scope.slice(6) === sku.brandId);
    if (!applies) continue;
    const seg = w.savedSegments.find((s) => s.id === camp.segmentId);
    if (!seg || !cellMatchesSegment(cell, seg.filter as any)) continue;
    const dailySpend = camp.budget / Math.max(1, camp.totalDays);
    power += clamp(dailySpend / 8000, 0, 1.5) * (camp.effectivenessMult ?? 1);
  }
  return clamp(power, 0, 2);
}

export function simulateSecondaryIndustryMarket(
  world: World,
  industryId: string,
  marketingPower: number,
  brandPower: number,
): SecondaryMarketDemand {
  const cfg = INDUSTRIES[industryId];
  if (!cfg) return { industryId, demandTickBySkuId: {}, marketAnnual: 0, avgReach: 0, avgOnlineCoverage: 0 };
  const w = marketWorldView(world, industryId);
  const skus = w.player.skus;
  const demandAnnual = skus.map(() => 0);
  const dists = skus.map((s) => distributionMetricsForSku(w, s));
  const active = skus.map((sku, i) => ({ sku, dist: dists[i] })).filter((x) => x.sku.status === "active" && x.sku.releasedToMarket === true);
  const avgReach = active.length ? sum(active.map((x) => x.dist.reach)) / active.length : 0;
  const avgOnlineCoverage = active.length ? sum(active.map((x) => x.dist.onlineCoverage)) / active.length : 0;
  const refPrice = cfg.products.length ? sum(cfg.products.map((p) => (p.priceBand[0] + p.priceBand[1]) / 2)) / cfg.products.length : 30;

  // Every active business gets the same generic population drift / market shock machinery.
  applyDriftAndShocks(w);
  runCompetitorBrains(w);
  const signals = Object.fromEntries(w.brands.map((b) => [b.id, earnedSignals(w, b.id)]));

  if (w.fitCacheDirty) {
    w.fitCache = {};
    for (const sku of skus) {
      const pt = cfg.products.find((p) => p.key === sku.productKey);
      const tgt = effectiveTarget(sku.target, pt);
      const attrs = effectiveAttributes(industryId, sku.packaging, sku.attributes);
      w.fitCache[sku.id] = w.cube.map((cell) => {
        const category = cell.categoryPref[sku.productKey] ?? 0.5;
        return fit(tgt, cell, cfg)
          * needMatch(attrs, cell, cfg)
          * category
          * packagingResonance(sku.packaging, cell)
          * partnerFitForCell(w, sku, cell)
          * brandPositioningFit(w, sku.brandId, cell, sku.positioning);
      });
    }
    w.fitCacheDirty = false;
  }

  for (let ci = 0; ci < w.cube.length; ci++) {
    const cell = w.cube[ci];
    const brandFocus = 1;
    const seen = new Set<string>();
    for (const sku of skus) {
      const pair = `${sku.brandId}|${sku.productKey}`;
      if (seen.has(pair)) continue;
      seen.add(pair);
      updateEquity(w, ci, sku.brandId, sku.productKey, brandPower / Math.sqrt(Math.max(1, w.brands.length)), brandFocus, signals[sku.brandId] ?? earnedSignals(w, sku.brandId));
    }

    // Distribution + marketing build awareness in exactly the same generic way for every industry.
    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i];
      const staticFit = w.fitCache[sku.id]?.[ci] ?? 0;
      const dist = dists[i];
      const campaignPower = campaignPowerForSku(w, sku, cell);
      const visibility = clamp(dist.reach * 0.34 + dist.awarenessBoost * 0.5 + marketingPower * 0.55 + campaignPower * 0.22, 0, 1);
      const organicTarget = clamp(staticFit * visibility * trustAwarenessLift(w, ci, sku.productKey, sku.brandId), 0, 1);
      const target = Math.max(organicTarget, ipAwarenessFloor(w, sku, cell));
      const cur = cell.awareness[sku.id] ?? 0;
      cell.awareness[sku.id] = clamp(cur + (target - cur) * (0.004 + marketingPower * 0.006), 0, 1);
    }
    for (const comp of w.comps) competitorAwareness(w, comp, cell);

    const playerEff = skus.map((sku, i) => {
      if (sku.status !== "active" || sku.releasedToMarket !== true) return 0;
      const base = w.fitCache[sku.id]?.[ci] ?? 0;
      const eqPricePower = pricingPower(w, ci, sku.productKey, sku.brandId);
      const effPriceSens = cell.priceSens * (1 - eqPricePower);
      const priceTerm = 1 - clamp(sku.listPrice / Math.max(1, refPrice) - 1, -0.65, 1.1) * effPriceSens * 0.45;
      const qualityTerm = 1 - cell.qualitySens + cell.qualitySens * sku.perceivedQuality;
      const aware = (cell.awareness[sku.id] ?? 0) * (0.4 + dists[i].reach * 0.6);
      const lifecycle = archetypeByKey(sku.productKey)?.lifecycle;
      const repeatFit = lifecycle ? clamp(0.72 + lifecycle.repeatPurchase * 0.42 + 80 / Math.max(120, lifecycle.purchaseCycleDays) * 0.12, 0.72, 1.22) : 1;
      const commercialFit = productMarketFitForCell(w, sku, cell).overall;
      const commercialConversion = 0.10 + commercialFit * 0.90;
      return Math.max(0, base * priceTerm * qualityTerm * equityDemandMult(w, ci, cell, sku.productKey, sku.brandId) * aware * productDemandMultiplier(sku, world.tick) * repeatFit * ipDemandMultiplier(w, sku, cell) * commercialConversion);
    });

    const compEff = w.comps.map((comp) => {
      let e = 0;
      for (const cp of comp.products) {
        const priceTerm = 1 - clamp(cp.price / Math.max(1, refPrice) - 1, -0.65, 1.1) * cell.priceSens * 0.45;
        const q = 1 - cell.qualitySens + cell.qualitySens * cp.quality;
        e += Math.max(0, fit(cp.target, cell, cfg) * needMatch(cp.attributes, cell, cfg) * (cell.categoryPref[cp.productKey] ?? 0.55) * priceTerm * q) * (cell.awareness[cp.awarenessKey] ?? 0);
      }
      return e;
    });

    const playerAppeal = sum(playerEff);
    const denom = playerAppeal + sum(compEff) || 1;
    const acquireShare = playerAppeal / denom;
    const bestRival = compEff.length ? Math.max(...compEff) : 0;
    let trust = 0;
    let qualityValue = 0.5;
    if (playerAppeal > 0) {
      qualityValue = 0;
      for (let i = 0; i < skus.length; i++) {
        const wt = playerEff[i] / playerAppeal;
        if (wt <= 0) continue;
        const sku = skus[i];
        trust += wt * getEquity(w, ci, sku.productKey, sku.brandId).trust;
        const fair = clamp(1 - clamp(sku.listPrice / Math.max(1, refPrice) - 1, -0.5, 1.2) * cell.priceSens * 0.36, 0.1, 1.2);
        const q = 1 - cell.qualitySens + cell.qualitySens * sku.perceivedQuality;
        qualityValue += wt * clamp(q * fair, 0, 1);
      }
    }
    const sat = satisfactionTarget(playerAppeal, bestRival, trust, qualityValue);
    const annualRevenue = (playerAppeal > 0 || (w.customers[ci]?.count ?? 0) > 0)
      ? updateCustomers(w, ci, cell, acquireShare, sat, cell.spend)
      : 0;
    if (annualRevenue <= 0 || playerAppeal <= 0) continue;
    for (let i = 0; i < skus.length; i++) {
      const share = playerEff[i] / playerAppeal;
      demandAnnual[i] += annualRevenue * share / Math.max(1, skus[i].listPrice);
    }
  }

  commitMarketView(world, w);
  const demandTickBySkuId: Record<string, number> = {};
  skus.forEach((sku, i) => { demandTickBySkuId[sku.id] = demandAnnual[i] / 360; });
  const marketAnnual = sum(w.cube.map((c) => c.head * c.spend));
  return { industryId, demandTickBySkuId, marketAnnual, avgReach, avgOnlineCoverage };
}
