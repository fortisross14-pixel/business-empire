import type { AxisKey, ProductType } from "./types";

export type VolatilityBand = "low" | "medium" | "high" | "very_high";
export type StorageProfileId = "standard" | "climate" | "refrigerated" | "frozen" | "secure";
export type RegulationProfileId = "standard" | "cosmetic" | "child_safety" | "food_safety";
export type SeasonalityProfileId = "flat" | "summer" | "winter" | "christmas" | "back_to_school" | "fashion";
export type TrendProfile = "evergreen" | "moderate" | "trend_driven" | "fad_driven";

export interface MaterialDef {
  id: string;
  label: string;
  volatility: VolatilityBand;
  notes: string;
}

export interface ManufacturingFamilyDef {
  id: string;
  label: string;
  notes: string;
}

export interface StorageProfileDef {
  id: StorageProfileId;
  label: string;
  infrastructureLabel: string;
  notes: string;
}

export interface ProductMaterialRequirement {
  materialId: string;
  // Baseline dollar contribution to one unit of finished product before quality multipliers.
  // This deliberately represents a simplified commercial BOM, not literal grams/litres.
  baseCostContribution: number;
  qualityImportance: number; // 0..1: how much better grades of this input affect perceived quality
}

export interface ProductLifecycleProfile {
  lifetimeDays: number;
  repeatPurchase: number;       // 0..1
  purchaseCycleDays: number;    // rough natural repurchase interval
  shelfLifeDays: number | null; // null = no physical expiry in the current model
  trend: TrendProfile;
  hitVolatility: number;        // 0..1
  seasonality: SeasonalityProfileId;
  obsolescence: number;         // 0..1; trend/technology ageing hook
}

export interface ProductEntryProfile {
  starter: boolean;
  investment: number;
  days: number;
  blurb: string;
}

export interface ProductFacetOption {
  id: string;
  label: string;
  blurb?: string;
  consumerLean?: Partial<Record<AxisKey, number>>;
  attributeBias?: Record<string, number>;
}

export interface ProductFacetDef {
  id: string;
  label: string;
  options: ProductFacetOption[];
  defaultOptionId: string;
}

export interface ProductArchetype {
  key: string;
  label: string;
  industryId: string;
  priceBand: [number, number];
  naturalLean?: Partial<Record<AxisKey, number>>;
  categoryLean?: Partial<Record<AxisKey, number>>;
  defaultAttributes: Record<string, number>;
  materials: ProductMaterialRequirement[];
  manufacturingFamilies: string[];
  storage: {
    profile: StorageProfileId;
    // 1 = baseline warehouse footprint. >1 means bulky; <1 means dense/value-rich.
    spacePerUnit: number;
  };
  regulation: RegulationProfileId;
  retailAffinity: Record<string, number>; // partner id -> multiplier; 1 = neutral
  brandImportance: number; // 0..1
  ipPotential: number;     // 0..1; foundation hook for 8C and cross-industry licensing
  packagingImportance: number; // 0..1
  lifecycle: ProductLifecycleProfile;
  capabilities: Record<string, number>; // capability id -> importance 0..1
  modules: string[];
  designFacets?: ProductFacetDef[]; // data-driven dropdowns rendered automatically by Product Creator
  entry: ProductEntryProfile;
}

export const MATERIALS: Record<string, MaterialDef> = {
  chemical_base: { id: "chemical_base", label: "Chemical Base", volatility: "low", notes: "Emulsions, carriers and base compounds used across personal care." },
  active_ingredients: { id: "active_ingredients", label: "Active Ingredients", volatility: "medium", notes: "Higher-value functional ingredients whose grade matters heavily in skincare." },
  uv_filters: { id: "uv_filters", label: "UV Filters", volatility: "medium", notes: "Specialized inputs for sunscreen efficacy and stability." },
  packaging_components: { id: "packaging_components", label: "Packaging Components", volatility: "medium", notes: "Bottles, jars, pumps, cartons and closures." },
  sheet_material: { id: "sheet_material", label: "Sheet / Mask Material", volatility: "medium", notes: "Fabric or hydrogel substrate for masks and patches." },
  plastic_resin: { id: "plastic_resin", label: "Plastic Resin", volatility: "medium", notes: "Molded toy and consumer-product feedstock." },
  paint: { id: "paint", label: "Paint & Finish", volatility: "medium", notes: "Color, coating and printed finishes." },
  cardboard: { id: "cardboard", label: "Cardboard", volatility: "low", notes: "Boxes, boards and retail packaging." },
  fabric: { id: "fabric", label: "Fabric", volatility: "medium", notes: "Soft-goods textile input." },
  printed_components: { id: "printed_components", label: "Printed Components", volatility: "low", notes: "Cards, boards, rules and printed inserts." },
  electronics: { id: "electronics", label: "Electronic Components", volatility: "high", notes: "Generic electronic assemblies; future technology module can make this more granular." },
  grain: { id: "grain", label: "Grain", volatility: "high", notes: "Foundation material for future food categories." },
  sugar: { id: "sugar", label: "Sugar", volatility: "medium", notes: "Sweetener input for future food and beverage products." },
  cotton: { id: "cotton", label: "Cotton", volatility: "high", notes: "Foundation textile input for future apparel categories." },
};

export const MANUFACTURING_FAMILIES: Record<string, ManufacturingFamilyDef> = {
  chemical_mixing: { id: "chemical_mixing", label: "Chemical Mixing", notes: "Formulation and controlled blending." },
  filling_packaging: { id: "filling_packaging", label: "Filling & Packaging", notes: "Filling, sealing, labeling and final pack-out." },
  plastic_molding: { id: "plastic_molding", label: "Plastic Molding", notes: "Injection / molded plastic consumer goods." },
  assembly: { id: "assembly", label: "Assembly", notes: "Multi-component final assembly." },
  textile: { id: "textile", label: "Textile / Soft Goods", notes: "Cut, sew and soft-goods production." },
  printing: { id: "printing", label: "Printing & Converting", notes: "Cards, boards, labels and printed products." },
  food_processing: { id: "food_processing", label: "Food Processing", notes: "Future food preparation and processing family." },
  electronics_assembly: { id: "electronics_assembly", label: "Electronics Assembly", notes: "Future electronic consumer-goods production." },
};

export const STORAGE_PROFILES: Record<StorageProfileId, StorageProfileDef> = {
  standard: { id: "standard", label: "Standard", infrastructureLabel: "Standard Warehouse", notes: "Normal dry storage." },
  climate: { id: "climate", label: "Climate Controlled", infrastructureLabel: "Climate-Controlled Storage", notes: "Stable temperature/humidity for sensitive goods." },
  refrigerated: { id: "refrigerated", label: "Refrigerated", infrastructureLabel: "Cold Storage", notes: "Chilled inventory; future cold-chain module." },
  frozen: { id: "frozen", label: "Frozen", infrastructureLabel: "Frozen Storage", notes: "Frozen inventory; future cold-chain module." },
  secure: { id: "secure", label: "High Security", infrastructureLabel: "Secure Storage", notes: "High-value goods and shrink-sensitive inventory." },
};

const skin = (a: Omit<ProductArchetype, "industryId" | "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules"> & Partial<Pick<ProductArchetype, "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules">>): ProductArchetype => ({
  ...a,
  industryId: "skincare",
  manufacturingFamilies: a.manufacturingFamilies ?? ["chemical_mixing", "filling_packaging"],
  storage: a.storage ?? { profile: "standard", spacePerUnit: 0.65 },
  regulation: a.regulation ?? "cosmetic",
  brandImportance: a.brandImportance ?? 0.75,
  ipPotential: a.ipPotential ?? 0.08,
  packagingImportance: a.packagingImportance ?? 0.55,
  modules: a.modules ?? ["cosmetic_safety"],
});

const toy = (a: Omit<ProductArchetype, "industryId" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules"> & Partial<Pick<ProductArchetype, "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules">>): ProductArchetype => ({
  ...a,
  industryId: "toys",
  regulation: a.regulation ?? "child_safety",
  brandImportance: a.brandImportance ?? 0.55,
  ipPotential: a.ipPotential ?? 0.8,
  packagingImportance: a.packagingImportance ?? 0.35,
  modules: a.modules ?? ["child_safety", "ip", "seasonality"],
});

const TOY_AUDIENCE_FACET: ProductFacetDef = {
  id: "age_group", label: "Age group", defaultOptionId: "kids_7_9", options: [
    { id: "preschool", label: "Preschool (3–5)", blurb: "Parents of younger children; safety and simplicity matter.", consumerLean: { age: 0.28, family: 0.95 }, attributeBias: { educational: 0.08 } },
    { id: "kids_6_9", label: "Kids (6–9)", consumerLean: { age: 0.33, family: 0.9 } },
    { id: "tweens", label: "Tweens (10–12)", consumerLean: { age: 0.38, family: 0.75 }, attributeBias: { collectible: 0.06 } },
    { id: "collector", label: "Teen / Collector", consumerLean: { age: 0.2, family: 0.25, class: 0.62 }, attributeBias: { collectible: 0.16 } },
  ],
};

const TOY_FANTASY_FACET: ProductFacetDef = {
  id: "play_fantasy", label: "Play fantasy", defaultOptionId: "adventure", options: [
    { id: "adventure", label: "Adventure", attributeBias: { creative: 0.05, licensed: 0.06, collectible: 0.06 } },
    { id: "creativity", label: "Creativity", attributeBias: { creative: 0.18, educational: 0.05 } },
    { id: "competition", label: "Competition", attributeBias: { social: 0.14, collectible: 0.05 } },
    { id: "roleplay", label: "Role Play", attributeBias: { creative: 0.10, licensed: 0.10 } },
    { id: "collecting", label: "Collecting", attributeBias: { collectible: 0.20, licensed: 0.08 } },
    { id: "learning", label: "Learning", attributeBias: { educational: 0.22, creative: 0.04 } },
    { id: "comfort", label: "Comfort", attributeBias: { social: 0.06, creative: 0.04 } },
  ],
};

const toyFacets = () => [TOY_AUDIENCE_FACET, TOY_FANTASY_FACET];

export const PRODUCT_ARCHETYPES: Record<string, ProductArchetype> = {
  moisturizer: skin({
    key: "moisturizer", label: "Moisturizer", priceBand: [18, 60],
    defaultAttributes: { luxury: 0.4, scientific: 0.4, natural: 0.4, sensitive: 0.4, value: 0.5 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 2.2, qualityImportance: 0.7 },
      { materialId: "active_ingredients", baseCostContribution: 2.6, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 1.2, qualityImportance: 0.45 },
    ],
    retailAffinity: { beauty_luxe: 1.18, skin_science: 1.12, quickmart: 1.05, corner_health: 1.05, own_web: 1.08, megazon: 1.0, value_dept: 0.95 },
    lifecycle: { lifetimeDays: 1800, repeatPurchase: 0.78, purchaseCycleDays: 75, shelfLifeDays: 900, trend: "evergreen", hitVolatility: 0.18, seasonality: "flat", obsolescence: 0.08 },
    capabilities: { formulation: 1, consumer_research: 0.45, packaging: 0.35 },
    entry: { starter: true, investment: 0, days: 0, blurb: "Core daily skincare category." },
  }),
  serum: skin({
    key: "serum", label: "Serum", priceBand: [28, 95],
    defaultAttributes: { luxury: 0.6, scientific: 0.7, natural: 0.3, sensitive: 0.3, value: 0.3 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 1.8, qualityImportance: 0.65 },
      { materialId: "active_ingredients", baseCostContribution: 5.6, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 1.6, qualityImportance: 0.55 },
    ],
    retailAffinity: { beauty_luxe: 1.28, skin_science: 1.22, own_web: 1.1, glamour_dept: 1.08, megazon: 0.96, value_dept: 0.78 },
    lifecycle: { lifetimeDays: 1080, repeatPurchase: 0.72, purchaseCycleDays: 90, shelfLifeDays: 840, trend: "moderate", hitVolatility: 0.28, seasonality: "flat", obsolescence: 0.14 },
    capabilities: { formulation: 1, actives: 1, claims: 0.65, packaging: 0.45 },
    entry: { starter: false, investment: 150_000, days: 45, blurb: "Build formulation know-how for concentrated actives and premium routines." },
  }),
  cleanser: skin({
    key: "cleanser", label: "Cleanser", priceBand: [12, 38],
    defaultAttributes: { luxury: 0.2, scientific: 0.4, natural: 0.5, sensitive: 0.5, value: 0.7 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 2.2, qualityImportance: 0.75 },
      { materialId: "active_ingredients", baseCostContribution: 0.8, qualityImportance: 0.65 },
      { materialId: "packaging_components", baseCostContribution: 1.0, qualityImportance: 0.35 },
    ],
    storage: { profile: "standard", spacePerUnit: 0.8 },
    retailAffinity: { quickmart: 1.18, corner_health: 1.12, megazon: 1.05, value_dept: 1.08, beauty_luxe: 0.94, own_web: 1.0 },
    lifecycle: { lifetimeDays: 3600, repeatPurchase: 0.86, purchaseCycleDays: 60, shelfLifeDays: 1080, trend: "evergreen", hitVolatility: 0.1, seasonality: "flat", obsolescence: 0.04 },
    capabilities: { formulation: 0.8, scale_manufacturing: 0.55, retail: 0.45 },
    entry: { starter: true, investment: 0, days: 0, blurb: "Core high-repeat cleansing category." },
  }),
  antiaging: skin({
    key: "antiaging", label: "Anti-Aging Cream", priceBand: [35, 120], naturalLean: { age: 0.85 }, categoryLean: { age: 0.8, class: 0.3 },
    defaultAttributes: { luxury: 0.7, scientific: 0.8, natural: 0.2, sensitive: 0.3, value: 0.2 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 2.4, qualityImportance: 0.7 },
      { materialId: "active_ingredients", baseCostContribution: 6.9, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 1.7, qualityImportance: 0.65 },
    ],
    retailAffinity: { beauty_luxe: 1.32, skin_science: 1.25, glamour_dept: 1.14, corner_health: 1.02, own_web: 1.08, value_dept: 0.68 },
    lifecycle: { lifetimeDays: 2520, repeatPurchase: 0.7, purchaseCycleDays: 95, shelfLifeDays: 900, trend: "evergreen", hitVolatility: 0.18, seasonality: "flat", obsolescence: 0.09 },
    capabilities: { formulation: 1, actives: 1, claims: 1, clinical_testing: 0.75 },
    entry: { starter: false, investment: 350_000, days: 75, blurb: "Enter a high-value category where efficacy and trust matter intensely." },
  }),
  hydration: skin({
    key: "hydration", label: "Hydration Gel", priceBand: [16, 50], naturalLean: { age: 0.2 }, categoryLean: { age: -0.5 },
    defaultAttributes: { luxury: 0.3, scientific: 0.4, natural: 0.6, sensitive: 0.6, value: 0.6 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 2.0, qualityImportance: 0.75 },
      { materialId: "active_ingredients", baseCostContribution: 2.6, qualityImportance: 0.85 },
      { materialId: "packaging_components", baseCostContribution: 1.4, qualityImportance: 0.45 },
    ],
    retailAffinity: { beauty_luxe: 1.08, skin_science: 1.08, megazon: 1.06, own_web: 1.08, quickmart: 1.04, value_dept: 1.0 },
    lifecycle: { lifetimeDays: 1440, repeatPurchase: 0.78, purchaseCycleDays: 70, shelfLifeDays: 900, trend: "moderate", hitVolatility: 0.22, seasonality: "summer", obsolescence: 0.1 },
    capabilities: { formulation: 0.85, consumer_research: 0.55, packaging: 0.35 },
    entry: { starter: true, investment: 0, days: 0, blurb: "Accessible hydration and texture innovation." },
  }),
  sunscreen: skin({
    key: "sunscreen", label: "Sunscreen", priceBand: [18, 58], categoryLean: { age: -0.15, class: 0.1 },
    defaultAttributes: { luxury: 0.3, scientific: 0.7, natural: 0.4, sensitive: 0.6, value: 0.5 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 1.8, qualityImportance: 0.65 },
      { materialId: "uv_filters", baseCostContribution: 3.8, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 1.4, qualityImportance: 0.4 },
    ],
    retailAffinity: { quickmart: 1.18, corner_health: 1.16, skin_science: 1.18, beauty_luxe: 1.06, megazon: 1.05, own_web: 1.0 },
    lifecycle: { lifetimeDays: 1800, repeatPurchase: 0.7, purchaseCycleDays: 85, shelfLifeDays: 780, trend: "evergreen", hitVolatility: 0.16, seasonality: "summer", obsolescence: 0.06 },
    capabilities: { formulation: 0.8, uv_science: 1, claims: 0.8, stability_testing: 0.8 },
    entry: { starter: false, investment: 250_000, days: 60, blurb: "Develop testing, stability and claims capability for daily sun protection." },
  }),
  acne: skin({
    key: "acne", label: "Acne Treatment", priceBand: [20, 64], naturalLean: { age: 0.18 }, categoryLean: { age: -0.65 },
    defaultAttributes: { luxury: 0.2, scientific: 0.9, natural: 0.3, sensitive: 0.7, value: 0.45 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 1.8, qualityImportance: 0.6 },
      { materialId: "active_ingredients", baseCostContribution: 4.8, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 1.4, qualityImportance: 0.35 },
    ],
    retailAffinity: { skin_science: 1.34, corner_health: 1.22, quickmart: 1.14, megazon: 1.06, beauty_luxe: 0.88, own_web: 1.02 },
    lifecycle: { lifetimeDays: 1440, repeatPurchase: 0.82, purchaseCycleDays: 65, shelfLifeDays: 780, trend: "evergreen", hitVolatility: 0.18, seasonality: "flat", obsolescence: 0.08 },
    capabilities: { formulation: 0.85, actives: 1, claims: 0.8, sensitive_skin: 0.65 },
    entry: { starter: false, investment: 250_000, days: 60, blurb: "Build specialist treatment credibility with younger, science-led consumers." },
  }),
  eyecare: skin({
    key: "eyecare", label: "Eye Care", priceBand: [30, 105], naturalLean: { age: 0.72 }, categoryLean: { age: 0.55, class: 0.35 },
    defaultAttributes: { luxury: 0.75, scientific: 0.7, natural: 0.3, sensitive: 0.55, value: 0.2 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 1.9, qualityImportance: 0.7 },
      { materialId: "active_ingredients", baseCostContribution: 6.1, qualityImportance: 1.0 },
      { materialId: "packaging_components", baseCostContribution: 2.0, qualityImportance: 0.7 },
    ],
    retailAffinity: { beauty_luxe: 1.35, skin_science: 1.2, glamour_dept: 1.16, own_web: 1.08, megazon: 0.92, value_dept: 0.62 },
    lifecycle: { lifetimeDays: 2160, repeatPurchase: 0.68, purchaseCycleDays: 100, shelfLifeDays: 840, trend: "evergreen", hitVolatility: 0.2, seasonality: "flat", obsolescence: 0.09 },
    capabilities: { formulation: 0.9, actives: 0.9, sensitive_skin: 1, premium_packaging: 0.7 },
    entry: { starter: false, investment: 400_000, days: 75, blurb: "Enter a premium, high-margin category with demanding quality expectations." },
  }),
  mask: skin({
    key: "mask", label: "Face Mask", priceBand: [12, 42], naturalLean: { age: 0.3 }, categoryLean: { age: -0.35 },
    defaultAttributes: { luxury: 0.45, scientific: 0.3, natural: 0.7, sensitive: 0.5, value: 0.55 },
    materials: [
      { materialId: "chemical_base", baseCostContribution: 1.2, qualityImportance: 0.6 },
      { materialId: "active_ingredients", baseCostContribution: 1.6, qualityImportance: 0.8 },
      { materialId: "sheet_material", baseCostContribution: 1.2, qualityImportance: 0.65 },
      { materialId: "packaging_components", baseCostContribution: 1.0, qualityImportance: 0.45 },
    ],
    storage: { profile: "standard", spacePerUnit: 0.4 },
    retailAffinity: { beauty_luxe: 1.2, megazon: 1.12, own_web: 1.08, glamour_dept: 1.06, quickmart: 0.96, value_dept: 0.96 },
    lifecycle: { lifetimeDays: 1080, repeatPurchase: 0.62, purchaseCycleDays: 40, shelfLifeDays: 720, trend: "trend_driven", hitVolatility: 0.35, seasonality: "christmas", obsolescence: 0.18 },
    capabilities: { formulation: 0.5, trend_insight: 0.8, packaging: 0.55 },
    entry: { starter: false, investment: 200_000, days: 45, blurb: "Add a trend-sensitive ritual product with strong launch and gifting potential." },
  }),

  // Toys are the first full proof that future verticals are content/config.
  // Their seasonality, safety, storage, manufacturing and hit behavior come from universal modules.
  buildingset: toy({
    key: "buildingset", label: "Building Set", priceBand: [12, 45],
    defaultAttributes: { educational: 0.7, creative: 0.7, licensed: 0.2, collectible: 0.3, social: 0.3 },
    materials: [
      { materialId: "plastic_resin", baseCostContribution: 2.2, qualityImportance: 0.7 },
      { materialId: "paint", baseCostContribution: 0.5, qualityImportance: 0.55 },
      { materialId: "cardboard", baseCostContribution: 1.3, qualityImportance: 0.3 },
    ],
    manufacturingFamilies: ["plastic_molding", "assembly", "printing"], storage: { profile: "standard", spacePerUnit: 1.4 },
    retailAffinity: { toy_kingdom: 1.35, value_dept: 1.15, megazon: 1.12, niche_market: 0.98, own_web: 0.9 },
    lifecycle: { lifetimeDays: 5400, repeatPurchase: 0.22, purchaseCycleDays: 240, shelfLifeDays: null, trend: "moderate", hitVolatility: 0.55, seasonality: "christmas", obsolescence: 0.18 },
    capabilities: { toy_design: 0.8, safety: 0.55, plastic_manufacturing: 0.65 },
    designFacets: toyFacets(),
    entry: { starter: true, investment: 0, days: 0, blurb: "Core construction-play category." },
  }),
  boardgame: toy({
    key: "boardgame", label: "Board Game", priceBand: [10, 35],
    defaultAttributes: { educational: 0.5, creative: 0.4, licensed: 0.2, collectible: 0.2, social: 0.9 },
    materials: [
      { materialId: "cardboard", baseCostContribution: 1.4, qualityImportance: 0.55 },
      { materialId: "printed_components", baseCostContribution: 1.1, qualityImportance: 0.65 },
      { materialId: "packaging_components", baseCostContribution: 0.5, qualityImportance: 0.3 },
    ],
    manufacturingFamilies: ["printing", "assembly"], storage: { profile: "standard", spacePerUnit: 1.1 },
    retailAffinity: { toy_kingdom: 1.25, niche_market: 1.18, megazon: 1.1, value_dept: 1.05, own_web: 0.95 },
    lifecycle: { lifetimeDays: 7200, repeatPurchase: 0.16, purchaseCycleDays: 300, shelfLifeDays: null, trend: "evergreen", hitVolatility: 0.42, seasonality: "christmas", obsolescence: 0.08 },
    capabilities: { toy_design: 0.65, game_design: 1, safety: 0.35, printing: 0.6 },
    designFacets: toyFacets(),
    entry: { starter: true, investment: 0, days: 0, blurb: "Core social-play category." },
  }),
  plush: toy({
    key: "plush", label: "Plush Toy", priceBand: [8, 28], naturalLean: { age: 0.1 }, categoryLean: { age: -0.6, family: 0.4 },
    defaultAttributes: { educational: 0.2, creative: 0.3, licensed: 0.6, collectible: 0.5, social: 0.3 },
    materials: [
      { materialId: "fabric", baseCostContribution: 1.1, qualityImportance: 0.8 },
      { materialId: "paint", baseCostContribution: 0.2, qualityImportance: 0.35 },
      { materialId: "packaging_components", baseCostContribution: 0.7, qualityImportance: 0.25 },
    ],
    manufacturingFamilies: ["textile", "assembly"], storage: { profile: "standard", spacePerUnit: 2.0 },
    retailAffinity: { toy_kingdom: 1.32, megazon: 1.08, value_dept: 1.05, niche_market: 1.05, own_web: 0.92 },
    lifecycle: { lifetimeDays: 1080, repeatPurchase: 0.18, purchaseCycleDays: 260, shelfLifeDays: null, trend: "trend_driven", hitVolatility: 0.68, seasonality: "christmas", obsolescence: 0.35 },
    capabilities: { toy_design: 0.5, soft_goods: 1, licensing: 0.7, safety: 0.6 },
    designFacets: toyFacets(),
    entry: { starter: false, investment: 180_000, days: 45, blurb: "Develop soft-goods sourcing and character merchandising capabilities." },
  }),
  actionfig: toy({
    key: "actionfig", label: "Action Figure", priceBand: [9, 30], categoryLean: { age: -0.5, gender: 0.6, family: 0.3 },
    defaultAttributes: { educational: 0.1, creative: 0.3, licensed: 0.8, collectible: 0.8, social: 0.2 },
    materials: [
      { materialId: "plastic_resin", baseCostContribution: 1.5, qualityImportance: 0.65 },
      { materialId: "paint", baseCostContribution: 0.8, qualityImportance: 0.85 },
      { materialId: "packaging_components", baseCostContribution: 0.7, qualityImportance: 0.45 },
    ],
    manufacturingFamilies: ["plastic_molding", "assembly"], storage: { profile: "standard", spacePerUnit: 1.0 },
    retailAffinity: { toy_kingdom: 1.4, niche_market: 1.18, megazon: 1.15, value_dept: 1.05, own_web: 0.95 },
    lifecycle: { lifetimeDays: 1800, repeatPurchase: 0.2, purchaseCycleDays: 180, shelfLifeDays: null, trend: "trend_driven", hitVolatility: 0.78, seasonality: "christmas", obsolescence: 0.42 },
    capabilities: { toy_design: 0.75, character_design: 0.75, licensing: 1, plastic_manufacturing: 0.65, safety: 0.65 },
    designFacets: toyFacets(),
    entry: { starter: false, investment: 300_000, days: 60, blurb: "Build tooling, collectible design and character-product expertise." },
  }),
  doll: toy({
    key: "doll", label: "Doll", priceBand: [12, 55], categoryLean: { age: -0.45, family: 0.45 },
    defaultAttributes: { educational: 0.2, creative: 0.55, licensed: 0.55, collectible: 0.6, social: 0.45 },
    materials: [
      { materialId: "plastic_resin", baseCostContribution: 1.7, qualityImportance: 0.6 },
      { materialId: "fabric", baseCostContribution: 1.0, qualityImportance: 0.7 },
      { materialId: "paint", baseCostContribution: 0.6, qualityImportance: 0.8 },
      { materialId: "packaging_components", baseCostContribution: 0.9, qualityImportance: 0.4 },
    ],
    manufacturingFamilies: ["plastic_molding", "textile", "assembly"], storage: { profile: "standard", spacePerUnit: 1.45 },
    retailAffinity: { toy_kingdom: 1.4, value_dept: 1.12, megazon: 1.12, niche_market: 1.02, own_web: 0.94 },
    lifecycle: { lifetimeDays: 2160, repeatPurchase: 0.2, purchaseCycleDays: 210, shelfLifeDays: null, trend: "trend_driven", hitVolatility: 0.72, seasonality: "christmas", obsolescence: 0.34 },
    capabilities: { toy_design: 0.8, character_design: 0.7, soft_goods: 0.5, licensing: 0.75, safety: 0.7 },
    designFacets: toyFacets(),
    entry: { starter: false, investment: 320_000, days: 65, blurb: "Build character design, mixed-material assembly and doll merchandising capability." },
  }),
  vehicle: toy({
    key: "vehicle", label: "Toy Vehicle", priceBand: [8, 42], categoryLean: { age: -0.45, family: 0.35 },
    defaultAttributes: { educational: 0.15, creative: 0.35, licensed: 0.55, collectible: 0.55, social: 0.3 },
    materials: [
      { materialId: "plastic_resin", baseCostContribution: 1.8, qualityImportance: 0.7 },
      { materialId: "paint", baseCostContribution: 0.7, qualityImportance: 0.8 },
      { materialId: "packaging_components", baseCostContribution: 0.7, qualityImportance: 0.35 },
    ],
    manufacturingFamilies: ["plastic_molding", "assembly"], storage: { profile: "standard", spacePerUnit: 1.1 },
    retailAffinity: { toy_kingdom: 1.38, value_dept: 1.16, megazon: 1.12, niche_market: 1.04, own_web: 0.9 },
    lifecycle: { lifetimeDays: 2160, repeatPurchase: 0.2, purchaseCycleDays: 190, shelfLifeDays: null, trend: "moderate", hitVolatility: 0.62, seasonality: "christmas", obsolescence: 0.25 },
    capabilities: { toy_design: 0.7, plastic_manufacturing: 0.8, licensing: 0.6, safety: 0.7 },
    designFacets: toyFacets(),
    entry: { starter: false, investment: 240_000, days: 55, blurb: "Add molded vehicle tooling and durable moving-part design." },
  }),
  collectible: toy({
    key: "collectible", label: "Collectible", priceBand: [5, 35], categoryLean: { age: -0.25, class: 0.2 },
    defaultAttributes: { educational: 0.05, creative: 0.25, licensed: 0.8, collectible: 0.95, social: 0.35 },
    materials: [
      { materialId: "plastic_resin", baseCostContribution: 0.9, qualityImportance: 0.55 },
      { materialId: "paint", baseCostContribution: 0.55, qualityImportance: 0.9 },
      { materialId: "packaging_components", baseCostContribution: 0.8, qualityImportance: 0.7 },
    ],
    manufacturingFamilies: ["plastic_molding", "assembly"], storage: { profile: "standard", spacePerUnit: 0.55 },
    retailAffinity: { niche_market: 1.38, toy_kingdom: 1.3, megazon: 1.2, own_web: 1.08, value_dept: 0.95 },
    lifecycle: { lifetimeDays: 900, repeatPurchase: 0.32, purchaseCycleDays: 75, shelfLifeDays: null, trend: "fad_driven", hitVolatility: 0.96, seasonality: "christmas", obsolescence: 0.62 },
    capabilities: { toy_design: 0.55, character_design: 0.8, licensing: 1, trend_insight: 0.9, safety: 0.5 },
    designFacets: toyFacets(),
    entry: { starter: false, investment: 260_000, days: 50, blurb: "Enter a fast-moving, IP-heavy category with high upside and high inventory risk." },
  }),
  electronictoy: toy({
    key: "electronictoy", label: "Electronic Toy", priceBand: [25, 120], categoryLean: { age: -0.25, class: 0.35, family: 0.3 },
    defaultAttributes: { educational: 0.45, creative: 0.55, licensed: 0.45, collectible: 0.25, social: 0.5 },
    materials: [
      { materialId: "electronics", baseCostContribution: 8.0, qualityImportance: 0.9 },
      { materialId: "plastic_resin", baseCostContribution: 2.4, qualityImportance: 0.6 },
      { materialId: "packaging_components", baseCostContribution: 1.4, qualityImportance: 0.4 },
    ],
    manufacturingFamilies: ["electronics_assembly", "plastic_molding", "assembly"], storage: { profile: "standard", spacePerUnit: 1.5 },
    retailAffinity: { toy_kingdom: 1.28, megazon: 1.22, value_dept: 1.02, niche_market: 1.05, own_web: 1.0 },
    lifecycle: { lifetimeDays: 900, repeatPurchase: 0.1, purchaseCycleDays: 420, shelfLifeDays: null, trend: "trend_driven", hitVolatility: 0.7, seasonality: "christmas", obsolescence: 0.68 },
    capabilities: { toy_design: 0.55, electronics: 1, safety: 0.9, engineering: 0.8 },
    designFacets: toyFacets(),
    modules: ["child_safety", "seasonality", "technology"],
    entry: { starter: false, investment: 650_000, days: 100, blurb: "Build electronics integration, testing and higher-complexity supplier capability." },
  }),
};

export function archetypeByKey(productKey: string): ProductArchetype | undefined {
  return PRODUCT_ARCHETYPES[productKey];
}

export function archetypesForIndustry(industryId: string): ProductArchetype[] {
  return Object.values(PRODUCT_ARCHETYPES).filter((p) => p.industryId === industryId);
}

export function registeredIndustryIds(): string[] {
  return Array.from(new Set(Object.values(PRODUCT_ARCHETYPES).map((p) => p.industryId)));
}

export function archetypeBaseCost(productKey: string, materialPriceIndex: Record<string, number> = {}): number {
  const p = archetypeByKey(productKey);
  if (!p) return 0;
  return p.materials.reduce((sum, m) => sum + m.baseCostContribution * (materialPriceIndex[m.materialId] ?? 1), 0);
}

export function productTypeFromArchetype(p: ProductArchetype): ProductType {
  return {
    key: p.key,
    label: p.label,
    baseCost: archetypeBaseCost(p.key),
    priceBand: p.priceBand,
    naturalLean: p.naturalLean,
    defaultAttributes: p.defaultAttributes,
    categoryLean: p.categoryLean,
    lifetimeDays: p.lifecycle.lifetimeDays,
  };
}

export function productTypesForIndustry(industryId: string): ProductType[] {
  return archetypesForIndustry(industryId).map(productTypeFromArchetype);
}

export function starterProductKeys(industryId: string): string[] {
  return archetypesForIndustry(industryId).filter((p) => p.entry.starter).map((p) => p.key);
}

export function retailerAffinity(productKey: string, partnerId: string, retailerFormat?: string, channelType?: string): number {
  const affinity = archetypeByKey(productKey)?.retailAffinity;
  if (!affinity) return 1;
  return affinity[partnerId]
    ?? (retailerFormat ? affinity[`format:${retailerFormat}`] : undefined)
    ?? (channelType ? affinity[`channel:${channelType}`] : undefined)
    ?? 1;
}

export function storageSpaceForProduct(productKey: string): number {
  return archetypeByKey(productKey)?.storage.spacePerUnit ?? 1;
}

export function defaultMaterialPriceIndex(): Record<string, number> {
  return Object.fromEntries(Object.keys(MATERIALS).map((id) => [id, 1]));
}


export function defaultFactoryFamiliesForIndustry(industryId: string): string[] {
  const starter = archetypesForIndustry(industryId).filter((p) => p.entry.starter);
  return Array.from(new Set(starter.flatMap((p) => p.manufacturingFamilies)));
}

export function factorySupportsProduct(families: string[] | undefined, productKey: string): boolean {
  const p = archetypeByKey(productKey);
  if (!p) return true;
  const available = new Set(families ?? []);
  return p.manufacturingFamilies.every((family) => available.has(family));
}

export function storageProfileForProduct(productKey: string): StorageProfileId {
  return archetypeByKey(productKey)?.storage.profile ?? "standard";
}
