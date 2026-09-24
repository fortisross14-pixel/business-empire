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
exports.MANUFACTURING_STANDARDS = exports.PRODUCT_POSITIONINGS = void 0;
exports.manufacturingStandard = manufacturingStandard;
exports.qualityToStars = qualityToStars;
exports.valueToStars = valueToStars;
exports.starsToValue = starsToValue;
exports.suggestedPrice = suggestedPrice;
exports.attributesToStars = attributesToStars;
exports.starsToAttributes = starsToAttributes;
exports.applyPositioningToPriorityStars = applyPositioningToPriorityStars;
exports.positioningDef = positioningDef;
exports.validPackagingKey = validPackagingKey;
var industries_1 = require("./industries");
exports.PRODUCT_POSITIONINGS = [
    { key: "value", label: "Value", desc: "Accessible price, dependable product, broad appeal.", pricePercentile: 0.20, manufacturingStars: 2, packaging: "bold" },
    { key: "mainstream", label: "Mainstream", desc: "Balanced price, quality and broad-market appeal.", pricePercentile: 0.45, manufacturingStars: 3, packaging: "minimal" },
    { key: "premium", label: "Premium", desc: "Higher quality and stronger presentation at a healthy margin.", pricePercentile: 0.68, manufacturingStars: 4, packaging: "premium" },
    { key: "luxury", label: "Luxury", desc: "Top-end quality, exclusivity and prestige-led presentation.", pricePercentile: 0.90, manufacturingStars: 5, packaging: "premium" },
    { key: "specialist", label: "Specialist / Performance", desc: "Focused product built to solve a specific customer need exceptionally well.", pricePercentile: 0.72, manufacturingStars: 4, packaging: "serious" },
];
exports.MANUFACTURING_STANDARDS = [
    { stars: 1, label: "Economy", desc: "Lowest cost; quality-sensitive customers will notice.", materialQuality: 0.22, productionQuality: 0.28 },
    { stars: 2, label: "Commercial", desc: "Cost-conscious but credible mass-market standard.", materialQuality: 0.38, productionQuality: 0.42 },
    { stars: 3, label: "Standard", desc: "Balanced quality and cost for a mainstream product.", materialQuality: 0.55, productionQuality: 0.58 },
    { stars: 4, label: "Premium", desc: "High-grade materials and tighter production standards.", materialQuality: 0.74, productionQuality: 0.78 },
    { stars: 5, label: "Exceptional", desc: "Best available specification; expensive but differentiation-friendly.", materialQuality: 0.92, productionQuality: 0.94 },
];
function manufacturingStandard(stars) {
    var rounded = Math.max(1, Math.min(5, Math.round(stars)));
    return exports.MANUFACTURING_STANDARDS[rounded - 1];
}
function qualityToStars(value) {
    if (value >= 0.84)
        return 5;
    if (value >= 0.66)
        return 4;
    if (value >= 0.48)
        return 3;
    if (value >= 0.32)
        return 2;
    return 1;
}
function valueToStars(value) {
    return Math.max(1, Math.min(5, Math.round((0, industries_1.clamp)(value) * 4 + 1)));
}
function starsToValue(stars) {
    return (0, industries_1.clamp)((Math.max(1, Math.min(5, Math.round(stars))) - 1) / 4);
}
function suggestedPrice(priceBand, percentile) {
    var lo = priceBand[0], hi = priceBand[1];
    return Math.round(lo + (hi - lo) * (0, industries_1.clamp)(percentile));
}
function attributesToStars(cfg, defaults) {
    return Object.fromEntries(cfg.needs.map(function (n) { var _a; return [n.key, valueToStars((_a = defaults === null || defaults === void 0 ? void 0 : defaults[n.key]) !== null && _a !== void 0 ? _a : 0.4)]; }));
}
function starsToAttributes(stars) {
    return Object.fromEntries(Object.entries(stars).map(function (_a) {
        var key = _a[0], value = _a[1];
        return [key, starsToValue(value)];
    }));
}
function applyPositioningToPriorityStars(_industryId, base, positioning) {
    var out = __assign({}, base);
    var lift = function (key, value) { if (key in out)
        out[key] = Math.max(out[key], value); };
    var lower = function (key, value) { if (key in out)
        out[key] = Math.min(out[key], value); };
    var ranked = function () { return Object.entries(out).sort(function (a, b) { return b[1] - a[1]; }).map(function (_a) {
        var key = _a[0];
        return key;
    }); };
    if (positioning === "value") {
        if ("value" in out)
            lift("value", 5);
        else if (ranked()[0])
            lift(ranked()[0], 4);
        lower("luxury", 2);
        lower("collectible", 3);
    }
    else if (positioning === "premium") {
        if ("luxury" in out)
            lift("luxury", 4);
        else if ("collectible" in out)
            lift("collectible", 4);
        else if (ranked()[0])
            lift(ranked()[0], 4);
    }
    else if (positioning === "luxury") {
        if ("luxury" in out)
            lift("luxury", 5);
        else if ("collectible" in out)
            lift("collectible", 5);
        else if (ranked()[0])
            lift(ranked()[0], 5);
        lower("value", 2);
    }
    else if (positioning === "specialist") {
        var _a = ranked(), first = _a[0], second = _a[1];
        if (first)
            lift(first, 5);
        if (second)
            lift(second, 4);
    }
    return out;
}
function positioningDef(key) {
    var _a;
    return (_a = exports.PRODUCT_POSITIONINGS.find(function (p) { return p.key === key; })) !== null && _a !== void 0 ? _a : exports.PRODUCT_POSITIONINGS[1];
}
function validPackagingKey(key) {
    return industries_1.PACKAGING.some(function (p) { return p.key === key; }) ? key : "minimal";
}
