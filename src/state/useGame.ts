import { useRef, useState, useEffect, useCallback } from "react";
import type { World, Brand, Coord, DifficultyId, BrandVisualRecipe, TalentSearchMode, ResearchNodeId } from "../engine/types";
import { type PersonnelRole } from "../engine/types";
import { RETAIL_PARTNERS, MARKETING_AGENCIES, BRAND_COLORS, INDUSTRIES } from "../engine/industries";
import { initWorld, buildSku, STUDY_DEFS, type ProductSpec } from "../engine/world";
import { step } from "../engine/tick";
import { launchInheritance } from "../engine/brandEquity";
import { deriveUnitCost, deriveQuality } from "../engine/economics";
import { manufacturingStandard } from "../engine/productDesign";
import { canCreateProduct, canProduce, productionLeadDays, productProjectLockedPeople, productProjectTierAccess } from "../engine/capacity";
import { CAMPUS_PATH_COST, canBuildCampusPath, facilityUpgradeQuote, roleFitsRoom, roomTouchesConnectedPath, sanitizeOperatingRooms, syncDerivedDepartments, storageModuleRequirement, WAREHOUSE_MODULE_COST } from "../engine/infrastructure";
import { hasAutosave, loadWorld, saveWorld, clearAutosave } from "../engine/persistence";
import { supplierById, supplierSupportsProduct } from "../engine/suppliers";
import { canNegotiatePartner, deriveSkuChannels, partnerSupportsIndustry } from "../engine/distribution";
import { archivePerson, candidateToPersonnel, canPromotePerson, isProductLead, productManagerEffectiveness, productProjectTeamEffectiveness, promotePerson, startTalentSearch, teamEffectiveness } from "../engine/people";
import { recordBuildingEvent, recordChronicle, recordPeopleEvent, recordProductLaunch } from "../engine/chronicle";
import { canCreateBrand, canStartCategoryExpansion } from "../engine/growth";
import { canStartIndustryEntry } from "../engine/businesses";
import { defaultBrandVisual } from "../engine/brands";
import { archetypeByKey, type StorageProfileId } from "../engine/productCatalog";
import { ensureIndustryMarket, marketWorldView, commitMarketView } from "../engine/markets";
import { deriveSafetyScore, TESTING_LEVELS } from "../engine/productDynamics";
import { createOriginalIP, setSkuIP, signIPLicense } from "../engine/ip";
import { difficultyConfig } from "../engine/difficulty";
import { canManageSegments, segmentTargetProfile } from "../engine/segments";
import { facilityResearchRequirement, hasResearch, officeUpgradeResearchRequirement, startResearch as beginResearch } from "../engine/research";

const fmtLaunchPrice = (v: number) => `$${Math.round(v * 100) / 100}`;

export function useGame() {
  const worldRef = useRef<World | null>(null);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((x) => x + 1), []);
  const [phase, setPhase] = useState<"home" | "setup" | "play">("home");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [modal, setModal] = useState<null | "creator" | "contract">(null);
  const [autosaveAvailable, setAutosaveAvailable] = useState(() => hasAutosave());

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0, last = performance.now(), acc = 0;
    // ticks-per-second by speed setting: 1x = 1 day/sec, 2x = 4 days/sec, 3x = 7 days/sec (a week).
    const tps = (s: number) => (s <= 1 ? 1 : s === 2 ? 4 : 7);
    const loop = (t: number) => {
      const dt = t - last; last = t;
      const paused = !playing || modal !== null;
      if (!paused && worldRef.current) {
        const msPerTick = 1000 / tps(speed);
        acc += dt;
        let guard = 0;
        while (acc >= msPerTick && guard < 30) { step(worldRef.current); acc -= msPerTick; guard++; }
        rerender();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, playing, speed, modal, rerender]);

  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => {
      if (!worldRef.current) return;
      saveWorld(worldRef.current);
      setAutosaveAvailable(true);
    }, 5000);
    return () => window.clearInterval(id);
  }, [phase]);

  const continueAutosave = useCallback(() => {
    const loaded = loadWorld();
    if (!loaded) { setAutosaveAvailable(false); return; }
    worldRef.current = loaded;
    setPhase("play");
    setPlaying(false);
    rerender();
  }, [rerender]);

  const newGame = useCallback(() => {
    clearAutosave();
    setAutosaveAvailable(false);
    worldRef.current = null;
    setPhase("setup");
  }, []);

  const saveNow = useCallback(() => {
    if (!worldRef.current) return;
    saveWorld(worldRef.current);
    setAutosaveAvailable(true);
  }, []);

  const launch = useCallback((industryId: string, company: string, difficulty: DifficultyId) => {
    worldRef.current = initWorld(industryId, company, null, difficulty);
    setPhase("play"); rerender();
  }, [rerender]);

  const createProduct = useCallback((spec: ProductSpec) => {
    const w = worldRef.current!;
    const check = canCreateProduct(w);
    if (!check.ok) return;
    const archetype = archetypeByKey(spec.productKey);
    if (!archetype) return;
    const business = w.player.businesses?.[archetype.industryId];
    if (!business || business.status !== "active" || !business.unlockedCategories.includes(spec.productKey)) return;
    const brand = w.brands.find((b) => b.id === spec.brandId);
    if (!brand || brand.industryId !== archetype.industryId) return;
    if (spec.method === "outsource") {
      const supplier = supplierById(spec.supplierId);
      if (!supplier || !supplierSupportsProduct(supplier, spec.productKey)) return;
    }
    const productRooms = w.player.operatingRooms.filter(r => r.kind === "office" && (r.team === "product" || r.id === "founder-office"));
    if (!productRooms.length) return;
    const tier = spec.projectTier ?? "A";
    const tierAccess = productProjectTierAccess(w, tier);
    if (!tierAccess.ok) return;
    const id = `P${w.tick}_${w.player.skus.length}_${Math.floor(Math.random()*10000)}`;
    const lockedPeople = productProjectLockedPeople(w);
    const seated = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
    const availableProductStaff = w.player.personnel.filter((p) => p.role === "product_manager" && seated.has(p.id) && !lockedPeople.has(p.id));
    const requestedLead = spec.pmId ? availableProductStaff.find((p) => p.id === spec.pmId) : null;
    const leadOrSolo = tier === "A"
      ? (requestedLead ?? [...availableProductStaff].sort((a, b) => productManagerEffectiveness(b, spec.productKey) - productManagerEffectiveness(a, spec.productKey))[0])
      : (requestedLead && isProductLead(requestedLead) ? requestedLead : [...availableProductStaff].filter(isProductLead).sort((a, b) => productManagerEffectiveness(b, spec.productKey) - productManagerEffectiveness(a, spec.productKey))[0]);
    if (!leadOrSolo) return;
    const designerIds = [...new Set(spec.designerIds ?? [])].filter((id) => id !== leadOrSolo.id && availableProductStaff.some((p) => p.id === id));
    const requiredDesigners = tier === "AAA" ? 3 : tier === "AA" ? 1 : 0;
    if (designerIds.length !== requiredDesigners) return;
    const teamScore = productProjectTeamEffectiveness(w, tier, spec.productKey, leadOrSolo.id, designerIds);
    const pmRoom = productRooms.find((r) => r.assignedPersonnelIds.includes(leadOrSolo.id));
    if (pmRoom && !pmRoom.productKey) pmRoom.productKey = spec.productKey;
    const expertise = Math.max(w.player.expertise.category[spec.productKey] ?? 0, w.player.expertise.industry[archetype.industryId] ?? 0);
    const sku = buildSku(w, { ...spec, pmSkill: teamScore, pmId: leadOrSolo.id, pmName: leadOrSolo.name, designerIds, designDepth: spec.designDepth ?? (tier === "AAA" ? "breakthrough" : tier === "AA" ? "advanced" : "standard") }, id, w.tick, expertise);
    // product starts in "designing" state — no inventory, no channels, no cash spent yet
    w.player.skus.push(sku);
    const market = ensureIndustryMarket(w, sku.industryId); market.fitCacheDirty = true;
    if (sku.industryId === w.industryId) w.fitCacheDirty = true;
    setModal(null); rerender();
  }, [rerender]);

  // Start manufacturing a designed product — costs cash, takes time
  const produce = useCallback((si: number, qty: number) => {
    const w = worldRef.current!; const s = w.player.skus[si];
    if (!s) return;
    if (s.status !== "designed" && s.status !== "active") return;
    if ((s.mfgBatchSize ?? 0) > 0 || (s.mfgDaysLeft ?? 0) > 0) return; // one inbound batch per SKU at a time
    // Reprice every new batch from the current raw-material market. Historical inventory keeps
    // its simplified SKU cost basis, while new production immediately feels commodity shocks.
    const cfg = INDUSTRIES[s.industryId] ?? w.cfg;
    const pt = cfg.products.find((p) => p.key === s.productKey);
    if (!pt) return;
    const standard = manufacturingStandard(s.manufacturingStars ?? 3);
    const supplier = s.method === "outsource" ? supplierById(s.supplierId) : null;
    s.unitCost = deriveUnitCost(pt, s.method, standard.materialQuality, standard.productionQuality, supplier?.costMult ?? 1, w.materialPriceIndex) * TESTING_LEVELS[s.testingLevel ?? "standard"].costMult;
    const check = canProduce(w, qty, s.unitCost, s.method, s.supplierId, s.productKey);
    if (!check.ok) return;
    const cost = qty * s.unitCost;
    w.player.cash -= cost;
    s.mfgBatchSize = qty;
    // Capacity + partner choice drive lead time. Faster outsourced partners cost more but replenish sooner.
    s.mfgDaysLeft = productionLeadDays(w, s, qty);
    // First batch is pre-launch; replenishment keeps an already-active SKU selling from on-hand stock.
    if (s.status === "designed") s.status = "manufacturing";
    rerender();
  }, [rerender]);

  const assignPartner = useCallback((si: number, partnerId: string, assign: boolean) => {
    const w = worldRef.current!; const s = w.player.skus[si];
    if (!s) return;
    if (assign) {
      if (!partnerSupportsIndustry(partnerId, s.industryId)) return;
      if (!s.assignedPartnerIds.includes(partnerId)) s.assignedPartnerIds.push(partnerId);
    } else {
      s.assignedPartnerIds = s.assignedPartnerIds.filter((id) => id !== partnerId);
    }
    deriveSkuChannels(w, s);
    const market = ensureIndustryMarket(w, s.industryId); market.fitCacheDirty = true;
    if (s.industryId === w.industryId) w.fitCacheDirty = true;
    rerender();
  }, [rerender]);

  // per-product distribution & packaging
  const setPackaging = useCallback((si: number, pkg: string) => {
    const w = worldRef.current!; const s = w.player.skus[si]; if (!s) return;
    s.packaging = pkg; const market = ensureIndustryMarket(w, s.industryId); market.fitCacheDirty = true;
    if (s.industryId === w.industryId) w.fitCacheDirty = true; rerender();
  }, [rerender]);
  const setProductPrice = useCallback((si: number, price: number) => {
    const w = worldRef.current!; w.player.skus[si].listPrice = price; rerender();
  }, [rerender]);
  // Change the manufacturing standard for future batches. The player chooses 1–5 stars;
  // the engine keeps the detailed material/production variables hidden underneath.
  const setProductQuality = useCallback((si: number, stars: number) => {
    const w = worldRef.current!; const s = w.player.skus[si];
    if (!s || s.inventory > 0 || (s.mfgBatchSize ?? 0) > 0 || s.status === "active") return;
    const pt = (INDUSTRIES[s.industryId] ?? w.cfg).products.find((p) => p.key === s.productKey)!;
    const standard = manufacturingStandard(stars);
    const supplier = s.method === "outsource" ? supplierById(s.supplierId) : null;
    s.manufacturingStars = standard.stars;
    s.quality = deriveQuality(standard.materialQuality, standard.productionQuality, supplier?.qualityAdj ?? 0);
    s.unitCost = deriveUnitCost(pt, s.method, standard.materialQuality, standard.productionQuality, supplier?.costMult ?? 1, w.materialPriceIndex) * TESTING_LEVELS[s.testingLevel ?? "standard"].costMult;
    s.safetyScore = deriveSafetyScore(s.productKey, s.testingLevel ?? "standard", s.designQuality, s.quality);
    rerender();
  }, [rerender]);
  const setProductionSetup = useCallback((si: number, method: "own" | "outsource", supplierId?: string | null) => {
    const w = worldRef.current!; const s = w.player.skus[si];
    if (!s || (s.mfgBatchSize ?? 0) > 0 || s.inventory > 0 || s.status === "active") return; // manufacturer/standard are frozen once the first batch starts
    const pt = (INDUSTRIES[s.industryId] ?? w.cfg).products.find((p) => p.key === s.productKey)!;
    const standard = manufacturingStandard(s.manufacturingStars ?? 3);
    s.method = method;
    const requestedSupplier = method === "outsource" ? supplierById(supplierId ?? s.supplierId ?? "flexform") : null;
    if (requestedSupplier && !supplierSupportsProduct(requestedSupplier, s.productKey)) return;
    s.supplierId = requestedSupplier?.id ?? null;
    const supplier = requestedSupplier;
    s.quality = deriveQuality(standard.materialQuality, standard.productionQuality, supplier?.qualityAdj ?? 0);
    s.unitCost = deriveUnitCost(pt, method, standard.materialQuality, standard.productionQuality, supplier?.costMult ?? 1, w.materialPriceIndex) * TESTING_LEVELS[s.testingLevel ?? "standard"].costMult;
    s.safetyScore = deriveSafetyScore(s.productKey, s.testingLevel ?? "standard", s.designQuality, s.quality);
    rerender();
  }, [rerender]);
  const retargetProduct = useCallback((si: number, segmentId: string) => {
    const w = worldRef.current!; const s = w.player.skus[si]; if (!s) return false;
    const segment = segmentId === "broad" ? null : w.savedSegments.find((seg) => seg.id === segmentId) ?? null;
    s.target = segment ? segmentTargetProfile(marketWorldView(w, s.industryId), segment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
    s.targetLabel = segment?.name ?? "Broad market";
    const market = ensureIndustryMarket(w, s.industryId); market.fitCacheDirty = true;
    if (s.industryId === w.industryId) w.fitCacheDirty = true;
    if (s.releasedToMarket) w.events.push({ tick: w.tick, kind: "market", text: `🎯 ${s.name} retargeted to ${s.targetLabel}.` });
    rerender(); return true;
  }, [rerender]);

  const releaseProduct = useCallback((si: number, segmentId: string, launchBudget = 0) => {
    const w = worldRef.current!; const s = w.player.skus[si];
    if (!s || s.status !== "active" || s.releasedToMarket === true || s.inventory <= 0) return { ok: false, reason: "The first batch must be in the warehouse before launch." };
    if (s.listPrice <= 0) return { ok: false, reason: "Set a selling price first." };
    if (!(s.assignedPartnerIds ?? []).length) return { ok: false, reason: "Assign at least one sales channel before launch." };
    const seatedIds = new Set(w.player.operatingRooms.filter((r) => r.kind === "office").flatMap((r) => r.assignedPersonnelIds));
    if (!w.player.personnel.some((p) => p.role === "marketing" && seatedIds.has(p.id))) return { ok: false, reason: "Hire a Marketing Specialist and give them an office seat before launch." };
    const segment = segmentId === "broad" ? null : w.savedSegments.find((seg) => seg.id === segmentId) ?? null;
    const agency = MARKETING_AGENCIES.find((a) => a.id === "spark") ?? MARKETING_AGENCIES[0];
    const campaignCost = segment && launchBudget > 0 && agency ? launchBudget * agency.baseCostMult : 0;
    if (campaignCost > w.player.cash) return { ok: false, reason: "Not enough cash for the selected launch advertising." };
    s.target = segment ? segmentTargetProfile(marketWorldView(w, s.industryId), segment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
    s.targetLabel = segment?.name ?? "Broad market";
    s.releasedToMarket = true; s.launchTick = w.tick;
    const marketView = marketWorldView(w, s.industryId);
    for (let ci = 0; ci < marketView.cube.length; ci++) {
      const inherit = launchInheritance(marketView, ci, s.productKey, s.brandId);
      if (inherit > 0.01) marketView.cube[ci].awareness[s.id] = Math.max(marketView.cube[ci].awareness[s.id] ?? 0, inherit);
    }
    commitMarketView(w, marketView);
    deriveSkuChannels(w, s);
    if (segment && launchBudget > 0 && agency) {
      const rel = w.agencyRelationships[agency.id] ?? 0;
      w.activeCampaigns.push({ id: `launch_${s.id}_${w.tick}`, name: `${s.name} launch`, segmentId: segment.id, agencyId: agency.id, scope: s.id, budget: campaignCost, daysRemaining: 30, totalDays: 30, effectivenessMult: agency.effectivenessMult * (1 + rel * .05) * (.85 + teamEffectiveness(w, "marketing") * .30) });
    }
    const lead = w.player.personnel.find((x) => x.id === s.assignedPmId);
    if (lead) lead.careerEvents.push({ tick: w.tick, kind: "milestone", text: `Launched ${s.name}.` });
    recordProductLaunch(w, s);
    w.events.push({ tick: w.tick, kind: "product", text: `🚀 ${s.name} is now on the market at ${fmtLaunchPrice(s.listPrice)} for ${s.targetLabel}.` });
    const market = ensureIndustryMarket(w, s.industryId); market.fitCacheDirty = true;
    if (s.industryId === w.industryId) w.fitCacheDirty = true;
    rerender(); return { ok: true };
  }, [rerender]);

  const discardProduct = useCallback((si: number) => {
    const w = worldRef.current!; const s = w.player.skus[si]; if (!s) return false;
    if (s.inventory > 0 || (s.mfgBatchSize ?? 0) > 0 || s.releasedToMarket) return false;
    w.player.skus.splice(si, 1);
    for (const room of w.player.operatingRooms) if (room.skuId === s.id) room.skuId = null;
    w.events.push({ tick: w.tick, kind: "product", text: `🗑 ${s.name} was discarded before launch.` });
    rerender(); return true;
  }, [rerender]);

  const setIP = useCallback((si: number, ipId: string | null) => {
    const w = worldRef.current!; const s = w.player.skus[si]; if (!s) return false;
    const result = setSkuIP(w, s, ipId);
    if (result.ok) rerender();
    return result.ok;
  }, [rerender]);

  const createIP = useCallback((name: string, audiencePresetId: string, productFamilies: string[]) => {
    const w = worldRef.current!;
    const result = createOriginalIP(w, name, audiencePresetId, productFamilies);
    if (result.ok) rerender();
    return result;
  }, [rerender]);

  const licenseIP = useCallback((ipId: string, years: number) => {
    const w = worldRef.current!;
    const result = signIPLicense(w, ipId, years);
    if (result.ok) rerender();
    return result;
  }, [rerender]);
  const signContract = useCallback((partnerId: string) => {
    const w = worldRef.current!;
    if (!canNegotiatePartner(w, partnerId)) return;
    const partner = RETAIL_PARTNERS.find((p) => p.id === partnerId);
    if (!partner) return;
    // don't sign with the same partner twice
    if (w.player.contracts.some((c) => c.partnerId === partnerId)) return;
    w.player.contracts.push({
      type: partner.channelType, marginCut: partner.marginCut,
      partnerId: partner.id, partnerName: partner.name,
      slotting: partner.slotting, paymentDays: partner.paymentDays,
    });
    for (const market of Object.values(w.industryMarkets ?? {})) if (market) market.fitCacheDirty = true;
    w.fitCacheDirty = true; setModal(null); rerender();
  }, [rerender]);
  const removeContract = useCallback((i: number) => {
    const w = worldRef.current!;
    const removed = w.player.contracts[i];
    w.player.contracts.splice(i, 1);
    if (removed) for (const sku of w.player.skus) {
      sku.assignedPartnerIds = (sku.assignedPartnerIds ?? []).filter((id) => id !== removed.partnerId);
      deriveSkuChannels(w, sku);
    }
    for (const market of Object.values(w.industryMarkets ?? {})) if (market) market.fitCacheDirty = true;
    w.fitCacheDirty = true; rerender();
  }, [rerender]);

  const setMarketing = useCallback((v: number) => { const w=worldRef.current!; w.player.marketingTarget = v>0 && teamEffectiveness(w,"marketing")<=0 ? 0 : v; rerender(); }, [rerender]);
  const setBrandMarketing = useCallback((v: number) => { const w=worldRef.current!; w.player.brandMarketingTarget = v>0 && teamEffectiveness(w,"marketing")<=0 ? 0 : v; rerender(); }, [rerender]);
  const setBackOffice = useCallback((v: number) => { worldRef.current!.player.backOfficeTarget = v; rerender(); }, [rerender]);
  const hireCandidate = useCallback((candidateId: string, roomId: string) => {
    const w = worldRef.current!;
    const candidate = w.player.talentMarket.find((c) => c.id === candidateId);
    if (!candidate) return { ok: false, reason: "Candidate is no longer available." };
    const room = w.player.operatingRooms.find((r) => r.id === roomId && r.kind === "office");
    if (!room) return { ok: false, reason: "Choose an office before signing the contract." };
    const hiredSeats = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
    if (room.assignedPersonnelIds.length >= hiredSeats) return { ok: false, reason: `${room.name} has no open staff seats. Expand it or build another office first.` };
    if (!roleFitsRoom(candidate.role, room)) return { ok: false, reason: `${candidate.title} is not compatible with ${room.name}.` };
    const person = candidateToPersonnel(candidate, w.tick);
    w.player.personnel.push(person);
    room.assignedPersonnelIds.push(person.id);
    w.player.talentMarket = w.player.talentMarket.filter((c) => c.id !== candidateId);
    syncDerivedDepartments(w);
    w.events.push({ tick: w.tick, kind: "people", text: `👤 ${person.name} joined as ${person.title} in ${room.name}.` });
    recordPeopleEvent(w, person.id, `${person.name} joined`, `${person.name} joined ${w.company} as ${person.title}, assigned to ${room.name}.`, "hire", person.level >= 3 ? 2 : 1);
    rerender();
    return { ok: true };
  }, [rerender]);
  const startRecruitingSearch = useCallback((role: PersonnelRole, industryId: string, mode: TalentSearchMode) => {
    const w = worldRef.current!;
    const result = startTalentSearch(w, role, industryId, mode);
    if (result.ok) {
      w.events.push({ tick: w.tick, kind: "people", text: `🔎 Recruiting agency engaged — ${mode} search started.` });
      rerender();
    }
    return result;
  }, [rerender]);
  const promotePersonnel = useCallback((id: string) => {
    const w = worldRef.current!;
    const p = w.player.personnel.find((x) => x.id === id);
    if (!p || !canPromotePerson(w, p).ok) return;
    const oldTitle = p.title;
    if (promotePerson(w, p)) {
      w.events.push({ tick: w.tick, kind: "people", text: `⬆ ${p.name} promoted from ${oldTitle} to ${p.title}.` });
      recordPeopleEvent(w, p.id, `${p.name} promoted`, `${p.name} moved from ${oldTitle} to ${p.title}.`, "promotion", p.level >= 3 ? 2 : 1);
      rerender();
    }
  }, [rerender]);
  const firePersonnel = useCallback((id: string) => {
    const w = worldRef.current!;
    const p = w.player.personnel.find((x) => x.id === id);
    if (!p) return;
    recordPeopleEvent(w, p.id, `${p.name} left the company`, `${p.name}, ${p.title}, left after being released by the company.`, "departure", p.level >= 3 ? 2 : 1);
    archivePerson(w, id, "Left after being released by the company.");
    syncDerivedDepartments(w);
    rerender();
  }, [rerender]);
  const setVision = useCallback((goal: import("../engine/types").VisionGoal, scope: string, audience: string, audienceLabel: string) => {
    const w = worldRef.current!;
    w.player.vision = { goal, scope, audience, audienceLabel, setTick: w.tick, quartersPassed: 0 };
    rerender();
  }, [rerender]);

  const createBrand = useCallback((name: string, color: string, positioning: string, industryId?: string, visual?: BrandVisualRecipe) => {
    const w = worldRef.current!;
    const clean = name.trim();
    if (!clean || w.brands.some((b) => b.name.toLowerCase() === clean.toLowerCase())) return false;
    const check = canCreateBrand(w);
    if (!check.ok) return false;
    const isFoundingBrand = w.brands.length === 0;
    w.player.cash -= check.cost;
    const targetIndustry = industryId ?? w.industryId;
    const business = w.player.businesses?.[targetIndustry];
    if (!business || business.status !== "active") return false;
    const chosenColor = color || BRAND_COLORS[w.brands.length % BRAND_COLORS.length];
    const brand = { id: `brand_${w.tick}_${w.brands.length}`, name: clean, color: chosenColor, positioning, createdTick: w.tick, industryId: targetIndustry, visual: visual ?? defaultBrandVisual(clean, chosenColor) };
    w.brands.push(brand);
    if (isFoundingBrand) w.primaryBrandId = brand.id;
    ensureIndustryMarket(w, targetIndustry).brandEquity[brand.id] = {};
    if (targetIndustry === w.industryId) w.brandEquity[brand.id] = {};
    w.events.push({ tick: w.tick, kind: "strategy", text: `🏷 ${brand.name} launched as a new ${positioning} brand.` });
    recordChronicle(w, {
      kind: "milestone", importance: isFoundingBrand ? 3 : (w.brands.length === 2 ? 3 : 2), title: `${brand.name} brand launched`,
      text: isFoundingBrand ? `${w.company} created its founding brand, ${brand.name}, positioned as ${positioning}.` : `${w.company} created ${brand.name}, a new ${positioning} brand, investing $${Math.round(check.cost).toLocaleString()} in portfolio expansion.`,
      icon: "🏷️", entityType: "company", entityId: brand.id, tags: ["growth", "brand", ...(w.brands.length === 2 ? ["iconic"] : [])],
      dedupeKey: `brand_${brand.id}`,
    });
    rerender();
    return true;
  }, [rerender]);

  const startCategoryExpansion = useCallback((productKey: string) => {
    const w = worldRef.current!;
    const check = canStartCategoryExpansion(w, productKey);
    if (!check.ok || !check.def) return false;
    w.player.cash -= check.def.investment;
    const project = { productKey, startedTick: w.tick, daysLeft: check.def.days, totalDays: check.def.days, investment: check.def.investment };
    const archetype = archetypeByKey(productKey);
    const business = archetype ? w.player.businesses?.[archetype.industryId] : undefined;
    if (!business) return false;
    business.categoryExpansionProjects.push(project);
    if (archetype?.industryId === w.industryId) w.player.categoryExpansionProjects = business.categoryExpansionProjects;
    const label = archetype?.label ?? productKey;
    w.events.push({ tick: w.tick, kind: "strategy", text: `🧭 Category entry started: ${label} (${check.def.days} days).` });
    recordChronicle(w, {
      kind: "milestone", importance: 1, title: `${label} expansion approved`,
      text: `${w.company} committed $${Math.round(check.def.investment).toLocaleString()} to build the capabilities required for ${label}.`,
      icon: "🧭", entityType: "market", entityId: productKey, tags: ["growth", "category", "investment"],
      dedupeKey: `category_start_${productKey}`,
    });
    rerender();
    return true;
  }, [rerender]);

  const startIndustryEntry = useCallback((industryId: string) => {
    const w = worldRef.current!;
    const check = canStartIndustryEntry(w, industryId);
    if (!check.ok || !check.def) return false;
    w.player.cash -= check.def.investment;
    w.player.industryEntryProjects.push({
      industryId, route: "organic", startedTick: w.tick, daysLeft: check.def.days, totalDays: check.def.days, investment: check.def.investment,
    });
    w.events.push({ tick: w.tick, kind: "strategy", text: `🌐 Organic entry into ${check.def.label} approved (${check.def.days} days).` });
    recordChronicle(w, {
      kind: "milestone", importance: 2, title: `${check.def.label} entry program approved`,
      text: `${w.company} committed $${Math.round(check.def.investment).toLocaleString()} to build the capabilities required to enter ${check.def.label}.`,
      icon: "🌐", entityType: "market", entityId: industryId, tags: ["growth", "industry", "investment"],
      dedupeKey: `industry_entry_start_${industryId}`,
    });
    rerender();
    return true;
  }, [rerender]);

  const setFocus = useCallback((v: string) => { worldRef.current!.player.marketingFocus = v; rerender(); }, [rerender]);
  const saveSegment = useCallback((name: string, filter: Record<string, string[]>) => {
    const w = worldRef.current!;
    if (!canManageSegments(w).ok) return;
    w.savedSegments.push({ id: "seg_" + Date.now(), name, filter });
    rerender();
  }, [rerender]);
  const deleteSegment = useCallback((id: string) => {
    const w = worldRef.current!;
    w.savedSegments = w.savedSegments.filter((s) => s.id !== id);
    if (w.player.marketingFocus === "seg:" + id) w.player.marketingFocus = "all";
    rerender();
  }, [rerender]);
  const updateSegment = useCallback((id: string, name: string, filter: Record<string, string[]>) => {
    const w = worldRef.current!;
    if (!canManageSegments(w).ok) return;
    const seg = w.savedSegments.find((s) => s.id === id);
    if (seg) { seg.name = name; seg.filter = filter; }
    rerender();
  }, [rerender]);
  const launchCampaign = useCallback((name: string, segmentId: string, agencyId: string, budget: number, days: number, scope: "company" | "brand" | string = "company") => {
    const w = worldRef.current!;
    if (teamEffectiveness(w, "marketing") <= 0) return;
    const agency = MARKETING_AGENCIES.find((a) => a.id === agencyId);
    if (!agency) return;
    const cost = budget * agency.baseCostMult;
    if (w.player.cash < cost) return;
    const rel = w.agencyRelationships[agencyId] ?? 0;
    const relBonus = 1 + rel * 0.05; // 5% better per past campaign
    w.activeCampaigns.push({
      id: "camp_" + Date.now(), name, segmentId, agencyId, scope,
      budget: cost, daysRemaining: days, totalDays: days,
      effectivenessMult: agency.effectivenessMult * relBonus * (0.85 + teamEffectiveness(w, "marketing") * 0.30),
    });
    rerender();
  }, [rerender]);
  const selectCell = useCallback((coord: Coord) => { worldRef.current!.selectedCell = coord; rerender(); }, [rerender]);
  const borrow = useCallback((amount: number) => {
    const w = worldRef.current!;
    const d = difficultyConfig(w.difficulty);
    const baseLimit = w.difficulty === "entrepreneur" ? 4_000_000 : w.difficulty === "standard" ? 2_000_000 : 500_000;
    const confidenceMult = d.investorExpectations > 0 ? (0.35 + w.investorConfidence * 0.65) : 1;
    const limit = baseLimit * confidenceMult;
    const draw = Math.max(0, Math.min(amount, limit - w.player.debt));
    if (draw <= 0) { w.events.push({ tick: w.tick, kind: "finance", text: "Credit request denied — available financing is exhausted." }); rerender(); return; }
    w.player.cash += draw; w.player.debt += draw; rerender();
  }, [rerender]);
  const repay = useCallback((amount: number) => { const w = worldRef.current!; const a = Math.min(amount, w.player.debt, Math.max(0, w.player.cash)); w.player.cash -= a; w.player.debt -= a; rerender(); }, [rerender]);

  const startResearch = useCallback((nodeId: ResearchNodeId) => {
    const w = worldRef.current!;
    const result = beginResearch(w, nodeId);
    rerender();
    return result;
  }, [rerender]);

  const commission = useCallback((type: string) => {
    const w = worldRef.current!;
    if (type !== "product_diagnosis") {
      if (!hasResearch(w, "market_intelligence")) return;
      if (teamEffectiveness(w, "strategy") <= 0) return;
    }
    if (w.studies.find((s) => s.type === type && !s.done)) return;
    const def = STUDY_DEFS[type]; if (!def || w.player.cash < def.cost) return;
    w.player.cash -= def.cost;
    w.studies = w.studies.filter((s) => s.type !== type);
    w.studies.push({ type, ticksLeft: STUDY_DEFS[type].ticks, done: false });
    rerender();
  }, [rerender]);

  const updateOperatingRooms = useCallback((rooms: World["player"]["operatingRooms"]) => {
    const w = worldRef.current!;
    w.player.operatingRooms = sanitizeOperatingRooms(w, rooms);
    syncDerivedDepartments(w);
    rerender();
  }, [rerender]);

  const buildOperatingRoom = useCallback((incoming: World["player"]["operatingRooms"][number]) => {
    const w = worldRef.current!;
    const gate = facilityResearchRequirement(w, incoming.kind);
    if (gate) return false;
    const firstOffice = incoming.kind === "office" && !w.player.operatingRooms.some((r) => r.kind === "office");
    const room = firstOffice ? { ...incoming, id: "founder-office", name: "Founder Office", team: "unassigned" as const, capacity: 4 } : incoming;
    if (room.x < 0 || room.y < 0 || room.x + room.w > 48 || room.y + room.h > 48) return false;
    const overlapsRoom = w.player.operatingRooms.some((r) => room.x < r.x + r.w && room.x + room.w > r.x && room.y < r.y + r.h && room.y + room.h > r.y);
    if (overlapsRoom) return false;
    const coversPath = (w.player.campusPaths ?? []).some((p) => p.x >= room.x && p.x < room.x + room.w && p.y >= room.y && p.y < room.y + room.h);
    if (coversPath) return false;
    if (!roomTouchesConnectedPath(w, room)) return false;
    if (w.player.cash < room.buildCost) return false;
    w.player.cash -= room.buildCost;
    w.player.operatingRooms = sanitizeOperatingRooms(w, [...w.player.operatingRooms, room]);
    syncDerivedDepartments(w);
    recordBuildingEvent(w, room);
    rerender();
    return true;
  }, [rerender]);

  const buildCampusPath = useCallback((x: number, y: number) => {
    const w = worldRef.current!;
    const check = canBuildCampusPath(w, { x, y });
    if (!check.ok) return check;
    w.player.cash -= CAMPUS_PATH_COST;
    w.player.campusPaths.push({ x, y });
    rerender();
    return { ok: true, reason: "" };
  }, [rerender]);

  const buildCampusPathLine = useCallback((tiles: { x: number; y: number }[]) => {
    const w = worldRef.current!;
    const unique = tiles.filter((tile, index) => tiles.findIndex((other) => other.x === tile.x && other.y === tile.y) === index);
    if (!unique.length) return { ok: false, reason: "Select a path line first.", built: 0 };
    let built = 0;
    for (const tile of unique) {
      const check = canBuildCampusPath(w, tile);
      if (!check.ok) return { ok: false, reason: check.reason, built };
      w.player.cash -= CAMPUS_PATH_COST;
      w.player.campusPaths.push(tile);
      built += 1;
    }
    rerender();
    return { ok: true, reason: "", built };
  }, [rerender]);


  const retoolFactory = useCallback((roomId: string, productKey: string) => {
    const w = worldRef.current!;
    const room = w.player.operatingRooms.find((r) => r.id === roomId && r.kind === "factory");
    if (teamEffectiveness(w, "operations") <= 0) return false;
    const archetype = archetypeByKey(productKey);
    const business = archetype ? w.player.businesses?.[archetype.industryId] : null;
    if (!room || !archetype || !business || business.status !== "active" || !business.unlockedCategories.includes(productKey)) return false;
    const nextFamilies = [...archetype.manufacturingFamilies];
    if (!nextFamilies.length) return false;
    const same = [...(room.manufacturingFamilies ?? [])].sort().join("|") === [...nextFamilies].sort().join("|");
    if (same) return true;
    const cost = Math.max(150_000, Math.round(room.buildCost * 0.18));
    if (w.player.cash < cost) return false;
    w.player.cash -= cost;
    room.manufacturingFamilies = nextFamilies;
    const industryLabel = INDUSTRIES[archetype.industryId]?.label ?? archetype.industryId;
    w.events.push({ tick: w.tick, kind: "operations", text: `🏭 ${room.name} retooled for ${archetype.label} production (${Math.round(cost).toLocaleString()}).` });
    recordChronicle(w, { kind: "operations", importance: 1, title: `${room.name} retooled`, text: `${room.name} was reconfigured for ${archetype.label} (${industryLabel}) manufacturing.`, icon: "🔧", entityType: "building", entityId: room.id, tags: ["operations", "manufacturing", archetype.industryId, productKey] });
    rerender();
    return true;
  }, [rerender]);
  const installWarehouseModule = useCallback((roomId: string, profile: StorageProfileId) => {
    const w = worldRef.current!;
    const room = w.player.operatingRooms.find((r) => r.id === roomId && r.kind === "warehouse");
    if (!room) return { ok: false, reason: "Warehouse not found." };
    if (profile === "standard") return { ok: true, reason: "" };
    if (teamEffectiveness(w, "operations") <= 0) return { ok: false, reason: "Seat a Sourcing / Operations specialist before installing specialized warehouse equipment." };
    const gate = storageModuleRequirement(w, profile);
    if (gate) return { ok: false, reason: gate };
    room.storageProfiles = room.storageProfiles?.length ? room.storageProfiles : ["standard"];
    if (room.storageProfiles.includes(profile)) return { ok: false, reason: "This storage module is already installed." };
    const cost = WAREHOUSE_MODULE_COST[profile];
    if (w.player.cash < cost) return { ok: false, reason: `Need $${cost.toLocaleString()} to install this module.` };
    w.player.cash -= cost;
    room.storageProfiles.push(profile);
    w.events.push({ tick: w.tick, kind: "operations", text: `❄ ${room.name} added ${profile} storage capability.` });
    rerender();
    return { ok: true, reason: "" };
  }, [rerender]);

  const upgradeOperatingRoom = useCallback((roomId: string) => {
    const w = worldRef.current!;
    const room = w.player.operatingRooms.find((r) => r.id === roomId);
    if (!room) return { ok: false, reason: "Facility not found." };
    const quote = facilityUpgradeQuote(room);
    if (!quote) return { ok: false, reason: "This facility is already at maximum capacity." };
    if (room.kind === "office") { const gate = officeUpgradeResearchRequirement(w, quote.nextLevel); if (gate) return { ok: false, reason: gate }; }
    if (w.player.cash < quote.cost) return { ok: false, reason: "Not enough cash for this upgrade." };
    w.player.cash -= quote.cost;
    room.capacity += quote.capacityGain;
    room.monthlyCost += quote.monthlyCostGain;
    room.upgradeLevel = quote.nextLevel;
    syncDerivedDepartments(w);
    w.events.push({ tick: w.tick, kind: "operations", text: `🏗 ${room.name} expanded to level ${quote.nextLevel}.` });
    recordChronicle(w, { kind: "operations", importance: 1, title: `${room.name} expanded`, text: `${room.name} reached facility level ${quote.nextLevel}, adding ${quote.capacityGain.toLocaleString()} capacity.`, icon: "🏗", entityType: "building", entityId: room.id, tags: ["operations", "building", "upgrade"] });
    rerender();
    return { ok: true };
  }, [rerender]);

  const demolishOperatingRoom = useCallback((roomId: string) => {
    const w = worldRef.current!;
    const room = w.player.operatingRooms.find((r) => r.id === roomId);
    if (!room || room.id === "founder-office") return;
    w.player.cash += Math.round(room.buildCost * 0.25);
    w.player.operatingRooms = sanitizeOperatingRooms(w, w.player.operatingRooms.filter((r) => r.id !== roomId));
    syncDerivedDepartments(w);
    rerender();
  }, [rerender]);

  return {
    world: worldRef.current, phase, setPhase, playing, setPlaying, speed, setSpeed, modal, setModal, autosaveAvailable, continueAutosave, newGame, saveNow,
    launch, createProduct, produce, signContract, removeContract, assignPartner,
    setPackaging, setProductPrice, setProductQuality, setProductionSetup, retargetProduct, releaseProduct, discardProduct, setIP, createIP, licenseIP,
    setMarketing, setBrandMarketing, setBackOffice, setFocus, selectCell, commission, borrow, repay,
    saveSegment, deleteSegment, updateSegment, launchCampaign, startResearch,
    hireCandidate, startRecruitingSearch, promotePersonnel, firePersonnel, setVision, createBrand, startCategoryExpansion, startIndustryEntry, updateOperatingRooms, buildOperatingRoom, buildCampusPath, buildCampusPathLine, demolishOperatingRoom, upgradeOperatingRoom, retoolFactory, installWarehouseModule,
  };
}
