import type { Competitor, IndustryConfig, IndustryMarketState, World } from "./types";
import { buildCube } from "./cube";
import { INDUSTRIES } from "./industries";

function buildCompetitors(cfg: IndustryConfig): Competitor[] {
  return cfg.competitors.map((c, i) => ({
    id: `${cfg.id}_C${i}`, name: c.name, target: c.target, quality: c.quality,
    price: c.price, basePrice: c.price, priceSens: c.priceSens, strength: c.strength,
    isComp: true, personality: c.personality ?? "balanced",
    products: [{
      target: c.target, quality: c.quality, price: c.price, basePrice: c.price,
      priceSens: c.priceSens, awarenessKey: `${cfg.id}_C${i}_p0`, attributes: { ...c.attributes },
      productKey: cfg.products[Math.min(i, Math.max(0, cfg.products.length - 1))]?.key ?? "",
    }],
    marketing: 80_000, marketingFocus: "all", cash: 1_000_000, exitedCells: [],
    actionCooldown: 0, threatMemory: {}, actionHistory: [], shareHistory: [],
  }));
}

export function createIndustryMarket(industryId: string): IndustryMarketState {
  const cfg = INDUSTRIES[industryId];
  if (!cfg) throw new Error(`Unknown industry: ${industryId}`);
  const cube = buildCube(cfg);
  const comps = buildCompetitors(cfg);
  for (const cell of cube) for (const comp of comps) {
    const first = comp.products[0];
    if (first) cell.awareness[first.awarenessKey] = comp.strength * 0.9;
  }
  return {
    industryId, cube, comps, customers: {}, brandEquity: {}, fitCache: {}, fitCacheDirty: true,
    unitsTickHistory: [], marketTickHistory: [],
  };
}

export function ensureIndustryMarket(w: World, industryId: string): IndustryMarketState {
  w.industryMarkets = w.industryMarkets ?? {};
  let market = w.industryMarkets[industryId];
  if (!market) {
    market = createIndustryMarket(industryId);
    w.industryMarkets[industryId] = market;
  }
  return market;
}

export function bindPrimaryMarketAliases(w: World) {
  const market = ensureIndustryMarket(w, w.industryId);
  w.cube = market.cube;
  w.comps = market.comps;
  w.customers = market.customers;
  w.brandEquity = market.brandEquity;
  w.fitCache = market.fitCache;
  w.fitCacheDirty = market.fitCacheDirty;
  w.unitsTickHistory = market.unitsTickHistory;
  w.marketTickHistory = market.marketTickHistory;
}

export function syncPrimaryMarketFromAliases(w: World) {
  const market = ensureIndustryMarket(w, w.industryId);
  market.cube = w.cube;
  market.comps = w.comps;
  market.customers = w.customers;
  market.brandEquity = w.brandEquity;
  market.fitCache = w.fitCache;
  market.fitCacheDirty = w.fitCacheDirty;
  market.unitsTickHistory = w.unitsTickHistory;
  market.marketTickHistory = w.marketTickHistory;
}

export function marketWorldView(w: World, industryId: string): World {
  const market = ensureIndustryMarket(w, industryId);
  const cfg = INDUSTRIES[industryId];
  return {
    ...w,
    industryId,
    cfg,
    cube: market.cube,
    comps: market.comps,
    customers: market.customers,
    brandEquity: market.brandEquity,
    fitCache: market.fitCache,
    fitCacheDirty: market.fitCacheDirty,
    unitsTickHistory: market.unitsTickHistory,
    marketTickHistory: market.marketTickHistory,
    brands: w.brands.filter((b) => b.industryId === industryId),
    player: { ...w.player, skus: w.player.skus.filter((s) => s.industryId === industryId) },
  };
}

export function commitMarketView(w: World, view: World) {
  const market = ensureIndustryMarket(w, view.industryId);
  market.cube = view.cube;
  market.comps = view.comps;
  market.customers = view.customers;
  market.brandEquity = view.brandEquity;
  market.fitCache = view.fitCache;
  market.fitCacheDirty = view.fitCacheDirty;
  market.unitsTickHistory = view.unitsTickHistory;
  market.marketTickHistory = view.marketTickHistory;
  if (view.industryId === w.industryId) bindPrimaryMarketAliases(w);
}
