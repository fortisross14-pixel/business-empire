import type { DecisionChoice, DecisionEvent, GameEffect, GameplayState, ScenarioId, World } from "./types";
import { AXES, AXIS_KEYS, axisPos, clamp } from "./industries";
import { estimatedCompanyValue } from "./ip";
import { productMarketFitForCell } from "./productMarketFit";

export const SCENARIOS: Record<ScenarioId, { id: ScenarioId; icon: string; name: string; pitch: string; pressure: string }> = {
  bootstrap_brand: { id: "bootstrap_brand", icon: "🪴", name: "Bootstrap Brand", pitch: "Turn a disciplined founder budget into a self-funding brand.", pressure: "Profitability and cash conversion matter early." },
  premium_challenger: { id: "premium_challenger", icon: "💎", name: "Premium Challenger", pitch: "Build fewer, better products and earn pricing power.", pressure: "Quality, prestige and product craft drive the score." },
  turnaround: { id: "turnaround", icon: "🧯", name: "Turnaround", pitch: "Start leveraged and build a company that can carry its obligations.", pressure: "Opening debt and a thinner cash cushion." },
  retailer_growth: { id: "retailer_growth", icon: "🛒", name: "Retailer-Dependent Growth", pitch: "Use distribution partners to scale, then regain negotiating power.", pressure: "Reach matters, but retailer economics can own you." },
  ip_breakout: { id: "ip_breakout", icon: "🚀", name: "IP Breakout", pitch: "Create a product universe that can become bigger than a single SKU.", pressure: "Momentum, owned IP and cultural relevance are the goal." },
};

export function createGameplayState(scenarioId: ScenarioId = "bootstrap_brand"): GameplayState {
  const runSeed = Math.floor(Math.random() * 1_000_000_000);
  return { scenarioId, runSeed, pendingDecision: null, decisionHistory: [], delayedConsequences: [], seenTemplates: [], nextDecisionTick: 55 + runSeed % 36, achievements: [], outcomes: [] };
}

export function applyScenarioOpening(w: World) {
  const id = w.gameplay.scenarioId;
  if (id === "turnaround") { w.player.cash *= .72; w.player.debt += 750_000; w.investorConfidence = .62; }
  if (id === "retailer_growth") w.player.cash += 250_000;
  if (id === "ip_breakout") w.player.cash += 150_000;
}

export const ACHIEVEMENTS = [
  { id: "doors_open", icon: "🏢", name: "Doors Open", desc: "Build the first company facility." },
  { id: "first_hire", icon: "🤝", name: "First Hire", desc: "Add the first employee." },
  { id: "maker", icon: "🎨", name: "Maker", desc: "Complete the first product design." },
  { id: "first_sale", icon: "💵", name: "First Sale", desc: "Sell the first unit." },
  { id: "million_quarter", icon: "📈", name: "Million-Dollar Quarter", desc: "Reach $1M quarterly revenue run-rate." },
  { id: "profitable", icon: "🌱", name: "In the Black", desc: "Post a profitable quarter run-rate." },
  { id: "portfolio", icon: "📦", name: "Shelf Space", desc: "Have three released products." },
  { id: "flagship", icon: "⭐", name: "Flagship", desc: "Release an AA or AAA product." },
  { id: "breakout", icon: "🔥", name: "Breakout Hit", desc: "Create a breakout product." },
  { id: "market_leader", icon: "👑", name: "Market Leader", desc: "Finish a review ranked #1." },
  { id: "team_builder", icon: "👥", name: "Team Builder", desc: "Grow to ten employees." },
  { id: "owned_ip", icon: "🎬", name: "Original IP", desc: "Create company-owned IP." },
  { id: "second_business", icon: "🌐", name: "Empire Begins", desc: "Operate in a second industry." },
  { id: "decision_maker", icon: "⚡", name: "Decision Maker", desc: "Resolve three major events." },
  { id: "learning_loop", icon: "🔎", name: "Learning Loop", desc: "Turn a post-launch study into category knowledge." },
  { id: "portfolio_editor", icon: "🗄", name: "Portfolio Editor", desc: "Archive a product without erasing its history." },
  { id: "enduring", icon: "🗓", name: "Enduring Company", desc: "Reach year three." },
] as const;

export const OUTCOMES = [
  { id: "profitable_scale", icon: "📊", name: "Profitable Scale", desc: "Build a $1M+ quarterly business that is profitable." },
  { id: "category_leader", icon: "🏆", name: "Category Leader", desc: "Hold the #1 market position with meaningful share." },
  { id: "multi_business", icon: "🏙", name: "Multi-Business Group", desc: "Operate two active businesses." },
  { id: "iconic_ip", icon: "✨", name: "Iconic IP", desc: "Create an owned cultural asset or breakout franchise." },
  { id: "successful_exit", icon: "🛎", name: "Successful Exit", desc: "Build an exit-ready $25M company with strong profit." },
  { id: "restructuring_failure", icon: "⚠", name: "Restructuring Failure", desc: "Run out of room under a heavy debt burden." },
] as const;

const hasAchievement = (w: World, id: string) => w.gameplay.achievements.some((a) => a.id === id);
const hasOutcome = (w: World, id: string) => w.gameplay.outcomes.some((a) => a.id === id);

function achievementConditions(w: World): Record<string, boolean> {
  const released = w.player.skus.filter((s) => s.releasedToMarket);
  return {
    doors_open: w.player.operatingRooms.length > 0,
    first_hire: w.player.personnel.length > 0,
    maker: w.player.skus.some((s) => s.status !== "designing"),
    first_sale: w.player.skus.some((s) => s.unitsSoldTotal > 0),
    million_quarter: (w.live?.income.netRevenue ?? 0) >= 1_000_000,
    profitable: w.tick >= 30 && (w.live?.income.profit ?? 0) > 0,
    portfolio: released.length >= 3,
    flagship: released.some((s) => s.projectTier === "AA" || s.projectTier === "AAA"),
    breakout: w.player.skus.some((s) => s.breakout),
    market_leader: w.competitiveReviews.some((r) => r.playerRank === 1),
    team_builder: w.player.personnel.length >= 10,
    owned_ip: w.ipAssets.some((ip) => ip.ownerType === "player"),
    second_business: Object.values(w.player.businesses).filter((b) => b?.status === "active").length >= 2,
    decision_maker: w.gameplay.decisionHistory.length >= 3,
    learning_loop: Object.values(w.player.productLearning ?? {}).some((score) => score > 0),
    portfolio_editor: w.player.skus.some((s) => s.archived),
    enduring: w.tick >= 1080,
  };
}

function outcomeConditions(w: World): Record<string, boolean> {
  const lastReview = w.competitiveReviews.at(-1);
  const iconic = w.ipAssets.some((ip) => ip.ownerType === "player" && (ip.awareness >= .5 || ip.prestige >= .65)) || w.player.skus.some((s) => s.breakout && s.fame >= .35);
  return {
    profitable_scale: (w.live?.income.netRevenue ?? 0) >= 1_000_000 && (w.live?.income.profit ?? 0) > 0,
    category_leader: Boolean(lastReview && lastReview.playerRank === 1 && lastReview.playerShare >= .2),
    multi_business: Object.values(w.player.businesses).filter((b) => b?.status === "active").length >= 2,
    iconic_ip: iconic,
    successful_exit: estimatedCompanyValue(w) >= 25_000_000 && (w.live?.income.profit ?? 0) >= 1_000_000,
    restructuring_failure: w.player.cash < -1_000_000 && w.player.debt >= 1_000_000,
  };
}

export function achievementProgress(w: World, id: string): number {
  const released = w.player.skus.filter((s) => s.releasedToMarket).length;
  const map: Record<string, number> = {
    doors_open: w.player.operatingRooms.length ? 1 : 0, first_hire: Math.min(1, w.player.personnel.length), maker: w.player.skus.some((s) => s.status !== "designing") ? 1 : 0,
    first_sale: Math.min(1, w.player.skus.reduce((n, s) => n + s.unitsSoldTotal, 0)), million_quarter: (w.live?.income.netRevenue ?? 0) / 1_000_000,
    profitable: (w.live?.income.profit ?? 0) > 0 ? 1 : 0, portfolio: released / 3, flagship: w.player.skus.some((s) => s.releasedToMarket && (s.projectTier === "AA" || s.projectTier === "AAA")) ? 1 : 0,
    breakout: w.player.skus.some((s) => s.breakout) ? 1 : 0, market_leader: w.competitiveReviews.some((r) => r.playerRank === 1) ? 1 : 0,
    team_builder: w.player.personnel.length / 10, owned_ip: w.ipAssets.some((ip) => ip.ownerType === "player") ? 1 : 0,
    second_business: (Object.values(w.player.businesses).filter((b) => b?.status === "active").length - 1), decision_maker: w.gameplay.decisionHistory.length / 3,
    learning_loop: Object.values(w.player.productLearning ?? {}).some((score) => score > 0) ? 1 : 0, portfolio_editor: w.player.skus.some((s) => s.archived) ? 1 : 0, enduring: w.tick / 1080,
  };
  return clamp(map[id] ?? 0, 0, 1);
}

function applyEffects(w: World, e: GameEffect) {
  w.player.cash += e.cash ?? 0;
  w.player.debt = Math.max(0, w.player.debt + (e.debt ?? 0));
  w.investorConfidence = clamp(w.investorConfidence + (e.investorConfidenceDelta ?? 0), 0, 1);
  const affectedSkus = e.targetSkuId ? w.player.skus.filter((sku) => sku.id === e.targetSkuId) : w.player.skus.filter((sku) => !sku.archived);
  for (const sku of affectedSkus) {
    if (e.inventoryPct) {
      sku.inventory = Math.max(0, sku.inventory * (1 + e.inventoryPct));
      for (const lot of sku.inventoryLots ?? []) lot.units = Math.max(0, lot.units * (1 + e.inventoryPct));
    }
    sku.quality = clamp(sku.quality + (e.qualityDelta ?? 0), 0, 1);
    sku.perceivedQuality = clamp(sku.perceivedQuality + (e.qualityDelta ?? 0) * .6, 0, 1);
    sku.marketMomentum = clamp((sku.marketMomentum ?? 1) + (e.momentumDelta ?? 0), .35, 3);
    if (e.pricePct) sku.listPrice = Math.max(.01, sku.listPrice * (1 + e.pricePct));
    if (e.manufacturingDaysPct && (sku.mfgDaysLeft ?? 0) > 0) sku.mfgDaysLeft = Math.max(1, sku.mfgDaysLeft * (1 + e.manufacturingDaysPct));
    if (e.retargetTo) { sku.target = { ...e.retargetTo }; sku.targetLabel = e.targetLabel ?? sku.targetLabel; }
  }
  if (e.awarenessDelta) for (const cell of w.cube) for (const sku of affectedSkus) cell.awareness[sku.id] = clamp((cell.awareness[sku.id] ?? 0) + e.awarenessDelta, 0, 1);
  if (e.materialCostPct) for (const key of Object.keys(w.materialPriceIndex)) w.materialPriceIndex[key] = Math.max(.5, w.materialPriceIndex[key] * (1 + e.materialCostPct));
  if (e.retailerMarginDelta) for (const contract of w.player.contracts) contract.marginCut = clamp(contract.marginCut + e.retailerMarginDelta, .05, .6);
  if (e.salaryPct) for (const person of w.player.personnel) person.salary *= 1 + e.salaryPct;
  if (e.customerSatisfactionDelta) for (const customer of Object.values(w.customers)) customer.satisfaction = clamp(customer.satisfaction + e.customerSatisfactionDelta, 0, 1);
  if (e.competitorStrengthPct) for (const competitor of w.comps) competitor.strength = Math.max(.1, competitor.strength * (1 + e.competitorStrengthPct));
  w.fitCacheDirty = true;
}

const choice = (id: string, label: string, summary: string, immediateText: string, immediate: GameEffect, delayedText?: string, days?: number, effects?: GameEffect): DecisionChoice => ({
  id, label, summary, immediateText, immediate, ...(delayedText && days && effects ? { delayedText, delayed: { days, effects } } : {}),
});

function eventTemplates(w: World): DecisionEvent[] {
  const at = (templateId: string, category: string, icon: string, title: string, description: string, context: string, choices: DecisionChoice[]): DecisionEvent => ({
    id: `${templateId}_${w.tick}`, templateId, category, icon, title, description, context, triggeredTick: w.tick, choices,
  });
  const eventStake = (mult = 1) => Math.round(clamp((40_000 + Math.max(0, w.player.cash) * .025 + Math.max(0, w.live?.income.netRevenue ?? 0) * .02) * mult, 25_000, 300_000) / 5_000) * 5_000;
  const fmt = (amount: number) => `$${Math.round(amount).toLocaleString()}`;
  const small = eventStake(.55), medium = eventStake(1), large = eventStake(1.55);
  const liveProducts = w.player.skus.filter((s) => s.releasedToMarket && !s.archived);
  const featured = liveProducts[(w.gameplay.runSeed + w.tick) % Math.max(1, liveProducts.length)] ?? w.player.skus.find((s) => !s.archived);
  const productName = featured?.name ?? "your launch";
  const opportunity = featured ? w.cube.map((cell) => {
    const diag = productMarketFitForCell(w, featured, cell);
    const distance = AXIS_KEYS.reduce((sum, axis) => sum + Math.abs((featured.target[axis] ?? .5) - axisPos(axis, AXES[axis].indexOf(cell.coord[axis]))), 0) / AXIS_KEYS.length;
    return { cell, diag, score: diag.overall * cell.head * cell.spend * (.7 + distance * 1.8) };
  }).sort((a,b) => b.score - a.score)[0] : null;
  const opportunityTarget = opportunity ? Object.fromEntries(AXIS_KEYS.map((axis) => [axis, axisPos(axis, AXES[axis].indexOf(opportunity.cell.coord[axis]))])) as Record<(typeof AXIS_KEYS)[number], number> : null;
  const opportunityLabel = opportunity ? `${opportunity.cell.coord.age} · ${opportunity.cell.coord.class} · ${opportunity.cell.coord.geography} · ${opportunity.cell.coord.family}` : "an unexpected customer group";
  const inbound = w.player.skus.find((s) => !s.archived && s.method === "outsource" && (s.mfgDaysLeft ?? 0) > 0);
  const foodSku = liveProducts.find((s) => s.industryId === "food");
  const apparelSku = liveProducts.find((s) => s.industryId === "apparel");
  const electronicsSku = liveProducts.find((s) => s.industryId === "electronics");
  return [
    at("supplier_shock", "Operations", "🚢", "Supplier shock", "A core input has become scarce and your next batches will cost more.", `${productName} is exposed. Choose whether to protect margin, quality, or supply resilience.`, [
      choice("absorb", "Absorb the hit", "Protect price and customer trust.", `Cash -${fmt(medium)}; product quality protected.`, { cash: -medium }, "Material markets remain 7% more expensive.", 45, { materialCostPct: .07 }),
      choice("raise_prices", "Raise prices", "Pass part of the shock to customers.", "Prices +8%; momentum -0.05.", { pricePct: .08, momentumDelta: -.05 }, "Higher prices reduce broad-market awareness.", 40, { awarenessDelta: -.025 }),
      choice("diversify", "Diversify supply", "Pay now for a more resilient network.", `Cash -${fmt(large)}.`, { cash: -large }, "New sourcing reduces material costs by 5%.", 60, { materialCostPct: -.05 }),
    ]),
    at("retailer_ultimatum", "Distribution", "🛒", "Retailer ultimatum", "A major partner wants better economics and more launch support.", `Your current contracts reach customers, but the retailer believes it has the leverage.`, [
      choice("accept", "Accept the terms", "Keep reach and give up margin.", "Retailer margin cuts rise 3 points.", { retailerMarginDelta: .03 }),
      choice("campaign", "Fund the sell-through", "Prove demand without permanently conceding terms.", `Cash -${fmt(large)}; awareness +5 points.`, { cash: -large, awarenessDelta: .05 }),
      choice("walk", "Call their bluff", "Protect margin and risk a demand dip.", "Investor confidence +2 points.", { investorConfidenceDelta: .02 }, "Momentum falls if the retailer does not blink.", 30, { momentumDelta: -.1 }),
    ]),
    at("viral_ip", "Brand", "🔥", "A product is going viral", `Fans are turning ${productName} into a cultural moment faster than operations can react.`, "You can chase the spike, monetize carefully, or protect long-term scarcity.", [
      choice("chase", "Chase demand", "Spend aggressively while attention is hot.", `Cash -${fmt(large)}; momentum +0.30; awareness +6 points.`, { cash: -large, momentumDelta: .3, awarenessDelta: .06 }, "The accelerated push creates a small quality risk.", 50, { qualityDelta: -.025 }),
      choice("license", "License selectively", "Take cash and keep the core operation focused.", `Cash +${fmt(large * 1.4)}; momentum -0.04.`, { cash: Math.round(large * 1.4), momentumDelta: -.04 }),
      choice("scarcity", "Protect scarcity", "Let demand outrun supply and build mystique.", "Momentum +0.14; investor confidence +3 points.", { momentumDelta: .14, investorConfidenceDelta: .03 }, "Limited reach slows awareness growth.", 45, { awarenessDelta: -.02 }),
    ]),
    at("quality_crisis", "Product", "⚠", "Quality issue reported", `A credible cluster of complaints has emerged around ${productName}.`, "The facts are incomplete, but silence is becoming a decision of its own.", [
      choice("recall", "Act early", "Take the financial pain and protect trust.", `Cash -${fmt(large)}; inventory -20%; confidence +5 points.`, { cash: -large, inventoryPct: -.2, investorConfidenceDelta: .05 }, "Transparent action improves perceived quality.", 35, { qualityDelta: .035, customerSatisfactionDelta: .04 }),
      choice("investigate", "Investigate first", "Spend less now while the team tests the evidence.", `Cash -${fmt(small)}.`, { cash: -small }, "The delay costs some momentum but limits the quality impact.", 30, { momentumDelta: -.06, qualityDelta: -.015 }),
      choice("deny", "Deny the problem", "Keep selling and bet the issue fades.", "No immediate cost.", {}, "Trust and product quality take a material hit.", 25, { qualityDelta: -.08, customerSatisfactionDelta: -.09, investorConfidenceDelta: -.1 }),
    ]),
    at("employee_retention", "People", "👥", "Your team is being poached", "Competitors are offering raises and titles to people who know your company best.", "A response changes both the cost base and what the organization believes you value.", [
      choice("raises", "Match the market", "Retain broadly with a permanent cost increase.", "Salaries +6%; confidence +2 points.", { salaryPct: .06, investorConfidenceDelta: .02 }),
      choice("bonus", "Pay a retention bonus", "Buy time without resetting every salary.", `Cash -${fmt(medium)}.`, { cash: -medium }, "Focused recognition lifts execution momentum.", 30, { momentumDelta: .06 }),
      choice("hold", "Hold the line", "Protect the cost base and accept morale risk.", "No immediate cost.", {}, "Execution momentum falls.", 45, { momentumDelta: -.09 }),
    ]),
    at("competitor_attack", "Competition", "⚔", "A rival attacks your position", "A competitor has cut price and doubled media in your strongest audience.", "Reacting is expensive. Ignoring it gives them time to make the move stick.", [
      choice("defend", "Defend the segment", "Meet the attack with focused commercial spend.", `Cash -${fmt(large)}; awareness +6 points.`, { cash: -large, awarenessDelta: .06 }),
      choice("reposition", "Reposition", "Move the story away from price.", `Cash -${fmt(small)}; momentum +0.10.`, { cash: -small, momentumDelta: .1 }, "The rival gets slightly stronger in the broad market.", 45, { competitorStrengthPct: .04 }),
      choice("hold", "Stay disciplined", "Let the rival burn cash and trust the proposition.", "Investor confidence +2 points.", { investorConfidenceDelta: .02 }, "Awareness slips if customers keep seeing the rival first.", 35, { awarenessDelta: -.04 }),
    ]),
    at("trend_shift", "Market", "🧭", "Consumer taste is shifting", "A once-niche preference is moving into the mainstream.", `${productName} can adapt, own a narrower niche, or wait for stronger evidence.`, [
      choice("adapt", "Adapt the portfolio", "Invest to meet the new expectation.", `Cash -${fmt(large)}; awareness +3 points.`, { cash: -large, awarenessDelta: .03 }, "The refreshed offer gains momentum.", 60, { momentumDelta: .13 }),
      choice("niche", "Own the niche", "Choose distinctiveness over maximum reach.", "Momentum +0.16; awareness -2 points.", { momentumDelta: .16, awarenessDelta: -.02 }),
      choice("wait", "Wait for proof", "Preserve cash and avoid chasing a fad.", "No immediate cost.", {}, "If the shift persists, momentum falls.", 50, { momentumDelta: -.11 }),
    ]),
    ...(featured && opportunity && opportunityTarget ? [at("unexpected_audience", "Market", "🎯", "An unexpected audience is buying", `${featured.name} has found unusual traction with ${opportunityLabel}.`, "This is real demand, but following it may pull the commercial plan away from the original brief.", [
      choice("pivot", "Pivot the audience", `Retarget ${featured.name} around the people already responding.`, `Cash -${fmt(small)}; audience changed; momentum +0.16.`, { cash: -small, targetSkuId: featured.id, retargetTo: opportunityTarget, targetLabel: opportunityLabel, momentumDelta: .16, awarenessDelta: .035 }),
      choice("capsule", "Run a focused campaign", "Test the signal without rewriting the product's core target.", `Cash -${fmt(medium)}; targeted momentum +0.20; awareness +5 points.`, { cash: -medium, targetSkuId: featured.id, momentumDelta: .20, awarenessDelta: .05 }),
      choice("stay", "Stay the course", "Treat it as useful evidence, not a new strategy.", "Momentum +0.04; confidence +1 point.", { targetSkuId: featured.id, momentumDelta: .04, investorConfidenceDelta: .01 }),
    ])] : []),
    ...(inbound ? [at("logistics_disruption", "Operations", "⛔", "Logistics disruption", `A transport bottleneck has put the ${inbound.name} batch at risk of arriving late.`, `${Math.ceil(inbound.mfgDaysLeft)} days remained on the plan. Protect timing, accept the delay, or pay for a partial reroute.`, [
      choice("expedite", "Expedite the shipment", "Pay for priority handling and preserve the launch window.", `Cash -${fmt(medium)}; remaining lead time -35%.`, { cash: -medium, targetSkuId: inbound.id, manufacturingDaysPct: -.35 }),
      choice("accept", "Accept the delay", "Keep cash and absorb the operational setback.", "Remaining lead time +35%; confidence -2 points.", { targetSkuId: inbound.id, manufacturingDaysPct: .35, investorConfidenceDelta: -.02 }),
      choice("reroute", "Reroute part of it", "Spend less and recover part of the schedule.", `Cash -${fmt(small)}; remaining lead time -12%.`, { cash: -small, targetSkuId: inbound.id, manufacturingDaysPct: -.12 }),
    ])] : []),
    ...(foodSku ? [at("food_ingredient_spike","Packaged Food","🌾","Ingredient market spike",`A poor harvest is pushing key input costs up just as ${foodSku.name} gains shelf momentum.`,"Reformulation can protect margin, but consumers may notice. Long contracts preserve the recipe but consume cash.",[
      choice("lock","Lock supply","Protect the recipe with forward contracts.",`Cash -${fmt(medium)}; quality protected.`,{cash:-medium,targetSkuId:foodSku.id},"Contracted supply lowers future input costs.",60,{materialCostPct:-.04}),
      choice("reformulate","Reformulate","Use cheaper inputs and accept a taste risk.","Quality -0.03; no immediate cash cost.",{targetSkuId:foodSku.id,qualityDelta:-.03},"The lower-cost formula improves material economics.",35,{materialCostPct:-.07}),
      choice("premium","Hold quality, raise price","Keep the recipe and pass on part of the increase.","Price +6%; momentum -0.03.",{targetSkuId:foodSku.id,pricePct:.06,momentumDelta:-.03}),
    ])] : []),
    ...(apparelSku ? [at("apparel_trend_break","Apparel","🧵","A trend breaks early",`${apparelSku.name}'s collection direction is suddenly showing up across culture and social media.`,"A fast repeat order could capture the window, but fashion inventory can turn from scarce to stale quickly.",[
      choice("chase","Chase the trend","Fund a fast commercial push while attention is hot.",`Cash -${fmt(large)}; momentum +0.28.`,{cash:-large,targetSkuId:apparelSku.id,momentumDelta:.28,awarenessDelta:.04},"Extra inventory loses some appeal after the trend peak.",75,{targetSkuId:apparelSku.id,momentumDelta:-.12}),
      choice("capsule","Keep it scarce","Use a limited drop to strengthen the brand.","Momentum +0.14; confidence +2 points.",{targetSkuId:apparelSku.id,momentumDelta:.14,investorConfidenceDelta:.02}),
      choice("core","Protect the core line","Avoid fashion risk and preserve cash.","Awareness +1 point; no inventory bet.",{targetSkuId:apparelSku.id,awarenessDelta:.01}),
    ])] : []),
    ...(electronicsSku ? [at("electronics_component_shortage","Consumer Electronics","🔋","Critical component shortage",`A semiconductor allocation threatens the next ${electronicsSku.name} production window.`,"Cheaper substitute parts protect timing but may hurt reliability; redesigning costs time and money.",[
      choice("priority","Buy priority allocation","Pay to keep the component specification and schedule.",`Cash -${fmt(large)}.`,{cash:-large,targetSkuId:electronicsSku.id}),
      choice("substitute","Approve substitutes","Protect supply at a measurable reliability risk.","Quality -0.04; material costs -5%.",{targetSkuId:electronicsSku.id,qualityDelta:-.04,materialCostPct:-.05}),
      choice("redesign","Redesign the board","Invest in a more resilient architecture.",`Cash -${fmt(medium)}; confidence +2 points.`,{cash:-medium,investorConfidenceDelta:.02},"The redesign improves delivered quality.",70,{targetSkuId:electronicsSku.id,qualityDelta:.045}),
    ])] : []),
    at("funding_pressure", "Capital", "💼", "Backers want a plan", "Capital partners want a sharper answer on growth versus resilience.", `Cash is $${Math.round(w.player.cash).toLocaleString()} and investor confidence is ${Math.round(w.investorConfidence * 100)}%.`, [
      choice("growth", "Commit to growth", "Spend now and make a visible operating promise.", `Cash -${fmt(medium)}; confidence +7 points.`, { cash: -medium, investorConfidenceDelta: .07 }, "The plan lifts momentum if the team executes.", 60, { momentumDelta: .1 }),
      choice("profit", "Prioritize resilience", "Protect cash and lower the growth promise.", "Confidence -2 points; material costs -2% through discipline.", { investorConfidenceDelta: -.02, materialCostPct: -.02 }),
      choice("independent", "Push back", "Keep strategic freedom at the cost of goodwill.", "Confidence -9 points.", { investorConfidenceDelta: -.09 }),
    ]),
  ];
}

function eligibleEvents(w: World) {
  return eventTemplates(w).filter((event) => {
    if (event.templateId === "supplier_shock") return w.player.skus.some((s) => !s.archived && (s.status === "designed" || s.status === "manufacturing" || s.status === "active"));
    if (event.templateId === "quality_crisis" || event.templateId === "viral_ip" || event.templateId === "trend_shift") return w.player.skus.some((s) => !s.archived && s.releasedToMarket);
    if (event.templateId === "retailer_ultimatum") return w.player.contracts.length > 0;
    if (event.templateId === "employee_retention") return w.player.personnel.length >= 3;
    if (event.templateId === "competitor_attack") return w.player.skus.some((s) => s.releasedToMarket);
    return true;
  });
}

export function resolveDecision(w: World, choiceId: string) {
  const event = w.gameplay.pendingDecision;
  if (!event) return { ok: false as const, reason: "There is no open decision." };
  const selected = event.choices.find((c) => c.id === choiceId);
  if (!selected) return { ok: false as const, reason: "That option is no longer available." };
  applyEffects(w, selected.immediate);
  if (selected.delayed && selected.delayedText) w.gameplay.delayedConsequences.push({ id: `${event.id}_${choiceId}`, dueTick: w.tick + selected.delayed.days, sourceTitle: event.title, choiceLabel: selected.label, text: selected.delayedText, effects: selected.delayed.effects });
  w.gameplay.decisionHistory.unshift({ eventId: event.id, templateId: event.templateId, title: event.title, choiceId, choiceLabel: selected.label, resolvedTick: w.tick, immediateText: selected.immediateText, delayedText: selected.delayedText });
  w.gameplay.pendingDecision = null;
  const jitter = Math.abs(Math.imul((w.gameplay.runSeed ^ w.tick) >>> 0, 2654435761) + w.gameplay.decisionHistory.length * 17) % 56;
  w.gameplay.nextDecisionTick = w.tick + 65 + jitter;
  w.events.push({ tick: w.tick, kind: "decision", code: "decision_resolved", text: `${event.icon} ${event.title}: ${selected.label}. ${selected.immediateText}` });
  return { ok: true as const, reason: selected.immediateText };
}

function unlockProgress(w: World) {
  const conditions = achievementConditions(w);
  for (const def of ACHIEVEMENTS) if (conditions[def.id] && !hasAchievement(w, def.id)) {
    w.gameplay.achievements.push({ id: def.id, tick: w.tick });
    w.events.push({ tick: w.tick, kind: "achievement", code: "achievement_unlocked", text: `🏆 Achievement unlocked: ${def.name}`, data: { achievementId: def.id, name: def.name, icon: def.icon } });
  }
  const outcomes = outcomeConditions(w);
  for (const def of OUTCOMES) if (outcomes[def.id] && !hasOutcome(w, def.id)) {
    w.gameplay.outcomes.push({ id: def.id, tick: w.tick });
    w.events.push({ tick: w.tick, kind: "milestone", code: "outcome_unlocked", text: `${def.icon} Run outcome reached: ${def.name}. The company continues in sandbox mode.`, data: { outcomeId: def.id, name: def.name } });
  }
}

export function updateGameplay(w: World) {
  for (const consequence of w.gameplay.delayedConsequences.filter((c) => c.dueTick <= w.tick)) {
    applyEffects(w, consequence.effects);
    w.events.push({ tick: w.tick, kind: "decision", code: "decision_consequence", text: `⏳ ${consequence.sourceTitle}: ${consequence.text}` });
  }
  w.gameplay.delayedConsequences = w.gameplay.delayedConsequences.filter((c) => c.dueTick > w.tick);
  unlockProgress(w);
  // Campaign cases inject authored, case-specific events through the campaign engine.
  // Keep the reusable random-event deck for founder scenarios and sandbox runs.
  if (w.mode === "campaign") return;
  if (w.gameplay.pendingDecision || w.tick < w.gameplay.nextDecisionTick) return;
  const eligible = eligibleEvents(w);
  if (!eligible.length) { w.gameplay.nextDecisionTick += 30; return; }
  let pool = eligible.filter((event) => !w.gameplay.seenTemplates.includes(event.templateId));
  if (!pool.length) { w.gameplay.seenTemplates = []; pool = eligible; }
  const hash = Math.abs(Math.imul((w.gameplay.runSeed ^ w.tick) >>> 0, 2246822519) + w.player.skus.length * 97 + w.player.personnel.length * 53 + w.gameplay.decisionHistory.length * 193);
  const event = pool[hash % pool.length];
  w.gameplay.pendingDecision = event;
  w.gameplay.seenTemplates.push(event.templateId);
  w.events.push({ tick: w.tick, kind: "decision", code: "decision_required", text: `${event.icon} Decision required: ${event.title}` });
}

export function scenarioProgress(w: World) {
  const activeProducts = w.player.skus.filter((s) => s.releasedToMarket);
  const profitable = (w.live?.income.profit ?? 0) > 0;
  const map: Record<ScenarioId, { label: string; detail: string; done: boolean }[]> = {
    bootstrap_brand: [
      { label: "Make the first sale", detail: "Release a product and sell a unit.", done: activeProducts.some((s) => s.unitsSoldTotal > 0) },
      { label: "Reach profitability", detail: "Post a positive quarterly profit run-rate.", done: profitable },
      { label: "Self-fund growth", detail: "Hold $1M cash without more than $500k debt.", done: w.player.cash >= 1_000_000 && w.player.debt <= 500_000 },
    ],
    premium_challenger: [
      { label: "Launch premium craft", detail: "Release an AA or AAA product.", done: activeProducts.some((s) => s.projectTier === "AA" || s.projectTier === "AAA") },
      { label: "Earn quality authority", detail: "Reach 75% perceived quality on a live product.", done: activeProducts.some((s) => s.perceivedQuality >= .75) },
      { label: "Make premium profitable", detail: "Post positive profit.", done: profitable },
    ],
    turnaround: [
      { label: "Stabilize cash", detail: "Hold positive cash.", done: w.player.cash > 0 },
      { label: "Return to profit", detail: "Post positive profit.", done: profitable },
      { label: "Cut leverage", detail: "Reduce debt below $400k.", done: w.player.debt < 400_000 },
    ],
    retailer_growth: [
      { label: "Win distribution", detail: "Sign two retail relationships.", done: w.player.contracts.length >= 2 },
      { label: "Build a three-product shelf", detail: "Release three products.", done: activeProducts.length >= 3 },
      { label: "Regain leverage", detail: "Reach $1M quarterly revenue profitably.", done: (w.live?.income.netRevenue ?? 0) >= 1_000_000 && profitable },
    ],
    ip_breakout: [
      { label: "Create original IP", detail: "Own a company IP asset.", done: w.ipAssets.some((ip) => ip.ownerType === "player") },
      { label: "Attach IP to a product", detail: "Release an owned-IP product.", done: activeProducts.some((s) => w.ipAssets.some((ip) => ip.id === s.ipId && ip.ownerType === "player")) },
      { label: "Create a breakout", detail: "Generate a breakout hit.", done: activeProducts.some((s) => s.breakout) },
    ],
  };
  return map[w.gameplay.scenarioId];
}

export function legacyScore(w: World) {
  const valueScore = Math.min(4000, Math.round(estimatedCompanyValue(w) / 25_000));
  return valueScore + w.gameplay.achievements.length * 250 + w.gameplay.outcomes.length * 700 + w.gameplay.decisionHistory.length * 40;
}
