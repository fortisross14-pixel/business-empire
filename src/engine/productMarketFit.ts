import type { Cell, SKU, World } from "./types";
import { clamp, RETAIL_PARTNERS } from "./industries";
import { archetypeByKey, retailerAffinity } from "./productCatalog";
import { partnerFitForCell, contractsForSku } from "./distribution";
import { ipAudienceFit, ipById, ipProductFit } from "./ip";

export interface ProductFitDiagnosis {
  overall: number;
  priceFit: number;
  channelFit: number;
  brandFit: number;
  ipFit: number;
  productFit: number;
  stars: { price: number; channel: number; brand: number; ip: number; product: number };
  issues: string[];
  positives: string[];
}

const stars = (x: number) => Math.max(1, Math.min(5, Math.round(clamp(x, 0, 1) * 4 + 1)));

function priceFit(w: World, sku: SKU, cell: Cell): number {
  const a = archetypeByKey(sku.productKey);
  if (!a) return .65;
  const [lo, hi] = a.priceBand;
  const mid = (lo + hi) / 2;
  const span = Math.max(5, hi - lo);
  // Affluent segments tolerate a higher price; budget segments punish it hard.
  const cls = cell.coord.class === "Affluent" ? 1.28 : cell.coord.class === "Middle" ? 1 : .72;
  const expected = mid * cls;
  const ratio = sku.listPrice / Math.max(1, expected);
  if (ratio <= 1.15) return clamp(1 - Math.max(0, .72 - ratio) * .28, .72, 1);
  return clamp(1 - Math.pow((ratio - 1.15) / Math.max(.75, span / mid), 1.18) * .92, .04, 1);
}

function brandFit(w: World, sku: SKU, cell: Cell): number {
  const brand = w.brands.find(b => b.id === sku.brandId);
  const pos = brand?.positioning ?? "premium";
  if (pos === "luxury") {
    if (cell.coord.class === "Affluent") return 1;
    if (cell.coord.class === "Middle") return .58;
    return .18;
  }
  if (pos === "mass") {
    if (cell.coord.class === "Budget") return 1;
    if (cell.coord.class === "Middle") return .92;
    return .65;
  }
  return cell.coord.class === "Middle" ? 1 : .78;
}

function ipFit(w: World, sku: SKU, cell: Cell): number {
  if (!sku.ipId) return 1;
  const ip = ipById(w, sku.ipId);
  if (!ip) return .45;
  const product = ipProductFit(ip, sku.productKey);
  const audience = clamp((ipAudienceFit(ip, cell) - .68) / .58, 0, 1);
  // An irrelevant license should be capable of actively hurting a product, not simply failing to help it.
  return clamp(product * .58 + audience * .42, .08, 1);
}

function intrinsicProductFit(w: World, sku: SKU, cell: Cell): number {
  const category = cell.categoryPref[sku.productKey] ?? .5;
  const needs = Object.entries(sku.attributes ?? {});
  if (!needs.length) return category;
  let weighted = 0, total = 0;
  for (const [k, v] of needs) {
    const pref = cell.needPref[k] ?? .5;
    weighted += (1 - Math.abs(pref - v)) * (.4 + v);
    total += .4 + v;
  }
  return clamp(category * .55 + (total ? weighted / total : .5) * .45, .08, 1);
}

export function productMarketFitForCell(w: World, sku: SKU, cell: Cell): ProductFitDiagnosis {
  const p = priceFit(w, sku, cell);
  const c = contractsForSku(w, sku).length ? clamp(partnerFitForCell(w, sku, cell) / .9, .08, 1) : .04;
  const b = brandFit(w, sku, cell);
  const ip = ipFit(w, sku, cell);
  const product = intrinsicProductFit(w, sku, cell);
  // Multiplicative-ish: spending millions cannot rescue a fundamentally incoherent proposition.
  const overall = clamp(Math.pow(p * c * b * ip * product, .36), .03, 1);
  const issues: string[] = [];
  const positives: string[] = [];
  if (p < .45) issues.push(`Price is far above what this audience accepts for the category.`); else if (p > .82) positives.push("Price fits the audience.");
  if (c < .45) issues.push(`Channel mismatch: the product is not where this audience naturally shops.`); else if (c > .8) positives.push("Distribution matches the audience.");
  if (b < .45) issues.push(`Brand positioning and buyer expectations conflict.`); else if (b > .8) positives.push("Brand positioning fits the buyer.");
  if (sku.ipId && ip < .45) issues.push(`The attached IP does not transfer well to this product/buyer.`); else if (sku.ipId && ip > .8) positives.push("The IP strongly resonates with the target buyer.");
  if (product < .45) issues.push(`The product proposition itself is weak for this audience.`); else if (product > .8) positives.push("The product proposition fits the audience.");
  return { overall, priceFit: p, channelFit: c, brandFit: b, ipFit: ip, productFit: product,
    stars: { price: stars(p), channel: stars(c), brand: stars(b), ip: stars(ip), product: stars(product) }, issues, positives };
}

export function bestFitDiagnosis(w: World, sku: SKU) {
  let best: { cell: Cell; diag: ProductFitDiagnosis } | null = null;
  let commercial: { cell: Cell; diag: ProductFitDiagnosis; score: number } | null = null;
  for (const cell of w.cube) {
    const diag = productMarketFitForCell(w, sku, cell);
    const market = cell.head * cell.spend;
    const intrinsicScore = diag.productFit * diag.brandFit * market;
    if (!best || intrinsicScore > best.diag.productFit * best.diag.brandFit * best.cell.head * best.cell.spend) best = { cell, diag };
    const score = diag.overall * market;
    if (!commercial || score > commercial.score) commercial = { cell, diag, score };
  }
  return { best, commercial };
}

export function partnerRecommendations(w: World, sku: SKU, cell: Cell) {
  const brand = w.brands.find(b => b.id === sku.brandId);
  return RETAIL_PARTNERS.filter(p => !p.industries || p.industries.includes(sku.industryId))
    .map(p => {
      let demographic = 1;
      for (const [axisRaw, skew] of Object.entries(p.skew ?? {})) {
        const axis = axisRaw as keyof typeof cell.coord;
        const values: Record<string, string[]> = {
          gender: ["Female","Male"], age: ["13-24","25-39","40-59","60+"], class: ["Budget","Middle","Affluent"],
          leaning: ["Progressive","Neutral","Conservative"], geography: ["Urban","Suburban","Rural"], family: ["Single","Couple","Family"],
        };
        const vals = values[axis] ?? [];
        const idx = Math.max(0, vals.indexOf(cell.coord[axis]));
        const pos = vals.length <= 1 ? .5 : idx / (vals.length - 1);
        demographic *= clamp(1 + Number(skew) * (pos - .5) * .8, .65, 1.35);
      }
      let positioning = 1;
      if (brand?.positioning === "luxury") positioning = p.id === "beauty_luxe" || p.id === "flagship_store" ? 1.35 : p.id === "value_dept" || p.category === "drugstore" ? .58 : .95;
      if (brand?.positioning === "mass") positioning = p.id === "value_dept" || p.category === "drugstore" || p.id === "megazon" ? 1.2 : p.id === "flagship_store" ? .72 : 1;
      const fit = (cell.channelPref[p.channelType] ?? 0) * demographic * p.reachMult * retailerAffinity(sku.productKey, p.id, p.category, p.channelType) * positioning;
      return { partner: p, fit };
    })
    .sort((a,b) => b.fit - a.fit).slice(0,3);
}
