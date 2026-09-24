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
exports.getCustomers = getCustomers;
exports.satisfactionTarget = satisfactionTarget;
exports.updateCustomers = updateCustomers;
exports.cellLTV = cellLTV;
exports.customerTotals = customerTotals;
exports.applyWordOfMouthSpillover = applyWordOfMouthSpillover;
exports.buildAdjacency = buildAdjacency;
var types_1 = require("./types");
var industries_1 = require("./industries");
function getCustomers(w, ci) {
    var _a;
    return (_a = w.customers[ci]) !== null && _a !== void 0 ? _a : { count: 0, satisfaction: 0.6 };
}
// Satisfaction target: how well our offer serves this segment relative to the best rival,
// lifted by brand trust. 0..1. playerShareEff is our appeal, bestRivalEff the strongest competitor's.
// Satisfaction target combines how we compare to the best rival (relative) with the absolute
// quality/value the customer actually experiences, lifted by brand trust.
// qualityValue: 0..1 absolute experience (segment-perceived quality × price fairness).
function satisfactionTarget(playerEff, bestRivalEff, trust, qualityValue) {
    var rel = playerEff / (playerEff + bestRivalEff + 1e-6); // 0..1 head-to-head
    // absolute experience dominates: a bad/overpriced product dissatisfies even with no competition.
    // a quality-0.2 product yields qualityValue ~0.2 → satisfaction ~0.3 (steep churn); a great one ~0.9.
    return (0, industries_1.clamp)(0.05 + qualityValue * 0.7 + rel * 0.12 + trust * 0.13, 0, 1);
}
// Per-tick customer update for one cell. Returns ANNUAL run-rate revenue from this cell.
// - acquireShare: our appeal / total appeal (0..1) — the rate we win NON-customers
// - satTarget: satisfaction target from satisfactionTarget()
// - spendPerHead: annual $ per person in this segment
function updateCustomers(w, ci, cell, acquireShare, satTarget, spendPerHead) {
    var _a;
    var cur = (_a = w.customers[ci]) !== null && _a !== void 0 ? _a : { count: 0, satisfaction: satTarget };
    // satisfaction eases toward target (experience accumulates, doesn't snap)
    var satisfaction = cur.satisfaction + (satTarget - cur.satisfaction) * 0.05 * types_1.TICK_RATE_SCALE;
    // word-of-mouth: a happy, well-penetrated base AMPLIFIES acquisition; an unhappy one suppresses it.
    // Crucially this multiplies acquireShare (which itself collapses when marketing/awareness fade) —
    // so word-of-mouth can't manufacture growth on its own without ongoing reach.
    var penetration = cell.head > 0 ? cur.count / cell.head : 0;
    var wom = (0, industries_1.clamp)(1 + (satisfaction - 0.6) * 0.7 * penetration, 0.3, 1.25);
    // ACQUIRE: win a fraction of non-customers, driven by appeal share (gated on awareness/marketing) × WoM.
    var nonCustomers = Math.max(0, cell.head - cur.count);
    var acquireRate = (0, industries_1.clamp)(acquireShare * 0.03 * types_1.TICK_RATE_SCALE * wom, 0, 0.3);
    var acquired = nonCustomers * acquireRate;
    // CHURN: dissatisfied customers leave; also natural attrition that acquisition must outrun.
    // Steeper when satisfaction is low so a genuinely bad product visibly bleeds the base.
    var churnRate = (0, industries_1.clamp)((0.02 + (0.7 - satisfaction) * 0.28) * types_1.TICK_RATE_SCALE, 0.003, 0.2);
    var churned = cur.count * churnRate;
    var count = (0, industries_1.clamp)(cur.count + acquired - churned, 0, cell.head);
    w.customers[ci] = { count: count, satisfaction: satisfaction };
    var repeatLift = 0.7 + satisfaction * 0.5; // 0.7..1.2
    var annualRev = count * spendPerHead * repeatLift;
    return annualRev;
}
// Lifetime value estimate for a cell's customers: annual spend × repeat / churn-implied lifetime.
function cellLTV(w, ci, spendPerHead) {
    var c = getCustomers(w, ci);
    var churnRate = (0, industries_1.clamp)(0.02 + (0.7 - c.satisfaction) * 0.28, 0.01, 0.35);
    var annualChurn = (0, industries_1.clamp)(churnRate * (types_1.TICKS_PER_QUARTER * 4), 0.05, 0.97);
    var lifetimeYears = 1 / annualChurn;
    var repeatLift = 0.7 + c.satisfaction * 0.5;
    return spendPerHead * repeatLift * lifetimeYears;
}
// Aggregate stats for the Customer Base view.
function customerTotals(w) {
    var total = 0, satWeighted = 0, count = 0;
    for (var k in w.customers) {
        var c = w.customers[k];
        total += c.count;
        satWeighted += c.satisfaction * c.count;
        count++;
    }
    return { total: total, avgSatisfaction: total > 0 ? satWeighted / total : 0, activeCells: count };
}
// Word-of-mouth spillover: satisfied, well-penetrated segments lift awareness in DEMOGRAPHICALLY
// ADJACENT segments (same coords but one axis-step away) — a smaller, free echo of a local hit.
// Runs once per tick after the main loop; cheap because it only iterates cells we have customers in.
function applyWordOfMouthSpillover(w, adjacency) {
    var _a;
    var skuIds = w.player.skus.map(function (s) { return s.id; });
    if (skuIds.length === 0)
        return;
    for (var k in w.customers) {
        var ci = Number(k);
        var c = w.customers[ci];
        var cell = w.cube[ci];
        var penetration = cell.head > 0 ? c.count / cell.head : 0;
        // only happy, meaningfully-penetrated segments generate buzz worth spilling
        var buzz = (c.satisfaction - 0.6) * penetration; // can be negative (bad buzz)
        if (Math.abs(buzz) < 0.01)
            continue;
        var neighbors = adjacency[ci];
        if (!neighbors)
            continue;
        var spill = (0, industries_1.clamp)(buzz * 0.06, -0.02, 0.02); // small per-tick echo
        for (var _i = 0, neighbors_1 = neighbors; _i < neighbors_1.length; _i++) {
            var nj = neighbors_1[_i];
            for (var _b = 0, skuIds_1 = skuIds; _b < skuIds_1.length; _b++) {
                var id = skuIds_1[_b];
                var cur = (_a = w.cube[nj].awareness[id]) !== null && _a !== void 0 ? _a : 0;
                if (cur > 0.005 || spill > 0)
                    w.cube[nj].awareness[id] = (0, industries_1.clamp)(cur + spill * (1 - cur), 0, 1);
            }
        }
    }
}
// Precompute adjacency once (cells differing by exactly one axis-step on age/class/geography/family).
function buildAdjacency(w) {
    var adj = {};
    var idxByKey = {};
    var key = function (c) { return "".concat(c.gender, "|").concat(c.age, "|").concat(c.class, "|").concat(c.leaning, "|").concat(c.geography, "|").concat(c.family); };
    w.cube.forEach(function (cell, i) { idxByKey[key(cell.coord)] = i; });
    var order = {
        age: ["13-24", "25-39", "40-59", "60+"],
        class: ["Budget", "Middle", "Affluent"],
        geography: ["Urban", "Suburban", "Rural"],
        family: ["Single", "Couple", "Family"],
    };
    w.cube.forEach(function (cell, i) {
        var _a;
        var list = [];
        for (var _i = 0, _b = Object.keys(order); _i < _b.length; _i++) {
            var axis = _b[_i];
            var vals = order[axis];
            var idx = vals.indexOf(cell.coord[axis]);
            for (var _c = 0, _d = [-1, 1]; _c < _d.length; _c++) {
                var step = _d[_c];
                var nv = vals[idx + step];
                if (!nv)
                    continue;
                var nc = __assign(__assign({}, cell.coord), (_a = {}, _a[axis] = nv, _a));
                var ni = idxByKey[key(nc)];
                if (ni != null)
                    list.push(ni);
            }
        }
        adj[i] = list;
    });
    return adj;
}
