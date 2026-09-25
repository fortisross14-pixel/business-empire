import type { InvestorType, World } from "./types";
import { clamp } from "./industries";
import { difficultyConfig } from "./difficulty";
import { estimatedCompanyValue } from "./ip";

const INVESTORS: Record<InvestorType, string[]> = {
  venture: ["Northstar Ventures", "Summit Growth", "Foundry Capital"],
  family_office: ["Hawthorne Partners", "Alder Family Office", "Beacon Holdings"],
  strategic: ["Meridian Consumer Group", "Atlas Brands", "Keystone Industries"],
};

export function createCapitalState() {
  return { dilutionPct: 0, relationships: [], rounds: [], lastRaiseTick: -9999 };
}

export function creditLimit(w: World): number {
  const base = w.difficulty === "entrepreneur" ? 4_000_000 : w.difficulty === "standard" ? 2_000_000 : 500_000;
  const expectations = difficultyConfig(w.difficulty).investorExpectations;
  return Math.round(base * (expectations > 0 ? .35 + w.investorConfidence * .65 : 1));
}

export function capitalMetrics(w: World) {
  const quarterlyBurn = Math.max(0, -(w.live?.cashflow.operatingCashFlow ?? w.live?.income.profit ?? 0));
  return {
    companyValue: estimatedCompanyValue(w),
    founderOwnership: clamp(1 - w.capital.dilutionPct, 0, 1),
    creditLimit: creditLimit(w),
    creditAvailable: Math.max(0, creditLimit(w) - w.player.debt),
    runwayDays: quarterlyBurn > 0 ? Math.max(0, Math.round((w.player.cash / quarterlyBurn) * 90)) : null,
    annualInterest: w.player.debt * .10,
  };
}

export function connectInvestor(w: World, type: InvestorType) {
  const existing = w.capital.relationships.find((r) => r.type === type);
  if (existing) return { ok: false as const, reason: `${existing.name} is already in your network.` };
  const cost = 15_000;
  if (w.player.cash < cost) return { ok: false as const, reason: "You need $15k for introductions, diligence and legal preparation." };
  const names = INVESTORS[type];
  const name = names[(w.tick + w.capital.relationships.length) % names.length];
  const relationship = clamp(.35 + w.investorConfidence * .35 + Math.min(.15, w.player.skus.length * .025), 0, 1);
  w.player.cash -= cost;
  w.capital.relationships.push({ id: `investor_${type}_${w.tick}`, name, type, relationship, connectedTick: w.tick });
  w.events.push({ tick: w.tick, kind: "finance", code: "capital_action", text: `🤝 Connected with ${name}. They are open to hearing a focused growth plan.` });
  return { ok: true as const, reason: `Connected with ${name}.` };
}

export function drawCredit(w: World, amount: number) {
  const draw = Math.max(0, Math.min(amount, creditLimit(w) - w.player.debt));
  if (draw <= 0) return { ok: false as const, reason: "Credit request denied — the available line is exhausted." };
  w.player.cash += draw;
  w.player.debt += draw;
  w.events.push({ tick: w.tick, kind: "finance", code: "capital_action", text: `🏦 Drew $${Math.round(draw).toLocaleString()} from the company credit line.` });
  return { ok: true as const, reason: "Credit received." };
}

export function requestGrowthLoan(w: World, amount: number) {
  const metrics = capitalMetrics(w);
  const maxLoan = Math.max(500_000, Math.min(4_000_000, metrics.companyValue * .28 + w.investorConfidence * 1_000_000));
  if (amount > maxLoan || w.investorConfidence < .22) return { ok: false as const, reason: `Lenders will currently approve up to $${Math.round(maxLoan).toLocaleString()}. Improve results or request less.` };
  if (w.tick - w.capital.lastRaiseTick < 90) return { ok: false as const, reason: "The company closed financing recently. Build a quarter of operating evidence first." };
  w.player.cash += amount;
  w.player.debt += amount;
  w.capital.lastRaiseTick = w.tick;
  w.capital.rounds.push({ id: `loan_${w.tick}`, tick: w.tick, kind: "growth_loan", amount, dilutionPct: 0, counterparty: "Growth lender" });
  w.events.push({ tick: w.tick, kind: "finance", code: "capital_action", text: `🏦 Growth loan approved: $${Math.round(amount).toLocaleString()}. Debt service rises, but ownership is unchanged.` });
  return { ok: true as const, reason: "Growth loan approved." };
}

export function raiseEquity(w: World, investorId: string, amount: number) {
  const investor = w.capital.relationships.find((r) => r.id === investorId);
  if (!investor) return { ok: false as const, reason: "Build an investor relationship before raising equity." };
  if (w.tick - w.capital.lastRaiseTick < 180) return { ok: false as const, reason: "Investors want at least two quarters of progress after the previous financing." };
  const valuation = Math.max(1_000_000, estimatedCompanyValue(w) * (.75 + investor.relationship * .65));
  const dilution = clamp(amount / (valuation + amount), .04, .28);
  if (w.capital.dilutionPct + dilution > .55) return { ok: false as const, reason: "This round would take outside ownership beyond 55%. Build more value before raising again." };
  w.player.cash += amount;
  w.capital.dilutionPct += dilution;
  w.capital.lastRaiseTick = w.tick;
  w.investorConfidence = clamp(w.investorConfidence + .08, 0, 1);
  w.capital.rounds.push({ id: `equity_${w.tick}`, tick: w.tick, kind: "equity", amount, dilutionPct: dilution, counterparty: investor.name });
  w.events.push({ tick: w.tick, kind: "finance", code: "capital_action", text: `📈 ${investor.name} invested $${Math.round(amount).toLocaleString()} for ${(dilution * 100).toFixed(1)}% of the company.` });
  return { ok: true as const, reason: `Round closed with ${(dilution * 100).toFixed(1)}% dilution.` };
}
