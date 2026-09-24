"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.INDUSTRY_ENTRY_DEFS = void 0;
exports.primaryBusiness = primaryBusiness;
exports.syncPrimaryBusinessLegacy = syncPrimaryBusinessLegacy;
exports.corporateCapabilities = corporateCapabilities;
exports.refreshCorporateCapabilities = refreshCorporateCapabilities;
exports.canStartIndustryEntry = canStartIndustryEntry;
exports.completeIndustryEntry = completeIndustryEntry;
exports.industryEntrySpeed = industryEntrySpeed;
var industries_1 = require("./industries");
var growth_1 = require("./growth");
var people_1 = require("./people");
var markets_1 = require("./markets");
exports.INDUSTRY_ENTRY_DEFS = {
    toys: {
        industryId: "toys", label: "Toys", investment: 12000000, days: 360,
        blurb: "Build a toy-design team, safety knowledge, retailer relationships and a launch pipeline before the first toy is developed.",
        starterCapabilities: { toy_design: 0.8, safety: 0.5, licensing: 0.2, toy_retail: 0.6, manufacturing: 0.5 },
    },
};
function primaryBusiness(w) {
    var business = w.player.businesses[w.industryId];
    if (!business)
        throw new Error("Missing primary business: ".concat(w.industryId));
    return business;
}
function syncPrimaryBusinessLegacy(w) {
    var b = primaryBusiness(w);
    if (!b)
        return;
    // v0.80 screens still read these aliases. During 8A they remain a compatibility bridge.
    w.player.unlockedCategories = b.unlockedCategories;
    w.player.categoryExpansionProjects = b.categoryExpansionProjects;
}
function corporateCapabilities(w) {
    var scale = (0, growth_1.companyScale)(w);
    var scaleBonus = scale.id === "enterprise" ? 1.2 : scale.id === "major" ? 0.9 : scale.id === "established" ? 0.6 : scale.id === "emerging" ? 0.3 : 0;
    var retail = Math.min(5, 0.4 + w.player.contracts.length * 0.45 + Math.min(1.5, (w.chronicle.lifetimeRevenue || 0) / 100000000));
    return {
        finance: Math.min(5, (0, people_1.teamEffectiveness)(w, "finance") * 4 + scaleBonus),
        strategy: Math.min(5, (0, people_1.teamEffectiveness)(w, "strategy") * 4 + scaleBonus),
        marketing: Math.min(5, (0, people_1.teamEffectiveness)(w, "marketing") * 4 + scaleBonus),
        operations: Math.min(5, (0, people_1.teamEffectiveness)(w, "operations") * 4 + scaleBonus),
        retail: retail,
        people: Math.min(5, Math.sqrt(Math.max(0, w.player.personnel.length)) + scaleBonus),
    };
}
function refreshCorporateCapabilities(w) {
    w.player.corporateCapabilities = corporateCapabilities(w);
}
function canStartIndustryEntry(w, industryId) {
    var _a, _b;
    var def = (_a = exports.INDUSTRY_ENTRY_DEFS[industryId]) !== null && _a !== void 0 ? _a : null;
    if (!def || !industries_1.INDUSTRIES[industryId])
        return { ok: false, reason: "This industry is not ready for entry yet.", def: def };
    if (((_b = w.player.businesses[industryId]) === null || _b === void 0 ? void 0 : _b.status) === "active")
        return { ok: false, reason: "".concat(def.label, " is already an active business."), def: def };
    if (w.player.industryEntryProjects.some(function (p) { return p.industryId === industryId; }))
        return { ok: false, reason: "".concat(def.label, " entry is already underway."), def: def };
    var scale = (0, growth_1.companyScale)(w);
    if (scale.id === "startup")
        return { ok: false, reason: "Grow beyond Startup stage before entering a second industry.", def: def };
    if (w.player.cash < def.investment)
        return { ok: false, reason: "Need $".concat(def.investment.toLocaleString(), " to fund organic entry."), def: def };
    var productTeam = (0, people_1.teamEffectiveness)(w, "product_manager") > 0;
    if (!productTeam)
        return { ok: false, reason: "A staffed Product organization is required for industry entry.", def: def };
    if ((0, people_1.teamEffectiveness)(w, "strategy") <= 0)
        return { ok: false, reason: "A seated Strategy specialist is required before entering a second industry.", def: def };
    return { ok: true, reason: "", def: def };
}
function completeIndustryEntry(w, industryId) {
    var _a;
    var def = exports.INDUSTRY_ENTRY_DEFS[industryId];
    var cfg = industries_1.INDUSTRIES[industryId];
    if (!def || !cfg)
        return;
    w.player.businesses[industryId] = {
        industryId: industryId,
        status: "active", enteredTick: w.tick,
        unlockedCategories: __spreadArray([], ((_a = growth_1.STARTER_CATEGORIES[industryId]) !== null && _a !== void 0 ? _a : cfg.products.slice(0, 2).map(function (p) { return p.key; })), true),
        categoryExpansionProjects: [], capabilities: __assign({}, def.starterCapabilities),
    };
    (0, markets_1.ensureIndustryMarket)(w, industryId);
}
function industryEntrySpeed(w) {
    var strategy = (0, people_1.teamEffectiveness)(w, "strategy");
    var product = (0, people_1.teamEffectiveness)(w, "product_manager");
    if (strategy <= 0 || product <= 0)
        return 0;
    return 0.55 + strategy * 0.45 + product * 0.35;
}
