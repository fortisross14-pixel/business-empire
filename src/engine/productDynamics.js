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
exports.TESTING_LEVELS = void 0;
exports.testingRequired = testingRequired;
exports.testingLevelForSku = testingLevelForSku;
exports.deriveSafetyScore = deriveSafetyScore;
exports.seasonalityMultiplier = seasonalityMultiplier;
exports.productDemandMultiplier = productDemandMultiplier;
exports.updateProductMomentum = updateProductMomentum;
exports.ensureInventoryLots = ensureInventoryLots;
exports.receiveInventoryLot = receiveInventoryLot;
exports.consumeInventoryLots = consumeInventoryLots;
exports.inventoryFreshnessMultiplier = inventoryFreshnessMultiplier;
exports.inventoryAgeStatus = inventoryAgeStatus;
exports.processInventoryAgeing = processInventoryAgeing;
exports.maybeTriggerRecall = maybeTriggerRecall;
exports.applyFacetSelections = applyFacetSelections;
var industries_1 = require("./industries");
var productCatalog_1 = require("./productCatalog");
exports.TESTING_LEVELS = {
    standard: { label: "Standard", safety: 0.68, timeMult: 1.0, costMult: 1.0, desc: "Meets normal category requirements with limited extra validation." },
    enhanced: { label: "Enhanced", safety: 0.84, timeMult: 1.12, costMult: 1.035, desc: "More validation and play/use testing. Lower recall risk." },
    rigorous: { label: "Rigorous", safety: 0.96, timeMult: 1.28, costMult: 1.08, desc: "Extensive validation for safety-sensitive or premium products." },
};
function testingRequired(productKey) {
    var p = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!p)
        return false;
    return p.regulation !== "standard" || p.modules.some(function (m) { return m.includes("safety"); });
}
function testingLevelForSku(sku) {
    var _a;
    return (_a = sku.testingLevel) !== null && _a !== void 0 ? _a : "standard";
}
function deriveSafetyScore(productKey, testingLevel, designQuality, manufacturingQuality) {
    var p = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!p || p.regulation === "standard")
        return 0.98;
    var test = exports.TESTING_LEVELS[testingLevel].safety;
    var complexityPenalty = (0, industries_1.clamp)((p.manufacturingFamilies.length - 1) * 0.035 + (p.modules.includes("technology") ? 0.07 : 0), 0, 0.18);
    return (0, industries_1.clamp)(test * 0.58 + designQuality * 0.2 + manufacturingQuality * 0.22 - complexityPenalty, 0.35, 0.995);
}
function seasonalityMultiplier(profile, tick) {
    var d = ((tick % 360) + 360) % 360;
    if (profile === "flat")
        return 1;
    if (profile === "summer") {
        // northern-hemisphere style annual cycle: strongest around mid-year.
        var wave = Math.cos(((d - 180) / 360) * Math.PI * 2);
        return (0, industries_1.clamp)(1 + wave * 0.42, 0.62, 1.42);
    }
    if (profile === "winter") {
        var wave = Math.cos((d / 360) * Math.PI * 2);
        return (0, industries_1.clamp)(1 + wave * 0.38, 0.65, 1.38);
    }
    if (profile === "christmas") {
        if (d >= 300 && d < 345)
            return 1.35 + ((d - 300) / 45) * 0.9;
        if (d >= 345)
            return 2.25 - ((d - 345) / 15) * 0.35;
        if (d < 35)
            return 0.62 + (d / 35) * 0.18;
        if (d >= 250)
            return 1 + ((d - 250) / 50) * 0.35;
        return 0.88;
    }
    if (profile === "back_to_school") {
        var dist = Math.abs(d - 235);
        return (0, industries_1.clamp)(1.7 - dist / 95, 0.72, 1.7);
    }
    if (profile === "fashion") {
        var spring = Math.exp(-Math.pow((d - 105) / 40, 2));
        var fall = Math.exp(-Math.pow((d - 285) / 42, 2));
        return (0, industries_1.clamp)(0.72 + spring * 0.7 + fall * 0.9, 0.7, 1.65);
    }
    return 1;
}
function productDemandMultiplier(sku, tick) {
    var _a;
    var p = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    if (!p)
        return 1;
    var seasonal = seasonalityMultiplier(p.lifecycle.seasonality, tick);
    var momentum = (0, industries_1.clamp)((_a = sku.marketMomentum) !== null && _a !== void 0 ? _a : 1, 0.35, 3);
    var inventoryAge = inventoryFreshnessMultiplier(sku, tick, p);
    return seasonal * momentum * inventoryAge;
}
function updateProductMomentum(w, sku) {
    var _a, _b;
    var p = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    if (!p || sku.status !== "active" || sku.releasedToMarket !== true)
        return;
    if (w.tick % 30 !== 0)
        return;
    var volatility = p.lifecycle.hitVolatility;
    var age = Math.max(1, w.tick - Math.max(1, sku.launchTick));
    var velocity = sku.unitsSoldTotal / age;
    var qualitySignal = sku.designQuality * 0.26 + sku.perceivedQuality * 0.22 + sku.fame * 0.24;
    var velocitySignal = (0, industries_1.clamp)(Math.log10(1 + velocity) / 3.2, 0, 0.34);
    // High-volatility products can meaningfully break out or fade. Low-volatility products stay close to 1x.
    var noise = (Math.random() - 0.5) * 2 * volatility * 0.58;
    var ceiling = 1.08 + volatility * 2.0;
    var floor = Math.max(0.42, 0.88 - volatility * 0.42);
    var target = (0, industries_1.clamp)(0.66 + qualitySignal + velocitySignal + noise, floor, ceiling);
    var current = (_a = sku.marketMomentum) !== null && _a !== void 0 ? _a : 1;
    sku.marketMomentum = (0, industries_1.clamp)(current + (target - current) * (0.18 + volatility * 0.22), floor, ceiling);
    sku.peakMomentum = Math.max((_b = sku.peakMomentum) !== null && _b !== void 0 ? _b : 1, sku.marketMomentum);
    var nowBreakout = sku.marketMomentum >= 1.65 && volatility >= 0.45;
    if (nowBreakout && !sku.breakout && (sku.lastMomentumEventTick == null || w.tick - sku.lastMomentumEventTick > 180)) {
        sku.breakout = true;
        sku.lastMomentumEventTick = w.tick;
        w.events.push({ tick: w.tick, kind: "market", text: "\uD83D\uDD25 ".concat(sku.name, " is breaking out \u2014 demand momentum has accelerated sharply.") });
    }
    else if (sku.breakout && sku.marketMomentum < 1.18) {
        sku.breakout = false;
        if (sku.lastMomentumEventTick == null || w.tick - sku.lastMomentumEventTick > 180) {
            sku.lastMomentumEventTick = w.tick;
            w.events.push({ tick: w.tick, kind: "market", text: "\uD83D\uDCC9 ".concat(sku.name, "'s breakout momentum has cooled.") });
        }
    }
}
function ensureInventoryLots(sku, tick) {
    if (!sku.inventoryLots)
        sku.inventoryLots = [];
    var tracked = sku.inventoryLots.reduce(function (a, lot) { return a + lot.units; }, 0);
    var gap = Math.max(0, sku.inventory - tracked);
    if (gap > 0.001)
        sku.inventoryLots.push({ id: "legacy_".concat(sku.id, "_").concat(tick), units: gap, receivedTick: tick, unitCost: sku.unitCost });
}
function receiveInventoryLot(sku, units, tick, unitCost) {
    var _a;
    if (unitCost === void 0) { unitCost = sku.unitCost; }
    if (units <= 0)
        return;
    sku.inventoryLots = (_a = sku.inventoryLots) !== null && _a !== void 0 ? _a : [];
    sku.inventoryLots.push({ id: "lot_".concat(sku.id, "_").concat(tick, "_").concat(sku.inventoryLots.length), units: units, receivedTick: tick, unitCost: unitCost });
    sku.inventory = sku.inventoryLots.reduce(function (a, lot) { return a + lot.units; }, 0);
}
function consumeInventoryLots(sku, units, tick) {
    ensureInventoryLots(sku, tick);
    var left = Math.max(0, units);
    var lots = sku.inventoryLots;
    lots.sort(function (a, b) { return a.receivedTick - b.receivedTick; });
    for (var _i = 0, lots_1 = lots; _i < lots_1.length; _i++) {
        var lot = lots_1[_i];
        if (left <= 0)
            break;
        var take = Math.min(left, lot.units);
        lot.units -= take;
        left -= take;
    }
    sku.inventoryLots = lots.filter(function (lot) { return lot.units > 0.001; });
    sku.inventory = sku.inventoryLots.reduce(function (a, lot) { return a + lot.units; }, 0);
    return units - left;
}
function lotFreshness(lot, tick, p) {
    var age = Math.max(0, tick - lot.receivedTick);
    if (p.lifecycle.shelfLifeDays != null) {
        var ratio_1 = age / Math.max(1, p.lifecycle.shelfLifeDays);
        if (ratio_1 >= 1)
            return 0;
        if (ratio_1 <= 0.65)
            return 1;
        return (0, industries_1.clamp)(1 - (ratio_1 - 0.65) * 1.5, 0.48, 1);
    }
    // Non-perishables can still become commercially stale because the archetype itself is trend/tech sensitive.
    var commercialWindow = Math.max(180, p.lifecycle.lifetimeDays * (0.32 + (1 - p.lifecycle.obsolescence) * 0.35));
    var ratio = age / commercialWindow;
    if (ratio <= 0.55)
        return 1;
    return (0, industries_1.clamp)(1 - (ratio - 0.55) * p.lifecycle.obsolescence * 0.85, 0.55, 1);
}
function inventoryFreshnessMultiplier(sku, tick, p) {
    var _a;
    if (p === void 0) { p = (0, productCatalog_1.archetypeByKey)(sku.productKey); }
    if (!p || !((_a = sku.inventoryLots) === null || _a === void 0 ? void 0 : _a.length))
        return 1;
    var units = 0, weighted = 0;
    for (var _i = 0, _b = sku.inventoryLots; _i < _b.length; _i++) {
        var lot = _b[_i];
        units += lot.units;
        weighted += lot.units * lotFreshness(lot, tick, p);
    }
    return units > 0 ? (0, industries_1.clamp)(weighted / units, 0.35, 1) : 1;
}
function inventoryAgeStatus(sku, tick) {
    var _a;
    var p = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    var freshness = inventoryFreshnessMultiplier(sku, tick, p);
    var riskUnits = 0;
    if (p && ((_a = sku.inventoryLots) === null || _a === void 0 ? void 0 : _a.length)) {
        for (var _i = 0, _b = sku.inventoryLots; _i < _b.length; _i++) {
            var lot = _b[_i];
            if (lotFreshness(lot, tick, p) < 0.75)
                riskUnits += lot.units;
        }
    }
    var label = freshness > 0.92 ? "Fresh" : freshness > 0.78 ? "Normal" : freshness > 0.58 ? "Aging" : "Clearance risk";
    return { label: label, freshness: freshness, riskUnits: riskUnits };
}
function processInventoryAgeing(w, sku) {
    var _a;
    var p = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    if (!p)
        return;
    ensureInventoryLots(sku, w.tick);
    var expired = 0;
    if (p.lifecycle.shelfLifeDays != null && ((_a = sku.inventoryLots) === null || _a === void 0 ? void 0 : _a.length)) {
        for (var _i = 0, _b = sku.inventoryLots; _i < _b.length; _i++) {
            var lot = _b[_i];
            if (w.tick - lot.receivedTick >= p.lifecycle.shelfLifeDays)
                expired += lot.units;
        }
        if (expired > 0) {
            sku.inventoryLots = sku.inventoryLots.filter(function (lot) { return w.tick - lot.receivedTick < p.lifecycle.shelfLifeDays; });
            sku.inventory = sku.inventoryLots.reduce(function (a, lot) { return a + lot.units; }, 0);
            var writeOff = expired * sku.unitCost;
            w.player.cash -= writeOff * 0.08; // disposal / handling; production cost was already paid.
            w.events.push({ tick: w.tick, kind: "inventory", text: "\uD83D\uDDD1 ".concat(sku.name, ": ").concat(Math.round(expired).toLocaleString(), " units expired and were written off.") });
        }
    }
    var status = inventoryAgeStatus(sku, w.tick);
    if (status.riskUnits > 1000 && status.freshness < 0.72 && (sku.lastInventoryAgeAlertTick == null || w.tick - sku.lastInventoryAgeAlertTick >= 90)) {
        sku.lastInventoryAgeAlertTick = w.tick;
        w.events.push({ tick: w.tick, kind: "inventory", text: "\uD83C\uDFF7 ".concat(sku.name, " has ").concat(Math.round(status.riskUnits).toLocaleString(), " aging units \u2014 discounting or faster sell-through may be needed.") });
    }
}
function maybeTriggerRecall(w, sku) {
    var _a, _b, _c;
    var p = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    if (!p || p.regulation === "standard" || sku.status !== "active" || sku.releasedToMarket !== true || sku.inventory <= 0 || w.tick % 30 !== 0)
        return;
    var safety = (0, industries_1.clamp)((_a = sku.safetyScore) !== null && _a !== void 0 ? _a : 0.75, 0.2, 0.999);
    var baseMonthly = p.regulation === "food_safety" ? 0.010 : p.regulation === "child_safety" ? 0.007 : 0.0035;
    var complexity = 1 + Math.max(0, p.manufacturingFamilies.length - 1) * 0.18 + (p.modules.includes("technology") ? 0.3 : 0);
    var risk = baseMonthly * complexity * Math.pow((1 - safety) / 0.25, 2);
    if (Math.random() >= risk)
        return;
    var severity = (0, industries_1.clamp)(0.35 + Math.random() * 0.45, 0.3, 0.85);
    var recalled = sku.inventory * severity;
    consumeInventoryLots(sku, recalled, w.tick);
    var directCost = recalled * (sku.unitCost + sku.listPrice * 0.08);
    w.player.cash -= directCost;
    sku.recallCount = ((_b = sku.recallCount) !== null && _b !== void 0 ? _b : 0) + 1;
    sku.fame = (0, industries_1.clamp)(sku.fame - 0.18, 0, 1);
    sku.marketMomentum = (0, industries_1.clamp)(((_c = sku.marketMomentum) !== null && _c !== void 0 ? _c : 1) * 0.55, 0.35, 3);
    w.events.push({ tick: w.tick, kind: "product", text: "\uD83D\uDEA8 ".concat(sku.name, " recall \u2014 ").concat(Math.round(recalled).toLocaleString(), " units removed after a safety issue. Direct cost ").concat(Math.round(directCost).toLocaleString(), ".") });
}
function applyFacetSelections(productKey, baseTarget, baseAttributes, selections) {
    var _a, _b, _c, _d, _e, _f;
    var p = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!((_a = p === null || p === void 0 ? void 0 : p.designFacets) === null || _a === void 0 ? void 0 : _a.length))
        return { target: baseTarget, attributes: baseAttributes };
    var target = __assign({}, baseTarget);
    var attributes = __assign({}, baseAttributes);
    var _loop_1 = function (facet) {
        var chosenId = (_b = selections === null || selections === void 0 ? void 0 : selections[facet.id]) !== null && _b !== void 0 ? _b : facet.defaultOptionId;
        var option = (_c = facet.options.find(function (x) { return x.id === chosenId; })) !== null && _c !== void 0 ? _c : facet.options[0];
        if (!option)
            return "continue";
        for (var _h = 0, _j = Object.entries((_d = option.consumerLean) !== null && _d !== void 0 ? _d : {}); _h < _j.length; _h++) {
            var _k = _j[_h], axis = _k[0], lean = _k[1];
            var key = axis;
            target[key] = (0, industries_1.clamp)(target[key] * 0.7 + Number(lean) * 0.3, 0, 1);
        }
        for (var _l = 0, _m = Object.entries((_e = option.attributeBias) !== null && _e !== void 0 ? _e : {}); _l < _m.length; _l++) {
            var _o = _m[_l], attr = _o[0], bias = _o[1];
            attributes[attr] = (0, industries_1.clamp)(((_f = attributes[attr]) !== null && _f !== void 0 ? _f : 0) + Number(bias), 0, 1);
        }
    };
    for (var _i = 0, _g = p.designFacets; _i < _g.length; _i++) {
        var facet = _g[_i];
        _loop_1(facet);
    }
    return { target: target, attributes: attributes };
}
