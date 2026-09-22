import { INDUSTRIES } from "./industries";
import type { World } from "./types";
import { sanitizeOperatingRooms, syncDerivedDepartments } from "./infrastructure";
import { qualityToStars } from "./productDesign";
import { DEFAULT_SUPPLIER_ID } from "./suppliers";
import { deriveSkuChannels } from "./distribution";
import { enrichLegacyPerson } from "./people";
import { ensureChronicle, migrateChronicleFromLegacy } from "./chronicle";
import { refreshCorporateCapabilities, syncPrimaryBusinessLegacy } from "./businesses";
import { STARTER_CATEGORIES } from "./growth";
import { defaultFactoryFamiliesForIndustry, defaultMaterialPriceIndex } from "./productCatalog";
import { bindPrimaryMarketAliases, ensureIndustryMarket } from "./markets";
import { deriveSafetyScore, ensureInventoryLots } from "./productDynamics";
import { ensureIPFoundation } from "./ip";
import { TICKS_PER_YEAR } from "./types";
import { ensureBrandVisual } from "./brands";

export const SAVE_SCHEMA_VERSION = 13;
export const AUTOSAVE_KEY = "market-sim:autosave";

interface SaveEnvelopeV10 {
  version: 13;
  savedAt: number;
  world: World;
}

export function saveWorld(world: World) {
  if (typeof localStorage === "undefined") return;
  const payload: SaveEnvelopeV10 = { version: SAVE_SCHEMA_VERSION, savedAt: Date.now(), world };
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
}

export function hasAutosave(): boolean {
  if (typeof localStorage === "undefined") return false;
  return Boolean(localStorage.getItem(AUTOSAVE_KEY));
}

export function clearAutosave() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(AUTOSAVE_KEY);
}

function migrateWorld(rawWorld: unknown, version: number): World | null {
  if (!rawWorld || typeof rawWorld !== "object") return null;
  const world = rawWorld as World;
  const cfg = INDUSTRIES[world.industryId];
  if (!cfg) return null;
  world.cfg = cfg;

  // v1 -> v2: the player-facing product model changed from continuous sliders
  // to positioning / target / 1–5 star manufacturing decisions. Existing products
  // retain their actual simulation values and receive sensible display metadata.
  if (version <= 1) {
    for (const sku of world.player.skus ?? []) {
      const legacyDepth = (sku as any).designDepth as string;
      if (legacyDepth === "normal") (sku as any).designDepth = "standard";
      else if (legacyDepth === "detailed") (sku as any).designDepth = "advanced";
      else if (legacyDepth !== "quick" && legacyDepth !== "standard" && legacyDepth !== "advanced" && legacyDepth !== "breakthrough") (sku as any).designDepth = "standard";
      sku.manufacturingStars = sku.manufacturingStars ?? qualityToStars(sku.quality);
      sku.positioning = sku.positioning ?? "mainstream";
      sku.targetLabel = sku.targetLabel ?? "Legacy target";
    }
  }

  // v2 -> v3: complete operating loop. Outsourced SKUs get an explicit supplier,
  // stock-out history is tracked per SKU, campaigns gain real scope, and channels are
  // derived from concrete partner assignments instead of being independently editable.
  if (version <= 2) {
    for (const sku of world.player.skus ?? []) {
      sku.supplierId = sku.method === "outsource" ? (sku.supplierId ?? DEFAULT_SUPPLIER_ID) : null;
      sku.unitsLostTotal = sku.unitsLostTotal ?? 0;
      // Old saves stored only channel types. Preserve their routes to market by mapping
      // those channels onto any already-signed concrete partners before channels become derived.
      if (!sku.assignedPartnerIds?.length && sku.channels?.length) {
        sku.assignedPartnerIds = (world.player.contracts ?? [])
          .filter((c) => sku.channels.includes(c.type))
          .map((c) => c.partnerId);
      } else {
        sku.assignedPartnerIds = sku.assignedPartnerIds ?? [];
      }
    }
    for (const camp of world.activeCampaigns ?? []) camp.scope = camp.scope ?? "company";
  }


  // v3 -> v4: named people gain careers, attributes and a persistent talent market.
  // Existing staff are enriched in place so old companies keep the same employees.
  if (version <= 3) {
    world.player.personnel = (world.player.personnel ?? []).map((p) => enrichLegacyPerson(p, world.tick, cfg));
    world.player.formerPersonnel = world.player.formerPersonnel ?? [];
    world.player.talentMarket = world.player.talentMarket ?? [];
    world.player.talentMarketRefreshTick = world.player.talentMarketRefreshTick ?? world.tick;
    for (const sku of world.player.skus ?? []) {
      if (!sku.assignedPmName && sku.assignedPmId) sku.assignedPmName = world.player.personnel.find((p) => p.id === sku.assignedPmId)?.name;
      sku.leadHistory = sku.leadHistory ?? (sku.assignedPmId && sku.assignedPmName ? [{ personId: sku.assignedPmId, personName: sku.assignedPmName, fromTick: 0 }] : []);
    }
  } else {
    world.player.personnel = (world.player.personnel ?? []).map((p) => enrichLegacyPerson(p, world.tick, cfg));
    world.player.formerPersonnel = world.player.formerPersonnel ?? [];
    world.player.talentMarket = world.player.talentMarket ?? [];
    world.player.talentMarketRefreshTick = world.player.talentMarketRefreshTick ?? world.tick;
  }

  // v4 -> v5: permanent Company Chronicle. Reconstruct product launches and careers from
  // data already present in old saves; new events are tracked exactly from this point onward.
  if (version <= 4 || !world.chronicle) world.chronicle = migrateChronicleFromLegacy(world);
  else ensureChronicle(world);

  // v5 -> v6: real multi-brand portfolios + category expansion. Legacy saves had one
  // top-level brand and company-wide category equity; wrap both into the initial brand so
  // existing products retain their identity and earned reputation.
  if (version <= 5 || !world.brands?.length) {
    const legacy = (world as any).brand ?? { name: world.company, color: "#7c3aed", positioning: "mass" };
    const initialBrand = { id: "brand_0", name: legacy.name || world.company, color: legacy.color || "#7c3aed", positioning: legacy.positioning || "mass", createdTick: 0, industryId: world.industryId };
    world.brands = [initialBrand];
    world.primaryBrandId = initialBrand.id;
    for (const sku of world.player.skus ?? []) sku.brandId = sku.brandId ?? initialBrand.id;
    const legacyEquity: any = world.brandEquity ?? {};
    const looksNestedByBrand = Boolean(legacyEquity[initialBrand.id]) || Object.keys(legacyEquity).some((k) => k.startsWith("brand_"));
    if (!looksNestedByBrand) world.brandEquity = { [initialBrand.id]: legacyEquity };
    for (const camp of world.activeCampaigns ?? []) if (camp.scope === "brand") camp.scope = `brand:${initialBrand.id}`;
    delete (world as any).brand;
  }
  world.primaryBrandId = world.primaryBrandId ?? world.brands[0]?.id ?? "brand_0";
  world.brandEquity = world.brandEquity ?? {};
  for (const brand of world.brands) {
    brand.createdTick = brand.createdTick ?? 0;
    brand.industryId = brand.industryId ?? world.industryId;
    ensureBrandVisual(brand);
    world.brandEquity[brand.id] = world.brandEquity[brand.id] ?? {};
  }
  for (const sku of world.player.skus ?? []) { sku.brandId = sku.brandId ?? world.primaryBrandId; sku.industryId = sku.industryId ?? world.industryId; }

  if (!world.player.unlockedCategories?.length) {
    const legacyAccess = world.cfg.id === "skincare"
      ? ["moisturizer", "serum", "cleanser", "antiaging", "hydration"]
      : world.cfg.products.map((p) => p.key);
    world.player.unlockedCategories = Array.from(new Set([...legacyAccess, ...(world.player.skus ?? []).map((s) => s.productKey)]));
  }
  world.player.categoryExpansionProjects = world.player.categoryExpansionProjects ?? [];

  // v6 -> v7: multi-industry foundation. The existing industry becomes the first
  // active business; category state is wrapped per industry while legacy aliases remain
  // available to the v0.80 single-industry simulation during this foundation batch.
  if (version <= 6 || !world.player.businesses) {
    world.player.businesses = {
      [world.industryId]: {
        industryId: world.industryId, status: "active", enteredTick: 0,
        unlockedCategories: [...world.player.unlockedCategories],
        categoryExpansionProjects: [...world.player.categoryExpansionProjects],
        capabilities: {},
      },
    };
  }
  world.player.industryEntryProjects = world.player.industryEntryProjects ?? [];
  world.player.corporateCapabilities = world.player.corporateCapabilities ?? { finance: 0, strategy: 0, marketing: 0, operations: 0, retail: 0, people: 0 };
  for (const [industryId, business] of Object.entries(world.player.businesses)) {
    if (!business) continue;
    business.industryId = industryId;
    business.status = business.status ?? "active";
    business.enteredTick = business.enteredTick ?? 0;
    business.unlockedCategories = business.unlockedCategories?.length ? business.unlockedCategories : [...(STARTER_CATEGORIES[industryId] ?? INDUSTRIES[industryId]?.products.slice(0, 2).map(p => p.key) ?? [])];
    business.categoryExpansionProjects = business.categoryExpansionProjects ?? [];
    business.capabilities = business.capabilities ?? {};
  }
  syncPrimaryBusinessLegacy(world);
  refreshCorporateCapabilities(world);

  // v7 -> v8: data-driven Product Engine. Material markets are now a world-level input shared
  // by every product archetype. Existing products retain their booked unit cost; future batches
  // recalculate through the registry whenever manufacturing setup/quality is changed.
  const baselineMaterials = defaultMaterialPriceIndex();
  world.materialPriceIndex = { ...baselineMaterials, ...(world.materialPriceIndex ?? {}) };
  for (const room of world.player.operatingRooms ?? []) {
    room.upgradeLevel = room.upgradeLevel ?? 1;
    if (room.kind === "factory" && !room.manufacturingFamilies?.length) room.manufacturingFamilies = defaultFactoryFamiliesForIndustry(world.industryId);
    if (room.kind === "warehouse" && !room.storageProfiles?.length) room.storageProfiles = ["standard"];
  }

  // v8 -> v9: generic multi-industry market runtimes + universal lifecycle modules.
  // Existing primary market arrays become the primary runtime by reference; any already-active
  // secondary business gets a clean market runtime. Inventory becomes FIFO lots for ageing.
  if (version <= 8 || !world.industryMarkets) {
    world.industryMarkets = world.industryMarkets ?? {};
    world.industryMarkets[world.industryId] = {
      industryId: world.industryId, cube: world.cube, comps: world.comps, customers: world.customers ?? {},
      brandEquity: world.brandEquity ?? {}, fitCache: world.fitCache ?? {}, fitCacheDirty: true,
      unitsTickHistory: world.unitsTickHistory ?? [], marketTickHistory: world.marketTickHistory ?? [],
    };
  }
  for (const [industryId, business] of Object.entries(world.player.businesses ?? {})) {
    if (business?.status === "active") ensureIndustryMarket(world, industryId);
  }
  bindPrimaryMarketAliases(world);
  for (const sku of world.player.skus ?? []) {
    sku.testingLevel = sku.testingLevel ?? "standard";
    sku.marketMomentum = sku.marketMomentum ?? 1;
    sku.peakMomentum = sku.peakMomentum ?? sku.marketMomentum;
    sku.breakout = sku.breakout ?? false;
    sku.recallCount = sku.recallCount ?? 0;
    sku.designFacets = sku.designFacets ?? {};
    sku.safetyScore = sku.safetyScore ?? deriveSafetyScore(sku.productKey, sku.testingLevel, sku.designQuality, sku.quality);
    ensureInventoryLots(sku, world.tick);
  }

  // v9 -> v10: universal IP is now a first-class world entity. Old fixed license keys are
  // mapped into the new external IP catalog and grandfathered into a 3-year contract so a
  // v0.96 company never silently loses a licensed product when it is loaded in 8C.
  ensureIPFoundation(world);
  for (const sku of world.player.skus ?? []) {
    const legacyLicense = (sku as any).license as string | null | undefined;
    sku.ipId = sku.ipId ?? legacyLicense ?? null;
    if (legacyLicense && !world.ipLicenses.some((c) => c.ipId === legacyLicense && c.status === "active" && c.expiresTick > world.tick)) {
      const ip = world.ipAssets.find((asset) => asset.id === legacyLicense);
      if (ip?.ownerType === "external") {
        world.ipLicenses.push({
          id: `legacy_iplic_${legacyLicense}_${world.tick}`, ipId: legacyLicense, licensorName: ip.ownerName,
          signedTick: world.tick, expiresTick: world.tick + 3 * TICKS_PER_YEAR, durationYears: 3,
          royaltyRate: ip.marketTerms?.royaltyRate ?? .06, minimumGuarantee: 0, status: "active", royaltiesPaid: 0,
        });
      }
    }
    sku.license = null;
  }
  for (const market of Object.values(world.industryMarkets ?? {})) if (market) market.fitCacheDirty = true;

  // v10 -> v11: Batch 9 difficulty and expectation state. Existing companies migrate to Standard
  // so their market economics do not change unexpectedly beyond the new universal fit model.
  world.difficulty = world.difficulty ?? "standard";
  world.investorConfidence = world.investorConfidence ?? 1;
  world.expectationStrikes = world.expectationStrikes ?? 0;

  // v11 -> v12: campus-first gameplay, agency recruiting and explicit commercial launch.
  // Existing active products remain live; new products can hold finished inventory before release.
  world.player.talentSearch = world.player.talentSearch ?? null;
  const founder = world.player.operatingRooms?.find((r) => r.id === "founder-office");
  if (founder) {
    founder.team = "product";
    founder.capacity = Math.max(1, founder.assignedPersonnelIds?.length ?? 0);
  }
  for (const sku of world.player.skus ?? []) {
    sku.releasedToMarket = sku.releasedToMarket ?? (sku.status === "active");
    sku.version = sku.version ?? 1;
    sku.parentSkuId = sku.parentSkuId ?? null;
  }

  // Keep product-lead lineage even after transfers, departures and save migrations.
  for (const sku of world.player.skus ?? []) {
    if (!sku.assignedPmName && sku.assignedPmId) sku.assignedPmName = world.player.personnel.find((p) => p.id === sku.assignedPmId)?.name;
    sku.leadHistory = sku.leadHistory ?? (sku.assignedPmId && sku.assignedPmName ? [{ personId: sku.assignedPmId, personName: sku.assignedPmName, fromTick: 0 }] : []);
    deriveSkuChannels(world, sku);
  }
  world.player.backOffice = 0;
  world.player.backOfficeTarget = 0;
  world.player.operatingRooms = sanitizeOperatingRooms(world, world.player.operatingRooms ?? []);
  syncDerivedDepartments(world);
  world.fitCacheDirty = true;
  return world;
}

export function loadWorld(): World | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; world?: unknown };
    const version = Number(parsed.version ?? 0);
    if (!parsed.world || version < 1 || version > SAVE_SCHEMA_VERSION) return null;
    return migrateWorld(parsed.world, version);
  } catch {
    return null;
  }
}
