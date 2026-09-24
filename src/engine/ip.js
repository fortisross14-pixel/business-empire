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
exports.IP_AUDIENCE_PRESETS = exports.ORIGINAL_IP_CREATION_COST = void 0;
exports.seedExternalIPs = seedExternalIPs;
exports.ensureIPFoundation = ensureIPFoundation;
exports.ipById = ipById;
exports.activeIPContract = activeIPContract;
exports.ownsIP = ownsIP;
exports.hasIPRights = hasIPRights;
exports.ipProductFit = ipProductFit;
exports.canAttachIP = canAttachIP;
exports.usableIPsForProduct = usableIPsForProduct;
exports.ipAudienceFit = ipAudienceFit;
exports.ipCommercialStrength = ipCommercialStrength;
exports.ipDemandMultiplier = ipDemandMultiplier;
exports.ipAwarenessFloor = ipAwarenessFloor;
exports.contractTerms = contractTerms;
exports.signIPLicense = signIPLicense;
exports.createOriginalIP = createOriginalIP;
exports.setSkuIP = setSkuIP;
exports.expireIPContracts = expireIPContracts;
exports.royaltyCostQuarterly = royaltyCostQuarterly;
exports.accrueIPRoyaltiesAndDynamics = accrueIPRoyaltiesAndDynamics;
exports.estimateIPValue = estimateIPValue;
exports.companyIPPortfolioValue = companyIPPortfolioValue;
exports.estimatedCompanyValue = estimatedCompanyValue;
exports.availableIPProductFamilies = availableIPProductFamilies;
exports.daysUntilIPExpiry = daysUntilIPExpiry;
exports.annualizedRoyaltyExposure = annualizedRoyaltyExposure;
var types_1 = require("./types");
var industries_1 = require("./industries");
var productCatalog_1 = require("./productCatalog");
var chronicle_1 = require("./chronicle");
var people_1 = require("./people");
exports.ORIGINAL_IP_CREATION_COST = 100000;
var aud = function (age, family, gender, klass, leaning, geography) {
    if (gender === void 0) { gender = 0.5; }
    if (klass === void 0) { klass = 0.5; }
    if (leaning === void 0) { leaning = 0.5; }
    if (geography === void 0) { geography = 0.5; }
    return ({
        age: age,
        family: family,
        gender: gender,
        class: klass,
        leaning: leaning,
        geography: geography,
    });
};
exports.IP_AUDIENCE_PRESETS = [
    { id: "kids_family", label: "Kids & Families", description: "Parents, children and family households; strongest for character-led mass products.", audience: aud(0.28, 0.92, 0.5, 0.48, 0.5, 0.55) },
    { id: "teen_fandom", label: "Teens & Fandom", description: "Younger, urban, collector-oriented audiences that react strongly to momentum.", audience: aud(0.12, 0.28, 0.5, 0.52, 0.48, 0.72) },
    { id: "broad_pop", label: "Broad Pop Culture", description: "Mainstream reach across age and household types; flexible but less concentrated.", audience: aud(0.42, 0.55, 0.5, 0.5, 0.5, 0.55) },
    { id: "adult_premium", label: "Adult Premium", description: "Older, affluent consumers; prestige matters more than pure momentum.", audience: aud(0.68, 0.42, 0.5, 0.78, 0.5, 0.68) },
    { id: "nostalgia", label: "Nostalgia & Collectors", description: "Adults buying into remembered worlds, display pieces and collectible culture.", audience: aud(0.58, 0.32, 0.5, 0.64, 0.5, 0.62) },
];
// These are content, not branches in the engine. Future industries can reuse the same IPs simply
// by registering product archetype keys that appear in compatibleProductFamilies.
var EXTERNAL_IP_SEEDS = [
    { id: "space_opera", name: "Galaxy Knights", ownerName: "Northstar Pictures", awareness: .82, momentum: 1.24, prestige: .84, fatigue: .14, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "buildingset", "vehicle", "collectible", "plush", "boardgame", "electronictoy", "cereal", "tshirt", "backpack"], royaltyRate: .095, minimumGuarantee: 520000 },
    { id: "superhero", name: "Titan Heroes Universe", ownerName: "Titan Media", awareness: .91, momentum: 1.16, prestige: .88, fatigue: .28, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "buildingset", "vehicle", "collectible", "plush", "boardgame", "electronictoy", "cereal", "snack", "tshirt", "backpack"], royaltyRate: .105, minimumGuarantee: 720000 },
    { id: "princess_magic", name: "Enchanted Kingdoms", ownerName: "Crownlight Entertainment", awareness: .88, momentum: 1.08, prestige: .82, fatigue: .22, audiencePresetId: "kids_family", compatibleProductFamilies: ["doll", "plush", "buildingset", "collectible", "boardgame", "mask", "hydration", "cereal", "tshirt", "backpack"], royaltyRate: .10, minimumGuarantee: 650000 },
    { id: "animated_kids", name: "Sunny Pals", ownerName: "Sunbeam Animation", awareness: .70, momentum: 1.34, prestige: .58, fatigue: .10, audiencePresetId: "kids_family", compatibleProductFamilies: ["plush", "doll", "boardgame", "buildingset", "actionfig", "cereal", "snack", "yogurt", "backpack"], royaltyRate: .075, minimumGuarantee: 310000 },
    { id: "monster_world", name: "Creature Realms", ownerName: "Midnight Forge", awareness: .74, momentum: 1.42, prestige: .68, fatigue: .08, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "buildingset", "boardgame", "plush", "electronictoy", "cereal", "snack", "tshirt"], royaltyRate: .085, minimumGuarantee: 380000 },
    { id: "fantasy_saga", name: "Realm of Crowns", ownerName: "Silver Quill Studios", awareness: .76, momentum: .98, prestige: .91, fatigue: .07, audiencePresetId: "adult_premium", compatibleProductFamilies: ["actionfig", "collectible", "buildingset", "boardgame", "doll", "tshirt", "backpack"], royaltyRate: .085, minimumGuarantee: 420000 },
    { id: "retro_arcade", name: "Retro Arcade Classics", ownerName: "Vector Interactive", awareness: .52, momentum: 1.12, prestige: .62, fatigue: .05, audiencePresetId: "nostalgia", compatibleProductFamilies: ["electronictoy", "collectible", "actionfig", "buildingset", "boardgame", "soda", "tshirt"], royaltyRate: .055, minimumGuarantee: 120000 },
    { id: "global_soccer", name: "World Football League", ownerName: "World Football Licensing", awareness: .90, momentum: 1.05, prestige: .86, fatigue: .18, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "vehicle", "cereal", "snack", "soda", "tshirt", "backpack"], royaltyRate: .09, minimumGuarantee: 600000 },
    { id: "global_basket", name: "Pro Basketball Association", ownerName: "PBA Properties", awareness: .83, momentum: 1.18, prestige: .80, fatigue: .14, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "cereal", "snack", "soda", "tshirt", "backpack"], royaltyRate: .085, minimumGuarantee: 510000 },
    { id: "racing_cars", name: "Speedway Legends", ownerName: "Velocity Rights", awareness: .67, momentum: 1.08, prestige: .72, fatigue: .11, audiencePresetId: "broad_pop", compatibleProductFamilies: ["vehicle", "buildingset", "collectible", "actionfig", "electronictoy", "cereal", "tshirt"], royaltyRate: .07, minimumGuarantee: 260000 },
    { id: "pop_music", name: "Global Pop Icons", ownerName: "Pulse Entertainment", awareness: .89, momentum: 1.52, prestige: .73, fatigue: .31, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["doll", "collectible", "plush", "mask", "hydration", "tshirt", "backpack", "soda"], royaltyRate: .11, minimumGuarantee: 760000 },
    { id: "indie_comics", name: "Indie Comics Universe", ownerName: "Panel House", awareness: .34, momentum: 1.26, prestige: .48, fatigue: .03, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "tshirt"], royaltyRate: .045, minimumGuarantee: 65000 },
    { id: "nature_doc", name: "Planet Wild", ownerName: "Terra Documentary Group", awareness: .46, momentum: .93, prestige: .70, fatigue: .02, audiencePresetId: "adult_premium", compatibleProductFamilies: ["plush", "boardgame", "buildingset", "sunscreen", "tshirt"], royaltyRate: .04, minimumGuarantee: 55000 },
    { id: "local_sport", name: "National League", ownerName: "National League Properties", awareness: .43, momentum: 1.02, prestige: .47, fatigue: .09, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "tshirt", "snack"], royaltyRate: .045, minimumGuarantee: 80000 },
    { id: "cooking_show", name: "Master Kitchen", ownerName: "Tabletop Media", awareness: .38, momentum: 1.10, prestige: .45, fatigue: .08, audiencePresetId: "broad_pop", compatibleProductFamilies: ["boardgame", "doll", "mask", "cereal", "snack", "frozenpizza"], royaltyRate: .04, minimumGuarantee: 70000 },
];
function presetById(id) {
    var _a;
    return (_a = exports.IP_AUDIENCE_PRESETS.find(function (p) { return p.id === id; })) !== null && _a !== void 0 ? _a : exports.IP_AUDIENCE_PRESETS[2];
}
function seedExternalIPs() {
    return EXTERNAL_IP_SEEDS.map(function (seed) { return ({
        id: seed.id,
        name: seed.name,
        ownerType: "external",
        ownerName: seed.ownerName,
        createdTick: 0,
        awareness: seed.awareness,
        momentum: seed.momentum,
        prestige: seed.prestige,
        fatigue: seed.fatigue,
        audience: __assign({}, presetById(seed.audiencePresetId).audience),
        audienceLabel: presetById(seed.audiencePresetId).label,
        compatibleProductFamilies: __spreadArray([], seed.compatibleProductFamilies, true),
        marketTerms: { royaltyRate: seed.royaltyRate, minimumGuarantee: seed.minimumGuarantee, durationsYears: [2, 3, 5] },
        lifetimeProductRevenue: 0,
        lifetimeUnits: 0,
        peakAwareness: seed.awareness,
        peakMomentum: seed.momentum,
    }); });
}
function ensureIPFoundation(w) {
    var _a, _b;
    var seeded = seedExternalIPs();
    var existingById = new Map(((_a = w.ipAssets) !== null && _a !== void 0 ? _a : []).map(function (ip) { return [ip.id, ip]; }));
    for (var _i = 0, seeded_1 = seeded; _i < seeded_1.length; _i++) {
        var seed = seeded_1[_i];
        if (!existingById.has(seed.id))
            existingById.set(seed.id, seed);
    }
    w.ipAssets = __spreadArray([], existingById.values(), true).map(function (ip) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        return (__assign(__assign({}, ip), { ownerType: (_a = ip.ownerType) !== null && _a !== void 0 ? _a : "external", ownerName: (_b = ip.ownerName) !== null && _b !== void 0 ? _b : "Unknown owner", createdTick: (_c = ip.createdTick) !== null && _c !== void 0 ? _c : 0, awareness: (0, industries_1.clamp)((_d = ip.awareness) !== null && _d !== void 0 ? _d : .2, 0, 1), momentum: (0, industries_1.clamp)((_e = ip.momentum) !== null && _e !== void 0 ? _e : 1, .55, 2.2), prestige: (0, industries_1.clamp)((_f = ip.prestige) !== null && _f !== void 0 ? _f : .3, 0, 1), fatigue: (0, industries_1.clamp)((_g = ip.fatigue) !== null && _g !== void 0 ? _g : 0, 0, 1), audience: (_h = ip.audience) !== null && _h !== void 0 ? _h : __assign({}, exports.IP_AUDIENCE_PRESETS[2].audience), audienceLabel: (_j = ip.audienceLabel) !== null && _j !== void 0 ? _j : "Broad Pop Culture", compatibleProductFamilies: (_k = ip.compatibleProductFamilies) !== null && _k !== void 0 ? _k : [], lifetimeProductRevenue: (_l = ip.lifetimeProductRevenue) !== null && _l !== void 0 ? _l : 0, lifetimeUnits: (_m = ip.lifetimeUnits) !== null && _m !== void 0 ? _m : 0, peakAwareness: (_p = (_o = ip.peakAwareness) !== null && _o !== void 0 ? _o : ip.awareness) !== null && _p !== void 0 ? _p : 0, peakMomentum: (_r = (_q = ip.peakMomentum) !== null && _q !== void 0 ? _q : ip.momentum) !== null && _r !== void 0 ? _r : 1 }));
    });
    w.ipLicenses = ((_b = w.ipLicenses) !== null && _b !== void 0 ? _b : []).map(function (c) { var _a; return (__assign(__assign({}, c), { royaltiesPaid: (_a = c.royaltiesPaid) !== null && _a !== void 0 ? _a : 0, status: c.expiresTick > w.tick ? "active" : "expired" })); });
}
function ipById(w, ipId) {
    var _a;
    if (!ipId)
        return undefined;
    return (_a = w.ipAssets) === null || _a === void 0 ? void 0 : _a.find(function (ip) { return ip.id === ipId; });
}
function activeIPContract(w, ipId) {
    var _a;
    return (_a = w.ipLicenses) === null || _a === void 0 ? void 0 : _a.find(function (c) { return c.ipId === ipId && c.status === "active" && c.expiresTick > w.tick; });
}
function ownsIP(w, ipId) {
    var _a;
    return ((_a = ipById(w, ipId)) === null || _a === void 0 ? void 0 : _a.ownerType) === "player";
}
function hasIPRights(w, ipId) {
    return ownsIP(w, ipId) || Boolean(activeIPContract(w, ipId));
}
function ipProductFit(ip, productKey) {
    var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!archetype)
        return ip.compatibleProductFamilies.includes(productKey) ? .6 : 0;
    if (archetype.ipPotential <= 0)
        return 0;
    var explicit = ip.compatibleProductFamilies.includes(productKey);
    return explicit
        ? (0, industries_1.clamp)(.45 + archetype.ipPotential * .55, 0, 1)
        : (0, industries_1.clamp)(archetype.ipPotential * .15, 0, .18);
}
function canAttachIP(w, ipId, productKey) {
    var ip = ipById(w, ipId);
    return Boolean(ip && hasIPRights(w, ipId) && ipProductFit(ip, productKey) >= .24);
}
function usableIPsForProduct(w, productKey) {
    var _a;
    return ((_a = w.ipAssets) !== null && _a !== void 0 ? _a : [])
        .filter(function (ip) { return hasIPRights(w, ip.id) && ipProductFit(ip, productKey) >= .24; })
        .sort(function (a, b) { return ipCommercialStrength(b) - ipCommercialStrength(a); });
}
function ipAudienceFit(ip, cell) {
    var _a;
    var weights = { age: .30, family: .22, class: .15, gender: .12, geography: .11, leaning: .10 };
    var score = 0;
    var weight = 0;
    for (var _i = 0, _b = Object.keys(weights); _i < _b.length; _i++) {
        var axis = _b[_i];
        var values = industries_1.AXES[axis];
        var idx = Math.max(0, values.indexOf(cell.coord[axis]));
        var pos = values.length <= 1 ? .5 : idx / (values.length - 1);
        score += (1 - Math.abs(pos - ((_a = ip.audience[axis]) !== null && _a !== void 0 ? _a : .5))) * weights[axis];
        weight += weights[axis];
    }
    var normalized = weight > 0 ? score / weight : .5;
    return (0, industries_1.clamp)(.68 + normalized * .58, .68, 1.26);
}
function ipCommercialStrength(ip) {
    return (0, industries_1.clamp)(ip.awareness * (.62 + ip.prestige * .38) * ip.momentum * (1 - ip.fatigue * .62), 0, 1.65);
}
function ipDemandMultiplier(w, sku, cell) {
    var ip = ipById(w, sku.ipId);
    if (!ip || !hasIPRights(w, ip.id))
        return 1;
    var productFit = ipProductFit(ip, sku.productKey);
    if (productFit <= 0)
        return 1;
    var strength = ipCommercialStrength(ip);
    var audience = ipAudienceFit(ip, cell);
    var upside = strength * productFit * audience * (.18 + productFit * .22);
    // Very weak forced collaborations can slightly distract from the brand, while strong ones add real pull.
    return (0, industries_1.clamp)(.97 + upside, .94, 1.65);
}
function ipAwarenessFloor(w, sku, cell) {
    var ip = ipById(w, sku.ipId);
    if (!ip || !hasIPRights(w, ip.id))
        return 0;
    var fit = ipProductFit(ip, sku.productKey);
    return (0, industries_1.clamp)(ip.awareness * fit * ipAudienceFit(ip, cell) * (1 - ip.fatigue * .45) * .62, 0, .72);
}
function contractTerms(ip, years) {
    var _a;
    var base = ip.marketTerms;
    if (!base)
        return null;
    var y = base.durationsYears.includes(years) ? years : (_a = base.durationsYears[0]) !== null && _a !== void 0 ? _a : 3;
    var durationFactor = y <= 2 ? .72 : y >= 5 ? 1.48 : 1;
    var rateAdjustment = y <= 2 ? .006 : y >= 5 ? -.006 : 0;
    return {
        years: y,
        royaltyRate: (0, industries_1.clamp)(base.royaltyRate + rateAdjustment, .025, .15),
        minimumGuarantee: Math.round(base.minimumGuarantee * durationFactor / 5000) * 5000,
    };
}
function signIPLicense(w, ipId, years) {
    var ip = ipById(w, ipId);
    if (!ip || ip.ownerType !== "external")
        return { ok: false, reason: "This IP is not available for external licensing." };
    if (activeIPContract(w, ipId))
        return { ok: false, reason: "You already hold an active license." };
    if ((0, people_1.teamEffectiveness)(w, "strategy") <= 0 && (0, people_1.teamEffectiveness)(w, "marketing") <= 0)
        return { ok: false, reason: "Seat a Strategy or Marketing specialist before negotiating external IP licenses." };
    var terms = contractTerms(ip, years);
    if (!terms)
        return { ok: false, reason: "No licensing terms are available." };
    if (w.player.cash < terms.minimumGuarantee)
        return { ok: false, reason: "Not enough cash for the minimum guarantee." };
    w.player.cash -= terms.minimumGuarantee;
    var contract = {
        id: "iplic_".concat(ipId, "_").concat(w.tick),
        ipId: ipId,
        licensorName: ip.ownerName,
        signedTick: w.tick,
        expiresTick: w.tick + terms.years * types_1.TICKS_PER_YEAR,
        durationYears: terms.years,
        royaltyRate: terms.royaltyRate,
        minimumGuarantee: terms.minimumGuarantee,
        status: "active",
        royaltiesPaid: 0,
    };
    w.ipLicenses.push(contract);
    (0, chronicle_1.recordChronicle)(w, {
        kind: "milestone",
        importance: ip.prestige >= .85 || ip.awareness >= .88 ? 3 : 2,
        title: "".concat(ip.name, " license signed"),
        text: "".concat(w.company, " licensed ").concat(ip.name, " from ").concat(ip.ownerName, " for ").concat(terms.years, " years, with a $").concat(Math.round(terms.minimumGuarantee).toLocaleString(), " minimum guarantee and ").concat((terms.royaltyRate * 100).toFixed(1), "% royalty."),
        icon: "🎬", entityType: "ip", entityId: ip.id, tags: __spreadArray(["ip", "licensing"], (ip.prestige >= .85 ? ["iconic"] : []), true),
        dedupeKey: "ip_license_".concat(contract.id),
    });
    w.events.push({ tick: w.tick, kind: "ip", text: "\uD83C\uDFAC ".concat(ip.name, " licensed for ").concat(terms.years, " years. Minimum guarantee: $").concat(Math.round(terms.minimumGuarantee).toLocaleString(), ".") });
    return { ok: true, contract: contract };
}
function createOriginalIP(w, name, audiencePresetId, compatibleProductFamilies) {
    var _a;
    var clean = name.trim();
    if (!clean)
        return { ok: false, reason: "Name the IP first." };
    if ((0, people_1.teamEffectiveness)(w, "marketing") <= 0)
        return { ok: false, reason: "Seat a Marketing specialist before developing an original consumer IP." };
    if (((_a = w.ipAssets) !== null && _a !== void 0 ? _a : []).some(function (ip) { return ip.name.toLowerCase() === clean.toLowerCase(); }))
        return { ok: false, reason: "An IP with that name already exists." };
    var families = Array.from(new Set(compatibleProductFamilies.filter(function (key) {
        var archetype = (0, productCatalog_1.archetypeByKey)(key);
        return Boolean(archetype && archetype.ipPotential > 0);
    })));
    if (!families.length)
        return { ok: false, reason: "Choose at least one IP-capable product family." };
    if (w.player.cash < exports.ORIGINAL_IP_CREATION_COST)
        return { ok: false, reason: "Not enough cash to develop the IP." };
    var preset = presetById(audiencePresetId);
    w.player.cash -= exports.ORIGINAL_IP_CREATION_COST;
    var slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "original";
    var ip = {
        id: "own_".concat(slug, "_").concat(w.tick, "_").concat(w.ipAssets.length),
        name: clean,
        ownerType: "player",
        ownerName: w.company,
        createdTick: w.tick,
        awareness: .035,
        momentum: 1,
        prestige: .12,
        fatigue: 0,
        audience: __assign({}, preset.audience),
        audienceLabel: preset.label,
        compatibleProductFamilies: families,
        lifetimeProductRevenue: 0,
        lifetimeUnits: 0,
        peakAwareness: .035,
        peakMomentum: 1,
    };
    w.ipAssets.push(ip);
    (0, chronicle_1.recordChronicle)(w, {
        kind: "milestone", importance: 1,
        title: "".concat(ip.name, " created"),
        text: "".concat(w.company, " created the original IP ").concat(ip.name, ", aimed at ").concat(preset.label.toLowerCase(), " audiences. It begins with little recognition and must earn cultural relevance through successful products."),
        icon: "✨", entityType: "ip", entityId: ip.id, tags: ["ip", "original", "creation"], dedupeKey: "ip_created_".concat(ip.id),
    });
    w.events.push({ tick: w.tick, kind: "ip", text: "\u2728 Original IP created: ".concat(ip.name, ". Now give it a product worth caring about.") });
    return { ok: true, ip: ip };
}
function setSkuIP(w, sku, ipId) {
    var _a;
    if (!ipId) {
        sku.ipId = null;
        sku.license = null;
    }
    else {
        var ip = ipById(w, ipId);
        if (!ip)
            return { ok: false, reason: "Unknown IP." };
        if (!hasIPRights(w, ipId))
            return { ok: false, reason: "You do not hold the rights to this IP." };
        if (!canAttachIP(w, ipId, sku.productKey))
            return { ok: false, reason: "This IP is not compatible with this product family." };
        sku.ipId = ipId;
        sku.license = null;
    }
    var market = (_a = w.industryMarkets) === null || _a === void 0 ? void 0 : _a[sku.industryId];
    if (market)
        market.fitCacheDirty = true;
    if (sku.industryId === w.industryId)
        w.fitCacheDirty = true;
    return { ok: true };
}
function expireIPContracts(w) {
    var _a, _b, _c, _d;
    var _loop_1 = function (contract) {
        if (contract.status !== "active" || contract.expiresTick > w.tick)
            return "continue";
        contract.status = "expired";
        var ip = ipById(w, contract.ipId);
        // A renewal signed on the exact expiry day should preserve product rights. Only detach
        // the IP when there is genuinely no replacement contract in force.
        var replacement = activeIPContract(w, contract.ipId);
        var affected = replacement ? [] : w.player.skus.filter(function (sku) { return sku.ipId === contract.ipId; });
        for (var _f = 0, affected_1 = affected; _f < affected_1.length; _f++) {
            var sku = affected_1[_f];
            setSkuIP(w, sku, null);
        }
        w.events.push({ tick: w.tick, kind: "ip", text: "\u23F3 ".concat((_b = ip === null || ip === void 0 ? void 0 : ip.name) !== null && _b !== void 0 ? _b : "IP", " license expired").concat(replacement ? " — renewal already in force" : affected.length ? " \u2014 removed from ".concat(affected.length, " product").concat(affected.length === 1 ? "" : "s") : "", ".") });
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 1, title: "".concat((_c = ip === null || ip === void 0 ? void 0 : ip.name) !== null && _c !== void 0 ? _c : "IP", " license expired"),
            text: "".concat(w.company, "'s ").concat(contract.durationYears, "-year licensing agreement for ").concat((_d = ip === null || ip === void 0 ? void 0 : ip.name) !== null && _d !== void 0 ? _d : contract.ipId, " reached its end."),
            icon: "⏳", entityType: "ip", entityId: contract.ipId, tags: ["ip", "licensing", "expiry"], dedupeKey: "ip_expiry_".concat(contract.id),
        });
    };
    for (var _i = 0, _e = (_a = w.ipLicenses) !== null && _a !== void 0 ? _a : []; _i < _e.length; _i++) {
        var contract = _e[_i];
        _loop_1(contract);
    }
}
function royaltyCostQuarterly(w, skuResults) {
    var _a;
    var total = 0;
    ((_a = w.player.skus) !== null && _a !== void 0 ? _a : []).forEach(function (sku, i) {
        var _a, _b;
        if (!sku.ipId)
            return;
        var contract = activeIPContract(w, sku.ipId);
        if (!contract)
            return; // player-owned IPs have no royalty expense
        var netRevenueQuarter = Number((_b = (_a = skuResults[i]) === null || _a === void 0 ? void 0 : _a.revenue) !== null && _b !== void 0 ? _b : 0);
        total += netRevenueQuarter * contract.royaltyRate;
    });
    return total;
}
function accrueIPRoyaltiesAndDynamics(w, skuResults) {
    var _a, _b;
    ensureIPFoundation(w);
    expireIPContracts(w);
    var activeByIp = new Map();
    w.player.skus.forEach(function (sku, i) {
        var _a, _b, _c;
        if (!sku.ipId || !hasIPRights(w, sku.ipId))
            return;
        var r = skuResults[i];
        var unitsTick = Number((_a = r === null || r === void 0 ? void 0 : r.units) !== null && _a !== void 0 ? _a : 0) / types_1.TICKS_PER_QUARTER;
        var revenueTick = Number((_b = r === null || r === void 0 ? void 0 : r.revenue) !== null && _b !== void 0 ? _b : 0) / types_1.TICKS_PER_QUARTER;
        var entry = (_c = activeByIp.get(sku.ipId)) !== null && _c !== void 0 ? _c : { unitsTick: 0, revenueTick: 0, qualityWeighted: 0, weight: 0, breakouts: 0, products: 0 };
        entry.unitsTick += unitsTick;
        entry.revenueTick += revenueTick;
        entry.qualityWeighted += sku.perceivedQuality * Math.max(1, unitsTick);
        entry.weight += Math.max(1, unitsTick);
        entry.breakouts += sku.breakout ? 1 : 0;
        entry.products += sku.status === "active" ? 1 : 0;
        activeByIp.set(sku.ipId, entry);
        var contract = activeIPContract(w, sku.ipId);
        if (contract && revenueTick > 0)
            contract.royaltiesPaid += revenueTick * contract.royaltyRate;
    });
    for (var _i = 0, _c = w.ipAssets; _i < _c.length; _i++) {
        var ip = _c[_i];
        var use = activeByIp.get(ip.id);
        var seed = hash01(ip.id);
        var culturalPulse = Math.sin((w.tick + seed * 720) / 150) * .055;
        var baseMomentumTarget = 1 + culturalPulse;
        ip.momentum += (baseMomentumTarget - ip.momentum) * (ip.ownerType === "external" ? .0007 : .0011);
        ip.fatigue = (0, industries_1.clamp)(ip.fatigue - .00011, 0, 1);
        if (use) {
            ip.lifetimeUnits += use.unitsTick;
            ip.lifetimeProductRevenue += use.revenueTick;
            var scale = (0, industries_1.clamp)(Math.log10(1 + use.unitsTick) / 5, 0, .8);
            var avgQuality = use.weight > 0 ? use.qualityWeighted / use.weight : .5;
            var awarenessTarget = (0, industries_1.clamp)(ip.awareness + .015 + scale * .35 + use.breakouts * .08, 0, .97);
            ip.awareness += (awarenessTarget - ip.awareness) * .0045;
            var momentumTarget = (0, industries_1.clamp)(1 + scale * .65 + use.breakouts * .45 + Math.max(0, avgQuality - .65) * .35, .75, 2.1);
            ip.momentum += (momentumTarget - ip.momentum) * .005;
            var prestigeTarget = (0, industries_1.clamp)(.08 + avgQuality * .72 + Math.min(.18, Math.log10(1 + ip.lifetimeProductRevenue / 100000) * .055), 0, .96);
            ip.prestige += (prestigeTarget - ip.prestige) * .0018;
            var overexposure = Math.max(0, use.products - 2) * .00012 + Math.max(0, ip.momentum - 1.55) * .00013;
            ip.fatigue = (0, industries_1.clamp)(ip.fatigue + overexposure, 0, .92);
        }
        else if (ip.ownerType === "player") {
            // Original properties do not stay culturally hot forever just because they were once successful.
            // Prestige gives them a durable memory floor; active products are what rebuild awareness/momentum.
            var legacyFloor = (0, industries_1.clamp)(.02 + ip.prestige * .24, .02, .26);
            if (ip.awareness > legacyFloor)
                ip.awareness += (legacyFloor - ip.awareness) * .00016;
        }
        ip.awareness = (0, industries_1.clamp)(ip.awareness, 0, 1);
        ip.momentum = (0, industries_1.clamp)(ip.momentum, .55, 2.2);
        ip.prestige = (0, industries_1.clamp)(ip.prestige, 0, 1);
        ip.peakAwareness = Math.max((_a = ip.peakAwareness) !== null && _a !== void 0 ? _a : 0, ip.awareness);
        ip.peakMomentum = Math.max((_b = ip.peakMomentum) !== null && _b !== void 0 ? _b : 1, ip.momentum);
        if (ip.ownerType === "player")
            recordIPMilestones(w, ip);
    }
}
function recordIPMilestones(w, ip) {
    if (ip.awareness >= .35)
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 2, title: "".concat(ip.name, " breaks through"),
            text: "".concat(ip.name, " crossed 35% awareness and became a meaningful consumer property rather than just a name attached to products."),
            icon: "🌟", entityType: "ip", entityId: ip.id, tags: ["ip", "breakthrough"], dedupeKey: "ip_breakthrough_".concat(ip.id),
        });
    if (ip.awareness >= .70 && ip.prestige >= .60)
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 3, title: "".concat(ip.name, " becomes iconic"),
            text: "".concat(ip.name, " reached mass awareness with durable prestige, becoming one of ").concat(w.company, "'s defining intellectual properties."),
            icon: "👑", entityType: "ip", entityId: ip.id, tags: ["ip", "iconic", "legacy"], dedupeKey: "ip_iconic_".concat(ip.id),
        });
    if (estimateIPValue(ip) >= 5000000)
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 3, title: "".concat(ip.name, " valued above $5M"),
            text: "".concat(ip.name, "'s awareness, prestige and commercial history pushed its estimated asset value above $5 million."),
            icon: "💎", entityType: "ip", entityId: ip.id, tags: ["ip", "valuation", "iconic"], metricValue: estimateIPValue(ip), dedupeKey: "ip_value5m_".concat(ip.id),
        });
}
function estimateIPValue(ip) {
    if (ip.ownerType !== "player")
        return 0;
    // A freshly-created name should not manufacture millions of enterprise value on day one.
    // Value accelerates only when awareness and prestige reinforce each other and products prove demand.
    var cultural = 60000 + ip.awareness * 1600000 + (ip.awareness * ip.prestige) * 5000000;
    var provenSales = Math.min(5000000, Math.max(0, ip.lifetimeProductRevenue) * .11);
    return Math.max(0, (cultural + provenSales) * (0, industries_1.clamp)(ip.momentum, .7, 1.8) * (1 - ip.fatigue * .58));
}
function companyIPPortfolioValue(w) {
    var _a;
    return ((_a = w.ipAssets) !== null && _a !== void 0 ? _a : []).filter(function (ip) { return ip.ownerType === "player"; }).reduce(function (sum, ip) { return sum + estimateIPValue(ip); }, 0);
}
function estimatedCompanyValue(w) {
    var _a, _b, _c, _d, _e, _f;
    var inventory = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.cashflow.inventoryValue) !== null && _b !== void 0 ? _b : w.player.skus.reduce(function (sum, sku) { return sum + sku.inventory * sku.unitCost; }, 0);
    var receivables = (_d = (_c = w.live) === null || _c === void 0 ? void 0 : _c.cashflow.receivables) !== null && _d !== void 0 ? _d : w.player.receivables.reduce(function (sum, r) { return sum + r.amount; }, 0);
    var earningsValue = Math.max(0, ((_f = (_e = w.live) === null || _e === void 0 ? void 0 : _e.income.profit) !== null && _f !== void 0 ? _f : 0) * 4) * 3.5;
    return Math.max(0, w.player.cash + inventory + receivables - w.player.debt + earningsValue + companyIPPortfolioValue(w));
}
function availableIPProductFamilies() {
    return Object.values(productCatalog_1.PRODUCT_ARCHETYPES)
        .filter(function (p) { return p.ipPotential > 0; })
        .map(function (p) { return ({ key: p.key, label: p.label, industryId: p.industryId, ipPotential: p.ipPotential }); })
        .sort(function (a, b) { return a.industryId.localeCompare(b.industryId) || a.label.localeCompare(b.label); });
}
function daysUntilIPExpiry(w, contract) {
    return Math.max(0, contract.expiresTick - w.tick);
}
function annualizedRoyaltyExposure(w) {
    if (!w.live)
        return 0;
    var q = 0;
    w.player.skus.forEach(function (sku, i) {
        var _a, _b, _c;
        if (!sku.ipId)
            return;
        var c = activeIPContract(w, sku.ipId);
        if (!c)
            return;
        q += ((_c = (_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.skuResults[i]) === null || _b === void 0 ? void 0 : _b.revenue) !== null && _c !== void 0 ? _c : 0) * c.royaltyRate;
    });
    return q * 4;
}
function hash01(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++)
        h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return (h >>> 0) / 4294967295;
}
