import type { World, Brand, SKU, Competitor, AxisKey, DifficultyId, ProductProjectTier } from "./types";
import { computeProductRarity, DESIGN_DEPTHS, PRODUCT_PROJECT_TIERS } from "./types";
import { INDUSTRIES, AXES, axisPos, clamp } from "./industries";
import { buildCube } from "./cube";
import { deriveUnitCost, deriveQuality } from "./economics";
import { DEFAULT_SUPPLIER_ID, supplierById } from "./suppliers";
import { ensureBrandVisual } from "./brands";
import { manufacturingStandard } from "./productDesign";
import { presetSegments } from "./segments";

import { createChronicle } from "./chronicle";
import { STARTER_CATEGORIES } from "./growth";
import { archetypeByKey, defaultMaterialPriceIndex } from "./productCatalog";
import { createIndustryMarket } from "./markets";
import { applyFacetSelections, deriveSafetyScore, TESTING_LEVELS } from "./productDynamics";
import { seedExternalIPs } from "./ip";
import { difficultyConfig } from "./difficulty";

export const STUDY_DEFS: Record<string, { label: string; cost: number; ticks: number; blurb: string }> = {
  market_map: { label: "Population Map Scan", cost: 60000, ticks: 14, blurb: "Reveals headcount + spend across the whole cube." },
  gap_analysis: { label: "Gap Analysis", cost: 90000, ticks: 18, blurb: "Finds cells with high market but weak brand fit — niches." },
  competitor_benchmark: { label: "Competitor Benchmark", cost: 120000, ticks: 24, blurb: "Rivals' price, personality & margin vs. yours." },
  product_diagnosis: { label: "Post-Launch Product Study", cost: 45_000, ticks: 12, blurb: "Diagnoses Product / Price / Channel / Brand / IP fit and explains what is suppressing demand." },
  market_report: { label: "Market Report", cost: 150000, ticks: 30, blurb: "Category growth, competitor count, market concentration (top-3 share, who controls 60%), and directional trends." },
};

export function initWorld(industryId: string, company: string, brand: Brand | null = null, difficulty: DifficultyId = "standard"): World {
  const difficultyDef = difficultyConfig(difficulty);
  const startCash = difficultyDef.startingCash;
  const cfg = INDUSTRIES[industryId];
  const primaryMarket = createIndustryMarket(industryId);
  const cube = primaryMarket.cube;
  const comps = primaryMarket.comps;

  const initialBrand: Brand | null = brand ? ensureBrandVisual({ ...brand, id: brand.id || "brand_0", createdTick: 0, industryId }) : null;
  const world: World = {
    difficulty, investorConfidence: 1, expectationStrikes: 0,
    industryId, cfg, tick: 0, company, brands: initialBrand ? [initialBrand] : [], primaryBrandId: initialBrand?.id ?? "", cube, comps,
    player: {
      skus: [], contracts: [], marketing: 0, marketingTarget: 0, marketingFocus: "all",
      brandMarketing: 0, brandMarketingTarget: 0,
      backOffice: 0, backOfficeTarget: 0, cash: startCash, debt: 0, lostSales: 0, receivables: [],
      financeDept: 0, intelDept: 0,
      personnel: [], formerPersonnel: [], talentMarket: [], talentMarketRefreshTick: 0, talentSearch: null,
      expertise: { industry: {}, category: {} },
      vision: null,
      operatingRooms: [],
      campusPaths: [{ x: 2, y: 44 }, { x: 3, y: 44 }],
      unlockedCategories: [...(STARTER_CATEGORIES[industryId] ?? cfg.products.slice(0, 2).map((p) => p.key))],
      categoryExpansionProjects: [],
      businesses: {
        [industryId]: {
          industryId, status: "active", enteredTick: 0,
          unlockedCategories: [...(STARTER_CATEGORIES[industryId] ?? cfg.products.slice(0, 2).map((p) => p.key))],
          categoryExpansionProjects: [], capabilities: {},
        },
      },
      industryEntryProjects: [],
      corporateCapabilities: { finance: 0, strategy: 0, marketing: 0, operations: 0, retail: 0, people: 0 },
      research: { completed: [], active: null, lifetimePoints: 0 },
    },
    studies: [], revealed: {}, history: [], events: [],
    chronicle: createChronicle(company, cfg.label, startCash),
    ipAssets: seedExternalIPs(), ipLicenses: [],
    pendingShockTick: 80 + Math.floor(Math.random() * 80), shock: null,
    live: null, selectedCell: null, selectedInfo: null,
    fitCache: {}, fitCacheDirty: true,
    savedSegments: presetSegments(),
    brandEquity: primaryMarket.brandEquity,
    customers: primaryMarket.customers,
    activeCampaigns: [],
    agencyRelationships: {},
    materialPriceIndex: defaultMaterialPriceIndex(),
    industryMarkets: { [industryId]: primaryMarket },
    unitsTickHistory: primaryMarket.unitsTickHistory, marketTickHistory: primaryMarket.marketTickHistory,
  };
  return world;
}

export interface ProductSpec {
  name: string;
  productKey: string;
  brandId: string;
  method: "outsource" | "own";
  supplierId?: string | null;
  manufacturingStars: number;
  listPrice: number;
  target: Record<AxisKey, number>;
  targetLabel: string;
  positioning: string;
  attributes: Record<string, number>;
  packaging?: string;
  channels?: import("./types").ChannelType[];
  pmSkill?: number;
  pmId?: string;
  pmName?: string;
  designDepth?: import("./types").DesignDepth;
  projectTier?: ProductProjectTier;
  designerIds?: string[];
  testingLevel?: import("./types").ProductTestingLevel;
  designFacets?: Record<string, string>;
  ipId?: string | null;
  version?: number;
  parentSkuId?: string | null;
}

export function buildSku(w: World, spec: ProductSpec, id: string, tick = 0, expertise = 0): SKU {
  const archetype = archetypeByKey(spec.productKey);
  const cfg = INDUSTRIES[archetype?.industryId ?? w.industryId] ?? w.cfg;
  const pt = cfg.products.find((p) => p.key === spec.productKey)!;
  const mfg = manufacturingStandard(spec.manufacturingStars);
  const supplierId = spec.method === "outsource" ? (spec.supplierId ?? DEFAULT_SUPPLIER_ID) : null;
  const supplier = spec.method === "outsource" ? supplierById(supplierId) : null;
  const unitCost = deriveUnitCost(pt, spec.method, mfg.materialQuality, mfg.productionQuality, supplier?.costMult ?? 1, w.materialPriceIndex);
  const quality = deriveQuality(mfg.materialQuality, mfg.productionQuality, supplier?.qualityAdj ?? 0);
  const projectTier = spec.projectTier ?? (spec.designDepth === "breakthrough" ? "AAA" : spec.designDepth === "advanced" ? "AA" : "A");
  const tierDef = PRODUCT_PROJECT_TIERS[projectTier];
  const depth = spec.designDepth ?? (projectTier === "AAA" ? "breakthrough" : projectTier === "AA" ? "advanced" : "standard");
  const depthDef = DESIGN_DEPTHS[depth];
  const faceted = applyFacetSelections(spec.productKey, spec.target, spec.attributes, spec.designFacets);
  const attrSpread = Object.values(faceted.attributes).length > 0
    ? Math.max(...Object.values(faceted.attributes)) - Math.min(...Object.values(faceted.attributes))
    : 0;
  const designQuality = clamp(Math.min(tierDef.designQualityCap, (0.2 + attrSpread * 0.3 + (spec.pmSkill ?? 0.2) * 0.3 + expertise * 0.04) * depthDef.qualityMult), 0, 1);
  const testingLevel = spec.testingLevel ?? "standard";
  const testDef = TESTING_LEVELS[testingLevel];
  const safetyScore = deriveSafetyScore(spec.productKey, testingLevel, designQuality, quality);
  const rarityScore = quality * 0.3 + designQuality * 0.4 + expertise * 0.06;
  return {
    id, name: spec.name, productKey: spec.productKey, brandId: spec.brandId, industryId: cfg.id, method: spec.method, supplierId,
    target: faceted.target,
    targetLabel: spec.targetLabel,
    designFacets: spec.designFacets ?? {},
    testingLevel, safetyScore, recallCount: 0, marketMomentum: 1, peakMomentum: 1, breakout: false,
    positioning: spec.positioning,
    manufacturingStars: Math.max(1, Math.min(5, Math.round(spec.manufacturingStars))),
    // lifecycle: starts in "designing" state, no inventory, PM locked
    status: "designing",
    assignedPmId: spec.pmId ?? null,
    assignedPmName: spec.pmName,
    leadHistory: spec.pmId && spec.pmName ? [{ personId: spec.pmId, personName: spec.pmName, fromTick: tick }] : [],
    designDepth: depth,
    projectTier,
    assignedDesignerIds: [...(spec.designerIds ?? [])],
    designDaysLeft: Math.ceil(tierDef.baseDays * testDef.timeMult),
    mfgDaysLeft: 0,
    mfgBatchSize: 0,
    // quality
    quality, designQuality, perceivedQuality: quality,
    novelty: 1.0, fame: 0, rarity: computeProductRarity(rarityScore),
    lifetimeDays: pt.lifetimeDays, launchTick: 0, releasedToMarket: false, version: spec.version ?? 1, parentSkuId: spec.parentSkuId ?? null,
    // economics: zero inventory until manufactured
    unitCost: unitCost * testDef.costMult, listPrice: spec.listPrice, priceSens: 1.0, inventory: 0, inventoryLots: [],
    // Digital readiness is now a hidden execution outcome rather than a player slider.
    online: depth === "breakthrough" ? 0.9 : depth === "advanced" ? 0.78 : depth === "standard" ? 0.65 : 0.5,
    unitsSoldTotal: 0, unitsLostTotal: 0, contributionTotal: 0,
    attributes: faceted.attributes, packaging: spec.packaging ?? "standard",
    channels: spec.channels ?? [], assignedPartnerIds: [], ipId: spec.ipId ?? null, license: null,
  };
}

export const normAxis = (axis: AxisKey, val: string) => axisPos(axis, AXES[axis].indexOf(val));
