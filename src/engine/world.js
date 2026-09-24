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
exports.normAxis = exports.STUDY_DEFS = void 0;
exports.initWorld = initWorld;
exports.buildSku = buildSku;
var types_1 = require("./types");
var industries_1 = require("./industries");
var economics_1 = require("./economics");
var suppliers_1 = require("./suppliers");
var brands_1 = require("./brands");
var productDesign_1 = require("./productDesign");
var segments_1 = require("./segments");
var chronicle_1 = require("./chronicle");
var growth_1 = require("./growth");
var productCatalog_1 = require("./productCatalog");
var markets_1 = require("./markets");
var productDynamics_1 = require("./productDynamics");
var ip_1 = require("./ip");
var difficulty_1 = require("./difficulty");
exports.STUDY_DEFS = {
    market_map: { label: "Population Map Scan", cost: 60000, ticks: 14, blurb: "Reveals headcount + spend across the whole cube." },
    gap_analysis: { label: "Gap Analysis", cost: 90000, ticks: 18, blurb: "Finds cells with high market but weak brand fit — niches." },
    competitor_benchmark: { label: "Competitor Benchmark", cost: 120000, ticks: 24, blurb: "Rivals' price, personality & margin vs. yours." },
    product_diagnosis: { label: "Post-Launch Product Study", cost: 45000, ticks: 12, blurb: "Diagnoses Product / Price / Channel / Brand / IP fit and explains what is suppressing demand." },
    market_report: { label: "Market Report", cost: 150000, ticks: 30, blurb: "Category growth, competitor count, market concentration (top-3 share, who controls 60%), and directional trends." },
};
function initWorld(industryId, company, brand, difficulty) {
    var _a, _b;
    var _c, _d, _e;
    if (brand === void 0) { brand = null; }
    if (difficulty === void 0) { difficulty = "standard"; }
    var difficultyDef = (0, difficulty_1.difficultyConfig)(difficulty);
    var startCash = difficultyDef.startingCash;
    var cfg = industries_1.INDUSTRIES[industryId];
    var primaryMarket = (0, markets_1.createIndustryMarket)(industryId);
    var cube = primaryMarket.cube;
    var comps = primaryMarket.comps;
    var initialBrand = brand ? (0, brands_1.ensureBrandVisual)(__assign(__assign({}, brand), { id: brand.id || "brand_0", createdTick: 0, industryId: industryId })) : null;
    var world = {
        difficulty: difficulty,
        investorConfidence: 1, expectationStrikes: 0,
        industryId: industryId,
        cfg: cfg,
        tick: 0,
        company: company,
        brands: initialBrand ? [initialBrand] : [], primaryBrandId: (_c = initialBrand === null || initialBrand === void 0 ? void 0 : initialBrand.id) !== null && _c !== void 0 ? _c : "",
        cube: cube,
        comps: comps,
        player: {
            skus: [], contracts: [], marketing: 0, marketingTarget: 0, marketingFocus: "all",
            brandMarketing: 0, brandMarketingTarget: 0,
            backOffice: 0, backOfficeTarget: 0, cash: startCash, debt: 0, lostSales: 0, receivables: [],
            financeDept: 0, intelDept: 0,
            personnel: [], formerPersonnel: [], talentMarket: [], talentMarketRefreshTick: 0, talentSearch: null, trainingPrograms: [],
            expertise: { industry: {}, category: {} },
            vision: null,
            operatingRooms: [],
            campusPaths: [{ x: 2, y: 44 }, { x: 3, y: 44 }],
            unlockedCategories: __spreadArray([], ((_d = growth_1.STARTER_CATEGORIES[industryId]) !== null && _d !== void 0 ? _d : cfg.products.slice(0, 2).map(function (p) { return p.key; })), true),
            categoryExpansionProjects: [],
            businesses: (_a = {},
                _a[industryId] = {
                    industryId: industryId,
                    status: "active", enteredTick: 0,
                    unlockedCategories: __spreadArray([], ((_e = growth_1.STARTER_CATEGORIES[industryId]) !== null && _e !== void 0 ? _e : cfg.products.slice(0, 2).map(function (p) { return p.key; })), true),
                    categoryExpansionProjects: [], capabilities: {},
                },
                _a),
            industryEntryProjects: [],
            corporateCapabilities: { finance: 0, strategy: 0, marketing: 0, operations: 0, retail: 0, people: 0 },
            research: { completed: [], active: null, lifetimePoints: 0 },
        },
        studies: [], revealed: {}, history: [], events: [],
        chronicle: (0, chronicle_1.createChronicle)(company, cfg.label, startCash),
        ipAssets: (0, ip_1.seedExternalIPs)(), ipLicenses: [],
        pendingShockTick: 80 + Math.floor(Math.random() * 80), shock: null,
        live: null, selectedCell: null, selectedInfo: null,
        fitCache: {}, fitCacheDirty: true,
        savedSegments: (0, segments_1.presetSegments)(),
        brandEquity: primaryMarket.brandEquity,
        customers: primaryMarket.customers,
        activeCampaigns: [],
        agencyRelationships: {},
        materialPriceIndex: (0, productCatalog_1.defaultMaterialPriceIndex)(),
        industryMarkets: (_b = {}, _b[industryId] = primaryMarket, _b),
        unitsTickHistory: primaryMarket.unitsTickHistory, marketTickHistory: primaryMarket.marketTickHistory,
    };
    return world;
}
function buildSku(w, spec, id, tick, expertise) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    if (tick === void 0) { tick = 0; }
    if (expertise === void 0) { expertise = 0; }
    var archetype = (0, productCatalog_1.archetypeByKey)(spec.productKey);
    var cfg = (_b = industries_1.INDUSTRIES[(_a = archetype === null || archetype === void 0 ? void 0 : archetype.industryId) !== null && _a !== void 0 ? _a : w.industryId]) !== null && _b !== void 0 ? _b : w.cfg;
    var pt = cfg.products.find(function (p) { return p.key === spec.productKey; });
    var mfg = (0, productDesign_1.manufacturingStandard)(spec.manufacturingStars);
    // Design does not commit manufacturing. Keep supplier null until the player chooses a
    // compatible partner in the manufacturing stage; this also prevents cross-industry defaults.
    var supplierId = spec.method === "outsource" ? ((_c = spec.supplierId) !== null && _c !== void 0 ? _c : null) : null;
    var supplier = spec.method === "outsource" && supplierId ? (0, suppliers_1.supplierById)(supplierId) : null;
    var unitCost = (0, economics_1.deriveUnitCost)(pt, spec.method, mfg.materialQuality, mfg.productionQuality, (_d = supplier === null || supplier === void 0 ? void 0 : supplier.costMult) !== null && _d !== void 0 ? _d : 1, w.materialPriceIndex);
    var quality = (0, economics_1.deriveQuality)(mfg.materialQuality, mfg.productionQuality, (_e = supplier === null || supplier === void 0 ? void 0 : supplier.qualityAdj) !== null && _e !== void 0 ? _e : 0);
    var projectTier = (_f = spec.projectTier) !== null && _f !== void 0 ? _f : (spec.designDepth === "breakthrough" ? "AAA" : spec.designDepth === "advanced" ? "AA" : "A");
    var tierDef = types_1.PRODUCT_PROJECT_TIERS[projectTier];
    var depth = (_g = spec.designDepth) !== null && _g !== void 0 ? _g : (projectTier === "AAA" ? "breakthrough" : projectTier === "AA" ? "advanced" : "standard");
    var depthDef = types_1.DESIGN_DEPTHS[depth];
    var faceted = (0, productDynamics_1.applyFacetSelections)(spec.productKey, spec.target, spec.attributes, spec.designFacets);
    var attrSpread = Object.values(faceted.attributes).length > 0
        ? Math.max.apply(Math, Object.values(faceted.attributes)) - Math.min.apply(Math, Object.values(faceted.attributes))
        : 0;
    var designQuality = (0, industries_1.clamp)(Math.min(tierDef.designQualityCap, (0.2 + attrSpread * 0.3 + ((_h = spec.pmSkill) !== null && _h !== void 0 ? _h : 0.2) * 0.3 + expertise * 0.04) * depthDef.qualityMult), 0, 1);
    var testingLevel = (_j = spec.testingLevel) !== null && _j !== void 0 ? _j : "standard";
    var testDef = productDynamics_1.TESTING_LEVELS[testingLevel];
    var safetyScore = (0, productDynamics_1.deriveSafetyScore)(spec.productKey, testingLevel, designQuality, quality);
    var rarityScore = quality * 0.3 + designQuality * 0.4 + expertise * 0.06;
    return {
        id: id,
        name: spec.name, productKey: spec.productKey, brandId: spec.brandId, industryId: cfg.id, method: spec.method,
        supplierId: supplierId,
        target: faceted.target,
        targetLabel: spec.targetLabel,
        designFacets: (_k = spec.designFacets) !== null && _k !== void 0 ? _k : {},
        testingLevel: testingLevel,
        safetyScore: safetyScore,
        recallCount: 0, marketMomentum: 1, peakMomentum: 1, breakout: false,
        positioning: spec.positioning,
        manufacturingStars: Math.max(1, Math.min(5, Math.round(spec.manufacturingStars))),
        // lifecycle: starts in "designing" state, no inventory, PM locked
        status: "designing",
        assignedPmId: (_l = spec.pmId) !== null && _l !== void 0 ? _l : null,
        assignedPmName: spec.pmName,
        leadHistory: spec.pmId && spec.pmName ? [{ personId: spec.pmId, personName: spec.pmName, fromTick: tick }] : [],
        designDepth: depth,
        projectTier: projectTier,
        assignedDesignerIds: __spreadArray([], ((_m = spec.designerIds) !== null && _m !== void 0 ? _m : []), true),
        designDaysLeft: Math.ceil(tierDef.baseDays * testDef.timeMult),
        mfgDaysLeft: 0,
        mfgBatchSize: 0,
        // quality
        quality: quality,
        designQuality: designQuality,
        perceivedQuality: quality,
        novelty: 1.0, fame: 0, rarity: (0, types_1.computeProductRarity)(rarityScore),
        lifetimeDays: pt.lifetimeDays, launchTick: 0, releasedToMarket: false, version: (_o = spec.version) !== null && _o !== void 0 ? _o : 1, parentSkuId: (_p = spec.parentSkuId) !== null && _p !== void 0 ? _p : null,
        // economics: zero inventory until manufactured
        unitCost: unitCost * testDef.costMult, listPrice: spec.listPrice, priceSens: 1.0, inventory: 0, inventoryLots: [],
        // Digital readiness is now a hidden execution outcome rather than a player slider.
        online: depth === "breakthrough" ? 0.9 : depth === "advanced" ? 0.78 : depth === "standard" ? 0.65 : 0.5,
        unitsSoldTotal: 0, unitsLostTotal: 0, contributionTotal: 0,
        attributes: faceted.attributes, packaging: (_q = spec.packaging) !== null && _q !== void 0 ? _q : "standard",
        channels: (_r = spec.channels) !== null && _r !== void 0 ? _r : [], assignedPartnerIds: [], ipId: (_s = spec.ipId) !== null && _s !== void 0 ? _s : null, license: null,
    };
}
var normAxis = function (axis, val) { return (0, industries_1.axisPos)(axis, industries_1.AXES[axis].indexOf(val)); };
exports.normAxis = normAxis;
