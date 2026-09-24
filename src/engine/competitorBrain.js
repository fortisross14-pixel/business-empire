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
exports.competitorAwareness = competitorAwareness;
exports.runCompetitorBrains = runCompetitorBrains;
var types_1 = require("./types");
var industries_1 = require("./industries");
var cube_1 = require("./cube");
var REF_PRICE = 45;
var coordKey = function (c) { return "".concat(c.coord.gender, "|").concat(c.coord.age, "|").concat(c.coord.class, "|").concat(c.coord.leaning); };
function playerTargets(w) {
    return w.player.skus.map(function (s) {
        var pt = w.cfg.products.find(function (p) { return p.key === s.productKey; });
        return (0, cube_1.effectiveTarget)(s.target, pt);
    });
}
function appealOf(target, attributes, quality, price, priceSens, awareness, cell, cfg) {
    var f = (0, cube_1.fit)(target, cell, cfg);
    var nm = (0, cube_1.needMatch)(attributes, cell, cfg);
    var priceTerm = 1 - (0, industries_1.clamp)(price / REF_PRICE - 1, -0.6, 0.9) * priceSens * 0.5;
    var qTerm = 0.5 + 0.5 * quality;
    return Math.max(0, f * nm * qTerm * priceTerm) * awareness;
}
function assessCells(w, comp) {
    var _a;
    var pts = playerTargets(w);
    var out = [];
    var _loop_1 = function (cell) {
        var market = cell.head * cell.spend;
        if (market <= 0)
            return "continue";
        var playerEff = w.player.skus.map(function (s, i) { var _a; return appealOf(pts[i], s.attributes, s.quality, s.listPrice, s.priceSens, ((_a = cell.awareness[s.id]) !== null && _a !== void 0 ? _a : 0) * 0.7, cell, w.cfg); });
        var allCompEff = [];
        var myEff = 0, myBestFit = 0;
        for (var _c = 0, _d = w.comps; _c < _d.length; _c++) {
            var c = _d[_c];
            for (var _e = 0, _f = c.products; _e < _f.length; _e++) {
                var cp = _f[_e];
                var e = appealOf(cp.target, cp.attributes, cp.quality, cp.price, cp.priceSens, (_a = cell.awareness[cp.awarenessKey]) !== null && _a !== void 0 ? _a : 0, cell, w.cfg);
                allCompEff.push(e);
                if (c.id === comp.id) {
                    myEff += e;
                    myBestFit = Math.max(myBestFit, (0, cube_1.fit)(cp.target, cell, w.cfg));
                }
            }
        }
        var denom = (0, industries_1.sum)(playerEff) + (0, industries_1.sum)(allCompEff) || 1;
        out.push({ cell: cell, market: market, playerShare: (0, industries_1.sum)(playerEff) / denom, myShare: myEff / denom, myBestFit: myBestFit });
    };
    for (var _i = 0, _b = w.cube; _i < _b.length; _i++) {
        var cell = _b[_i];
        _loop_1(cell);
    }
    return out;
}
function cellCoordTarget(cell) {
    var t = {};
    for (var _i = 0, AXIS_KEYS_1 = industries_1.AXIS_KEYS; _i < AXIS_KEYS_1.length; _i++) {
        var axis = AXIS_KEYS_1[_i];
        t[axis] = (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(cell.coord[axis]));
    }
    return t;
}
function decide(w, comp) {
    var _a, _b;
    var assess = assessCells(w, comp);
    var coordK = function (a) { return coordKey(a.cell); };
    // update threat memory: count consecutive quarters the player has dominated each cell
    for (var _i = 0, assess_1 = assess; _i < assess_1.length; _i++) {
        var a = assess_1[_i];
        var k = coordK(a);
        if (a.playerShare > 0.30 && a.market > 800000)
            comp.threatMemory[k] = (comp.threatMemory[k] || 0) + 1;
        else
            comp.threatMemory[k] = 0;
    }
    if (comp.actionCooldown > 0) {
        comp.actionCooldown -= 1;
        comp.lastAction = "hold";
        return;
    }
    var byPlayerThreat = __spreadArray([], assess, true).sort(function (a, b) { return (b.playerShare * b.market) - (a.playerShare * a.market); });
    var topPlayerCell = byPlayerThreat[0];
    var aggressiveness = comp.personality === "discounter" ? 1 : comp.personality === "premium" ? 0.6 : 0.8;
    // 1) INVASION — only after the player has HELD the cell for ~4 quarters (a year)
    if (topPlayerCell && comp.threatMemory[coordK(topPlayerCell)] >= 4
        && topPlayerCell.playerShare > 0.35 && topPlayerCell.myBestFit < 0.4
        && topPlayerCell.market > 1000000 && comp.products.length < 3 && comp.cash > 400000) {
        var cell = topPlayerCell.cell;
        var downmarket = cell.coord.class === "Budget";
        if (!(comp.personality === "premium" && downmarket)) {
            var target = cellCoordTarget(cell);
            // build attributes that mirror the cell's top need preferences — a real threat
            var attrs_1 = {};
            var prefs = Object.entries(cell.needPref).sort(function (a, b) { return b[1] - a[1]; });
            w.cfg.needs.forEach(function (n) { attrs_1[n.key] = 0.2; });
            prefs.slice(0, 2).forEach(function (_a) {
                var k = _a[0];
                attrs_1[k] = 0.85;
            });
            var np = {
                target: target,
                quality: (0, industries_1.clamp)(comp.quality + (Math.random() * 0.1 - 0.05)),
                price: comp.basePrice * (comp.personality === "discounter" ? 0.9 : 1.0),
                basePrice: comp.basePrice,
                priceSens: comp.priceSens,
                awarenessKey: "".concat(comp.id, "_p").concat(comp.products.length),
                attributes: attrs_1,
                productKey: (_b = (_a = comp.products[0]) === null || _a === void 0 ? void 0 : _a.productKey) !== null && _b !== void 0 ? _b : w.cfg.products[0].key,
            };
            for (var _c = 0, _d = w.cube; _c < _d.length; _c++) {
                var c = _d[_c];
                c.awareness[np.awarenessKey] = 0.05;
            }
            comp.products.push(np);
            comp.cash -= 400000;
            comp.lastAction = "invade";
            comp.actionCooldown = 24 * 2; // ~2 years before another big move
            w.events.push({ tick: w.tick, kind: "rival",
                text: "\uD83C\uDFAF ".concat(comp.name, " launched a product targeting your stronghold (").concat(cell.coord.age, " \u00B7 ").concat(cell.coord.class, ").") });
            return;
        }
    }
    // 2) DEFENSE — escalate marketing where contested; cooldown prevents spam
    var myLeads = assess.filter(function (a) { return a.myShare > 0.25 && a.playerShare > 0.15 && a.market > 800000; }).sort(function (a, b) { return b.market - a.market; });
    if (myLeads.length && comp.cash > 150000 && Math.random() < aggressiveness) {
        var cell = myLeads[0].cell;
        comp.marketingFocus = cell.coord.age;
        comp.marketing = (0, industries_1.clamp)(comp.marketing * 1.15, 50000, 400000);
        comp.cash -= 80000;
        comp.lastAction = "defend";
        comp.actionCooldown = 24; // once a year at most
        w.events.push({ tick: w.tick, kind: "rival",
            text: "\uD83D\uDEE1 ".concat(comp.name, " is defending ").concat(cell.coord.age, " buyers \u2014 ramping marketing.") });
        return;
    }
    // 3) EXIT — abandon a small cell lost badly
    var losing = assess.filter(function (a) { return a.myShare < 0.05 && a.playerShare > 0.4 && a.market < 700000; });
    if (losing.length && comp.products.length > 1) {
        var cell = losing.sort(function (a, b) { return a.market - b.market; })[0].cell;
        var key = coordKey(cell);
        if (!comp.exitedCells.includes(key)) {
            comp.exitedCells.push(key);
            comp.lastAction = "exit";
            comp.actionCooldown = 24;
            w.events.push({ tick: w.tick, kind: "rival",
                text: "\uD83C\uDFF3 ".concat(comp.name, " is pulling back from ").concat(cell.coord.age, " \u00B7 ").concat(cell.coord.class, " \u2014 a gap may open.") });
            return;
        }
    }
    comp.lastAction = "hold";
}
function updateCompetitorPrices(w, comp) {
    var _a, _b;
    var playerAvg = w.player.skus.length ? (0, industries_1.sum)(w.player.skus.map(function (s) { return s.listPrice; })) / w.player.skus.length : REF_PRICE;
    for (var _i = 0, _c = comp.products; _i < _c.length; _i++) {
        var cp = _c[_i];
        if (comp.personality === "discounter") {
            var target = Math.max(cp.basePrice * 0.7, Math.min(cp.basePrice, playerAvg * 0.92));
            cp.price = (0, industries_1.ease)(cp.price, target, 0.5);
        }
        else if (comp.personality === "premium") {
            var target = (0, industries_1.clamp)(Math.max(cp.basePrice, playerAvg * 1.1), cp.basePrice * 0.85, cp.basePrice * 1.4);
            cp.price = (0, industries_1.ease)(cp.price, target, 0.3);
        }
        else {
            cp.price = (0, industries_1.ease)(cp.price, cp.basePrice, 0.25);
        }
    }
    comp.price = (_b = (_a = comp.products[0]) === null || _a === void 0 ? void 0 : _a.price) !== null && _b !== void 0 ? _b : comp.price;
}
function competitorAwareness(w, comp, cell) {
    var _a, _b;
    var focusMatch = (comp.marketingFocus === "all" || cell.coord.age === comp.marketingFocus) ? 1 : 0.5;
    var power = (0, industries_1.clamp)((comp.marketing - 40000) / 400000, 0, 1.2);
    for (var _i = 0, _c = comp.products; _i < _c.length; _i++) {
        var cp = _c[_i];
        if (comp.exitedCells.includes(coordKey(cell))) {
            cell.awareness[cp.awarenessKey] = (0, industries_1.ease)((_a = cell.awareness[cp.awarenessKey]) !== null && _a !== void 0 ? _a : 0, 0, 0.02 * types_1.TICK_RATE_SCALE);
            continue;
        }
        var f = (0, cube_1.fit)(cp.target, cell, w.cfg);
        var push = (0, industries_1.clamp)(f * (0.5 + 0.5 * comp.strength));
        var speed = (0, industries_1.clamp)(0.008 * types_1.TICK_RATE_SCALE * (0.5 + power * focusMatch));
        var cur = (_b = cell.awareness[cp.awarenessKey]) !== null && _b !== void 0 ? _b : 0;
        cell.awareness[cp.awarenessKey] = (0, industries_1.clamp)(cur + (push - cur) * speed);
    }
}
function runCompetitorBrains(w) {
    if (w.tick % types_1.TICKS_PER_QUARTER === 0) {
        for (var _i = 0, _a = w.comps; _i < _a.length; _i++) {
            var comp = _a[_i];
            comp.cash += 250000;
            updateCompetitorPrices(w, comp);
            decide(w, comp);
        }
    }
}
