"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productMarketFitForCell = productMarketFitForCell;
exports.bestFitDiagnosis = bestFitDiagnosis;
exports.partnerRecommendations = partnerRecommendations;
var industries_1 = require("./industries");
var productCatalog_1 = require("./productCatalog");
var distribution_1 = require("./distribution");
var ip_1 = require("./ip");
var stars = function (x) { return Math.max(1, Math.min(5, Math.round((0, industries_1.clamp)(x, 0, 1) * 4 + 1))); };
function priceFit(w, sku, cell) {
    var a = (0, productCatalog_1.archetypeByKey)(sku.productKey);
    if (!a)
        return .65;
    var _a = a.priceBand, lo = _a[0], hi = _a[1];
    var mid = (lo + hi) / 2;
    var span = Math.max(5, hi - lo);
    // Affluent segments tolerate a higher price; budget segments punish it hard.
    var cls = cell.coord.class === "Affluent" ? 1.28 : cell.coord.class === "Middle" ? 1 : .72;
    var expected = mid * cls;
    var ratio = sku.listPrice / Math.max(1, expected);
    if (ratio <= 1.15)
        return (0, industries_1.clamp)(1 - Math.max(0, .72 - ratio) * .28, .72, 1);
    return (0, industries_1.clamp)(1 - Math.pow((ratio - 1.15) / Math.max(.75, span / mid), 1.18) * .92, .04, 1);
}
function brandFit(w, sku, cell) {
    var _a;
    var brand = w.brands.find(function (b) { return b.id === sku.brandId; });
    var pos = (_a = brand === null || brand === void 0 ? void 0 : brand.positioning) !== null && _a !== void 0 ? _a : "premium";
    if (pos === "luxury") {
        if (cell.coord.class === "Affluent")
            return 1;
        if (cell.coord.class === "Middle")
            return .58;
        return .18;
    }
    if (pos === "mass") {
        if (cell.coord.class === "Budget")
            return 1;
        if (cell.coord.class === "Middle")
            return .92;
        return .65;
    }
    return cell.coord.class === "Middle" ? 1 : .78;
}
function ipFit(w, sku, cell) {
    if (!sku.ipId)
        return 1;
    var ip = (0, ip_1.ipById)(w, sku.ipId);
    if (!ip)
        return .45;
    var product = (0, ip_1.ipProductFit)(ip, sku.productKey);
    var audience = (0, industries_1.clamp)(((0, ip_1.ipAudienceFit)(ip, cell) - .68) / .58, 0, 1);
    // An irrelevant license should be capable of actively hurting a product, not simply failing to help it.
    return (0, industries_1.clamp)(product * .58 + audience * .42, .08, 1);
}
function intrinsicProductFit(w, sku, cell) {
    var _a, _b, _c;
    var category = (_a = cell.categoryPref[sku.productKey]) !== null && _a !== void 0 ? _a : .5;
    var needs = Object.entries((_b = sku.attributes) !== null && _b !== void 0 ? _b : {});
    if (!needs.length)
        return category;
    var weighted = 0, total = 0;
    for (var _i = 0, needs_1 = needs; _i < needs_1.length; _i++) {
        var _d = needs_1[_i], k = _d[0], v = _d[1];
        var pref = (_c = cell.needPref[k]) !== null && _c !== void 0 ? _c : .5;
        weighted += (1 - Math.abs(pref - v)) * (.4 + v);
        total += .4 + v;
    }
    return (0, industries_1.clamp)(category * .55 + (total ? weighted / total : .5) * .45, .08, 1);
}
function productMarketFitForCell(w, sku, cell) {
    var p = priceFit(w, sku, cell);
    var c = (0, distribution_1.contractsForSku)(w, sku).length ? (0, industries_1.clamp)((0, distribution_1.partnerFitForCell)(w, sku, cell) / .9, .08, 1) : .04;
    var b = brandFit(w, sku, cell);
    var ip = ipFit(w, sku, cell);
    var product = intrinsicProductFit(w, sku, cell);
    // Multiplicative-ish: spending millions cannot rescue a fundamentally incoherent proposition.
    var overall = (0, industries_1.clamp)(Math.pow(p * c * b * ip * product, .36), .03, 1);
    var issues = [];
    var positives = [];
    if (p < .45)
        issues.push("Price is far above what this audience accepts for the category.");
    else if (p > .82)
        positives.push("Price fits the audience.");
    if (c < .45)
        issues.push("Channel mismatch: the product is not where this audience naturally shops.");
    else if (c > .8)
        positives.push("Distribution matches the audience.");
    if (b < .45)
        issues.push("Brand positioning and buyer expectations conflict.");
    else if (b > .8)
        positives.push("Brand positioning fits the buyer.");
    if (sku.ipId && ip < .45)
        issues.push("The attached IP does not transfer well to this product/buyer.");
    else if (sku.ipId && ip > .8)
        positives.push("The IP strongly resonates with the target buyer.");
    if (product < .45)
        issues.push("The product proposition itself is weak for this audience.");
    else if (product > .8)
        positives.push("The product proposition fits the audience.");
    return { overall: overall, priceFit: p, channelFit: c, brandFit: b, ipFit: ip, productFit: product,
        stars: { price: stars(p), channel: stars(c), brand: stars(b), ip: stars(ip), product: stars(product) }, issues: issues, positives: positives };
}
function bestFitDiagnosis(w, sku) {
    var best = null;
    var commercial = null;
    for (var _i = 0, _a = w.cube; _i < _a.length; _i++) {
        var cell = _a[_i];
        var diag = productMarketFitForCell(w, sku, cell);
        var market = cell.head * cell.spend;
        var intrinsicScore = diag.productFit * diag.brandFit * market;
        if (!best || intrinsicScore > best.diag.productFit * best.diag.brandFit * best.cell.head * best.cell.spend)
            best = { cell: cell, diag: diag };
        var score = diag.overall * market;
        if (!commercial || score > commercial.score)
            commercial = { cell: cell, diag: diag, score: score };
    }
    return { best: best, commercial: commercial };
}
function partnerRecommendations(w, sku, cell) {
    var brand = w.brands.find(function (b) { return b.id === sku.brandId; });
    return industries_1.RETAIL_PARTNERS.filter(function (p) { return !p.industries || p.industries.includes(sku.industryId); })
        .map(function (p) {
        var _a, _b, _c;
        var demographic = 1;
        for (var _i = 0, _d = Object.entries((_a = p.skew) !== null && _a !== void 0 ? _a : {}); _i < _d.length; _i++) {
            var _e = _d[_i], axisRaw = _e[0], skew = _e[1];
            var axis = axisRaw;
            var values = {
                gender: ["Female", "Male"], age: ["13-24", "25-39", "40-59", "60+"], class: ["Budget", "Middle", "Affluent"],
                leaning: ["Progressive", "Neutral", "Conservative"], geography: ["Urban", "Suburban", "Rural"], family: ["Single", "Couple", "Family"],
            };
            var vals = (_b = values[axis]) !== null && _b !== void 0 ? _b : [];
            var idx = Math.max(0, vals.indexOf(cell.coord[axis]));
            var pos = vals.length <= 1 ? .5 : idx / (vals.length - 1);
            demographic *= (0, industries_1.clamp)(1 + Number(skew) * (pos - .5) * .8, .65, 1.35);
        }
        var positioning = 1;
        if ((brand === null || brand === void 0 ? void 0 : brand.positioning) === "luxury")
            positioning = p.id === "beauty_luxe" || p.id === "flagship_store" ? 1.35 : p.id === "value_dept" || p.category === "drugstore" ? .58 : .95;
        if ((brand === null || brand === void 0 ? void 0 : brand.positioning) === "mass")
            positioning = p.id === "value_dept" || p.category === "drugstore" || p.id === "megazon" ? 1.2 : p.id === "flagship_store" ? .72 : 1;
        var fit = ((_c = cell.channelPref[p.channelType]) !== null && _c !== void 0 ? _c : 0) * demographic * p.reachMult * (0, productCatalog_1.retailerAffinity)(sku.productKey, p.id, p.category, p.channelType) * positioning;
        return { partner: p, fit: fit };
    })
        .sort(function (a, b) { return b.fit - a.fit; }).slice(0, 3);
}
