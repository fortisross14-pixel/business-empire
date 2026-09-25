import type { AxisKey, ProductType } from "./types";

export type VolatilityBand = "low" | "medium" | "high" | "very_high";
export type StorageProfileId = "standard" | "climate" | "refrigerated" | "frozen" | "secure";
export type RegulationProfileId = "standard" | "cosmetic" | "child_safety" | "food_safety" | "electronics_safety";
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
  oils: { id: "oils", label: "Cooking Oils", volatility: "high", notes: "Edible oils used in snacks, baked goods and ready meals." },
  flavors: { id: "flavors", label: "Flavors & Seasonings", volatility: "medium", notes: "Taste-critical cocoa, fruit, spice and savory systems." },
  protein: { id: "protein", label: "Protein Ingredients", volatility: "high", notes: "Dairy, plant and meat proteins for functional foods and meals." },
  technical_fabric: { id: "technical_fabric", label: "Technical Fabric", volatility: "medium", notes: "Performance textiles with stretch, wicking or weather resistance." },
  denim: { id: "denim", label: "Denim", volatility: "medium", notes: "Heavy woven textile where wash and construction strongly affect quality." },
  leather: { id: "leather", label: "Leather & Alternatives", volatility: "high", notes: "Premium natural and engineered handbag materials." },
  batteries: { id: "batteries", label: "Batteries", volatility: "high", notes: "Rechargeable cells and power-management components." },
  sensors: { id: "sensors", label: "Sensors", volatility: "high", notes: "Motion, biometric, audio and environmental sensing modules." },
  semiconductors: { id: "semiconductors", label: "Semiconductors", volatility: "very_high", notes: "Processors, radios and memory with cyclical availability." },
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

const food = (a: Omit<ProductArchetype, "industryId" | "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules"> & Partial<Pick<ProductArchetype, "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules">>): ProductArchetype => ({
  ...a, industryId: "food", manufacturingFamilies: a.manufacturingFamilies ?? ["food_processing", "filling_packaging"],
  storage: a.storage ?? { profile: "standard", spacePerUnit: .75 }, regulation: a.regulation ?? "food_safety",
  brandImportance: a.brandImportance ?? .62, ipPotential: a.ipPotential ?? .35, packagingImportance: a.packagingImportance ?? .72,
  modules: a.modules ?? ["food_safety", "expiry", "repeat_purchase"],
});
const apparel = (a: Omit<ProductArchetype, "industryId" | "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules"> & Partial<Pick<ProductArchetype, "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules">>): ProductArchetype => ({
  ...a, industryId: "apparel", manufacturingFamilies: a.manufacturingFamilies ?? ["textile", "assembly"],
  storage: a.storage ?? { profile: "standard", spacePerUnit: .8 }, regulation: a.regulation ?? "standard",
  brandImportance: a.brandImportance ?? .88, ipPotential: a.ipPotential ?? .48, packagingImportance: a.packagingImportance ?? .28,
  modules: a.modules ?? ["fashion", "seasonality", "ip"],
});
const electronicsProduct = (a: Omit<ProductArchetype, "industryId" | "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules"> & Partial<Pick<ProductArchetype, "manufacturingFamilies" | "storage" | "regulation" | "brandImportance" | "ipPotential" | "packagingImportance" | "modules">>): ProductArchetype => ({
  ...a, industryId: "electronics", manufacturingFamilies: a.manufacturingFamilies ?? ["electronics_assembly", "assembly"],
  storage: a.storage ?? { profile: "standard", spacePerUnit: .6 }, regulation: a.regulation ?? "electronics_safety",
  brandImportance: a.brandImportance ?? .78, ipPotential: a.ipPotential ?? .22, packagingImportance: a.packagingImportance ?? .4,
  modules: a.modules ?? ["technology", "electronics_safety", "obsolescence"],
});

const FOOD_FACETS: ProductFacetDef[] = [
  { id: "occasion", label: "Eating occasion", defaultOptionId: "everyday", options: [
    { id: "everyday", label: "Everyday family", attributeBias: { value: .09, convenience: .05 } },
    { id: "on_the_go", label: "On the go", consumerLean: { age: -.25, geography: .25 }, attributeBias: { convenience: .18 } },
    { id: "wellness", label: "Wellness routine", consumerLean: { class: .3, leaning: -.2 }, attributeBias: { health: .16, natural: .12 } },
    { id: "indulgence", label: "Indulgent treat", attributeBias: { taste: .18, licensed: .06 } },
  ]},
  { id: "flavor", label: "Flavor direction", defaultOptionId: "familiar", options: [
    { id: "familiar", label: "Familiar favorite", attributeBias: { taste: .08, value: .05 } },
    { id: "bold", label: "Bold & adventurous", consumerLean: { age: -.35, geography: .2 }, attributeBias: { taste: .15 } },
    { id: "natural", label: "Simple & natural", attributeBias: { natural: .16, health: .08 } },
  ]},
];
const APPAREL_FACETS: ProductFacetDef[] = [
  { id: "fit", label: "Fit", defaultOptionId: "regular", options: [
    { id: "regular", label: "Regular", attributeBias: { comfort: .08, value: .05 } },
    { id: "relaxed", label: "Relaxed", consumerLean: { age: -.2 }, attributeBias: { comfort: .16, style: .05 } },
    { id: "tailored", label: "Tailored", consumerLean: { class: .35 }, attributeBias: { style: .12, prestige: .1 } },
  ]},
  { id: "collection", label: "Collection direction", defaultOptionId: "core", options: [
    { id: "core", label: "Core essentials", attributeBias: { durability: .1, value: .08 } },
    { id: "trend", label: "Fashion drop", consumerLean: { age: -.4, geography: .25 }, attributeBias: { style: .18, licensed: .06 } },
    { id: "responsible", label: "Responsible edit", consumerLean: { leaning: -.35, class: .15 }, attributeBias: { sustainability: .2 } },
  ]},
];
const ELECTRONICS_FACETS: ProductFacetDef[] = [
  { id: "use_case", label: "Primary use", defaultOptionId: "everyday", options: [
    { id: "everyday", label: "Everyday", attributeBias: { ease_of_use: .1, value: .06 } },
    { id: "performance", label: "Enthusiast", consumerLean: { age: -.25, class: .3 }, attributeBias: { performance: .18, ecosystem: .06 } },
    { id: "family", label: "Home & family", consumerLean: { family: .55 }, attributeBias: { reliability: .12, privacy: .1 } },
  ]},
  { id: "design_language", label: "Design language", defaultOptionId: "friendly", options: [
    { id: "friendly", label: "Friendly", attributeBias: { ease_of_use: .1, design: .05 } },
    { id: "minimal", label: "Minimal premium", consumerLean: { class: .3 }, attributeBias: { design: .16 } },
    { id: "rugged", label: "Rugged", attributeBias: { reliability: .16, performance: .05 } },
  ]},
];

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

  cereal: food({ key:"cereal", label:"Breakfast Cereal", priceBand:[4,12], categoryLean:{ family:.55, class:-.15 },
    defaultAttributes:{ taste:.66, health:.48, convenience:.7, value:.72, natural:.42, licensed:.28 },
    materials:[{materialId:"grain",baseCostContribution:.72,qualityImportance:.7},{materialId:"sugar",baseCostContribution:.24,qualityImportance:.4},{materialId:"flavors",baseCostContribution:.28,qualityImportance:.75},{materialId:"cardboard",baseCostContribution:.38,qualityImportance:.2}],
    retailAffinity:{ freshbasket:1.28, snackstop:1.05, value_dept:1.16, megazon:1.02, own_web:.82 }, lifecycle:{lifetimeDays:1800,repeatPurchase:.84,purchaseCycleDays:25,shelfLifeDays:360,trend:"evergreen",hitVolatility:.22,seasonality:"flat",obsolescence:.05},
    capabilities:{food_design:.7,taste_testing:.75,nutrition:.45,scale_manufacturing:.65}, designFacets:FOOD_FACETS, entry:{starter:true,investment:0,days:0,blurb:"A repeat-purchase family staple where taste, value and shelf visibility compete."} }),
  snackbar: food({ key:"snackbar", label:"Snack Bar", priceBand:[3,16], categoryLean:{ age:-.25, class:.15, geography:.15 },
    defaultAttributes:{ taste:.6, health:.66, convenience:.88, value:.52, natural:.6, licensed:.18 }, materials:[{materialId:"grain",baseCostContribution:.48,qualityImportance:.65},{materialId:"protein",baseCostContribution:.72,qualityImportance:.85},{materialId:"flavors",baseCostContribution:.32,qualityImportance:.75},{materialId:"packaging_components",baseCostContribution:.3,qualityImportance:.25}],
    retailAffinity:{ freshbasket:1.16,snackstop:1.3,corner_health:1.16,megazon:1.08,own_web:1.02 }, lifecycle:{lifetimeDays:1080,repeatPurchase:.82,purchaseCycleDays:18,shelfLifeDays:270,trend:"moderate",hitVolatility:.32,seasonality:"flat",obsolescence:.12},
    capabilities:{food_design:.65,taste_testing:.7,nutrition:.8,packaging:.5}, designFacets:FOOD_FACETS, entry:{starter:true,investment:0,days:0,blurb:"Portable snacking with a live trade-off between flavor, nutrition and price."} }),
  chips: food({ key:"chips", label:"Chips", priceBand:[3,9], categoryLean:{ age:-.35,class:-.2 },
    defaultAttributes:{taste:.86,health:.22,convenience:.82,value:.75,natural:.3,licensed:.28}, materials:[{materialId:"grain",baseCostContribution:.38,qualityImportance:.55},{materialId:"oils",baseCostContribution:.42,qualityImportance:.75},{materialId:"flavors",baseCostContribution:.36,qualityImportance:.95},{materialId:"packaging_components",baseCostContribution:.24,qualityImportance:.2}],
    retailAffinity:{snackstop:1.35,freshbasket:1.16,value_dept:1.2,megazon:.94,own_web:.72}, lifecycle:{lifetimeDays:900,repeatPurchase:.9,purchaseCycleDays:14,shelfLifeDays:180,trend:"trend_driven",hitVolatility:.45,seasonality:"summer",obsolescence:.2}, capabilities:{food_design:.55,taste_testing:1,scale_manufacturing:.75}, designFacets:FOOD_FACETS, entry:{starter:true,investment:0,days:0,blurb:"High-frequency, flavor-led impulse category with fierce shelf competition."} }),
  cookies: food({ key:"cookies", label:"Cookies", priceBand:[3,12], categoryLean:{family:.45,class:-.05}, defaultAttributes:{taste:.84,health:.28,convenience:.68,value:.68,natural:.4,licensed:.36},
    materials:[{materialId:"grain",baseCostContribution:.42,qualityImportance:.6},{materialId:"sugar",baseCostContribution:.28,qualityImportance:.55},{materialId:"flavors",baseCostContribution:.4,qualityImportance:.9},{materialId:"packaging_components",baseCostContribution:.3,qualityImportance:.25}], retailAffinity:{freshbasket:1.24,snackstop:1.18,value_dept:1.14,megazon:1.0,own_web:.82},
    lifecycle:{lifetimeDays:1800,repeatPurchase:.86,purchaseCycleDays:20,shelfLifeDays:240,trend:"evergreen",hitVolatility:.28,seasonality:"christmas",obsolescence:.07},capabilities:{food_design:.6,taste_testing:.95,baking:.75,packaging:.4},designFacets:FOOD_FACETS,entry:{starter:false,investment:120000,days:35,blurb:"Build baking and texture expertise for a durable family and gifting category."} }),
  candy: food({ key:"candy", label:"Candy", priceBand:[2,15], categoryLean:{age:-.55,class:-.1},defaultAttributes:{taste:.9,health:.12,convenience:.75,value:.7,natural:.18,licensed:.62},materials:[{materialId:"sugar",baseCostContribution:.34,qualityImportance:.65},{materialId:"flavors",baseCostContribution:.48,qualityImportance:1},{materialId:"packaging_components",baseCostContribution:.28,qualityImportance:.35}],
    retailAffinity:{snackstop:1.42,freshbasket:1.08,toy_kingdom:1.08,value_dept:1.18,megazon:.96},lifecycle:{lifetimeDays:720,repeatPurchase:.88,purchaseCycleDays:12,shelfLifeDays:300,trend:"fad_driven",hitVolatility:.65,seasonality:"christmas",obsolescence:.36},capabilities:{food_design:.6,taste_testing:1,licensing:.7,trend_insight:.75},designFacets:FOOD_FACETS,entry:{starter:false,investment:180000,days:40,blurb:"An impulse and licensing playground with hit potential—and fad risk."} }),
  readymeal: food({ key:"readymeal", label:"Ready Meal", priceBand:[5,18], categoryLean:{age:.05,family:.25,geography:.2},defaultAttributes:{taste:.7,health:.52,convenience:.95,value:.58,natural:.44,licensed:.06},materials:[{materialId:"grain",baseCostContribution:.65,qualityImportance:.55},{materialId:"protein",baseCostContribution:1.85,qualityImportance:1},{materialId:"oils",baseCostContribution:.38,qualityImportance:.55},{materialId:"flavors",baseCostContribution:.52,qualityImportance:.8},{materialId:"packaging_components",baseCostContribution:.55,qualityImportance:.35}],
    storage:{profile:"refrigerated",spacePerUnit:1.05},retailAffinity:{freshbasket:1.4,quickmart:1.18,value_dept:1.06,megazon:.55,own_web:.62},lifecycle:{lifetimeDays:720,repeatPurchase:.82,purchaseCycleDays:10,shelfLifeDays:45,trend:"moderate",hitVolatility:.34,seasonality:"winter",obsolescence:.12},capabilities:{food_design:.85,taste_testing:.9,food_safety:1,cold_chain:1},designFacets:FOOD_FACETS,entry:{starter:false,investment:520000,days:85,blurb:"Enter convenience meals with cold-chain complexity and high repeat demand."} }),

  tshirt: apparel({ key:"tshirt",label:"T-Shirt",priceBand:[12,65],categoryLean:{age:-.2},defaultAttributes:{style:.62,comfort:.78,durability:.55,value:.72,sustainability:.42,prestige:.28,licensed:.4},materials:[{materialId:"cotton",baseCostContribution:2.5,qualityImportance:.85},{materialId:"paint",baseCostContribution:.55,qualityImportance:.55},{materialId:"packaging_components",baseCostContribution:.3,qualityImportance:.15}],retailAffinity:{stylehouse:1.22,sportcore:1.04,value_dept:1.18,megazon:1.12,own_web:1.04},lifecycle:{lifetimeDays:1080,repeatPurchase:.58,purchaseCycleDays:90,shelfLifeDays:null,trend:"moderate",hitVolatility:.35,seasonality:"summer",obsolescence:.18},capabilities:{fashion_design:.55,textiles:.65,fit:.45,merchandising:.6},designFacets:APPAREL_FACETS,entry:{starter:true,investment:0,days:0,blurb:"Accessible volume category that exposes every brand, fit and value decision."} }),
  hoodie: apparel({ key:"hoodie",label:"Hoodie",priceBand:[28,140],categoryLean:{age:-.35,class:.05},defaultAttributes:{style:.7,comfort:.86,durability:.68,value:.52,sustainability:.4,prestige:.4,licensed:.5},materials:[{materialId:"cotton",baseCostContribution:6.2,qualityImportance:.85},{materialId:"fabric",baseCostContribution:2.1,qualityImportance:.65},{materialId:"paint",baseCostContribution:.8,qualityImportance:.5}],retailAffinity:{stylehouse:1.25,sportcore:1.18,megazon:1.08,own_web:1.12,value_dept:1.02},lifecycle:{lifetimeDays:1440,repeatPurchase:.42,purchaseCycleDays:180,shelfLifeDays:null,trend:"trend_driven",hitVolatility:.52,seasonality:"winter",obsolescence:.28},capabilities:{fashion_design:.7,textiles:.7,fit:.55,licensing:.55},designFacets:APPAREL_FACETS,entry:{starter:true,investment:0,days:0,blurb:"A brand-led casual staple with room for licensed drops and premium fabrics."} }),
  denim: apparel({ key:"denim",label:"Denim",priceBand:[35,220],categoryLean:{class:.15},defaultAttributes:{style:.72,comfort:.58,durability:.9,value:.5,sustainability:.45,prestige:.48,licensed:.12},materials:[{materialId:"denim",baseCostContribution:9.4,qualityImportance:1},{materialId:"cotton",baseCostContribution:2.2,qualityImportance:.65},{materialId:"packaging_components",baseCostContribution:.35,qualityImportance:.1}],retailAffinity:{stylehouse:1.35,heritage_dept:1.18,value_dept:1.02,megazon:1.02,own_web:1.08},lifecycle:{lifetimeDays:3600,repeatPurchase:.3,purchaseCycleDays:300,shelfLifeDays:null,trend:"evergreen",hitVolatility:.3,seasonality:"flat",obsolescence:.1},capabilities:{fashion_design:.7,textiles:1,fit:1,wash_finishing:.8},designFacets:APPAREL_FACETS,entry:{starter:false,investment:240000,days:55,blurb:"Fit, wash and construction create durable loyalty in a demanding staple."} }),
  activewear: apparel({ key:"activewear",label:"Activewear",priceBand:[25,180],categoryLean:{age:-.15,class:.25,geography:.15},defaultAttributes:{style:.66,comfort:.84,durability:.74,value:.46,sustainability:.5,prestige:.5,licensed:.18},materials:[{materialId:"technical_fabric",baseCostContribution:8.5,qualityImportance:1},{materialId:"fabric",baseCostContribution:1.2,qualityImportance:.5},{materialId:"packaging_components",baseCostContribution:.35,qualityImportance:.1}],retailAffinity:{sportcore:1.45,stylehouse:1.12,megazon:1.05,own_web:1.14,glamour_dept:1.02},lifecycle:{lifetimeDays:1440,repeatPurchase:.48,purchaseCycleDays:150,shelfLifeDays:null,trend:"moderate",hitVolatility:.42,seasonality:"flat",obsolescence:.22},capabilities:{fashion_design:.65,technical_textiles:1,fit:.8,testing:.65},designFacets:APPAREL_FACETS,entry:{starter:false,investment:320000,days:65,blurb:"Performance textiles reward technical credibility as much as fashion."} }),
  kidsapparel: apparel({ key:"kidsapparel",label:"Children's Apparel",priceBand:[15,95],categoryLean:{family:.85,class:-.05},defaultAttributes:{style:.58,comfort:.82,durability:.76,value:.68,sustainability:.42,prestige:.2,licensed:.68},materials:[{materialId:"cotton",baseCostContribution:4.1,qualityImportance:.85},{materialId:"paint",baseCostContribution:.65,qualityImportance:.55},{materialId:"packaging_components",baseCostContribution:.28,qualityImportance:.1}],retailAffinity:{stylehouse:1.14,toy_kingdom:1.15,value_dept:1.22,megazon:1.08,own_web:.98},lifecycle:{lifetimeDays:900,repeatPurchase:.72,purchaseCycleDays:100,shelfLifeDays:null,trend:"moderate",hitVolatility:.4,seasonality:"back_to_school",obsolescence:.2},capabilities:{fashion_design:.55,textiles:.7,safety:.65,licensing:.8},designFacets:APPAREL_FACETS,entry:{starter:false,investment:180000,days:45,blurb:"Fast replacement cycles meet parent trust and powerful character licensing."} }),
  handbag: apparel({ key:"handbag",label:"Handbag",priceBand:[45,900],categoryLean:{class:.72,gender:-.35},defaultAttributes:{style:.88,comfort:.38,durability:.72,value:.22,sustainability:.36,prestige:.92,licensed:.15},materials:[{materialId:"leather",baseCostContribution:24,qualityImportance:1},{materialId:"fabric",baseCostContribution:4.5,qualityImportance:.45},{materialId:"packaging_components",baseCostContribution:2.8,qualityImportance:.45}],storage:{profile:"secure",spacePerUnit:.9},retailAffinity:{stylehouse:1.38,glamour_dept:1.35,heritage_dept:1.18,own_web:1.08,megazon:.82,value_dept:.55},lifecycle:{lifetimeDays:2160,repeatPurchase:.2,purchaseCycleDays:420,shelfLifeDays:null,trend:"trend_driven",hitVolatility:.58,seasonality:"fashion",obsolescence:.3},capabilities:{fashion_design:1,leathercraft:1,luxury_merchandising:1,quality_control:.8},designFacets:APPAREL_FACETS,entry:{starter:false,investment:650000,days:95,blurb:"A prestige category where craftsmanship and scarcity can support exceptional margins."} }),

  headphones: electronicsProduct({key:"headphones",label:"Headphones",priceBand:[35,450],categoryLean:{age:-.15,class:.25},defaultAttributes:{performance:.82,reliability:.7,ease_of_use:.68,design:.7,ecosystem:.42,value:.48,privacy:.45},materials:[{materialId:"electronics",baseCostContribution:12,qualityImportance:.8},{materialId:"semiconductors",baseCostContribution:7.5,qualityImportance:.9},{materialId:"plastic_resin",baseCostContribution:3.5,qualityImportance:.5},{materialId:"fabric",baseCostContribution:2.2,qualityImportance:.65}],retailAffinity:{techworld:1.38,gamegrid:1.12,megazon:1.2,own_web:1.06,value_dept:.9},lifecycle:{lifetimeDays:1260,repeatPurchase:.18,purchaseCycleDays:540,shelfLifeDays:null,trend:"moderate",hitVolatility:.42,seasonality:"christmas",obsolescence:.42},capabilities:{audio_engineering:1,industrial_design:.75,reliability_testing:.65},designFacets:ELECTRONICS_FACETS,entry:{starter:true,investment:0,days:0,blurb:"A broad audio battleground spanning budget utility and audiophile performance."} }),
  earbuds: electronicsProduct({key:"earbuds",label:"Wireless Earbuds",priceBand:[25,320],categoryLean:{age:-.35,class:.2,geography:.2},defaultAttributes:{performance:.72,reliability:.62,ease_of_use:.78,design:.82,ecosystem:.65,value:.46,privacy:.38},materials:[{materialId:"electronics",baseCostContribution:8.5,qualityImportance:.8},{materialId:"semiconductors",baseCostContribution:6.8,qualityImportance:.95},{materialId:"batteries",baseCostContribution:3.4,qualityImportance:.85},{materialId:"plastic_resin",baseCostContribution:1.5,qualityImportance:.45}],retailAffinity:{techworld:1.4,megazon:1.24,own_web:1.1,gamegrid:1.02,value_dept:.92},lifecycle:{lifetimeDays:720,repeatPurchase:.2,purchaseCycleDays:420,shelfLifeDays:null,trend:"trend_driven",hitVolatility:.55,seasonality:"christmas",obsolescence:.66},capabilities:{audio_engineering:.8,wireless:.9,battery_engineering:.75,industrial_design:.9},designFacets:ELECTRONICS_FACETS,entry:{starter:true,investment:0,days:0,blurb:"Compact, fashionable and brutally competitive—battery, reliability and ecosystem all matter."} }),
  smartwatch: electronicsProduct({key:"smartwatch",label:"Smartwatch",priceBand:[70,650],categoryLean:{age:-.2,class:.35},defaultAttributes:{performance:.72,reliability:.68,ease_of_use:.72,design:.78,ecosystem:.88,value:.36,privacy:.55},materials:[{materialId:"electronics",baseCostContribution:18,qualityImportance:.7},{materialId:"semiconductors",baseCostContribution:18,qualityImportance:1},{materialId:"sensors",baseCostContribution:12,qualityImportance:.95},{materialId:"batteries",baseCostContribution:5.5,qualityImportance:.8}],storage:{profile:"secure",spacePerUnit:.35},retailAffinity:{techworld:1.42,sportcore:1.15,megazon:1.18,own_web:1.1,glamour_dept:1.02},lifecycle:{lifetimeDays:720,repeatPurchase:.12,purchaseCycleDays:650,shelfLifeDays:null,trend:"trend_driven",hitVolatility:.58,seasonality:"christmas",obsolescence:.75},capabilities:{wearables:1,sensors:1,software:.9,battery_engineering:.75,privacy:.6},designFacets:ELECTRONICS_FACETS,entry:{starter:false,investment:650000,days:100,blurb:"Sensors and software create ecosystem lock-in—but rapid obsolescence punishes delays."} }),
  controller: electronicsProduct({key:"controller",label:"Gaming Controller",priceBand:[30,220],categoryLean:{age:-.45,gender:.35},defaultAttributes:{performance:.84,reliability:.76,ease_of_use:.65,design:.72,ecosystem:.82,value:.52,privacy:.22},materials:[{materialId:"electronics",baseCostContribution:9.5,qualityImportance:.75},{materialId:"semiconductors",baseCostContribution:5.5,qualityImportance:.8},{materialId:"sensors",baseCostContribution:4.2,qualityImportance:.9},{materialId:"plastic_resin",baseCostContribution:3.6,qualityImportance:.65}],manufacturingFamilies:["electronics_assembly","plastic_molding","assembly"],retailAffinity:{gamegrid:1.5,techworld:1.28,megazon:1.22,own_web:1.08,value_dept:.96},lifecycle:{lifetimeDays:1440,repeatPurchase:.16,purchaseCycleDays:600,shelfLifeDays:null,trend:"moderate",hitVolatility:.45,seasonality:"christmas",obsolescence:.48},capabilities:{gaming:.9,ergonomics:1,reliability_testing:.85,wireless:.6},designFacets:ELECTRONICS_FACETS,entry:{starter:false,investment:360000,days:70,blurb:"Ergonomics, latency and platform compatibility define a loyal enthusiast category."} }),
  smartspeaker: electronicsProduct({key:"smartspeaker",label:"Smart Speaker",priceBand:[35,350],categoryLean:{family:.35,class:.15},defaultAttributes:{performance:.65,reliability:.72,ease_of_use:.88,design:.68,ecosystem:.9,value:.52,privacy:.42},materials:[{materialId:"electronics",baseCostContribution:11,qualityImportance:.75},{materialId:"semiconductors",baseCostContribution:8.5,qualityImportance:.85},{materialId:"sensors",baseCostContribution:3.5,qualityImportance:.65},{materialId:"plastic_resin",baseCostContribution:3.2,qualityImportance:.45}],retailAffinity:{techworld:1.35,hometech:1.38,megazon:1.25,own_web:1.02,value_dept:.95},lifecycle:{lifetimeDays:1080,repeatPurchase:.2,purchaseCycleDays:520,shelfLifeDays:null,trend:"moderate",hitVolatility:.38,seasonality:"christmas",obsolescence:.58},capabilities:{audio_engineering:.65,software:1,ecosystem:1,privacy:.75},designFacets:ELECTRONICS_FACETS,entry:{starter:false,investment:480000,days:85,blurb:"Ease and ecosystem drive adoption while privacy choices shape trust."} }),
  homesecurity: electronicsProduct({key:"homesecurity",label:"Home Security",priceBand:[60,600],categoryLean:{age:.2,family:.55,class:.25},defaultAttributes:{performance:.7,reliability:.95,ease_of_use:.72,design:.52,ecosystem:.8,value:.42,privacy:.92},materials:[{materialId:"electronics",baseCostContribution:14,qualityImportance:.75},{materialId:"semiconductors",baseCostContribution:10,qualityImportance:.8},{materialId:"sensors",baseCostContribution:12,qualityImportance:1},{materialId:"plastic_resin",baseCostContribution:3.4,qualityImportance:.4}],manufacturingFamilies:["electronics_assembly","plastic_molding","assembly"],storage:{profile:"secure",spacePerUnit:.75},retailAffinity:{hometech:1.5,techworld:1.28,megazon:1.14,own_web:1.1,corner_health:.78},lifecycle:{lifetimeDays:2160,repeatPurchase:.08,purchaseCycleDays:900,shelfLifeDays:null,trend:"evergreen",hitVolatility:.3,seasonality:"flat",obsolescence:.38},capabilities:{sensors:1,reliability_testing:1,software:.9,privacy:1},designFacets:ELECTRONICS_FACETS,entry:{starter:false,investment:780000,days:110,blurb:"Trust, uptime and privacy dominate a slower-moving, high-stakes category."} }),
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
