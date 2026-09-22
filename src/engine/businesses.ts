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
  toys: {
    industryId: "toys", label: "Toys", investment: 12_000_000, days: 360,
    blurb: "Build a toy-design team, safety knowledge, retailer relationships and a launch pipeline before the first toy is developed.",
    starterCapabilities: { toy_design: 0.8, safety: 0.5, licensing: 0.2, toy_retail: 0.6, manufacturing: 0.5 },
  },
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
  const productTeam = w.player.operatingRooms.some(r => r.kind === "office" && r.team === "product");
  if (!productTeam) return { ok: false, reason: "A staffed product organization is required for industry entry.", def };
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
  return 0.65 + teamEffectiveness(w, "strategy") * 0.45 + teamEffectiveness(w, "product_manager") * 0.35;
}
