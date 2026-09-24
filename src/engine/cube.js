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
exports.buildCube = buildCube;
exports.needMatch = needMatch;
exports.packagingResonance = packagingResonance;
exports.effectiveAttributes = effectiveAttributes;
exports.channelFit = channelFit;
exports.effectiveTarget = effectiveTarget;
exports.fit = fit;
exports.applyDriftAndShocks = applyDriftAndShocks;
var industries_1 = require("./industries");
// deterministic small jitter per cell+need so "surprises within the trend" are stable across ticks
function jitter(seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++)
        h = (h * 31 + seed.charCodeAt(i)) | 0;
    // map to -0.18..0.18
    return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.36;
}
function seedNeedPref(cfg, coord) {
    var raw = {};
    for (var _i = 0, _a = cfg.needs; _i < _a.length; _i++) {
        var need = _a[_i];
        var v = 0.5;
        for (var _b = 0, AXIS_KEYS_1 = industries_1.AXIS_KEYS; _b < AXIS_KEYS_1.length; _b++) {
            var axis = AXIS_KEYS_1[_b];
            var lean = need.lean[axis];
            if (lean == null)
                continue;
            var pos = (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(coord[axis]));
            v += lean * (pos - 0.5);
        }
        v += jitter("".concat(coord.gender).concat(coord.age).concat(coord.class).concat(coord.leaning).concat(coord.geography).concat(coord.family).concat(need.key));
        raw[need.key] = (0, industries_1.clamp)(v, 0.02, 1);
    }
    var total = Object.values(raw).reduce(function (a, b) { return a + b; }, 0) || 1;
    var out = {};
    for (var k in raw)
        out[k] = raw[k] / total;
    return out;
}
// category affinity per segment, from each product type's categoryLean (+ noise)
function seedCategoryPref(cfg, coord) {
    var out = {};
    for (var _i = 0, _a = cfg.products; _i < _a.length; _i++) {
        var pt = _a[_i];
        var v = 0.55;
        if (pt.categoryLean) {
            for (var _b = 0, AXIS_KEYS_2 = industries_1.AXIS_KEYS; _b < AXIS_KEYS_2.length; _b++) {
                var axis = AXIS_KEYS_2[_b];
                var lean = pt.categoryLean[axis];
                if (lean == null)
                    continue;
                var pos = (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(coord[axis]));
                v += lean * (pos - 0.5);
            }
        }
        v += jitter("".concat(coord.gender).concat(coord.age).concat(coord.class).concat(coord.geography).concat(coord.family).concat(pt.key, "cat"));
        out[pt.key] = (0, industries_1.clamp)(v, 0, 1);
    }
    return out;
}
var TOTAL_POP = 1600000;
function buildCube(cfg) {
    var ageShare = { "13-24": 0.20, "25-39": 0.28, "40-59": 0.30, "60+": 0.22 };
    var classShare = { Budget: 0.45, Middle: 0.40, Affluent: 0.15 };
    var leanShare = { Progressive: 0.34, Neutral: 0.34, Conservative: 0.32 };
    var geoShare = { Urban: 0.34, Suburban: 0.42, Rural: 0.24 };
    var famShare = { Single: 0.33, Couple: 0.30, Family: 0.37 };
    var cells = [];
    for (var _i = 0, _a = industries_1.AXES.gender; _i < _a.length; _i++) {
        var g = _a[_i];
        for (var _b = 0, _c = industries_1.AXES.age; _b < _c.length; _b++) {
            var a = _c[_b];
            for (var _d = 0, _e = industries_1.AXES.class; _d < _e.length; _d++) {
                var c = _e[_d];
                for (var _f = 0, _g = industries_1.AXES.leaning; _f < _g.length; _f++) {
                    var l = _g[_f];
                    for (var _h = 0, _j = industries_1.AXES.geography; _h < _j.length; _h++) {
                        var geo = _j[_h];
                        for (var _k = 0, _l = industries_1.AXES.family; _k < _l.length; _k++) {
                            var fam = _l[_k];
                            var head = TOTAL_POP * 0.5 * ageShare[a] * classShare[c] * leanShare[l] * geoShare[geo] * famShare[fam];
                            // spend modifiers: affluent suburban families spend more on toys; urban affluent on skincare, etc.
                            var geoSpend = geo === "Urban" ? 1.1 : geo === "Suburban" ? 1.0 : 0.85;
                            var spend = cfg.spend.class[c] * cfg.spend.gender[g] * cfg.spend.age[a] * geoSpend;
                            var coord = { gender: g, age: a, class: c, leaning: l, geography: geo, family: fam };
                            // frozen sensitivities, correlated with class (+ noise)
                            var classPos = (0, industries_1.axisPos)("class", industries_1.AXES.class.indexOf(c)); // 0 budget .. 1 affluent
                            var qualitySens = (0, industries_1.clamp)(0.35 + classPos * 0.5 + jitter("".concat(g).concat(a).concat(c).concat(l).concat(geo).concat(fam, "qs")), 0, 1);
                            var priceSens = (0, industries_1.clamp)(1.4 - classPos * 1.0 + jitter("".concat(g).concat(a).concat(c).concat(l).concat(geo).concat(fam, "ps")) * 1.5, 0.2, 2.0);
                            // channel preference: where this segment likes to shop (0..1 per channel type).
                            // young + urban skew online/marketplace; older + rural skew retail; affluent enjoy flagship.
                            var agePos = (0, industries_1.axisPos)("age", industries_1.AXES.age.indexOf(a)); // 0 young .. 1 old
                            var urban = geo === "Urban" ? 1 : geo === "Suburban" ? 0.5 : 0;
                            var channelPref = {
                                marketplace: (0, industries_1.clamp)(0.8 - agePos * 0.6 + urban * 0.15 + jitter("".concat(g).concat(a).concat(c).concat(geo, "mk")), 0.05, 1),
                                ownweb: (0, industries_1.clamp)(0.6 - agePos * 0.4 + urban * 0.1 + jitter("".concat(g).concat(a).concat(c).concat(geo, "ow")), 0.05, 1),
                                retail: (0, industries_1.clamp)(0.45 + agePos * 0.45 - urban * 0.15 + jitter("".concat(g).concat(a).concat(c).concat(geo, "rt")), 0.05, 1),
                                flagship: (0, industries_1.clamp)(0.25 + classPos * 0.5 + urban * 0.2 + jitter("".concat(g).concat(a).concat(c).concat(geo, "fl")), 0.05, 1),
                            };
                            cells.push({
                                coord: coord,
                                head: head,
                                baseHead: head,
                                spend: spend,
                                awareness: {},
                                needPref: seedNeedPref(cfg, coord),
                                qualitySens: qualitySens,
                                priceSens: priceSens,
                                categoryPref: seedCategoryPref(cfg, coord),
                                channelPref: channelPref,
                                // who cares about what: affluent → prestige/trust; budget → value; young → innovation
                                equityPref: {
                                    trust: (0, industries_1.clamp)(0.5 + classPos * 0.25 + jitter("".concat(g).concat(a).concat(c).concat(geo, "et")), 0.1, 1),
                                    prestige: (0, industries_1.clamp)(0.2 + classPos * 0.7 + jitter("".concat(g).concat(a).concat(c).concat(geo, "ep")), 0.05, 1),
                                    value: (0, industries_1.clamp)(0.85 - classPos * 0.6 + jitter("".concat(g).concat(a).concat(c).concat(geo, "ev")), 0.05, 1),
                                    innovation: (0, industries_1.clamp)(0.6 - agePos * 0.4 + jitter("".concat(g).concat(a).concat(c).concat(geo, "ei")), 0.05, 1),
                                },
                            });
                        }
                    }
                }
            }
        }
    }
    return cells;
}
// How well a product's attribute vector matches a cell's need preferences.
// Weighted dot product: sum over needs of (cell preference for need * product's attribute on need),
// normalized by the product's total attribute mass so a product can't win just by maxing every slider.
function needMatch(attributes, cell, cfg) {
    var _a, _b;
    var dot = 0, attrMass = 0;
    for (var _i = 0, _c = cfg.needs; _i < _c.length; _i++) {
        var need = _c[_i];
        var a = (_a = attributes[need.key]) !== null && _a !== void 0 ? _a : 0;
        var p = (_b = cell.needPref[need.key]) !== null && _b !== void 0 ? _b : 0;
        dot += a * p;
        attrMass += a;
    }
    if (attrMass <= 0)
        return 0.15; // a product with no clear attributes weakly matches everyone
    // dot is roughly in 0..max(pref); scale so a well-aligned product approaches ~1
    var normalized = dot / (attrMass / cfg.needs.length + 1e-6);
    return (0, industries_1.clamp)(normalized * 0.6 + 0.2, 0, 1.2);
}
// Packaging resonance: how well a packaging preset's demographic lean matches the cell.
// ageLean/classLean in -1..1; we compare against the cell's age/class position.
function packagingResonance(pkgKey, cell) {
    var pkg = industries_1.PACKAGING.find(function (p) { return p.key === pkgKey; });
    if (!pkg)
        return 1;
    var agePos = (0, industries_1.axisPos)("age", industries_1.AXES.age.indexOf(cell.coord.age)); // 0 young..1 old
    var classPos = (0, industries_1.axisPos)("class", industries_1.AXES.class.indexOf(cell.coord.class)); // 0 budget..1 affluent
    // lean of +1 means "skews old/premium": resonance high when cell is old/affluent.
    var ageMatch = 1 - Math.abs((pkg.ageLean + 1) / 2 - agePos); // 0..1
    var classMatch = 1 - Math.abs((pkg.classLean + 1) / 2 - classPos);
    // blend; packaging matters but isn't everything → keep in a gentle band 0.7..1.15
    return (0, industries_1.clamp)(0.7 + (ageMatch * 0.5 + classMatch * 0.5 - 0.5) * 0.9, 0.55, 1.15);
}
// Packaging-amplified attributes: needBias multiplies the perceived need attributes.
function effectiveAttributes(industryId, pkgKey, attributes, _legacyLicenseKey) {
    var _a;
    var bias = (0, industries_1.packagingNeedBias)(industryId, pkgKey);
    var out = __assign({}, attributes);
    for (var k in bias)
        out[k] = (0, industries_1.clamp)(((_a = out[k]) !== null && _a !== void 0 ? _a : 0) * bias[k], 0, 1);
    // IP demand is universal and cell-aware; it is applied separately by engine/ip.ts.
    return out;
}
// Channel fit: does the product reach this segment where it likes to shop?
// channels = the channel types carrying this product. If none, the product is unsold (0).
function channelFit(channels, cell) {
    var _a;
    if (!channels || channels.length === 0)
        return 0; // not distributed anywhere → no sales
    // best preference among the channels we actually use (you reach them where they shop best)
    var best = 0;
    for (var _i = 0, channels_1 = channels; _i < channels_1.length; _i++) {
        var ch = channels_1[_i];
        best = Math.max(best, (_a = cell.channelPref[ch]) !== null && _a !== void 0 ? _a : 0);
    }
    // small bonus for multi-channel presence, capped
    var breadth = (0, industries_1.clamp)(1 + (channels.length - 1) * 0.06, 1, 1.2);
    return (0, industries_1.clamp)(best * breadth, 0, 1);
}
// Effective target blends the player's chosen target with the product TYPE's natural lean.
// e.g. anti-aging cream pulls toward older cells even if you aim it slightly younger.
function effectiveTarget(target, productType) {
    if (!(productType === null || productType === void 0 ? void 0 : productType.naturalLean))
        return target;
    var out = __assign({}, target);
    for (var _i = 0, AXIS_KEYS_3 = industries_1.AXIS_KEYS; _i < AXIS_KEYS_3.length; _i++) {
        var axis = AXIS_KEYS_3[_i];
        var lean = productType.naturalLean[axis];
        if (lean != null)
            out[axis] = 0.6 * target[axis] + 0.4 * lean;
    }
    return out;
}
function fit(targetObj, cell, cfg) {
    var _a;
    var d2 = 0;
    for (var _i = 0, AXIS_KEYS_4 = industries_1.AXIS_KEYS; _i < AXIS_KEYS_4.length; _i++) {
        var axis = AXIS_KEYS_4[_i];
        var w = cfg.axisWeight[axis];
        if (!w)
            continue;
        var cellPos = (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(cell.coord[axis]));
        var dist = ((_a = targetObj[axis]) !== null && _a !== void 0 ? _a : 0.5) - cellPos;
        d2 += w * dist * dist;
    }
    return Math.exp(-d2 * 6);
}
function applyDriftAndShocks(w) {
    // gentle pull toward base each year
    if (w.tick % 12 === 0) {
        for (var _i = 0, _a = w.cube; _i < _a.length; _i++) {
            var cell = _a[_i];
            cell.head = (0, industries_1.ease)(cell.head, cell.baseHead, 0.02);
        }
    }
    // schedule a shock
    if (w.tick === w.pendingShockTick) {
        if (Math.random() < 0.5) {
            w.events.push({ tick: w.tick, kind: "natality", text: "📉 Natality crash — the 13-24 cohort begins shrinking for years." });
            w.shock = { type: "natality", ticksLeft: 120 };
        }
        else {
            var dir = Math.random() < 0.5 ? "Conservative" : "Progressive";
            w.events.push({ tick: w.tick, kind: "culture", text: "\uD83C\uDF00 Cultural swing \u2014 population drifting toward ".concat(dir, ".") });
            w.shock = { type: "culture", dir: dir, ticksLeft: 120 };
        }
        w.pendingShockTick = w.tick + 160 + Math.floor(Math.random() * 120);
    }
    // apply active shock
    if (w.shock) {
        if (w.shock.type === "natality") {
            for (var _b = 0, _c = w.cube; _b < _c.length; _b++) {
                var c = _c[_b];
                if (c.coord.age === "13-24")
                    c.head *= 0.9986;
            }
        }
        else if (w.shock.type === "culture") {
            var from = w.shock.dir === "Conservative" ? "Progressive" : "Conservative";
            var _loop_1 = function (c) {
                if (c.coord.leaning === from) {
                    var m = c.head * 0.0015;
                    c.head -= m;
                    var tgt = w.cube.find(function (x) {
                        return x.coord.gender === c.coord.gender && x.coord.age === c.coord.age &&
                            x.coord.class === c.coord.class && x.coord.leaning === "Neutral";
                    });
                    if (tgt)
                        tgt.head += m;
                }
            };
            for (var _d = 0, _e = w.cube; _d < _e.length; _d++) {
                var c = _e[_d];
                _loop_1(c);
            }
        }
        w.shock.ticksLeft -= 1;
        if (w.shock.ticksLeft <= 0)
            w.shock = null;
    }
}
