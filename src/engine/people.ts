import type { IndustryConfig, Personnel, PersonnelAttributes, PersonnelRole, TalentCandidate, TalentSearchMode, World } from "./types";
import { BASE_SALARIES } from "./types";
import { recordPeopleEvent } from "./chronicle";
import { INDUSTRIES } from "./industries";

const FIRST_NAMES = [
  "Sarah","Maya","Elena","Priya","Sofia","Nina","Aisha","Hannah","Lucia","Camila","Mei","Grace","Zoe","Amara","Julia","Leila",
  "Daniel","Mateo","Noah","Ethan","Leo","Owen","Julian","Marco","Adrian","Samir","Kenji","Lucas","Andre","David","Victor","Jonah",
];
const LAST_NAMES = [
  "Chen","Martinez","Patel","Brooks","Kim","Rivera","Morgan","Nguyen","Silva","Okafor","Bennett","Sato","Ramirez","Fischer","Costa","Reed",
  "Khan","Rossi","Turner","Alvarez","Park","Dubois","Shah","Miller","Torres","Ibrahim","Wang","Sullivan","Nakamura","Flores","Young","Moretti",
];

export const ROLE_LABELS: Record<PersonnelRole, string> = {
  product_manager: "Product",
  finance: "Finance",
  marketing: "Marketing",
  strategy: "Strategy",
  operations: "Operations",
};

const TITLES: Record<PersonnelRole, [string, string, string, string]> = {
  product_manager: ["Product Manager", "Senior Product Manager", "Director of Product", "VP Product"],
  finance: ["Financial Analyst", "Finance Manager", "Finance Director", "VP Finance"],
  marketing: ["Marketing Manager", "Senior Marketing Manager", "Marketing Director", "VP Marketing"],
  strategy: ["Strategy Analyst", "Strategy Manager", "Strategy Director", "VP Strategy"],
  operations: ["Operations Manager", "Senior Operations Manager", "Operations Director", "VP Operations"],
};

const TRAITS = [
  "Consumer instinct","Calm operator","Fast learner","Creative thinker","Commercial edge","Detail obsessed",
  "Team builder","Analytical","Hands-on","Big-picture thinker","Reliable executor","Strong communicator",
];

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export function titleFor(role: PersonnelRole, level = 1): string {
  return TITLES[role][Math.max(0, Math.min(3, Math.round(level) - 1))];
}

export function starsFor(value: number): number {
  return Math.max(1, Math.min(5, Math.round(clamp(value) * 4 + 1)));
}

export function normalizedAttributes(p: Partial<Personnel>): PersonnelAttributes {
  const fallback = clamp(Number(p.skill ?? 0.45));
  const attrs = p.attributes;
  return {
    expertise: clamp(attrs?.expertise ?? fallback),
    execution: clamp(attrs?.execution ?? fallback),
    creativity: clamp(attrs?.creativity ?? fallback),
    leadership: clamp(attrs?.leadership ?? fallback * 0.9),
    commercial: clamp(attrs?.commercial ?? fallback * 0.9),
  };
}

export function roleEffectiveness(p: Personnel, productKey?: string | null): number {
  const a = normalizedAttributes(p);
  let score = p.skill ?? 0.45;
  if (p.role === "product_manager") score = a.expertise * .26 + a.execution * .24 + a.creativity * .27 + a.commercial * .15 + a.leadership * .08;
  if (p.role === "marketing") score = a.creativity * .34 + a.commercial * .32 + a.execution * .20 + a.expertise * .10 + a.leadership * .04;
  if (p.role === "finance") score = a.execution * .35 + a.expertise * .35 + a.leadership * .16 + a.commercial * .10 + a.creativity * .04;
  if (p.role === "strategy") score = a.expertise * .30 + a.commercial * .25 + a.leadership * .18 + a.creativity * .17 + a.execution * .10;
  if (p.role === "operations") score = a.execution * .38 + a.leadership * .24 + a.expertise * .20 + a.commercial * .12 + a.creativity * .06;
  if (productKey && p.specialty === productKey) score += .08;
  return clamp(score);
}

export function teamEffectiveness(w: World, role: PersonnelRole): number {
  const staff = w.player.personnel.filter((p) => p.role === role);
  const seated = staff.filter((p) => w.player.operatingRooms.some((r) => r.kind === "office" && r.assignedPersonnelIds.includes(p.id)));
  if (!seated.length) return 0;
  const weighted = seated.reduce((sum, p) => sum + roleEffectiveness(p), 0) / seated.length;
  const depthBonus = Math.min(.14, Math.log2(seated.length + 1) * .055);
  return clamp(weighted + depthBonus);
}

export function productManagerEffectiveness(p: Personnel, productKey: string): number {
  return roleEffectiveness(p, productKey);
}

function rarityFromSkill(skill: number): Personnel["rarity"] {
  if (skill >= .82) return "legendary";
  if (skill >= .68) return "epic";
  if (skill >= .53) return "rare";
  if (skill >= .37) return "uncommon";
  return "common";
}

function roleBiasedAttributes(role: PersonnelRole, base: number): PersonnelAttributes {
  const jitter = () => clamp(base + rand(-.15, .15));
  const a: PersonnelAttributes = { expertise: jitter(), execution: jitter(), creativity: jitter(), leadership: jitter(), commercial: jitter() };
  if (role === "product_manager") { a.creativity = clamp(a.creativity + .12); a.expertise = clamp(a.expertise + .08); }
  if (role === "marketing") { a.creativity = clamp(a.creativity + .13); a.commercial = clamp(a.commercial + .12); }
  if (role === "finance") { a.execution = clamp(a.execution + .13); a.expertise = clamp(a.expertise + .10); }
  if (role === "strategy") { a.expertise = clamp(a.expertise + .10); a.commercial = clamp(a.commercial + .08); }
  if (role === "operations") { a.execution = clamp(a.execution + .15); a.leadership = clamp(a.leadership + .07); }
  return a;
}

function uniqueName(existing: Set<string>): string {
  for (let i = 0; i < 20; i++) {
    const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    if (!existing.has(name)) return name;
  }
  return `Candidate ${Math.floor(Math.random() * 900 + 100)}`;
}

export function generateCandidate(role: PersonnelRole, cfg: IndustryConfig, companyExpertise: number, existingNames = new Set<string>(), qualityBias = 0): TalentCandidate {
  const levelRoll = Math.random() + companyExpertise * .035 + qualityBias * .65;
  const level = (levelRoll > 1.30 ? 4 : levelRoll > 1.08 ? 3 : levelRoll > .76 ? 2 : 1) as 1 | 2 | 3 | 4;
  const base = clamp(rand(.28, .58) + companyExpertise * .035 + (level - 1) * .08 + qualityBias, .2, .96);
  const attributes = roleBiasedAttributes(role, base);
  const overall = Object.values(attributes).reduce((a, b) => a + b, 0) / 5;
  const rarity = rarityFromSkill(overall);
  const salaryMult = 1 + (level - 1) * .55 + Math.max(0, overall - .45) * 1.5;
  const specialty = role === "product_manager" || role === "marketing"
    ? cfg.products[Math.floor(Math.random() * cfg.products.length)]?.key ?? null
    : null;
  const age = Math.round(rand(25 + (level - 1) * 4, 37 + (level - 1) * 6));
  const name = uniqueName(existingNames);
  return {
    id: `cand_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
    name,
    role,
    age,
    level,
    title: titleFor(role, level),
    salaryAsk: Math.round(BASE_SALARIES[role] * salaryMult / 250) * 250,
    skill: overall,
    rarity,
    potential: clamp(rand(overall, Math.min(1, overall + .32))),
    attributes,
    specialty,
    traits: [TRAITS[Math.floor(Math.random() * TRAITS.length)], TRAITS[Math.floor(Math.random() * TRAITS.length)]].filter((v, i, a) => a.indexOf(v) === i),
  };
}

export function refreshTalentMarket(w: World) {
  const exp = Math.max(w.player.expertise.industry[w.cfg.id] ?? 0, ...Object.values(w.player.expertise.category), 0);
  const names = new Set([...w.player.personnel, ...(w.player.formerPersonnel ?? [])].map((p) => p.name));
  const roles: PersonnelRole[] = ["product_manager", "finance", "marketing", "strategy", "operations"];
  const candidates: TalentCandidate[] = [];
  for (const role of roles) {
    for (let i = 0; i < 2; i++) {
      const c = generateCandidate(role, w.cfg, exp, names);
      names.add(c.name); candidates.push(c);
    }
  }
  w.player.talentMarket = candidates;
  w.player.talentMarketRefreshTick = w.tick;
}

export function candidateToPersonnel(c: TalentCandidate, tick: number): Personnel {
  return {
    id: `p_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
    name: c.name,
    role: c.role,
    rarity: c.rarity,
    salary: c.salaryAsk,
    skill: c.skill,
    age: c.age,
    hiredTick: tick,
    level: c.level,
    title: c.title,
    potential: c.potential,
    performance: .55,
    morale: .72,
    attributes: { ...c.attributes },
    specialty: c.specialty,
    traits: [...c.traits],
    careerEvents: [{ tick, kind: "hire", text: `Joined the company as ${c.title}.` }],
    lastPromotionTick: tick,
  };
}

export function enrichLegacyPerson(p: Personnel, tick: number, cfg: IndustryConfig): Personnel {
  const attrs = normalizedAttributes(p);
  const level = (p.level ?? 1) as 1 | 2 | 3 | 4;
  p.age = p.age ?? Math.round(rand(27, 43));
  p.hiredTick = p.hiredTick ?? Math.max(0, tick - Math.round(rand(30, 300)));
  p.level = level;
  p.title = p.title ?? titleFor(p.role, level);
  p.potential = p.potential ?? clamp((p.skill ?? .45) + rand(.08, .28));
  p.performance = p.performance ?? .58;
  p.morale = p.morale ?? .7;
  p.attributes = attrs;
  p.specialty = p.specialty ?? ((p.role === "product_manager" || p.role === "marketing") ? (cfg.products[0]?.key ?? null) : null);
  p.traits = p.traits?.length ? p.traits : [TRAITS[Math.floor(Math.random() * TRAITS.length)]];
  p.careerEvents = p.careerEvents ?? [{ tick: p.hiredTick, kind: "hire", text: `Joined the company as ${p.title}.` }];
  p.lastPromotionTick = p.lastPromotionTick ?? p.hiredTick;
  return p;
}

export function canPromotePerson(w: World, p: Personnel): { ok: boolean; reason: string } {
  if ((p.level ?? 1) >= 4) return { ok: false, reason: "Already at VP level." };
  const since = w.tick - Math.max(p.hiredTick ?? 0, p.lastPromotionTick ?? 0);
  if (since < 360) return { ok: false, reason: `Needs ${Math.ceil((360 - since) / 30)} more months at current level.` };
  if ((p.performance ?? .5) < .64) return { ok: false, reason: "Performance must reach 64%." };
  return { ok: true, reason: "Ready for promotion." };
}

export function promotePerson(w: World, p: Personnel): boolean {
  if (!canPromotePerson(w, p).ok) return false;
  p.level = Math.min(4, (p.level ?? 1) + 1) as 1 | 2 | 3 | 4;
  p.title = titleFor(p.role, p.level);
  p.salary = Math.round(p.salary * 1.22 / 250) * 250;
  p.skill = clamp((p.skill ?? .45) + .025);
  p.attributes.leadership = clamp(p.attributes.leadership + .05);
  p.morale = clamp((p.morale ?? .7) + .16);
  p.lastPromotionTick = w.tick;
  p.careerEvents.push({ tick: w.tick, kind: "promotion", text: `Promoted to ${p.title}.` });
  return true;
}

export function archivePerson(w: World, id: string, reason: string) {
  const p = w.player.personnel.find((x) => x.id === id);
  if (!p) return;
  p.careerEvents.push({ tick: w.tick, kind: "departure", text: reason });
  w.player.formerPersonnel = w.player.formerPersonnel ?? [];
  w.player.formerPersonnel.push({ ...p, leftTick: w.tick, leftReason: reason });
  w.player.personnel = w.player.personnel.filter((x) => x.id !== id);
  for (const room of w.player.operatingRooms) room.assignedPersonnelIds = room.assignedPersonnelIds.filter((pid) => pid !== id);
}

function performanceTarget(w: World, p: Personnel): number {
  const seated = w.player.operatingRooms.some((r) => r.kind === "office" && r.assignedPersonnelIds.includes(p.id));
  if (!seated) return .34;
  let target = .54 + roleEffectiveness(p) * .24;
  if (p.role === "product_manager") {
    const led = w.player.skus.filter((s) => s.assignedPmId === p.id);
    if (led.length) {
      const impact = led.reduce((sum, s) => sum + s.designQuality * .35 + s.fame * .25 + Math.min(1, s.unitsSoldTotal / 100_000) * .4, 0) / led.length;
      target += impact * .17;
    }
  }
  if (p.role === "marketing") target += Math.min(.12, (w.player.marketing + w.player.brandMarketing) / 2_000_000);
  if (p.role === "operations") target += Math.max(-.08, .08 - Math.min(.16, w.player.lostSales / 500_000));
  if (p.role === "finance" && (w.live?.income.profit ?? 0) > 0) target += .05;
  if (p.role === "strategy" && Object.keys(w.revealed).length > 0) target += .04;
  return clamp(target, .2, .94);
}

export function updatePeopleQuarter(w: World) {
  for (const p of w.player.personnel) {
    const target = performanceTarget(w, p);
    p.performance = clamp((p.performance ?? .55) * .72 + target * .28);
    const seated = w.player.operatingRooms.some((r) => r.kind === "office" && r.assignedPersonnelIds.includes(p.id));
    const promoReady = canPromotePerson(w, p).ok;
    const moraleTarget = seated ? (promoReady ? .62 : .76) : .38;
    p.morale = clamp((p.morale ?? .7) * .82 + moraleTarget * .18);
  }
}

export function updatePeopleYear(w: World) {
  const departures: { id: string; reason: string }[] = [];
  for (const p of w.player.personnel) {
    p.age = (p.age ?? 30) + 1;
    const growthRoom = Math.max(0, (p.potential ?? p.skill) - p.skill);
    const growth = Math.min(.035, growthRoom * .12) * (0.65 + (p.performance ?? .55) * .55);
    p.skill = clamp(p.skill + growth);
    p.attributes.expertise = clamp(p.attributes.expertise + growth * .9);
    p.attributes.execution = clamp(p.attributes.execution + growth * .7);
    if (p.age >= 68 || (p.age >= 64 && Math.random() < .28)) {
      departures.push({ id: p.id, reason: `Retired at age ${p.age}.` });
      continue;
    }
    const poachable = roleEffectiveness(p) > .76 && (p.morale ?? .7) < .64;
    const leaveChance = .008 + ((p.morale ?? .7) < .48 ? .06 : 0) + (poachable ? .025 : 0);
    if (Math.random() < leaveChance) departures.push({ id: p.id, reason: poachable ? "Left after being recruited by a rival." : "Left the company for another opportunity." });
  }
  for (const d of departures) {
    const p = w.player.personnel.find((x) => x.id === d.id);
    if (p) {
      w.events.push({ tick: w.tick, kind: "people", text: `👤 ${p.name} — ${d.reason}` });
      recordPeopleEvent(w, p.id, `${p.name} left the company`, `${p.name}, ${p.title}, ${d.reason.charAt(0).toLowerCase()}${d.reason.slice(1)}`, "departure", p.level >= 3 || p.age >= 64 ? 2 : 1);
    }
    archivePerson(w, d.id, d.reason);
  }
}


export const TALENT_SEARCH_MODES: Record<TalentSearchMode, { label: string; days: number; cost: number; candidates: number; qualityBias: number; blurb: string }> = {
  quick: { label: "Quick available search", days: 2, cost: 5_000, candidates: 3, qualityBias: -.08, blurb: "Who can interview immediately? Fast and cheap, but the slate is usually ordinary." },
  online: { label: "Search online", days: 7, cost: 18_000, candidates: 4, qualityBias: .025, blurb: "A normal market search with a broader pool and better odds of a strong fit." },
  deep: { label: "Deep search", days: 21, cost: 55_000, candidates: 5, qualityBias: .15, blurb: "The agency actively maps the market and approaches stronger candidates. Slow and expensive." },
};

export function startTalentSearch(w: World, role: PersonnelRole, industryId: string, mode: TalentSearchMode): { ok: boolean; reason?: string } {
  if (w.player.talentSearch) return { ok: false, reason: "A recruiting search is already in progress." };
  const cfg = (awaitIndustry(industryId));
  if (!cfg) return { ok: false, reason: "Unknown industry." };
  const def = TALENT_SEARCH_MODES[mode];
  if (w.player.cash < def.cost) return { ok: false, reason: "Not enough cash for that search." };
  w.player.cash -= def.cost;
  w.player.talentMarket = [];
  w.player.talentSearch = { id: `talent_search_${w.tick}_${Math.floor(Math.random()*1_000_000)}`, role, industryId, mode, startedTick: w.tick, daysLeft: def.days, totalDays: def.days, cost: def.cost };
  return { ok: true };
}

function awaitIndustry(industryId: string): IndustryConfig | null { return INDUSTRIES[industryId] ?? null; }

export function updateTalentSearch(w: World) {
  const search = w.player.talentSearch;
  if (!search) return;
  search.daysLeft = Math.max(0, search.daysLeft - 1);
  if (search.daysLeft > 0) return;
  const cfg = INDUSTRIES[search.industryId] ?? w.cfg;
  const def = TALENT_SEARCH_MODES[search.mode];
  const exp = Math.max(w.player.expertise.industry[search.industryId] ?? 0, ...Object.values(w.player.expertise.category), 0);
  const names = new Set([...w.player.personnel, ...(w.player.formerPersonnel ?? [])].map((p) => p.name));
  const results: TalentCandidate[] = [];
  for (let i = 0; i < def.candidates; i++) {
    const c = generateCandidate(search.role, cfg, exp, names, def.qualityBias);
    names.add(c.name);
    results.push(c);
  }
  w.player.talentMarket = results.sort((a,b) => b.skill - a.skill);
  w.player.talentMarketRefreshTick = w.tick;
  w.player.talentSearch = null;
  w.events.push({ tick: w.tick, kind: "people", text: `🔎 Recruiting search complete — ${results.length} ${ROLE_LABELS[search.role].toLowerCase()} candidates are ready to review.` });
}
