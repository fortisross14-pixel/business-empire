"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_GROWTH = exports.STARTER_CATEGORIES = void 0;
exports.companyScale = companyScale;
exports.brandCreationCost = brandCreationCost;
exports.canCreateBrand = canCreateBrand;
exports.categoryGrowthDef = categoryGrowthDef;
exports.canStartCategoryExpansion = canStartCategoryExpansion;
exports.categoryExpansionSpeed = categoryExpansionSpeed;
var people_1 = require("./people");
var research_1 = require("./research");
var productCatalog_1 = require("./productCatalog");
var SCALES = [
    { id: "startup", label: "Startup", description: "Founder-led company proving its first products.", maxBrands: 1, nextRevenue: 2000000 },
    { id: "emerging", label: "Emerging Company", description: "A real portfolio is forming and a second brand becomes viable.", maxBrands: 2, nextRevenue: 20000000 },
    { id: "established", label: "Established Company", description: "Multiple brands and categories can be supported with dedicated teams.", maxBrands: 4, nextRevenue: 150000000 },
    { id: "major", label: "Major Corporation", description: "A scaled company with room for a broad brand architecture.", maxBrands: 8, nextRevenue: 1000000000 },
    { id: "enterprise", label: "Enterprise", description: "A category-defining corporation operating at very large scale.", maxBrands: 12, nextRevenue: null },
];
function companyScale(w) {
    var _a, _b;
    var rev = (_b = (_a = w.chronicle) === null || _a === void 0 ? void 0 : _a.lifetimeRevenue) !== null && _b !== void 0 ? _b : 0;
    var launched = w.player.skus.filter(function (s) { return s.launchTick > 0; }).length;
    if (rev >= 1000000000 || launched >= 18)
        return SCALES[4];
    if (rev >= 150000000 || launched >= 12)
        return SCALES[3];
    if (rev >= 20000000 || launched >= 7)
        return SCALES[2];
    if (rev >= 2000000 || launched >= 3)
        return SCALES[1];
    return SCALES[0];
}
function brandCreationCost(w) {
    if (w.brands.length === 0)
        return 0; // founding brand is created after the first office is built
    var additional = Math.max(0, w.brands.length - 1);
    return 250000 * Math.pow(2, additional);
}
function canCreateBrand(w) {
    var scale = companyScale(w);
    var cost = brandCreationCost(w);
    if (w.brands.length === 0 && !w.player.operatingRooms.some(function (r) { return r.id === "founder-office"; }))
        return { ok: false, reason: "Build your Founder Office before creating the company’s first brand.", cost: cost };
    if (w.brands.length >= scale.maxBrands)
        return { ok: false, reason: "".concat(scale.label, " supports up to ").concat(scale.maxBrands, " brand").concat(scale.maxBrands === 1 ? "" : "s", ". Grow the company before adding another."), cost: cost };
    if (w.brands.length > 0 && (0, people_1.teamEffectiveness)(w, "marketing") <= 0)
        return { ok: false, reason: "Hire and seat a Marketing specialist before launching an additional brand.", cost: cost };
    if (w.player.cash < cost)
        return { ok: false, reason: "Need $".concat(Math.round(cost).toLocaleString(), " to launch a new brand."), cost: cost };
    return { ok: true, reason: "", cost: cost };
}
exports.STARTER_CATEGORIES = Object.fromEntries((0, productCatalog_1.registeredIndustryIds)().map(function (industryId) { return [industryId, (0, productCatalog_1.starterProductKeys)(industryId)]; }));
exports.CATEGORY_GROWTH = Object.fromEntries((0, productCatalog_1.registeredIndustryIds)().map(function (industryId) { return [industryId,
    (0, productCatalog_1.archetypesForIndustry)(industryId)
        .filter(function (p) { return !p.entry.starter; })
        .map(function (p) { return ({ productKey: p.key, investment: p.entry.investment, days: p.entry.days, blurb: p.entry.blurb }); }),
]; }));
function categoryGrowthDef(_w, productKey) {
    var p = (0, productCatalog_1.archetypeByKey)(productKey);
    if (!p || p.entry.starter)
        return null;
    return { productKey: p.key, investment: p.entry.investment, days: p.entry.days, blurb: p.entry.blurb };
}
function canStartCategoryExpansion(w, productKey) {
    var _a;
    var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
    var def = categoryGrowthDef(w, productKey);
    if (!archetype || !def)
        return { ok: false, reason: "This category has no expansion project.", def: null };
    var business = (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a[archetype.industryId];
    if (!business || business.status !== "active")
        return { ok: false, reason: "Enter ".concat(archetype.industryId, " before expanding this category."), def: def };
    if (business.unlockedCategories.includes(productKey))
        return { ok: false, reason: "Category already unlocked.", def: def };
    if (business.categoryExpansionProjects.some(function (p) { return p.productKey === productKey; }))
        return { ok: false, reason: "Expansion project already underway.", def: def };
    if (w.player.cash < def.investment)
        return { ok: false, reason: "Need $".concat(def.investment.toLocaleString(), " to fund entry."), def: def };
    if (!(0, research_1.hasSeatedCIO)(w))
        return { ok: false, reason: "A seated Chief Innovation Officer is required to develop a new product category.", def: def };
    var productRooms = w.player.operatingRooms.filter(function (r) { return r.kind === "office" && (r.team === "product" || r.id === "founder-office"); });
    if (!productRooms.length)
        return { ok: false, reason: "A Product office is required to enter a new category.", def: def };
    if ((0, people_1.teamEffectiveness)(w, "product_manager") <= 0)
        return { ok: false, reason: "Seat a Product Designer before developing a new product category.", def: def };
    return { ok: true, reason: "", def: def };
}
function categoryExpansionSpeed(w) {
    var product = (0, people_1.teamEffectiveness)(w, "product_manager");
    var strategy = (0, people_1.teamEffectiveness)(w, "strategy");
    var innovation = (0, people_1.teamEffectiveness)(w, "innovation");
    if (product <= 0 || innovation <= 0)
        return 0;
    return 0.35 + product * 0.45 + strategy * 0.20 + innovation * 0.60;
}
