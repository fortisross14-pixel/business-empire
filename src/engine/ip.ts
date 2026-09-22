import type { AxisKey, Cell, IPAsset, IPLicenseContract, SKU, SkuResult, World } from "./types";
import { TICKS_PER_QUARTER, TICKS_PER_YEAR } from "./types";
import { AXES, clamp } from "./industries";
import { archetypeByKey, PRODUCT_ARCHETYPES } from "./productCatalog";
import { recordChronicle } from "./chronicle";

export const ORIGINAL_IP_CREATION_COST = 100_000;

export interface IPAudiencePreset {
  id: string;
  label: string;
  description: string;
  audience: Record<AxisKey, number>;
}

const aud = (age: number, family: number, gender = 0.5, klass = 0.5, leaning = 0.5, geography = 0.5): Record<AxisKey, number> => ({
  age, family, gender, class: klass, leaning, geography,
});

export const IP_AUDIENCE_PRESETS: IPAudiencePreset[] = [
  { id: "kids_family", label: "Kids & Families", description: "Parents, children and family households; strongest for character-led mass products.", audience: aud(0.28, 0.92, 0.5, 0.48, 0.5, 0.55) },
  { id: "teen_fandom", label: "Teens & Fandom", description: "Younger, urban, collector-oriented audiences that react strongly to momentum.", audience: aud(0.12, 0.28, 0.5, 0.52, 0.48, 0.72) },
  { id: "broad_pop", label: "Broad Pop Culture", description: "Mainstream reach across age and household types; flexible but less concentrated.", audience: aud(0.42, 0.55, 0.5, 0.5, 0.5, 0.55) },
  { id: "adult_premium", label: "Adult Premium", description: "Older, affluent consumers; prestige matters more than pure momentum.", audience: aud(0.68, 0.42, 0.5, 0.78, 0.5, 0.68) },
  { id: "nostalgia", label: "Nostalgia & Collectors", description: "Adults buying into remembered worlds, display pieces and collectible culture.", audience: aud(0.58, 0.32, 0.5, 0.64, 0.5, 0.62) },
];

interface ExternalIPSeed {
  id: string;
  name: string;
  ownerName: string;
  awareness: number;
  momentum: number;
  prestige: number;
  fatigue: number;
  audiencePresetId: string;
  compatibleProductFamilies: string[];
  royaltyRate: number;
  minimumGuarantee: number;
}

// These are content, not branches in the engine. Future industries can reuse the same IPs simply
// by registering product archetype keys that appear in compatibleProductFamilies.
const EXTERNAL_IP_SEEDS: ExternalIPSeed[] = [
  { id: "space_opera", name: "Galaxy Knights", ownerName: "Northstar Pictures", awareness: .82, momentum: 1.24, prestige: .84, fatigue: .14, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "buildingset", "vehicle", "collectible", "plush", "boardgame", "electronictoy", "cereal", "tshirt", "backpack"], royaltyRate: .095, minimumGuarantee: 520_000 },
  { id: "superhero", name: "Titan Heroes Universe", ownerName: "Titan Media", awareness: .91, momentum: 1.16, prestige: .88, fatigue: .28, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "buildingset", "vehicle", "collectible", "plush", "boardgame", "electronictoy", "cereal", "snack", "tshirt", "backpack"], royaltyRate: .105, minimumGuarantee: 720_000 },
  { id: "princess_magic", name: "Enchanted Kingdoms", ownerName: "Crownlight Entertainment", awareness: .88, momentum: 1.08, prestige: .82, fatigue: .22, audiencePresetId: "kids_family", compatibleProductFamilies: ["doll", "plush", "buildingset", "collectible", "boardgame", "mask", "hydration", "cereal", "tshirt", "backpack"], royaltyRate: .10, minimumGuarantee: 650_000 },
  { id: "animated_kids", name: "Sunny Pals", ownerName: "Sunbeam Animation", awareness: .70, momentum: 1.34, prestige: .58, fatigue: .10, audiencePresetId: "kids_family", compatibleProductFamilies: ["plush", "doll", "boardgame", "buildingset", "actionfig", "cereal", "snack", "yogurt", "backpack"], royaltyRate: .075, minimumGuarantee: 310_000 },
  { id: "monster_world", name: "Creature Realms", ownerName: "Midnight Forge", awareness: .74, momentum: 1.42, prestige: .68, fatigue: .08, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "buildingset", "boardgame", "plush", "electronictoy", "cereal", "snack", "tshirt"], royaltyRate: .085, minimumGuarantee: 380_000 },
  { id: "fantasy_saga", name: "Realm of Crowns", ownerName: "Silver Quill Studios", awareness: .76, momentum: .98, prestige: .91, fatigue: .07, audiencePresetId: "adult_premium", compatibleProductFamilies: ["actionfig", "collectible", "buildingset", "boardgame", "doll", "tshirt", "backpack"], royaltyRate: .085, minimumGuarantee: 420_000 },
  { id: "retro_arcade", name: "Retro Arcade Classics", ownerName: "Vector Interactive", awareness: .52, momentum: 1.12, prestige: .62, fatigue: .05, audiencePresetId: "nostalgia", compatibleProductFamilies: ["electronictoy", "collectible", "actionfig", "buildingset", "boardgame", "soda", "tshirt"], royaltyRate: .055, minimumGuarantee: 120_000 },
  { id: "global_soccer", name: "World Football League", ownerName: "World Football Licensing", awareness: .90, momentum: 1.05, prestige: .86, fatigue: .18, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "vehicle", "cereal", "snack", "soda", "tshirt", "backpack"], royaltyRate: .09, minimumGuarantee: 600_000 },
  { id: "global_basket", name: "Pro Basketball Association", ownerName: "PBA Properties", awareness: .83, momentum: 1.18, prestige: .80, fatigue: .14, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "cereal", "snack", "soda", "tshirt", "backpack"], royaltyRate: .085, minimumGuarantee: 510_000 },
  { id: "racing_cars", name: "Speedway Legends", ownerName: "Velocity Rights", awareness: .67, momentum: 1.08, prestige: .72, fatigue: .11, audiencePresetId: "broad_pop", compatibleProductFamilies: ["vehicle", "buildingset", "collectible", "actionfig", "electronictoy", "cereal", "tshirt"], royaltyRate: .07, minimumGuarantee: 260_000 },
  { id: "pop_music", name: "Global Pop Icons", ownerName: "Pulse Entertainment", awareness: .89, momentum: 1.52, prestige: .73, fatigue: .31, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["doll", "collectible", "plush", "mask", "hydration", "tshirt", "backpack", "soda"], royaltyRate: .11, minimumGuarantee: 760_000 },
  { id: "indie_comics", name: "Indie Comics Universe", ownerName: "Panel House", awareness: .34, momentum: 1.26, prestige: .48, fatigue: .03, audiencePresetId: "teen_fandom", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "tshirt"], royaltyRate: .045, minimumGuarantee: 65_000 },
  { id: "nature_doc", name: "Planet Wild", ownerName: "Terra Documentary Group", awareness: .46, momentum: .93, prestige: .70, fatigue: .02, audiencePresetId: "adult_premium", compatibleProductFamilies: ["plush", "boardgame", "buildingset", "sunscreen", "tshirt"], royaltyRate: .04, minimumGuarantee: 55_000 },
  { id: "local_sport", name: "National League", ownerName: "National League Properties", awareness: .43, momentum: 1.02, prestige: .47, fatigue: .09, audiencePresetId: "broad_pop", compatibleProductFamilies: ["actionfig", "collectible", "boardgame", "tshirt", "snack"], royaltyRate: .045, minimumGuarantee: 80_000 },
  { id: "cooking_show", name: "Master Kitchen", ownerName: "Tabletop Media", awareness: .38, momentum: 1.10, prestige: .45, fatigue: .08, audiencePresetId: "broad_pop", compatibleProductFamilies: ["boardgame", "doll", "mask", "cereal", "snack", "frozenpizza"], royaltyRate: .04, minimumGuarantee: 70_000 },
];

function presetById(id: string): IPAudiencePreset {
  return IP_AUDIENCE_PRESETS.find((p) => p.id === id) ?? IP_AUDIENCE_PRESETS[2];
}

export function seedExternalIPs(): IPAsset[] {
  return EXTERNAL_IP_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    ownerType: "external",
    ownerName: seed.ownerName,
    createdTick: 0,
    awareness: seed.awareness,
    momentum: seed.momentum,
    prestige: seed.prestige,
    fatigue: seed.fatigue,
    audience: { ...presetById(seed.audiencePresetId).audience },
    audienceLabel: presetById(seed.audiencePresetId).label,
    compatibleProductFamilies: [...seed.compatibleProductFamilies],
    marketTerms: { royaltyRate: seed.royaltyRate, minimumGuarantee: seed.minimumGuarantee, durationsYears: [2, 3, 5] },
    lifetimeProductRevenue: 0,
    lifetimeUnits: 0,
    peakAwareness: seed.awareness,
    peakMomentum: seed.momentum,
  }));
}

export function ensureIPFoundation(w: World) {
  const seeded = seedExternalIPs();
  const existingById = new Map((w.ipAssets ?? []).map((ip) => [ip.id, ip]));
  for (const seed of seeded) if (!existingById.has(seed.id)) existingById.set(seed.id, seed);
  w.ipAssets = [...existingById.values()].map((ip) => ({
    ...ip,
    ownerType: ip.ownerType ?? "external",
    ownerName: ip.ownerName ?? "Unknown owner",
    createdTick: ip.createdTick ?? 0,
    awareness: clamp(ip.awareness ?? .2, 0, 1),
    momentum: clamp(ip.momentum ?? 1, .55, 2.2),
    prestige: clamp(ip.prestige ?? .3, 0, 1),
    fatigue: clamp(ip.fatigue ?? 0, 0, 1),
    audience: ip.audience ?? { ...IP_AUDIENCE_PRESETS[2].audience },
    audienceLabel: ip.audienceLabel ?? "Broad Pop Culture",
    compatibleProductFamilies: ip.compatibleProductFamilies ?? [],
    lifetimeProductRevenue: ip.lifetimeProductRevenue ?? 0,
    lifetimeUnits: ip.lifetimeUnits ?? 0,
    peakAwareness: ip.peakAwareness ?? ip.awareness ?? 0,
    peakMomentum: ip.peakMomentum ?? ip.momentum ?? 1,
  }));
  w.ipLicenses = (w.ipLicenses ?? []).map((c) => ({ ...c, royaltiesPaid: c.royaltiesPaid ?? 0, status: c.expiresTick > w.tick ? "active" : "expired" }));
}

export function ipById(w: World, ipId: string | null | undefined): IPAsset | undefined {
  if (!ipId) return undefined;
  return w.ipAssets?.find((ip) => ip.id === ipId);
}

export function activeIPContract(w: World, ipId: string): IPLicenseContract | undefined {
  return w.ipLicenses?.find((c) => c.ipId === ipId && c.status === "active" && c.expiresTick > w.tick);
}

export function ownsIP(w: World, ipId: string): boolean {
  return ipById(w, ipId)?.ownerType === "player";
}

export function hasIPRights(w: World, ipId: string): boolean {
  return ownsIP(w, ipId) || Boolean(activeIPContract(w, ipId));
}

export function ipProductFit(ip: IPAsset, productKey: string): number {
  const archetype = archetypeByKey(productKey);
  if (!archetype) return ip.compatibleProductFamilies.includes(productKey) ? .6 : 0;
  if (archetype.ipPotential <= 0) return 0;
  const explicit = ip.compatibleProductFamilies.includes(productKey);
  return explicit
    ? clamp(.45 + archetype.ipPotential * .55, 0, 1)
    : clamp(archetype.ipPotential * .15, 0, .18);
}

export function canAttachIP(w: World, ipId: string, productKey: string): boolean {
  const ip = ipById(w, ipId);
  return Boolean(ip && hasIPRights(w, ipId) && ipProductFit(ip, productKey) >= .24);
}

export function usableIPsForProduct(w: World, productKey: string): IPAsset[] {
  return (w.ipAssets ?? [])
    .filter((ip) => hasIPRights(w, ip.id) && ipProductFit(ip, productKey) >= .24)
    .sort((a, b) => ipCommercialStrength(b) - ipCommercialStrength(a));
}

export function ipAudienceFit(ip: IPAsset, cell: Cell): number {
  const weights: Record<AxisKey, number> = { age: .30, family: .22, class: .15, gender: .12, geography: .11, leaning: .10 };
  let score = 0;
  let weight = 0;
  for (const axis of Object.keys(weights) as AxisKey[]) {
    const values = AXES[axis];
    const idx = Math.max(0, values.indexOf(cell.coord[axis]));
    const pos = values.length <= 1 ? .5 : idx / (values.length - 1);
    score += (1 - Math.abs(pos - (ip.audience[axis] ?? .5))) * weights[axis];
    weight += weights[axis];
  }
  const normalized = weight > 0 ? score / weight : .5;
  return clamp(.68 + normalized * .58, .68, 1.26);
}

export function ipCommercialStrength(ip: IPAsset): number {
  return clamp(ip.awareness * (.62 + ip.prestige * .38) * ip.momentum * (1 - ip.fatigue * .62), 0, 1.65);
}

export function ipDemandMultiplier(w: World, sku: SKU, cell: Cell): number {
  const ip = ipById(w, sku.ipId);
  if (!ip || !hasIPRights(w, ip.id)) return 1;
  const productFit = ipProductFit(ip, sku.productKey);
  if (productFit <= 0) return 1;
  const strength = ipCommercialStrength(ip);
  const audience = ipAudienceFit(ip, cell);
  const upside = strength * productFit * audience * (.18 + productFit * .22);
  // Very weak forced collaborations can slightly distract from the brand, while strong ones add real pull.
  return clamp(.97 + upside, .94, 1.65);
}

export function ipAwarenessFloor(w: World, sku: SKU, cell: Cell): number {
  const ip = ipById(w, sku.ipId);
  if (!ip || !hasIPRights(w, ip.id)) return 0;
  const fit = ipProductFit(ip, sku.productKey);
  return clamp(ip.awareness * fit * ipAudienceFit(ip, cell) * (1 - ip.fatigue * .45) * .62, 0, .72);
}

export function contractTerms(ip: IPAsset, years: number) {
  const base = ip.marketTerms;
  if (!base) return null;
  const y = base.durationsYears.includes(years) ? years : base.durationsYears[0] ?? 3;
  const durationFactor = y <= 2 ? .72 : y >= 5 ? 1.48 : 1;
  const rateAdjustment = y <= 2 ? .006 : y >= 5 ? -.006 : 0;
  return {
    years: y,
    royaltyRate: clamp(base.royaltyRate + rateAdjustment, .025, .15),
    minimumGuarantee: Math.round(base.minimumGuarantee * durationFactor / 5_000) * 5_000,
  };
}

export function signIPLicense(w: World, ipId: string, years: number): { ok: boolean; reason?: string; contract?: IPLicenseContract } {
  const ip = ipById(w, ipId);
  if (!ip || ip.ownerType !== "external") return { ok: false, reason: "This IP is not available for external licensing." };
  if (activeIPContract(w, ipId)) return { ok: false, reason: "You already hold an active license." };
  const terms = contractTerms(ip, years);
  if (!terms) return { ok: false, reason: "No licensing terms are available." };
  if (w.player.cash < terms.minimumGuarantee) return { ok: false, reason: "Not enough cash for the minimum guarantee." };
  w.player.cash -= terms.minimumGuarantee;
  const contract: IPLicenseContract = {
    id: `iplic_${ipId}_${w.tick}`,
    ipId,
    licensorName: ip.ownerName,
    signedTick: w.tick,
    expiresTick: w.tick + terms.years * TICKS_PER_YEAR,
    durationYears: terms.years,
    royaltyRate: terms.royaltyRate,
    minimumGuarantee: terms.minimumGuarantee,
    status: "active",
    royaltiesPaid: 0,
  };
  w.ipLicenses.push(contract);
  recordChronicle(w, {
    kind: "milestone",
    importance: ip.prestige >= .85 || ip.awareness >= .88 ? 3 : 2,
    title: `${ip.name} license signed`,
    text: `${w.company} licensed ${ip.name} from ${ip.ownerName} for ${terms.years} years, with a $${Math.round(terms.minimumGuarantee).toLocaleString()} minimum guarantee and ${(terms.royaltyRate * 100).toFixed(1)}% royalty.`,
    icon: "🎬", entityType: "ip", entityId: ip.id, tags: ["ip", "licensing", ...(ip.prestige >= .85 ? ["iconic"] : [])],
    dedupeKey: `ip_license_${contract.id}`,
  });
  w.events.push({ tick: w.tick, kind: "ip", text: `🎬 ${ip.name} licensed for ${terms.years} years. Minimum guarantee: $${Math.round(terms.minimumGuarantee).toLocaleString()}.` });
  return { ok: true, contract };
}

export function createOriginalIP(
  w: World,
  name: string,
  audiencePresetId: string,
  compatibleProductFamilies: string[],
): { ok: boolean; reason?: string; ip?: IPAsset } {
  const clean = name.trim();
  if (!clean) return { ok: false, reason: "Name the IP first." };
  if ((w.ipAssets ?? []).some((ip) => ip.name.toLowerCase() === clean.toLowerCase())) return { ok: false, reason: "An IP with that name already exists." };
  const families = Array.from(new Set(compatibleProductFamilies.filter((key) => {
    const archetype = archetypeByKey(key);
    return Boolean(archetype && archetype.ipPotential > 0);
  })));
  if (!families.length) return { ok: false, reason: "Choose at least one IP-capable product family." };
  if (w.player.cash < ORIGINAL_IP_CREATION_COST) return { ok: false, reason: "Not enough cash to develop the IP." };
  const preset = presetById(audiencePresetId);
  w.player.cash -= ORIGINAL_IP_CREATION_COST;
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "original";
  const ip: IPAsset = {
    id: `own_${slug}_${w.tick}_${w.ipAssets.length}`,
    name: clean,
    ownerType: "player",
    ownerName: w.company,
    createdTick: w.tick,
    awareness: .035,
    momentum: 1,
    prestige: .12,
    fatigue: 0,
    audience: { ...preset.audience },
    audienceLabel: preset.label,
    compatibleProductFamilies: families,
    lifetimeProductRevenue: 0,
    lifetimeUnits: 0,
    peakAwareness: .035,
    peakMomentum: 1,
  };
  w.ipAssets.push(ip);
  recordChronicle(w, {
    kind: "milestone", importance: 1,
    title: `${ip.name} created`,
    text: `${w.company} created the original IP ${ip.name}, aimed at ${preset.label.toLowerCase()} audiences. It begins with little recognition and must earn cultural relevance through successful products.`,
    icon: "✨", entityType: "ip", entityId: ip.id, tags: ["ip", "original", "creation"], dedupeKey: `ip_created_${ip.id}`,
  });
  w.events.push({ tick: w.tick, kind: "ip", text: `✨ Original IP created: ${ip.name}. Now give it a product worth caring about.` });
  return { ok: true, ip };
}

export function setSkuIP(w: World, sku: SKU, ipId: string | null): { ok: boolean; reason?: string } {
  if (!ipId) {
    sku.ipId = null;
    sku.license = null;
  } else {
    const ip = ipById(w, ipId);
    if (!ip) return { ok: false, reason: "Unknown IP." };
    if (!hasIPRights(w, ipId)) return { ok: false, reason: "You do not hold the rights to this IP." };
    if (!canAttachIP(w, ipId, sku.productKey)) return { ok: false, reason: "This IP is not compatible with this product family." };
    sku.ipId = ipId;
    sku.license = null;
  }
  const market = w.industryMarkets?.[sku.industryId];
  if (market) market.fitCacheDirty = true;
  if (sku.industryId === w.industryId) w.fitCacheDirty = true;
  return { ok: true };
}

export function expireIPContracts(w: World) {
  for (const contract of w.ipLicenses ?? []) {
    if (contract.status !== "active" || contract.expiresTick > w.tick) continue;
    contract.status = "expired";
    const ip = ipById(w, contract.ipId);
    // A renewal signed on the exact expiry day should preserve product rights. Only detach
    // the IP when there is genuinely no replacement contract in force.
    const replacement = activeIPContract(w, contract.ipId);
    const affected = replacement ? [] : w.player.skus.filter((sku) => sku.ipId === contract.ipId);
    for (const sku of affected) setSkuIP(w, sku, null);
    w.events.push({ tick: w.tick, kind: "ip", text: `⏳ ${ip?.name ?? "IP"} license expired${replacement ? " — renewal already in force" : affected.length ? ` — removed from ${affected.length} product${affected.length === 1 ? "" : "s"}` : ""}.` });
    recordChronicle(w, {
      kind: "milestone", importance: 1, title: `${ip?.name ?? "IP"} license expired`,
      text: `${w.company}'s ${contract.durationYears}-year licensing agreement for ${ip?.name ?? contract.ipId} reached its end.`,
      icon: "⏳", entityType: "ip", entityId: contract.ipId, tags: ["ip", "licensing", "expiry"], dedupeKey: `ip_expiry_${contract.id}`,
    });
  }
}

export function royaltyCostQuarterly(w: World, skuResults: SkuResult[]): number {
  let total = 0;
  (w.player.skus ?? []).forEach((sku, i) => {
    if (!sku.ipId) return;
    const contract = activeIPContract(w, sku.ipId);
    if (!contract) return; // player-owned IPs have no royalty expense
    const netRevenueQuarter = Number(skuResults[i]?.revenue ?? 0);
    total += netRevenueQuarter * contract.royaltyRate;
  });
  return total;
}

export function accrueIPRoyaltiesAndDynamics(w: World, skuResults: SkuResult[]) {
  ensureIPFoundation(w);
  expireIPContracts(w);
  const activeByIp = new Map<string, { unitsTick: number; revenueTick: number; qualityWeighted: number; weight: number; breakouts: number; products: number }>();
  w.player.skus.forEach((sku, i) => {
    if (!sku.ipId || !hasIPRights(w, sku.ipId)) return;
    const r = skuResults[i];
    const unitsTick = Number(r?.units ?? 0) / TICKS_PER_QUARTER;
    const revenueTick = Number(r?.revenue ?? 0) / TICKS_PER_QUARTER;
    const entry = activeByIp.get(sku.ipId) ?? { unitsTick: 0, revenueTick: 0, qualityWeighted: 0, weight: 0, breakouts: 0, products: 0 };
    entry.unitsTick += unitsTick;
    entry.revenueTick += revenueTick;
    entry.qualityWeighted += sku.perceivedQuality * Math.max(1, unitsTick);
    entry.weight += Math.max(1, unitsTick);
    entry.breakouts += sku.breakout ? 1 : 0;
    entry.products += sku.status === "active" ? 1 : 0;
    activeByIp.set(sku.ipId, entry);

    const contract = activeIPContract(w, sku.ipId);
    if (contract && revenueTick > 0) contract.royaltiesPaid += revenueTick * contract.royaltyRate;
  });

  for (const ip of w.ipAssets) {
    const use = activeByIp.get(ip.id);
    const seed = hash01(ip.id);
    const culturalPulse = Math.sin((w.tick + seed * 720) / 150) * .055;
    const baseMomentumTarget = 1 + culturalPulse;
    ip.momentum += (baseMomentumTarget - ip.momentum) * (ip.ownerType === "external" ? .0007 : .0011);
    ip.fatigue = clamp(ip.fatigue - .00011, 0, 1);

    if (use) {
      ip.lifetimeUnits += use.unitsTick;
      ip.lifetimeProductRevenue += use.revenueTick;
      const scale = clamp(Math.log10(1 + use.unitsTick) / 5, 0, .8);
      const avgQuality = use.weight > 0 ? use.qualityWeighted / use.weight : .5;
      const awarenessTarget = clamp(ip.awareness + .015 + scale * .35 + use.breakouts * .08, 0, .97);
      ip.awareness += (awarenessTarget - ip.awareness) * .0045;
      const momentumTarget = clamp(1 + scale * .65 + use.breakouts * .45 + Math.max(0, avgQuality - .65) * .35, .75, 2.1);
      ip.momentum += (momentumTarget - ip.momentum) * .005;
      const prestigeTarget = clamp(.08 + avgQuality * .72 + Math.min(.18, Math.log10(1 + ip.lifetimeProductRevenue / 100_000) * .055), 0, .96);
      ip.prestige += (prestigeTarget - ip.prestige) * .0018;
      const overexposure = Math.max(0, use.products - 2) * .00012 + Math.max(0, ip.momentum - 1.55) * .00013;
      ip.fatigue = clamp(ip.fatigue + overexposure, 0, .92);
    } else if (ip.ownerType === "player") {
      // Original properties do not stay culturally hot forever just because they were once successful.
      // Prestige gives them a durable memory floor; active products are what rebuild awareness/momentum.
      const legacyFloor = clamp(.02 + ip.prestige * .24, .02, .26);
      if (ip.awareness > legacyFloor) ip.awareness += (legacyFloor - ip.awareness) * .00016;
    }

    ip.awareness = clamp(ip.awareness, 0, 1);
    ip.momentum = clamp(ip.momentum, .55, 2.2);
    ip.prestige = clamp(ip.prestige, 0, 1);
    ip.peakAwareness = Math.max(ip.peakAwareness ?? 0, ip.awareness);
    ip.peakMomentum = Math.max(ip.peakMomentum ?? 1, ip.momentum);

    if (ip.ownerType === "player") recordIPMilestones(w, ip);
  }
}

function recordIPMilestones(w: World, ip: IPAsset) {
  if (ip.awareness >= .35) recordChronicle(w, {
    kind: "milestone", importance: 2, title: `${ip.name} breaks through`,
    text: `${ip.name} crossed 35% awareness and became a meaningful consumer property rather than just a name attached to products.`,
    icon: "🌟", entityType: "ip", entityId: ip.id, tags: ["ip", "breakthrough"], dedupeKey: `ip_breakthrough_${ip.id}`,
  });
  if (ip.awareness >= .70 && ip.prestige >= .60) recordChronicle(w, {
    kind: "milestone", importance: 3, title: `${ip.name} becomes iconic`,
    text: `${ip.name} reached mass awareness with durable prestige, becoming one of ${w.company}'s defining intellectual properties.`,
    icon: "👑", entityType: "ip", entityId: ip.id, tags: ["ip", "iconic", "legacy"], dedupeKey: `ip_iconic_${ip.id}`,
  });
  if (estimateIPValue(ip) >= 5_000_000) recordChronicle(w, {
    kind: "milestone", importance: 3, title: `${ip.name} valued above $5M`,
    text: `${ip.name}'s awareness, prestige and commercial history pushed its estimated asset value above $5 million.`,
    icon: "💎", entityType: "ip", entityId: ip.id, tags: ["ip", "valuation", "iconic"], metricValue: estimateIPValue(ip), dedupeKey: `ip_value5m_${ip.id}`,
  });
}

export function estimateIPValue(ip: IPAsset): number {
  if (ip.ownerType !== "player") return 0;
  // A freshly-created name should not manufacture millions of enterprise value on day one.
  // Value accelerates only when awareness and prestige reinforce each other and products prove demand.
  const cultural = 60_000 + ip.awareness * 1_600_000 + (ip.awareness * ip.prestige) * 5_000_000;
  const provenSales = Math.min(5_000_000, Math.max(0, ip.lifetimeProductRevenue) * .11);
  return Math.max(0, (cultural + provenSales) * clamp(ip.momentum, .7, 1.8) * (1 - ip.fatigue * .58));
}

export function companyIPPortfolioValue(w: World): number {
  return (w.ipAssets ?? []).filter((ip) => ip.ownerType === "player").reduce((sum, ip) => sum + estimateIPValue(ip), 0);
}

export function estimatedCompanyValue(w: World): number {
  const inventory = w.live?.cashflow.inventoryValue ?? w.player.skus.reduce((sum, sku) => sum + sku.inventory * sku.unitCost, 0);
  const receivables = w.live?.cashflow.receivables ?? w.player.receivables.reduce((sum, r) => sum + r.amount, 0);
  const earningsValue = Math.max(0, (w.live?.income.profit ?? 0) * 4) * 3.5;
  return Math.max(0, w.player.cash + inventory + receivables - w.player.debt + earningsValue + companyIPPortfolioValue(w));
}

export function availableIPProductFamilies(): { key: string; label: string; industryId: string; ipPotential: number }[] {
  return Object.values(PRODUCT_ARCHETYPES)
    .filter((p) => p.ipPotential > 0)
    .map((p) => ({ key: p.key, label: p.label, industryId: p.industryId, ipPotential: p.ipPotential }))
    .sort((a, b) => a.industryId.localeCompare(b.industryId) || a.label.localeCompare(b.label));
}

export function daysUntilIPExpiry(w: World, contract: IPLicenseContract): number {
  return Math.max(0, contract.expiresTick - w.tick);
}

export function annualizedRoyaltyExposure(w: World): number {
  if (!w.live) return 0;
  let q = 0;
  w.player.skus.forEach((sku, i) => {
    if (!sku.ipId) return;
    const c = activeIPContract(w, sku.ipId);
    if (!c) return;
    q += (w.live?.skuResults[i]?.revenue ?? 0) * c.royaltyRate;
  });
  return q * 4;
}

function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}
