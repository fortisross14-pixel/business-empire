"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primaryBrand = primaryBrand;
exports.brandById = brandById;
exports.brandSkuCount = brandSkuCount;
exports.brandPositioningFit = brandPositioningFit;
exports.defaultBrandVisual = defaultBrandVisual;
exports.ensureBrandVisual = ensureBrandVisual;
var industries_1 = require("./industries");
function unbrandedIdentity(w) {
    return { id: "__unbranded", name: w.company || "Unbranded", color: "#3b82f6", positioning: "premium", createdTick: 0, industryId: w.industryId, visual: defaultBrandVisual(w.company || "Unbranded", "#3b82f6") };
}
function primaryBrand(w) {
    var _a, _b;
    return (_b = (_a = w.brands.find(function (b) { return b.id === w.primaryBrandId; })) !== null && _a !== void 0 ? _a : w.brands[0]) !== null && _b !== void 0 ? _b : unbrandedIdentity(w);
}
function brandById(w, brandId) {
    var _a;
    return (_a = w.brands.find(function (b) { return b.id === brandId; })) !== null && _a !== void 0 ? _a : primaryBrand(w);
}
function brandSkuCount(w, brandId) {
    return w.player.skus.filter(function (s) { return s.brandId === brandId; }).length;
}
function brandPositioningFit(w, brandId, cell, productPositioning) {
    var brand = brandById(w, brandId);
    var classValues = ["Budget", "Middle", "Affluent"];
    var classPos = Math.max(0, classValues.indexOf(cell.coord.class)) / 2;
    var fit = 1;
    if (brand.positioning === "mass")
        fit *= 1.05 - Math.abs(classPos - 0.35) * 0.10;
    else if (brand.positioning === "premium")
        fit *= 0.90 + classPos * 0.20;
    else if (brand.positioning === "luxury")
        fit *= 0.72 + classPos * 0.42;
    var aligned = brand.positioning === "mass"
        ? productPositioning === "value" || productPositioning === "mainstream"
        : brand.positioning === "premium"
            ? productPositioning === "premium" || productPositioning === "specialist" || productPositioning === "mainstream"
            : productPositioning === "luxury" || productPositioning === "premium";
    var stronglyConflicted = brand.positioning === "luxury" && productPositioning === "value"
        || brand.positioning === "mass" && productPositioning === "luxury";
    if (aligned)
        fit *= 1.04;
    if (stronglyConflicted)
        fit *= 0.88;
    return (0, industries_1.clamp)(fit, 0.7, 1.2);
}
var BRAND_SHAPES = ["square", "circle", "hex", "shield"];
var BRAND_MOTIFS = ["orbit", "stripe", "spark", "leaf"];
var BRAND_LAYOUTS = ["monogram", "monogram", "stacked"];
function hashString(input) {
    var h = 0;
    for (var i = 0; i < input.length; i += 1)
        h = (h * 31 + input.charCodeAt(i)) >>> 0;
    return h;
}
function lighten(hex, amount) {
    if (amount === void 0) { amount = 0.28; }
    var clean = hex.replace("#", "");
    var num = parseInt(clean.length === 3 ? clean.split("").map(function (c) { return c + c; }).join("") : clean, 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    var mix = function (v) { return Math.round(v + (255 - v) * amount); };
    return "#".concat([mix(r), mix(g), mix(b)].map(function (v) { return v.toString(16).padStart(2, "0"); }).join(""));
}
function defaultBrandVisual(name, color) {
    var hash = hashString(name.toLowerCase());
    return {
        shape: BRAND_SHAPES[hash % BRAND_SHAPES.length],
        motif: BRAND_MOTIFS[(hash >> 3) % BRAND_MOTIFS.length],
        textLayout: BRAND_LAYOUTS[(hash >> 5) % BRAND_LAYOUTS.length],
        accentColor: lighten(color, 0.35),
    };
}
function ensureBrandVisual(brand) {
    if (!brand.visual)
        brand.visual = defaultBrandVisual(brand.name, brand.color);
    else
        brand.visual.accentColor = brand.visual.accentColor || lighten(brand.color, 0.35);
    return brand;
}
