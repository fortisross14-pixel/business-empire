import type { Brand, BrandLogoLayout, BrandLogoMotif, BrandLogoShape, Cell, World } from "./types";
import { clamp } from "./industries";

function unbrandedIdentity(w: World): Brand {
  return { id: "__unbranded", name: w.company || "Unbranded", color: "#3b82f6", positioning: "premium", createdTick: 0, industryId: w.industryId, visual: defaultBrandVisual(w.company || "Unbranded", "#3b82f6") };
}

export function primaryBrand(w: World): Brand {
  return w.brands.find((b) => b.id === w.primaryBrandId) ?? w.brands[0] ?? unbrandedIdentity(w);
}

export function brandById(w: World, brandId?: string | null): Brand {
  return w.brands.find((b) => b.id === brandId) ?? primaryBrand(w);
}

export function brandSkuCount(w: World, brandId: string): number {
  return w.player.skus.filter((s) => s.brandId === brandId).length;
}

export function brandPositioningFit(w: World, brandId: string, cell: Cell, productPositioning?: string): number {
  const brand = brandById(w, brandId);
  const classValues = ["Budget", "Middle", "Affluent"];
  const classPos = Math.max(0, classValues.indexOf(cell.coord.class)) / 2;
  let fit = 1;
  if (brand.positioning === "mass") fit *= 1.05 - Math.abs(classPos - 0.35) * 0.10;
  else if (brand.positioning === "premium") fit *= 0.90 + classPos * 0.20;
  else if (brand.positioning === "luxury") fit *= 0.72 + classPos * 0.42;

  const aligned = brand.positioning === "mass"
    ? productPositioning === "value" || productPositioning === "mainstream"
    : brand.positioning === "premium"
      ? productPositioning === "premium" || productPositioning === "specialist" || productPositioning === "mainstream"
      : productPositioning === "luxury" || productPositioning === "premium";
  const stronglyConflicted = brand.positioning === "luxury" && productPositioning === "value"
    || brand.positioning === "mass" && productPositioning === "luxury";
  if (aligned) fit *= 1.04;
  if (stronglyConflicted) fit *= 0.88;
  return clamp(fit, 0.7, 1.2);
}


const BRAND_SHAPES: BrandLogoShape[] = ["square", "circle", "diamond", "shield", "capsule", "hex", "triangle"];
const BRAND_MOTIFS: BrandLogoMotif[] = ["stripe", "star", "bolt", "orbit", "crown", "leaf", "spark"];
const BRAND_LAYOUTS: BrandLogoLayout[] = ["monogram", "stacked", "wide"];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function lighten(hex: string, amount = 0.28): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (num >> 16) & 255; const g = (num >> 8) & 255; const b = num & 255;
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function defaultBrandVisual(name: string, color: string) {
  const hash = hashString(name.toLowerCase());
  return {
    shape: BRAND_SHAPES[hash % BRAND_SHAPES.length],
    motif: BRAND_MOTIFS[(hash >> 3) % BRAND_MOTIFS.length],
    textLayout: BRAND_LAYOUTS[(hash >> 5) % BRAND_LAYOUTS.length],
    accentColor: lighten(color, 0.35),
  } as const;
}

export function ensureBrandVisual(brand: Brand): Brand {
  if (!brand.visual) brand.visual = defaultBrandVisual(brand.name, brand.color);
  else brand.visual.accentColor = brand.visual.accentColor || lighten(brand.color, 0.35);
  return brand;
}
