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
exports.getEquity = getEquity;
exports.brandAverageEquity = brandAverageEquity;
exports.equityDemandMult = equityDemandMult;
exports.pricingPower = pricingPower;
exports.trustAwarenessLift = trustAwarenessLift;
exports.updateEquity = updateEquity;
exports.earnedSignals = earnedSignals;
exports.launchInheritance = launchInheritance;
var types_1 = require("./types");
var industries_1 = require("./industries");
var brands_1 = require("./brands");
var ZERO = { trust: 0, prestige: 0, value: 0, innovation: 0 };
function brandMap(w, brandId) {
    if (!w.brandEquity[brandId])
        w.brandEquity[brandId] = {};
    return w.brandEquity[brandId];
}
function catMap(w, brandId, cat) {
    var bm = brandMap(w, brandId);
    if (!bm[cat])
        bm[cat] = {};
    return bm[cat];
}
function averageEquities(items) {
    if (!items.length)
        return __assign({}, ZERO);
    var acc = items.reduce(function (a, e) { return ({ trust: a.trust + e.trust, prestige: a.prestige + e.prestige, value: a.value + e.value, innovation: a.innovation + e.innovation }); }, __assign({}, ZERO));
    return { trust: acc.trust / items.length, prestige: acc.prestige / items.length, value: acc.value / items.length, innovation: acc.innovation / items.length };
}
function getEquity(w, cellIndex, productKey, brandId) {
    var _a, _b, _c, _d, _e;
    if (brandId) {
        var bm = (_a = w.brandEquity[brandId]) !== null && _a !== void 0 ? _a : {};
        if (productKey)
            return (_c = (_b = bm[productKey]) === null || _b === void 0 ? void 0 : _b[cellIndex]) !== null && _c !== void 0 ? _c : ZERO;
        return averageEquities(Object.values(bm).map(function (m) { return m[cellIndex]; }).filter(Boolean));
    }
    // Company-level display / customer trust: aggregate all brand-category reputations.
    var values = [];
    for (var _i = 0, _f = Object.keys(w.brandEquity); _i < _f.length; _i++) {
        var bid = _f[_i];
        var bm = w.brandEquity[bid];
        if (productKey) {
            var e = (_d = bm[productKey]) === null || _d === void 0 ? void 0 : _d[cellIndex];
            if (e)
                values.push(e);
        }
        else {
            for (var _g = 0, _h = Object.keys(bm); _g < _h.length; _g++) {
                var cat = _h[_g];
                var e = (_e = bm[cat]) === null || _e === void 0 ? void 0 : _e[cellIndex];
                if (e)
                    values.push(e);
            }
        }
    }
    return averageEquities(values);
}
function brandAverageEquity(w, productKey, brandId) {
    var _a, _b, _c;
    var tw = 0;
    var acc = __assign({}, ZERO);
    var brandIds = brandId ? [brandId] : Object.keys(w.brandEquity);
    for (var _i = 0, brandIds_1 = brandIds; _i < brandIds_1.length; _i++) {
        var bid = brandIds_1[_i];
        var bm = (_a = w.brandEquity[bid]) !== null && _a !== void 0 ? _a : {};
        var cats = productKey ? [productKey] : Object.keys(bm);
        for (var _d = 0, cats_1 = cats; _d < cats_1.length; _d++) {
            var cat = cats_1[_d];
            var m = bm[cat];
            if (!m)
                continue;
            for (var k in m) {
                var ci = Number(k);
                var head = (_c = (_b = w.cube[ci]) === null || _b === void 0 ? void 0 : _b.head) !== null && _c !== void 0 ? _c : 0;
                var e = m[ci];
                tw += head;
                acc.trust += e.trust * head;
                acc.prestige += e.prestige * head;
                acc.value += e.value * head;
                acc.innovation += e.innovation * head;
            }
        }
    }
    if (tw <= 0)
        return __assign({}, ZERO);
    return { trust: acc.trust / tw, prestige: acc.prestige / tw, value: acc.value / tw, innovation: acc.innovation / tw };
}
function equityDemandMult(w, cellIndex, cell, productKey, brandId) {
    var e = getEquity(w, cellIndex, productKey, brandId);
    var p = cell.equityPref;
    var prefMass = (p.trust + p.prestige + p.value + p.innovation) || 1;
    var weighted = (e.trust * p.trust + e.prestige * p.prestige + e.value * p.value + e.innovation * p.innovation) / prefMass;
    return 0.8 + weighted * 0.55;
}
function pricingPower(w, cellIndex, productKey, brandId) {
    var e = getEquity(w, cellIndex, productKey, brandId);
    return (0, industries_1.clamp)(e.prestige * 0.6, 0, 0.6);
}
function trustAwarenessLift(w, cellIndex, productKey, brandId) {
    return 1 + getEquity(w, cellIndex, productKey, brandId).trust * 0.25;
}
function updateEquity(w, cellIndex, brandId, productKey, brandPower, focusMatch, signals) {
    var _a;
    var m = catMap(w, brandId, productKey);
    var cur = (_a = m[cellIndex]) !== null && _a !== void 0 ? _a : __assign({}, ZERO);
    var drive = (0, industries_1.clamp)(0.004 * types_1.TICK_RATE_SCALE * (0.4 + brandPower * focusMatch));
    var decay = 0.0012 * types_1.TICK_RATE_SCALE;
    var step = function (val, target) { return (0, industries_1.clamp)(val + (target - val) * drive - (brandPower < 0.05 ? val * decay : 0), 0, 1); };
    m[cellIndex] = {
        trust: step(cur.trust, signals.trust),
        prestige: step(cur.prestige, signals.prestige),
        value: step(cur.value, signals.value),
        innovation: step(cur.innovation, signals.innovation),
    };
}
function earnedSignals(w, brandId) {
    var skus = brandId ? w.player.skus.filter(function (s) { return s.brandId === brandId; }) : w.player.skus;
    if (skus.length === 0)
        return { prestige: 0.2, value: 0.4, trust: 0.3, innovation: 0.3 };
    var avgPrice = (0, industries_1.sum)(skus.map(function (s) { return s.listPrice; })) / skus.length;
    var avgQuality = (0, industries_1.sum)(skus.map(function (s) { return s.quality; })) / skus.length;
    var avgOnline = (0, industries_1.sum)(skus.map(function (s) { return s.online; })) / skus.length;
    var priceLevel = (0, industries_1.clamp)((avgPrice / 45 - 0.6) / 1.2, 0, 1);
    var allCh = skus.flatMap(function (s) { return s.channels; });
    var flagshipShare = allCh.length ? allCh.filter(function (c) { return c === "flagship"; }).length / allCh.length : 0;
    var marketplaceShare = allCh.length ? allCh.filter(function (c) { return c === "marketplace"; }).length / allCh.length : 0;
    var sci = (0, industries_1.sum)(skus.map(function (s) { var _a, _b; return ((_a = s.attributes["scientific"]) !== null && _a !== void 0 ? _a : 0) + ((_b = s.attributes["creative"]) !== null && _b !== void 0 ? _b : 0); })) / skus.length;
    return {
        prestige: (0, industries_1.clamp)(priceLevel * 0.7 + flagshipShare * 0.4 - marketplaceShare * 0.3, 0, 1),
        value: (0, industries_1.clamp)((1 - priceLevel) * 0.8 + marketplaceShare * 0.2, 0, 1),
        trust: (0, industries_1.clamp)(0.25 + avgQuality * 0.7, 0, 1),
        innovation: (0, industries_1.clamp)(0.3 + sci * 0.4 + avgOnline * 0.3, 0, 1),
    };
}
function launchInheritance(w, cellIndex, productKey, brandId) {
    var bid = brandId !== null && brandId !== void 0 ? brandId : (0, brands_1.primaryBrand)(w).id;
    var catEq = getEquity(w, cellIndex, productKey, bid);
    var brandEq = getEquity(w, cellIndex, undefined, bid);
    var companyEq = getEquity(w, cellIndex);
    var strengthOf = function (e) { return (e.trust + e.prestige + e.innovation) / 3; };
    var catStr = strengthOf(catEq);
    var brandStr = strengthOf(brandEq);
    var companyStr = strengthOf(companyEq);
    var strength = catStr > 0.01 ? catStr : brandStr > 0.01 ? brandStr * 0.45 : companyStr * 0.15;
    return (0, industries_1.clamp)(strength * 0.4, 0, 0.4);
}
