"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pmCapacity = pmCapacity;
exports.warehouseUnitCapacity = warehouseUnitCapacity;
exports.warehouseCapacity = warehouseCapacity;
exports.factoryCapacity = factoryCapacity;
exports.outsourcingCapacity = outsourcingCapacity;
exports.productionCapacity = productionCapacity;
exports.productionLeadDays = productionLeadDays;
exports.inventoryUsed = inventoryUsed;
exports.inventoryPhysicalUnits = inventoryPhysicalUnits;
exports.inventoryUsedForStorageProfile = inventoryUsedForStorageProfile;
exports.pmAssignments = pmAssignments;
exports.productProjectTierAccess = productProjectTierAccess;
exports.productProjectLockedPeople = productProjectLockedPeople;
exports.canCreateProduct = canCreateProduct;
exports.canProduce = canProduce;
exports.maxManufacturableBatch = maxManufacturableBatch;
var suppliers_1 = require("./suppliers");
var productCatalog_1 = require("./productCatalog");
var people_1 = require("./people");
var infrastructure_1 = require("./infrastructure");
var research_1 = require("./research");
var mapped = function (w, kind) { return w.player.operatingRooms.filter(function (r) { return r.kind === kind; }); };
function pmCapacity(w) {
    return mapped(w, "office")
        .filter(function (r) { return r.team === "product" || r.id === "founder-office"; })
        .reduce(function (sum, r) { return sum + Math.max(0, r.capacity - (r.id === "founder-office" ? 1 : 0)); }, 0);
}
function warehouseUnitCapacity(w, productKey) {
    var required = productKey ? (0, productCatalog_1.storageProfileForProduct)(productKey) : null;
    return mapped(w, "warehouse")
        .filter(function (r) { var _a; return !required || ((_a = r.storageProfiles) !== null && _a !== void 0 ? _a : ["standard"]).includes(required); })
        .reduce(function (sum, r) { return sum + r.capacity; }, 0);
}
function warehouseCapacity(w) {
    return Math.max(0, Math.floor(warehouseUnitCapacity(w) / 10000));
}
function factoryCapacity(w, productKey) {
    if ((0, people_1.teamEffectiveness)(w, "operations") <= 0)
        return { onshore: 0, offshore: 0, total: 0 };
    var factories = mapped(w, "factory");
    if (!productKey) {
        var total_1 = factories.reduce(function (sum, r) { return sum + r.capacity; }, 0);
        return { onshore: total_1, offshore: 0, total: total_1 };
    }
    var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!archetype) {
        var total_2 = factories.reduce(function (sum, r) { return sum + r.capacity; }, 0);
        return { onshore: total_2, offshore: 0, total: total_2 };
    }
    // A product can flow through multiple facilities/lines. Capacity is the bottleneck across
    // all required manufacturing families, not a requirement that one building do everything.
    var familyCaps = archetype.manufacturingFamilies.map(function (family) {
        return factories.filter(function (r) { var _a; return ((_a = r.manufacturingFamilies) !== null && _a !== void 0 ? _a : []).includes(family); }).reduce(function (sum, r) { return sum + r.capacity; }, 0);
    });
    var total = familyCaps.length ? Math.min.apply(Math, familyCaps) : 0;
    return { onshore: total, offshore: 0, total: total };
}
function outsourcingCapacity(w) {
    if ((0, people_1.teamEffectiveness)(w, "operations") <= 0)
        return 0;
    var dedicated = mapped(w, "outsourcing").reduce(function (sum, r) { return sum + r.capacity; }, 0) * (0, infrastructure_1.facilityEffectMultiplier)(w, "logistics");
    var founder = w.player.operatingRooms.find(function (r) { return r.id === "founder-office"; });
    var starterSourcing = (founder === null || founder === void 0 ? void 0 : founder.assignedPersonnelIds.some(function (id) { var _a; return ((_a = w.player.personnel.find(function (p) { return p.id === id; })) === null || _a === void 0 ? void 0 : _a.role) === "operations"; })) ? 50000 : 0;
    return dedicated + starterSourcing;
}
function productionCapacity(w, method, supplierId, productKey) {
    if (method === "own")
        return factoryCapacity(w, productKey).total;
    var officeCap = outsourcingCapacity(w);
    if (officeCap <= 0)
        return 0;
    var supplier = (0, suppliers_1.supplierById)(supplierId);
    if (productKey && !(0, suppliers_1.supplierSupportsProduct)(supplier, productKey))
        return 0;
    return Math.min(officeCap, supplier.monthlyCapacity);
}
function productionLeadDays(w, sku, qty) {
    var cap = productionCapacity(w, sku.method, sku.supplierId, sku.productKey);
    if (cap <= 0)
        return 999;
    var leadMult = sku.method === "outsource" ? (0, suppliers_1.supplierById)(sku.supplierId).leadTimeMult : 1;
    var ops = (0, people_1.teamEffectiveness)(w, "operations");
    // Strong operations teams shorten planning/coordination lead time by up to ~18%.
    var peopleMult = 1 - ops * .18;
    var logisticsMult = 1 / (0, infrastructure_1.facilityEffectMultiplier)(w, "logistics");
    return Math.min(120, Math.max(3, Math.ceil((qty / cap) * 30 * leadMult * peopleMult * logisticsMult)));
}
function inventoryUsed(w) {
    // Warehouse capacity is now measured in standard-storage equivalents. A bulky plush toy can
    // consume 2x the space of a baseline unit while a compact face mask can consume less.
    return w.player.skus.reduce(function (sum, s) { return sum + (s.inventory + s.mfgBatchSize) * (0, productCatalog_1.storageSpaceForProduct)(s.productKey); }, 0);
}
function inventoryPhysicalUnits(w) {
    return w.player.skus.reduce(function (sum, s) { return sum + s.inventory + s.mfgBatchSize; }, 0);
}
function inventoryUsedForStorageProfile(w, productKey) {
    var required = (0, productCatalog_1.storageProfileForProduct)(productKey);
    return w.player.skus
        .filter(function (s) { return (0, productCatalog_1.storageProfileForProduct)(s.productKey) === required; })
        .reduce(function (sum, s) { return sum + (s.inventory + s.mfgBatchSize) * (0, productCatalog_1.storageSpaceForProduct)(s.productKey); }, 0);
}
function pmAssignments(w) {
    var productRooms = w.player.operatingRooms.filter(function (r) { return r.kind === "office" && (r.team === "product" || r.id === "founder-office"); });
    var seated = new Set(productRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    var pms = w.player.personnel.filter(function (p) { return p.role === "product_manager" && seated.has(p.id); });
    return pms.map(function (pm) {
        var assigned = w.player.skus.filter(function (s) { return s.assignedPmId === pm.id; }).map(function (s) { return s.name; });
        return { pmId: pm.id, products: assigned, available: Math.max(0, 1 - assigned.filter(Boolean).length) };
    });
}
function productProjectTierAccess(w, tier, productKey) {
    if (tier === "A")
        return { ok: true, reason: "" };
    if (tier === "AA" && !(0, research_1.hasResearch)(w, "advanced_product_development"))
        return { ok: false, reason: "Research Advanced Product Development to unlock AA programs." };
    if (tier === "AAA" && !(0, research_1.hasResearch)(w, "flagship_product_development"))
        return { ok: false, reason: "Research Flagship Product Development to unlock AAA programs." };
    var archetype = productKey ? (0, productCatalog_1.archetypeByKey)(productKey) : null;
    var designRooms = w.player.operatingRooms.filter(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, archetype === null || archetype === void 0 ? void 0 : archetype.industryId); });
    var maxOffice = Math.max.apply(Math, __spreadArray([0], designRooms.map(function (r) { return r.capacity; }), false));
    if (tier === "AA" && maxOffice < 8)
        return { ok: false, reason: "AA projects require an 8-seat product-capable office or design center." };
    if (tier === "AAA") {
        if ((0, infrastructure_1.researchCenterLevel)(w) < 2)
            return { ok: false, reason: "AAA projects require Research Center II." };
        var centerType = (0, infrastructure_1.productCenterTypeForIndustry)(archetype === null || archetype === void 0 ? void 0 : archetype.industryId);
        if (centerType && (0, infrastructure_1.productCenterLevel)(w, archetype === null || archetype === void 0 ? void 0 : archetype.industryId) < 2)
            return { ok: false, reason: "AAA ".concat((archetype === null || archetype === void 0 ? void 0 : archetype.industryId) === "toys" ? "toy" : "beauty", " products require a Level II specialized design center.") };
        if (!centerType && maxOffice < 16)
            return { ok: false, reason: "AAA projects require a 16-seat product-capable office or specialized design center." };
    }
    return { ok: true, reason: "" };
}
function productProjectLockedPeople(w) {
    var _a;
    var locked = new Set();
    for (var _i = 0, _b = w.player.skus; _i < _b.length; _i++) {
        var sku = _b[_i];
        if (sku.status !== "designing")
            continue;
        if (sku.assignedPmId)
            locked.add(sku.assignedPmId);
        for (var _c = 0, _d = (_a = sku.assignedDesignerIds) !== null && _a !== void 0 ? _a : []; _c < _d.length; _c++) {
            var id = _d[_c];
            locked.add(id);
        }
    }
    return locked;
}
function canCreateProduct(w) {
    if (!w.brands.length)
        return { ok: false, reason: "Create your first brand before designing a product." };
    var productRooms = mapped(w, "office").filter(function (r) { return r.team === "product" || r.id === "founder-office"; });
    if (!productRooms.length)
        return { ok: false, reason: "Build your Founder Office or a dedicated Product office first." };
    var pms = w.player.personnel.filter(function (p) { return p.role === "product_manager"; });
    if (!pms.length)
        return { ok: false, reason: "Hire a Product Designer and give them an office seat." };
    var seated = new Set(productRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    var eligible = pms.filter(function (p) { return seated.has(p.id); });
    if (!eligible.length)
        return { ok: false, reason: "Assign a Product Designer to an open office seat." };
    var locked = productProjectLockedPeople(w);
    if (!eligible.some(function (p) { return !locked.has(p.id); }))
        return { ok: false, reason: "All assigned Product Designers are busy on active product projects." };
    return { ok: true, reason: "" };
}
function canProduce(w, qty, unitCost, method, supplierId, productKey) {
    var _a, _b;
    if (method === void 0) { method = "outsource"; }
    var cost = qty * unitCost;
    if (w.player.cash < cost)
        return { ok: false, reason: "Not enough cash (need ".concat(Math.round(cost).toLocaleString(), ").") };
    if (productKey) {
        var profile = (0, productCatalog_1.storageProfileForProduct)(productKey);
        if (warehouseUnitCapacity(w, productKey) <= 0) {
            var label = (_b = (_a = productCatalog_1.STORAGE_PROFILES[profile]) === null || _a === void 0 ? void 0 : _a.infrastructureLabel) !== null && _b !== void 0 ? _b : profile;
            return { ok: false, reason: profile === "standard" ? "Build a warehouse before manufacturing this product." : "Build a warehouse and install ".concat(label, " before manufacturing this product.") };
        }
    }
    var globalFree = Math.max(0, warehouseUnitCapacity(w) - inventoryUsed(w));
    var free = productKey
        ? Math.min(globalFree, Math.max(0, warehouseUnitCapacity(w, productKey) - inventoryUsedForStorageProfile(w, productKey)))
        : globalFree;
    var requiredSpace = qty * (0, productCatalog_1.storageSpaceForProduct)(productKey !== null && productKey !== void 0 ? productKey : "");
    if (requiredSpace > free)
        return { ok: false, reason: "Warehouse capacity shortfall: ".concat(Math.round(free).toLocaleString(), " standard-storage units free.") };
    var cap = productionCapacity(w, method, supplierId, productKey);
    if (cap <= 0)
        return { ok: false, reason: method === "own" ? "Owned production requires both a compatible Factory and a seated Sourcing / Operations specialist." : "Hire and seat a Sourcing / Operations specialist. A dedicated Sourcing Office increases capacity later, but people still coordinate the suppliers." };
    if (qty > cap)
        return { ok: false, reason: "Batch exceeds monthly ".concat(method === "own" ? "factory" : "supplier", " capacity of ").concat(cap.toLocaleString(), " units.") };
    return { ok: true, reason: "" };
}
function maxManufacturableBatch(w, sku) {
    var cashCap = Math.floor(w.player.cash / Math.max(0.01, sku.unitCost));
    // Specialized modules unlock handling capability; they do not create a second invisible warehouse.
    // All profiles still compete for the same physical floor space.
    var profileFree = Math.max(0, warehouseUnitCapacity(w, sku.productKey) - inventoryUsedForStorageProfile(w, sku.productKey));
    var globalFree = Math.max(0, warehouseUnitCapacity(w) - inventoryUsed(w));
    var warehouseFree = Math.min(profileFree, globalFree);
    var storageCap = Math.floor(warehouseFree / Math.max(0.05, (0, productCatalog_1.storageSpaceForProduct)(sku.productKey)));
    var cap = productionCapacity(w, sku.method, sku.supplierId, sku.productKey);
    var raw = Math.max(0, Math.min(cashCap, storageCap, cap));
    return Math.floor(raw / 1000) * 1000;
}
