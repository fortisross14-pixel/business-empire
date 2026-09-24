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
exports.AUTOSAVE_KEY = exports.SAVE_SCHEMA_VERSION = void 0;
exports.saveWorld = saveWorld;
exports.hasAutosave = hasAutosave;
exports.clearAutosave = clearAutosave;
exports.loadWorld = loadWorld;
var industries_1 = require("./industries");
var infrastructure_1 = require("./infrastructure");
var productDesign_1 = require("./productDesign");
var suppliers_1 = require("./suppliers");
var distribution_1 = require("./distribution");
var people_1 = require("./people");
var chronicle_1 = require("./chronicle");
var businesses_1 = require("./businesses");
var growth_1 = require("./growth");
var productCatalog_1 = require("./productCatalog");
var markets_1 = require("./markets");
var productDynamics_1 = require("./productDynamics");
var ip_1 = require("./ip");
var types_1 = require("./types");
var brands_1 = require("./brands");
exports.SAVE_SCHEMA_VERSION = 18;
exports.AUTOSAVE_KEY = "market-sim:autosave";
function saveWorld(world) {
    if (typeof localStorage === "undefined")
        return;
    var payload = { version: exports.SAVE_SCHEMA_VERSION, savedAt: Date.now(), world: world };
    localStorage.setItem(exports.AUTOSAVE_KEY, JSON.stringify(payload));
}
function hasAutosave() {
    if (typeof localStorage === "undefined")
        return false;
    return Boolean(localStorage.getItem(exports.AUTOSAVE_KEY));
}
function clearAutosave() {
    if (typeof localStorage === "undefined")
        return;
    localStorage.removeItem(exports.AUTOSAVE_KEY);
}
function migrateWorld(rawWorld, version) {
    var _a, _b;
    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91, _92, _93, _94, _95, _96, _97, _98, _99, _100, _101, _102;
    if (!rawWorld || typeof rawWorld !== "object")
        return null;
    var world = rawWorld;
    var cfg = industries_1.INDUSTRIES[world.industryId];
    if (!cfg)
        return null;
    world.cfg = cfg;
    // v1 -> v2: the player-facing product model changed from continuous sliders
    // to positioning / target / 1–5 star manufacturing decisions. Existing products
    // retain their actual simulation values and receive sensible display metadata.
    if (version <= 1) {
        for (var _i = 0, _103 = (_c = world.player.skus) !== null && _c !== void 0 ? _c : []; _i < _103.length; _i++) {
            var sku = _103[_i];
            var legacyDepth = sku.designDepth;
            if (legacyDepth === "normal")
                sku.designDepth = "standard";
            else if (legacyDepth === "detailed")
                sku.designDepth = "advanced";
            else if (legacyDepth !== "quick" && legacyDepth !== "standard" && legacyDepth !== "advanced" && legacyDepth !== "breakthrough")
                sku.designDepth = "standard";
            sku.manufacturingStars = (_d = sku.manufacturingStars) !== null && _d !== void 0 ? _d : (0, productDesign_1.qualityToStars)(sku.quality);
            sku.positioning = (_e = sku.positioning) !== null && _e !== void 0 ? _e : "mainstream";
            sku.targetLabel = (_f = sku.targetLabel) !== null && _f !== void 0 ? _f : "Legacy target";
        }
    }
    // v2 -> v3: complete operating loop. Outsourced SKUs get an explicit supplier,
    // stock-out history is tracked per SKU, campaigns gain real scope, and channels are
    // derived from concrete partner assignments instead of being independently editable.
    if (version <= 2) {
        var _loop_1 = function (sku) {
            // Manufacturer selection is now a post-design decision. Legacy saves with no
            // explicit supplier stay unassigned instead of inheriting a skincare-only default.
            sku.supplierId = sku.method === "outsource" ? ((_h = sku.supplierId) !== null && _h !== void 0 ? _h : null) : null;
            sku.unitsLostTotal = (_j = sku.unitsLostTotal) !== null && _j !== void 0 ? _j : 0;
            // Old saves stored only channel types. Preserve their routes to market by mapping
            // those channels onto any already-signed concrete partners before channels become derived.
            if (!((_k = sku.assignedPartnerIds) === null || _k === void 0 ? void 0 : _k.length) && ((_l = sku.channels) === null || _l === void 0 ? void 0 : _l.length)) {
                sku.assignedPartnerIds = ((_m = world.player.contracts) !== null && _m !== void 0 ? _m : [])
                    .filter(function (c) { return sku.channels.includes(c.type); })
                    .map(function (c) { return c.partnerId; });
            }
            else {
                sku.assignedPartnerIds = (_o = sku.assignedPartnerIds) !== null && _o !== void 0 ? _o : [];
            }
        };
        for (var _104 = 0, _105 = (_g = world.player.skus) !== null && _g !== void 0 ? _g : []; _104 < _105.length; _104++) {
            var sku = _105[_104];
            _loop_1(sku);
        }
        for (var _106 = 0, _107 = (_p = world.activeCampaigns) !== null && _p !== void 0 ? _p : []; _106 < _107.length; _106++) {
            var camp = _107[_106];
            camp.scope = (_q = camp.scope) !== null && _q !== void 0 ? _q : "company";
        }
    }
    // v3 -> v4: named people gain careers, attributes and a persistent talent market.
    // Existing staff are enriched in place so old companies keep the same employees.
    if (version <= 3) {
        world.player.personnel = ((_r = world.player.personnel) !== null && _r !== void 0 ? _r : []).map(function (p) { return (0, people_1.enrichLegacyPerson)(p, world.tick, cfg); });
        world.player.formerPersonnel = (_s = world.player.formerPersonnel) !== null && _s !== void 0 ? _s : [];
        world.player.talentMarket = (_t = world.player.talentMarket) !== null && _t !== void 0 ? _t : [];
        world.player.talentMarketRefreshTick = (_u = world.player.talentMarketRefreshTick) !== null && _u !== void 0 ? _u : world.tick;
        var _loop_2 = function (sku) {
            if (!sku.assignedPmName && sku.assignedPmId)
                sku.assignedPmName = (_w = world.player.personnel.find(function (p) { return p.id === sku.assignedPmId; })) === null || _w === void 0 ? void 0 : _w.name;
            sku.leadHistory = (_x = sku.leadHistory) !== null && _x !== void 0 ? _x : (sku.assignedPmId && sku.assignedPmName ? [{ personId: sku.assignedPmId, personName: sku.assignedPmName, fromTick: 0 }] : []);
        };
        for (var _108 = 0, _109 = (_v = world.player.skus) !== null && _v !== void 0 ? _v : []; _108 < _109.length; _108++) {
            var sku = _109[_108];
            _loop_2(sku);
        }
    }
    else {
        world.player.personnel = ((_y = world.player.personnel) !== null && _y !== void 0 ? _y : []).map(function (p) { return (0, people_1.enrichLegacyPerson)(p, world.tick, cfg); });
        world.player.formerPersonnel = (_z = world.player.formerPersonnel) !== null && _z !== void 0 ? _z : [];
        world.player.talentMarket = (_0 = world.player.talentMarket) !== null && _0 !== void 0 ? _0 : [];
        world.player.talentMarketRefreshTick = (_1 = world.player.talentMarketRefreshTick) !== null && _1 !== void 0 ? _1 : world.tick;
    }
    // v4 -> v5: permanent Company Chronicle. Reconstruct product launches and careers from
    // data already present in old saves; new events are tracked exactly from this point onward.
    if (version <= 4 || !world.chronicle)
        world.chronicle = (0, chronicle_1.migrateChronicleFromLegacy)(world);
    else
        (0, chronicle_1.ensureChronicle)(world);
    // v5 -> v6: real multi-brand portfolios + category expansion. Legacy saves had one
    // top-level brand and company-wide category equity; wrap both into the initial brand so
    // existing products retain their identity and earned reputation.
    if (version <= 5) {
        var legacy = (_2 = world.brand) !== null && _2 !== void 0 ? _2 : { name: world.company, color: "#7c3aed", positioning: "mass" };
        var initialBrand = { id: "brand_0", name: legacy.name || world.company, color: legacy.color || "#7c3aed", positioning: legacy.positioning || "mass", createdTick: 0, industryId: world.industryId };
        world.brands = [initialBrand];
        world.primaryBrandId = initialBrand.id;
        for (var _110 = 0, _111 = (_3 = world.player.skus) !== null && _3 !== void 0 ? _3 : []; _110 < _111.length; _110++) {
            var sku = _111[_110];
            sku.brandId = (_4 = sku.brandId) !== null && _4 !== void 0 ? _4 : initialBrand.id;
        }
        var legacyEquity = (_5 = world.brandEquity) !== null && _5 !== void 0 ? _5 : {};
        var looksNestedByBrand = Boolean(legacyEquity[initialBrand.id]) || Object.keys(legacyEquity).some(function (k) { return k.startsWith("brand_"); });
        if (!looksNestedByBrand)
            world.brandEquity = (_a = {}, _a[initialBrand.id] = legacyEquity, _a);
        for (var _112 = 0, _113 = (_6 = world.activeCampaigns) !== null && _6 !== void 0 ? _6 : []; _112 < _113.length; _112++) {
            var camp = _113[_112];
            if (camp.scope === "brand")
                camp.scope = "brand:".concat(initialBrand.id);
        }
        delete world.brand;
    }
    world.primaryBrandId = (_9 = (_7 = world.primaryBrandId) !== null && _7 !== void 0 ? _7 : (_8 = world.brands[0]) === null || _8 === void 0 ? void 0 : _8.id) !== null && _9 !== void 0 ? _9 : "brand_0";
    world.brandEquity = (_10 = world.brandEquity) !== null && _10 !== void 0 ? _10 : {};
    for (var _114 = 0, _115 = world.brands; _114 < _115.length; _114++) {
        var brand = _115[_114];
        brand.createdTick = (_11 = brand.createdTick) !== null && _11 !== void 0 ? _11 : 0;
        brand.industryId = (_12 = brand.industryId) !== null && _12 !== void 0 ? _12 : world.industryId;
        (0, brands_1.ensureBrandVisual)(brand);
        world.brandEquity[brand.id] = (_13 = world.brandEquity[brand.id]) !== null && _13 !== void 0 ? _13 : {};
    }
    for (var _116 = 0, _117 = (_14 = world.player.skus) !== null && _14 !== void 0 ? _14 : []; _116 < _117.length; _116++) {
        var sku = _117[_116];
        sku.brandId = (_15 = sku.brandId) !== null && _15 !== void 0 ? _15 : world.primaryBrandId;
        sku.industryId = (_16 = sku.industryId) !== null && _16 !== void 0 ? _16 : world.industryId;
    }
    // Defensive compatibility cleanup for every save version: older builds could silently
    // attach the skincare default supplier to toy SKUs. Leave those products unassigned so
    // the player can choose a compatible manufacturer in the Manufacture stage.
    for (var _118 = 0, _119 = (_17 = world.player.skus) !== null && _17 !== void 0 ? _17 : []; _118 < _119.length; _118++) {
        var sku = _119[_118];
        if (sku.method !== "outsource") {
            sku.supplierId = null;
            continue;
        }
        if (!sku.supplierId)
            continue;
        var supplier = (0, suppliers_1.supplierById)(sku.supplierId);
        if (!(0, suppliers_1.supplierSupportsProduct)(supplier, sku.productKey))
            sku.supplierId = null;
    }
    if (!((_18 = world.player.unlockedCategories) === null || _18 === void 0 ? void 0 : _18.length)) {
        var legacyAccess = world.cfg.id === "skincare"
            ? ["moisturizer", "serum", "cleanser", "antiaging", "hydration"]
            : world.cfg.products.map(function (p) { return p.key; });
        world.player.unlockedCategories = Array.from(new Set(__spreadArray(__spreadArray([], legacyAccess, true), ((_19 = world.player.skus) !== null && _19 !== void 0 ? _19 : []).map(function (s) { return s.productKey; }), true)));
    }
    world.player.categoryExpansionProjects = (_20 = world.player.categoryExpansionProjects) !== null && _20 !== void 0 ? _20 : [];
    world.player.trainingPrograms = (_21 = world.player.trainingPrograms) !== null && _21 !== void 0 ? _21 : [];
    // v6 -> v7: multi-industry foundation. The existing industry becomes the first
    // active business; category state is wrapped per industry while legacy aliases remain
    // available to the v0.80 single-industry simulation during this foundation batch.
    if (version <= 6 || !world.player.businesses) {
        world.player.businesses = (_b = {},
            _b[world.industryId] = {
                industryId: world.industryId, status: "active", enteredTick: 0,
                unlockedCategories: __spreadArray([], world.player.unlockedCategories, true),
                categoryExpansionProjects: __spreadArray([], world.player.categoryExpansionProjects, true),
                capabilities: {},
            },
            _b);
    }
    world.player.industryEntryProjects = (_22 = world.player.industryEntryProjects) !== null && _22 !== void 0 ? _22 : [];
    world.player.corporateCapabilities = (_23 = world.player.corporateCapabilities) !== null && _23 !== void 0 ? _23 : { finance: 0, strategy: 0, marketing: 0, operations: 0, retail: 0, people: 0 };
    for (var _120 = 0, _121 = Object.entries(world.player.businesses); _120 < _121.length; _120++) {
        var _122 = _121[_120], industryId = _122[0], business = _122[1];
        if (!business)
            continue;
        business.industryId = industryId;
        business.status = (_24 = business.status) !== null && _24 !== void 0 ? _24 : "active";
        business.enteredTick = (_25 = business.enteredTick) !== null && _25 !== void 0 ? _25 : 0;
        business.unlockedCategories = ((_26 = business.unlockedCategories) === null || _26 === void 0 ? void 0 : _26.length) ? business.unlockedCategories : __spreadArray([], ((_29 = (_27 = growth_1.STARTER_CATEGORIES[industryId]) !== null && _27 !== void 0 ? _27 : (_28 = industries_1.INDUSTRIES[industryId]) === null || _28 === void 0 ? void 0 : _28.products.slice(0, 2).map(function (p) { return p.key; })) !== null && _29 !== void 0 ? _29 : []), true);
        business.categoryExpansionProjects = (_30 = business.categoryExpansionProjects) !== null && _30 !== void 0 ? _30 : [];
        business.capabilities = (_31 = business.capabilities) !== null && _31 !== void 0 ? _31 : {};
    }
    (0, businesses_1.syncPrimaryBusinessLegacy)(world);
    (0, businesses_1.refreshCorporateCapabilities)(world);
    // v7 -> v8: data-driven Product Engine. Material markets are now a world-level input shared
    // by every product archetype. Existing products retain their booked unit cost; future batches
    // recalculate through the registry whenever manufacturing setup/quality is changed.
    var baselineMaterials = (0, productCatalog_1.defaultMaterialPriceIndex)();
    world.materialPriceIndex = __assign(__assign({}, baselineMaterials), ((_32 = world.materialPriceIndex) !== null && _32 !== void 0 ? _32 : {}));
    for (var _123 = 0, _124 = (_33 = world.player.operatingRooms) !== null && _33 !== void 0 ? _33 : []; _123 < _124.length; _123++) {
        var room = _124[_123];
        room.upgradeLevel = (_34 = room.upgradeLevel) !== null && _34 !== void 0 ? _34 : 1;
        if (room.kind === "factory" && !((_35 = room.manufacturingFamilies) === null || _35 === void 0 ? void 0 : _35.length))
            room.manufacturingFamilies = (0, productCatalog_1.defaultFactoryFamiliesForIndustry)(world.industryId);
        if (room.kind === "warehouse" && !((_36 = room.storageProfiles) === null || _36 === void 0 ? void 0 : _36.length))
            room.storageProfiles = ["standard"];
    }
    // v8 -> v9: generic multi-industry market runtimes + universal lifecycle modules.
    // Existing primary market arrays become the primary runtime by reference; any already-active
    // secondary business gets a clean market runtime. Inventory becomes FIFO lots for ageing.
    if (version <= 8 || !world.industryMarkets) {
        world.industryMarkets = (_37 = world.industryMarkets) !== null && _37 !== void 0 ? _37 : {};
        world.industryMarkets[world.industryId] = {
            industryId: world.industryId, cube: world.cube, comps: world.comps, customers: (_38 = world.customers) !== null && _38 !== void 0 ? _38 : {},
            brandEquity: (_39 = world.brandEquity) !== null && _39 !== void 0 ? _39 : {}, fitCache: (_40 = world.fitCache) !== null && _40 !== void 0 ? _40 : {}, fitCacheDirty: true,
            unitsTickHistory: (_41 = world.unitsTickHistory) !== null && _41 !== void 0 ? _41 : [], marketTickHistory: (_42 = world.marketTickHistory) !== null && _42 !== void 0 ? _42 : [],
        };
    }
    for (var _125 = 0, _126 = Object.entries((_43 = world.player.businesses) !== null && _43 !== void 0 ? _43 : {}); _125 < _126.length; _125++) {
        var _127 = _126[_125], industryId = _127[0], business = _127[1];
        if ((business === null || business === void 0 ? void 0 : business.status) === "active")
            (0, markets_1.ensureIndustryMarket)(world, industryId);
    }
    (0, markets_1.bindPrimaryMarketAliases)(world);
    for (var _128 = 0, _129 = (_44 = world.player.skus) !== null && _44 !== void 0 ? _44 : []; _128 < _129.length; _128++) {
        var sku = _129[_128];
        sku.testingLevel = (_45 = sku.testingLevel) !== null && _45 !== void 0 ? _45 : "standard";
        sku.marketMomentum = (_46 = sku.marketMomentum) !== null && _46 !== void 0 ? _46 : 1;
        sku.peakMomentum = (_47 = sku.peakMomentum) !== null && _47 !== void 0 ? _47 : sku.marketMomentum;
        sku.breakout = (_48 = sku.breakout) !== null && _48 !== void 0 ? _48 : false;
        sku.recallCount = (_49 = sku.recallCount) !== null && _49 !== void 0 ? _49 : 0;
        sku.designFacets = (_50 = sku.designFacets) !== null && _50 !== void 0 ? _50 : {};
        sku.safetyScore = (_51 = sku.safetyScore) !== null && _51 !== void 0 ? _51 : (0, productDynamics_1.deriveSafetyScore)(sku.productKey, sku.testingLevel, sku.designQuality, sku.quality);
        (0, productDynamics_1.ensureInventoryLots)(sku, world.tick);
    }
    // v9 -> v10: universal IP is now a first-class world entity. Old fixed license keys are
    // mapped into the new external IP catalog and grandfathered into a 3-year contract so a
    // v0.96 company never silently loses a licensed product when it is loaded in 8C.
    (0, ip_1.ensureIPFoundation)(world);
    var _loop_3 = function (sku) {
        var legacyLicense = sku.license;
        sku.ipId = (_54 = (_53 = sku.ipId) !== null && _53 !== void 0 ? _53 : legacyLicense) !== null && _54 !== void 0 ? _54 : null;
        if (legacyLicense && !world.ipLicenses.some(function (c) { return c.ipId === legacyLicense && c.status === "active" && c.expiresTick > world.tick; })) {
            var ip = world.ipAssets.find(function (asset) { return asset.id === legacyLicense; });
            if ((ip === null || ip === void 0 ? void 0 : ip.ownerType) === "external") {
                world.ipLicenses.push({
                    id: "legacy_iplic_".concat(legacyLicense, "_").concat(world.tick), ipId: legacyLicense, licensorName: ip.ownerName,
                    signedTick: world.tick, expiresTick: world.tick + 3 * types_1.TICKS_PER_YEAR, durationYears: 3,
                    royaltyRate: (_56 = (_55 = ip.marketTerms) === null || _55 === void 0 ? void 0 : _55.royaltyRate) !== null && _56 !== void 0 ? _56 : .06, minimumGuarantee: 0, status: "active", royaltiesPaid: 0,
                });
            }
        }
        sku.license = null;
    };
    for (var _130 = 0, _131 = (_52 = world.player.skus) !== null && _52 !== void 0 ? _52 : []; _130 < _131.length; _130++) {
        var sku = _131[_130];
        _loop_3(sku);
    }
    for (var _132 = 0, _133 = Object.values((_57 = world.industryMarkets) !== null && _57 !== void 0 ? _57 : {}); _132 < _133.length; _132++) {
        var market = _133[_132];
        if (market)
            market.fitCacheDirty = true;
    }
    // v10 -> v11: Batch 9 difficulty and expectation state. Existing companies migrate to Standard
    // so their market economics do not change unexpectedly beyond the new universal fit model.
    world.difficulty = (_58 = world.difficulty) !== null && _58 !== void 0 ? _58 : "standard";
    world.investorConfidence = (_59 = world.investorConfidence) !== null && _59 !== void 0 ? _59 : 1;
    world.expectationStrikes = (_60 = world.expectationStrikes) !== null && _60 !== void 0 ? _60 : 0;
    // v11 -> v12: campus-first gameplay, agency recruiting and explicit commercial launch.
    // Existing active products remain live; new products can hold finished inventory before release.
    world.player.talentSearch = (_61 = world.player.talentSearch) !== null && _61 !== void 0 ? _61 : null;
    var founder = (_62 = world.player.operatingRooms) === null || _62 === void 0 ? void 0 : _62.find(function (r) { return r.id === "founder-office"; });
    if (version <= 11 && founder) {
        founder.team = "product";
        founder.capacity = Math.max(1, (_64 = (_63 = founder.assignedPersonnelIds) === null || _63 === void 0 ? void 0 : _63.length) !== null && _64 !== void 0 ? _64 : 0);
    }
    for (var _134 = 0, _135 = (_65 = world.player.skus) !== null && _65 !== void 0 ? _65 : []; _134 < _135.length; _134++) {
        var sku = _135[_134];
        sku.releasedToMarket = (_66 = sku.releasedToMarket) !== null && _66 !== void 0 ? _66 : (sku.status === "active");
        sku.version = (_67 = sku.version) !== null && _67 !== void 0 ? _67 : 1;
        sku.parentSkuId = (_68 = sku.parentSkuId) !== null && _68 !== void 0 ? _68 : null;
    }
    // v13 -> v14: Empty Lot foundation. New companies start with only the campus entrance,
    // while existing companies receive a connected legacy access road so their current campus
    // remains usable. Founder offices become 4-seat flexible startup offices (Founder + 3 staff).
    if (!((_69 = world.player.campusPaths) === null || _69 === void 0 ? void 0 : _69.length)) {
        var paths_1 = [];
        var add = function (x, y) { if (!paths_1.some(function (p) { return p.x === x && p.y === y; }))
            paths_1.push({ x: x, y: y }); };
        add(2, 44);
        add(3, 44);
        if (((_70 = world.player.operatingRooms) !== null && _70 !== void 0 ? _70 : []).length) {
            for (var x = 4; x <= 17; x++)
                add(x, 44);
            for (var y = 29; y <= 44; y++)
                add(17, y);
            for (var x = 0; x < 48; x++) {
                add(x, 29);
                add(x, 30);
            }
            for (var y = 0; y < 48; y++) {
                add(17, y);
                add(18, y);
            }
        }
        world.player.campusPaths = paths_1;
    }
    if (founder) {
        founder.capacity = Math.max(4, (_71 = founder.capacity) !== null && _71 !== void 0 ? _71 : 4);
        if (version >= 14)
            founder.team = (_72 = founder.team) !== null && _72 !== void 0 ? _72 : "unassigned";
    }
    // v14 -> v15: Product team scale + office growth. Existing products infer a project class
    // from their former development depth. Existing office levels are normalized to the new
    // 4 -> 8 -> 16 -> 32 -> +8/floor progression without shrinking any legacy capacity.
    for (var _136 = 0, _137 = (_73 = world.player.skus) !== null && _73 !== void 0 ? _73 : []; _136 < _137.length; _136++) {
        var sku = _137[_136];
        sku.projectTier = (_74 = sku.projectTier) !== null && _74 !== void 0 ? _74 : (sku.designDepth === "breakthrough" ? "AAA" : sku.designDepth === "advanced" ? "AA" : "A");
        sku.assignedDesignerIds = (_75 = sku.assignedDesignerIds) !== null && _75 !== void 0 ? _75 : [];
    }
    for (var _138 = 0, _139 = (_76 = world.player.operatingRooms) !== null && _76 !== void 0 ? _76 : []; _138 < _139.length; _138++) {
        var room = _139[_138];
        if (room.kind === "office") {
            room.upgradeLevel = Math.max(1, (_77 = room.upgradeLevel) !== null && _77 !== void 0 ? _77 : 1);
            room.capacity = Math.max((_78 = room.capacity) !== null && _78 !== void 0 ? _78 : 4, (0, infrastructure_1.officeStageForLevel)(room.upgradeLevel).capacity);
        }
    }
    // v15 -> v16: Company Development / Research capability tree. Existing companies are
    // grandfathered only into the capabilities their current assets already prove they possess.
    if (!world.player.research)
        world.player.research = { completed: [], active: null, lifetimePoints: 0 };
    world.player.research.completed = (_79 = world.player.research.completed) !== null && _79 !== void 0 ? _79 : [];
    world.player.research.active = (_80 = world.player.research.active) !== null && _80 !== void 0 ? _80 : null;
    world.player.research.lifetimePoints = (_81 = world.player.research.lifetimePoints) !== null && _81 !== void 0 ? _81 : 0;
    var grant = function (id) { if (!world.player.research.completed.includes(id))
        world.player.research.completed.push(id); };
    if (version <= 15) {
        if (((_82 = world.player.skus) !== null && _82 !== void 0 ? _82 : []).some(function (sku) { return sku.projectTier === "AA" || sku.projectTier === "AAA"; }))
            grant("advanced_product_development");
        if (((_83 = world.player.skus) !== null && _83 !== void 0 ? _83 : []).some(function (sku) { return sku.projectTier === "AAA"; })) {
            grant("organizational_scaling");
            grant("flagship_product_development");
        }
        var maxOffice = Math.max.apply(Math, __spreadArray([0], ((_84 = world.player.operatingRooms) !== null && _84 !== void 0 ? _84 : []).filter(function (r) { return r.kind === "office"; }).map(function (r) { return r.capacity; }), false));
        if (maxOffice >= 16)
            grant("organizational_scaling");
        if (maxOffice >= 32) {
            grant("organizational_scaling");
            grant("corporate_hq");
        }
        if (((_85 = world.player.operatingRooms) !== null && _85 !== void 0 ? _85 : []).some(function (r) { var _a; return r.kind === "office" && ((_a = r.upgradeLevel) !== null && _a !== void 0 ? _a : 1) >= 5; }))
            grant("vertical_expansion");
        if (((_86 = world.player.operatingRooms) !== null && _86 !== void 0 ? _86 : []).some(function (r) { return r.kind === "outsourcing"; }))
            grant("supplier_management");
        if (((_87 = world.player.operatingRooms) !== null && _87 !== void 0 ? _87 : []).some(function (r) { return r.kind === "factory"; })) {
            grant("supplier_management");
            grant("owned_manufacturing");
        }
        if ((((_88 = world.player.talentSearch) === null || _88 === void 0 ? void 0 : _88.mode) === "online") || ((_90 = (_89 = world.player.talentMarket) === null || _89 === void 0 ? void 0 : _89.length) !== null && _90 !== void 0 ? _90 : 0) >= 4)
            grant("professional_recruiting");
        if ((((_91 = world.player.talentSearch) === null || _91 === void 0 ? void 0 : _91.mode) === "deep") || ((_93 = (_92 = world.player.talentMarket) === null || _92 === void 0 ? void 0 : _92.length) !== null && _93 !== void 0 ? _93 : 0) >= 5) {
            grant("professional_recruiting");
            grant("executive_search");
        }
        if (((_94 = world.player.intelDept) !== null && _94 !== void 0 ? _94 : 0) > 0)
            grant("market_intelligence");
    }
    // v16 -> v17: capability gatekeeping audit. Existing companies keep proven
    // specialist infrastructure; future research now requires a seated CIO and other
    // advanced actions require the corresponding people + technology gates.
    if (version <= 16) {
        var hasSpecialStorage = ((_95 = world.player.operatingRooms) !== null && _95 !== void 0 ? _95 : []).some(function (r) { var _a; return r.kind === "warehouse" && ((_a = r.storageProfiles) !== null && _a !== void 0 ? _a : ["standard"]).some(function (p) { return p !== "standard"; }); });
        if (hasSpecialStorage)
            grant("specialized_storage");
    }
    // v17 -> v18: campus specialization and employee training. Existing rooms keep their legacy behavior
    // and receive a facilityType lazily; new saves can build dedicated design, research and people facilities.
    if (version <= 17) {
        world.player.trainingPrograms = (_96 = world.player.trainingPrograms) !== null && _96 !== void 0 ? _96 : [];
        for (var _140 = 0, _141 = (_97 = world.player.operatingRooms) !== null && _97 !== void 0 ? _97 : []; _140 < _141.length; _140++) {
            var room = _141[_140];
            room.facilityType = (_98 = room.facilityType) !== null && _98 !== void 0 ? _98 : room.kind;
        }
    }
    var _loop_4 = function (sku) {
        if (!sku.assignedPmName && sku.assignedPmId)
            sku.assignedPmName = (_100 = world.player.personnel.find(function (p) { return p.id === sku.assignedPmId; })) === null || _100 === void 0 ? void 0 : _100.name;
        sku.leadHistory = (_101 = sku.leadHistory) !== null && _101 !== void 0 ? _101 : (sku.assignedPmId && sku.assignedPmName ? [{ personId: sku.assignedPmId, personName: sku.assignedPmName, fromTick: 0 }] : []);
        (0, distribution_1.deriveSkuChannels)(world, sku);
    };
    // Keep product-lead lineage even after transfers, departures and save migrations.
    for (var _142 = 0, _143 = (_99 = world.player.skus) !== null && _99 !== void 0 ? _99 : []; _142 < _143.length; _142++) {
        var sku = _143[_142];
        _loop_4(sku);
    }
    world.player.backOffice = 0;
    world.player.backOfficeTarget = 0;
    world.player.operatingRooms = (0, infrastructure_1.sanitizeOperatingRooms)(world, (_102 = world.player.operatingRooms) !== null && _102 !== void 0 ? _102 : []);
    (0, infrastructure_1.syncDerivedDepartments)(world);
    world.fitCacheDirty = true;
    return world;
}
function loadWorld() {
    var _a;
    if (typeof localStorage === "undefined")
        return null;
    var raw = localStorage.getItem(exports.AUTOSAVE_KEY);
    if (!raw)
        return null;
    try {
        var parsed = JSON.parse(raw);
        var version = Number((_a = parsed.version) !== null && _a !== void 0 ? _a : 0);
        if (!parsed.world || version < 1 || version > exports.SAVE_SCHEMA_VERSION)
            return null;
        return migrateWorld(parsed.world, version);
    }
    catch (_b) {
        return null;
    }
}
