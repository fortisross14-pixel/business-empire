import type { SKU, World } from "./types";
import { supplierById, supplierSupportsProduct } from "./suppliers";
import { archetypeByKey, storageProfileForProduct, storageSpaceForProduct } from "./productCatalog";
import { teamEffectiveness } from "./people";

const mapped = (w: World, kind: string) => w.player.operatingRooms.filter((r) => r.kind === kind);

export function pmCapacity(w: World): number {
  return mapped(w, "office")
    .filter((r) => r.team === "product")
    .reduce((sum, r) => sum + r.capacity, 0);
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
  return mapped(w, "outsourcing").reduce((sum, r) => sum + r.capacity, 0);
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
  const productRooms = w.player.operatingRooms.filter((r) => r.kind === "office" && r.team === "product");
  const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const pms = w.player.personnel.filter((p) => p.role === "product_manager" && seated.has(p.id));
  return pms.map((pm) => {
    const assigned = w.player.skus.filter((s) => s.assignedPmId === pm.id).map((s) => s.name);
    return { pmId: pm.id, products: assigned, available: Math.max(0, 1 - assigned.filter(Boolean).length) };
  });
}

export function canCreateProduct(w: World): { ok: boolean; reason: string } {
  const productRooms = mapped(w, "office").filter((r) => r.team === "product");
  if (!productRooms.length) return { ok: false, reason: "Build an office and assign it to Product Management." };
  const pms = w.player.personnel.filter((p) => p.role === "product_manager");
  if (!pms.length) return { ok: false, reason: "Hire a Product Manager and assign them to a Product Management office." };
  const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const eligible = pms.filter((p) => seated.has(p.id));
  if (!eligible.length) return { ok: false, reason: "Assign a Product Manager to a Product Management office." };
  const locked = new Set(w.player.skus.filter((s) => s.status === "designing" && s.assignedPmId).map((s) => s.assignedPmId));
  if (!eligible.some((p) => !locked.has(p.id))) return { ok: false, reason: "All assigned Product Managers are busy designing products." };
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
  const free = productKey
    ? Math.max(0, warehouseUnitCapacity(w, productKey) - inventoryUsedForStorageProfile(w, productKey))
    : Math.max(0, warehouseUnitCapacity(w) - inventoryUsed(w));
  const requiredSpace = qty * storageSpaceForProduct(productKey ?? "");
  if (requiredSpace > free) return { ok: false, reason: `Warehouse capacity shortfall: ${Math.round(free).toLocaleString()} standard-storage units free.` };
  const cap = productionCapacity(w, method, supplierId, productKey);
  if (cap <= 0) return { ok: false, reason: method === "own" ? "Build a factory for owned manufacturing." : "Build a Sourcing Office to manage outsourced production." };
  if (qty > cap) return { ok: false, reason: `Batch exceeds monthly ${method === "own" ? "factory" : "supplier"} capacity of ${cap.toLocaleString()} units.` };
  return { ok: true, reason: "" };
}

export function maxManufacturableBatch(w: World, sku: Pick<SKU, "unitCost" | "method" | "supplierId" | "productKey">): number {
  const cashCap = Math.floor(w.player.cash / Math.max(0.01, sku.unitCost));
  const warehouseFree = Math.max(0, warehouseUnitCapacity(w, sku.productKey) - inventoryUsedForStorageProfile(w, sku.productKey));
  const storageCap = Math.floor(warehouseFree / Math.max(0.05, storageSpaceForProduct(sku.productKey)));
  const cap = productionCapacity(w, sku.method, sku.supplierId, sku.productKey);
  const raw = Math.max(0, Math.min(cashCap, storageCap, cap));
  return Math.floor(raw / 1000) * 1000;
}
