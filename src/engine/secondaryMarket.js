"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateSecondaryIndustryMarket = simulateSecondaryIndustryMarket;
var industries_1 = require("./industries");
var cube_1 = require("./cube");
var distribution_1 = require("./distribution");
var brands_1 = require("./brands");
var brandEquity_1 = require("./brandEquity");
var competitorBrain_1 = require("./competitorBrain");
var customers_1 = require("./customers");
var productCatalog_1 = require("./productCatalog");
var markets_1 = require("./markets");
var productDynamics_1 = require("./productDynamics");
var ip_1 = require("./ip");
var productMarketFit_1 = require("./productMarketFit");
function cellMatchesSegment(cell, filter) {
    return Object.entries(filter).every(function (_a) {
        var axis = _a[0], values = _a[1];
        return !values || values.length === 0 || values.includes(cell.coord[axis]);
    });
}
function campaignPowerForSku(w, sku, cell) {
    var _a;
    var power = 0;
    var _loop_1 = function (camp) {
        if (camp.daysRemaining <= 0)
            return "continue";
        var applies = camp.scope === "company" || camp.scope === sku.id || (camp.scope.startsWith("brand:") && camp.scope.slice(6) === sku.brandId);
        if (!applies)
            return "continue";
        var seg = w.savedSegments.find(function (s) { return s.id === camp.segmentId; });
        if (!seg || !cellMatchesSegment(cell, seg.filter))
            return "continue";
        var dailySpend = camp.budget / Math.max(1, camp.totalDays);
        power += (0, industries_1.clamp)(dailySpend / 8000, 0, 1.5) * ((_a = camp.effectivenessMult) !== null && _a !== void 0 ? _a : 1);
    };
    for (var _i = 0, _b = w.activeCampaigns; _i < _b.length; _i++) {
        var camp = _b[_i];
        _loop_1(camp);
    }
    return (0, industries_1.clamp)(power, 0, 2);
}
function simulateSecondaryIndustryMarket(world, industryId, marketingPower, brandPower) {
    var _a, _b, _c, _d, _e, _f;
    var cfg = industries_1.INDUSTRIES[industryId];
    if (!cfg)
        return { industryId: industryId, demandTickBySkuId: {}, marketAnnual: 0, avgReach: 0, avgOnlineCoverage: 0 };
    var w = (0, markets_1.marketWorldView)(world, industryId);
    var skus = w.player.skus;
    var demandAnnual = skus.map(function () { return 0; });
    var dists = skus.map(function (s) { return (0, distribution_1.distributionMetricsForSku)(w, s); });
    var active = skus.map(function (sku, i) { return ({ sku: sku, dist: dists[i] }); }).filter(function (x) { return x.sku.status === "active" && x.sku.releasedToMarket === true; });
    var avgReach = active.length ? (0, industries_1.sum)(active.map(function (x) { return x.dist.reach; })) / active.length : 0;
    var avgOnlineCoverage = active.length ? (0, industries_1.sum)(active.map(function (x) { return x.dist.onlineCoverage; })) / active.length : 0;
    var refPrice = cfg.products.length ? (0, industries_1.sum)(cfg.products.map(function (p) { return (p.priceBand[0] + p.priceBand[1]) / 2; })) / cfg.products.length : 30;
    // Every active business gets the same generic population drift / market shock machinery.
    (0, cube_1.applyDriftAndShocks)(w);
    (0, competitorBrain_1.runCompetitorBrains)(w);
    var signals = Object.fromEntries(w.brands.map(function (b) { return [b.id, (0, brandEquity_1.earnedSignals)(w, b.id)]; }));
    if (w.fitCacheDirty) {
        w.fitCache = {};
        var _loop_2 = function (sku) {
            var pt = cfg.products.find(function (p) { return p.key === sku.productKey; });
            var tgt = (0, cube_1.effectiveTarget)(sku.target, pt);
            var attrs = (0, cube_1.effectiveAttributes)(industryId, sku.packaging, sku.attributes);
            w.fitCache[sku.id] = w.cube.map(function (cell) {
                var _a;
                var category = (_a = cell.categoryPref[sku.productKey]) !== null && _a !== void 0 ? _a : 0.5;
                return (0, cube_1.fit)(tgt, cell, cfg)
                    * (0, cube_1.needMatch)(attrs, cell, cfg)
                    * category
                    * (0, cube_1.packagingResonance)(sku.packaging, cell)
                    * (0, distribution_1.partnerFitForCell)(w, sku, cell)
                    * (0, brands_1.brandPositioningFit)(w, sku.brandId, cell, sku.positioning);
            });
        };
        for (var _i = 0, skus_1 = skus; _i < skus_1.length; _i++) {
            var sku = skus_1[_i];
            _loop_2(sku);
        }
        w.fitCacheDirty = false;
    }
    var _loop_3 = function (ci) {
        var cell = w.cube[ci];
        var brandFocus = 1;
        var seen = new Set();
        for (var _g = 0, skus_2 = skus; _g < skus_2.length; _g++) {
            var sku = skus_2[_g];
            var pair = "".concat(sku.brandId, "|").concat(sku.productKey);
            if (seen.has(pair))
                continue;
            seen.add(pair);
            (0, brandEquity_1.updateEquity)(w, ci, sku.brandId, sku.productKey, brandPower / Math.sqrt(Math.max(1, w.brands.length)), brandFocus, (_a = signals[sku.brandId]) !== null && _a !== void 0 ? _a : (0, brandEquity_1.earnedSignals)(w, sku.brandId));
        }
        // Distribution + marketing build awareness in exactly the same generic way for every industry.
        for (var i = 0; i < skus.length; i++) {
            var sku = skus[i];
            var staticFit = (_c = (_b = w.fitCache[sku.id]) === null || _b === void 0 ? void 0 : _b[ci]) !== null && _c !== void 0 ? _c : 0;
            var dist = dists[i];
            var campaignPower = campaignPowerForSku(w, sku, cell);
            var visibility = (0, industries_1.clamp)(dist.reach * 0.34 + dist.awarenessBoost * 0.5 + marketingPower * 0.55 + campaignPower * 0.22, 0, 1);
            var organicTarget = (0, industries_1.clamp)(staticFit * visibility * (0, brandEquity_1.trustAwarenessLift)(w, ci, sku.productKey, sku.brandId), 0, 1);
            var target = Math.max(organicTarget, (0, ip_1.ipAwarenessFloor)(w, sku, cell));
            var cur = (_d = cell.awareness[sku.id]) !== null && _d !== void 0 ? _d : 0;
            cell.awareness[sku.id] = (0, industries_1.clamp)(cur + (target - cur) * (0.004 + marketingPower * 0.006), 0, 1);
        }
        for (var _h = 0, _j = w.comps; _h < _j.length; _h++) {
            var comp = _j[_h];
            (0, competitorBrain_1.competitorAwareness)(w, comp, cell);
        }
        var playerEff = skus.map(function (sku, i) {
            var _a, _b, _c, _d;
            if (sku.status !== "active" || sku.releasedToMarket !== true)
                return 0;
            var base = (_b = (_a = w.fitCache[sku.id]) === null || _a === void 0 ? void 0 : _a[ci]) !== null && _b !== void 0 ? _b : 0;
            var eqPricePower = (0, brandEquity_1.pricingPower)(w, ci, sku.productKey, sku.brandId);
            var effPriceSens = cell.priceSens * (1 - eqPricePower);
            var priceTerm = 1 - (0, industries_1.clamp)(sku.listPrice / Math.max(1, refPrice) - 1, -0.65, 1.1) * effPriceSens * 0.45;
            var qualityTerm = 1 - cell.qualitySens + cell.qualitySens * sku.perceivedQuality;
            var aware = ((_c = cell.awareness[sku.id]) !== null && _c !== void 0 ? _c : 0) * (0.4 + dists[i].reach * 0.6);
            var lifecycle = (_d = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _d === void 0 ? void 0 : _d.lifecycle;
            var repeatFit = lifecycle ? (0, industries_1.clamp)(0.72 + lifecycle.repeatPurchase * 0.42 + 80 / Math.max(120, lifecycle.purchaseCycleDays) * 0.12, 0.72, 1.22) : 1;
            var commercialFit = (0, productMarketFit_1.productMarketFitForCell)(w, sku, cell).overall;
            var commercialConversion = 0.10 + commercialFit * 0.90;
            return Math.max(0, base * priceTerm * qualityTerm * (0, brandEquity_1.equityDemandMult)(w, ci, cell, sku.productKey, sku.brandId) * aware * (0, productDynamics_1.productDemandMultiplier)(sku, world.tick) * repeatFit * (0, ip_1.ipDemandMultiplier)(w, sku, cell) * commercialConversion);
        });
        var compEff = w.comps.map(function (comp) {
            var _a, _b;
            var e = 0;
            for (var _i = 0, _c = comp.products; _i < _c.length; _i++) {
                var cp = _c[_i];
                var priceTerm = 1 - (0, industries_1.clamp)(cp.price / Math.max(1, refPrice) - 1, -0.65, 1.1) * cell.priceSens * 0.45;
                var q = 1 - cell.qualitySens + cell.qualitySens * cp.quality;
                e += Math.max(0, (0, cube_1.fit)(cp.target, cell, cfg) * (0, cube_1.needMatch)(cp.attributes, cell, cfg) * ((_a = cell.categoryPref[cp.productKey]) !== null && _a !== void 0 ? _a : 0.55) * priceTerm * q) * ((_b = cell.awareness[cp.awarenessKey]) !== null && _b !== void 0 ? _b : 0);
            }
            return e;
        });
        var playerAppeal = (0, industries_1.sum)(playerEff);
        var denom = playerAppeal + (0, industries_1.sum)(compEff) || 1;
        var acquireShare = playerAppeal / denom;
        var bestRival = compEff.length ? Math.max.apply(Math, compEff) : 0;
        var trust = 0;
        var qualityValue = 0.5;
        if (playerAppeal > 0) {
            qualityValue = 0;
            for (var i = 0; i < skus.length; i++) {
                var wt = playerEff[i] / playerAppeal;
                if (wt <= 0)
                    continue;
                var sku = skus[i];
                trust += wt * (0, brandEquity_1.getEquity)(w, ci, sku.productKey, sku.brandId).trust;
                var fair = (0, industries_1.clamp)(1 - (0, industries_1.clamp)(sku.listPrice / Math.max(1, refPrice) - 1, -0.5, 1.2) * cell.priceSens * 0.36, 0.1, 1.2);
                var q = 1 - cell.qualitySens + cell.qualitySens * sku.perceivedQuality;
                qualityValue += wt * (0, industries_1.clamp)(q * fair, 0, 1);
            }
        }
        var sat = (0, customers_1.satisfactionTarget)(playerAppeal, bestRival, trust, qualityValue);
        var annualRevenue = (playerAppeal > 0 || ((_f = (_e = w.customers[ci]) === null || _e === void 0 ? void 0 : _e.count) !== null && _f !== void 0 ? _f : 0) > 0)
            ? (0, customers_1.updateCustomers)(w, ci, cell, acquireShare, sat, cell.spend)
            : 0;
        if (annualRevenue <= 0 || playerAppeal <= 0)
            return "continue";
        for (var i = 0; i < skus.length; i++) {
            var share = playerEff[i] / playerAppeal;
            demandAnnual[i] += annualRevenue * share / Math.max(1, skus[i].listPrice);
        }
    };
    for (var ci = 0; ci < w.cube.length; ci++) {
        _loop_3(ci);
    }
    (0, markets_1.commitMarketView)(world, w);
    var demandTickBySkuId = {};
    skus.forEach(function (sku, i) { demandTickBySkuId[sku.id] = demandAnnual[i] / 360; });
    var marketAnnual = (0, industries_1.sum)(w.cube.map(function (c) { return c.head * c.spend; }));
    return { industryId: industryId, demandTickBySkuId: demandTickBySkuId, marketAnnual: marketAnnual, avgReach: avgReach, avgOnlineCoverage: avgOnlineCoverage };
}
