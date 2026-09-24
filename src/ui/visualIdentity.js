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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.mix = mix;
exports.BrandLogoMark = BrandLogoMark;
exports.IPBadge = IPBadge;
exports.ProductPackIcon = ProductPackIcon;
exports.ProductVisualCard = ProductVisualCard;
exports.CompetitorLogoMark = CompetitorLogoMark;
exports.CompetitorChip = CompetitorChip;
exports.CompetitorCard = CompetitorCard;
var react_1 = require("react");
var productCatalog_1 = require("../engine/productCatalog");
var brands_1 = require("../engine/brands");
var ip_1 = require("../engine/ip");
var theme_1 = require("./theme");
var PRODUCT_ART_BASE = "".concat((_b = (_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.BASE_URL) !== null && _b !== void 0 ? _b : "/", "assets/products/");
function productArtUrl(productKey) { return "".concat(PRODUCT_ART_BASE).concat(productKey, ".svg"); }
function hashString(input) {
    var h = 0;
    for (var i = 0; i < input.length; i += 1)
        h = (h * 33 + input.charCodeAt(i)) >>> 0;
    return h;
}
function normalizeHex(hex) {
    if (!hex)
        return "#7c3aed";
    var clean = hex.replace("#", "");
    if (clean.length === 3)
        return "#".concat(clean.split("").map(function (c) { return c + c; }).join(""));
    return "#".concat(clean.padEnd(6, "0").slice(0, 6));
}
function mix(a, b, ratio) {
    var aa = normalizeHex(a);
    var bb = normalizeHex(b);
    var pa = parseInt(aa.slice(1), 16);
    var pb = parseInt(bb.slice(1), 16);
    var ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    var br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bbv = pb & 255;
    var m = function (x, y) { return Math.round(x * (1 - ratio) + y * ratio); };
    return "#".concat([m(ar, br), m(ag, bg), m(ab, bbv)].map(function (v) { return v.toString(16).padStart(2, "0"); }).join(""));
}
function toneText(bg) {
    var n = parseInt(normalizeHex(bg).slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#112034" : "#ffffff";
}
function initials(name) {
    var words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return "B";
    if (words.length === 1)
        return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}
function displayShape(shape) {
    if (shape === "diamond")
        return "hex";
    if (shape === "triangle")
        return "circle";
    if (shape === "capsule")
        return "square";
    return shape;
}
function displayMotif(motif) {
    if (motif === "crown" || motif === "star")
        return "spark";
    if (motif === "bolt")
        return "stripe";
    return motif;
}
function shapeStyle(shape, size) {
    var base = { width: size, height: size, position: "relative", overflow: "hidden", flex: "0 0 auto", boxSizing: "border-box" };
    switch (shape) {
        case "circle": return __assign(__assign({}, base), { borderRadius: "999px" });
        case "shield": return __assign(__assign({}, base), { borderRadius: "35% 35% 45% 45%", clipPath: "polygon(12% 0%, 88% 0%, 100% 24%, 92% 76%, 50% 100%, 8% 76%, 0% 24%)" });
        case "hex": return __assign(__assign({}, base), { clipPath: "polygon(22% 0%, 78% 0%, 100% 50%, 78% 100%, 22% 100%, 0% 50%)" });
        default: return __assign(__assign({}, base), { borderRadius: theme_1.UI.radius.md });
    }
}
function motifNode(motif, accent, text, size) {
    var common = { position: "absolute", opacity: 0.92 };
    switch (motif) {
        case "stripe":
            return <div style={__assign(__assign({}, common), { inset: 0, background: "linear-gradient(135deg, transparent 12%, ".concat(accent, " 12%, ").concat(accent, " 24%, transparent 24%, transparent 43%, ").concat(mix(accent, text, .2), " 43%, ").concat(mix(accent, text, .2), " 55%, transparent 55%)") })}/>;
        case "star":
            return <div style={__assign(__assign({}, common), { left: "50%", top: "50%", width: size * .48, height: size * .48, transform: "translate(-50%,-50%)", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 92%, 50% 71%, 21% 92%, 32% 57%, 2% 35%, 39% 35%)", background: accent })}/>;
        case "bolt":
            return <div style={__assign(__assign({}, common), { left: "50%", top: "50%", width: size * .32, height: size * .58, transform: "translate(-50%,-50%)", clipPath: "polygon(45% 0%, 100% 0%, 62% 42%, 85% 42%, 25% 100%, 42% 58%, 18% 58%)", background: accent })}/>;
        case "orbit":
            return <><div style={__assign(__assign({}, common), { inset: "18% 8%", border: "2px solid ".concat(accent), borderRadius: "50%" })}/><div style={__assign(__assign({}, common), { inset: "18% 8%", border: "2px solid ".concat(accent), borderRadius: "50%", transform: "rotate(55deg)" })}/></>;
        case "crown":
            return <div style={__assign(__assign({}, common), { left: "50%", top: "28%", width: size * .52, height: size * .28, transform: "translateX(-50%)", clipPath: "polygon(0 100%, 14% 38%, 30% 68%, 48% 0, 67% 68%, 83% 38%, 100% 100%)", background: accent })}/>;
        case "leaf":
            return <div style={__assign(__assign({}, common), { left: "50%", top: "50%", width: size * .34, height: size * .54, transform: "translate(-50%,-50%) rotate(-18deg)", borderRadius: "70% 0 70% 0", background: accent })}/>;
        default:
            return <><div style={__assign(__assign({}, common), { left: "26%", top: "26%", width: size * .14, height: size * .14, borderRadius: 999, background: accent })}/><div style={__assign(__assign({}, common), { right: "22%", bottom: "24%", width: size * .2, height: size * .2, borderRadius: 999, background: mix(accent, text, .15) })}/></>;
    }
}
function BrandLogoMark(_a) {
    var brand = _a.brand, _b = _a.size, size = _b === void 0 ? 42 : _b, _c = _a.withName, withName = _c === void 0 ? false : _c, _d = _a.emphasize, emphasize = _d === void 0 ? false : _d;
    var safe = (0, brands_1.ensureBrandVisual)(__assign({}, brand));
    var shape = displayShape(safe.visual.shape);
    var textColor = toneText(safe.color);
    var accent = safe.visual.accentColor;
    var motif = displayMotif(safe.visual.motif);
    var baseSize = size;
    return (<div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={__assign(__assign({}, shapeStyle(shape, baseSize)), { background: "linear-gradient(145deg, ".concat(mix(safe.color, "#ffffff", 0.2), " 0%, ").concat(safe.color, " 74%, ").concat(mix(safe.color, "#000000", .12), " 100%)"), boxShadow: emphasize ? "0 10px 22px ".concat(mix(safe.color, "#000000", .55), "44") : "0 5px 12px ".concat(mix(safe.color, "#000000", .58), "22"), border: "1px solid ".concat(mix(safe.color, "#ffffff", .38)) })}>
        <div style={{ position: "absolute", inset: "14%", border: "1px solid ".concat(mix(accent, textColor, .35), "88"), borderRadius: "inherit", opacity: .72 }}/>
        {motifNode(motif, accent, textColor, baseSize)}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: textColor, fontWeight: 900, letterSpacing: .5, fontSize: Math.max(9, baseSize * .29), textAlign: "center", lineHeight: 1.02, textShadow: "0 1px 1px rgba(0,0,0,.12)" }}>
          {safe.visual.textLayout === "stacked"
            ? <span>{safe.name.split(/\s+/).slice(0, 2).map(function (w, i) { return <react_1.default.Fragment key={i}>{w.slice(0, i === 0 ? 3 : 4).toUpperCase()}{i === 0 ? <br /> : null}</react_1.default.Fragment>; })}</span>
            : initials(safe.name)}
        </div>
      </div>
      {withName && <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, color: theme_1.C.ink, fontSize: Math.max(12, size * .32), lineHeight: 1.05 }}>{safe.name}</div><div style={{ color: theme_1.C.faint, fontSize: Math.max(9, size * .18), textTransform: "uppercase", letterSpacing: .7 }}>{safe.positioning}</div></div>}
    </div>);
}
function deriveIPPalette(ip) {
    var h = hashString(ip.name.toLowerCase());
    var palettes = [
        ["#3b82f6", "#a855f7"], ["#ec4899", "#f59e0b"], ["#14b8a6", "#22c55e"], ["#ef4444", "#f97316"], ["#6366f1", "#06b6d4"], ["#8b5cf6", "#f43f5e"],
    ];
    return palettes[h % palettes.length];
}
function IPBadge(_a) {
    var ip = _a.ip, _b = _a.compact, compact = _b === void 0 ? false : _b;
    var _c = deriveIPPalette(ip), a = _c[0], b = _c[1];
    var label = initials(ip.name);
    return <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: compact ? "2px 7px 2px 4px" : "4px 8px 4px 5px", borderRadius: 999, border: "1px solid ".concat(mix(a, "#ffffff", .35), "66"), background: "linear-gradient(135deg, ".concat(mix(a, "#ffffff", .8), " 0%, #ffffff 70%)"), color: theme_1.C.violet }}>
    <div style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: 7, background: "linear-gradient(135deg, ".concat(a, " 0%, ").concat(b, " 100%)"), color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: compact ? 9 : 10, boxShadow: "0 4px 10px ".concat(mix(a, "#000000", .55), "33") }}>{label}</div>
    <span style={{ fontWeight: 800, fontSize: compact ? 10 : 11.5 }}>{ip.name}</span>
  </div>;
}
function qualityFrame(stars) {
    var s = stars !== null && stars !== void 0 ? stars : 3;
    if (s >= 5)
        return { border: "1px solid #e8bc44", glow: "0 0 0 1px rgba(232,188,68,.3), 0 10px 22px rgba(232,188,68,.16)", foil: "#f7d263" };
    if (s >= 4)
        return { border: "1px solid #8c7cff", glow: "0 0 0 1px rgba(140,124,255,.24), 0 8px 18px rgba(124,58,237,.13)", foil: "#b197ff" };
    return { border: "1px solid #b6c6d8", glow: "0 6px 14px rgba(17,32,52,.08)", foil: "#d3dce8" };
}
function ProductPackIcon(_a) {
    var _b, _c;
    var productKey = _a.productKey, brandColor = _a.brandColor, accentColor = _a.accentColor, label = _a.label, ipLabel = _a.ipLabel, packaging = _a.packaging, _d = _a.size, size = _d === void 0 ? 80 : _d;
    var textColor = toneText(brandColor);
    var ipPalette = ipLabel ? deriveIPPalette({ id: "ip", name: ipLabel }) : null;
    var cardH = Math.round(size * 1.12);
    return <div style={{ width: size, height: cardH, borderRadius: 16, background: "linear-gradient(160deg, ".concat(mix(brandColor, "#ffffff", .9), " 0%, #ffffff 48%, ").concat(mix(accentColor, "#ffffff", .9), " 100%)"), border: "1px solid ".concat(mix(brandColor, "#b6c6d8", .58)), boxShadow: "0 6px 14px rgba(17,32,52,.08)", position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
    <img src={productArtUrl(productKey)} alt="" draggable={false} style={{ position: "absolute", inset: "25% 6% 21%", width: "88%", height: "54%", objectFit: "contain", borderRadius: 12 }}/>
    <div style={{ position: "absolute", left: 6, top: 6, maxWidth: "56%", color: textColor, background: brandColor, borderRadius: 999, padding: "3px 6px", fontSize: 7.5, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
    {ipLabel && ipPalette && <div style={{ position: "absolute", right: 6, top: 6, maxWidth: "42%", color: "#fff", background: "linear-gradient(135deg,".concat(ipPalette[0], ",").concat(ipPalette[1], ")"), borderRadius: 999, padding: "3px 6px", fontSize: 7.5, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ipLabel}</div>}
    <div style={{ position: "absolute", left: 7, right: 7, bottom: 7, fontSize: 8, fontWeight: 900, color: theme_1.C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(_c = (_b = (0, productCatalog_1.archetypeByKey)(productKey)) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : productKey}</div>
  </div>;
}
function ProductVisualCard(_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var world = _a.world, sku = _a.sku, _j = _a.size, size = _j === void 0 ? 104 : _j, _k = _a.showLabels, showLabels = _k === void 0 ? true : _k;
    var brand = (0, brands_1.ensureBrandVisual)(__assign({}, (0, brands_1.brandById)(world, sku.brandId)));
    var ip = sku.ipId ? (0, ip_1.ipById)(world, sku.ipId) : null;
    var frame = qualityFrame(sku.manufacturingStars);
    var accentColor = ip ? deriveIPPalette(ip)[1] : (_c = (_b = brand.visual) === null || _b === void 0 ? void 0 : _b.accentColor) !== null && _c !== void 0 ? _c : mix(brand.color, "#ffffff", .4);
    var cardW = size;
    var cardH = Math.round(size * 1.18);
    var stars = Math.max(1, Math.min(5, Math.round((_d = sku.manufacturingStars) !== null && _d !== void 0 ? _d : 3)));
    return <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
    <div style={{ width: cardW, height: cardH, borderRadius: theme_1.UI.radius.lg, background: "linear-gradient(160deg, ".concat(mix(brand.color, "#ffffff", .91), " 0%, #fff 46%, ").concat(mix(accentColor, "#ffffff", .91), " 100%)"), border: frame.border, boxShadow: frame.glow, position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
      <div style={{ position: "absolute", inset: "24% 5% 20%", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,.48)", boxShadow: "inset 0 0 0 1px rgba(112,132,153,.12)" }}>
        <img src={productArtUrl(sku.productKey)} alt={"".concat((_f = (_e = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _e === void 0 ? void 0 : _e.label) !== null && _f !== void 0 ? _f : sku.productKey, " illustration")} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}/>
      </div>
      <div style={{ position: "absolute", left: 7, right: 7, top: 7, display: "flex", justifyContent: "space-between", gap: 5, alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, maxWidth: ip ? "58%" : "78%", background: "rgba(255,255,255,.94)", border: "1px solid ".concat(mix(brand.color, "#ffffff", .52)), borderRadius: 999, padding: "4px 7px 4px 5px", boxShadow: "0 2px 7px rgba(23,37,54,.09)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 999, flex: "0 0 auto", background: "linear-gradient(135deg,".concat(brand.color, ",").concat(accentColor, ")"), border: "1px solid rgba(255,255,255,.75)", boxShadow: "0 1px 3px rgba(17,32,52,.15)" }}/>
          <span style={{ color: theme_1.C.ink, fontSize: 8.3, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{brand.name}</span>
        </div>
        {ip && <div style={{ maxWidth: "40%", fontSize: 7.8, fontWeight: 900, color: deriveIPPalette(ip)[0], background: "rgba(255,255,255,.94)", border: "1px solid ".concat(mix(deriveIPPalette(ip)[0], "#ffffff", .38)), borderRadius: 999, padding: "4px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ip.name}</div>}
      </div>
      <div style={{ position: "absolute", left: 8, right: 8, bottom: 7, display: "grid", gap: 2 }}>
        <div style={{ fontSize: Math.max(8.5, size * .085), fontWeight: 900, color: theme_1.C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 5, alignItems: "center" }}>
          <span style={{ color: theme_1.C.faint, fontSize: Math.max(7, size * .067), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(_h = (_g = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _g === void 0 ? void 0 : _g.label) !== null && _h !== void 0 ? _h : sku.productKey}</span>
          <span style={{ color: stars >= 5 ? "#b77912" : stars >= 4 ? theme_1.C.violet : theme_1.C.dim, fontSize: Math.max(8, size * .075), fontWeight: 900, letterSpacing: .5 }}>{"★".repeat(stars)}</span>
        </div>
      </div>
    </div>
    {showLabels && <div style={{ minWidth: 0 }}><div style={{ color: theme_1.C.ink, fontWeight: 800, fontSize: 13.5 }}>{sku.name}</div><div style={{ color: theme_1.C.faint, fontSize: 10.5 }}>{brand.name}{ip ? " \u00D7 ".concat(ip.name) : ""}</div></div>}
  </div>;
}
function competitorPalette(comp) {
    var _a, _b, _c;
    var h = hashString("".concat(comp.name, "_").concat(comp.personality, "_").concat((_b = (_a = comp.products[0]) === null || _a === void 0 ? void 0 : _a.productKey) !== null && _b !== void 0 ? _b : '').toLowerCase());
    var sets = {
        premium: [["#5b21b6", "#c084fc"], ["#7c3aed", "#f59e0b"], ["#1d4ed8", "#38bdf8"]],
        balanced: [["#0f766e", "#2dd4bf"], ["#2563eb", "#60a5fa"], ["#475569", "#94a3b8"]],
        discounter: [["#b91c1c", "#fb7185"], ["#b45309", "#f59e0b"], ["#065f46", "#34d399"]],
    };
    var group = sets[(_c = comp.personality) !== null && _c !== void 0 ? _c : "balanced"];
    return group[h % group.length];
}
function competitorShape(comp) {
    if (comp.personality === "premium")
        return ["shield", "capsule", "diamond"][hashString(comp.name) % 3];
    if (comp.personality === "discounter")
        return ["square", "hex", "triangle"][hashString(comp.name) % 3];
    return ["circle", "diamond", "hex"][hashString(comp.name) % 3];
}
function competitorMotif(comp) {
    if (comp.personality === "premium")
        return ["crown", "orbit", "spark"][hashString(comp.name) % 3];
    if (comp.personality === "discounter")
        return ["stripe", "bolt", "star"][hashString(comp.name) % 3];
    return ["orbit", "leaf", "star", "stripe"][hashString(comp.name) % 4];
}
function CompetitorLogoMark(_a) {
    var comp = _a.comp, _b = _a.size, size = _b === void 0 ? 34 : _b, _c = _a.withName, withName = _c === void 0 ? false : _c;
    var _d = competitorPalette(comp), base = _d[0], accent = _d[1];
    var shape = competitorShape(comp);
    var motif = competitorMotif(comp);
    var textColor = toneText(base);
    return <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <div style={__assign(__assign({}, shapeStyle(shape, size)), { background: "linear-gradient(180deg, ".concat(mix(base, '#ffffff', .12), " 0%, ").concat(base, " 100%)"), boxShadow: "0 6px 14px ".concat(mix(base, '#000000', .55), "22"), border: "1px solid ".concat(mix(base, '#ffffff', .24)) })}>
      {motifNode(motif, accent, textColor, size)}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: textColor, fontWeight: 900, fontSize: size * .28, transform: shape === "diamond" ? "rotate(-45deg)" : undefined }}>{initials(comp.name)}</div>
    </div>
    {withName && <div style={{ minWidth: 0 }}><div style={{ color: theme_1.C.ink, fontWeight: 800, fontSize: Math.max(11, size * .32) }}>{comp.name}</div><div style={{ color: theme_1.C.faint, fontSize: 10.2, textTransform: "uppercase", letterSpacing: .55 }}>{comp.personality}</div></div>}
  </div>;
}
function CompetitorChip(_a) {
    var comp = _a.comp;
    return <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 8px", borderRadius: 999, background: "#ffffff", border: "1px solid ".concat(theme_1.C.line), boxShadow: "0 2px 8px rgba(17,32,52,.05)" }}><CompetitorLogoMark comp={comp} size={22}/><span style={{ color: theme_1.C.ink, fontWeight: 700, fontSize: 11.5 }}>{comp.name}</span></div>;
}
function CompetitorCard(_a) {
    var _b, _c, _d, _e;
    var comp = _a.comp, _f = _a.size, size = _f === void 0 ? 80 : _f;
    var _g = competitorPalette(comp), base = _g[0], accent = _g[1];
    var firstProduct = (_c = (_b = comp.products[0]) === null || _b === void 0 ? void 0 : _b.productKey) !== null && _c !== void 0 ? _c : "";
    var productLabel = (_e = (_d = (0, productCatalog_1.archetypeByKey)(firstProduct)) === null || _d === void 0 ? void 0 : _d.label) !== null && _e !== void 0 ? _e : firstProduct;
    return <div style={{ background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)", border: "1px solid ".concat(theme_1.C.line), borderRadius: 14, padding: 12, boxShadow: "0 6px 16px rgba(17,32,52,.05)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <CompetitorLogoMark comp={comp} size={38} withName/>
      <span style={{ color: comp.personality === 'premium' ? '#7c3aed' : comp.personality === 'discounter' ? '#d97706' : theme_1.C.cyan, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .65 }}>{comp.personality}</span>
    </div>
    <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
      <ProductPackIcon productKey={firstProduct} brandColor={base} accentColor={accent} label={comp.name} size={size}/>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: theme_1.C.ink, fontWeight: 800, fontSize: 12.5 }}>{productLabel || "Core line"}</div>
        <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 2 }}>Price ${comp.price.toFixed(0)} · Quality {Math.round(comp.quality * 100)}</div>
        <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 2 }}>Strength {Math.round(comp.strength * 100)} · Mkt/Q ${Math.round(comp.marketing).toLocaleString()}</div>
      </div>
    </div>
  </div>;
}
