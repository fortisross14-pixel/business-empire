"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractsForSku = contractsForSku;
exports.distributionMetricsForSku = distributionMetricsForSku;
exports.partnerFitForCell = partnerFitForCell;
exports.deriveSkuChannels = deriveSkuChannels;
exports.hasCommercialCapability = hasCommercialCapability;
exports.partnerSupportsIndustry = partnerSupportsIndustry;
exports.canNegotiatePartner = canNegotiatePartner;
var industries_1 = require("./industries");
var economics_1 = require("./economics");
var productCatalog_1 = require("./productCatalog");
var people_1 = require("./people");
function contractsForSku(w, sku) {
    var _a;
    var ids = new Set((_a = sku.assignedPartnerIds) !== null && _a !== void 0 ? _a : []);
    return w.player.contracts.filter(function (c) { return ids.has(c.partnerId); });
}
function distributionMetricsForSku(w, sku) {
    var contracts = contractsForSku(w, sku);
    if (!contracts.length)
        return { contracts: contracts, reach: 0, onlineCoverage: 0, awarenessBoost: 0, marginCut: 0, paymentDays: 0 };
    var reaches = contracts.map(economics_1.contractReach);
    var reachSum = (0, industries_1.sum)(reaches);
    var reach = (0, industries_1.clamp)(reachSum / 1.35);
    var onlineCoverage = (0, industries_1.clamp)((0, industries_1.sum)(contracts.map(function (c, i) { return reaches[i] * industries_1.CHANNEL_TYPES[c.type].online; })));
    var awarenessBoost = (0, industries_1.sum)(contracts.map(function (c, i) { return (0, economics_1.contractAwarenessBoost)(c) * reaches[i]; }));
    var marginCut = reachSum > 0 ? (0, industries_1.sum)(contracts.map(function (c, i) { return c.marginCut * reaches[i]; })) / reachSum : 0;
    var paymentDays = reachSum > 0 ? (0, industries_1.sum)(contracts.map(function (c, i) { return c.paymentDays * reaches[i]; })) / reachSum : 0;
    return { contracts: contracts, reach: reach, onlineCoverage: onlineCoverage, awarenessBoost: awarenessBoost, marginCut: marginCut, paymentDays: paymentDays };
}
// A named retailer is more than its channel type. Beauty Luxe should genuinely be better at
// reaching affluent beauty shoppers than ValueMart, while ValueMart over-indexes on budget buyers.
// The underlying 648-cell market remains intact; this turns partner demographic skew into gameplay.
function partnerFitForCell(w, sku, cell) {
    var _a;
    var contracts = contractsForSku(w, sku);
    if (!contracts.length)
        return 0;
    var best = 0;
    var _loop_1 = function (contract) {
        var partner = industries_1.RETAIL_PARTNERS.find(function (p) { return p.id === contract.partnerId; });
        var demographic = 1;
        if (partner) {
            for (var _b = 0, _c = Object.entries(partner.skew); _b < _c.length; _b++) {
                var _d = _c[_b], axisRaw = _d[0], skew = _d[1];
                var axis = axisRaw;
                var vals = industries_1.AXES[axis];
                var idx = Math.max(0, vals.indexOf(cell.coord[axis]));
                var pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
                // Positive skew prefers the high end of an axis, negative the low end.
                demographic *= (0, industries_1.clamp)(1 + Number(skew) * (pos - 0.5) * 0.8, 0.65, 1.35);
            }
        }
        var channelPreference = (_a = cell.channelPref[contract.type]) !== null && _a !== void 0 ? _a : 0;
        var reachWeight = 0.75 + (0, economics_1.contractReach)(contract) * 0.25;
        var productRetailFit = (0, productCatalog_1.retailerAffinity)(sku.productKey, contract.partnerId, partner === null || partner === void 0 ? void 0 : partner.category, contract.type);
        best = Math.max(best, channelPreference * demographic * reachWeight * productRetailFit);
    };
    for (var _i = 0, contracts_1 = contracts; _i < contracts_1.length; _i++) {
        var contract = contracts_1[_i];
        _loop_1(contract);
    }
    var breadth = (0, industries_1.clamp)(1 + (contracts.length - 1) * 0.05, 1, 1.18);
    return (0, industries_1.clamp)(best * breadth, 0, 1);
}
function deriveSkuChannels(w, sku) {
    sku.channels = Array.from(new Set(contractsForSku(w, sku).map(function (c) { return c.type; })));
}
function hasCommercialCapability(w) {
    // Buildings add capacity, but relationships are still run by people.
    return (0, people_1.teamEffectiveness)(w, "operations") > 0 || (0, people_1.teamEffectiveness)(w, "strategy") > 0;
}
function partnerSupportsIndustry(partnerId, industryId) {
    var partner = industries_1.RETAIL_PARTNERS.find(function (p) { return p.id === partnerId; });
    return Boolean(partner && (!partner.industries || partner.industries.includes(industryId)));
}
function canNegotiatePartner(w, partnerId) {
    // A founder can always open a basic DTC site. External retailers require a commercial capability.
    return partnerId === "own_web" || hasCommercialCapability(w);
}
