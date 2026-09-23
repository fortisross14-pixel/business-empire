import type { ProductProjectTier, SKU, World } from "./types";
import { supplierById, supplierSupportsProduct } from "./suppliers";
import { archetypeByKey, storageProfileForProduct, storageSpaceForProduct, STORAGE_PROFILES } from "./productCatalog";
import { teamEffectiveness } from "./people";
import { roleFitsRoom } from "./infrastructure";
import { hasResearch } from "./research";

const mapped = (w: World, kind: string) => w.player.operatingRooms.filter((r) => r.kind === kind);

export function pmCapacity(w: World): number {
  return mapped(w, "office")
    .filter((r) => r.team === "product" || r.id === "founder-office")
    .reduce((sum, r) => sum + Math.max(0, r.capacity - (r.id === "founder-office" ? 1 : 0)), 0);
}

export function warehouseUnitCapacity(w: World, productKey?: string): number {
  const required = productKey ? storageProfileForProduct(productKey) : null;
  return mapped(w, "warehouse")
    .filter((r) => !required || (r.storageProfiles ?? ["standard"]).includes(required))
    .reduce((sum, r) => sum + r.capacity, 0);
}

export function warehouseCapacity(w: World): number {
  return Math.max(0, Math.floor(warehouseUnitCapacity(w) / 10_000));
}

export function factoryCapacity(w: World, productKey?: string): { onshore: number; offshore: number; total: number } {
  if (teamEffectiveness(w, "operations") <= 0) return { onshore: 0, offshore: 0, total: 0 };
  const factories = mapped(w, "factory");
  if (!productKey) {
    const total = factories.reduce((sum, r) => sum + r.capacity, 0);
    return { onshore: total, offshore: 0, total };
  }
  const archetype = archetypeByKey(productKey);
  if (!archetype) {
    const total = factories.reduce((sum, r) => sum + r.capacity, 0);
    return { onshore: total, offshore: 0, total };
  }
  // A product can flow through multiple facilities/lines. Capacity is the bottleneck across
  // all required manufacturing families, not a requirement that one building do everything.
  const familyCaps = archetype.manufacturingFamilies.map((family) =>
    factories.filter((r) => (r.manufacturingFamilies ?? []).includes(family)).reduce((sum, r) => sum + r.capacity, 0),
  );
  const total = familyCaps.length ? Math.min(...familyCaps) : 0;
  return { onshore: total, offshore: 0, total };
}

export function outsourcingCapacity(w: World): number {
  if (teamEffectiveness(w, "operations") <= 0) return 0;
  const dedicated = mapped(w, "outsourcing").reduce((sum, r) => sum + r.capacity, 0);
  const founder = w.player.operatingRooms.find((r) => r.id === "founder-office");
  const starterSourcing = founder?.assignedPersonnelIds.some((id) => w.player.personnel.find((p) => p.id === id)?.role === "operations") ? 50_000 : 0;
  return dedicated + starterSourcing;
}

export function productionCapacity(w: World, method: "own" | "outsource", supplierId?: string | null, productKey?: string): number {
  if (method === "own") return factoryCapacity(w, productKey).total;
  const officeCap = outsourcingCapacity(w);
  if (officeCap <= 0) return 0;
  const supplier = supplierById(supplierId);
  if (productKey && !supplierSupportsProduct(supplier, productKey)) return 0;
  return Math.min(officeCap, supplier.monthlyCapacity);
}

export function productionLeadDays(w: World, sku: Pick<SKU, "method" | "supplierId" | "productKey">, qty: number): number {
  const cap = productionCapacity(w, sku.method, sku.supplierId, sku.productKey);
  if (cap <= 0) return 999;
  const leadMult = sku.method === "outsource" ? supplierById(sku.supplierId).leadTimeMult : 1;
  const ops = teamEffectiveness(w, "operations");
  // Strong operations teams shorten planning/coordination lead time by up to ~18%.
  const peopleMult = 1 - ops * .18;
  return Math.min(120, Math.max(3, Math.ceil((qty / cap) * 30 * leadMult * peopleMult)));
}

export function inventoryUsed(w: World): number {
  // Warehouse capacity is now measured in standard-storage equivalents. A bulky plush toy can
  // consume 2x the space of a baseline unit while a compact face mask can consume less.
  return w.player.skus.reduce((sum, s) => sum + (s.inventory + s.mfgBatchSize) * storageSpaceForProduct(s.productKey), 0);
}

export function inventoryPhysicalUnits(w: World): number {
  return w.player.skus.reduce((sum, s) => sum + s.inventory + s.mfgBatchSize, 0);
}

export function inventoryUsedForStorageProfile(w: World, productKey: string): number {
  const required = storageProfileForProduct(productKey);
  return w.player.skus
    .filter((s) => storageProfileForProduct(s.productKey) === required)
    .reduce((sum, s) => sum + (s.inventory + s.mfgBatchSize) * storageSpaceForProduct(s.productKey), 0);
}

export function pmAssignments(w: World) {
  const productRooms = w.player.operatingRooms.filter((r) => r.kind === "office" && (r.team === "product" || r.id === "founder-office"));
  const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const pms = w.player.personnel.filter((p) => p.role === "product_manager" && seated.has(p.id));
  return pms.map((pm) => {
    const assigned = w.player.skus.filter((s) => s.assignedPmId === pm.id).map((s) => s.name);
    return { pmId: pm.id, products: assigned, available: Math.max(0, 1 - assigned.filter(Boolean).length) };
  });
}


export function productProjectTierAccess(w: World, tier: ProductProjectTier): { ok: boolean; reason: string } {
  if (tier === "A") return { ok: true, reason: "" };
  if (tier === "AA" && !hasResearch(w, "advanced_product_development")) return { ok: false, reason: "Research Advanced Product Development to unlock AA programs." };
  if (tier === "AAA" && !hasResearch(w, "flagship_product_development")) return { ok: false, reason: "Research Flagship Product Development to unlock AAA programs." };
  const maxOffice = Math.max(0, ...w.player.operatingRooms.filter((r) => r.kind === "office").map((r) => r.capacity));
  if (tier === "AA" && maxOffice < 8) return { ok: false, reason: "AA projects require an 8-seat Normal Office or larger." };
  if (tier === "AAA" && maxOffice < 16) return { ok: false, reason: "AAA projects require a 16-seat Large Office or larger." };
  return { ok: true, reason: "" };
}

export function productProjectLockedPeople(w: World): Set<string> {
  const locked = new Set<string>();
  for (const sku of w.player.skus) {
    if (sku.status !== "designing") continue;
    if (sku.assignedPmId) locked.add(sku.assignedPmId);
    for (const id of sku.assignedDesignerIds ?? []) locked.add(id);
  }
  return locked;
}

export function canCreateProduct(w: World): { ok: boolean; reason: string } {
  if (!w.brands.length) return { ok: false, reason: "Create your first brand before designing a product." };
  const productRooms = mapped(w, "office").filter((r) => r.team === "product" || r.id === "founder-office");
  if (!productRooms.length) return { ok: false, reason: "Build your Founder Office or a dedicated Product office first." };
  const pms = w.player.personnel.filter((p) => p.role === "product_manager");
  if (!pms.length) return { ok: false, reason: "Hire a Product Designer and give them an office seat." };
  const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const eligible = pms.filter((p) => seated.has(p.id));
  if (!eligible.length) return { ok: false, reason: "Assign a Product Designer to an open office seat." };
  const locked = productProjectLockedPeople(w);
  if (!eligible.some((p) => !locked.has(p.id))) return { ok: false, reason: "All assigned Product Designers are busy on active product projects." };
  return { ok: true, reason: "" };
}

export function canProduce(
  w: World,
  qty: number,
  unitCost: number,
  method: "own" | "outsource" = "outsource",
  supplierId?: string | null,
  productKey?: string,
): { ok: boolean; reason: string } {
  const cost = qty * unitCost;
  if (w.player.cash < cost) return { ok: false, reason: `Not enough cash (need ${Math.round(cost).toLocaleString()}).` };
  if (productKey) {
    const profile = storageProfileForProduct(productKey);
    if (warehouseUnitCapacity(w, productKey) <= 0) {
      const label = STORAGE_PROFILES[profile]?.infrastructureLabel ?? profile;
      return { ok: false, reason: profile === "standard" ? "Build a warehouse before manufacturing this product." : `Build a warehouse and install ${label} before manufacturing this product.` };
    }
  }
  const globalFree = Math.max(0, warehouseUnitCapacity(w) - inventoryUsed(w));
  const free = productKey
    ? Math.min(globalFree, Math.max(0, warehouseUnitCapacity(w, productKey) - inventoryUsedForStorageProfile(w, productKey)))
    : globalFree;
  const requiredSpace = qty * storageSpaceForProduct(productKey ?? "");
  if (requiredSpace > free) return { ok: false, reason: `Warehouse capacity shortfall: ${Math.round(free).toLocaleString()} standard-storage units free.` };
  const cap = productionCapacity(w, method, supplierId, productKey);
  if (cap <= 0) return { ok: false, reason: method === "own" ? "Owned production requires both a compatible Factory and a seated Sourcing / Operations specialist." : "Hire and seat a Sourcing / Operations specialist. A dedicated Sourcing Office increases capacity later, but people still coordinate the suppliers." };
  if (qty > cap) return { ok: false, reason: `Batch exceeds monthly ${method === "own" ? "factory" : "supplier"} capacity of ${cap.toLocaleString()} units.` };
  return { ok: true, reason: "" };
}

export function maxManufacturableBatch(w: World, sku: Pick<SKU, "unitCost" | "method" | "supplierId" | "productKey">): number {
  const cashCap = Math.floor(w.player.cash / Math.max(0.01, sku.unitCost));
  // Specialized modules unlock handling capability; they do not create a second invisible warehouse.
  // All profiles still compete for the same physical floor space.
  const profileFree = Math.max(0, warehouseUnitCapacity(w, sku.productKey) - inventoryUsedForStorageProfile(w, sku.productKey));
  const globalFree = Math.max(0, warehouseUnitCapacity(w) - inventoryUsed(w));
  const warehouseFree = Math.min(profileFree, globalFree);
  const storageCap = Math.floor(warehouseFree / Math.max(0.05, storageSpaceForProduct(sku.productKey)));
  const cap = productionCapacity(w, sku.method, sku.supplierId, sku.productKey);
  const raw = Math.max(0, Math.min(cashCap, storageCap, cap));
  return Math.floor(raw / 1000) * 1000;
}
