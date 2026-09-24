"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canManageSegments = canManageSegments;
exports.cellsInSegment = cellsInSegment;
exports.segmentTargetProfile = segmentTargetProfile;
exports.segmentStats = segmentStats;
exports.presetSegments = presetSegments;
exports.marketingAgencyFitForSegment = marketingAgencyFitForSegment;
exports.agencyFitStars = agencyFitStars;
exports.agencyFitLabel = agencyFitLabel;
var industries_1 = require("./industries");
var people_1 = require("./people");
function canManageSegments(w) {
    if ((0, people_1.teamEffectiveness)(w, "marketing") > 0 || (0, people_1.teamEffectiveness)(w, "strategy") > 0)
        return { ok: true, reason: "" };
    return { ok: false, reason: "Seat a Marketing or Strategy specialist before creating custom market segments." };
}
function cellsInSegment(w, filter) {
    return w.cube.filter(function (cell) {
        return industries_1.AXIS_KEYS.every(function (axis) {
            var allowed = filter[axis];
            return !allowed || allowed.length === 0 || allowed.includes(cell.coord[axis]);
        });
    });
}
function segmentTargetProfile(w, filter) {
    var cells = cellsInSegment(w, filter);
    var population = (0, industries_1.sum)(cells.map(function (c) { return c.head; }));
    var out = {};
    var _loop_1 = function (axis) {
        out[axis] = population > 0
            ? (0, industries_1.sum)(cells.map(function (c) { return c.head * (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(c.coord[axis])); })) / population
            : 0.5;
    };
    for (var _i = 0, AXIS_KEYS_1 = industries_1.AXIS_KEYS; _i < AXIS_KEYS_1.length; _i++) {
        var axis = AXIS_KEYS_1[_i];
        _loop_1(axis);
    }
    return out;
}
function segmentStats(w, filter) {
    var cells = cellsInSegment(w, filter);
    var population = (0, industries_1.sum)(cells.map(function (c) { return c.head; }));
    var market = (0, industries_1.sum)(cells.map(function (c) { return c.head * c.spend; }));
    var baseMarket = (0, industries_1.sum)(cells.map(function (c) { return c.baseHead * c.spend; }));
    var needPref = {};
    var _loop_2 = function (need) {
        needPref[need.key] = population > 0
            ? (0, industries_1.sum)(cells.map(function (c) { var _a; return c.head * ((_a = c.needPref[need.key]) !== null && _a !== void 0 ? _a : 0); })) / population
            : 0;
    };
    for (var _i = 0, _a = w.cfg.needs; _i < _a.length; _i++) {
        var need = _a[_i];
        _loop_2(need);
    }
    // player captured value: from live cellFinance matched to these cells
    var captured = 0;
    if (w.live) {
        var keys = new Set(cells.map(function (c) { return "".concat(c.coord.gender, "|").concat(c.coord.age, "|").concat(c.coord.class, "|").concat(c.coord.leaning, "|").concat(c.coord.geography, "|").concat(c.coord.family); }));
        for (var _b = 0, _c = w.live.cellFinance; _b < _c.length; _b++) {
            var cf = _c[_b];
            var k = "".concat(cf.coord.gender, "|").concat(cf.coord.age, "|").concat(cf.coord.class, "|").concat(cf.coord.leaning, "|").concat(cf.coord.geography, "|").concat(cf.coord.family);
            if (keys.has(k))
                captured += cf.revenue;
        }
    }
    return {
        population: population,
        market: market,
        avgSpend: population > 0 ? market / population : 0,
        growth: baseMarket > 0 ? market / baseMarket - 1 : 0,
        needPref: needPref,
        cellCount: cells.length, playerShareValue: captured,
    };
}
// preset segment ideas to seed the manager
function presetSegments() {
    return [
        { id: "s_moms", name: "Soccer Moms", filter: { gender: ["Female"], age: ["25-39", "40-59"], geography: ["Suburban"], family: ["Family"], class: ["Middle", "Affluent"] } },
        { id: "s_lux", name: "Luxury Professionals", filter: { age: ["25-39", "40-59"], class: ["Affluent"], geography: ["Urban"] } },
        { id: "s_budget", name: "Budget Families", filter: { class: ["Budget"], family: ["Family"] } },
        { id: "s_young", name: "Young Trendsetters", filter: { age: ["13-24"], geography: ["Urban"] } },
    ];
}
function marketingAgencyFitForSegment(w, filter, agency) {
    var cells = cellsInSegment(w, filter);
    var population = (0, industries_1.sum)(cells.map(function (c) { return c.head; }));
    if (population <= 0)
        return 1;
    var weighted = 0;
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var cell = cells_1[_i];
        var fit = 1;
        for (var _a = 0, _b = Object.entries(agency.strengthSkew); _a < _b.length; _a++) {
            var _c = _b[_a], axisRaw = _c[0], skewRaw = _c[1];
            var axis = axisRaw;
            var vals = industries_1.AXES[axis];
            var idx = Math.max(0, vals.indexOf(cell.coord[axis]));
            var pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
            fit *= (0, industries_1.clamp)(1 + Number(skewRaw) * (pos - 0.5) * 0.8, 0.7, 1.3);
        }
        weighted += fit * cell.head;
    }
    return weighted / population;
}
function agencyFitStars(fit) {
    if (fit >= 1.13)
        return 5;
    if (fit >= 1.04)
        return 4;
    if (fit >= 0.96)
        return 3;
    if (fit >= 0.88)
        return 2;
    return 1;
}
function agencyFitLabel(fit) {
    var stars = agencyFitStars(fit);
    return stars >= 5 ? "Excellent target fit" : stars === 4 ? "Strong target fit" : stars === 3 ? "Neutral target fit" : stars === 2 ? "Weak target fit" : "Poor target fit";
}
