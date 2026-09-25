import type { CorporateCapabilities, IndustryBusiness, World } from "./types";
import { INDUSTRIES } from "./industries";
import { STARTER_CATEGORIES, companyScale } from "./growth";
import { teamEffectiveness } from "./people";
import { ensureIndustryMarket } from "./markets";

export interface IndustryEntryDef {
  industryId: string;
  label: string;
  investment: number;
  days: number;
  blurb: string;
  starterCapabilities: Record<string, number>;
}

export const INDUSTRY_ENTRY_DEFS: Record<string, IndustryEntryDef> = {
  skincare: {
    industryId:"skincare",label:"Skincare",investment:5_000_000,days:240,
    blurb:"Build formulation, claims and beauty-retail capability before developing the first range.",
    starterCapabilities:{formulation:.8,claims:.45,beauty_retail:.55,manufacturing:.45},
  },
  toys: {
    industryId: "toys", label: "Toys", investment: 5_500_000, days: 250,
    blurb: "Build a toy-design team, safety knowledge, retailer relationships and a launch pipeline before the first toy is developed.",
    starterCapabilities: { toy_design: 0.8, safety: 0.5, licensing: 0.2, toy_retail: 0.6, manufacturing: 0.5 },
  },
  food:{industryId:"food",label:"Packaged Food",investment:4_000_000,days:210,blurb:"Establish food-safety, sensory testing, grocery retail and co-manufacturing capability.",starterCapabilities:{food_design:.75,taste_testing:.55,food_safety:.65,grocery_retail:.55,manufacturing:.45}},
  apparel:{industryId:"apparel",label:"Apparel",investment:4_500_000,days:220,blurb:"Build fashion design, textile sourcing and seasonal merchandising capability.",starterCapabilities:{fashion_design:.75,textiles:.55,merchandising:.65,apparel_retail:.5,manufacturing:.4}},
  electronics:{industryId:"electronics",label:"Consumer Electronics",investment:8_000_000,days:300,blurb:"Establish hardware engineering, reliability testing and electronics-channel capability.",starterCapabilities:{industrial_design:.6,electronics:.75,reliability_testing:.55,technology_retail:.5,manufacturing:.4}},
};

export function primaryBusiness(w: World): IndustryBusiness {
  const business = w.player.businesses[w.industryId];
  if (!business) throw new Error(`Missing primary business: ${w.industryId}`);
  return business;
}

export function syncPrimaryBusinessLegacy(w: World) {
  const b = primaryBusiness(w);
  if (!b) return;
  // v0.80 screens still read these aliases. During 8A they remain a compatibility bridge.
  w.player.unlockedCategories = b.unlockedCategories;
  w.player.categoryExpansionProjects = b.categoryExpansionProjects;
}

export function corporateCapabilities(w: World): CorporateCapabilities {
  const scale = companyScale(w);
  const scaleBonus = scale.id === "enterprise" ? 1.2 : scale.id === "major" ? 0.9 : scale.id === "established" ? 0.6 : scale.id === "emerging" ? 0.3 : 0;
  const retail = Math.min(5, 0.4 + w.player.contracts.length * 0.45 + Math.min(1.5, (w.chronicle.lifetimeRevenue || 0) / 100_000_000));
  return {
    finance: Math.min(5, teamEffectiveness(w, "finance") * 4 + scaleBonus),
    strategy: Math.min(5, teamEffectiveness(w, "strategy") * 4 + scaleBonus),
    marketing: Math.min(5, teamEffectiveness(w, "marketing") * 4 + scaleBonus),
    operations: Math.min(5, teamEffectiveness(w, "operations") * 4 + scaleBonus),
    retail,
    people: Math.min(5, Math.sqrt(Math.max(0, w.player.personnel.length)) + scaleBonus),
  };
}

export function refreshCorporateCapabilities(w: World) {
  w.player.corporateCapabilities = corporateCapabilities(w);
}

export function canStartIndustryEntry(w: World, industryId: string): { ok: boolean; reason: string; def: IndustryEntryDef | null } {
  const def = INDUSTRY_ENTRY_DEFS[industryId] ?? null;
  if (!def || !INDUSTRIES[industryId]) return { ok: false, reason: "This industry is not ready for entry yet.", def };
  if (w.player.businesses[industryId]?.status === "active") return { ok: false, reason: `${def.label} is already an active business.`, def };
  if (w.player.industryEntryProjects.some(p => p.industryId === industryId)) return { ok: false, reason: `${def.label} entry is already underway.`, def };
  const scale = companyScale(w);
  if (scale.id === "startup") return { ok: false, reason: "Grow beyond Startup stage before entering a second industry.", def };
  if (w.player.cash < def.investment) return { ok: false, reason: `Need $${def.investment.toLocaleString()} to fund organic entry.`, def };
  const productTeam = teamEffectiveness(w, "product_manager") > 0;
  if (!productTeam) return { ok: false, reason: "A staffed Product organization is required for industry entry.", def };
  if (teamEffectiveness(w, "strategy") <= 0) return { ok: false, reason: "A seated Strategy specialist is required before entering a second industry.", def };
  return { ok: true, reason: "", def };
}

export function completeIndustryEntry(w: World, industryId: string) {
  const def = INDUSTRY_ENTRY_DEFS[industryId];
  const cfg = INDUSTRIES[industryId];
  if (!def || !cfg) return;
  w.player.businesses[industryId] = {
    industryId, status: "active", enteredTick: w.tick,
    unlockedCategories: [...(STARTER_CATEGORIES[industryId] ?? cfg.products.slice(0, 2).map(p => p.key))],
    categoryExpansionProjects: [], capabilities: { ...def.starterCapabilities },
  };
  ensureIndustryMarket(w, industryId);
}

export function industryEntrySpeed(w: World): number {
  const strategy = teamEffectiveness(w, "strategy");
  const product = teamEffectiveness(w, "product_manager");
  if (strategy <= 0 || product <= 0) return 0;
  return 0.55 + strategy * 0.45 + product * 0.35;
}
