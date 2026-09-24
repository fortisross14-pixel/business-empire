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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIndustryMarket = createIndustryMarket;
exports.ensureIndustryMarket = ensureIndustryMarket;
exports.bindPrimaryMarketAliases = bindPrimaryMarketAliases;
exports.syncPrimaryMarketFromAliases = syncPrimaryMarketFromAliases;
exports.marketWorldView = marketWorldView;
exports.commitMarketView = commitMarketView;
var cube_1 = require("./cube");
var industries_1 = require("./industries");
function buildCompetitors(cfg) {
    return cfg.competitors.map(function (c, i) {
        var _a, _b, _c;
        return ({
            id: "".concat(cfg.id, "_C").concat(i), name: c.name, target: c.target, quality: c.quality,
            price: c.price, basePrice: c.price, priceSens: c.priceSens, strength: c.strength,
            isComp: true, personality: (_a = c.personality) !== null && _a !== void 0 ? _a : "balanced",
            products: [{
                    target: c.target, quality: c.quality, price: c.price, basePrice: c.price,
                    priceSens: c.priceSens, awarenessKey: "".concat(cfg.id, "_C").concat(i, "_p0"), attributes: __assign({}, c.attributes),
                    productKey: (_c = (_b = cfg.products[Math.min(i, Math.max(0, cfg.products.length - 1))]) === null || _b === void 0 ? void 0 : _b.key) !== null && _c !== void 0 ? _c : "",
                }],
            marketing: 80000, marketingFocus: "all", cash: 1000000, exitedCells: [],
            actionCooldown: 0, threatMemory: {},
        });
    });
}
function createIndustryMarket(industryId) {
    var cfg = industries_1.INDUSTRIES[industryId];
    if (!cfg)
        throw new Error("Unknown industry: ".concat(industryId));
    var cube = (0, cube_1.buildCube)(cfg);
    var comps = buildCompetitors(cfg);
    for (var _i = 0, cube_2 = cube; _i < cube_2.length; _i++) {
        var cell = cube_2[_i];
        for (var _a = 0, comps_1 = comps; _a < comps_1.length; _a++) {
            var comp = comps_1[_a];
            var first = comp.products[0];
            if (first)
                cell.awareness[first.awarenessKey] = comp.strength * 0.9;
        }
    }
    return {
        industryId: industryId,
        cube: cube,
        comps: comps,
        customers: {}, brandEquity: {}, fitCache: {}, fitCacheDirty: true,
        unitsTickHistory: [], marketTickHistory: [],
    };
}
function ensureIndustryMarket(w, industryId) {
    var _a;
    w.industryMarkets = (_a = w.industryMarkets) !== null && _a !== void 0 ? _a : {};
    var market = w.industryMarkets[industryId];
    if (!market) {
        market = createIndustryMarket(industryId);
        w.industryMarkets[industryId] = market;
    }
    return market;
}
function bindPrimaryMarketAliases(w) {
    var market = ensureIndustryMarket(w, w.industryId);
    w.cube = market.cube;
    w.comps = market.comps;
    w.customers = market.customers;
    w.brandEquity = market.brandEquity;
    w.fitCache = market.fitCache;
    w.fitCacheDirty = market.fitCacheDirty;
    w.unitsTickHistory = market.unitsTickHistory;
    w.marketTickHistory = market.marketTickHistory;
}
function syncPrimaryMarketFromAliases(w) {
    var market = ensureIndustryMarket(w, w.industryId);
    market.cube = w.cube;
    market.comps = w.comps;
    market.customers = w.customers;
    market.brandEquity = w.brandEquity;
    market.fitCache = w.fitCache;
    market.fitCacheDirty = w.fitCacheDirty;
    market.unitsTickHistory = w.unitsTickHistory;
    market.marketTickHistory = w.marketTickHistory;
}
function marketWorldView(w, industryId) {
    var market = ensureIndustryMarket(w, industryId);
    var cfg = industries_1.INDUSTRIES[industryId];
    return __assign(__assign({}, w), { industryId: industryId, cfg: cfg, cube: market.cube, comps: market.comps, customers: market.customers, brandEquity: market.brandEquity, fitCache: market.fitCache, fitCacheDirty: market.fitCacheDirty, unitsTickHistory: market.unitsTickHistory, marketTickHistory: market.marketTickHistory, brands: w.brands.filter(function (b) { return b.industryId === industryId; }), player: __assign(__assign({}, w.player), { skus: w.player.skus.filter(function (s) { return s.industryId === industryId; }) }) });
}
function commitMarketView(w, view) {
    var market = ensureIndustryMarket(w, view.industryId);
    market.cube = view.cube;
    market.comps = view.comps;
    market.customers = view.customers;
    market.brandEquity = view.brandEquity;
    market.fitCache = view.fitCache;
    market.fitCacheDirty = view.fitCacheDirty;
    market.unitsTickHistory = view.unitsTickHistory;
    market.marketTickHistory = view.marketTickHistory;
    if (view.industryId === w.industryId)
        bindPrimaryMarketAliases(w);
}
