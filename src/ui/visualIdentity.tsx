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

type ProductBaseKind =
  | "blister"
  | "building_box"
  | "boardgame"
  | "plush"
  | "doll_box"
  | "vehicle_box"
  | "collectible_box"
  | "electronic_box"
  | "jar"
  | "luxury_jar"
  | "dropper_bottle"
  | "pump_bottle"
  | "tube"
  | "pouch"
  | "generic";

function baseKindForProductKey(productKey: string): ProductBaseKind {
  const key = productKey.toLowerCase();
  if (key.includes("action") || key.includes("fig")) return "blister";
  if (key.includes("building")) return "building_box";
  if (key.includes("board")) return "boardgame";
  if (key.includes("plush")) return "plush";
  if (key.includes("doll")) return "doll_box";
  if (key.includes("vehicle") || key.includes("car")) return "vehicle_box";
  if (key.includes("collectible")) return "collectible_box";
  if (key.includes("electronic")) return "electronic_box";
  if (key.includes("moisturizer")) return "jar";
  if (key.includes("antiaging") || key.includes("eye")) return "luxury_jar";
  if (key.includes("serum")) return "dropper_bottle";
  if (key.includes("cleanser") || key.includes("hydration") || key.includes("sunscreen") || key.includes("acne")) return "tube";
  if (key.includes("mask")) return "pouch";
  const archetype = archetypeByKey(productKey);
  if (archetype?.industryId === "toys") return "building_box";
  if (archetype?.industryId === "skincare") return "pump_bottle";
  return "generic";
}

function qualityFrame(stars: number | undefined) {
  const s = stars ?? 3;
  if (s >= 5) return { border: "1px solid #e8bc44", glow: "0 0 0 1px rgba(232,188,68,.3), 0 10px 22px rgba(232,188,68,.16)", foil: "#f7d263" };
  if (s >= 4) return { border: "1px solid #8c7cff", glow: "0 0 0 1px rgba(140,124,255,.24), 0 8px 18px rgba(124,58,237,.13)", foil: "#b197ff" };
  return { border: "1px solid #b6c6d8", glow: "0 6px 14px rgba(17,32,52,.08)", foil: "#d3dce8" };
}

function packagingTone(packaging?: string) {
  switch (packaging) {
    case "premium": return { stripe: 0.08, gloss: 0.26 };
    case "techy": return { stripe: 0.18, gloss: 0.18 };
    case "colorful": return { stripe: 0.24, gloss: 0.12 };
    case "bold": return { stripe: 0.28, gloss: 0.10 };
    case "natural": return { stripe: 0.10, gloss: 0.08 };
    case "retro": return { stripe: 0.15, gloss: 0.14 };
    case "serious": return { stripe: 0.06, gloss: 0.12 };
    default: return { stripe: 0.12, gloss: 0.16 };
  }
}

function productTheme(productKey: string, base: string, accent: string, packaging?: string) {
  const tone = packagingTone(packaging);
  const isToy = archetypeByKey(productKey)?.industryId === "toys";
  return {
    shell: isToy ? mix(base, "#ffffff", 0.80 - tone.gloss) : mix(base, "#ffffff", 0.72 - tone.gloss),
    shell2: isToy ? mix(accent, "#ffffff", 0.72) : mix(base, "#ffffff", 0.84),
    stripe: isToy ? mix(accent, "#ffffff", 0.12 + tone.stripe * 0.7) : mix(base, accent, 0.34),
    accent: accent,
    base: base,
  };
}

function PackageBrandHeader({ label, color, textColor }: { label: string; color: string; textColor: string }) {
  return <div style={{ position: "absolute", inset: "10% 9% auto", height: "16%", borderRadius: 8, background: `linear-gradient(90deg, ${color} 0%, ${mix(color, "#ffffff", .18)} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: textColor, fontWeight: 900, fontSize: 9.5, letterSpacing: .25, textTransform: "uppercase", overflow: "hidden" }}>{label}</div>;
}

function PackageIPSticker({ label, a, b }: { label: string; a: string; b: string }) {
  return <div style={{ position: "absolute", right: "9%", top: "11%", minWidth: "18%", maxWidth: "34%", borderRadius: 999, background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`, color: "#fff", fontSize: 7.5, fontWeight: 900, padding: "3px 6px", textAlign: "center", boxShadow: `0 4px 10px ${mix(a, "#000000", .55)}22` }}>{label}</div>;
}

function productHero(kind: ProductBaseKind, colors: { base: string; accent: string; text: string }, size: number) {
  const common: React.CSSProperties = { position: "relative", width: size, height: size, flex: "0 0 auto" };
  switch (kind) {
    case "blister":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#fbfdff 0%,#eef4fb 100%)", border: "1px solid #d6e1ef", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "15%", top: "28%", width: "70%", height: "58%", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.85),rgba(227,236,246,.72))", border: "1px solid rgba(189,203,218,.95)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.4)" }} />
        <div style={{ position: "absolute", left: "32%", top: "39%", width: "22%", height: "26%", borderRadius: 18, background: colors.accent }} />
        <div style={{ position: "absolute", left: "38%", top: "35%", width: "11%", height: "8%", borderRadius: 999, background: colors.base }} />
        <div style={{ position: "absolute", left: "59%", top: "41%", width: "10%", height: "8%", borderRadius: 999, background: mix(colors.base, "#ffffff", .2) }} />
        <div style={{ position: "absolute", left: "59%", top: "54%", width: "10%", height: "8%", borderRadius: 999, background: mix(colors.base, "#ffffff", .2) }} />
      </div>;
    case "building_box":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f0f6ff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "34% 13% 14%", borderRadius: 13, background: `linear-gradient(180deg, ${mix(colors.accent, '#ffffff', .18)} 0%, ${mix(colors.base, '#ffffff', .55)} 100%)` }} />
        {[0,1,2,3].map((i) => <div key={i} style={{ position: "absolute", left: `${17 + i * 15}%`, top: i % 2 === 0 ? "47%" : "57%", width: i === 3 ? "22%" : "16%", height: "12%", borderRadius: 4, background: i % 2 === 0 ? colors.accent : mix(colors.base, '#ffffff', .26) }} />)}
      </div>;
    case "boardgame":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f4f8ff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "37% 15% 16%", borderRadius: 12, background: `linear-gradient(180deg, ${mix(colors.accent, '#ffffff', .12)} 0%, ${mix(colors.base, '#ffffff', .48)} 100%)` }} />
        <div style={{ position: "absolute", left: "22%", top: "45%", width: "56%", height: "20%", borderRadius: 9, border: `2px solid ${mix(colors.base, '#ffffff', .16)}` }} />
        {[0,1,2].map((i) => <div key={i} style={{ position: "absolute", left: `${26 + i * 16}%`, top: `${49 + (i%2)*8}%`, width: "8%", height: "8%", borderRadius: 999, background: i === 1 ? colors.accent : colors.base }} />)}
      </div>;
    case "plush":
      return <div style={{ ...common, display: "grid", placeItems: "center" }}>
        <div style={{ width: size * .62, height: size * .60, borderRadius: "42%", background: `linear-gradient(180deg, ${mix(colors.accent, '#ffffff', .22)} 0%, ${colors.accent} 100%)`, position: "relative", boxShadow: "0 6px 14px rgba(0,0,0,.08)" }}>
          <div style={{ position: "absolute", width: size * .17, height: size * .17, background: colors.accent, borderRadius: 999, left: "8%", top: "-3%" }} />
          <div style={{ position: "absolute", width: size * .17, height: size * .17, background: colors.accent, borderRadius: 999, right: "8%", top: "-3%" }} />
          <div style={{ position: "absolute", left: "28%", top: "42%", width: size * .06, height: size * .06, background: colors.base, borderRadius: 999 }} />
          <div style={{ position: "absolute", right: "28%", top: "42%", width: size * .06, height: size * .06, background: colors.base, borderRadius: 999 }} />
        </div>
      </div>;
    case "doll_box":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f6f7ff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "21%", top: "28%", width: "58%", height: "58%", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.86),rgba(230,236,251,.78))", border: "1px solid rgba(189,203,218,.95)" }} />
        <div style={{ position: "absolute", left: "39%", top: "38%", width: "18%", height: "26%", borderRadius: 18, background: colors.accent }} />
        <div style={{ position: "absolute", left: "43%", top: "31%", width: "10%", height: "11%", borderRadius: 999, background: mix(colors.base, '#ffffff', .08) }} />
      </div>;
    case "vehicle_box":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f4fbff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "42% 17% 22%", borderRadius: 18, background: mix(colors.base, '#ffffff', .08) }} />
        <div style={{ position: "absolute", left: "24%", top: "48%", width: "44%", height: "14%", borderRadius: 12, background: colors.accent }} />
        <div style={{ position: "absolute", left: "61%", top: "50%", width: "12%", height: "10%", borderRadius: 8, background: colors.accent }} />
        <div style={{ position: "absolute", left: "28%", bottom: "20%", width: "12%", height: "12%", borderRadius: 999, background: colors.base }} />
        <div style={{ position: "absolute", right: "25%", bottom: "20%", width: "12%", height: "12%", borderRadius: 999, background: colors.base }} />
      </div>;
    case "collectible_box":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f4f8ff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "35% 20% 16%", borderRadius: 14, background: `linear-gradient(180deg, ${mix(colors.accent, '#ffffff', .16)} 0%, ${mix(colors.base, '#ffffff', .5)} 100%)` }} />
        <div style={{ position: "absolute", left: "34%", top: "44%", width: "32%", height: "22%", borderRadius: 999, background: colors.accent }} />
        <div style={{ position: "absolute", left: "43%", top: "51%", width: "14%", height: "8%", borderRadius: 999, background: mix(colors.base, '#ffffff', .18) }} />
      </div>;
    case "electronic_box":
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f3f8ff 100%)", border: "1px solid #d8e2ee", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "38% 20% 18%", borderRadius: 13, background: `linear-gradient(180deg, ${mix(colors.base, '#ffffff', .55)} 0%, ${mix(colors.base, '#0f172a', .12)} 100%)` }} />
        <div style={{ position: "absolute", left: "31%", top: "47%", width: "38%", height: "16%", borderRadius: 10, background: mix(colors.accent, '#ffffff', .22) }} />
        {[0,1,2].map((i) => <div key={i} style={{ position: "absolute", left: `${35 + i * 11}%`, top: "51%", width: "5%", height: "5%", borderRadius: 999, background: colors.base }} />)}
      </div>;
    case "jar":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .76, height: size * .60, borderRadius: 18, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .7)} 100%)`, border: "1px solid #d6dfeb", position: "relative" }}>
          <div style={{ position: "absolute", left: "9%", right: "9%", top: "-14%", height: "26%", borderRadius: 11, background: mix(colors.base, "#1a2330", .2) }} />
          <div style={{ position: "absolute", left: "12%", right: "12%", top: "39%", height: "22%", borderRadius: 8, background: colors.base }} />
        </div>
      </div>;
    case "luxury_jar":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .76, height: size * .58, borderRadius: 18, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .78)} 100%)`, border: "1px solid #d6dfeb", position: "relative", boxShadow: "0 7px 15px rgba(0,0,0,.06)" }}>
          <div style={{ position: "absolute", left: "12%", right: "12%", top: "-16%", height: "28%", borderRadius: 11, background: `linear-gradient(180deg, ${mix(colors.base, '#1a2330', .16)} 0%, ${mix(colors.accent, '#1a2330', .26)} 100%)` }} />
          <div style={{ position: "absolute", left: "17%", right: "17%", top: "40%", height: "18%", borderRadius: 8, background: colors.accent }} />
        </div>
      </div>;
    case "dropper_bottle":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .46, height: size * .76, borderRadius: 18, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .68)} 100%)`, border: "1px solid #d6dfeb", position: "relative" }}>
          <div style={{ position: "absolute", left: "28%", top: "-11%", width: "44%", height: "16%", borderRadius: 8, background: mix(colors.base, '#0f172a', .26) }} />
          <div style={{ position: "absolute", left: "37%", top: "-22%", width: "26%", height: "14%", borderRadius: 8, background: mix(colors.base, '#0f172a', .1) }} />
          <div style={{ position: "absolute", left: "12%", right: "12%", top: "40%", height: "18%", borderRadius: 8, background: colors.base }} />
        </div>
      </div>;
    case "pump_bottle":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .44, height: size * .78, borderRadius: 18, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .72)} 100%)`, border: "1px solid #d6dfeb", position: "relative" }}>
          <div style={{ position: "absolute", left: "22%", top: "-6%", width: "56%", height: "10%", borderRadius: 10, background: mix(colors.base, '#0f172a', .18) }} />
          <div style={{ position: "absolute", left: "58%", top: "-12%", width: "22%", height: "5%", borderRadius: 7, background: mix(colors.base, '#0f172a', .18) }} />
          <div style={{ position: "absolute", left: "12%", right: "12%", top: "38%", height: "20%", borderRadius: 8, background: colors.base }} />
        </div>
      </div>;
    case "tube":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .52, height: size * .78, clipPath: "polygon(18% 0%, 82% 0%, 100% 84%, 0% 84%)", borderRadius: 16, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .68)} 100%)`, border: "1px solid #d6dfeb", position: "relative" }}>
          <div style={{ position: "absolute", left: "14%", right: "14%", top: "34%", height: "18%", borderRadius: 8, background: colors.base }} />
          <div style={{ position: "absolute", left: "22%", right: "22%", bottom: "4%", height: "8%", borderRadius: 6, background: mix(colors.base, '#1a2330', .22) }} />
        </div>
      </div>;
    case "pouch":
      return <div style={{ ...common, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: size * .62, height: size * .72, borderRadius: 14, background: `linear-gradient(180deg,#ffffff 0%, ${mix(colors.base, '#ffffff', .72)} 100%)`, border: "1px solid #d6dfeb", position: "relative" }}>
          <div style={{ position: "absolute", left: "10%", right: "10%", top: "8%", height: "5%", borderRadius: 999, background: mix(colors.base, '#0f172a', .08) }} />
          <div style={{ position: "absolute", left: "14%", right: "14%", top: "38%", height: "18%", borderRadius: 8, background: colors.base }} />
        </div>
      </div>;
    default:
      return <div style={{ ...common, borderRadius: 16, background: "linear-gradient(180deg,#ffffff 0%,#f4f8fd 100%)", border: "1px solid #d6e1ef" }} />;
  }
}

export function ProductPackIcon({ productKey, brandColor, accentColor, label, ipLabel, packaging, size = 80 }: { productKey: string; brandColor: string; accentColor: string; label: string; ipLabel?: string | null; packaging?: string; size?: number }) {
  const kind = baseKindForProductKey(productKey);
  const textColor = toneText(brandColor);
  const cardW = Math.round(size * .92);
  const theme = productTheme(productKey, brandColor, accentColor, packaging);
  const fauxIP: IPAsset | null = ipLabel ? { id: "ip", name: ipLabel, awareness: 0, momentum: 0, fatigue: 0, prestige: 0, ownerType: "external", ownerName: "", audience: "all", audienceLabel: "All", compatibleProductKeys: [] } as any : null;
  const ipPalette = fauxIP ? deriveIPPalette(fauxIP) : null;
  return <div style={{ width: cardW, height: size, borderRadius: 18, background: "linear-gradient(180deg,#ffffff 0%,#f7faff 100%)", border: `1px solid ${mix(brandColor, '#b6c6d8', .55)}`, boxShadow: "0 6px 14px rgba(17,32,52,.08)", position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
    <div style={{ position: "absolute", inset: 0, background: ipPalette ? `linear-gradient(160deg, ${mix(brandColor, '#ffffff', .83)} 0%, #ffffff 36%, ${mix(ipPalette[0], '#ffffff', .72)} 100%)` : `linear-gradient(180deg,#ffffff 0%, ${mix(brandColor, '#ffffff', .9)} 100%)` }} />
    <div style={{ position: "absolute", inset: "28px 10px 8px", display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative" }}>
        {productHero(kind, { base: theme.base, accent: theme.accent, text: textColor }, size * .62)}
        <div style={{ position: "absolute", inset: 0 }}>
          <PackageBrandHeader label={label} color={brandColor} textColor={textColor} />
          {ipPalette && ipLabel ? <PackageIPSticker label={ipLabel} a={ipPalette[0]} b={ipPalette[1]} /> : null}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, transparent 0%, transparent 52%, ${mix(theme.stripe, '#ffffff', .1)}33 52%, transparent 62%)` }} />
        </div>
      </div>
    </div>
  </div>;
}

export function ProductVisualCard({ world, sku, size = 88, showLabels = true }: { world: World; sku: SKU; size?: number; showLabels?: boolean }) {
  const brand = ensureBrandVisual({ ...brandById(world, sku.brandId) });
  const ip = sku.ipId ? ipById(world, sku.ipId) : null;
  const textColor = toneText(brand.color);
  const frame = qualityFrame(sku.manufacturingStars);
  const cardW = Math.round(size * .92);
  const accentColor = ip ? deriveIPPalette(ip)[1] : brand.visual?.accentColor ?? mix(brand.color, "#ffffff", .4);
  const kind = baseKindForProductKey(sku.productKey);
  const theme = productTheme(sku.productKey, brand.color, accentColor, sku.packaging);
  return <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
    <div style={{ width: cardW, height: size, borderRadius: UI.radius.lg, background: "linear-gradient(180deg,#ffffff 0%,#f7faff 100%)", border: frame.border, boxShadow: frame.glow, position: "relative", overflow: "hidden", flex: "0 0 auto" }}>
      <div style={{ position: "absolute", inset: 0, background: ip ? `linear-gradient(160deg, ${mix(brand.color, '#ffffff', .82)} 0%, #ffffff 36%, ${mix(deriveIPPalette(ip)[0], '#ffffff', .7)} 100%)` : `linear-gradient(180deg,#ffffff 0%, ${mix(brand.color, '#ffffff', .9)} 100%)` }} />
      <div style={{ position: "absolute", inset: "28px 10px 8px", display: "grid", placeItems: "center" }}>
        <div style={{ position: "relative" }}>
          {productHero(kind, { base: theme.base, accent: theme.accent, text: textColor }, size * .62)}
          <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1px ${frame.foil}22` }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 8, right: 8, top: 8, display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, background: "rgba(255,255,255,.88)", border: `1px solid ${mix(brand.color, "#ffffff", .55)}`, borderRadius: UI.radius.sm, padding: "3px 5px", boxShadow: "0 2px 6px rgba(23,37,54,.08)" }}>
          <BrandLogoMark brand={brand} size={16} />
          <span style={{ color: C.ink, fontSize: 8.5, fontWeight: 900, letterSpacing: .2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: size * .34 }}>{brand.name}</span>
        </div>
        {sku.ipId && ip && <div style={{ fontSize: 8.5, fontWeight: 900, color: deriveIPPalette(ip)[0], background: "rgba(255,255,255,.85)", border: `1px solid ${mix(deriveIPPalette(ip)[0], '#ffffff', .4)}`, borderRadius: 999, padding: "3px 5px", whiteSpace: "nowrap" }}>{ip.name}</div>}
      </div>
      <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>
        <div style={{ fontSize: 9.5, fontWeight: 900, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archetypeByKey(sku.productKey)?.label ?? sku.productKey}</div>
        <div style={{ color: sku.manufacturingStars && sku.manufacturingStars >= 5 ? "#c48b1a" : sku.manufacturingStars && sku.manufacturingStars >= 4 ? C.violet : C.dim, fontSize: 9.5, fontWeight: 800, letterSpacing: 1 }}>{"★".repeat(Math.max(1, Math.min(5, sku.manufacturingStars ?? 3)))}</div>
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
