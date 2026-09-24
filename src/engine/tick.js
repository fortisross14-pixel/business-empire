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
exports.step = step;
exports.computeStudyFact = computeStudyFact;
var types_1 = require("./types");
var industries_1 = require("./industries");
var cube_1 = require("./cube");
var distribution_1 = require("./distribution");
var capacity_1 = require("./capacity");
var competitorBrain_1 = require("./competitorBrain");
var segments_1 = require("./segments");
var brandEquity_1 = require("./brandEquity");
var brands_1 = require("./brands");
var growth_1 = require("./growth");
var businesses_1 = require("./businesses");
var customers_1 = require("./customers");
var people_1 = require("./people");
var infrastructure_1 = require("./infrastructure");
var chronicle_1 = require("./chronicle");
var productCatalog_1 = require("./productCatalog");
var secondaryMarket_1 = require("./secondaryMarket");
var productDynamics_1 = require("./productDynamics");
var markets_1 = require("./markets");
var ip_1 = require("./ip");
var productMarketFit_1 = require("./productMarketFit");
var research_1 = require("./research");
var difficulty_1 = require("./difficulty");
var REF_PRICE = 45;
var adjacencyCache = null;
var cellKey = function (c) {
    return "".concat(c.coord.gender, "|").concat(c.coord.age, "|").concat(c.coord.class, "|").concat(c.coord.leaning, "|").concat(c.coord.geography, "|").concat(c.coord.family);
};
function skuEffectiveTarget(w, sku) {
    var pt = w.cfg.products.find(function (p) { return p.key === sku.productKey; });
    return (0, cube_1.effectiveTarget)(sku.target, pt);
}
var types_2 = require("./types");
// vision bonus: ramps from 1/5 to 5/5 over 4 quarters. Product scope = 20%, industry = 10%.
function visionBonus(w, bonusType) {
    var v = w.player.vision;
    if (!v || types_2.VISION_GOALS[v.goal].bonusType !== bonusType)
        return 0;
    var ramp = (1 + v.quartersPassed) / 5; // 0.2 → 1.0
    // is scope an industry id or a product key? If it matches an industry, lower bonus.
    var isIndustry = Object.keys(industries_1.INDUSTRIES).includes(v.scope);
    var max = isIndustry ? types_2.VISION_GOALS[v.goal].bonusMaxIndustry : types_2.VISION_GOALS[v.goal].bonusMaxProduct;
    return max * ramp;
}
function step(w) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
    var cfg = w.cfg;
    var primarySkus = w.player.skus.filter(function (s) { return s.industryId === w.industryId; });
    w.tick += 1;
    (0, ip_1.expireIPContracts)(w);
    (0, people_1.updateTalentSearch)(w);
    (0, people_1.updatePersonnelTraining)(w);
    (0, cube_1.applyDriftAndShocks)(w);
    (0, competitorBrain_1.runCompetitorBrains)(w);
    // ease player spend toward targets
    w.player.marketing = (0, industries_1.ease)(w.player.marketing, w.player.marketingTarget, 0.08);
    // marketing requires marketing personnel — no team, no spend
    var marketingRooms = w.player.operatingRooms.filter(function (r) { return r.kind === "office" && r.team === "marketing"; });
    var seatedMarketing = new Set(marketingRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    var hasMarketingTeam = w.player.personnel.some(function (p) { return p.role === "marketing" && seatedMarketing.has(p.id); });
    if (!hasMarketingTeam) {
        w.player.marketing = 0;
        w.player.brandMarketing = 0;
    }
    w.player.brandMarketing = (0, industries_1.ease)(w.player.brandMarketing, w.player.brandMarketingTarget, 0.08);
    var contracts = w.player.contracts;
    var skuDistribution = primarySkus.map(function (sku) { return (0, distribution_1.distributionMetricsForSku)(w, sku); });
    var activeDistribution = primarySkus
        .map(function (sku, i) { return ({ sku: sku, dist: skuDistribution[i] }); })
        .filter(function (_a) {
        var sku = _a.sku;
        return sku.status === "active" && sku.releasedToMarket === true;
    });
    var totalReach = activeDistribution.length
        ? (0, industries_1.sum)(activeDistribution.map(function (_a) {
            var dist = _a.dist;
            return dist.reach;
        })) / activeDistribution.length
        : 0;
    var onlineCoverage = activeDistribution.length
        ? (0, industries_1.sum)(activeDistribution.map(function (_a) {
            var dist = _a.dist;
            return dist.onlineCoverage;
        })) / activeDistribution.length
        : 0;
    var marketingTeam = (0, people_1.teamEffectiveness)(w, "marketing");
    var marketingPower = (0, industries_1.clamp)((w.player.marketing - 20000) / 300000, 0, 1.2) * (hasMarketingTeam ? (0.78 + marketingTeam * 0.44) : 0) * (0, infrastructure_1.facilityEffectMultiplier)(w, "marketing");
    var brandPower = (0, industries_1.clamp)((w.player.brandMarketing) / 300000, 0, 1.2) * (0, infrastructure_1.facilityEffectMultiplier)(w, "brand");
    var brandSignals = Object.fromEntries(w.brands.map(function (b) { return [b.id, (0, brandEquity_1.earnedSignals)(w, b.id)]; }));
    var playerTargets = primarySkus.map(function (s) { return skuEffectiveTarget(w, s); });
    // resolve marketing focus: "all", an age band, or "seg:<id>" (a saved segment)
    var focusSeg = w.player.marketingFocus.startsWith("seg:")
        ? w.savedSegments.find(function (s) { return s.id === w.player.marketingFocus.slice(4); })
        : null;
    var focusCellKeys = focusSeg ? new Set((0, segments_1.cellsInSegment)(w, focusSeg.filter).map(function (c) { return cellKey(c); })) : null;
    // concentration boost: a narrower focus (fewer cells targeted) lifts the awareness ceiling more.
    // ranges ~1 (broad, half the cube) to ~2.2 (very narrow, a handful of cells).
    var concentrationBoost = focusCellKeys
        ? (0, industries_1.clamp)(1 + (1 - focusCellKeys.size / w.cube.length) * 1.5, 1, 2.4)
        : 1;
    // refresh static-fit cache if products/segments changed (cheap: only on edits, not per tick)
    if (w.fitCacheDirty) {
        w.fitCache = {};
        for (var _i = 0, primarySkus_1 = primarySkus; _i < primarySkus_1.length; _i++) {
            var p = primarySkus_1[_i];
            var arr = new Array(w.cube.length);
            var tgt = skuEffectiveTarget(w, p);
            var effAttrs = (0, cube_1.effectiveAttributes)(cfg.id, p.packaging, p.attributes);
            for (var ci = 0; ci < w.cube.length; ci++) {
                var cell = w.cube[ci];
                var cat = (_a = cell.categoryPref[p.productKey]) !== null && _a !== void 0 ? _a : 0.5;
                var pkg = (0, cube_1.packagingResonance)(p.packaging, cell);
                var chFit = (0, distribution_1.partnerFitForCell)(w, p, cell);
                var brandFit = (0, brands_1.brandPositioningFit)(w, p.brandId, cell, p.positioning);
                arr[ci] = (0, cube_1.fit)(tgt, cell, cfg) * (0, cube_1.needMatch)(effAttrs, cell, cfg) * cat * pkg * chFit * brandFit;
            }
            w.fitCache[p.id] = arr;
        }
        w.fitCacheDirty = false;
    }
    // per-cell finance accumulators
    var cellFinance = [];
    // per-sku quarterly accumulators (annual run-rate in $ and units demanded)
    var skuRevAnnual = primarySkus.map(function () { return 0; });
    var skuUnitsAnnual = primarySkus.map(function () { return 0; });
    // for marketing allocation by cell: track awareness-weighted exposure
    var skuCellRev = primarySkus.map(function () { return []; });
    // ---- corporate / industry-entry foundation ----
    (0, businesses_1.refreshCorporateCapabilities)(w);
    (0, research_1.updateResearch)(w);
    if ((_b = w.player.industryEntryProjects) === null || _b === void 0 ? void 0 : _b.length) {
        var speed = (0, businesses_1.industryEntrySpeed)(w);
        for (var _9 = 0, _10 = w.player.industryEntryProjects; _9 < _10.length; _9++) {
            var project = _10[_9];
            project.daysLeft = Math.max(0, project.daysLeft - speed);
        }
        var completedEntries = w.player.industryEntryProjects.filter(function (p) { return p.daysLeft <= 0; });
        for (var _11 = 0, completedEntries_1 = completedEntries; _11 < completedEntries_1.length; _11++) {
            var project = completedEntries_1[_11];
            (0, businesses_1.completeIndustryEntry)(w, project.industryId);
            var label = (_d = (_c = industries_1.INDUSTRIES[project.industryId]) === null || _c === void 0 ? void 0 : _c.label) !== null && _d !== void 0 ? _d : project.industryId;
            w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83C\uDF10 ".concat(label, " business entry complete \u2014 the company now has the foundation to operate in this industry.") });
            (0, chronicle_1.recordChronicle)(w, {
                kind: "milestone", importance: 3, title: "Entered ".concat(label),
                text: "".concat(w.company, " completed its organic entry program and established ").concat(label, " as a second business."),
                icon: "🌐", entityType: "market", entityId: project.industryId, tags: ["growth", "industry", "iconic"],
                dedupeKey: "industry_entry_".concat(project.industryId),
            });
        }
        if (completedEntries.length)
            w.player.industryEntryProjects = w.player.industryEntryProjects.filter(function (p) { return p.daysLeft > 0; });
    }
    (0, businesses_1.syncPrimaryBusinessLegacy)(w);
    // ---- category expansion projects (all active businesses) ----
    var expansionSpeed = (0, growth_1.categoryExpansionSpeed)(w);
    for (var _12 = 0, _13 = Object.values((_e = w.player.businesses) !== null && _e !== void 0 ? _e : {}); _12 < _13.length; _12++) {
        var business = _13[_12];
        if (!business || business.status !== "active" || !business.categoryExpansionProjects.length)
            continue;
        for (var _14 = 0, _15 = business.categoryExpansionProjects; _14 < _15.length; _14++) {
            var project = _15[_14];
            project.daysLeft = Math.max(0, project.daysLeft - expansionSpeed);
        }
        var completed = business.categoryExpansionProjects.filter(function (p) { return p.daysLeft <= 0; });
        for (var _16 = 0, completed_1 = completed; _16 < completed_1.length; _16++) {
            var project = completed_1[_16];
            if (!business.unlockedCategories.includes(project.productKey))
                business.unlockedCategories.push(project.productKey);
            var archetype = (0, productCatalog_1.archetypeByKey)(project.productKey);
            var label = (_f = archetype === null || archetype === void 0 ? void 0 : archetype.label) !== null && _f !== void 0 ? _f : project.productKey;
            w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83E\uDDED ".concat(label, " category entry complete \u2014 new products can now be developed.") });
            (0, chronicle_1.recordChronicle)(w, {
                kind: "milestone", importance: 2, title: "Entered ".concat(label),
                text: "".concat(w.company, " completed the capability build required to compete in ").concat(label, "."),
                icon: "🧭", entityType: "market", entityId: project.productKey, tags: ["growth", "category", business.industryId],
                dedupeKey: "category_".concat(business.industryId, "_").concat(project.productKey),
            });
        }
        if (completed.length)
            business.categoryExpansionProjects = business.categoryExpansionProjects.filter(function (p) { return p.daysLeft > 0; });
    }
    (0, businesses_1.syncPrimaryBusinessLegacy)(w);
    var _loop_1 = function (p) {
        if (p.status === "designing") {
            var productIndustry_1 = (_g = (0, productCatalog_1.archetypeByKey)(p.productKey)) === null || _g === void 0 ? void 0 : _g.industryId;
            var pm = w.player.personnel.find(function (x) { return x.id === p.assignedPmId; });
            var pmRoom = w.player.operatingRooms.find(function (r) { var _a; return (0, infrastructure_1.roomSupportsProductDesign)(r, productIndustry_1) && r.assignedPersonnelIds.includes((_a = p.assignedPmId) !== null && _a !== void 0 ? _a : ""); });
            if (!pm || !pmRoom) {
                var locked_1 = new Set(w.player.skus.filter(function (s) { return s !== p && s.status === "designing" && s.assignedPmId; }).map(function (s) { return s.assignedPmId; }));
                var productRooms = w.player.operatingRooms.filter(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, productIndustry_1); });
                var seated_1 = new Set(productRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
                var replacement_1 = w.player.personnel.filter(function (x) { return x.role === "product_manager" && seated_1.has(x.id) && !locked_1.has(x.id); }).sort(function (a, b) { return (0, people_1.productManagerEffectiveness)(b, p.productKey) - (0, people_1.productManagerEffectiveness)(a, p.productKey); })[0];
                if (replacement_1) {
                    p.leadHistory = (_h = p.leadHistory) !== null && _h !== void 0 ? _h : [];
                    var previousLead = p.leadHistory[p.leadHistory.length - 1];
                    if (previousLead && previousLead.toTick == null)
                        previousLead.toTick = w.tick;
                    p.leadHistory.push({ personId: replacement_1.id, personName: replacement_1.name, fromTick: w.tick });
                    p.assignedPmId = replacement_1.id;
                    p.assignedPmName = replacement_1.name;
                    pm = replacement_1;
                    pmRoom = productRooms.find(function (r) { return r.assignedPersonnelIds.includes(replacement_1.id); });
                    replacement_1.careerEvents.push({ tick: w.tick, kind: "milestone", text: "Took over development of ".concat(p.name, ".") });
                    w.events.push({ tick: w.tick, kind: "people", text: "\uD83D\uDC64 ".concat(replacement_1.name, " took over ").concat(p.name, " development.") });
                }
            }
            var centerType = pmRoom ? (0, infrastructure_1.roomFacilityType)(pmRoom) : "office";
            var centerBonus = centerType === "beauty_center" || centerType === "toy_center" ? 1 + ((_j = pmRoom === null || pmRoom === void 0 ? void 0 : pmRoom.upgradeLevel) !== null && _j !== void 0 ? _j : 1) * .10 : 1;
            var designSpeed = pmRoom && pm ? (0.75 + (0, people_1.productManagerEffectiveness)(pm, p.productKey) * 0.75) * centerBonus : 0.25;
            p.designDaysLeft = Math.max(0, p.designDaysLeft - designSpeed);
            if (p.designDaysLeft <= 0) {
                p.status = "designed";
                if (pm)
                    pm.careerEvents.push({ tick: w.tick, kind: "milestone", text: "Completed development of ".concat(p.name, ".") });
                w.events.push({ tick: w.tick, kind: "product", text: "\uD83C\uDFA8 ".concat(p.name, " design complete \u2014 ready to manufacture.") });
                (0, chronicle_1.recordProductDesignComplete)(w, p);
                // PM is freed (assignedPmId stays for reference but they're no longer locked)
            }
        }
        if (((_k = p.mfgBatchSize) !== null && _k !== void 0 ? _k : 0) > 0 && ((_l = p.mfgDaysLeft) !== null && _l !== void 0 ? _l : 0) > 0) {
            p.mfgDaysLeft = Math.max(0, p.mfgDaysLeft - 1);
            if (p.mfgDaysLeft <= 0) {
                var landed = p.mfgBatchSize;
                var firstBatch = p.status === "manufacturing" && p.inventory <= 0 && p.releasedToMarket !== true;
                (0, productDynamics_1.receiveInventoryLot)(p, landed, w.tick, p.unitCost);
                p.mfgBatchSize = 0;
                if (p.status === "manufacturing")
                    p.status = "active";
                w.events.push({ tick: w.tick, kind: "operations", text: firstBatch
                        ? "\uD83D\uDCE6 ".concat(p.name, " first batch is ready \u2014 ").concat(Math.round(landed).toLocaleString(), " units are in the warehouse. Set price, channels and launch when ready.")
                        : "\uD83D\uDCE6 ".concat(p.name, " replenishment landed \u2014 ").concat(Math.round(landed).toLocaleString(), " units received.") });
            }
        }
    };
    // ---- design & manufacturing timers ----
    for (var _17 = 0, _18 = w.player.skus; _17 < _18.length; _17++) {
        var p = _18[_17];
        _loop_1(p);
    }
    // perceived quality eases toward actual quality, but a large existing customer base ANCHORS the
    // old reputation — so raising quality on a popular product moves perception slowly (the inertia
    // Oscar described: 0.1→0.5 actual lands perception in the middle for a while). New/small products
    // adopt their true quality fast; established ones are sticky (which is also why leveraging a known
    // product can beat launching fresh — its perception, once earned, is durable).
    {
        var totalCust = (function () { var t = 0; for (var k in w.customers)
            t += w.customers[k].count; return t; })();
        for (var _19 = 0, _20 = w.player.skus; _19 < _20.length; _19++) {
            var p = _20[_19];
            // anchoring 0..~0.85 based on how big the base is (200k customers ≈ heavily anchored)
            var anchor = (0, industries_1.clamp)(totalCust / 250000, 0, 0.85);
            var baseRate = 0.02 * types_1.TICK_RATE_SCALE; // fast when unknown
            var rate = baseRate * (1 - anchor) + 0.0015 * types_1.TICK_RATE_SCALE; // floor so it always drifts
            p.perceivedQuality = (0, industries_1.clamp)(p.perceivedQuality + (p.quality - p.perceivedQuality) * rate, 0, 1);
            // novelty: decays over the product's lifetime (reaches ~0.1 at end of life)
            var age = p.launchTick > 0 ? w.tick - p.launchTick : 0;
            if (p.launchTick > 0 && p.lifetimeDays > 0) {
                p.novelty = (0, industries_1.clamp)(1 - (age / p.lifetimeDays) * 0.9, 0.05, 1);
            }
            else {
                p.novelty = 1;
            }
            // fame: grows with sales volume + marketing exposure + satisfaction, decays slowly without
            var dailySales = p.unitsSoldTotal / Math.max(1, age);
            var salesFame = (0, industries_1.clamp)(dailySales / 500, 0, 0.5); // ~500 units/day = max sales fame
            var mktgFame = (0, industries_1.clamp)(marketingPower * 0.15, 0, 0.2);
            var custSat = (function () { var s = 0, n = 0; for (var k in w.customers) {
                s += w.customers[k].satisfaction * w.customers[k].count;
                n += w.customers[k].count;
            } return n > 0 ? s / n : 0.5; })();
            var fameTarget = (0, industries_1.clamp)(salesFame + mktgFame + custSat * 0.2, 0, 1);
            p.fame = (0, industries_1.clamp)(p.fame + (fameTarget - p.fame) * 0.003 * types_1.TICK_RATE_SCALE, 0, 1);
            // rarity: recalculated from current quality + design + novelty + fame + expertise
            (0, productDynamics_1.updateProductMomentum)(w, p);
            (0, productDynamics_1.processInventoryAgeing)(w, p);
            (0, productDynamics_1.maybeTriggerRecall)(w, p);
            var exp = Math.max((_m = w.player.expertise.category[p.productKey]) !== null && _m !== void 0 ? _m : 0, (_o = w.player.expertise.industry[p.industryId]) !== null && _o !== void 0 ? _o : 0);
            var rarityScore = p.quality * 0.2 + p.designQuality * 0.25 + p.novelty * 0.15 + p.fame * 0.25 + exp * 0.06;
            p.rarity = (0, types_1.computeProductRarity)(rarityScore);
        }
    }
    var _loop_2 = function (ci) {
        var cell = w.cube[ci];
        var cellMarket = cell.head * cell.spend;
        // dormancy: if no player product has meaningful static fit here AND player has no awareness yet, skip.
        // (Competitors still hold this cell among themselves, but it doesn't affect the player's P&L.)
        var maxStatic = 0;
        for (var _36 = 0, primarySkus_2 = primarySkus; _36 < primarySkus_2.length; _36++) {
            var p = primarySkus_2[_36];
            var s = (_q = (_p = w.fitCache[p.id]) === null || _p === void 0 ? void 0 : _p[ci]) !== null && _q !== void 0 ? _q : 0;
            if (s > maxStatic)
                maxStatic = s;
        }
        var isSelected = w.selectedCell &&
            cell.coord.gender === w.selectedCell.gender && cell.coord.age === w.selectedCell.age &&
            cell.coord.class === w.selectedCell.class && cell.coord.leaning === w.selectedCell.leaning &&
            cell.coord.geography === w.selectedCell.geography && cell.coord.family === w.selectedCell.family;
        var hasCustomers = ((_s = (_r = w.customers[ci]) === null || _r === void 0 ? void 0 : _r.count) !== null && _s !== void 0 ? _s : 0) > 1;
        if (maxStatic < 0.02 && !isSelected && !hasCustomers)
            return "continue"; // dormant — no fit, no base, not selected
        // brand equity: update independently per BRAND + CATEGORY. Umbrella brand spend is diluted
        // across the portfolio; product performance then pulls each brand toward its own earned identity.
        var brandFocusMatch = focusCellKeys
            ? (focusCellKeys.has(cellKey(cell)) ? 1.2 : 0.15)
            : (w.player.marketingFocus === "all" || cell.coord.age === w.player.marketingFocus) ? 1 : 0.5;
        var seenBrandCats = new Set();
        var primaryBrands = w.brands.filter(function (b) { return b.industryId === w.industryId; });
        var portfolioDilution = 1 / Math.sqrt(Math.max(1, primaryBrands.length));
        for (var _37 = 0, primarySkus_3 = primarySkus; _37 < primarySkus_3.length; _37++) {
            var p = primarySkus_3[_37];
            var pair = "".concat(p.brandId, "|").concat(p.productKey);
            if (!seenBrandCats.has(pair)) {
                seenBrandCats.add(pair);
                (0, brandEquity_1.updateEquity)(w, ci, p.brandId, p.productKey, brandPower * portfolioDilution * (1 + visionBonus(w, "recognition")), brandFocusMatch, (_t = brandSignals[p.brandId]) !== null && _t !== void 0 ? _t : (0, brandEquity_1.earnedSignals)(w, p.brandId));
            }
        }
        // update player awareness — equity effects are per brand + category
        for (var i = 0; i < primarySkus.length; i++) {
            var p = primarySkus[i];
            var fStatic = (_v = (_u = w.fitCache[p.id]) === null || _u === void 0 ? void 0 : _u[ci]) !== null && _v !== void 0 ? _v : 0;
            var onlineFit = 0.5 + 0.5 * p.online;
            var focusMatch = focusCellKeys
                ? (focusCellKeys.has(cellKey(cell)) ? 1.2 : 0.15)
                : (w.player.marketingFocus === "all" || cell.coord.age === w.player.marketingFocus) ? 1 : 0.3;
            var skuDist = skuDistribution[i];
            var distPresence = skuDist.reach * 0.6 + skuDist.onlineCoverage * onlineFit * 0.4;
            var focusLift = 1 + marketingPower * (focusMatch - 1) * 0.6 * concentrationBoost;
            var eqAwareLift = (0, brandEquity_1.trustAwarenessLift)(w, ci, p.productKey, p.brandId);
            // ceiling: distribution alone gets you moderate awareness (people see it on shelves).
            // Marketing raises the ceiling further. No marketing + no distribution = zero.
            var shelfVisibility = (0, industries_1.clamp)(distPresence * 0.5, 0, 0.3); // shelf presence alone -> up to 30% aware
            var mktgCeil = shelfVisibility + (0, industries_1.clamp)(marketingPower * focusMatch, 0, 1) * 0.7;
            var organicPush = (0, industries_1.clamp)(fStatic * (0.35 + 0.65 * distPresence) * Math.max(0.2, focusLift) * eqAwareLift * mktgCeil);
            var ipFloor = (0, ip_1.ipAwarenessFloor)(w, p, cell);
            var push = Math.max(organicPush, ipFloor);
            var cur = cell.awareness[p.id] || 0;
            var speed = push >= cur
                ? (0, industries_1.clamp)(0.012 * types_1.TICK_RATE_SCALE * (0.4 + marketingPower * focusMatch + 0.5 * distPresence + 0.6 * skuDist.awarenessBoost))
                : 0.010 * types_1.TICK_RATE_SCALE;
            cell.awareness[p.id] = (0, industries_1.clamp)(cur + (push - cur) * speed);
        }
        // update competitor awareness (their marketing builds it, focused, with exit-decay)
        for (var _38 = 0, _39 = w.comps; _38 < _39.length; _38++) {
            var comp = _39[_38];
            (0, competitorBrain_1.competitorAwareness)(w, comp, cell);
        }
        // effective appeal. Static factor (fit×need×category) is cached; price & quality-sensitivity are live.
        var playerEff = primarySkus.map(function (p, i) {
            var _a, _b, _c;
            if (p.status !== "active" || p.releasedToMarket !== true)
                return 0; // inventory may exist, but the product is not commercially released yet
            var fStatic = (_b = (_a = w.fitCache[p.id]) === null || _a === void 0 ? void 0 : _a[ci]) !== null && _b !== void 0 ? _b : 0;
            // per-category equity effects
            var eqDemand = (0, brandEquity_1.equityDemandMult)(w, ci, cell, p.productKey, p.brandId);
            var eqPricePower = (0, brandEquity_1.pricingPower)(w, ci, p.productKey, p.brandId);
            var effPriceSens = cell.priceSens * (1 - eqPricePower);
            var priceTerm = 1 - (0, industries_1.clamp)(p.listPrice / REF_PRICE - 1, -0.6, 0.9) * effPriceSens * 0.5;
            var qTerm = 1 - cell.qualitySens + cell.qualitySens * p.perceivedQuality;
            var aware = ((_c = cell.awareness[p.id]) !== null && _c !== void 0 ? _c : 0) * (0.4 + 0.6 * skuDistribution[i].reach);
            var commercialFit = (0, productMarketFit_1.productMarketFitForCell)(w, p, cell).overall;
            // Marketing can make people aware of a bad proposition, but cannot brute-force them into buying it.
            var commercialConversion = 0.10 + commercialFit * 0.90;
            return Math.max(0, fStatic * qTerm * (1 + visionBonus(w, "quality")) * priceTerm * eqDemand * (1 + visionBonus(w, "sales")))
                * aware * (0, productDynamics_1.productDemandMultiplier)(p, w.tick) * (0, ip_1.ipDemandMultiplier)(w, p, cell) * commercialConversion;
        });
        // each competitor's appeal = sum over their products
        var compEff = w.comps.map(function (c) {
            var _a, _b, _c;
            var e = 0;
            for (var _i = 0, _d = c.products; _i < _d.length; _i++) {
                var cp = _d[_i];
                var f = (0, cube_1.fit)(cp.target, cell, cfg);
                var nm = (0, cube_1.needMatch)(cp.attributes, cell, cfg);
                var cat = (_b = cell.categoryPref[(_a = cp.productKey) !== null && _a !== void 0 ? _a : ""]) !== null && _b !== void 0 ? _b : 0.6;
                var priceTerm = 1 - (0, industries_1.clamp)(cp.price / REF_PRICE - 1, -0.6, 0.9) * cell.priceSens * 0.5;
                var qTerm = 1 - cell.qualitySens + cell.qualitySens * cp.quality;
                var aware = (_c = cell.awareness[cp.awarenessKey]) !== null && _c !== void 0 ? _c : 0;
                e += Math.max(0, f * nm * cat * qTerm * priceTerm) * aware;
            }
            return e;
        });
        var denom = (0, industries_1.sum)(playerEff) + (0, industries_1.sum)(compEff) || 1;
        // ---- customer base: acquire → retain → repeat (the primary revenue driver) ----
        var playerAppeal = (0, industries_1.sum)(playerEff);
        var acquireShare = playerAppeal / denom; // our pull vs the whole field
        var bestRival = compEff.length ? Math.max.apply(Math, compEff) : 0;
        var trust = playerAppeal > 0
            ? primarySkus.reduce(function (acc, p, i) { return acc + (playerEff[i] / playerAppeal) * (0, brandEquity_1.getEquity)(w, ci, p.productKey, p.brandId).trust; }, 0)
            : (0, brandEquity_1.getEquity)(w, ci).trust;
        // absolute experience: how good our products actually are for this segment (quality + price fairness),
        // weighted by our appeal mix. A bad/overpriced product dissatisfies even with no competitor present.
        var qualityValue = 0.5;
        if (playerAppeal > 0) {
            var acc_1 = 0;
            primarySkus.forEach(function (p, i) {
                var wgt = playerEff[i] / playerAppeal;
                var qExp = 1 - cell.qualitySens + cell.qualitySens * p.perceivedQuality; // perceived quality
                var fair = (0, industries_1.clamp)(1 - (0, industries_1.clamp)(p.listPrice / REF_PRICE - 1, -0.5, 1.2) * cell.priceSens * 0.4, 0.1, 1.2); // price fairness
                acc_1 += wgt * (0, industries_1.clamp)(qExp * fair, 0, 1);
            });
            qualityValue = acc_1;
        }
        var satTarget = (0, customers_1.satisfactionTarget)(playerAppeal, bestRival, trust, qualityValue);
        // revenue this tick from our retained+growing base in this cell
        var cellGrossFromBase = (playerAppeal > 0 || ((_x = (_w = w.customers[ci]) === null || _w === void 0 ? void 0 : _w.count) !== null && _x !== void 0 ? _x : 0) > 0)
            ? (0, customers_1.updateCustomers)(w, ci, cell, acquireShare, satTarget, cell.spend)
            : 0;
        var cellRev = 0, cellUnits = 0, cellCogs = 0;
        // attribute the cell's customer revenue across our SKUs by their relative appeal here
        primarySkus.forEach(function (p, i) {
            var skuShareOfOurs = playerAppeal > 0 ? playerEff[i] / playerAppeal : (i === 0 ? 1 : 0);
            var grossRev = cellGrossFromBase * skuShareOfOurs;
            var units = grossRev / (p.listPrice || 1);
            skuRevAnnual[i] += grossRev;
            skuUnitsAnnual[i] += units;
            skuCellRev[i].push(grossRev);
            cellRev += grossRev;
            cellUnits += units;
            cellCogs += units * p.unitCost;
        });
        // record finance for this cell (net of channel cut applied later uniformly)
        if (cellRev > 0) {
            cellFinance.push({
                coord: cell.coord,
                revenue: cellRev,
                units: cellUnits,
                grossMargin: cellRev - cellCogs,
                marketingAllocated: 0, // filled after we know totals
                contribution: 0,
            });
        }
        // selected cell inspection
        if (isSelected) {
            var all = __spreadArray(__spreadArray([], primarySkus.map(function (p, i) { return ({ name: p.name, isComp: false, share: playerEff[i] / denom }); }), true), w.comps.map(function (c, i) { return ({ name: c.name, isComp: true, share: compEff[i] / denom }); }), true).filter(function (x) { return x.share > 0.001; }).sort(function (a, b) { return b.share - a.share; });
            w.selectedInfo = { head: cell.head, spend: cell.spend, market: cellMarket, breakdown: all };
        }
    };
    for (var ci = 0; ci < w.cube.length; ci++) {
        _loop_2(ci);
    }
    // word-of-mouth spillover to adjacent segments (cheap: iterates only cells with customers)
    if (!adjacencyCache || adjacencyCache.size !== w.cube.length) {
        adjacencyCache = { size: w.cube.length, adj: (0, customers_1.buildAdjacency)(w) };
    }
    (0, customers_1.applyWordOfMouthSpillover)(w, adjacencyCache.adj);
    var _loop_3 = function (camp) {
        if (camp.daysRemaining <= 0)
            return "continue";
        var seg = w.savedSegments.find(function (s) { return s.id === camp.segmentId; });
        if (!seg) {
            camp.daysRemaining = 0;
            return "continue";
        }
        var campCells = (0, segments_1.cellsInSegment)(w, seg.filter);
        var dailySpend = camp.budget / camp.totalDays;
        var campPower = (0, industries_1.clamp)(dailySpend / 8000, 0, 1.5) * ((_y = camp.effectivenessMult) !== null && _y !== void 0 ? _y : 1); // agency quality matters
        var agency = industries_1.MARKETING_AGENCIES.find(function (a) { return a.id === camp.agencyId; });
        for (var _40 = 0, campCells_1 = campCells; _40 < campCells_1.length; _40++) {
            var cell = campCells_1[_40];
            var agencyFit = 1;
            if (agency) {
                for (var _41 = 0, _42 = Object.entries(agency.strengthSkew); _41 < _42.length; _41++) {
                    var _43 = _42[_41], axisRaw = _43[0], skew = _43[1];
                    var axis = axisRaw;
                    var vals = industries_1.AXES[axis];
                    var idx = Math.max(0, vals.indexOf(cell.coord[axis]));
                    var pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
                    agencyFit *= (0, industries_1.clamp)(1 + Number(skew) * (pos - 0.5) * 0.8, 0.7, 1.3);
                }
            }
            var campaignProducts = camp.scope === "company"
                ? primarySkus
                : camp.scope.startsWith("brand:")
                    ? primarySkus.filter(function (p) { return p.brandId === camp.scope.slice(6); })
                    : primarySkus.filter(function (p) { return p.id === camp.scope; });
            for (var _44 = 0, campaignProducts_1 = campaignProducts; _44 < campaignProducts_1.length; _44++) {
                var p = campaignProducts_1[_44];
                // Campaigns may build pre-launch awareness while a product is being developed,
                // but only active products can actually convert that awareness into customers/sales.
                var fStatic = (_0 = (_z = w.fitCache[p.id]) === null || _z === void 0 ? void 0 : _z[w.cube.indexOf(cell)]) !== null && _0 !== void 0 ? _0 : 0;
                if (fStatic < 0.02)
                    continue;
                var boost = (0, industries_1.clamp)(0.006 * types_1.TICK_RATE_SCALE * campPower * agencyFit * fStatic, 0, 0.02);
                cell.awareness[p.id] = (0, industries_1.clamp)(((_1 = cell.awareness[p.id]) !== null && _1 !== void 0 ? _1 : 0) + boost, 0, 1);
            }
        }
        w.player.cash -= dailySpend;
        camp.daysRemaining -= 1;
    };
    // ---- active campaigns: time-limited, segment-targeted awareness boosts ----
    for (var _21 = 0, _22 = w.activeCampaigns; _21 < _22.length; _21++) {
        var camp = _22[_21];
        _loop_3(camp);
    }
    // completed campaigns build agency relationships
    for (var _23 = 0, _24 = w.activeCampaigns; _23 < _24.length; _23++) {
        var c = _24[_23];
        if (c.daysRemaining <= 0 && c.agencyId) {
            w.agencyRelationships[c.agencyId] = ((_2 = w.agencyRelationships[c.agencyId]) !== null && _2 !== void 0 ? _2 : 0) + 1;
        }
    }
    w.activeCampaigns = w.activeCampaigns.filter(function (c) { return c.daysRemaining > 0; });
    // ---- fulfil demand from inventory; each SKU uses its own assigned partners ----
    var grossRevenue = 0, channelCut = 0, cogs = 0, totalUnits = 0, lostTick = 0, actualUnitsTick = 0;
    var paymentWeightedGross = 0;
    var receivableAdds = [];
    var skuResultById = {};
    var primaryResults = primarySkus.map(function (sku, i) {
        var _a;
        var dist = skuDistribution[i];
        var demandTick = skuUnitsAnnual[i] / (types_1.TICKS_PER_QUARTER * 4);
        var sold = Math.min(demandTick, sku.inventory);
        var lost = Math.max(0, demandTick - sold);
        (0, productDynamics_1.consumeInventoryLots)(sku, sold, w.tick);
        lostTick += lost;
        sku.unitsLostTotal = ((_a = sku.unitsLostTotal) !== null && _a !== void 0 ? _a : 0) + lost;
        actualUnitsTick += sold;
        var unitsQ = sold * types_1.TICKS_PER_QUARTER;
        var demandUnitsQ = demandTick * types_1.TICKS_PER_QUARTER;
        var lostUnitsQ = lost * types_1.TICKS_PER_QUARTER;
        var gross = unitsQ * sku.listPrice;
        var cut = gross * dist.marginCut;
        var net = gross - cut;
        var varc = unitsQ * sku.unitCost;
        grossRevenue += gross;
        channelCut += cut;
        cogs += varc;
        totalUnits += unitsQ;
        paymentWeightedGross += gross * dist.paymentDays;
        if (net > 0)
            receivableAdds.push({ amount: net / types_1.TICKS_PER_QUARTER, paymentDays: dist.paymentDays });
        // lifetime accumulators use ACTUAL per-tick amounts, not annualized run-rates
        sku.unitsSoldTotal += sold;
        sku.contributionTotal += (sold * sku.listPrice * (1 - dist.marginCut)) - (sold * sku.unitCost);
        var daysCover = demandTick > 0 ? sku.inventory / demandTick : 999;
        if (lost > 0.25 && (sku.lastStockoutAlertTick == null || w.tick - sku.lastStockoutAlertTick >= 30)) {
            sku.lastStockoutAlertTick = w.tick;
            w.events.push({ tick: w.tick, kind: "stockout", text: "\u26A0 ".concat(sku.name, " is stocked out \u2014 demand is being lost until inventory arrives.") });
        }
        else if (sku.status === "active" && sku.mfgBatchSize <= 0 && demandTick > 0) {
            var planningBatch = Math.max(5000, Math.ceil(demandTick * 60 / 1000) * 1000);
            var leadDays = (0, capacity_1.productionLeadDays)(w, sku, planningBatch);
            if (daysCover < leadDays + 10 && (sku.lastLowStockAlertTick == null || w.tick - sku.lastLowStockAlertTick >= 30)) {
                sku.lastLowStockAlertTick = w.tick;
                w.events.push({ tick: w.tick, kind: "inventory", text: "\uD83D\uDCC9 ".concat(sku.name, " has about ").concat(Math.max(0, Math.round(daysCover)), " days of cover vs ~").concat(leadDays, " days replenishment lead time.") });
            }
        }
        var result = {
            units: unitsQ, demandUnits: demandUnitsQ, lostUnits: lostUnitsQ,
            revenue: net,
            gross: gross,
            margin: net - varc, inventory: sku.inventory,
            daysCover: daysCover,
            channelCutPct: dist.marginCut, paymentDays: dist.paymentDays,
        };
        skuResultById[sku.id] = result;
        return result;
    });
    // Every additional active business runs through the same generic market runtime.
    // Its demand is then fulfilled through the same inventory/distribution/finance pipeline.
    var primaryFulfilledGross = grossRevenue;
    var reachWeighted = totalReach * activeDistribution.length;
    var onlineWeighted = onlineCoverage * activeDistribution.length;
    var distributionWeight = activeDistribution.length;
    var secondaryMarketAnnual = {};
    var activeSecondaryIndustries = Object.values((_3 = w.player.businesses) !== null && _3 !== void 0 ? _3 : {})
        .filter(function (b) { return Boolean(b && b.status === "active" && b.industryId !== w.industryId); })
        .map(function (b) { return b.industryId; });
    var _loop_4 = function (industryId) {
        var sim = (0, secondaryMarket_1.simulateSecondaryIndustryMarket)(w, industryId, marketingPower, brandPower);
        secondaryMarketAnnual[industryId] = sim.marketAnnual;
        var industrySkus = w.player.skus.filter(function (s) { return s.industryId === industryId; });
        var activeIndustrySkus = industrySkus.filter(function (s) { return s.status === "active" && s.releasedToMarket === true; }).length;
        if (activeIndustrySkus > 0) {
            reachWeighted += sim.avgReach * activeIndustrySkus;
            onlineWeighted += sim.avgOnlineCoverage * activeIndustrySkus;
            distributionWeight += activeIndustrySkus;
        }
        for (var _45 = 0, industrySkus_1 = industrySkus; _45 < industrySkus_1.length; _45++) {
            var sku = industrySkus_1[_45];
            var dist = (0, distribution_1.distributionMetricsForSku)(w, sku);
            var demandTick = (_4 = sim.demandTickBySkuId[sku.id]) !== null && _4 !== void 0 ? _4 : 0;
            var sold = Math.min(demandTick, sku.inventory);
            var lost = Math.max(0, demandTick - sold);
            (0, productDynamics_1.consumeInventoryLots)(sku, sold, w.tick);
            lostTick += lost;
            sku.unitsLostTotal = ((_5 = sku.unitsLostTotal) !== null && _5 !== void 0 ? _5 : 0) + lost;
            actualUnitsTick += sold;
            var unitsQ = sold * types_1.TICKS_PER_QUARTER;
            var demandUnitsQ = demandTick * types_1.TICKS_PER_QUARTER;
            var lostUnitsQ = lost * types_1.TICKS_PER_QUARTER;
            var gross = unitsQ * sku.listPrice;
            var cut = gross * dist.marginCut;
            var net = gross - cut;
            var varc = unitsQ * sku.unitCost;
            grossRevenue += gross;
            channelCut += cut;
            cogs += varc;
            totalUnits += unitsQ;
            paymentWeightedGross += gross * dist.paymentDays;
            if (net > 0)
                receivableAdds.push({ amount: net / types_1.TICKS_PER_QUARTER, paymentDays: dist.paymentDays });
            sku.unitsSoldTotal += sold;
            sku.contributionTotal += (sold * sku.listPrice * (1 - dist.marginCut)) - (sold * sku.unitCost);
            var daysCover = demandTick > 0 ? sku.inventory / demandTick : 999;
            if (lost > 0.25 && (sku.lastStockoutAlertTick == null || w.tick - sku.lastStockoutAlertTick >= 30)) {
                sku.lastStockoutAlertTick = w.tick;
                w.events.push({ tick: w.tick, kind: "stockout", text: "\u26A0 ".concat(sku.name, " is stocked out \u2014 demand is being lost until inventory arrives.") });
            }
            else if (sku.status === "active" && sku.mfgBatchSize <= 0 && demandTick > 0) {
                var planningBatch = Math.max(5000, Math.ceil(demandTick * 60 / 1000) * 1000);
                var leadDays = (0, capacity_1.productionLeadDays)(w, sku, planningBatch);
                if (daysCover < leadDays + 10 && (sku.lastLowStockAlertTick == null || w.tick - sku.lastLowStockAlertTick >= 30)) {
                    sku.lastLowStockAlertTick = w.tick;
                    w.events.push({ tick: w.tick, kind: "inventory", text: "\uD83D\uDCC9 ".concat(sku.name, " has about ").concat(Math.max(0, Math.round(daysCover)), " days of cover vs ~").concat(leadDays, " days replenishment lead time.") });
                }
            }
            skuResultById[sku.id] = { units: unitsQ, demandUnits: demandUnitsQ, lostUnits: lostUnitsQ, revenue: net, gross: gross, margin: net - varc, inventory: sku.inventory, daysCover: daysCover, channelCutPct: dist.marginCut, paymentDays: dist.paymentDays };
        }
    };
    for (var _25 = 0, activeSecondaryIndustries_1 = activeSecondaryIndustries; _25 < activeSecondaryIndustries_1.length; _25++) {
        var industryId = activeSecondaryIndustries_1[_25];
        _loop_4(industryId);
    }
    if (distributionWeight > 0) {
        totalReach = reachWeighted / distributionWeight;
        onlineCoverage = onlineWeighted / distributionWeight;
    }
    var skuResults = w.player.skus.map(function (sku) { var _a; return (_a = skuResultById[sku.id]) !== null && _a !== void 0 ? _a : ({ units: 0, demandUnits: 0, lostUnits: 0, revenue: 0, gross: 0, margin: 0, inventory: sku.inventory, daysCover: 999, channelCutPct: 0, paymentDays: 0 }); });
    (0, ip_1.accrueIPRoyaltiesAndDynamics)(w, skuResults);
    w.player.lostSales += lostTick;
    // Cell finance is initially demand-based so we can attribute demand by segment. When inventory
    // constrains sales, scale it back to what was actually fulfilled; otherwise analysis would report
    // revenue the company never earned during a stockout.
    var demandGross = (0, industries_1.sum)(primarySkus.map(function (sku, i) { return (skuUnitsAnnual[i] / 4) * sku.listPrice; }));
    var fulfillmentRatio = demandGross > 0 ? (0, industries_1.clamp)(primaryFulfilledGross / demandGross, 0, 1) : 1;
    for (var _26 = 0, cellFinance_1 = cellFinance; _26 < cellFinance_1.length; _26++) {
        var cf = cellFinance_1[_26];
        cf.revenue *= fulfillmentRatio;
        cf.units *= fulfillmentRatio;
        cf.grossMargin *= fulfillmentRatio;
    }
    var totalCellRev = (0, industries_1.sum)(cellFinance.map(function (c) { return c.revenue; })) || 1;
    for (var _27 = 0, cellFinance_2 = cellFinance; _27 < cellFinance_2.length; _27++) {
        var cf = cellFinance_2[_27];
        cf.marketingAllocated = w.player.marketing * (cf.revenue / totalCellRev);
        cf.contribution = cf.grossMargin - cf.marketingAllocated;
    }
    var avgMarginCut = grossRevenue > 0 ? channelCut / grossRevenue : 0;
    var avgPaymentDays = grossRevenue > 0 ? paymentWeightedGross / grossRevenue : 0;
    var netRevenue = grossRevenue - channelCut;
    var contribution = netRevenue - cogs;
    var usedPartnerIds = new Set(w.player.skus.filter(function (s) { return s.status === "active" || s.status === "manufacturing"; }).flatMap(function (s) { var _a; return (_a = s.assignedPartnerIds) !== null && _a !== void 0 ? _a : []; }));
    var slotting = (0, industries_1.sum)(contracts.filter(function (c) { return usedPartnerIds.has(c.partnerId); }).map(function (c) { var _a; return (_a = c.slotting) !== null && _a !== void 0 ? _a : industries_1.CHANNEL_TYPES[c.type].slotting; }));
    var marketing = w.player.marketing;
    var brandMarketing = w.player.brandMarketing;
    var backOffice = 0;
    // Department capability is now produced by staffed offices, so there is no separate abstract department fee.
    var deptOverhead = 0;
    // Physical operating footprint is the single source of infrastructure cost.
    var locationCost = w.player.operatingRooms.reduce(function (a, room) { return a + room.monthlyCost * 3; }, 0);
    // personnel salaries (monthly, prorated to quarterly)
    var personnelCost = w.player.personnel.reduce(function (a, p) { return a + p.salary * 3; }, 0);
    // Universal IP licensing: active external contracts charge a royalty on net licensed-product revenue.
    // Minimum guarantees are paid in cash at signing; player-owned IPs carry no royalty expense.
    var licensingCost = (0, ip_1.royaltyCostQuarterly)(w, skuResults);
    var ebitda = contribution - marketing - brandMarketing - slotting - backOffice - deptOverhead - licensingCost - locationCost - personnelCost;
    var interest = w.player.debt * 0.10 / 4; // 10% annual, per quarter
    var profit = ebitda - interest;
    var income = {
        grossRevenue: grossRevenue,
        channelCut: channelCut,
        netRevenue: netRevenue,
        cogs: cogs,
        contribution: contribution,
        marketing: marketing,
        brandMarketing: brandMarketing,
        slotting: slotting,
        backOffice: backOffice,
        deptOverhead: deptOverhead,
        licensingCost: licensingCost,
        locationCost: locationCost,
        personnelCost: personnelCost,
        ebitda: ebitda,
        interest: interest,
        profit: profit,
    };
    // ---- working capital / cash flow ----
    // Each SKU's retailer mix has its own payment terms, so receivables mature separately.
    var daysPerTick = 365 / (types_1.TICKS_PER_QUARTER * 4);
    for (var _28 = 0, receivableAdds_1 = receivableAdds; _28 < receivableAdds_1.length; _28++) {
        var add = receivableAdds_1[_28];
        var dueInTicks = Math.max(0, Math.round(add.paymentDays / daysPerTick));
        if (add.amount > 0)
            w.player.receivables.push({ amount: add.amount, dueTick: w.tick + dueInTicks });
    }
    // collect matured receivables
    var collected = 0;
    w.player.receivables = w.player.receivables.filter(function (r) {
        if (r.dueTick <= w.tick) {
            collected += r.amount;
            return false;
        }
        return true;
    });
    var receivablesOutstanding = (0, industries_1.sum)(w.player.receivables.map(function (r) { return r.amount; }));
    // costs paid out immediately this tick (COGS already paid when produced as inventory; here pay opex)
    var opexTick = (marketing + brandMarketing + slotting + backOffice + deptOverhead + licensingCost + locationCost + personnelCost + interest) / types_1.TICKS_PER_QUARTER;
    // cash moves by collections minus opex (COGS was paid at production time)
    w.player.cash += collected - opexTick;
    var inventoryValue = (0, industries_1.sum)(w.player.skus.map(function (s) { return s.inventory * s.unitCost; }));
    // Days Inventory Outstanding: inventory value / quarterly COGS * 90, bounded.
    var dio = cogs > 0 ? (0, industries_1.clamp)((inventoryValue / cogs) * 90, 0, 365) : 0;
    var dso = avgPaymentDays; // Days Sales Outstanding ~ channel payment terms
    var cashCycleDays = dio + dso;
    var cashflow = {
        cash: w.player.cash,
        inventoryValue: inventoryValue,
        receivables: receivablesOutstanding,
        cashCycleDays: cashCycleDays,
        operatingCashFlow: (collected - opexTick) * types_1.TICKS_PER_QUARTER,
        debt: w.player.debt,
    };
    // Difficulty pressure is financial runway + expectations, never hidden demand cheats.
    if (w.tick > 0 && w.tick % types_1.TICKS_PER_QUARTER === 0) {
        var d = (0, difficulty_1.difficultyConfig)(w.difficulty);
        var quarter = Math.floor(w.tick / types_1.TICKS_PER_QUARTER);
        if (d.investorExpectations > 0 && quarter > d.graceQuarters) {
            var recent = w.history.at(-1);
            var fourBack = (_6 = w.history[Math.max(0, w.history.length - types_1.TICKS_PER_QUARTER)]) !== null && _6 !== void 0 ? _6 : recent;
            var growth = recent && fourBack && Math.abs(fourBack.revenue) > 1 ? recent.revenue / fourBack.revenue - 1 : (netRevenue > 100000 ? .2 : 0);
            var margin = netRevenue > 1 ? ebitda / netRevenue : -1;
            var growthScore = (0, industries_1.clamp)((growth + .05) / Math.max(.05, d.expectationTargetGrowth + .05), 0, 1.2);
            var marginScore = (0, industries_1.clamp)((margin + .08) / Math.max(.08, d.expectationTargetMargin + .08), 0, 1.2);
            var traction = (0, industries_1.clamp)((netRevenue / 500000), 0, 1);
            var score = growthScore * .40 + marginScore * .35 + traction * .25;
            w.investorConfidence = (0, industries_1.clamp)(w.investorConfidence + (score - .72) * .09 * d.investorExpectations, 0, 1);
            if (score < .42)
                w.expectationStrikes += 1;
            else if (score > .82)
                w.expectationStrikes = Math.max(0, w.expectationStrikes - 1);
            if (score < .42)
                w.events.push({ tick: w.tick, kind: "finance", text: "\uD83D\uDCCB Investor review: traction is below plan. Confidence ".concat((w.investorConfidence * 100).toFixed(0), "%.") });
            else if (score > .88)
                w.events.push({ tick: w.tick, kind: "finance", text: "\uD83D\uDCC8 Investor review: the company is ahead of plan. Confidence ".concat((w.investorConfidence * 100).toFixed(0), "%.") });
        }
    }
    // ---- overall share & history ----
    var primaryMarketAnnual = (0, industries_1.sum)(w.cube.map(function (c) { return c.head * c.spend; }));
    var totalMarket = primaryMarketAnnual + (0, industries_1.sum)(Object.values(secondaryMarketAnnual));
    var overallShare = totalMarket ? grossRevenue / totalMarket : 0;
    // rolling day/month/year share: actual units sold vs actual market units available per tick.
    // market units this tick = total category spend for the day / average price (approx via REF basket).
    var avgPrice = w.player.skus.length ? (0, industries_1.sum)(w.player.skus.map(function (s) { return s.listPrice; })) / w.player.skus.length : REF_PRICE;
    var marketUnitsTick = (totalMarket / types_1.TICKS_PER_YEAR) / Math.max(1, avgPrice);
    w.unitsTickHistory.push(actualUnitsTick);
    w.marketTickHistory.push(marketUnitsTick);
    if (w.unitsTickHistory.length > types_1.TICKS_PER_YEAR)
        w.unitsTickHistory.shift();
    if (w.marketTickHistory.length > types_1.TICKS_PER_YEAR)
        w.marketTickHistory.shift();
    var windowShare = function (n) {
        var u = w.unitsTickHistory.slice(-n);
        var m = w.marketTickHistory.slice(-n);
        var us = u.reduce(function (a, b) { return a + b; }, 0);
        var ms = m.reduce(function (a, b) { return a + b; }, 0);
        return ms > 0 ? (0, industries_1.clamp)(us / ms, 0, 1) : 0;
    };
    var shareMonth = windowShare(types_1.TICKS_PER_MONTH);
    var shareYear = windowShare(types_1.TICKS_PER_YEAR);
    for (var _29 = 0, _30 = w.studies; _29 < _30.length; _29++) {
        var st = _30[_29];
        if (!st.done) {
            st.ticksLeft -= (0.70 + (0, people_1.teamEffectiveness)(w, "strategy") * 0.60) * (0, infrastructure_1.facilityEffectMultiplier)(w, "insights");
            if (st.ticksLeft <= 0) {
                st.done = true;
                w.revealed[st.type] = __assign(__assign({}, computeStudyFact(w, st.type)), { asOfTick: w.tick });
            }
        }
    }
    // ---- expertise: grows with cumulative sales per category ----
    // thresholds: 0→1 at 10k units, 1→2 at 50k, 2→3 at 200k, 3→4 at 800k, 4→5 at 3M
    var EXP_THRESHOLDS = [0, 10000, 50000, 200000, 800000, 3000000];
    var catUnits = {};
    var industryUnits = {};
    for (var _31 = 0, _32 = w.player.skus; _31 < _32.length; _31++) {
        var s = _32[_31];
        catUnits[s.productKey] = ((_7 = catUnits[s.productKey]) !== null && _7 !== void 0 ? _7 : 0) + s.unitsSoldTotal;
        industryUnits[s.industryId] = ((_8 = industryUnits[s.industryId]) !== null && _8 !== void 0 ? _8 : 0) + s.unitsSoldTotal;
    }
    for (var pk in catUnits) {
        var stars = 0;
        for (var i = 1; i < EXP_THRESHOLDS.length; i++) {
            if (catUnits[pk] >= EXP_THRESHOLDS[i])
                stars = i;
        }
        w.player.expertise.category[pk] = stars;
    }
    for (var _33 = 0, _34 = Object.entries(industryUnits); _33 < _34.length; _33++) {
        var _35 = _34[_33], industryId = _35[0], indUnits = _35[1];
        var indStars = 0;
        for (var i = 1; i < EXP_THRESHOLDS.length; i++) {
            if (indUnits >= EXP_THRESHOLDS[i] * 2)
                indStars = i;
        }
        w.player.expertise.industry[industryId] = indStars;
    }
    // ---- people development. Recruiting slates now come only from explicit agency searches. ----
    if (w.tick % types_1.TICKS_PER_QUARTER === 0)
        (0, people_1.updatePeopleQuarter)(w);
    if (w.tick % types_1.TICKS_PER_YEAR === 0) {
        (0, people_1.updatePeopleYear)(w);
        (0, infrastructure_1.syncDerivedDepartments)(w);
    }
    // ---- vision bonus ramp: 1/5 at creation, +1/5 per quarter, max at 4 quarters ----
    if (w.player.vision) {
        var ticksSinceSet = w.tick - w.player.vision.setTick;
        w.player.vision.quartersPassed = Math.min(4, Math.floor(ticksSinceSet / types_1.TICKS_PER_QUARTER));
    }
    w.history.push({
        tick: w.tick, quarter: Math.floor(w.tick / types_1.TICKS_PER_QUARTER),
        revenue: netRevenue,
        profit: profit,
        share: overallShare, cash: w.player.cash,
        operatingCashFlow: cashflow.operatingCashFlow,
    });
    if (w.history.length > 700)
        w.history.shift();
    if (w.events.length > 160)
        w.events.splice(0, w.events.length - 160);
    (0, markets_1.syncPrimaryMarketFromAliases)(w);
    w.live = {
        income: income,
        cashflow: cashflow,
        cellFinance: cellFinance,
        skuResults: skuResults,
        totalUnits: totalUnits,
        overallShare: overallShare,
        shareMonth: shareMonth,
        shareYear: shareYear,
        totalMarket: totalMarket,
        totalReach: totalReach,
        onlineCoverage: onlineCoverage,
        avgMarginCut: avgMarginCut,
    };
    (0, chronicle_1.updateChronicleTick)(w, { netRevenueQuarterRunRate: netRevenue, profitQuarterRunRate: profit, actualUnits: actualUnitsTick });
    var scale = (0, growth_1.companyScale)(w);
    if (scale.id !== "startup") {
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: scale.id === "enterprise" ? 3 : 2,
            title: "".concat(scale.label, " reached"),
            text: "".concat(w.company, " grew into the ").concat(scale.label.toLowerCase(), " stage, supporting a broader brand portfolio and deeper category expansion."),
            icon: scale.id === "enterprise" ? "🌐" : "🏢", entityType: "company", entityId: "player", tags: ["growth", "scale"],
            dedupeKey: "scale_".concat(scale.id),
        });
    }
    return w;
}
// studies (kept here to avoid cycles; small)
function computeStudyFact(w, type) {
    var _a, _b;
    if (type === "market_map")
        return { ok: true };
    if (type === "gap_analysis") {
        var all_1 = __spreadArray(__spreadArray([], w.player.skus.filter(function (s) { return s.industryId === w.industryId; }).map(function (s) { return ({ tgt: skuEffectiveTarget(w, s), attrs: s.attributes }); }), true), w.comps.flatMap(function (c) { return c.products.map(function (p) { return ({ tgt: p.target, attrs: p.attributes }); }); }), true);
        var gaps = w.cube.map(function (c) {
            var best = all_1.length ? Math.max.apply(Math, all_1.map(function (p) { return (0, cube_1.fit)(p.tgt, c, w.cfg) * (0, cube_1.needMatch)(p.attrs, c, w.cfg); })) : 0;
            return { coord: c.coord, market: c.head * c.spend, bestFit: best, gap: c.head * c.spend * (1 - best) };
        }).sort(function (a, b) { return b.gap - a.gap; }).slice(0, 6);
        return { gaps: gaps };
    }
    if (type === "competitor_benchmark") {
        return {
            rivals: w.comps.map(function (c) { return ({ name: c.name, price: Math.round(c.price), personality: c.personality, margin: 0.55 }); }),
            you: w.player.skus.filter(function (s) { return s.industryId === w.industryId; }).map(function (s) { return ({ name: s.name, price: s.listPrice, unitCost: Math.round(s.unitCost * 10) / 10, margin: (s.listPrice - s.unitCost) / s.listPrice }); }),
        };
    }
    if (type === "product_diagnosis") {
        var diagnoses = w.player.skus.filter(function (s) { return s.industryId === w.industryId; }).map(function (s) {
            var result = (0, productMarketFit_1.bestFitDiagnosis)(w, s);
            if (!result.best)
                return { sku: s.name, verdict: "weak", message: "".concat(s.name, ": insufficient market data.") };
            var _a = result.best, cell = _a.cell, diag = _a.diag;
            var segLabel = "".concat(cell.coord.age, " ").concat(cell.coord.gender, ", ").concat(cell.coord.class, ", ").concat(cell.coord.geography, ", ").concat(cell.coord.family);
            var recommendations = (0, productMarketFit_1.partnerRecommendations)(w, s, cell).map(function (r) { return r.partner.name; });
            var issueOrder = [
                { key: "channel", score: diag.channelFit, label: "Channel" },
                { key: "price", score: diag.priceFit, label: "Price" },
                { key: "ip", score: diag.ipFit, label: "IP / audience transfer" },
                { key: "brand", score: diag.brandFit, label: "Brand positioning" },
                { key: "product", score: diag.productFit, label: "Product proposition" },
            ].sort(function (a, b) { return a.score - b.score; });
            var worst = issueOrder[0];
            var verdict = diag.overall < .42 ? "weak" : diag.overall < .70 ? "mismatch" : "healthy";
            var message = verdict === "healthy"
                ? "".concat(s.name, " is commercially coherent for ").concat(segLabel, ". No major mismatch found.")
                : "".concat(s.name, " is strongest with ").concat(segLabel, ", but ").concat(worst.label.toLowerCase(), " is holding it back.");
            return {
                sku: s.name, skuId: s.id,
                segLabel: segLabel,
                verdict: verdict,
                message: message,
                overall: diag.overall, stars: diag.stars, issues: diag.issues, positives: diag.positives,
                recommendations: recommendations,
            };
        });
        return { diagnoses: diagnoses };
    }
    if (type === "market_report") {
        var totalMarket = (0, industries_1.sum)(w.cube.map(function (c) { return c.head * c.spend; }));
        var baseMarket = (0, industries_1.sum)(w.cube.map(function (c) { return c.baseHead * c.spend; }));
        var marketGrowth = baseMarket > 0 ? (totalMarket / baseMarket - 1) : 0;
        var competitorCount = w.comps.length;
        var totalProducts = w.comps.reduce(function (a, c) { return a + c.products.length; }, 0);
        // concentration: compute share for player + each competitor, sort, find top-3 and how many cover 60%
        var shares = [];
        var playerRev = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.income.grossRevenue) !== null && _b !== void 0 ? _b : 0;
        var playerShare = totalMarket > 0 ? playerRev / totalMarket : 0;
        shares.push({ name: w.company, share: playerShare });
        // estimate competitor revenue from their awareness × strength (rough proxy)
        for (var _i = 0, _c = w.comps; _i < _c.length; _i++) {
            var c = _c[_i];
            var compRev = c.strength * (totalMarket / (w.comps.length + 1));
            shares.push({ name: c.name, share: totalMarket > 0 ? compRev / totalMarket : 0 });
        }
        shares.sort(function (a, b) { return b.share - a.share; });
        var top3 = shares.slice(0, 3);
        var top3Share = (0, industries_1.sum)(top3.map(function (s) { return s.share; }));
        var cover60 = 0, accum = 0;
        for (var _d = 0, shares_1 = shares; _d < shares_1.length; _d++) {
            var s = shares_1[_d];
            accum += s.share;
            cover60++;
            if (accum >= 0.6)
                break;
        }
        var direction = marketGrowth > 0.02 ? "growing" : marketGrowth < -0.02 ? "declining" : "stable";
        return {
            totalMarket: totalMarket,
            marketGrowth: marketGrowth,
            direction: direction,
            competitorCount: competitorCount,
            totalProducts: totalProducts,
            top3: top3.map(function (s) { return ({ name: s.name, share: s.share }); }),
            top3Share: top3Share,
            cover60: cover60,
            summary: "The ".concat(w.cfg.label, " market is ").concat(direction, " (").concat((marketGrowth * 100).toFixed(1), "% vs base). ").concat(competitorCount, " competitors field ").concat(totalProducts, " products total. The top 3 players control ").concat((top3Share * 100).toFixed(0), "% of the market, and it takes ").concat(cover60, " player").concat(cover60 > 1 ? "s" : "", " to cover 60%."),
        };
    }
    return {};
}
