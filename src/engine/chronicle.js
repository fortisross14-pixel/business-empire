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
exports.createChronicle = createChronicle;
exports.migrateChronicleFromLegacy = migrateChronicleFromLegacy;
exports.ensureChronicle = ensureChronicle;
exports.recordChronicle = recordChronicle;
exports.updateChronicleTick = updateChronicleTick;
exports.recordProductLaunch = recordProductLaunch;
exports.recordProductDesignComplete = recordProductDesignComplete;
exports.recordPeopleEvent = recordPeopleEvent;
exports.recordBuildingEvent = recordBuildingEvent;
exports.productLegacyTags = productLegacyTags;
exports.chronicleRecords = chronicleRecords;
var types_1 = require("./types");
var moneyCompact = function (v) {
    var a = Math.abs(v);
    if (a >= 1e9)
        return "$".concat((a / 1e9).toFixed(a >= 10e9 ? 0 : 1), "B");
    if (a >= 1e6)
        return "$".concat((a / 1e6).toFixed(a >= 10e6 ? 0 : 1), "M");
    if (a >= 1e3)
        return "$".concat((a / 1e3).toFixed(0), "k");
    return "$".concat(a.toFixed(0));
};
function createChronicle(company, industryLabel, startingCash) {
    var state = {
        entries: [],
        annualReviews: [],
        unlockedMilestones: ["company_founded"],
        lifetimeRevenue: 0,
        lifetimeProfit: 0,
        yearAccumulator: {
            year: 1,
            revenue: 0,
            profit: 0,
            units: 0,
            startCash: startingCash,
            minCash: startingCash,
            maxCash: startingCash,
            peakShare: 0,
            startEmployees: 0,
        },
    };
    state.entries.push({
        id: "founding_0",
        tick: 0,
        year: 1,
        kind: "founding",
        importance: 3,
        title: "".concat(company, " founded"),
        text: "The company began in ".concat(industryLabel, " with ").concat(moneyCompact(startingCash), " of starting capital and a small operating campus."),
        icon: "🏁",
        entityType: "company",
        entityId: "player",
        tags: ["founding", "iconic"],
    });
    return state;
}
function migrateChronicleFromLegacy(w) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    var estimatedStartCash = (_c = (_b = (_a = w.history) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.cash) !== null && _c !== void 0 ? _c : w.player.cash;
    var state = createChronicle(w.company, w.cfg.label, estimatedStartCash);
    var pushLegacy = function (entry) {
        var _a, _b;
        state.entries.push(__assign(__assign({}, entry), { id: (_a = entry.id) !== null && _a !== void 0 ? _a : "legacy_".concat(entry.kind, "_").concat(entry.tick, "_").concat(state.entries.length), year: (_b = entry.year) !== null && _b !== void 0 ? _b : Math.floor(entry.tick / types_1.TICKS_PER_YEAR) + 1 }));
    };
    // Rebuild durable product history from launch ticks that already existed before Chronicle.
    var launched = __spreadArray([], ((_d = w.player.skus) !== null && _d !== void 0 ? _d : []), true).filter(function (sku) { return sku.launchTick > 0; }).sort(function (a, b) { return a.launchTick - b.launchTick; });
    launched.forEach(function (sku, index) {
        state.unlockedMilestones.push("launch_".concat(sku.id));
        pushLegacy({
            tick: sku.launchTick,
            kind: "product",
            importance: index === 0 ? 3 : 2,
            title: "".concat(sku.name, " launched"),
            text: "".concat(sku.name, " entered the market").concat(sku.assignedPmName ? " after development led by ".concat(sku.assignedPmName) : "", "."),
            icon: index === 0 ? "🚀" : "📦",
            entityType: "product",
            entityId: sku.id,
            tags: index === 0 ? ["product", "launch", "iconic", "imported"] : ["product", "launch", "imported"],
        });
    });
    // Careers already store exact historic ticks, so preserve important human moments.
    var everyone = __spreadArray(__spreadArray([], ((_e = w.player.personnel) !== null && _e !== void 0 ? _e : []), true), ((_f = w.player.formerPersonnel) !== null && _f !== void 0 ? _f : []), true);
    for (var _i = 0, everyone_1 = everyone; _i < everyone_1.length; _i++) {
        var p = everyone_1[_i];
        if (p.hiredTick > 0)
            pushLegacy({ tick: p.hiredTick, kind: "people", importance: p.level >= 3 ? 2 : 1, title: "".concat(p.name, " joined"), text: "".concat(p.name, " joined the company."), icon: "👤", entityType: "person", entityId: p.id, tags: ["people", "hire", "imported"] });
        for (var _u = 0, _v = (_g = p.careerEvents) !== null && _g !== void 0 ? _g : []; _u < _v.length; _u++) {
            var e = _v[_u];
            if (e.kind !== "promotion" || e.tick === p.hiredTick)
                continue;
            pushLegacy({ tick: e.tick, kind: "people", importance: 1, title: "".concat(p.name, " promoted"), text: e.text, icon: "⬆️", entityType: "person", entityId: p.id, tags: ["people", "promotion", "imported"] });
        }
        if ("leftTick" in p && Number(p.leftTick) > 0)
            pushLegacy({ tick: Number(p.leftTick), kind: "people", importance: p.level >= 3 ? 2 : 1, title: "".concat(p.name, " left the company"), text: String((_h = p.leftReason) !== null && _h !== void 0 ? _h : "Left the company."), icon: "👋", entityType: "person", entityId: p.id, tags: ["people", "departure", "imported"] });
    }
    state.entries.sort(function (a, b) { return a.tick - b.tick || a.importance - b.importance; });
    // If the old rolling history still contains a complete historical year, rebuild that annual review too.
    // (Actual daily units were not stored before v5, so imported reviews leave units at zero.)
    var completedYears = Math.floor(w.tick / types_1.TICKS_PER_YEAR);
    var _loop_1 = function (year) {
        var start = (year - 1) * types_1.TICKS_PER_YEAR;
        var end = year * types_1.TICKS_PER_YEAR;
        var hist = ((_j = w.history) !== null && _j !== void 0 ? _j : []).filter(function (h) { return h.tick > start && h.tick <= end; });
        if (hist.length < types_1.TICKS_PER_YEAR * .9)
            return "continue";
        var yearEntries = state.entries.filter(function (e) { return e.tick > start && e.tick <= end; });
        var review = {
            year: year,
            revenue: hist.reduce(function (sum, h) { var _a; return sum + ((_a = h.revenue) !== null && _a !== void 0 ? _a : 0) / types_1.TICKS_PER_QUARTER; }, 0),
            profit: hist.reduce(function (sum, h) { var _a; return sum + ((_a = h.profit) !== null && _a !== void 0 ? _a : 0) / types_1.TICKS_PER_QUARTER; }, 0),
            units: 0,
            startCash: (_l = (_k = hist[0]) === null || _k === void 0 ? void 0 : _k.cash) !== null && _l !== void 0 ? _l : estimatedStartCash,
            endCash: (_o = (_m = hist.at(-1)) === null || _m === void 0 ? void 0 : _m.cash) !== null && _o !== void 0 ? _o : w.player.cash,
            peakShare: Math.max.apply(Math, __spreadArray([0], hist.map(function (h) { var _a; return (_a = h.share) !== null && _a !== void 0 ? _a : 0; }), false)),
            yearEndShare: (_q = (_p = hist.at(-1)) === null || _p === void 0 ? void 0 : _p.share) !== null && _q !== void 0 ? _q : 0,
            productsLaunched: launched.filter(function (sku) { return sku.launchTick > start && sku.launchTick <= end; }).map(function (sku) { return sku.name; }),
            hires: everyone.filter(function (p) { return p.hiredTick > start && p.hiredTick <= end; }).length,
            promotions: everyone.flatMap(function (p) { var _a; return (_a = p.careerEvents) !== null && _a !== void 0 ? _a : []; }).filter(function (e) { return e.kind === "promotion" && e.tick > start && e.tick <= end; }).length,
            departures: everyone.filter(function (p) { return "leftTick" in p && Number(p.leftTick) > start && Number(p.leftTick) <= end; }).length,
            endingEmployees: everyone.filter(function (p) { return p.hiredTick <= end && (!("leftTick" in p) || Number(p.leftTick) > end); }).length,
            headline: "",
            highlightEntryIds: yearEntries.filter(function (e) { return e.importance >= 2; }).sort(function (a, b) { return b.importance - a.importance || a.tick - b.tick; }).slice(0, 6).map(function (e) { return e.id; }),
        };
        review.headline = annualHeadline(w, review, state.annualReviews.at(-1));
        state.annualReviews.push(review);
        state.unlockedMilestones.push("annual_review_".concat(year));
    };
    for (var year = 1; year <= completedYears; year++) {
        _loop_1(year);
    }
    // Reconstruct the current year's revenue/profit/cash envelope from the rolling history buffer.
    var currentYear = Math.floor(w.tick / types_1.TICKS_PER_YEAR) + 1;
    var startTick = (currentYear - 1) * types_1.TICKS_PER_YEAR;
    var currentHist = ((_r = w.history) !== null && _r !== void 0 ? _r : []).filter(function (h) { return h.tick > startTick && h.tick <= w.tick; });
    state.yearAccumulator = {
        year: currentYear,
        revenue: currentHist.reduce(function (sum, h) { var _a; return sum + ((_a = h.revenue) !== null && _a !== void 0 ? _a : 0) / types_1.TICKS_PER_QUARTER; }, 0),
        profit: currentHist.reduce(function (sum, h) { var _a; return sum + ((_a = h.profit) !== null && _a !== void 0 ? _a : 0) / types_1.TICKS_PER_QUARTER; }, 0),
        units: 0, // old history did not store actual units per day; tracking becomes exact after migration.
        startCash: (_t = (_s = currentHist[0]) === null || _s === void 0 ? void 0 : _s.cash) !== null && _t !== void 0 ? _t : w.player.cash,
        minCash: currentHist.length ? Math.min.apply(Math, currentHist.map(function (h) { return h.cash; })) : w.player.cash,
        maxCash: currentHist.length ? Math.max.apply(Math, currentHist.map(function (h) { return h.cash; })) : w.player.cash,
        peakShare: currentHist.length ? Math.max.apply(Math, currentHist.map(function (h) { var _a; return (_a = h.share) !== null && _a !== void 0 ? _a : 0; })) : 0,
        startEmployees: w.player.personnel.length,
    };
    // Conservative estimate so old long-running companies don't immediately unlock implausible lifetime records.
    state.lifetimeRevenue = Math.max(state.yearAccumulator.revenue, 0);
    state.lifetimeProfit = state.yearAccumulator.profit;
    return state;
}
function ensureChronicle(w) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!w.chronicle)
        w.chronicle = createChronicle(w.company, w.cfg.label, w.player.cash);
    w.chronicle.entries = (_a = w.chronicle.entries) !== null && _a !== void 0 ? _a : [];
    w.chronicle.annualReviews = (_b = w.chronicle.annualReviews) !== null && _b !== void 0 ? _b : [];
    w.chronicle.unlockedMilestones = (_c = w.chronicle.unlockedMilestones) !== null && _c !== void 0 ? _c : [];
    w.chronicle.lifetimeRevenue = (_d = w.chronicle.lifetimeRevenue) !== null && _d !== void 0 ? _d : 0;
    w.chronicle.lifetimeProfit = (_e = w.chronicle.lifetimeProfit) !== null && _e !== void 0 ? _e : 0;
    if (!w.chronicle.yearAccumulator) {
        var year = Math.floor(w.tick / types_1.TICKS_PER_YEAR) + 1;
        w.chronicle.yearAccumulator = { year: year, revenue: 0, profit: 0, units: 0, startCash: w.player.cash, minCash: w.player.cash, maxCash: w.player.cash, peakShare: (_g = (_f = w.live) === null || _f === void 0 ? void 0 : _f.shareYear) !== null && _g !== void 0 ? _g : 0, startEmployees: w.player.personnel.length };
    }
    return w.chronicle;
}
function recordChronicle(w, data) {
    var _a, _b, _c;
    var c = ensureChronicle(w);
    if (data.dedupeKey && c.unlockedMilestones.includes(data.dedupeKey))
        return null;
    if (data.dedupeKey)
        c.unlockedMilestones.push(data.dedupeKey);
    var seq = c.entries.filter(function (e) { return e.tick === w.tick; }).length;
    var entry = {
        id: "".concat((_a = data.dedupeKey) !== null && _a !== void 0 ? _a : data.kind, "_").concat(w.tick, "_").concat(seq),
        tick: w.tick,
        year: Math.floor(w.tick / types_1.TICKS_PER_YEAR) + 1,
        kind: data.kind,
        importance: (_b = data.importance) !== null && _b !== void 0 ? _b : 1,
        title: data.title,
        text: data.text,
        icon: (_c = data.icon) !== null && _c !== void 0 ? _c : "•",
        entityType: data.entityType,
        entityId: data.entityId,
        tags: data.tags,
        metricValue: data.metricValue,
    };
    c.entries.push(entry);
    return entry;
}
function milestone(w, key, importance, title, text, icon, metricValue) {
    return recordChronicle(w, { kind: "milestone", importance: importance, title: title, text: text, icon: icon, tags: importance === 3 ? ["milestone", "iconic"] : ["milestone"], metricValue: metricValue, dedupeKey: key, entityType: "company", entityId: "player" });
}
function productMilestones(w, sku) {
    var thresholds = [
        { units: 10000, importance: 1, label: "10,000", icon: "📦" },
        { units: 100000, importance: 2, label: "100,000", icon: "🔥" },
        { units: 1000000, importance: 3, label: "1 million", icon: "🏆" },
        { units: 10000000, importance: 3, label: "10 million", icon: "🌍" },
    ];
    for (var _i = 0, thresholds_1 = thresholds; _i < thresholds_1.length; _i++) {
        var t = thresholds_1[_i];
        if (sku.unitsSoldTotal >= t.units) {
            recordChronicle(w, {
                kind: "product", importance: t.importance,
                title: "".concat(sku.name, " passes ").concat(t.label, " units"),
                text: "".concat(sku.name, " reached ").concat(t.label, " lifetime units sold").concat(sku.assignedPmName ? " under the product lineage led by ".concat(sku.assignedPmName) : "", "."),
                icon: t.icon, entityType: "product", entityId: sku.id,
                tags: t.importance === 3 ? ["product", "sales", "iconic"] : ["product", "sales"],
                metricValue: sku.unitsSoldTotal, dedupeKey: "sku_".concat(sku.id, "_units_").concat(t.units),
            });
        }
    }
    var age = sku.launchTick > 0 ? w.tick - sku.launchTick : 0;
    if (sku.launchTick > 0 && age >= types_1.TICKS_PER_YEAR && sku.unitsSoldTotal < 5000) {
        recordChronicle(w, {
            kind: "product", importance: 2,
            title: "".concat(sku.name, " fails to find a market"),
            text: "".concat(sku.name, " completed its first year with fewer than 5,000 lifetime units sold and became a commercial disappointment."),
            icon: "📉", entityType: "product", entityId: sku.id, tags: ["product", "failure"],
            metricValue: sku.unitsSoldTotal, dedupeKey: "sku_".concat(sku.id, "_year1_failure"),
        });
    }
}
function companyMilestones(w) {
    var _a, _b, _c, _d;
    var c = ensureChronicle(w);
    var revenueMarks = [
        [1000000, 2, "$1M"],
        [10000000, 2, "$10M"],
        [100000000, 3, "$100M"],
        [1000000000, 3, "$1B"],
        [10000000000, 3, "$10B"],
    ];
    for (var _i = 0, revenueMarks_1 = revenueMarks; _i < revenueMarks_1.length; _i++) {
        var _e = revenueMarks_1[_i], amount = _e[0], importance = _e[1], label = _e[2];
        if (c.lifetimeRevenue >= amount)
            milestone(w, "lifetime_revenue_".concat(amount), importance, "".concat(label, " lifetime revenue"), "".concat(w.company, " passed ").concat(label, " in cumulative net revenue."), "💰", c.lifetimeRevenue);
    }
    var share = (_d = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.shareYear) !== null && _b !== void 0 ? _b : (_c = w.live) === null || _c === void 0 ? void 0 : _c.overallShare) !== null && _d !== void 0 ? _d : 0;
    var shareMarks = [
        [.05, 1, "5%"],
        [.10, 2, "10%"],
        [.25, 3, "25%"],
        [.50, 3, "50%"],
    ];
    for (var _f = 0, shareMarks_1 = shareMarks; _f < shareMarks_1.length; _f++) {
        var _g = shareMarks_1[_f], value = _g[0], importance = _g[1], label = _g[2];
        if (share >= value)
            milestone(w, "market_share_".concat(Math.round(value * 100)), importance, "".concat(label, " market share"), "".concat(w.company, " reached ").concat(label, " trailing-year share in ").concat(w.cfg.label, "."), "📈", share);
    }
    if (w.player.personnel.length >= 10)
        milestone(w, "employees_10", 1, "Team reaches 10", "".concat(w.company, " grew to 10 named managers and specialists."), "👥", w.player.personnel.length);
    if (w.player.personnel.length >= 25)
        milestone(w, "employees_25", 2, "Team reaches 25", "".concat(w.company, " grew to 25 named managers and specialists."), "🏢", w.player.personnel.length);
}
function annualHeadline(w, a, prior) {
    if (a.revenue <= 1 && a.units <= 1)
        return "A building year: ".concat(w.company, " was still preparing its commercial engine.");
    if (prior && prior.profit < 0 && a.profit > 0)
        return "Turnaround: ".concat(w.company, " returned to annual profitability.");
    if (a.profit < 0 && a.revenue > 0)
        return "Growth came at a cost: revenue reached ".concat(moneyCompact(a.revenue), ", but the year ended with a loss.");
    if (a.productsLaunched.length >= 3)
        return "Portfolio expansion defined the year, with ".concat(a.productsLaunched.length, " products launched.");
    if (a.peakShare >= .25)
        return "".concat(w.company, " became a major force in ").concat(w.cfg.label, ", peaking at ").concat((a.peakShare * 100).toFixed(1), "% share.");
    if (a.profit > 0)
        return "".concat(w.company, " generated ").concat(moneyCompact(a.revenue), " revenue and ").concat(moneyCompact(a.profit), " profit.");
    return "".concat(w.company, " generated ").concat(moneyCompact(a.revenue), " revenue while continuing to build the business.");
}
function closeYear(w) {
    var _a, _b, _c, _d, _e, _f;
    var c = ensureChronicle(w);
    var acc = c.yearAccumulator;
    var startTick = (acc.year - 1) * types_1.TICKS_PER_YEAR;
    var endTick = acc.year * types_1.TICKS_PER_YEAR;
    var entries = c.entries.filter(function (e) { return e.tick > startTick && e.tick <= endTick; });
    var productLaunches = entries.filter(function (e) { var _a; return ((_a = e.tags) === null || _a === void 0 ? void 0 : _a.includes("launch")) && e.entityType === "product"; });
    var peopleEvents = entries.filter(function (e) { return e.kind === "people"; });
    var review = {
        year: acc.year,
        revenue: acc.revenue,
        profit: acc.profit,
        units: acc.units,
        startCash: acc.startCash,
        endCash: w.player.cash,
        peakShare: acc.peakShare,
        yearEndShare: (_d = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.shareYear) !== null && _b !== void 0 ? _b : (_c = w.live) === null || _c === void 0 ? void 0 : _c.overallShare) !== null && _d !== void 0 ? _d : 0,
        productsLaunched: productLaunches.map(function (e) { return e.title.replace(/ launched$/, ""); }),
        hires: peopleEvents.filter(function (e) { var _a; return (_a = e.tags) === null || _a === void 0 ? void 0 : _a.includes("hire"); }).length,
        promotions: peopleEvents.filter(function (e) { var _a; return (_a = e.tags) === null || _a === void 0 ? void 0 : _a.includes("promotion"); }).length,
        departures: peopleEvents.filter(function (e) { var _a; return (_a = e.tags) === null || _a === void 0 ? void 0 : _a.includes("departure"); }).length,
        endingEmployees: w.player.personnel.length,
        headline: "",
        highlightEntryIds: entries.filter(function (e) { return e.importance >= 2; }).sort(function (a, b) { return b.importance - a.importance || a.tick - b.tick; }).slice(0, 6).map(function (e) { return e.id; }),
    };
    review.headline = annualHeadline(w, review, c.annualReviews.at(-1));
    c.annualReviews.push(review);
    recordChronicle(w, {
        kind: "annual", importance: 1,
        title: "Year ".concat(review.year, " in review"),
        text: review.headline,
        icon: "📘", entityType: "company", entityId: "player", tags: ["annual-review"],
        dedupeKey: "annual_review_".concat(review.year),
    });
    if (review.profit > 0 && c.annualReviews.filter(function (r) { return r.year < review.year; }).every(function (r) { return r.profit <= 0; })) {
        milestone(w, "first_profitable_year", 2, "First profitable year", "".concat(w.company, " closed its first profitable year with ").concat(moneyCompact(review.profit), " in profit."), "✅", review.profit);
    }
    if (review.profit > 0 && c.annualReviews.length > 1 && c.annualReviews[c.annualReviews.length - 2].profit < 0) {
        milestone(w, "turnaround_year_".concat(review.year), 3, "The turnaround", "".concat(w.company, " moved from an annual loss to ").concat(moneyCompact(review.profit), " profit in Year ").concat(review.year, "."), "🔄", review.profit);
    }
    if (acc.minCash < 0 && review.endCash > 0) {
        milestone(w, "cash_crisis_survived_".concat(review.year), 3, "Cash crisis survived", "".concat(w.company, " fell below zero cash during Year ").concat(review.year, " but recovered to finish with ").concat(moneyCompact(review.endCash), "."), "🛟", review.endCash);
    }
    c.yearAccumulator = {
        year: review.year + 1,
        revenue: 0,
        profit: 0,
        units: 0,
        startCash: w.player.cash,
        minCash: w.player.cash,
        maxCash: w.player.cash,
        peakShare: (_f = (_e = w.live) === null || _e === void 0 ? void 0 : _e.shareYear) !== null && _f !== void 0 ? _f : 0,
        startEmployees: w.player.personnel.length,
    };
    w.events.push({ tick: w.tick, kind: "chronicle", text: "\uD83D\uDCD8 Year ".concat(review.year, " review is ready \u2014 ").concat(review.headline) });
}
/** Called once per simulation tick after P&L and share have been calculated. */
function updateChronicleTick(w, actual) {
    var _a, _b, _c, _d;
    var c = ensureChronicle(w);
    var acc = c.yearAccumulator;
    // Revenue/profit in the live model are quarterly run-rates. Divide by quarter length to accumulate realized daily amounts.
    var revenueToday = actual.netRevenueQuarterRunRate / types_1.TICKS_PER_QUARTER;
    var profitToday = actual.profitQuarterRunRate / types_1.TICKS_PER_QUARTER;
    acc.revenue += revenueToday;
    acc.profit += profitToday;
    acc.units += actual.actualUnits;
    acc.minCash = Math.min(acc.minCash, w.player.cash);
    acc.maxCash = Math.max(acc.maxCash, w.player.cash);
    acc.peakShare = Math.max(acc.peakShare, (_d = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.shareYear) !== null && _b !== void 0 ? _b : (_c = w.live) === null || _c === void 0 ? void 0 : _c.overallShare) !== null && _d !== void 0 ? _d : 0);
    c.lifetimeRevenue += revenueToday;
    c.lifetimeProfit += profitToday;
    for (var _i = 0, _e = w.player.skus; _i < _e.length; _i++) {
        var sku = _e[_i];
        productMilestones(w, sku);
    }
    companyMilestones(w);
    if (w.tick > 0 && w.tick % types_1.TICKS_PER_YEAR === 0 && c.yearAccumulator.year <= Math.floor(w.tick / types_1.TICKS_PER_YEAR))
        closeYear(w);
}
function recordProductLaunch(w, sku) {
    var _a, _b;
    var firstLaunch = !((_b = (_a = w.chronicle) === null || _a === void 0 ? void 0 : _a.unlockedMilestones) === null || _b === void 0 ? void 0 : _b.some(function (k) { return k.startsWith("launch_"); }));
    recordChronicle(w, {
        kind: "product", importance: firstLaunch ? 3 : 2,
        title: "".concat(sku.name, " launched"),
        text: "".concat(sku.name, " became commercially available at $").concat(sku.listPrice.toFixed(2)).concat(sku.assignedPmName ? ", following development led by ".concat(sku.assignedPmName) : "", "."),
        icon: firstLaunch ? "🚀" : "📦", entityType: "product", entityId: sku.id,
        tags: firstLaunch ? ["product", "launch", "iconic"] : ["product", "launch"],
        dedupeKey: "launch_".concat(sku.id),
    });
}
function recordProductDesignComplete(w, sku) {
    recordChronicle(w, {
        kind: "product", importance: 1,
        title: "".concat(sku.name, " design completed"),
        text: "".concat(sku.name, " completed ").concat(sku.designDepth, " development and moved into launch preparation."),
        icon: "🎨", entityType: "product", entityId: sku.id, tags: ["product", "development"],
        dedupeKey: "design_".concat(sku.id),
    });
}
function recordPeopleEvent(w, personId, title, text, tag, importance) {
    if (importance === void 0) { importance = 1; }
    return recordChronicle(w, {
        kind: "people",
        importance: importance,
        title: title,
        text: text,
        icon: tag === "promotion" ? "⬆️" : tag === "departure" ? "👋" : "👤",
        entityType: "person", entityId: personId, tags: __spreadArray(["people", tag], (importance === 3 ? ["iconic"] : []), true),
    });
}
function recordBuildingEvent(w, room) {
    if (room.kind !== "factory" && room.kind !== "warehouse")
        return null;
    var firstOfKind = !w.player.operatingRooms.some(function (r) { return r.id !== room.id && r.kind === room.kind; });
    if (!firstOfKind)
        return null;
    return recordChronicle(w, {
        kind: "operations", importance: room.kind === "factory" ? 2 : 1,
        title: room.kind === "factory" ? "First factory opened" : "Warehouse network expanded",
        text: "".concat(room.name, " opened with ").concat(Math.round(room.capacity).toLocaleString(), " ").concat(room.kind === "factory" ? "units/month of production capacity" : "units of storage capacity", "."),
        icon: room.kind === "factory" ? "🏭" : "🏬", entityType: "building", entityId: room.id, tags: ["operations", "building"],
        dedupeKey: "first_building_".concat(room.kind),
    });
}
function productLegacyTags(w, sku) {
    var tags = [];
    var age = sku.launchTick > 0 ? w.tick - sku.launchTick : 0;
    if (sku.unitsSoldTotal >= 1000000)
        tags.push("Blockbuster");
    else if (sku.unitsSoldTotal >= 100000)
        tags.push("Bestseller");
    if (sku.rarity === "legendary" && sku.fame >= .65)
        tags.push("Breakthrough");
    if (sku.fame >= .55 && sku.unitsSoldTotal < 100000 && age >= 360)
        tags.push("Cult favorite");
    if (age >= 1800 && sku.status === "active")
        tags.push("Long runner");
    if (age >= 360 && sku.unitsSoldTotal < 5000)
        tags.push("Commercial disappointment");
    if (!tags.length && sku.launchTick > 0)
        tags.push("Portfolio product");
    return tags;
}
function chronicleRecords(w) {
    var _a, _b, _c;
    var reviews = (_b = (_a = w.chronicle) === null || _a === void 0 ? void 0 : _a.annualReviews) !== null && _b !== void 0 ? _b : [];
    var launched = w.player.skus.filter(function (s) { return s.launchTick > 0; });
    var people = __spreadArray(__spreadArray([], w.player.personnel, true), ((_c = w.player.formerPersonnel) !== null && _c !== void 0 ? _c : []), true);
    var bestBy = function (arr, score) { return arr.length ? __spreadArray([], arr, true).sort(function (a, b) { return score(b) - score(a); })[0] : null; };
    var topUnits = bestBy(launched, function (s) { return s.unitsSoldTotal; });
    var topContribution = bestBy(launched, function (s) { var _a; return (_a = s.contributionTotal) !== null && _a !== void 0 ? _a : 0; });
    var longestProduct = bestBy(launched, function (s) { return w.tick - s.launchTick; });
    var bestRevenueYear = bestBy(reviews, function (r) { return r.revenue; });
    var bestProfitYear = bestBy(reviews, function (r) { return r.profit; });
    var bestShareYear = bestBy(reviews, function (r) { return r.peakShare; });
    var worstProfitYear = reviews.length ? __spreadArray([], reviews, true).sort(function (a, b) { return a.profit - b.profit; })[0] : null;
    var longestPerson = bestBy(people, function (p) { return (("leftTick" in p ? Number(p.leftTick) : w.tick) - p.hiredTick); });
    var pmImpact = people.filter(function (p) { return p.role === "product_manager"; }).map(function (p) { return ({ p: p, units: w.player.skus.filter(function (s) { var _a; return ((_a = s.leadHistory) !== null && _a !== void 0 ? _a : []).some(function (h) { return h.personId === p.id; }); }).reduce(function (a, s) { return a + s.unitsSoldTotal; }, 0) }); });
    var topPm = bestBy(pmImpact, function (x) { return x.units; });
    return { topUnits: topUnits, topContribution: topContribution, longestProduct: longestProduct, bestRevenueYear: bestRevenueYear, bestProfitYear: bestProfitYear, bestShareYear: bestShareYear, worstProfitYear: worstProfitYear, longestPerson: longestPerson, topPm: topPm };
}
