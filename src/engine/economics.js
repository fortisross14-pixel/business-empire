"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveQuality = exports.deriveUnitCost = void 0;
exports.contractReach = contractReach;
exports.contractAwarenessBoost = contractAwarenessBoost;
var industries_1 = require("./industries");
var productCatalog_1 = require("./productCatalog");
var deriveUnitCost = function (pt, method, m, p, supplierCostMult, materialPriceIndex) {
    if (supplierCostMult === void 0) { supplierCostMult = 1; }
    if (materialPriceIndex === void 0) { materialPriceIndex = {}; }
    // Product Engine: raw economics come from the Product Archetype BOM. ProductType.baseCost remains
    // a compatibility projection for old callers/saves, but material shocks can now flow through
    // a single shared registry without changing product-specific code.
    var rawMaterials = (0, productCatalog_1.archetypeBaseCost)(pt.key, materialPriceIndex) || pt.baseCost;
    return rawMaterials * (1 + m * 1.6 + p * 0.9) * industries_1.METHODS[method].mult * supplierCostMult;
};
exports.deriveUnitCost = deriveUnitCost;
var deriveQuality = function (m, p, qualityAdj) {
    if (qualityAdj === void 0) { qualityAdj = 0; }
    return (0, industries_1.clamp)(0.55 * m + 0.45 * p + qualityAdj);
};
exports.deriveQuality = deriveQuality;
// Reach is partner-specific, not just channel-specific. This makes the named retailer
// choice matter: Megazon reaches more people than CraftBay even though both are marketplaces.
function contractReach(contract) {
    var _a;
    var t = industries_1.CHANNEL_TYPES[contract.type];
    var partner = industries_1.RETAIL_PARTNERS.find(function (p) { return p.id === contract.partnerId; });
    return (0, industries_1.clamp)(t.baseReach * ((_a = partner === null || partner === void 0 ? void 0 : partner.reachMult) !== null && _a !== void 0 ? _a : 1));
}
function contractAwarenessBoost(contract) {
    var _a;
    var partner = industries_1.RETAIL_PARTNERS.find(function (p) { return p.id === contract.partnerId; });
    return (_a = partner === null || partner === void 0 ? void 0 : partner.awarenessBoost) !== null && _a !== void 0 ? _a : industries_1.CHANNEL_TYPES[contract.type].awarenessBoost;
}
