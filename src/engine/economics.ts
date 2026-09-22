import type { ProductType, ProductMethod, Contract } from "./types";
import { METHODS, CHANNEL_TYPES, RETAIL_PARTNERS, clamp } from "./industries";
import { archetypeBaseCost } from "./productCatalog";

export const deriveUnitCost = (
  pt: ProductType,
  method: ProductMethod,
  m: number,
  p: number,
  supplierCostMult = 1,
  materialPriceIndex: Record<string, number> = {},
) => {
  // Product Engine: raw economics come from the Product Archetype BOM. ProductType.baseCost remains
  // a compatibility projection for old callers/saves, but material shocks can now flow through
  // a single shared registry without changing product-specific code.
  const rawMaterials = archetypeBaseCost(pt.key, materialPriceIndex) || pt.baseCost;
  return rawMaterials * (1 + m * 1.6 + p * 0.9) * METHODS[method].mult * supplierCostMult;
};

export const deriveQuality = (m: number, p: number, qualityAdj = 0) => clamp(0.55 * m + 0.45 * p + qualityAdj);

// Reach is partner-specific, not just channel-specific. This makes the named retailer
// choice matter: Megazon reaches more people than CraftBay even though both are marketplaces.
export function contractReach(contract: Contract): number {
  const t = CHANNEL_TYPES[contract.type];
  const partner = RETAIL_PARTNERS.find((p) => p.id === contract.partnerId);
  return clamp(t.baseReach * (partner?.reachMult ?? 1));
}

export function contractAwarenessBoost(contract: Contract): number {
  const partner = RETAIL_PARTNERS.find((p) => p.id === contract.partnerId);
  return partner?.awarenessBoost ?? CHANNEL_TYPES[contract.type].awarenessBoost;
}
