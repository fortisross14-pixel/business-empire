import React from "react";
import type {
  Brand,
  BrandLogoMotif,
  BrandLogoShape,
  Competitor,
  IPAsset,
  SKU,
  World,
} from "../engine/types";
import { archetypeByKey } from "../engine/productCatalog";
import { brandById, ensureBrandVisual } from "../engine/brands";
import { ipById } from "../engine/ip";
import { C, UI } from "./theme";


const PRODUCT_ART_BASE = `${((import.meta as any).env?.BASE_URL as string | undefined) ?? "/"}assets/products/`;
function productArtUrl(productKey: string) { return `${PRODUCT_ART_BASE}${productKey}.svg`; }

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 33 + input.charCodeAt(i)) >>> 0;
  return h;
}

function normalizeHex(hex: string): string {
  if (!hex) return "#7c3aed";
  const clean = hex.replace("#", "");
  if (clean.length === 3) return `#${clean.split("").map((c) => c + c).join("")}`;
  return `#${clean.padEnd(6, "0").slice(0, 6)}`;
}

export function mix(a: string, b: string, ratio: number): string {
  const aa = normalizeHex(a);
  const bb = normalizeHex(b);
  const pa = parseInt(aa.slice(1), 16);
  const pb = parseInt(bb.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bbv = pb & 255;
  const m = (x: number, y: number) => Math.round(x * (1 - ratio) + y * ratio);
  return `#${[m(ar, br), m(ag, bg), m(ab, bbv)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function toneText(bg: string): string {
  const n = parseInt(normalizeHex(bg).slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#112034" : "#ffffff";
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "B";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function displayShape(shape: BrandLogoShape): BrandLogoShape {
  if (shape === "diamond") return "hex";
  if (shape === "triangle") return "circle";
  if (shape === "capsule") return "square";
  return shape;
}

function displayMotif(motif: BrandLogoMotif): BrandLogoMotif {
  if (motif === "crown" || motif === "star") return "spark";
  if (motif === "bolt") return "stripe";
  return motif;
}

function shapeStyle(shape: BrandLogoShape, size: number): React.CSSProperties {
  const base: React.CSSProperties = { width: size, height: size, position: "relative", overflow: "hidden", flex: "0 0 auto", boxSizing: "border-box" };
  switch (shape) {
    case "circle": return { ...base, borderRadius: "999px" };
    case "shield": return { ...base, borderRadius: "35% 35% 45% 45%", clipPath: "polygon(12% 0%, 88% 0%, 100% 24%, 92% 76%, 50% 100%, 8% 76%, 0% 24%)" };
    case "hex": return { ...base, clipPath: "polygon(22% 0%, 78% 0%, 100% 50%, 78% 100%, 22% 100%, 0% 50%)" };
    default: return { ...base, borderRadius: UI.radius.md };
  }
}

function motifNode(motif: BrandLogoMotif, accent: string, text: string, size: number): React.ReactNode {
  const common = { position: "absolute" as const, opacity: 0.92 };
  switch (motif) {
    case "stripe":
      return <div style={{ ...common, inset: 0, background: `linear-gradient(135deg, transparent 12%, ${accent} 12%, ${accent} 24%, transparent 24%, transparent 43%, ${mix(accent, text, .2)} 43%, ${mix(accent, text, .2)} 55%, transparent 55%)` }} />;
    case "star":
      return <div style={{ ...common, left: "50%", top: "50%", width: size * .48, height: size * .48, transform: "translate(-50%,-50%)", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 92%, 50% 71%, 21% 92%, 32% 57%, 2% 35%, 39% 35%)", background: accent }} />;
    case "bolt":
      return <div style={{ ...common, left: "50%", top: "50%", width: size * .32, height: size * .58, transform: "translate(-50%,-50%)", clipPath: "polygon(45% 0%, 100% 0%, 62% 42%, 85% 42%, 25% 100%, 42% 58%, 18% 58%)", background: accent }} />;
    case "orbit":
      return <><div style={{ ...common, inset: "18% 8%", border: `2px solid ${accent}`, borderRadius: "50%" }} /><div style={{ ...common, inset: "18% 8%", border: `2px solid ${accent}`, borderRadius: "50%", transform: "rotate(55deg)" }} /></>;
    case "crown":
      return <div style={{ ...common, left: "50%", top: "28%", width: size * .52, height: size * .28, transform: "translateX(-50%)", clipPath: "polygon(0 100%, 14% 38%, 30% 68%, 48% 0, 67% 68%, 83% 38%, 100% 100%)", background: accent }} />;
    case "leaf":
      return <div style={{ ...common, left: "50%", top: "50%", width: size * .34, height: size * .54, transform: "translate(-50%,-50%) rotate(-18deg)", borderRadius: "70% 0 70% 0", background: accent }} />;
    default:
      return <><div style={{ ...common, left: "26%", top: "26%", width: size * .14, height: size * .14, borderRadius: 999, background: accent }} /><div style={{ ...common, right: "22%", bottom: "24%", width: size * .2, height: size * .2, borderRadius: 999, background: mix(accent, text, .15) }} /></>;
  }
}

export function BrandLogoMark({ brand, size = 42, withName = false, emphasize = false }: { brand: Brand; size?: number; withName?: boolean; emphasize?: boolean }) {
  const safe = ensureBrandVisual({ ...brand });
  const shape = displayShape(safe.visual!.shape);
  const textColor = toneText(safe.color);
  const accent = safe.visual!.accentColor;
  const motif = displayMotif(safe.visual!.motif);
  const baseSize = size;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{ ...shapeStyle(shape, baseSize), background: `linear-gradient(145deg, ${mix(safe.color, "#ffffff", 0.2)} 0%, ${safe.color} 74%, ${mix(safe.color, "#000000", .12)} 100%)`, boxShadow: emphasize ? `0 10px 22px ${mix(safe.color, "#000000", .55)}44` : `0 5px 12px ${mix(safe.color, "#000000", .58)}22`, border: `1px solid ${mix(safe.color, "#ffffff", .38)}` }}>
        <div style={{ position: "absolute", inset: "14%", border: `1px solid ${mix(accent, textColor, .35)}88`, borderRadius: "inherit", opacity: .72 }} />
        {motifNode(motif, accent, textColor, baseSize)}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: textColor, fontWeight: 900, letterSpacing: .5, fontSize: Math.max(9, baseSize * .29), textAlign: "center", lineHeight: 1.02, textShadow: "0 1px 1px rgba(0,0,0,.12)" }}>
          {safe.visual!.textLayout === "stacked"
            ? <span>{safe.name.split(/\s+/).slice(0, 2).map((w, i) => <React.Fragment key={i}>{w.slice(0, i === 0 ? 3 : 4).toUpperCase()}{i === 0 ? <br /> : null}</React.Fragment>)}</span>
            : initials(safe.name)}
        </div>
      </div>
      {withName && <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, color: C.ink, fontSize: Math.max(12, size * .32), lineHeight: 1.05 }}>{safe.name}</div><div style={{ color: C.faint, fontSize: Math.max(9, size * .18), textTransform: "uppercase", letterSpacing: .7 }}>{safe.positioning}</div></div>}
    </div>
  );
}

function deriveIPPalette(ip: IPAsset) {
  const h = hashString(ip.name.toLowerCase());
  const palettes = [
    ["#3b82f6", "#a855f7"], ["#ec4899", "#f59e0b"], ["#14b8a6", "#22c55e"], ["#ef4444", "#f97316"], ["#6366f1", "#06b6d4"], ["#8b5cf6", "#f43f5e"],
  ];
  return palettes[h % palettes.length];
}

export function IPBadge({ ip, compact = false }: { ip: IPAsset; compact?: boolean }) {
  const [a, b] = deriveIPPalette(ip);
  const label = initials(ip.name);
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: compact ? "2px 7px 2px 4px" : "4px 8px 4px 5px", borderRadius: 999, border: `1px solid ${mix(a, "#ffffff", .35)}66`, background: `linear-gradient(135deg, ${mix(a, "#ffffff", .8)} 0%, #ffffff 70%)`, color: C.violet }}>
    <div style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: 7, background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`, color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: compact ? 9 : 10, boxShadow: `0 4px 10px ${mix(a, "#000000", .55)}33` }}>{label}</div>
    <span style={{ fontWeight: 800, fontSize: compact ? 10 : 11.5 }}>{ip.name}</span>
  </div>;
}

function qualityFrame(stars: number | undefined) {
  const s = stars ?? 3;
  if (s >= 5) return { border: "1px solid #e8bc44", glow: "0 0 0 1px rgba(232,188,68,.3), 0 10px 22px rgba(232,188,68,.16)", foil: "#f7d263" };
  if (s >= 4) return { border: "1px solid #8c7cff", glow: "0 0 0 1px rgba(140,124,255,.24), 0 8px 18px rgba(124,58,237,.13)", foil: "#b197ff" };
  return { border: "1px solid #b6c6d8", glow: "0 6px 14px rgba(17,32,52,.08)", foil: "#d3dce8" };
}

export function ProductPackIcon({ productKey, brandColor, accentColor, label, ipLabel, packaging, size = 80 }: { productKey: string; brandColor: string; accentColor: string; label: string; ipLabel?: string | null; packaging?: string; size?: number }) {
  const textColor = toneText(brandColor);
  const ipPalette = ipLabel ? deriveIPPalette({ id: "ip", name: ipLabel } as IPAsset) : null;
  const cardH = Math.round(size * 1.12);
  return <div style={{ width: size, height: cardH, borderRadius: 16, background: `linear-gradient(160deg, ${mix(brandColor, "#ffffff", .9)} 0%, #ffffff 48%, ${mix(accentColor, "#ffffff", .9)} 100%)`, border: `1px solid ${mix(brandColor, "#b6c6d8", .58)}`, boxShadow: "0 6px 14px rgba(17,32,52,.08)", position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
    <img src={productArtUrl(productKey)} alt="" draggable={false} style={{ position: "absolute", inset: "25% 6% 21%", width: "88%", height: "54%", objectFit: "contain", borderRadius: 12 }} />
    <div style={{ position: "absolute", left: 6, top: 6, maxWidth: "56%", color: textColor, background: brandColor, borderRadius: 999, padding: "3px 6px", fontSize: 7.5, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
    {ipLabel && ipPalette && <div style={{ position: "absolute", right: 6, top: 6, maxWidth: "42%", color: "#fff", background: `linear-gradient(135deg,${ipPalette[0]},${ipPalette[1]})`, borderRadius: 999, padding: "3px 6px", fontSize: 7.5, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ipLabel}</div>}
    <div style={{ position: "absolute", left: 7, right: 7, bottom: 7, fontSize: 8, fontWeight: 900, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{archetypeByKey(productKey)?.label ?? productKey}</div>
  </div>;
}

export function ProductVisualCard({ world, sku, size = 104, showLabels = true }: { world: World; sku: SKU; size?: number; showLabels?: boolean }) {
  const brand = ensureBrandVisual({ ...brandById(world, sku.brandId) });
  const ip = sku.ipId ? ipById(world, sku.ipId) : null;
  const frame = qualityFrame(sku.manufacturingStars);
  const accentColor = ip ? deriveIPPalette(ip)[1] : brand.visual?.accentColor ?? mix(brand.color, "#ffffff", .4);
  const cardW = size;
  const cardH = Math.round(size * 1.18);
  const stars = Math.max(1, Math.min(5, Math.round(sku.manufacturingStars ?? 3)));
  return <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
    <div style={{ width: cardW, height: cardH, borderRadius: UI.radius.lg, background: `linear-gradient(160deg, ${mix(brand.color, "#ffffff", .91)} 0%, #fff 46%, ${mix(accentColor, "#ffffff", .91)} 100%)`, border: frame.border, boxShadow: frame.glow, position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
      <div style={{ position: "absolute", inset: "24% 5% 20%", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,.48)", boxShadow: "inset 0 0 0 1px rgba(112,132,153,.12)" }}>
        <img src={productArtUrl(sku.productKey)} alt={`${archetypeByKey(sku.productKey)?.label ?? sku.productKey} illustration`} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: 7, right: 7, top: 7, display: "flex", justifyContent: "space-between", gap: 5, alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, maxWidth: ip ? "58%" : "78%", background: "rgba(255,255,255,.94)", border: `1px solid ${mix(brand.color, "#ffffff", .52)}`, borderRadius: 999, padding: "4px 7px 4px 5px", boxShadow: "0 2px 7px rgba(23,37,54,.09)" }}>
          <span style={{ width: 11, height: 11, borderRadius: 999, flex: "0 0 auto", background: `linear-gradient(135deg,${brand.color},${accentColor})`, border: "1px solid rgba(255,255,255,.75)", boxShadow: "0 1px 3px rgba(17,32,52,.15)" }} />
          <span style={{ color: C.ink, fontSize: 8.3, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{brand.name}</span>
        </div>
        {ip && <div style={{ maxWidth: "40%", fontSize: 7.8, fontWeight: 900, color: deriveIPPalette(ip)[0], background: "rgba(255,255,255,.94)", border: `1px solid ${mix(deriveIPPalette(ip)[0], "#ffffff", .38)}`, borderRadius: 999, padding: "4px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ip.name}</div>}
      </div>
      <div style={{ position: "absolute", left: 8, right: 8, bottom: 7, display: "grid", gap: 2 }}>
        <div style={{ fontSize: Math.max(8.5, size * .085), fontWeight: 900, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 5, alignItems: "center" }}>
          <span style={{ color: C.faint, fontSize: Math.max(7, size * .067), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{archetypeByKey(sku.productKey)?.label ?? sku.productKey}</span>
          <span style={{ color: stars >= 5 ? "#b77912" : stars >= 4 ? C.violet : C.dim, fontSize: Math.max(8, size * .075), fontWeight: 900, letterSpacing: .5 }}>{"★".repeat(stars)}</span>
        </div>
      </div>
    </div>
    {showLabels && <div style={{ minWidth: 0 }}><div style={{ color: C.ink, fontWeight: 800, fontSize: 13.5 }}>{sku.name}</div><div style={{ color: C.faint, fontSize: 10.5 }}>{brand.name}{ip ? ` × ${ip.name}` : ""}</div></div>}
  </div>;
}

function competitorPalette(comp: Competitor) {
  const h = hashString(`${comp.name}_${comp.personality}_${comp.products[0]?.productKey ?? ''}`.toLowerCase());
  const sets = {
    premium: [["#5b21b6", "#c084fc"], ["#7c3aed", "#f59e0b"], ["#1d4ed8", "#38bdf8"]],
    balanced: [["#0f766e", "#2dd4bf"], ["#2563eb", "#60a5fa"], ["#475569", "#94a3b8"]],
    discounter: [["#b91c1c", "#fb7185"], ["#b45309", "#f59e0b"], ["#065f46", "#34d399"]],
  } as const;
  const group = sets[comp.personality ?? "balanced"];
  return group[h % group.length];
}

function competitorShape(comp: Competitor): BrandLogoShape {
  if (comp.personality === "premium") return ["shield", "capsule", "diamond"][hashString(comp.name) % 3] as BrandLogoShape;
  if (comp.personality === "discounter") return ["square", "hex", "triangle"][hashString(comp.name) % 3] as BrandLogoShape;
  return ["circle", "diamond", "hex"][hashString(comp.name) % 3] as BrandLogoShape;
}

function competitorMotif(comp: Competitor): BrandLogoMotif {
  if (comp.personality === "premium") return ["crown", "orbit", "spark"][hashString(comp.name) % 3] as BrandLogoMotif;
  if (comp.personality === "discounter") return ["stripe", "bolt", "star"][hashString(comp.name) % 3] as BrandLogoMotif;
  return ["orbit", "leaf", "star", "stripe"][hashString(comp.name) % 4] as BrandLogoMotif;
}

export function CompetitorLogoMark({ comp, size = 34, withName = false }: { comp: Competitor; size?: number; withName?: boolean }) {
  const [base, accent] = competitorPalette(comp);
  const shape = competitorShape(comp);
  const motif = competitorMotif(comp);
  const textColor = toneText(base);
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <div style={{ ...shapeStyle(shape, size), background: `linear-gradient(180deg, ${mix(base, '#ffffff', .12)} 0%, ${base} 100%)`, boxShadow: `0 6px 14px ${mix(base, '#000000', .55)}22`, border: `1px solid ${mix(base, '#ffffff', .24)}` }}>
      {motifNode(motif, accent, textColor, size)}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: textColor, fontWeight: 900, fontSize: size * .28, transform: shape === "diamond" ? "rotate(-45deg)" : undefined }}>{initials(comp.name)}</div>
    </div>
    {withName && <div style={{ minWidth: 0 }}><div style={{ color: C.ink, fontWeight: 800, fontSize: Math.max(11, size * .32) }}>{comp.name}</div><div style={{ color: C.faint, fontSize: 10.2, textTransform: "uppercase", letterSpacing: .55 }}>{comp.personality}</div></div>}
  </div>;
}

export function CompetitorChip({ comp }: { comp: Competitor }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 8px", borderRadius: 999, background: "#ffffff", border: `1px solid ${C.line}`, boxShadow: "0 2px 8px rgba(17,32,52,.05)" }}><CompetitorLogoMark comp={comp} size={22} /><span style={{ color: C.ink, fontWeight: 700, fontSize: 11.5 }}>{comp.name}</span></div>;
}

export function CompetitorCard({ comp, size = 80 }: { comp: Competitor; size?: number }) {
  const [base, accent] = competitorPalette(comp);
  const firstProduct = comp.products[0]?.productKey ?? "";
  const productLabel = archetypeByKey(firstProduct)?.label ?? firstProduct;
  return <div style={{ background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)", border: `1px solid ${C.line}`, borderRadius: 14, padding: 12, boxShadow: "0 6px 16px rgba(17,32,52,.05)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <CompetitorLogoMark comp={comp} size={38} withName />
      <span style={{ color: comp.personality === 'premium' ? '#7c3aed' : comp.personality === 'discounter' ? '#d97706' : C.cyan, fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .65 }}>{comp.personality}</span>
    </div>
    <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
      <ProductPackIcon productKey={firstProduct} brandColor={base} accentColor={accent} label={comp.name} size={size} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: C.ink, fontWeight: 800, fontSize: 12.5 }}>{productLabel || "Core line"}</div>
        <div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>Price ${comp.price.toFixed(0)} · Quality {Math.round(comp.quality * 100)}</div>
        <div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>Strength {Math.round(comp.strength * 100)} · Mkt/Q ${Math.round(comp.marketing).toLocaleString()}</div>
      </div>
    </div>
  </div>;
}
