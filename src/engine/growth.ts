import type { World } from "./types";
import { teamEffectiveness } from "./people";
import { hasSeatedCIO } from "./research";
import { archetypeByKey, archetypesForIndustry, registeredIndustryIds, starterProductKeys } from "./productCatalog";

export type CompanyScaleId = "startup" | "emerging" | "established" | "major" | "enterprise";

export interface CompanyScale {
  id: CompanyScaleId;
  label: string;
  description: string;
  maxBrands: number;
  nextRevenue: number | null;
}

const SCALES: CompanyScale[] = [
  { id: "startup", label: "Startup", description: "Founder-led company proving its first products.", maxBrands: 1, nextRevenue: 2_000_000 },
  { id: "emerging", label: "Emerging Company", description: "A real portfolio is forming and a second brand becomes viable.", maxBrands: 2, nextRevenue: 20_000_000 },
  { id: "established", label: "Established Company", description: "Multiple brands and categories can be supported with dedicated teams.", maxBrands: 4, nextRevenue: 150_000_000 },
  { id: "major", label: "Major Corporation", description: "A scaled company with room for a broad brand architecture.", maxBrands: 8, nextRevenue: 1_000_000_000 },
  { id: "enterprise", label: "Enterprise", description: "A category-defining corporation operating at very large scale.", maxBrands: 12, nextRevenue: null },
];

export function companyScale(w: World): CompanyScale {
  const rev = w.chronicle?.lifetimeRevenue ?? 0;
  const launched = w.player.skus.filter((s) => s.launchTick > 0).length;
  if (rev >= 1_000_000_000 || launched >= 18) return SCALES[4];
  if (rev >= 150_000_000 || launched >= 12) return SCALES[3];
  if (rev >= 20_000_000 || launched >= 7) return SCALES[2];
  if (rev >= 2_000_000 || launched >= 3) return SCALES[1];
  return SCALES[0];
}

export function brandCreationCost(w: World): number {
  if (w.brands.length === 0) return 0; // founding brand is created after the first office is built
  const additional = Math.max(0, w.brands.length - 1);
  return 250_000 * Math.pow(2, additional);
}

export function canCreateBrand(w: World): { ok: boolean; reason: string; cost: number } {
  const scale = companyScale(w);
  const cost = brandCreationCost(w);
  if (w.brands.length === 0 && !w.player.operatingRooms.some((r) => r.id === "founder-office")) return { ok: false, reason: "Build your Founder Office before creating the company’s first brand.", cost };
  if (w.brands.length >= scale.maxBrands) return { ok: false, reason: `${scale.label} supports up to ${scale.maxBrands} brand${scale.maxBrands === 1 ? "" : "s"}. Grow the company before adding another.`, cost };
  if (w.brands.length > 0 && teamEffectiveness(w, "marketing") <= 0) return { ok: false, reason: "Hire and seat a Marketing specialist before launching an additional brand.", cost };
  if (w.player.cash < cost) return { ok: false, reason: `Need $${Math.round(cost).toLocaleString()} to launch a new brand.`, cost };
  return { ok: true, reason: "", cost };
}

export interface CategoryGrowthDef {
  productKey: string;
  investment: number;
  days: number;
  blurb: string;
}

export const STARTER_CATEGORIES: Record<string, string[]> = Object.fromEntries(
  registeredIndustryIds().map((industryId) => [industryId, starterProductKeys(industryId)]),
);

export const CATEGORY_GROWTH: Record<string, CategoryGrowthDef[]> = Object.fromEntries(
  registeredIndustryIds().map((industryId) => [industryId,
    archetypesForIndustry(industryId)
      .filter((p) => !p.entry.starter)
      .map((p) => ({ productKey: p.key, investment: p.entry.investment, days: p.entry.days, blurb: p.entry.blurb })),
  ]),
);

export function categoryGrowthDef(_w: World, productKey: string): CategoryGrowthDef | null {
  const p = archetypeByKey(productKey);
  if (!p || p.entry.starter) return null;
  return { productKey: p.key, investment: p.entry.investment, days: p.entry.days, blurb: p.entry.blurb };
}

export function canStartCategoryExpansion(w: World, productKey: string): { ok: boolean; reason: string; def: CategoryGrowthDef | null } {
  const archetype = archetypeByKey(productKey);
  const def = categoryGrowthDef(w, productKey);
  if (!archetype || !def) return { ok: false, reason: "This category has no expansion project.", def: null };
  const business = w.player.businesses?.[archetype.industryId];
  if (!business || business.status !== "active") return { ok: false, reason: `Enter ${archetype.industryId} before expanding this category.`, def };
  if (business.unlockedCategories.includes(productKey)) return { ok: false, reason: "Category already unlocked.", def };
  if (business.categoryExpansionProjects.some((p) => p.productKey === productKey)) return { ok: false, reason: "Expansion project already underway.", def };
  if (w.player.cash < def.investment) return { ok: false, reason: `Need $${def.investment.toLocaleString()} to fund entry.`, def };
  if (!hasSeatedCIO(w)) return { ok: false, reason: "A seated Chief Innovation Officer is required to develop a new product category.", def };
  const productRooms = w.player.operatingRooms.filter((r) => r.kind === "office" && (r.team === "product" || r.id === "founder-office"));
  if (!productRooms.length) return { ok: false, reason: "A Product office is required to enter a new category.", def };
  if (teamEffectiveness(w, "product_manager") <= 0) return { ok: false, reason: "Seat a Product Designer before developing a new product category.", def };
  return { ok: true, reason: "", def };
}

export function categoryExpansionSpeed(w: World): number {
  const product = teamEffectiveness(w, "product_manager");
  const strategy = teamEffectiveness(w, "strategy");
  const innovation = teamEffectiveness(w, "innovation");
  if (product <= 0 || innovation <= 0) return 0;
  return 0.35 + product * 0.45 + strategy * 0.20 + innovation * 0.60;
}
