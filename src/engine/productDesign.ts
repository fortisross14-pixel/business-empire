import type { IndustryConfig } from "./types";
import { clamp, PACKAGING } from "./industries";

export type ProductPositioning = "value" | "mainstream" | "premium" | "luxury" | "specialist";

export interface ProductPositioningDef {
  key: ProductPositioning;
  label: string;
  desc: string;
  pricePercentile: number;
  manufacturingStars: number;
  packaging: string;
}

export const PRODUCT_POSITIONINGS: ProductPositioningDef[] = [
  { key: "value", label: "Value", desc: "Accessible price, dependable product, broad appeal.", pricePercentile: 0.20, manufacturingStars: 2, packaging: "bold" },
  { key: "mainstream", label: "Mainstream", desc: "Balanced price, quality and broad-market appeal.", pricePercentile: 0.45, manufacturingStars: 3, packaging: "minimal" },
  { key: "premium", label: "Premium", desc: "Higher quality and stronger presentation at a healthy margin.", pricePercentile: 0.68, manufacturingStars: 4, packaging: "premium" },
  { key: "luxury", label: "Luxury", desc: "Top-end quality, exclusivity and prestige-led presentation.", pricePercentile: 0.90, manufacturingStars: 5, packaging: "premium" },
  { key: "specialist", label: "Specialist / Performance", desc: "Focused product built to solve a specific customer need exceptionally well.", pricePercentile: 0.72, manufacturingStars: 4, packaging: "serious" },
];

export interface ManufacturingStandardDef {
  stars: number;
  label: string;
  desc: string;
  materialQuality: number;
  productionQuality: number;
}

export const MANUFACTURING_STANDARDS: ManufacturingStandardDef[] = [
  { stars: 1, label: "Economy", desc: "Lowest cost; quality-sensitive customers will notice.", materialQuality: 0.22, productionQuality: 0.28 },
  { stars: 2, label: "Commercial", desc: "Cost-conscious but credible mass-market standard.", materialQuality: 0.38, productionQuality: 0.42 },
  { stars: 3, label: "Standard", desc: "Balanced quality and cost for a mainstream product.", materialQuality: 0.55, productionQuality: 0.58 },
  { stars: 4, label: "Premium", desc: "High-grade materials and tighter production standards.", materialQuality: 0.74, productionQuality: 0.78 },
  { stars: 5, label: "Exceptional", desc: "Best available specification; expensive but differentiation-friendly.", materialQuality: 0.92, productionQuality: 0.94 },
];

export function manufacturingStandard(stars: number): ManufacturingStandardDef {
  const rounded = Math.max(1, Math.min(5, Math.round(stars)));
  return MANUFACTURING_STANDARDS[rounded - 1];
}

export function qualityToStars(value: number): number {
  if (value >= 0.84) return 5;
  if (value >= 0.66) return 4;
  if (value >= 0.48) return 3;
  if (value >= 0.32) return 2;
  return 1;
}

export function valueToStars(value: number): number {
  return Math.max(1, Math.min(5, Math.round(clamp(value) * 4 + 1)));
}

export function starsToValue(stars: number): number {
  return clamp((Math.max(1, Math.min(5, Math.round(stars))) - 1) / 4);
}

export function suggestedPrice(priceBand: [number, number], percentile: number): number {
  const [lo, hi] = priceBand;
  return Math.round(lo + (hi - lo) * clamp(percentile));
}

export function attributesToStars(cfg: IndustryConfig, defaults?: Record<string, number>): Record<string, number> {
  return Object.fromEntries(cfg.needs.map((n) => [n.key, valueToStars(defaults?.[n.key] ?? 0.4)]));
}

export function starsToAttributes(stars: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(stars).map(([key, value]) => [key, starsToValue(value)]));
}

export function applyPositioningToPriorityStars(_industryId: string, base: Record<string, number>, positioning: ProductPositioning): Record<string, number> {
  const out = { ...base };
  const lift = (key: string, value: number) => { if (key in out) out[key] = Math.max(out[key], value); };
  const lower = (key: string, value: number) => { if (key in out) out[key] = Math.min(out[key], value); };
  const ranked = () => Object.entries(out).sort((a, b) => b[1] - a[1]).map(([key]) => key);

  if (positioning === "value") {
    if ("value" in out) lift("value", 5); else if (ranked()[0]) lift(ranked()[0], 4);
    lower("luxury", 2); lower("collectible", 3);
  } else if (positioning === "premium") {
    if ("luxury" in out) lift("luxury", 4);
    else if ("collectible" in out) lift("collectible", 4);
    else if (ranked()[0]) lift(ranked()[0], 4);
  } else if (positioning === "luxury") {
    if ("luxury" in out) lift("luxury", 5);
    else if ("collectible" in out) lift("collectible", 5);
    else if (ranked()[0]) lift(ranked()[0], 5);
    lower("value", 2);
  } else if (positioning === "specialist") {
    const [first, second] = ranked();
    if (first) lift(first, 5);
    if (second) lift(second, 4);
  }
  return out;
}

export function positioningDef(key: ProductPositioning): ProductPositioningDef {
  return PRODUCT_POSITIONINGS.find((p) => p.key === key) ?? PRODUCT_POSITIONINGS[1];
}

export function validPackagingKey(key: string): string {
  return PACKAGING.some((p) => p.key === key) ? key : "minimal";
}
