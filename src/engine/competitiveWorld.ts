import type { Cell, CompetitiveQuarterReview, Competitor, MarketEvent, RivalActionRecord, SKU, World } from "./types";
import type { SavedSegment } from "./segments";
import { cellsInSegment } from "./segments";
import { clamp, sum } from "./industries";
import { effectiveTarget, fit, needMatch } from "./cube";
import { distributionMetricsForSku } from "./distribution";

const REF_PRICE = 45;

export interface MarketStanding {
  id: string;
  name: string;
  isPlayer: boolean;
  share: number;
  rank: number;
  trend: number;
}

export interface SegmentBattle {
  segment: SavedSegment;
  playerShare: number;
  playerRank: number;
  leader: MarketStanding;
  intensity: "Open" | "Contested" | "Hostile" | "Leading";
  playerProducts: SKU[];
  situation: string;
  response: string;
}

function priceTerm(price: number, sensitivity: number) {
  return Math.max(.15, 1 - clamp(price / REF_PRICE - 1, -.6, .9) * sensitivity * .5);
}

function playerAppeal(world: World, sku: SKU, cell: Cell) {
  if (!sku.releasedToMarket || sku.status !== "active") return 0;
  const productType = world.cfg.products.find((product) => product.key === sku.productKey);
  const target = effectiveTarget(sku.target, productType);
  const distribution = distributionMetricsForSku(world, sku);
  const awareness = cell.awareness[sku.id] ?? 0;
  const quality = .45 + .55 * ((sku.perceivedQuality + sku.designQuality) / 2);
  return fit(target, cell, world.cfg) * needMatch(sku.attributes, cell, world.cfg) * quality
    * priceTerm(sku.listPrice, sku.priceSens) * awareness * (.25 + distribution.reach * .75);
}

function rivalAppeal(world: World, competitor: Competitor, cell: Cell) {
  return sum(competitor.products.map((product) => fit(product.target, cell, world.cfg)
    * needMatch(product.attributes, cell, world.cfg)
    * (.45 + .55 * product.quality)
    * priceTerm(product.price, product.priceSens)
    * (cell.awareness[product.awarenessKey] ?? 0)));
}

export function competitiveStandings(world: World, cells: Cell[] = world.cube): MarketStanding[] {
  const values = new Map<string, number>([["player", 0], ...world.comps.map((competitor) => [competitor.id, 0] as [string, number])]);
  let market = 0;
  for (const cell of cells) {
    const weight = Math.max(0, cell.head * cell.spend);
    if (!weight) continue;
    const player = sum(world.player.skus.map((sku) => playerAppeal(world, sku, cell)));
    const rivals = world.comps.map((competitor) => rivalAppeal(world, competitor, cell));
    const denominator = player + sum(rivals);
    if (denominator <= 0) continue;
    market += weight;
    values.set("player", (values.get("player") ?? 0) + weight * player / denominator);
    world.comps.forEach((competitor, index) => values.set(competitor.id, (values.get(competitor.id) ?? 0) + weight * rivals[index] / denominator));
  }
  const rows = [
    { id: "player", name: world.company, isPlayer: true, share: market ? (values.get("player") ?? 0) / market : 0, rank: 0, trend: 0 },
    ...world.comps.map((competitor) => {
      const history = competitor.shareHistory ?? [];
      const prior = history.at(-2)?.share ?? history.at(-1)?.share;
      const share = market ? (values.get(competitor.id) ?? 0) / market : 0;
      return { id: competitor.id, name: competitor.name, isPlayer: false, share, rank: 0, trend: prior == null ? 0 : share - prior };
    }),
  ].sort((a, b) => b.share - a.share);
  rows.forEach((row, index) => { row.rank = index + 1; });
  return rows;
}

function strongestPlayerProduct(world: World, cells: Cell[]) {
  return world.player.skus.filter((sku) => sku.releasedToMarket).map((sku) => ({
    sku,
    score: sum(cells.map((cell) => playerAppeal(world, sku, cell) * cell.head * cell.spend)),
  })).sort((a, b) => b.score - a.score)[0]?.sku;
}

export function segmentBattle(world: World, segment: SavedSegment): SegmentBattle {
  const cells = cellsInSegment(world, segment.filter);
  const standings = competitiveStandings(world, cells);
  const player = standings.find((standing) => standing.isPlayer)!;
  const leader = standings[0];
  const playerProducts = world.player.skus.filter((sku) => sku.releasedToMarket && (sku.targetLabel ?? "").startsWith(segment.name));
  const strongest = strongestPlayerProduct(world, cells);
  const strongestDistribution = strongest ? distributionMetricsForSku(world, strongest) : null;
  const awareness = strongest && cells.length ? sum(cells.map((cell) => cell.awareness[strongest.id] ?? 0)) / cells.length : 0;
  let intensity: SegmentBattle["intensity"] = "Contested";
  if (player.rank === 1 && player.share >= .32) intensity = "Leading";
  else if (player.share < .08) intensity = "Open";
  else if (leader.share - player.share > .22) intensity = "Hostile";
  const situation = player.rank === 1
    ? `You lead ${segment.name}, but ${standings[1]?.name ?? "the field"} remains the nearest challenger.`
    : `${leader.name} leads ${segment.name} at ${(leader.share * 100).toFixed(1)}%; you are #${player.rank}.`;
  let response = "Protect availability and keep the proposition ahead of the closest rival.";
  if (!strongest) response = "Launch a product that is deliberately designed for this audience.";
  else if (!playerProducts.length) response = `Retarget ${strongest.name} or develop a dedicated offer for this segment.`;
  else if ((strongestDistribution?.reach ?? 0) < .38) response = `Expand ${strongest.name}'s distribution; product appeal is being constrained by reach.`;
  else if (awareness < .16) response = `Build awareness for ${strongest.name} with a segment-specific campaign.`;
  else if (player.share < leader.share * .7) response = `Review ${strongest.name}'s price, quality and positioning against ${leader.name}.`;
  return { segment, playerShare: player.share, playerRank: player.rank, leader, intensity, playerProducts, situation, response };
}

export function recordRivalAction(world: World, competitor: Competitor, action: RivalActionRecord, event: Omit<MarketEvent, "tick" | "kind">) {
  competitor.actionHistory = [...(competitor.actionHistory ?? []), action].slice(-32);
  world.events.push({ tick: world.tick, kind: "rival", entityId: competitor.id, ...event });
}

export function recordQuarterlyCompetitiveReview(world: World) {
  const standings = competitiveStandings(world);
  const player = standings.find((standing) => standing.isPlayer)!;
  const previous = world.competitiveReviews.at(-1) ?? null;
  for (const competitor of world.comps) {
    const standing = standings.find((row) => row.id === competitor.id);
    if (!standing) continue;
    competitor.shareHistory = [...(competitor.shareHistory ?? []), { tick: world.tick, share: standing.share }].slice(-24);
  }
  const deltas = standings.map((row) => {
    if (row.isPlayer) return { name: row.name, delta: previous ? row.share - previous.playerShare : 0 };
    const competitor = world.comps.find((candidate) => candidate.id === row.id);
    const history = competitor?.shareHistory ?? [];
    return { name: row.name, delta: history.length > 1 ? history.at(-1)!.share - history.at(-2)!.share : 0 };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const leader = standings[0];
  const mover = deltas[0] ?? { name: world.company, delta: 0 };
  const shareDelta = previous ? player.share - previous.playerShare : 0;
  const direction = !previous ? "enters its first formal market review" : Math.abs(shareDelta) < .002 ? "holds steady" : shareDelta > 0 ? "gains ground" : "loses ground";
  const headline = `${world.company} ${direction} at #${player.rank} with ${(player.share * 100).toFixed(1)}% share.`;
  const review: CompetitiveQuarterReview = {
    tick: world.tick, quarter: Math.floor(world.tick / 90), playerShare: player.share, playerRank: player.rank,
    previousPlayerShare: previous?.playerShare ?? null, leaderName: leader.name, leaderShare: leader.share,
    topMoverName: mover.name, topMoverDelta: mover.delta, headline,
  };
  world.competitiveReviews = [...world.competitiveReviews, review].slice(-40);
  world.events.push({
    tick: world.tick, kind: "market", code: "quarterly_market_review", text: `📈 Quarterly market review — ${headline}`,
    data: { playerRank: player.rank, playerShare: player.share, previousPlayerShare: previous?.playerShare ?? -1, leaderName: leader.name, leaderShare: leader.share, shareDelta },
  });
}
