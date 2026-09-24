"use strict";
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
exports.computeSwot = computeSwot;
exports.computePorter = computePorter;
exports.computeBcg = computeBcg;
exports.computeBoardMemo = computeBoardMemo;
exports.computeProductAnalysis = computeProductAnalysis;
var industries_1 = require("./industries");
var cube_1 = require("./cube");
var coordLabel = function (c) {
    return "".concat(c.age, " \u00B7 ").concat(c.gender, " \u00B7 ").concat(c.class, " \u00B7 ").concat(c.leaning);
};
function skuTarget(w, s) {
    var pt = w.cfg.products.find(function (p) { return p.key === s.productKey; });
    return (0, cube_1.effectiveTarget)(s.target, pt);
}
function computeSwot(w) {
    var live = w.live;
    var s = [], we = [], o = [], t = [];
    if (!live)
        return { strengths: s, weaknesses: we, opportunities: o, threats: t };
    // STRENGTHS: top contribution cells you own
    var winners = __spreadArray([], live.cellFinance, true).filter(function (c) { return c.contribution > 0; }).sort(function (a, b) { return b.contribution - a.contribution; }).slice(0, 3);
    for (var _i = 0, winners_1 = winners; _i < winners_1.length; _i++) {
        var c = winners_1[_i];
        s.push({ text: "Strong, profitable position in ".concat(coordLabel(c.coord), " (").concat(money(c.contribution), "/Q contribution)."), weight: c.contribution });
    }
    if (live.income.contribution > 0 && live.income.contribution / Math.max(1, live.income.netRevenue) > 0.35)
        s.push({ text: "Healthy contribution margin (".concat(pct(live.income.contribution / live.income.netRevenue), ") \u2014 pricing and cost are well matched."), weight: live.income.contribution });
    // WEAKNESSES: negative-contribution cells, cash cycle, stockouts
    var bleeders = __spreadArray([], live.cellFinance, true).filter(function (c) { return c.contribution < 0; }).sort(function (a, b) { return a.contribution - b.contribution; }).slice(0, 2);
    for (var _a = 0, bleeders_1 = bleeders; _a < bleeders_1.length; _a++) {
        var c = bleeders_1[_a];
        we.push({ text: "Serving ".concat(coordLabel(c.coord), " at a loss (").concat(money(c.contribution), "/Q) \u2014 marketing or channel cost exceeds margin here."), weight: -c.contribution });
    }
    if (live.cashflow.cashCycleDays > 150)
        we.push({ text: "Long cash conversion cycle (".concat(Math.round(live.cashflow.cashCycleDays), " days) ties up working capital."), weight: live.cashflow.cashCycleDays * 1000 });
    if (w.player.lostSales > 5000)
        we.push({ text: "Cumulative lost sales from stock-outs (".concat(num(w.player.lostSales), " units) \u2014 production isn't keeping up with demand."), weight: w.player.lostSales });
    if (w.player.cash < 0)
        we.push({ text: "Cash is negative (".concat(money(w.player.cash), ") despite the P&L \u2014 a classic profit-vs-cash trap."), weight: 1e9 });
    // OPPORTUNITIES: unserved high-value cells — combined demographic AND need fit
    var allProducts = __spreadArray(__spreadArray([], w.player.skus.map(function (sk) { return ({ tgt: skuTarget(w, sk), attrs: sk.attributes }); }), true), w.comps.flatMap(function (c) { return c.products.map(function (p) { return ({ tgt: p.target, attrs: p.attributes }); }); }), true);
    var gaps = w.cube.map(function (cell) {
        var best = allProducts.length ? Math.max.apply(Math, allProducts.map(function (p) { return (0, cube_1.fit)(p.tgt, cell, w.cfg) * (0, cube_1.needMatch)(p.attrs, cell, w.cfg); })) : 0;
        return { cell: cell, market: cell.head * cell.spend, best: best };
    }).filter(function (g) { return g.best < 0.35 && g.market > 1200000; }).sort(function (a, b) { return b.market - a.market; }).slice(0, 3);
    for (var _b = 0, gaps_1 = gaps; _b < gaps_1.length; _b++) {
        var g = gaps_1[_b];
        o.push({ text: "Underserved: ".concat(coordLabel(g.cell.coord), " (").concat(money(g.market), " market \u2014 weak fit on demographics or needs)."), weight: g.market });
    }
    // a growing segment is an opportunity
    var growing = w.cube.filter(function (c) { return (c.head - c.baseHead) / c.baseHead > 0.02; });
    if (growing.length) {
        var top_1 = growing.sort(function (a, b) { return (b.head * b.spend) - (a.head * a.spend); })[0];
        o.push({ text: "".concat(top_1.coord.age, " cohort is growing \u2014 demand tailwind if you're positioned there."), weight: top_1.head * top_1.spend });
    }
    // THREATS: rival invasions, shocks, contested strongholds
    var recentRival = w.events.filter(function (e) { return e.kind === "rival" && e.tick > w.tick - 24 * 3; });
    for (var _c = 0, _d = recentRival.slice(-2); _c < _d.length; _c++) {
        var e = _d[_c];
        t.push({ text: e.text.replace(/^[^ ]+ /, ""), weight: 1e6 });
    }
    if (w.shock)
        t.push({ text: w.shock.type === "natality" ? "Natality crash is shrinking the youngest cohort — bets there will erode." : "Cultural drift toward ".concat(w.shock.dir, " is reshaping demand."), weight: 5e6 });
    if (live.avgMarginCut > 0.38)
        t.push({ text: "High channel dependence \u2014 retailers take ".concat(pct(live.avgMarginCut), " of gross. Buyer power is squeezing you."), weight: live.avgMarginCut * 1e6 });
    var sortW = function (arr) { return arr.sort(function (a, b) { return b.weight - a.weight; }).slice(0, 4); };
    return { strengths: sortW(s), weaknesses: sortW(we), opportunities: sortW(o), threats: sortW(t) };
}
function computePorter(w) {
    var live = w.live;
    if (!live)
        return [];
    // Buyer power: channel cut + concentration (few contracts = more dependence)
    var buyer = (0, industries_1.clamp)(live.avgMarginCut * 1.3 + (w.player.contracts.length <= 1 ? 0.2 : 0));
    // Rivalry: how contested your owned cells are (player share vs comp share where you sell)
    var contested = 0, owned = 0;
    for (var _i = 0, _a = live.cellFinance; _i < _a.length; _i++) {
        var cf = _a[_i];
        owned++;
        // approximate: if a cell has revenue but you're not dominant, it's contested
    }
    var rivalryRaw = w.comps.reduce(function (a, c) { return a + c.products.length; }, 0); // more rival products = more rivalry
    var rivalry = (0, industries_1.clamp)(0.25 + rivalryRaw * 0.12);
    // Threat of entrants: recent rival launches
    var launches = w.events.filter(function (e) { return e.kind === "rival" && e.text.includes("launched") && e.tick > w.tick - 24 * 4; }).length;
    var entrants = (0, industries_1.clamp)(0.2 + launches * 0.3);
    // Substitutes: cultural/natality shock reduces category certainty
    var substitutes = (0, industries_1.clamp)(0.25 + (w.shock ? 0.35 : 0));
    // Supplier power: outsourced production = more supplier exposure
    var outsourcedShare = w.player.skus.length ? w.player.skus.filter(function (s) { return s.method === "outsource"; }).length / w.player.skus.length : 0.5;
    var supplier = (0, industries_1.clamp)(0.3 + outsourcedShare * 0.25);
    return [
        { name: "Buyer Power", pressure: buyer, note: w.player.contracts.length <= 1 ? "You depend on a single channel that takes a large cut." : "Channels take ".concat(pct(live.avgMarginCut), " of gross.") },
        { name: "Competitive Rivalry", pressure: rivalry, note: "".concat(rivalryRaw, " rival products competing across the cube.") },
        { name: "Threat of New Entrants", pressure: entrants, note: launches ? "".concat(launches, " rival product launch(es) recently.") : "No recent entries into your space." },
        { name: "Substitutes", pressure: substitutes, note: w.shock ? "A market shock is shifting where demand sits." : "Category demand is stable for now." },
        { name: "Supplier Power", pressure: supplier, note: outsourcedShare > 0.5 ? "Outsourced production exposes you to supplier terms." : "Mostly in-house — limited supplier leverage." },
    ];
}
function computeBcg(w) {
    var live = w.live;
    if (!live)
        return [];
    return w.player.skus.map(function (s, i) {
        var _a, _b, _c, _d;
        var tgt = skuTarget(w, s);
        // weight cells by this sku's fit; growth = fit-weighted head change vs base
        var wsum = 0, growthAccum = 0, myAccum = 0, rivalAccum = 0;
        for (var _i = 0, _e = w.cube; _i < _e.length; _i++) {
            var cell = _e[_i];
            var f = (0, cube_1.fit)(tgt, cell, w.cfg);
            if (f < 0.15)
                continue;
            wsum += f;
            growthAccum += f * ((cell.head - cell.baseHead) / cell.baseHead);
            // my strength vs the single strongest rival product, fit-weighted
            var myStrength = ((_a = cell.awareness[s.id]) !== null && _a !== void 0 ? _a : 0) * f;
            var bestRival = 0;
            for (var _f = 0, _g = w.comps; _f < _g.length; _f++) {
                var c = _g[_f];
                for (var _h = 0, _j = c.products; _h < _j.length; _h++) {
                    var cp = _j[_h];
                    bestRival = Math.max(bestRival, ((_b = cell.awareness[cp.awarenessKey]) !== null && _b !== void 0 ? _b : 0) * (0, cube_1.fit)(cp.target, cell, w.cfg));
                }
            }
            myAccum += f * myStrength;
            rivalAccum += f * bestRival;
        }
        var growth = wsum ? growthAccum / wsum : 0;
        // relative share = my fit-weighted strength vs strongest rival's; bounded 0..3 for display
        var relShare = (0, industries_1.clamp)(rivalAccum > 0.001 ? myAccum / rivalAccum : (myAccum > 0.001 ? 2 : 0), 0, 3);
        var rev = (_d = (_c = live.skuResults[i]) === null || _c === void 0 ? void 0 : _c.revenue) !== null && _d !== void 0 ? _d : 0;
        var highGrowth = growth > 0.003;
        var highShare = relShare > 1.0;
        // a product with negligible sales is a Dog in practice, whatever the abstract share math says
        var totalRev = (0, industries_1.sum)(live.skuResults.map(function (r) { return r.revenue; })) || 1;
        var negligible = rev < totalRev * 0.03;
        var klass = negligible ? "Dog"
            : highGrowth ? (highShare ? "Star" : "Question Mark")
                : (highShare ? "Cash Cow" : "Dog");
        return { sku: s.name, growth: growth, relShare: relShare, klass: klass, revenue: rev };
    });
}
function computeBoardMemo(w) {
    var live = w.live;
    if (!live)
        return { headline: "Awaiting first results.", whatHappened: [], issues: [] };
    var I = live.income, F = live.cashflow;
    var happened = [];
    var issues = [];
    // what happened
    happened.push("Net revenue ".concat(money(I.netRevenue), "/Q on ").concat(pct(live.overallShare), " market share; net profit ").concat(money(I.profit), "/Q."));
    if (Math.abs(I.profit - F.operatingCashFlow) > 200000)
        happened.push("Profit and operating cash flow diverged by ".concat(money(Math.abs(I.profit - F.operatingCashFlow)), " \u2014 working capital (").concat(Math.round(F.cashCycleDays), "-day cycle) is the cause."));
    var rivalEvents = w.events.filter(function (e) { return e.kind === "rival" && e.tick > w.tick - 24; });
    if (rivalEvents.length)
        happened.push(rivalEvents[rivalEvents.length - 1].text.replace(/^[^ ]+ /, ""));
    if (w.shock)
        happened.push(w.shock.type === "natality" ? "A natality crash is shrinking the youngest cohort." : "Population is drifting toward ".concat(w.shock.dir, "."));
    // issues, framed as questions
    var bleeders = __spreadArray([], live.cellFinance, true).filter(function (c) { return c.contribution < -10000; }).sort(function (a, b) { return a.contribution - b.contribution; });
    if (bleeders.length)
        issues.push("Your position in ".concat(coordLabel(bleeders[0].coord), " loses money each quarter. Do you reprice, cut marketing there, or exit?"));
    if (F.cash < 500000 && I.profit > 0)
        issues.push("You're profitable but cash is thin (".concat(money(F.cash), "). Do you slow production, renegotiate faster-paying channels, or draw credit?"));
    if (live.avgMarginCut > 0.38)
        issues.push("Retailers take ".concat(pct(live.avgMarginCut), " of every sale. Is it time to build owned channels even at the cost of reach?"));
    var bcg = computeBcg(w);
    var dogs = bcg.filter(function (b) { return b.klass === "Dog" && b.revenue > 0; });
    if (dogs.length)
        issues.push("".concat(dogs[0].sku, " is a low-share product in a flat market. Reposition it, harvest it, or kill it?"));
    var qmarks = bcg.filter(function (b) { return b.klass === "Question Mark"; });
    if (qmarks.length)
        issues.push("".concat(qmarks[0].sku, " sits in a growing market but you don't lead it. Do you invest to make it a Star before a rival does?"));
    if (issues.length === 0)
        issues.push("No acute issues this quarter. Where do you place the next bet before the market moves?");
    var headline = I.profit < 0
        ? "Losing money — the model needs attention."
        : F.cash < 0 ? "Profitable on paper, but out of cash."
            : live.overallShare > 0.05 ? "Holding a real position — now defend and extend it."
                : "Early traction. The bet is forming.";
    return { headline: headline, whatHappened: happened, issues: issues.slice(0, 3) };
}
// formatting helpers (local, to keep module self-contained)
function money(v) { var a = Math.abs(v), s = v < 0 ? "-" : ""; if (a >= 1e6)
    return "".concat(s, "$").concat((a / 1e6).toFixed(1), "M"); if (a >= 1e3)
    return "".concat(s, "$").concat((a / 1e3).toFixed(0), "k"); return "".concat(s, "$").concat(a.toFixed(0)); }
function num(v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? (v / 1e3).toFixed(0) + "k" : Math.round(v).toString(); }
function pct(v) { return "".concat((v * 100).toFixed(1), "%"); }
function computeProductAnalysis(w) {
    return w.player.skus.map(function (s) {
        var tgt = skuTarget(w, s);
        var rows = w.cube.map(function (cell) {
            var demoFit = (0, cube_1.fit)(tgt, cell, w.cfg);
            var needFit = (0, cube_1.needMatch)(s.attributes, cell, w.cfg);
            return { coord: cell.coord, market: cell.head * cell.spend, demoFit: demoFit, needFit: needFit, combined: demoFit * needFit };
        }).filter(function (r) { return r.market > 0; });
        var sorted = __spreadArray([], rows, true).sort(function (a, b) { return b.combined - a.combined; });
        var topNeeds = w.cfg.needs.map(function (n) { var _a; return ({ label: n.label, value: (_a = s.attributes[n.key]) !== null && _a !== void 0 ? _a : 0 }); }).sort(function (a, b) { return b.value - a.value; }).slice(0, 3);
        return { sku: s.name, best: sorted.slice(0, 4), worst: sorted.slice(-3).reverse(), topNeeds: topNeeds };
    });
}
