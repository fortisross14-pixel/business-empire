// ============================================================================
// Release 0.2 — Segment Manager.
// A saved segment is a set of axis filters. The system resolves it against the
// cube to show population, spend, growth, and aggregate need profile.
// Campaigns can target a saved segment instead of a single age band.
// ============================================================================
import type { World, Cell, AxisKey } from "./types";
import { AXES, AXIS_KEYS, axisPos, clamp, sum, type MarketingAgency } from "./industries";
import { teamEffectiveness } from "./people";

export interface SegmentFilter {
  // for each axis, the set of allowed values; empty/absent = all values allowed
  [axis: string]: string[];
}
export interface SavedSegment {
  id: string;
  name: string;
  filter: SegmentFilter;
}


export function canManageSegments(w: World): { ok: boolean; reason: string } {
  if (teamEffectiveness(w, "marketing") > 0 || teamEffectiveness(w, "strategy") > 0) return { ok: true, reason: "" };
  return { ok: false, reason: "Seat a Marketing or Strategy specialist before creating custom market segments." };
}

export function cellsInSegment(w: World, filter: SegmentFilter): Cell[] {
  return w.cube.filter((cell) =>
    AXIS_KEYS.every((axis) => {
      const allowed = filter[axis];
      return !allowed || allowed.length === 0 || allowed.includes(cell.coord[axis]);
    })
  );
}


export function segmentTargetProfile(w: World, filter: SegmentFilter): Record<AxisKey, number> {
  const cells = cellsInSegment(w, filter);
  const population = sum(cells.map((c) => c.head));
  const out = {} as Record<AxisKey, number>;
  for (const axis of AXIS_KEYS) {
    out[axis] = population > 0
      ? sum(cells.map((c) => c.head * axisPos(axis, AXES[axis].indexOf(c.coord[axis])))) / population
      : 0.5;
  }
  return out;
}

export interface SegmentStats {
  population: number;
  market: number;        // total annual spend $
  avgSpend: number;
  growth: number;        // fraction vs base
  needPref: Record<string, number>; // population-weighted
  cellCount: number;
  playerShareValue: number; // $ the player currently captures here (approx via revenue cells)
}

export function segmentStats(w: World, filter: SegmentFilter): SegmentStats {
  const cells = cellsInSegment(w, filter);
  const population = sum(cells.map((c) => c.head));
  const market = sum(cells.map((c) => c.head * c.spend));
  const baseMarket = sum(cells.map((c) => c.baseHead * c.spend));
  const needPref: Record<string, number> = {};
  for (const need of w.cfg.needs) {
    needPref[need.key] = population > 0
      ? sum(cells.map((c) => c.head * (c.needPref[need.key] ?? 0))) / population
      : 0;
  }
  // player captured value: from live cellFinance matched to these cells
  let captured = 0;
  if (w.live) {
    const keys = new Set(cells.map((c) => `${c.coord.gender}|${c.coord.age}|${c.coord.class}|${c.coord.leaning}|${c.coord.geography}|${c.coord.family}`));
    for (const cf of w.live.cellFinance) {
      const k = `${cf.coord.gender}|${cf.coord.age}|${cf.coord.class}|${cf.coord.leaning}|${cf.coord.geography}|${cf.coord.family}`;
      if (keys.has(k)) captured += cf.revenue;
    }
  }
  return {
    population, market, avgSpend: population > 0 ? market / population : 0,
    growth: baseMarket > 0 ? market / baseMarket - 1 : 0,
    needPref, cellCount: cells.length, playerShareValue: captured,
  };
}

// preset segment ideas to seed the manager
export function presetSegments(): SavedSegment[] {
  return [
    { id: "s_moms", name: "Soccer Moms", filter: { gender: ["Female"], age: ["25-39", "40-59"], geography: ["Suburban"], family: ["Family"], class: ["Middle", "Affluent"] } },
    { id: "s_lux", name: "Luxury Professionals", filter: { age: ["25-39", "40-59"], class: ["Affluent"], geography: ["Urban"] } },
    { id: "s_budget", name: "Budget Families", filter: { class: ["Budget"], family: ["Family"] } },
    { id: "s_young", name: "Young Trendsetters", filter: { age: ["13-24"], geography: ["Urban"] } },
  ];
}


export function marketingAgencyFitForSegment(w: World, filter: SegmentFilter, agency: MarketingAgency): number {
  const cells = cellsInSegment(w, filter);
  const population = sum(cells.map((c) => c.head));
  if (population <= 0) return 1;
  let weighted = 0;
  for (const cell of cells) {
    let fit = 1;
    for (const [axisRaw, skewRaw] of Object.entries(agency.strengthSkew)) {
      const axis = axisRaw as AxisKey;
      const vals = AXES[axis];
      const idx = Math.max(0, vals.indexOf(cell.coord[axis]));
      const pos = vals.length <= 1 ? 0.5 : idx / (vals.length - 1);
      fit *= clamp(1 + Number(skewRaw) * (pos - 0.5) * 0.8, 0.7, 1.3);
    }
    weighted += fit * cell.head;
  }
  return weighted / population;
}

export function agencyFitStars(fit: number): number {
  if (fit >= 1.13) return 5;
  if (fit >= 1.04) return 4;
  if (fit >= 0.96) return 3;
  if (fit >= 0.88) return 2;
  return 1;
}

export function agencyFitLabel(fit: number): string {
  const stars = agencyFitStars(fit);
  return stars >= 5 ? "Excellent target fit" : stars === 4 ? "Strong target fit" : stars === 3 ? "Neutral target fit" : stars === 2 ? "Weak target fit" : "Poor target fit";
}
