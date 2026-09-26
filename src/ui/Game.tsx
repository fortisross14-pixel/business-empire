import React, { useEffect, useRef, useState } from "react";
import "./game-certification.css";
import { C, ctrlBtn, bigBtn, fmtMoney, fmtPct, fmtNum } from "./theme";
import { Panel, Slider, SelectInput } from "./components";
import { CampaignSelect, Home, SandboxWizard, SetupWizard } from "./setup/Setup";
import { ProductCreator, ContractModal } from "./setup/Modals";
import { MarketView } from "./views/MarketView";
import { FinancialsView } from "./views/FinancialsView";
import { IntelligenceView } from "./views/OpsIntel";
import { ProductsView } from "./views/ProductsView";
import { StrategyView } from "./views/StrategyView";
import { SegmentsView } from "./views/SegmentsView";
import { BrandView } from "./views/BrandView";
import { BusinessesView } from "./views/BusinessesView";
import { IPView } from "./views/IPView";
import { CustomersView } from "./views/CustomersView";
import { PersonnelView } from "./views/PersonnelView";
import { CompanyMapView } from "./views/CompanyMapView";
import { HistoryView } from "./views/HistoryView";
import { ResearchView } from "./views/ResearchView";
import { RoadmapView } from "./views/RoadmapView";
import { CapitalDeskView } from "./views/CapitalDeskView";
import { LegacyView } from "./views/LegacyView";
import { DecisionEventModal } from "./components/DecisionEventModal";
import { GameIcon, type GameIconName } from "./components/GameIcon";
import { ProductMomentModal, productMomentFromEvent, type ProductMoment } from "./components/ProductMomentModal";
import { CompetitiveMomentModal, competitiveMomentFromEvent, type CompetitiveMoment } from "./components/CompetitiveMomentModal";
import { researchDef, researchRate } from "../engine/research";
import { MARKETING_AGENCIES } from "../engine/industries";
import { agencyFitLabel, agencyFitStars, marketingAgencyFitForSegment } from "../engine/segments";
import { TICKS_PER_QUARTER, DAYS_PER_MONTH, type MarketEvent, type World } from "../engine/types";
import { useGame } from "../state/useGame";
import { inventoryUsed, warehouseUnitCapacity, maxManufacturableBatch, productionLeadDays } from "../engine/capacity";
import { founderJourney } from "../engine/progression";
import { categoryExpansionSpeed } from "../engine/growth";
import { industryEntrySpeed } from "../engine/businesses";
import { distributionMetricsForSku } from "../engine/distribution";
import { brandById } from "../engine/brands";
import { BrandLogoMark, ProductVisualCard } from "./visualIdentity";
import { teamEffectiveness } from "../engine/people";
import { scenarioProgress, SCENARIOS } from "../engine/gameplay";
import { CAMPAIGN_CASE_BY_ID, campaignDaysRemaining, campaignMetricValue, campaignRequirementMet, campaignStars, formatCampaignValue } from "../engine/campaign";

// ============================================================================
// Batch 10 UX architecture
// Campus is the game world. Buildings are contextual navigation. The bottom
// dock is a fast shortcut, not a second competing information architecture.
// ============================================================================

type Route = { top: string; sub: string };
type NavItem = Route & { id: string; label: string; icon: GameIconName; description?: string };

const GROUP_TABS: Record<string, NavItem[]> = {
  ops: [
    { id: "products", label: "Products", icon: "products", top: "ops", sub: "products" },
    { id: "inventory", label: "Inventory", icon: "inventory", top: "ops", sub: "inventory" },
    { id: "distribution", label: "Distribution", icon: "distribution", top: "ops", sub: "distribution" },
  ],
  fin: [
    { id: "overview", label: "Overview", icon: "finance", top: "fin", sub: "overview" },
    { id: "capital", label: "Capital Desk", icon: "capital", top: "fin", sub: "capital" },
    { id: "analysis", label: "Analysis", icon: "analysis", top: "fin", sub: "analysis" },
  ],
  mkt: [
    { id: "customers", label: "Market", icon: "market", top: "mkt", sub: "customers" },
    { id: "competitive", label: "Competition", icon: "competition", top: "mkt", sub: "competitive" },
    { id: "segments", label: "Segments", icon: "segments", top: "mkt", sub: "segments" },
    { id: "campaigns", label: "Marketing", icon: "marketing", top: "mkt", sub: "campaigns" },
  ],
  history: [
    { id: "chronicle", label: "Chronicle", icon: "history", top: "history", sub: "chronicle" },
    { id: "annual", label: "Annual Reviews", icon: "annual", top: "history", sub: "annual" },
    { id: "records", label: "Records", icon: "records", top: "history", sub: "records" },
    { id: "legacy", label: "Achievements", icon: "achievements", top: "history", sub: "legacy" },
  ],
  company: [
    { id: "company", label: "HQ", icon: "company", top: "mgmt", sub: "company" },
    { id: "roadmap", label: "Roadmap", icon: "roadmap", top: "mgmt", sub: "roadmap" },
    { id: "research", label: "Research", icon: "research", top: "mgmt", sub: "research" },
    { id: "strategy", label: "Strategy", icon: "strategy", top: "mgmt", sub: "strategy" },
    { id: "brands", label: "Brands", icon: "brands", top: "mgmt", sub: "vision" },
    { id: "businesses", label: "Businesses", icon: "businesses", top: "mgmt", sub: "businesses" },
    { id: "ip", label: "IP & Licensing", icon: "ip", top: "mgmt", sub: "ip" },
  ],
};

function routeMeta(top: string, sub: string) {
  const key = `${top}/${sub}`;
  const map: Record<string, { title: string; eyebrow: string; description: string; group?: string }> = {
    "mgmt/personnel": { title: "People", eyebrow: "Your organization", description: "Hire, develop and assign the people who make the company better.", group: "people" },
    "mgmt/company": { title: "Company HQ", eyebrow: "Corporate office", description: "Direction, portfolio and the long-term identity of the business.", group: "company" },
    "mgmt/roadmap": { title: "Company Roadmap", eyebrow: "Growth planning", description: "See the real people, buildings and capabilities behind each next-stage ambition.", group: "company" },
    "mgmt/research": { title: "Research & Capabilities", eyebrow: "Company development", description: "Unlock the product, organization and operating capabilities required to grow the company.", group: "company" },
    "mgmt/strategy": { title: "Strategy & Intelligence", eyebrow: "Company HQ", description: "Choose where to compete, then research what the market is telling you.", group: "company" },
    "mgmt/vision": { title: "Brands", eyebrow: "Company HQ", description: "Give each brand a reason to exist and decide how far it should stretch.", group: "company" },
    "mgmt/businesses": { title: "Businesses", eyebrow: "Company HQ", description: "Compare the industries inside your company and decide where to expand.", group: "company" },
    "mgmt/ip": { title: "IP & Licensing", eyebrow: "Company HQ", description: "Own, license and deploy intellectual property across compatible products.", group: "company" },
    "ops/products": { title: "Products", eyebrow: "Product studio", description: "See what is working, what is stuck and what needs a decision next.", group: "ops" },
    "ops/inventory": { title: "Inventory", eyebrow: "Warehouse", description: "Keep enough stock to sell without turning cash into a warehouse full of mistakes.", group: "ops" },
    "ops/distribution": { title: "Distribution", eyebrow: "Sourcing & sales", description: "Put each product in channels that fit the buyer and the proposition.", group: "ops" },
    "fin/overview": { title: "Finance", eyebrow: "Finance office", description: "Understand where the money comes from, where it goes and why cash differs from profit.", group: "fin" },
    "fin/capital": { title: "Capital Desk", eyebrow: "Finance office", description: "Raise capital, request debt and build investor relationships without losing sight of the trade-offs.", group: "fin" },
    "fin/analysis": { title: "Financial Analysis", eyebrow: "Finance office", description: "Drill into economics by product and operating decision.", group: "fin" },
    "mkt/customers": { title: "Market", eyebrow: "Commercial intelligence", description: "Who buys, what they value and where your current opportunities are.", group: "mkt" },
    "mkt/competitive": { title: "Competitive World", eyebrow: "Market command center", description: "Track rival intent, segment battles, market news and quarterly position.", group: "mkt" },
    "mkt/segments": { title: "Segments", eyebrow: "Commercial intelligence", description: "Turn market understanding into reusable audiences for campaigns and decisions.", group: "mkt" },
    "mkt/internal": { title: "Marketing", eyebrow: "Marketing office", description: "Allocate ongoing spend without pretending money can rescue a bad proposition.", group: "mkt" },
    "mkt/campaigns": { title: "Marketing", eyebrow: "Marketing office", description: "Choose an audience, see which media partner fits it, and run targeted campaigns.", group: "mkt" },
    "history/chronicle": { title: "Company Chronicle", eyebrow: "Archive", description: "The moments that made the company what it is.", group: "history" },
    "history/annual": { title: "Annual Reviews", eyebrow: "Archive", description: "A year-by-year view of performance and turning points.", group: "history" },
    "history/records": { title: "Records & Legacy", eyebrow: "Archive", description: "The products, people and achievements that defined the run.", group: "history" },
    "history/legacy": { title: "Achievements & Legacy", eyebrow: "Your run", description: "Track the scenario, major choices, achievements and outcomes that make this company’s story distinct.", group: "history" },
  };
  return map[key] ?? { title: "Business Empire", eyebrow: "Company", description: "" };
}

export function Game() {
  const g = useGame();
  const [overlay, setOverlay] = useState<Route | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<MarketEvent[]>([]);
  const [creatorBaseId, setCreatorBaseId] = useState<string | null>(null);
  const [focusProductId, setFocusProductId] = useState<string | null>(null);
  type GameMoment = { type: "product"; value: ProductMoment } | { type: "competitive"; value: CompetitiveMoment };
  const [gameMoment, setGameMoment] = useState<GameMoment | null>(null);
  const eventCursor = useRef<number | null>(null);
  const queuedMoments = useRef<GameMoment[]>([]);

  // Important product moments are decision points, not disposable notification toasts.
  // Start watching only after a world is loaded, so historical save events never replay.
  useEffect(() => {
    const world = g.world;
    if (g.phase !== "play" || !world) { eventCursor.current = null; queuedMoments.current = []; setNotificationQueue([]); return; }
    if (eventCursor.current == null) { eventCursor.current = world.events.length; return; }
    if (world.events.length <= eventCursor.current) return;
    const incoming = world.events.slice(eventCursor.current);
    eventCursor.current = world.events.length;
    const moments = incoming.map((event): GameMoment | null => {
      const product = productMomentFromEvent(world, event);
      if (product) return { type: "product", value: product };
      const competitive = competitiveMomentFromEvent(world, event);
      return competitive ? { type: "competitive", value: competitive } : null;
    }).filter((moment): moment is GameMoment => Boolean(moment));
    const momentEvents = new Set(moments.map((moment) => moment.value.event));
    const notifications = incoming.filter((event) => !momentEvents.has(event));
    if (notifications.length) setNotificationQueue((queue) => [...queue, ...notifications].slice(-30));
    if (moments.length) {
      queuedMoments.current.push(...moments);
      if (!gameMoment) {
        const next = queuedMoments.current.shift() ?? null;
        setGameMoment(next);
        g.setPlaying(false);
      }
    }
  }, [g.phase, g.world, g.world?.events.length, g.setPlaying, gameMoment]);

  useEffect(() => {
    if (g.phase === "play" && g.world?.gameplay.pendingDecision) g.setPlaying(false);
  }, [g.phase, g.world?.gameplay.pendingDecision?.id, g.setPlaying]);

  const dismissGameMoment = () => {
    const next = queuedMoments.current.shift() ?? null;
    setGameMoment(next);
    if (next) g.setPlaying(false);
  };

  const navigate = (top: string, sub: string) => { if (top === "mgmt" && sub === "hq") setOverlay(null); else setOverlay({ top, sub }); };
  const closeOverlay = () => setOverlay(null);
  const openCreator = (baseSkuId?: string) => { setCreatorBaseId(baseSkuId ?? null); g.setModal("creator"); };
  const openProduct = (productId: string) => { setFocusProductId(productId); navigate("ops", "products"); };

  if (g.phase === "home") return <Shell><Home onSelectMode={g.openMode} onContinue={g.continueAutosave} canContinue={g.autosaveAvailable} profile={g.campaignProfile} /></Shell>;
  if (g.phase === "campaign") return <Shell><CampaignSelect profile={g.campaignProfile} onLaunch={g.launchCampaignCase} onBack={g.goHome} /></Shell>;
  if (g.phase === "setup") return <Shell><SetupWizard onLaunch={g.launch} onBack={g.goHome} /></Shell>;
  if (g.phase === "sandbox") return <Shell><SandboxWizard onLaunch={g.launchSandbox} onBack={g.goHome} /></Shell>;

  const w = g.world!;
  const hist = w.history;
  const last = hist.at(-1) ?? ({} as any);
  const prev = hist[Math.max(0, hist.length - TICKS_PER_QUARTER)] ?? ({} as any);
  const shareDelta = (last.share || 0) - (prev.share || 0);
  const newEvent = notificationQueue[0] ?? null;
  const day = (w.tick % DAYS_PER_MONTH) + 1;
  const month = Math.floor(w.tick / DAYS_PER_MONTH) % 12 + 1;
  const year = Math.floor(w.tick / (TICKS_PER_QUARTER * 4)) + 1;
  const creatorBase = creatorBaseId ? w.player.skus.find((s) => s.id === creatorBaseId) ?? null : null;
  const workQueue = activeWorkQueue(w);
  const leadTask = workQueue[0];
  const productAttention = w.player.skus.filter((s) => s.status === "designed" || (s.status === "active" && !s.releasedToMarket)).length;

  const renderOverlay = () => {
    if (!overlay) return null;
    if (overlay.top === "goals") return w.mode === "campaign" ? <CampaignGoalsOverlay world={w} onSubmit={g.finishCampaignCase} /> : <GoalsOverlay world={w} onNavigate={navigate} />;
    if (overlay.top === "mgmt" && overlay.sub === "company") return <CompanyHub world={w} onNavigate={navigate} />;
    if (overlay.top === "mgmt" && overlay.sub === "roadmap") return <RoadmapView world={w} onNavigate={navigate} />;
    if (overlay.top === "mgmt" && overlay.sub === "personnel") return <PersonnelView world={w} hireCandidate={g.hireCandidate} startRecruitingSearch={g.startRecruitingSearch} promotePersonnel={g.promotePersonnel} trainPersonnel={g.trainPersonnel} firePersonnel={g.firePersonnel} />;
    if (overlay.top === "mgmt" && overlay.sub === "research") return <ResearchView world={w} startResearch={g.startResearch} startCategoryExpansion={g.startCategoryExpansion} />;
    if (overlay.top === "mgmt" && overlay.sub === "strategy") return <div><StrategyView world={w} /><div style={{ marginTop: 14 }}><IntelligenceView world={w} commission={g.commission} /></div></div>;
    if (overlay.top === "mgmt" && overlay.sub === "vision") return <BrandView world={w} setVision={g.setVision} createBrand={g.createBrand} startCategoryExpansion={g.startCategoryExpansion} />;
    if (overlay.top === "mgmt" && overlay.sub === "businesses") return <BusinessesView world={w} startIndustryEntry={g.startIndustryEntry} />;
    if (overlay.top === "mgmt" && overlay.sub === "ip") return <IPView world={w} createIP={g.createIP} licenseIP={g.licenseIP} />;
    if (overlay.top === "ops" && overlay.sub === "products") return <ProductsView world={w} produce={g.produce} setProductPrice={g.setProductPrice} setProductQuality={g.setProductQuality} setProductionSetup={g.setProductionSetup} assignPartner={g.assignPartner} openContract={() => g.setModal("contract")} openCreator={openCreator} commissionStudy={(skuId) => g.commission("product_diagnosis", skuId)} releaseProduct={g.releaseProduct} retargetProduct={g.retargetProduct} discardProduct={g.discardProduct} setProductArchived={g.setProductArchived} openMarketing={() => navigate("mkt","campaigns")} openSegments={() => navigate("mkt","segments")} focusProductId={focusProductId} onFocusHandled={() => setFocusProductId(null)} />;
    if (overlay.top === "ops" && overlay.sub === "inventory") return <InventoryView world={w} openProduct={openProduct} />;
    if (overlay.top === "ops" && overlay.sub === "distribution") return <DistributionView world={w} openContract={() => g.setModal("contract")} removeContract={g.removeContract} openProduct={openProduct} />;
    if (overlay.top === "fin" && overlay.sub === "overview") return <FinancialsView world={w} hist={hist} borrow={g.borrow} repay={g.repay} />;
    if (overlay.top === "fin" && overlay.sub === "capital") return <CapitalDeskView world={w} borrow={g.borrow} repay={g.repay} connectInvestor={g.connectInvestor} requestGrowthLoan={g.requestGrowthLoan} raiseCapital={g.raiseCapital} />;
    if (overlay.top === "fin" && overlay.sub === "analysis") return <FinancialAnalysisView world={w} openProduct={openProduct} />;
    if (overlay.top === "mkt" && overlay.sub === "customers") return <div><MarketView world={w} hist={hist} selectCell={g.selectCell} mode="overview" /><div style={{ marginTop: 14 }}><CustomersView world={w} /></div></div>;
    if (overlay.top === "mkt" && overlay.sub === "competitive") return <MarketView world={w} hist={hist} selectCell={g.selectCell} mode="competitive" />;
    if (overlay.top === "mkt" && overlay.sub === "segments") return <SegmentsView world={w} saveSegment={g.saveSegment} deleteSegment={g.deleteSegment} updateSegment={g.updateSegment} />;
    if (overlay.top === "mkt" && overlay.sub === "campaigns") return <CampaignsView world={w} launchCampaign={g.launchCampaign} openSegments={() => navigate("mkt","segments")} setMarketing={g.setMarketing} setBrandMarketing={g.setBrandMarketing} setFocus={g.setFocus} />;
    if (overlay.top === "history" && overlay.sub === "legacy") return <LegacyView world={w} />;
    if (overlay.top === "history") return <HistoryView world={w} mode={overlay.sub === "annual" ? "annual" : overlay.sub === "records" ? "records" : "chronicle"} />;
    return null;
  };

  const meta = overlay && overlay.top !== "goals" ? routeMeta(overlay.top, overlay.sub) : { title: "Founder Goals", eyebrow: "Company journey", description: "Your current milestones." };
  const tabs = overlay && overlay.top !== "goals" && meta.group && GROUP_TABS[meta.group] ? GROUP_TABS[meta.group] : [];

  return <Shell>
    <div className="play-surface">
      <header className="game-hud">
        <button className="company-mark" onClick={closeOverlay} title="Campus">
          <span className="company-gem" style={w.brands.length ? { width: "auto", height: "auto", background: "transparent", boxShadow: "none" } : undefined}>{w.brands.length ? <BrandLogoMark brand={brandById(w, w.primaryBrandId)} size={34} /> : <span style={{ fontSize: 12, fontWeight: 900 }}>{w.company.split(/\s+/).map((x:string)=>x[0]).join("").slice(0,2).toUpperCase() || "BE"}</span>}</span>
          <span><b>{w.company}</b><small>{Object.keys(w.player.businesses ?? {}).length > 1 ? `${Object.keys(w.player.businesses).length} businesses` : w.cfg.label}</small></span>
        </button>
        <div className="hud-metrics"><HudMetric icon="$" label="Cash" value={fmtMoney(w.player.cash)} tone={w.player.cash < 0 ? "bad" : "normal"} /><HudMetric icon="▲" label="Profit / Q" value={fmtMoney(w.live?.income.profit || 0)} tone={(w.live?.income.profit || 0) < 0 ? "bad" : "good"} /><HudMetric icon="▥" label="Revenue / Q" value={fmtMoney(w.live?.income.netRevenue || last.revenue || 0)} /><HudMetric icon="%" label="Share" value={fmtPct(last.share || 0)} detail={shareDelta ? `${shareDelta >= 0 ? "▲" : "▼"}${Math.abs(shareDelta * 100).toFixed(1)}` : undefined} /></div>
        <div className="hud-controls"><div className="hud-task-stack">{w.mode === "campaign" && w.campaign && <button className="task-pill" onClick={() => setOverlay({top:"goals",sub:"goals"})}><span>🎓</span><b>{CAMPAIGN_CASE_BY_ID[w.campaign.caseId]?.name ?? "Campaign case"}</b><em>{campaignDaysRemaining(w)}d · {campaignStars(w)}/3★</em></button>}{leadTask && <button className="task-pill" onClick={() => navigate(leadTask.top, leadTask.sub)} title={workQueue.map((t) => `${t.label}: ${t.days == null ? "Paused" : `${t.days}d`}`).join(" · ")}><span>{leadTask.icon}</span><b>{leadTask.label}</b><em>{leadTask.days == null ? "Paused" : `${leadTask.days}d`}{workQueue.length > 1 ? ` · +${workQueue.length - 1}` : ""}</em></button>}</div>{w.difficulty !== "bootstrap" && <span className={`confidence ${w.investorConfidence < .35 ? "low" : w.investorConfidence < .65 ? "mid" : "high"}`}>Backers {(w.investorConfidence * 100).toFixed(0)}%</span>}<span className="difficulty-pill">{w.mode === "campaign" ? "case" : w.mode ?? w.difficulty}</span><button aria-label={g.playing ? "Pause simulation" : "Play simulation"} onClick={() => g.setPlaying(!g.playing)} style={{ ...ctrlBtn, fontSize: 14, padding: "6px 11px" }}>{g.playing ? "❚❚" : "▶"}</button>{[1,2,4].map((s) => <button aria-label={`Set speed to ${s} times`} key={s} onClick={() => g.setSpeed(s)} style={{ ...ctrlBtn, background: g.speed === s ? C.violet : C.panel, color: g.speed === s ? "#fff" : C.dim, minWidth: 34, padding: "6px 8px", fontWeight: 700 }}>{s}×</button>)}<span className="game-date">Y{year} · M{month} · D{day}</span><button onClick={g.saveNow} style={{ ...ctrlBtn, padding: "6px 9px" }}>Save</button></div>
      </header>

      <div className="campus-world"><CompanyMapView world={w} openCreator={() => openCreator()} updateRooms={g.updateOperatingRooms} buildRoom={g.buildOperatingRoom} buildPath={g.buildCampusPath} buildPathLine={g.buildCampusPathLine} moveRoom={g.moveOperatingRoom} demolishRoom={g.demolishOperatingRoom} upgradeRoom={g.upgradeOperatingRoom} retoolFactory={g.retoolFactory} installWarehouseModule={g.installWarehouseModule} onNavigate={navigate} /></div>

      <nav className="left-rail" aria-label="Company controls">
        <RailButton icon="goals" label={w.mode === "campaign" ? "Case" : "Goals"} active={overlay?.top === "goals"} onClick={() => setOverlay({top:"goals",sub:"goals"})} badge={w.mode === "campaign" ? `${campaignStars(w)}★` : `${founderJourney(w).filter((s)=>!s.done).length}`} />
        <RailButton icon="products" label="Products" active={overlay?.top === "ops" && overlay.sub === "products"} onClick={() => navigate("ops","products")} badge={productAttention ? String(productAttention) : undefined} />
        <RailButton icon="people" label="People" active={overlay?.top === "mgmt" && overlay.sub === "personnel"} onClick={() => navigate("mgmt","personnel")} badge={w.player.talentSearch ? `${Math.ceil(w.player.talentSearch.daysLeft)}d` : undefined} />
        <RailButton icon="market" label="Market" active={overlay?.top === "mkt"} onClick={() => navigate("mkt","customers")} />
        <RailButton icon="finance" label="Finance" active={overlay?.top === "fin"} onClick={() => navigate("fin","overview")} />
        <RailButton icon="company" label="Company" active={overlay?.top === "mgmt" && overlay.sub !== "personnel"} onClick={() => navigate("mgmt","company")} />
        <RailButton icon="history" label="History" active={overlay?.top === "history"} onClick={() => navigate("history","chronicle")} />
      </nav>

      {newEvent && <EventToast key={`${newEvent.tick}_${newEvent.text}`} event={newEvent} queued={notificationQueue.length} onDismiss={() => setNotificationQueue((queue) => queue.slice(1))} />}

      {overlay && <div className="screen-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeOverlay(); }}>
        <section className="overlay-card">
          <div className="overlay-head"><div><div className="screen-eyebrow">{meta.eyebrow}</div><h1>{meta.title}</h1><p>{meta.description}</p></div><button className="overlay-close" onClick={closeOverlay}>✕</button></div>
          {tabs.length > 1 && <div className="overlay-tabs">{tabs.map((t) => { const active = overlay.top === t.top && overlay.sub === t.sub; return <button key={t.id} className={active ? "active" : ""} onClick={() => navigate(t.top,t.sub)}><GameIcon name={t.icon} size={23} compact active={active} /> {t.label}</button>; })}</div>}
          <div className="overlay-body">{renderOverlay()}</div>
        </section>
      </div>}

      {g.modal === "creator" && <ProductCreator world={w} baseSku={creatorBase} onCreate={(spec) => { const result = g.createProduct(spec); if (result.ok) setCreatorBaseId(null); return result; }} onClose={() => { setCreatorBaseId(null); g.setModal(null); }} />}
      {g.modal === "contract" && <ContractModal world={w} onSign={g.signContract} onClose={() => g.setModal(null)} />}
      {gameMoment?.type === "product" && <ProductMomentModal world={w} moment={gameMoment.value} onDismiss={dismissGameMoment} onOpenProduct={openProduct} />}
      {gameMoment?.type === "competitive" && <CompetitiveMomentModal world={w} moment={gameMoment.value} onDismiss={dismissGameMoment} onOpenCompetition={() => navigate("mkt", "competitive")} />}
      {w.gameplay.pendingDecision && <DecisionEventModal event={w.gameplay.pendingDecision} onChoose={(choiceId) => g.resolveDecision(choiceId)} />}
      {w.mode === "campaign" && w.campaign?.completed && <CampaignResultModal world={w} onCareer={() => g.openMode("campaign")} />}
    </div>
  </Shell>;
}


type WorkQueueItem = { icon: string; label: string; days: number | null; top: string; sub: string };
function activeWorkQueue(world: any): WorkQueueItem[] {
  const items: WorkQueueItem[] = [];
  if (world.player.talentSearch) items.push({ icon: "🔎", label: `${world.player.talentSearch.role === "product_manager" ? "Product" : world.player.talentSearch.role.replaceAll("_", " ")} search`, days: Math.ceil(world.player.talentSearch.daysLeft), top: "mgmt", sub: "personnel" });
  if (world.player.research?.active) { const rp=world.player.research.active; const rate=researchRate(world); items.push({icon:rate > 0 ? "🔬" : "⏸",label:researchDef(rp.nodeId).title,days:rate > 0 ? Math.ceil(Math.max(0,rp.requiredPoints-rp.progress)/rate) : null,top:"mgmt",sub:"research"}); }
  for (const training of world.player.trainingPrograms ?? []) { const person=world.player.personnel.find((p:any)=>p.id===training.personnelId); items.push({ icon:"🎓", label:`${person?.name ?? "Employee"} training`, days:Math.ceil(training.daysLeft), top:"mgmt", sub:"personnel" }); }
  for (const sku of world.player.skus ?? []) {
    if (sku.status === "designing" && sku.designDaysLeft > 0) items.push({ icon: "✏️", label: sku.name, days: Math.ceil(sku.designDaysLeft), top: "ops", sub: "products" });
    if (sku.status === "manufacturing" && sku.mfgDaysLeft > 0) items.push({ icon: "🏭", label: sku.name, days: Math.ceil(sku.mfgDaysLeft), top: "ops", sub: "products" });
  }
  for (const study of world.studies ?? []) if (!study.done && study.ticksLeft > 0) items.push({ icon: "🔬", label: "Research study", days: Math.ceil(study.ticksLeft), top: "mgmt", sub: "strategy" });
  const catRate = categoryExpansionSpeed(world);
  for (const business of Object.values(world.player.businesses ?? {}) as any[]) for (const project of business?.categoryExpansionProjects ?? []) if (project.daysLeft > 0) items.push({ icon: catRate > 0 ? "🧪" : "⏸", label: "Category development", days: catRate > 0 ? Math.ceil(project.daysLeft / catRate) : null, top: "mgmt", sub: "research" });
  const entryRate = industryEntrySpeed(world);
  for (const project of world.player.industryEntryProjects ?? []) if (project.daysLeft > 0) items.push({ icon: entryRate > 0 ? "🧱" : "⏸", label: "Industry entry", days: entryRate > 0 ? Math.ceil(project.daysLeft / entryRate) : null, top: "mgmt", sub: "businesses" });
  return items.sort((a,b) => (a.days ?? Number.POSITIVE_INFINITY) - (b.days ?? Number.POSITIVE_INFINITY));
}

function RailButton({ icon, label, active, onClick, badge }: { icon: GameIconName; label: string; active: boolean; onClick: () => void; badge?: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}><GameIcon name={icon} size={30} compact active={active} /><small>{label}</small>{badge && badge !== "0" ? <i>{badge}</i> : null}</button>;
}

function EventToast({ event, onDismiss, queued = 1 }: { event: MarketEvent; onDismiss: () => void; queued?: number }) {
  const [closing, setClosing] = useState(false);
  const close = () => { if (closing) return; setClosing(true); window.setTimeout(onDismiss, 220); };
  useEffect(() => { const timer = window.setTimeout(close, event.code === "achievement_unlocked" ? 8200 : 6500); return () => window.clearTimeout(timer); }, []);
  const eventCode = event.code ?? "";
  const achievement = eventCode === "achievement_unlocked";
  const icon = achievement ? "🏆" : eventCode.includes("research") ? "🔬" : eventCode.includes("product") ? "📦" : eventCode.includes("market") ? "📈" : "⚡";
  return <div role="status" aria-live="polite" className={`event-toast ${achievement ? "achievement" : ""} ${closing ? "closing" : ""}`}><span className="event-toast-icon">{icon}</span><span className="event-toast-copy"><b>{achievement ? "Achievement unlocked" : "Company update"}</b><small>{event.text}</small></span>{queued > 1 && <em className="event-toast-queue">+{queued - 1}</em>}<button type="button" aria-label="Dismiss notification" onClick={close}>✕</button></div>;
}

function CampaignGoalsOverlay({ world, onSubmit }: { world: World; onSubmit: () => unknown }) {
  const runtime=world.campaign; if(!runtime) return null; const def=CAMPAIGN_CASE_BY_ID[runtime.caseId]; if(!def) return null; const currentStars=campaignStars(world);
  return <div className="campaign-goals">
    <div style={{background:"linear-gradient(135deg,#0d416c,#168de2)",color:"#fff",borderRadius:15,padding:18,marginBottom:13,boxShadow:"0 12px 28px rgba(16,89,139,.18)"}}><div style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#a8ddff"}}>BUSINESS SCHOOL CASE · {def.difficulty.toUpperCase()}</div><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",marginTop:5}}><div><h2 style={{margin:"0 0 4px"}}>{def.icon} {def.name}</h2><div style={{fontSize:12,color:"#cce7f8"}}>{def.company} · {campaignDaysRemaining(world)} days remaining</div></div><div style={{fontSize:24,color:"#ffd166",whiteSpace:"nowrap"}}>{[1,2,3].map((star)=><span key={star}>{star<=currentStars?"★":"☆"}</span>)}</div></div><p style={{fontSize:12,lineHeight:1.55,color:"#dbeef9",margin:"12px 0 0"}}>{def.brief}</p></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10}}>{def.stars.map((star)=>{const achieved=star.requirements.every((requirement)=>campaignRequirementMet(world,requirement));return <div key={star.stars} style={{background:achieved?"linear-gradient(180deg,#f1fff7,#e8f9f0)":"#fff",border:`1px solid ${achieved?"#8bd8ae":C.line}`,borderRadius:12,padding:13}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><b style={{color:achieved?C.green:C.ink}}>{"★".repeat(star.stars)} {star.title}</b><span style={{color:achieved?C.green:C.faint,fontWeight:900}}>{achieved?"DONE":"OPEN"}</span></div><div style={{marginTop:8,display:"grid",gap:7}}>{star.requirements.map((requirement,index)=>{const value=campaignMetricValue(world,requirement),met=campaignRequirementMet(world,requirement);return <div key={index} style={{fontSize:10.5,color:C.dim}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><span>{met?"✓":"○"} {requirement.label}</span><b style={{color:met?C.green:C.ink}}>{formatCampaignValue(requirement,value)}</b></div><div style={{height:4,borderRadius:99,background:C.grid,marginTop:4,overflow:"hidden"}}><div style={{width:`${Math.max(3,Math.min(100,requirement.operator==="<="?(value<=requirement.target?100:requirement.target/Math.max(1,value)*100):value/Math.max(.0001,requirement.target)*100))}%`,height:"100%",background:met?C.green:C.cyan}}/></div></div>})}</div></div>})}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}><Panel title="Case rules"><div style={{display:"grid",gap:6}}>{(def.constraints.notes??["No special restrictions."]).map((note)=><div key={note} style={{fontSize:11,color:C.dim}}>◆ {note}</div>)}</div></Panel><Panel title="What this case teaches"><div style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{def.lesson}</div><div style={{fontSize:10.5,color:C.faint,marginTop:9}}>{runtime.scriptedEventsSeen.length}/{def.events.length} authored case events encountered</div></Panel></div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,background:C.panel2,border:`1px solid ${C.line}`,borderRadius:12,padding:13}}><div><b style={{color:C.ink}}>Submit when you are satisfied with the result.</b><div style={{color:C.dim,fontSize:11,marginTop:3}}>Your best score is permanent. Replaying a case can only improve it.</div></div><button disabled={currentStars<1||runtime.completed} onClick={()=>onSubmit()} style={{...bigBtn,opacity:currentStars<1||runtime.completed ? .45 : 1}}>{runtime.completed?"Case submitted":currentStars?`Submit for ${currentStars} star${currentStars===1?"":"s"}`:"Reach the 1-star goal first"}</button></div>
  </div>;
}

function CampaignResultModal({ world, onCareer }: { world: World; onCareer:()=>void }) {
  const runtime=world.campaign; if(!runtime) return null; const def=CAMPAIGN_CASE_BY_ID[runtime.caseId]; const stars=runtime.awardedStars;
  const verdict = stars===3?"Boardroom distinction":stars===2?"Strong turnaround":stars===1?"Assignment passed":"Case requires another attempt";
  const copy = stars===3?"Outstanding. You solved the assignment and created a result that would stand up in the boardroom.":stars===2?"Strong result. The company is healthier and the strategic logic is working.":stars===1?"You stabilized the essential business problem. Replay the case whenever you want to pursue a stronger result.":"The deadline arrived before the minimum assignment was met. Review the evidence and try a different set of decisions.";
  return <div className="campaign-result-backdrop" role="dialog" aria-modal="true" aria-labelledby="campaign-result-title"><section className="campaign-result-card">
    <div className="campaign-result-ribbon"><span>{stars?"🎓":"📚"}</span><div><small>BUSINESS SCHOOL CASE COMPLETE</small><b>{verdict}</b></div></div>
    <div className="campaign-result-body"><p className="campaign-result-company">{def?.company ?? world.company}</p><h1 id="campaign-result-title">{def?.name??runtime.caseId}</h1><div className="campaign-result-stars" aria-label={`${stars} of 3 stars`}>{[1,2,3].map((star)=><span key={star} className={star<=stars?"earned":""}>{star<=stars?"★":"☆"}</span>)}</div><p>{copy}</p>
      <div className="campaign-result-score"><div><small>AWARDED</small><b>{stars}/3 stars</b></div><div><small>CAREER RESULT</small><b>{stars ? "Recorded" : "Retry available"}</b></div></div>
      <aside><b>What this case taught</b><span>{def?.lesson}</span></aside>
      <button className="campaign-result-action" onClick={onCareer}>Return to campaign map <span>→</span></button>
    </div>
  </section></div>;
}

function GoalsOverlay({ world, onNavigate }: { world: any; onNavigate: (top: string, sub: string) => void }) {
  const steps = founderJourney(world); const done = steps.filter((s) => s.done).length;
  const launchSteps = steps.filter((s) => ["design", "batch", "launch-plan", "release", "sale"].includes(s.id));
  const launchDone = launchSteps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  const scenario = SCENARIOS[world.gameplay.scenarioId as keyof typeof SCENARIOS];
  const scenarioGoals = scenarioProgress(world);
  return <div><section style={{ borderRadius: 13, padding: 14, marginBottom: 12, color: "white", background: "linear-gradient(135deg,#18254e,#4052a1 65%,#197ca5)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div><div style={{ color: "#8edbff", fontSize: 8.5, fontWeight: 900, letterSpacing: 1 }}>YOUR SCENARIO</div><b style={{ fontSize: 17 }}>{scenario.icon} {scenario.name}</b><div style={{ color: "#cadcf0", fontSize: 10.5, marginTop: 3 }}>{scenario.pitch}</div></div><button style={{ ...ctrlBtn, background: "rgba(255,255,255,.1)", color: "white", borderColor: "rgba(255,255,255,.25)" }} onClick={() => onNavigate("history", "legacy")}>Achievements & legacy →</button></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{scenarioGoals.map((goal) => <span key={goal.label} style={{ padding: "5px 8px", borderRadius: 99, fontSize: 9, background: goal.done ? "rgba(60,220,150,.2)" : "rgba(255,255,255,.08)", border: `1px solid ${goal.done ? "rgba(100,240,175,.35)" : "rgba(255,255,255,.15)"}` }}>{goal.done ? "✓" : "○"} {goal.label}</span>)}</div></section><section style={{ border: `1px solid ${C.violet}55`, background: "linear-gradient(135deg,#f7f6ff,#eefaff)", borderRadius: 13, padding: 14, marginBottom: 14 }}><div style={{ color: C.violet, fontSize: 9, fontWeight: 900, letterSpacing: .8 }}>FOUNDER'S FIRST REVENUE PLAN</div><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap", marginTop: 4 }}><div><b style={{ fontSize: 16 }}>{launchDone}/{launchSteps.length} commercial moments complete</b><div style={{ color: C.dim, fontSize: 11, lineHeight: 1.45, marginTop: 3 }}>Your startup is not finished when a product is designed. The first win is seeing a real product earn from real customers.</div></div>{next && <button style={{ ...ctrlBtn, color: C.violet, borderColor: C.violet, background: "white" }} onClick={() => onNavigate(next.topTab,next.subTab)}>Continue: {next.label} →</button>}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>{launchSteps.map((st) => <span key={st.id} style={{ padding: "4px 7px", fontSize: 9.5, borderRadius: 99, border: `1px solid ${st.done ? "#bbf7d0" : C.line}`, background: st.done ? "#f0fdf4" : "white", color: st.done ? C.green : C.faint }}>{st.done ? "✓" : "○"} {st.label}</span>)}</div></section><div className="goals-summary" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><div><b style={{ fontSize: 14 }}>{done}/{steps.length} milestones complete</b><div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>Goals are guidance, not a permanent banner over the campus.</div></div><div className="goals-progress" style={{ width: 180, height: 8, background: C.grid, borderRadius: 99 }}><div style={{ width: `${done/steps.length*100}%`, height: "100%", borderRadius: 99, background: C.violet }} /></div></div><div style={{ display: "grid", gap: 7 }}>{steps.map((st, i) => <button key={st.id} onClick={() => !st.done && onNavigate(st.topTab,st.subTab)} style={{ textAlign: "left", display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 8, alignItems: "center", border: `1px solid ${st.done ? "#bbf7d0" : C.line}`, background: st.done ? "#f0fdf4" : "white", borderRadius: 10, padding: 10, cursor: st.done ? "default" : "pointer", color: C.ink }}><span style={{ color: st.done ? C.green : C.faint, fontWeight: 900 }}>{st.done ? "✓" : i+1}</span><div><b style={{ fontSize: 11.5 }}>{st.label}</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 2 }}>{st.detail}</div></div>{!st.done && <span style={{ color: C.violet }}>→</span>}</button>)}</div></div>;
}

function HudMetric({ icon, label, value, detail, tone = "normal" }: { icon: string; label: string; value: string; detail?: string; tone?: "normal" | "good" | "bad" }) {
  return <div className={`hud-metric ${tone}`}><span className="metric-icon">{icon}</span><small>{label}</small><div><b>{value}</b>{detail && <em>{detail}</em>}</div></div>;
}

function CompanyHub({ world, onNavigate }: { world: any; onNavigate: (top: string, sub: string) => void }) {
  const activeBusinesses = Object.values(world.player.businesses ?? {}).filter((b: any) => b?.status === "active").length;
  const activeProducts = world.player.skus.filter((s: any) => !s.archived && s.status === "active").length;
  const ownedIp = world.ipAssets.filter((ip: any) => ip.ownerType === "player").length;
  const nextStep = founderJourney(world).find((step) => !step.done);
  const profit = world.live?.income?.profit ?? 0;
  const revenue = world.live?.income?.netRevenue ?? 0;
  const inventory = world.player.skus.reduce((sum: number, sku: any) => sum + (sku.inventory ?? 0), 0);
  const urgent = world.player.skus.filter((sku: any, index: number) => !sku.archived && sku.releasedToMarket && ((world.live?.skuResults?.[index]?.lostUnits ?? 0) > 1 || sku.inventory <= 0));
  const cards = [
    { icon: "⌁", title: "Company Roadmap", text: "See the people, facilities and capabilities behind the next growth step.", top: "mgmt", sub: "roadmap", tone: "#238bd0" },
    { icon: "◈", title: "Research", text: "Build the capabilities required for better products and a larger company.", top: "mgmt", sub: "research", tone: "#785ce0" },
    { icon: "◎", title: "Strategy", text: "Turn market evidence into a small number of deliberate choices.", top: "mgmt", sub: "strategy", tone: "#ef9d3b" },
    { icon: "◆", title: "Brands", text: "Position each brand and decide how far its credibility can stretch.", top: "mgmt", sub: "vision", tone: "#eb5c91" },
    { icon: "▦", title: "Businesses", text: "Compare industries and prepare the next expansion move.", top: "mgmt", sub: "businesses", tone: "#16a978" },
    { icon: "✦", title: "IP & Licensing", text: "Create, license and deploy properties with real audience fit.", top: "mgmt", sub: "ip", tone: "#e8ad2e" },
  ];
  return <div>
    <section className="hq-hero">
      <div className="hq-hero-copy"><small>EXECUTIVE BRIEFING</small><h2>{world.company}</h2><p>{nextStep ? <><b>Recommended next move:</b> {nextStep.label}. {nextStep.detail}</> : "The founder roadmap is complete. Choose the next advantage to compound."}</p><div className="hq-hero-actions"><button onClick={() => nextStep ? onNavigate(nextStep.topTab,nextStep.subTab) : onNavigate("mgmt","strategy")}>{nextStep ? `Continue: ${nextStep.label}` : "Review strategy"} <span>→</span></button><button onClick={() => onNavigate("mgmt","personnel")}>Open People</button></div></div>
      <div className="hq-score"><span>COMPANY RATING</span><b>{Math.max(1, Math.min(5, 2.4 + activeProducts * .18 + activeBusinesses * .2 + ownedIp * .08)).toFixed(1)}</b><em>{"★".repeat(Math.max(1, Math.round(Math.min(5, 2.4 + activeProducts * .18 + activeBusinesses * .2 + ownedIp * .08))))}</em></div>
    </section>
    <div className="hq-kpis">
      <div><span className="kpi-icon cash">$</span><small>Total cash</small><b>{fmtMoney(world.player.cash)}</b><em>Available to deploy</em></div>
      <div><span className="kpi-icon revenue">▥</span><small>Revenue / quarter</small><b>{fmtMoney(revenue)}</b><em>{activeProducts} active product{activeProducts === 1 ? "" : "s"}</em></div>
      <div><span className="kpi-icon profit">▲</span><small>Profit / quarter</small><b className={profit < 0 ? "negative" : "positive"}>{fmtMoney(profit)}</b><em>{profit < 0 ? "Needs attention" : "Operating result"}</em></div>
      <div><span className="kpi-icon people">●</span><small>Organization</small><b>{world.player.personnel.length} people</b><em>{activeBusinesses} business{activeBusinesses === 1 ? "" : "es"} · {world.brands.length} brand{world.brands.length === 1 ? "" : "s"}</em></div>
      <div><span className="kpi-icon stock">▣</span><small>Inventory</small><b>{fmtNum(inventory)}</b><em>{urgent.length ? `${urgent.length} stock warning${urgent.length === 1 ? "" : "s"}` : "Supply stable"}</em></div>
    </div>
    {(urgent.length > 0 || profit < 0) && <section className="hq-alert"><span>!</span><div><b>{urgent.length ? "Products are losing sales to stock pressure" : "The company is currently unprofitable"}</b><p>{urgent.length ? `${urgent.slice(0,2).map((sku:any)=>sku.name).join(" and ")} need an inventory decision.` : "Review product contribution and spending before committing more capital."}</p></div><button onClick={() => onNavigate(urgent.length ? "ops" : "fin",urgent.length ? "inventory" : "analysis")}>Investigate →</button></section>}
    <div className="hub-cards">
      {cards.map((c) => <button key={c.sub} style={{ "--hub-tone": c.tone } as React.CSSProperties} onClick={() => onNavigate(c.top, c.sub)}><span>{c.icon}</span><div><b>{c.title}</b><p>{c.text}</p></div><i>→</i></button>)}
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
      <button style={ctrlBtn} onClick={() => onNavigate("history", "chronicle")}>Open Company History</button>
    </div>
  </div>;
}

// ============================================================================
// Vertical-slice operating views.
// ============================================================================

function FounderRoadmap({ world, onNavigate }: { world: any; onNavigate: (top: string, sub: string) => void }) {
  const steps = founderJourney(world);
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return <div style={{ margin: "14px 24px 0", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: 180 }}><div style={{ fontWeight: 800, fontSize: 13 }}>Founder Roadmap</div><div style={{ color: C.faint, fontSize: 10.5 }}>{done}/{steps.length} first-business milestones</div></div>
      <div style={{ flex: "1 1 220px", height: 7, background: C.grid, borderRadius: 4 }}><div style={{ width: `${(done / steps.length) * 100}%`, height: "100%", background: C.violet, borderRadius: 4 }} /></div>
      {next && <button style={{ ...ctrlBtn, borderColor: C.violet, color: C.violet }} onClick={() => onNavigate(next.topTab, next.subTab)}>Next: {next.label} →</button>}
    </div>
    {next && <div style={{ color: C.dim, fontSize: 11.5, marginTop: 7 }}><b style={{ color: C.ink }}>{next.label}.</b> {next.detail}</div>}
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
      {steps.map((st) => <span key={st.id} title={st.detail} style={{ padding: "3px 7px", borderRadius: 99, fontSize: 9.5, background: st.done ? "#f0fdf4" : C.panel2, border: `1px solid ${st.done ? "#bbf7d0" : C.line}`, color: st.done ? "#166534" : C.faint }}>{st.done ? "✓" : "○"} {st.label}</span>)}
    </div>
  </div>;
}

function InventoryView({ world, openProduct }: { world: any; openProduct: (productId: string) => void }) {
  const capacity = warehouseUnitCapacity(world);
  const used = inventoryUsed(world);
  const utilization = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const warehouses = world.player.operatingRooms.filter((r: any) => r.kind === "warehouse");
  const active = world.player.skus.filter((s: any) => !s.archived && (s.status === "active" || s.status === "manufacturing" || s.status === "designed"));

  const status = utilization > .9 ? { label: "Capacity critical", tone: C.red, note: "Free space is almost exhausted." } : utilization > .75 ? { label: "Plan the next move", tone: C.amber, note: "The network is filling up." } : { label: "Network healthy", tone: C.green, note: "There is room for the next production run." };
  return <div className="inventory-command">
    <section className="inventory-hero">
      <div><small>WAREHOUSE COMMAND</small><h2>{status.label}</h2><p>{status.note} Inbound batches reserve capacity immediately, so the number below includes stock that is still travelling.</p></div>
      <div className="capacity-gauge" style={{ "--gauge": status.tone, "--fill": `${Math.round(utilization*100)}%` } as React.CSSProperties}><div><b>{Math.round(utilization*100)}%</b><span>utilized</span></div></div>
    </section>
    <div className="inventory-kpis">
      <div><small>Total capacity</small><b>{fmtNum(capacity)}</b><span>units</span></div>
      <div><small>Used + reserved</small><b>{fmtNum(used)}</b><span>units</span></div>
      <div><small>Free space</small><b style={{ color: status.tone }}>{fmtNum(Math.max(0,capacity-used))}</b><span>units</span></div>
      <div><small>Facilities</small><b>{warehouses.length}</b><span>in the network</span></div>
    </div>
    <section className="warehouse-strip">
      <div className="operating-heading"><div><small>NETWORK</small><h3>Your storage facilities</h3></div><span>{warehouses.length ? "Live capacity" : "No warehouse built"}</span></div>
      <div className="warehouse-cards">{warehouses.length ? warehouses.map((room:any) => <article key={room.id}><span>▦</span><div><b>{room.name}</b><small>{fmtNum(room.capacity)} unit capacity · Level {room.level ?? 1}</small></div></article>) : <article className="empty"><span>＋</span><div><b>Build a warehouse from the campus</b><small>Products cannot hold inventory until storage exists.</small></div></article>}</div>
    </section>

    <section className="operating-panel">
      <div className="operating-heading"><div><small>PRODUCT SUPPLY</small><h3>What needs an inventory decision?</h3></div><span>{active.length} current products</span></div>
      {active.length === 0 ? <div className="operating-empty"><img src="/assets/ui/actions/produce.png" alt=""/><b>No designed products yet</b><span>Design a product and its supply status will appear here.</span></div> : <div className="inventory-product-grid">{active.map((sku: any) => {
        const si = world.player.skus.indexOf(sku);
        const r = world.live?.skuResults?.[si];
        const salesQ = r?.units ?? 0;
        const salesDay = salesQ / 90;
        const inbound = sku.mfgBatchSize ?? 0;
        const daysCover = salesDay > 0 ? (sku.inventory + inbound) / salesDay : 999;
        const lostQ = r?.lostUnits ?? 0;
        const stockColor = lostQ > 1 || daysCover < 20 ? C.red : daysCover < 45 ? C.amber : C.green;
        const label = lostQ > 1 ? "Losing sales" : inbound > 0 ? "Batch inbound" : daysCover < 20 ? "Reorder now" : daysCover < 45 ? "Watch supply" : "Supply healthy";
        return <button className="inventory-product-card" key={sku.id} onClick={() => openProduct(sku.id)} style={{ "--stock-tone": stockColor } as React.CSSProperties}>
          <div className="inventory-product-art"><ProductVisualCard world={world} sku={sku} size={104} showLabels={false}/></div>
          <div className="inventory-product-copy"><span className="inventory-status">{label}</span><h4>{sku.name}</h4><p>{sku.status}{inbound > 0 ? ` · ${fmtNum(inbound)} units inbound` : ""}</p><div className="inventory-card-metrics"><span><small>On hand</small><b>{fmtNum(sku.inventory)}</b></span><span><small>Sales / day</small><b>{salesDay > 0 ? salesDay.toFixed(salesDay < 10 ? 1 : 0) : "—"}</b></span><span><small>Cover</small><b style={{color:stockColor}}>{daysCover >= 365 ? "365+ d" : `${Math.round(daysCover)} d`}</b></span><span><small>Lost / Q</small><b>{fmtNum(lostQ)}</b></span></div><strong>Open product <i>→</i></strong></div>
        </button>;
      })}</div>}
    </section>
  </div>;
}

function DistributionView({ world, openContract, removeContract, openProduct }: { world: any; openContract: () => void; removeContract: (i: number) => void; openProduct: (productId: string) => void }) {
  const [confirmEnd, setConfirmEnd] = useState<number | null>(null);
  const routedProducts = world.player.skus.filter((sku:any) => !sku.archived && (sku.releasedToMarket || sku.status === "active"));
  return (
    <div className="distribution-command">
      <section className="distribution-hero"><div><small>CHANNEL NETWORK</small><h2>Put each product where its customer shops</h2><p>Negotiate company relationships here. Assign the resulting channels to exact products inside their Operations workspace.</p></div><button onClick={openContract}><img src="/assets/ui/actions/campaign.png" alt=""/><span><b>Negotiate retailer</b><small>Compare reach, cut and payment terms</small></span><i>→</i></button></section>
      <section className="operating-panel">
        <div className="operating-heading"><div><small>RETAILER RELATIONSHIPS</small><h3>Your distribution partners</h3></div><span>{world.player.contracts.length} active</span></div>
        {world.player.contracts.length === 0 ? (
          <div className="operating-empty"><img src="/assets/ui/actions/campaign.png" alt=""/><b>No retailer relationships yet</b><span>Negotiate a partner before assigning channels to products.</span><button onClick={openContract}>Find a retailer</button></div>
        ) : <div className="partner-card-grid">{world.player.contracts.map((c: any, i: number) => {
          const assigned = world.player.skus.filter((sku:any) => (sku.assignedPartnerIds ?? []).includes(c.partnerId)).length;
          return <article key={i} className="partner-card"><div className="partner-mark">{(c.partnerName || c.type || "R").slice(0,1).toUpperCase()}</div><div className="partner-card-copy"><span>ACTIVE PARTNER</span><h4>{c.partnerName || c.type}</h4><div className="partner-metrics"><b>{(c.marginCut * 100).toFixed(0)}%<small>retailer cut</small></b><b>{c.paymentDays ?? 60}d<small>payment terms</small></b><b>{assigned}<small>products listed</small></b></div></div><button className="partner-more" aria-label={`End ${c.partnerName || c.type} contract`} onClick={() => setConfirmEnd(i)}>•••</button></article>;
        })}</div>}
      </section>

      {world.player.skus.some((sku: any) => !sku.archived) && <section className="operating-panel">
        <div className="operating-heading"><div><small>PRODUCT ROUTES</small><h3>Where each product is sold</h3></div><span>Open a product to change its channels</span></div>
        <div className="route-card-grid">{world.player.skus.filter((sku: any) => !sku.archived).map((sku: any) => {
          const partners = world.player.contracts.filter((c: any) => (sku.assignedPartnerIds ?? []).includes(c.partnerId));
          const mix = distributionMetricsForSku(world, sku);
          return <button className="route-card" key={sku.id} onClick={() => openProduct(sku.id)}><ProductVisualCard world={world} sku={sku} size={76} showLabels={false}/><span><b>{sku.name}</b><small>{partners.map((p:any)=>p.partnerName).join(" · ") || "No retailer assigned"}</small><em>{partners.length ? `${Math.round(mix.reach*100)}% effective reach · ${Math.round(mix.marginCut*100)}% blended cut` : "Channel decision required"}</em></span><i>→</i></button>;
        })}</div>
      </section>}
      {confirmEnd != null && <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-label="End retailer contract"><div className="confirm-card"><span className="confirm-icon">!</span><h3>End the contract with {world.player.contracts[confirmEnd]?.partnerName || world.player.contracts[confirmEnd]?.type}?</h3><p>Products using this retailer will immediately lose that route to market. Their sales may fall until you assign another channel.</p><div><button onClick={() => setConfirmEnd(null)}>Keep relationship</button><button className="danger" onClick={() => { removeContract(confirmEnd); setConfirmEnd(null); }}>End contract</button></div></div></div>}
    </div>
  );
}

function FinancialAnalysisView({ world, openProduct }: { world: any; openProduct: (productId:string) => void }) {
  const live = world.live;
  const rows = world.player.skus.map((sku:any,index:number) => ({ sku, result: live?.skuResults?.[index] })).sort((a:any,b:any) => (b.result?.margin ?? b.sku.contributionTotal ?? 0) - (a.result?.margin ?? a.sku.contributionTotal ?? 0));
  const revenue = rows.reduce((sum:number,row:any) => sum + (row.result?.revenue ?? 0), 0);
  const contribution = rows.reduce((sum:number,row:any) => sum + (row.result?.margin ?? 0), 0);
  const top = rows[0];
  const weak = [...rows].reverse().find((row:any) => (row.result?.margin ?? 0) < 0);
  return (
    <div className="analysis-command">
      <section className="analysis-hero"><div><small>PRODUCT ECONOMICS</small><h2>{weak ? `${weak.sku.name} needs a decision` : top ? `${top.sku.name} is leading the portfolio` : "Build the first commercial signal"}</h2><p>{weak ? "Negative contribution means each additional sale currently destroys value. Open the product to inspect price, channel cut, unit cost and positioning." : "Compare products by contribution, not only by revenue. A popular product can still be a poor business."}</p></div><div className="analysis-hero-score"><span>PORTFOLIO CONTRIBUTION</span><b className={contribution < 0 ? "negative" : "positive"}>{fmtMoney(contribution)}</b><small>{fmtMoney(revenue)} net revenue / quarter</small></div></section>
      {!live || !rows.length ? <section className="operating-panel"><div className="operating-empty"><img src="/assets/ui/actions/market-study.png" alt=""/><b>No commercial data yet</b><span>Launch a product and this screen will turn sales into decisions.</span></div></section> : <>
        <div className="analysis-kpis"><div><small>Net revenue / Q</small><b>{fmtMoney(revenue)}</b></div><div><small>Contribution / Q</small><b className={contribution < 0 ? "negative" : "positive"}>{fmtMoney(contribution)}</b></div><div><small>Products measured</small><b>{rows.length}</b></div><div><small>Profitable products</small><b>{rows.filter((row:any)=>(row.result?.margin ?? 0)>0).length}</b></div></div>
        <section className="operating-panel"><div className="operating-heading"><div><small>PORTFOLIO RANKING</small><h3>Which products create value?</h3></div><span>Current quarter run-rate</span></div><div className="analysis-product-grid">{rows.map(({sku,result}:any) => {
          const margin = result?.margin ?? 0; const units = result?.units ?? 0; const netRevenue = result?.revenue ?? 0; const rate = netRevenue > 0 ? margin/netRevenue : 0;
          return <button key={sku.id} className="analysis-product-card" onClick={() => openProduct(sku.id)}><ProductVisualCard world={world} sku={sku} size={92} showLabels={false}/><div><span style={{color:brandById(world,sku.brandId).color}}>{brandById(world,sku.brandId).name} · V{sku.version ?? 1}</span><h4>{sku.name}</h4><div className="analysis-row"><b>{fmtMoney(netRevenue)}<small>net revenue / Q</small></b><b>{fmtNum(units)}<small>units / Q</small></b><b className={margin < 0 ? "negative" : "positive"}>{fmtMoney(margin)}<small>contribution / Q</small></b><b className={rate < 0 ? "negative" : ""}>{(rate*100).toFixed(0)}%<small>contribution margin</small></b></div><em>{margin < 0 ? "Economics need intervention" : units <= 0 ? "Waiting for sales" : "Creating positive contribution"} <i>Open product →</i></em></div></button>;
        })}</div></section>
      </>}
    </div>
  );
}

function CampaignsView({ world, launchCampaign, openSegments, setMarketing, setBrandMarketing, setFocus }: { world: any; launchCampaign: (name: string, segmentId: string, agencyId: string, budget: number, days: number, scope?: "company" | "brand" | string) => void; openSegments: () => void; setMarketing: (v: number) => void; setBrandMarketing: (v: number) => void; setFocus: (v: string) => void }) {
  const segs = world.savedSegments;
  const hasMarketingTeam = teamEffectiveness(world, "marketing") > 0;
  const [campSeg, setCampSeg] = React.useState(segs[0]?.id ?? "");
  const [campAgency, setCampAgency] = React.useState("");
  const [campBudget, setCampBudget] = React.useState(100000);
  const [campDays, setCampDays] = React.useState(30);
  const [campScope, setCampScope] = React.useState("company");
  const selectedSeg = segs.find((s: any) => s.id === campSeg);
  const agency = MARKETING_AGENCIES.find((a: any) => a.id === campAgency);
  const effectiveCost = agency ? campBudget * agency.baseCostMult : campBudget;
  const affordable = effectiveCost <= world.player.cash;
  const segName = selectedSeg?.name;
  const scopeLabel = campScope === "company"
    ? world.company
    : campScope.startsWith("brand:")
      ? brandById(world, campScope.slice(6)).name
      : world.player.skus.find((s: any) => s.id === campScope)?.name ?? world.company;
  const rankedAgencies = MARKETING_AGENCIES.map((a: any) => {
    const fit = selectedSeg ? marketingAgencyFitForSegment(world, selectedSeg.filter, a) : 1;
    const rel = world.agencyRelationships?.[a.id] ?? 0;
    return { a, fit, rel, score: fit * a.effectivenessMult * (1 + rel * .05) };
  }).sort((x: any, y: any) => y.score - x.score);
  return (
    <div className="campaign-command">
      <section className="campaign-hero"><div><small>GROWTH STUDIO</small><h2>Turn a specific audience into demand</h2><p>Choose who should care, what you are promoting and the media partner most capable of reaching them. The forecast updates before you spend.</p></div><img src="/assets/ui/actions/campaign.png" alt=""/></section>
      {world.activeCampaigns?.length > 0 && (
        <section className="operating-panel"><div className="operating-heading"><div><small>LIVE CAMPAIGNS</small><h3>Currently in market</h3></div><span>{world.activeCampaigns.length} running</span></div><div className="active-campaign-grid">
          {world.activeCampaigns.map((c: any) => {
            const target = world.savedSegments.find((s: any) => s.id === c.segmentId)?.name ?? "Audience";
            const totalDays = c.durationDays ?? Math.max(c.daysRemaining,30); const progress = Math.max(0,Math.min(100,(1-c.daysRemaining/Math.max(1,totalDays))*100));
            return <article key={c.id}><span className="active-campaign-icon">↗</span><div><b>{c.name}</b><small>{target} · {c.daysRemaining} days left</small><em><i style={{width:`${progress}%`}}/></em></div><strong>{fmtMoney(c.budget)}</strong></article>;
          })}
        </div></section>
      )}

      <section className="operating-panel campaign-builder"><div className="operating-heading"><div><small>CAMPAIGN BUILDER</small><h3>Build the commercial plan</h3></div><span>4 decisions</span></div>
        <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>Choose the audience first. The game then tells you which agency/media approach fits that audience instead of asking you to guess from vague copy.</div>
        {!hasMarketingTeam && <div style={{marginBottom:12,padding:9,border:"1px solid #fed7aa",background:"#fff7ed",borderRadius:8,color:C.amber,fontSize:10.5,fontWeight:700}}>! Marketing is locked until a Marketing specialist is seated in an office.</div>}

        <div style={campaignStep}><div style={campaignStepTitle}>1. TARGET AUDIENCE</div>
          {segs.length === 0 ? <div style={{ color: C.faint, fontSize: 12 }}>You have no saved audiences yet. <button style={{ ...ctrlBtn, marginLeft: 6 }} onClick={openSegments}>Create a segment</button></div> : <><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{segs.map((s: any) => <button key={s.id} onClick={() => { setCampSeg(s.id); setCampAgency(""); }} style={{ ...ctrlBtn, background: campSeg === s.id ? C.cyan : C.panel2, color: campSeg === s.id ? "#fff" : C.dim, borderColor: campSeg === s.id ? C.cyan : C.line }}>{s.name}</button>)}</div><button style={{ ...ctrlBtn, marginTop: 7 }} onClick={openSegments}>＋ Create / edit segments</button></>}
        </div>

        <div style={campaignStep}><div style={campaignStepTitle}>2. WHAT ARE YOU PROMOTING?</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button onClick={() => setCampScope("company")} style={{ ...ctrlBtn, background: campScope === "company" ? C.violet : C.panel2, color: campScope === "company" ? "#fff" : C.dim }}>🏢 {world.company}</button>
            {world.brands.map((b: any) => { const scope = `brand:${b.id}`; return <button key={b.id} onClick={() => setCampScope(scope)} style={{ ...ctrlBtn, background: campScope === scope ? b.color : C.panel2, color: campScope === scope ? "#fff" : C.dim }}>🏷 {b.name}</button>; })}
            {world.player.skus.filter((s: any) => !s.archived && (s.releasedToMarket || s.status === "active")).map((s: any) => <button key={s.id} onClick={() => setCampScope(s.id)} style={{ ...ctrlBtn, background: campScope === s.id ? C.violet : C.panel2, color: campScope === s.id ? "#fff" : C.dim }}>📦 {s.name}</button>)}
          </div>
        </div>

        <div style={campaignStep}><div style={campaignStepTitle}>3. MEDIA / AGENCY FIT FOR {segName?.toUpperCase() ?? "YOUR TARGET"}</div>
          {!selectedSeg ? <div style={{ color: C.faint, fontSize: 12 }}>Choose a target audience first.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 8 }}>
            {rankedAgencies.map(({a, fit, rel}: any) => {
              const on = campAgency === a.id; const stars = agencyFitStars(fit); const fitLabel = agencyFitLabel(fit);
              return <button className="agency-card" aria-pressed={on} key={a.id} onClick={() => setCampAgency(a.id)} style={{ textAlign: "left", background: on ? "#f2fbff" : C.bg, border: `1px solid ${on ? C.cyan : C.line}`, borderRadius: 10, padding: 12, cursor: "pointer", color: C.ink }}>
                <span className="agency-mark">{a.name.slice(0,2).toUpperCase()}</span><div><div style={{ display: "flex", justifyContent: "space-between", gap: 7 }}><b style={{ fontSize: 14 }}>{a.name}</b><span style={{ color: stars >= 4 ? C.green : stars <= 2 ? C.red : C.amber, fontSize: 12, fontWeight: 900 }}>{"★".repeat(stars)}{"☆".repeat(5-stars)}</span></div>
                <div style={{ color: C.dim, fontSize: 10.5, marginTop: 3 }}>{a.specialization}</div>
                <div style={{ color: stars >= 4 ? C.green : stars <= 2 ? C.red : C.amber, fontSize: 10, fontWeight: 800, marginTop: 5 }}>{fitLabel}</div>
                <div style={{ color: C.faint, fontSize: 9.5, marginTop: 5 }}>Cost ×{a.baseCostMult.toFixed(1)} · execution ×{a.effectivenessMult.toFixed(1)} · relationship {rel}</div></div>
              </button>;
            })}
          </div>}
        </div>

        <div style={campaignStep}><div style={campaignStepTitle}>4. BUDGET & DURATION</div>
          <Slider label="Budget" min={20000} max={500000} step={10000} value={campBudget} fmt={fmtMoney} onChange={setCampBudget} />
          <SelectInput label="Duration" value={String(campDays)} onChange={(v) => setCampDays(Number(v))}><option value="14">2 weeks</option><option value="30">1 month</option><option value="60">2 months</option><option value="90">1 quarter</option></SelectInput>
          {agency && <div style={{ fontSize: 11, color: affordable ? C.dim : C.red, marginTop: 4 }}>Actual cost: {fmtMoney(effectiveCost)} · {agencyFitLabel(marketingAgencyFitForSegment(world, selectedSeg?.filter ?? {}, agency))}</div>}
        </div>

        <button title={!hasMarketingTeam ? "Seat a Marketing specialist first." : !campSeg ? "Choose a target audience first." : !campAgency ? "Choose a media/agency partner first." : !affordable ? `Need ${fmtMoney(Math.max(0, effectiveCost - world.player.cash))} more cash.` : undefined} style={{ ...bigBtn, width: "100%", marginTop: 12, opacity: hasMarketingTeam && campSeg && campAgency && affordable ? 1 : 0.5 }} disabled={!hasMarketingTeam || !campSeg || !campAgency || !affordable} onClick={() => launchCampaign(`${agency?.name ?? "?"} → ${scopeLabel} → ${segName ?? "all"}`, campSeg, campAgency, campBudget, campDays, campScope)}>Launch campaign</button>
        {(!hasMarketingTeam || !campSeg || !campAgency || !affordable) && <div style={{ color: C.amber, fontSize: 10, marginTop: 5 }}>↳ {!hasMarketingTeam ? "Hire and seat a Marketing specialist." : !campSeg ? "Choose a target audience." : !campAgency ? "Choose a media / agency partner." : `Campaign cash shortfall: ${fmtMoney(Math.max(0, effectiveCost - world.player.cash))}.`}</div>}
      </section>

      <section className="operating-panel"><div className="operating-heading"><div><small>ALWAYS-ON MARKETING</small><h3>Maintain demand between launches</h3></div><span>Optional quarterly spend</span></div>
        <div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>Optional background spend between campaigns. Audience and spend are managed here so Segments stays purely about defining customer groups.</div>
        <div style={{ marginBottom: 11 }}><div style={campaignStepTitle}>ALWAYS-ON TARGET</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}><button onClick={() => setFocus("all")} style={{ ...ctrlBtn, background: world.player.marketingFocus === "all" ? C.cyan : C.panel2, color: world.player.marketingFocus === "all" ? "#fff" : C.dim }}>All customers</button>{segs.map((s: any) => { const key = `seg:${s.id}`; const on = world.player.marketingFocus === key; return <button key={s.id} onClick={() => setFocus(key)} style={{ ...ctrlBtn, background: on ? C.cyan : C.panel2, color: on ? "#fff" : C.dim }}>{s.name}</button>; })}<button style={{ ...ctrlBtn }} onClick={openSegments}>＋ Audience</button></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          <AlwaysOnPresets label="Performance / Q" value={world.player.marketingTarget} onChange={setMarketing} disabled={!hasMarketingTeam} />
          <AlwaysOnPresets label="Brand / Q" value={world.player.brandMarketingTarget} onChange={setBrandMarketing} disabled={!hasMarketingTeam} />
        </div>
      </section>
    </div>
  );
}

function AlwaysOnPresets({ label, value, onChange, disabled=false }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const options = [0, 50_000, 150_000, 300_000];
  return <div><div style={{ color: C.faint, fontSize: 9.5, fontWeight: 900, marginBottom: 6 }}>{label}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5 }}>{options.map((v) => <button key={v} disabled={disabled && v>0} title={disabled && v>0 ? "Seat a Marketing specialist first." : undefined} onClick={() => onChange(v)} style={{ ...ctrlBtn, borderColor: value === v ? C.violet : C.line, color: value === v ? C.violet : C.dim, opacity: disabled && v>0 ? .45 : 1 }}>{v === 0 ? "Off" : fmtMoney(v)}</button>)}</div></div>;
}

const campaignStep: React.CSSProperties = { borderTop: `1px solid ${C.line}`, paddingTop: 11, marginTop: 11 };
const campaignStepTitle: React.CSSProperties = { color: C.faint, fontSize: 9.5, fontWeight: 900, letterSpacing: .7, marginBottom: 7 };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tycoon-shell" style={{ minHeight: "100vh", background: C.bg, color: C.ink }}>
      <style>{`
        :root{color-scheme:light;}
        input[type=range]{height:5px;accent-color:${C.cyan};}
        ::selection{background:${C.cyan};color:#fff;}
        *{font-family:'Trebuchet MS','Segoe UI',sans-serif;box-sizing:border-box;}
        html{background:${C.bg};}
        body{margin:0;background:${C.bg};}
        body::-webkit-scrollbar{width:11px}body::-webkit-scrollbar-track{background:#dfe8f1}body::-webkit-scrollbar-thumb{background:#9db2c5;border-radius:99px;border:3px solid #dfe8f1}
        button{transition:filter .16s,transform .14s cubic-bezier(.2,.8,.2,1),background .16s,border-color .16s,box-shadow .16s;}
        button:not(:disabled):hover{filter:brightness(1.035) saturate(1.05);transform:translateY(-1px);}button:not(:disabled):active{transform:translateY(1px) scale(.975);filter:brightness(.98)}button:focus-visible{outline:3px solid rgba(37,158,234,.34);outline-offset:2px}button:disabled{cursor:not-allowed!important}.game-panel{transition:box-shadow .2s,border-color .2s,transform .2s}.game-panel:hover{border-color:#bfd2e2!important;box-shadow:0 12px 30px rgba(23,62,92,.09)!important}.choice-card:not(:disabled):hover{border-color:#8dc8eb!important;box-shadow:0 9px 22px rgba(22,110,170,.10)!important}.game-icon{transition:transform .2s cubic-bezier(.2,.9,.25,1),filter .2s}.game-icon.active{animation:iconBreath 2.5s ease-in-out infinite}.game-icon:hover{transform:rotate(-3deg) scale(1.06)}@keyframes iconBreath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.16) saturate(1.15)}}
        .tycoon-shell{background:radial-gradient(circle at 50% -180px,#d8e9f0 0,#edf3f5 38%,#eaf0f4 100%)!important;}

        .game-hud{position:sticky;top:0;z-index:40;min-height:72px;background:linear-gradient(180deg,#10395f 0%,#0b2948 100%);border-bottom:1px solid #061b31;display:flex;align-items:center;gap:10px;padding:8px 16px;box-shadow:0 5px 20px rgba(4,25,46,.24),inset 0 1px 0 rgba(255,255,255,.11)}
        .company-mark{display:flex;align-items:center;gap:10px;background:transparent;border:0;color:#fff;padding:4px 10px 4px 3px;cursor:pointer;text-align:left;min-width:205px;border-right:1px solid rgba(255,255,255,.14)}
        .company-mark span:last-child{display:grid}.company-mark b{font-size:14px;line-height:1.05;letter-spacing:.1px}.company-mark small{color:#a8c8e3;font-size:9px;margin-top:3px;text-transform:uppercase;letter-spacing:.7px;font-weight:750}.company-gem{width:39px;height:39px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(145deg,#5fc7ff,#247fca);border:1px solid rgba(255,255,255,.32);box-shadow:0 4px 11px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.32);font-size:19px!important;color:white!important}
        .hud-metrics{display:flex;gap:6px;align-items:center;flex:1;min-width:0}.hud-metric{position:relative;min-width:108px;min-height:48px;padding:6px 10px 5px 35px;border:1px solid rgba(135,196,235,.18);background:linear-gradient(180deg,rgba(13,49,81,.9),rgba(7,35,62,.9));border-radius:10px;display:grid;align-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.hud-metric .metric-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);width:19px;height:19px;border-radius:6px;display:grid;place-items:center;background:rgba(94,197,255,.13);color:#72d2ff;font-size:11px;font-weight:900}.hud-metric small{text-transform:uppercase;letter-spacing:.65px;color:#8db5d3;font-size:7.8px;font-weight:800}.hud-metric b{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.1;margin-top:2px;color:#fff}.hud-metric.good b{color:#73e0ad}.hud-metric.bad b{color:#ff8a92}.hud-metric em{font-style:normal;color:#75d0ff;font-size:8px;font-weight:800;margin-left:4px}
        .hud-controls{display:flex;align-items:center;gap:5px}.hud-controls button{background:linear-gradient(180deg,#17466f,#0e3558)!important;color:#ddecf7!important;border:1px solid rgba(146,197,232,.22)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important}.hud-controls button:hover{border-color:#59bdf5!important}.game-date{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#eaf7ff;background:#071e36;border:1px solid rgba(120,190,232,.22);border-radius:9px;padding:8px 9px;box-shadow:inset 0 1px 2px rgba(0,0,0,.16)}.difficulty-pill{text-transform:uppercase;color:#a9c7dc;font-size:8px;font-weight:850;letter-spacing:.6px;border:1px solid rgba(135,196,235,.22);background:rgba(5,25,45,.25);border-radius:99px;padding:5px 8px}.confidence{font-size:9px;font-weight:800;padding:4px 6px;border-radius:7px;background:rgba(255,255,255,.06)}.confidence.low{color:#ff8a92}.confidence.mid{color:#ffd17a}.confidence.high{color:#77e5b3}

        .event-banner{margin:10px max(16px,3vw) 0;background:linear-gradient(180deg,#fff8df,#fff2c0);border:1px solid #efce74;border-radius:11px;padding:10px 13px;display:flex;justify-content:space-between;gap:12px;align-items:center;color:#6b4a03;font-size:12px;font-weight:750;box-shadow:0 4px 14px rgba(119,84,8,.08)}
        .screen-heading{max-width:1280px;margin:0 auto;padding:24px 24px 10px;display:flex;justify-content:space-between;gap:20px;align-items:end}.screen-eyebrow{text-transform:uppercase;letter-spacing:1.15px;font-size:8.5px;color:${C.cyan};font-weight:900}.screen-heading h1{font-size:27px;line-height:1.05;margin:5px 0 6px;letter-spacing:-.6px}.screen-heading p{margin:0;color:${C.dim};font-size:12.5px;max-width:720px;line-height:1.5}.campus-return{background:linear-gradient(180deg,#fff,#f3f8fc);border:1px solid ${C.line};color:${C.navy2};border-radius:10px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 3px 10px rgba(19,53,84,.06)}
        .section-tabs{max-width:1280px;margin:0 auto;padding:2px 24px 7px;display:flex;gap:5px;overflow-x:auto;scrollbar-width:none}.section-tabs::-webkit-scrollbar{display:none}.section-tabs button{border:1px solid ${C.line};background:rgba(255,255,255,.82);color:${C.dim};border-radius:9px;padding:7px 11px;font-size:10.5px;font-weight:750;cursor:pointer;white-space:nowrap;box-shadow:0 1px 3px rgba(19,53,84,.025)}.section-tabs button.active{background:linear-gradient(180deg,#1f96df,#147dc5);border-color:#0f71b4;color:#fff;box-shadow:0 4px 12px rgba(22,141,226,.20)}
        .game-content{max-width:1280px;margin:0 auto;padding:10px 24px 116px}.game-content.campus-content{max-width:1510px;padding-top:12px}
        .play-surface{height:100vh;overflow:hidden;position:relative;background:#d9e3e2}.campus-world{position:absolute;left:86px;right:0;top:72px;bottom:0;overflow:hidden}
        .left-rail{position:fixed;z-index:45;left:14px;top:92px;display:grid;gap:6px;padding:6px;background:linear-gradient(180deg,rgba(14,55,92,.96),rgba(7,34,61,.97));border:1px solid rgba(150,207,244,.24);border-radius:14px;box-shadow:0 12px 32px rgba(5,30,54,.26)}.left-rail button{position:relative;width:62px;min-height:58px;border:1px solid transparent;background:transparent;color:#b6cede;border-radius:11px;display:grid;place-items:center;align-content:center;gap:4px;cursor:pointer}.left-rail button>span{font-size:17px}.left-rail button small{font-size:7.5px;font-weight:850}.left-rail button i{position:absolute;right:2px;top:2px;background:linear-gradient(145deg,#fb7185,#dc2626);color:#fff;border-radius:99px;min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;font-style:normal;font-size:8px;font-weight:900;box-shadow:0 3px 8px rgba(220,38,38,.4)}.left-rail button:hover{background:rgba(255,255,255,.075);color:#fff}.left-rail button.active{background:linear-gradient(145deg,rgba(37,158,234,.34),rgba(124,58,237,.32));border-color:rgba(116,204,255,.58);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 6px 16px rgba(0,0,0,.18)}
        .task-pill{border:1px solid rgba(119,208,255,.36);background:rgba(24,105,163,.24);color:#e9f7ff;border-radius:10px;padding:5px 8px;display:grid;grid-template-columns:auto auto;column-gap:5px;row-gap:0;align-items:center;cursor:pointer;min-width:125px;text-align:left}.task-pill span{grid-row:1/3;font-size:15px}.task-pill b{font-size:8.5px;line-height:1.1}.task-pill em{font-style:normal;color:#9fd4f2;font-size:7.8px;line-height:1.1}.task-pill:hover{background:rgba(31,135,205,.38)}
        .screen-overlay{position:fixed;z-index:70;inset:72px 0 0 0;background:rgba(5,24,42,.25);backdrop-filter:blur(3px);display:flex;justify-content:flex-end;padding:14px;animation:softFade .18s ease-out}.overlay-card{width:min(1050px,calc(100vw - 105px));height:calc(100vh - 100px);background:#f4f8fc;border:1px solid #b9cfdf;border-radius:17px;box-shadow:0 24px 65px rgba(4,25,46,.30);display:flex;flex-direction:column;overflow:hidden;animation:overlaySlide .26s cubic-bezier(.2,.9,.25,1)}.overlay-head{background:linear-gradient(180deg,#fff,#fafdff);padding:15px 18px 12px;border-bottom:1px solid ${C.line};display:flex;justify-content:space-between;gap:16px;align-items:start}.overlay-head h1{margin:3px 0 4px;font-size:23px}.overlay-head p{margin:0;color:${C.dim};font-size:11.5px;max-width:700px}.overlay-close{border:1px solid ${C.line};background:${C.panel2};color:${C.navy};border-radius:9px;width:34px;height:34px;cursor:pointer;font-weight:900}.overlay-tabs{display:flex;gap:6px;padding:8px 14px;background:linear-gradient(180deg,#eef4f9,#e8f0f6);border-bottom:1px solid ${C.line};overflow-x:auto}.overlay-tabs button{border:1px solid ${C.line};background:white;color:${C.dim};border-radius:10px;padding:5px 10px 5px 6px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer;display:flex;align-items:center;gap:7px}.overlay-tabs button.active{background:linear-gradient(135deg,#263f75,#4e3b99);border-color:#695bc2;color:white;box-shadow:0 5px 14px rgba(56,51,128,.22)}.overlay-body{padding:14px 16px 24px;overflow-y:auto;flex:1}.event-toast{position:fixed;z-index:80;left:88px;bottom:18px;max-width:min(650px,calc(100vw - 120px));background:linear-gradient(135deg,#fff8df,#ffedaf);border:1px solid #eacb6b;color:#6b4a03;border-radius:13px;padding:10px 11px;display:flex;gap:9px;align-items:center;box-shadow:0 14px 34px rgba(86,59,3,.20);font-size:11px;font-weight:700;animation:toastIn .34s cubic-bezier(.2,.9,.25,1)}.event-toast.closing{animation:toastOut .22s ease-in forwards}.event-toast.achievement{background:linear-gradient(135deg,#201751,#4a2f91 62%,#a33f91);border-color:#c4a4ff;color:#fff;animation:achievementPop .35s cubic-bezier(.2,.9,.25,1)}.event-toast.achievement.closing{animation:toastOut .22s ease-in forwards}.event-toast-icon{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);font-size:15px}.event-toast button{border:0;background:transparent;color:inherit;cursor:pointer;font-weight:900;margin-left:auto}@keyframes achievementPop{from{opacity:0;transform:translateY(12px) scale(.94)}to{opacity:1;transform:none}}@keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}@keyframes toastOut{to{opacity:0;transform:translateY(10px) scale(.96)}}@keyframes overlaySlide{from{opacity:0;transform:translateX(28px) scale(.985)}to{opacity:1;transform:none}}@keyframes softFade{from{opacity:0}to{opacity:1}}
        .decision-backdrop{position:fixed;z-index:220;inset:0;background:rgba(3,16,30,.78);backdrop-filter:blur(9px);display:grid;place-items:center;padding:18px;animation:momentFade .2s ease-out}.decision-modal{width:min(720px,97vw);max-height:94vh;overflow:auto;background:linear-gradient(155deg,#fff,#eef7fd);border:1px solid #7ebde4;border-radius:24px;padding:24px;box-shadow:0 35px 100px rgba(0,12,25,.55);animation:momentRise .3s cubic-bezier(.2,.9,.25,1)}.decision-kicker{color:${C.cyan};font-size:9px;font-weight:950;letter-spacing:1.25px}.decision-modal h1{font-size:30px;letter-spacing:-.7px;margin:5px 0}.decision-lead{font-size:14px;line-height:1.55;color:${C.dim};margin:0}.decision-context{margin-top:13px;padding:11px 13px;border-radius:10px;background:#dff1fb;border:1px solid #b7daed;color:#315c77;font-size:11.5px;line-height:1.5}.decision-choices{display:grid;gap:8px;margin-top:14px}.decision-choices button{text-align:left;border:1px solid ${C.line};border-radius:12px;background:white;color:${C.ink};padding:13px;display:grid;grid-template-columns:24px 1fr;gap:5px;cursor:pointer;box-shadow:0 4px 12px rgba(15,52,82,.05)}.decision-choices button:hover{border-color:#6db9e7;box-shadow:0 8px 20px rgba(20,112,170,.11);transform:translateY(-1px)}.choice-arrow{font-size:18px;color:${C.cyan};font-weight:900}.decision-choices b{font-size:14px}.decision-choices p{margin:3px 0 7px;color:${C.dim};font-size:11.5px}.decision-choices small{display:block;color:${C.green};font-size:10.5px;line-height:1.4}.decision-choices small.later{color:#9b6a12;margin-top:3px}.decision-footer{color:${C.faint};font-size:9.5px;text-align:center;margin-top:14px}.legacy-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;border-radius:15px;padding:18px;color:white;background:linear-gradient(135deg,#19234d,#394c9b 58%,#237da5)}.legacy-hero small,.legacy-score small{color:#9edcff;font-size:8px;font-weight:900;letter-spacing:1px}.legacy-hero h2{margin:4px 0;font-size:22px}.legacy-hero p{margin:0;color:#ccdef2;font-size:11.5px}.legacy-score{text-align:right;min-width:150px}.legacy-score b{display:block;font:900 28px ui-monospace,monospace}.legacy-score span{font-size:9px;color:#c7dbec}.scenario-objectives{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.scenario-objectives>div{display:grid;grid-template-columns:24px 1fr;gap:5px;padding:11px;border:1px solid ${C.line};border-radius:10px;background:white}.scenario-objectives>div.done{border-color:#8ed8b7;background:#f1fff8}.scenario-objectives>div>span{font-weight:900;color:${C.faint}}.scenario-objectives .done>span{color:${C.green}}.scenario-objectives b{font-size:11px}.scenario-objectives p{font-size:9.5px;color:${C.dim};margin:3px 0 0}.achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.achievement-grid article{position:relative;display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:11px;border:1px solid ${C.line};border-radius:11px;background:white}.achievement-grid article.locked{filter:saturate(.45);opacity:.7}.achievement-grid article.unlocked{border-color:#dfbd63;background:linear-gradient(135deg,#fffdf5,#fff6cf)}.achievement-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:${C.panel2};font-size:20px}.achievement-grid b{font-size:11px}.achievement-grid p{font-size:9.5px;color:${C.dim};margin:2px 0 6px}.achievement-grid em,.outcome-grid em{position:absolute;right:7px;top:6px;font-style:normal;color:#a16b00;font-size:7px;font-weight:950}.achievement-progress{height:4px;background:${C.grid};border-radius:9px;overflow:hidden}.achievement-progress i{display:block;height:100%;background:linear-gradient(90deg,${C.cyan},${C.violet})}.outcome-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.outcome-grid article{position:relative;display:grid;grid-template-columns:30px 1fr;gap:7px;padding:11px;border:1px solid ${C.line};border-radius:10px;background:#f7f9fb;opacity:.68}.outcome-grid article.reached{opacity:1;border-color:#9f8ee8;background:#f4f0ff}.outcome-grid article>span{font-size:20px}.outcome-grid b{font-size:10.5px}.outcome-grid p{font-size:9px;color:${C.dim};margin:3px 0}.decision-history{display:grid;gap:7px}.decision-history article{display:grid;grid-template-columns:62px 1fr;gap:10px;padding:10px;background:white;border:1px solid ${C.line};border-radius:9px}.decision-history>article>span{color:${C.faint};font-size:9px}.decision-history b{font-size:11px}.decision-history p{color:${C.dim};font-size:9.5px;margin:3px 0 0}
        .product-moment-backdrop{position:fixed;z-index:180;inset:0;background:rgba(4,18,33,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px;animation:momentFade .22s ease-out}.product-moment-card{--moment:${C.cyan};position:relative;width:min(570px,96vw);overflow:hidden;border-radius:24px;padding:22px;background:linear-gradient(150deg,#fff 0%,#f6fbff 100%);border:1px solid color-mix(in srgb,var(--moment) 42%,white);box-shadow:0 30px 90px rgba(1,17,32,.46);animation:momentRise .32s cubic-bezier(.2,.9,.25,1) both}.product-moment-glow{position:absolute;width:300px;height:300px;right:-105px;top:-145px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--moment) 24%,transparent),transparent 69%);pointer-events:none}.product-moment-top{position:relative;display:flex;align-items:center;gap:8px;color:var(--moment);font-size:9px;font-weight:950;letter-spacing:1px}.product-moment-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:color-mix(in srgb,var(--moment) 14%,white);font-size:16px}.product-moment-hero{position:relative;display:grid;place-items:center;margin:10px 0 -2px;filter:drop-shadow(0 13px 18px rgba(16,54,84,.16));animation:momentHero .55s .08s cubic-bezier(.2,.9,.25,1) both}.product-moment-copy{position:relative;text-align:center}.product-moment-copy h2{margin:0;color:${C.ink};font-size:24px;line-height:1.12;letter-spacing:-.5px}.product-moment-copy p{max-width:460px;margin:8px auto 0;color:${C.dim};font-size:12px;line-height:1.55}.product-moment-metrics{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:16px}.product-moment-metrics>div{padding:9px 8px;border:1px solid ${C.line};border-radius:10px;background:rgba(255,255,255,.78);text-align:center}.product-moment-metrics small{display:block;color:${C.faint};font-size:7.5px;text-transform:uppercase;font-weight:900;letter-spacing:.45px;line-height:1.2}.product-moment-metrics b{display:block;margin-top:4px;color:${C.ink};font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.25}.product-moment-actions{position:relative;display:flex;justify-content:flex-end;gap:8px;margin-top:17px}.product-moment-actions button{min-height:42px}@keyframes momentFade{from{opacity:0}to{opacity:1}}@keyframes momentRise{from{opacity:0;transform:translateY(15px) scale(.97)}to{opacity:1;transform:none}}@keyframes momentHero{from{opacity:0;transform:translateY(15px) scale(.9)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.product-moment-backdrop,.product-moment-card,.product-moment-hero{animation:none!important}}

        /* v1.8 premium motion, reveal and data-visualization layer */
        .product-moment-glow{animation:momentGlow 3.6s ease-in-out infinite}.product-moment-icon{box-shadow:0 5px 16px color-mix(in srgb,var(--moment) 24%,transparent);animation:momentIcon 2.3s ease-in-out infinite}.product-moment-backdrop.closing{animation:momentCloseBackdrop .23s ease-in forwards}.product-moment-backdrop.closing .product-moment-card{animation:momentCloseCard .23s ease-in forwards}.product-reveal-stage{appearance:none;position:relative;width:100%;height:230px;border:0;background:transparent;display:grid;place-items:center;perspective:950px;cursor:pointer}.product-reveal-stage em{position:absolute;bottom:0;font-style:normal;font-size:8px;font-weight:900;letter-spacing:1.1px;color:var(--moment);text-transform:uppercase}.product-reveal-card{position:relative;width:170px;height:210px;transform-style:preserve-3d;filter:drop-shadow(0 18px 21px rgba(11,35,59,.26))}.product-reveal-front,.product-reveal-back{position:absolute;inset:0;display:grid;place-items:center;border-radius:24px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}.product-reveal-front{transform:rotateY(180deg);background:linear-gradient(145deg,#fff,#edf7ff);border:1px solid color-mix(in srgb,var(--moment) 48%,white)}.product-reveal-back{background:repeating-linear-gradient(135deg,rgba(255,255,255,.06) 0 8px,transparent 8px 16px),linear-gradient(145deg,#0d3153,#251b62 64%,#71328a);border:1px solid rgba(165,219,255,.42);color:white;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}.product-reveal-back:after{content:'';position:absolute;inset:12px;border:1px solid rgba(255,255,255,.2);border-radius:17px}.product-reveal-back>i{font:950 39px/1 ui-monospace,monospace;letter-spacing:-4px;text-shadow:0 7px 18px rgba(0,0,0,.28)}.product-reveal-back b{position:absolute;bottom:32px;font-size:9px;letter-spacing:1.25px}.product-reveal-back small{position:absolute;bottom:18px;color:#a9ddf7;font-size:7px}.product-reveal-stage.is-spinning .product-reveal-card{animation:cardMysterySpin 1.12s cubic-bezier(.22,.72,.18,1) both}.product-reveal-stage.is-revealed .product-reveal-card{transform:rotateY(900deg);transition:transform .72s cubic-bezier(.18,.82,.18,1)}.product-moment-card.awaiting-reveal .product-reveal-copy{opacity:.2;filter:blur(3px);transform:translateY(8px);pointer-events:none}.product-reveal-copy{transition:opacity .28s,filter .28s,transform .28s}.product-moment-card.revealed .product-reveal-copy{animation:revealCopy .42s .28s cubic-bezier(.2,.9,.25,1) both}
        .decision-backdrop.resolving .decision-modal{animation:decisionResolve .36s cubic-bezier(.2,.8,.2,1) forwards}.decision-choices button.chosen{border-color:#27ae73!important;background:linear-gradient(135deg,#effff7,#dff8ec)!important;box-shadow:0 0 0 2px rgba(39,174,115,.16),0 12px 27px rgba(22,112,73,.16)!important;transform:translateY(-2px) scale(1.01)!important}.decision-choices button.not-chosen{opacity:.38;transform:scale(.985);filter:saturate(.45)}
        .market-visual-dashboard{position:relative;overflow:hidden;margin-bottom:14px;padding:18px;border-radius:18px;color:white;background:radial-gradient(circle at 92% 0,rgba(210,83,241,.34),transparent 32%),radial-gradient(circle at 4% 100%,rgba(24,196,219,.23),transparent 34%),linear-gradient(135deg,#0a2d4c,#173f70 55%,#35236e);border:1px solid rgba(145,205,244,.27);box-shadow:0 18px 42px rgba(7,35,66,.22),inset 0 1px 0 rgba(255,255,255,.1)}.market-visual-dashboard:before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.05) 50%,transparent 65%);transform:translateX(-100%);animation:dashboardSheen 9s ease-in-out infinite;pointer-events:none}.market-visual-head{position:relative;display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-bottom:13px}.market-visual-head>div:first-child>span{display:block;color:#7ee8ff;font-size:8px;font-weight:950;letter-spacing:1.2px}.market-visual-head h2{font-size:23px;letter-spacing:-.4px;margin:4px 0 3px}.market-visual-head p{color:#bed6e9;font-size:10.5px;line-height:1.45;margin:0}.market-window-pills{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.market-window-pills>div{min-width:72px;padding:7px 9px!important;background:rgba(5,24,45,.43)!important;border-color:rgba(156,215,251,.2)!important}.market-visual-grid{position:relative;display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.25fr);gap:10px}.market-visual-grid>article{min-width:0;padding:13px;border-radius:13px;background:linear-gradient(160deg,rgba(255,255,255,.13),rgba(255,255,255,.055));border:1px solid rgba(172,218,248,.17);box-shadow:inset 0 1px 0 rgba(255,255,255,.07);backdrop-filter:blur(5px);transition:transform .2s,border-color .2s,background .2s}.market-visual-grid>article:hover{transform:translateY(-2px);border-color:rgba(132,222,255,.43);background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.07))}.market-revenue-card{grid-column:1/-1}.visual-card-title{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:9px}.visual-card-title small{display:block;color:#84cee9;font-size:7.5px;font-weight:900;letter-spacing:.7px}.visual-card-title b{display:block;margin-top:2px;font-size:12px}.visual-card-title>span{border:1px solid rgba(109,226,173,.34);border-radius:99px;padding:3px 6px;color:#7ce6ad;background:rgba(12,78,67,.36);font-size:7px;font-weight:900;letter-spacing:.5px}.market-donut-layout{display:flex;align-items:center;gap:12px}.market-rank-list{display:grid;gap:4px;flex:1;min-width:0}.market-rank-list>div{display:grid;grid-template-columns:25px 7px minmax(0,1fr) auto;gap:6px;align-items:center;padding:4px 6px;border-radius:7px;background:rgba(3,22,41,.22);font-size:8.5px}.market-rank-list>div.player{background:linear-gradient(90deg,rgba(124,58,237,.43),rgba(29,147,208,.22));box-shadow:inset 2px 0 #c8b5ff}.market-rank-list .rank{color:#8fb7d3}.market-rank-list .swatch{width:7px;height:7px;border-radius:99px;box-shadow:0 0 8px currentColor}.market-rank-list .name{display:flex;align-items:center;gap:5px;min-width:0}.market-rank-list .name b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.market-rank-list strong{font:800 8.5px ui-monospace,monospace}.chart-legend{display:flex;gap:10px;flex-wrap:wrap;margin:2px 0 6px;color:#c8dbea;font-size:8px}.chart-legend span{display:flex;align-items:center;gap:4px}.chart-legend i{display:block;width:12px;height:3px;border-radius:4px}.market-visual-grid article>p{color:#9dbed6;font-size:8px;line-height:1.4;margin:5px 0 0}.game-line-chart{overflow:visible}.chart-line-path{stroke-dasharray:1200;animation:chartDraw 1.1s cubic-bezier(.2,.8,.2,1) both}.chart-pulse-dot{transform-origin:center;animation:chartPulse 2s ease-in-out infinite}.donut-chart{filter:drop-shadow(0 12px 17px rgba(0,0,0,.2));animation:donutIn .7s cubic-bezier(.2,.9,.25,1) both}
        .campus-work-stack{position:absolute;z-index:8;right:14px;bottom:14px;width:min(320px,calc(100% - 28px));padding:9px;border-radius:15px;background:linear-gradient(160deg,rgba(9,38,65,.94),rgba(23,36,80,.94));border:1px solid rgba(138,207,248,.31);box-shadow:0 18px 42px rgba(2,20,38,.35),inset 0 1px 0 rgba(255,255,255,.11);backdrop-filter:blur(11px);animation:workStackIn .42s cubic-bezier(.2,.9,.25,1) both}.campus-work-title{display:flex;justify-content:space-between;align-items:center;padding:2px 3px 7px;color:#8fc9e7;font-size:7.5px;font-weight:950;letter-spacing:.9px}.campus-work-title b{color:#70e2ac;letter-spacing:0}.campus-work-stack>button{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:8px;border:0;border-top:1px solid rgba(152,205,239,.11);border-radius:7px;background:transparent;color:white;padding:7px 5px;text-align:left;cursor:pointer}.campus-work-stack>button:hover{background:rgba(81,172,230,.13)}.campus-work-stack>button>span:nth-child(2){min-width:0;display:grid}.campus-work-stack b{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.campus-work-stack small{color:#90afc7;font-size:7.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}.campus-work-stack strong{font:850 8px ui-monospace,monospace;color:#bce8ff;text-align:right}.campus-progress-ring{position:relative;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 4px 11px rgba(0,0,0,.23);animation:ringBreathe 2.4s ease-in-out infinite}.campus-progress-ring:before{content:'';position:absolute;width:23px;height:23px;border-radius:50%;background:#102e50}.campus-progress-ring i{position:relative;z-index:1;font-style:normal;font-size:12px}.campus-work-stack em{height:3px;margin-top:4px;border-radius:99px;background:rgba(151,195,223,.16);overflow:hidden}.campus-work-stack em i{display:block;height:100%;border-radius:99px;box-shadow:0 0 7px currentColor;animation:workBar 1s cubic-bezier(.2,.8,.2,1) both}.product-portfolio-card{position:relative;overflow:hidden;isolation:isolate;transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s!important}.product-portfolio-card:after{content:'';position:absolute;z-index:-1;inset:-120% -80%;background:linear-gradient(110deg,transparent 43%,rgba(255,255,255,.66) 49%,transparent 55%);transform:translateX(-35%) rotate(8deg);transition:transform .62s ease}.product-portfolio-card:hover{transform:translateY(-4px) scale(1.008)!important;box-shadow:0 18px 36px rgba(16,54,84,.14)!important}.product-portfolio-card:hover:after{transform:translateX(40%) rotate(8deg)}.product-portfolio-card.rarity-epic{border-color:#b99df0!important;background:linear-gradient(145deg,#fff,#f6f0ff)!important}.product-portfolio-card.rarity-legendary{border-color:#e4b23c!important;background:linear-gradient(145deg,#fffdf5,#fff2c1)!important;box-shadow:0 0 0 1px rgba(255,216,95,.17),0 8px 22px rgba(147,99,12,.10)}.product-detail-backdrop{animation:momentFade .2s ease-out}.product-detail-card{animation:momentRise .3s cubic-bezier(.2,.9,.25,1)}
        @keyframes momentGlow{0%,100%{transform:scale(.95);opacity:.75}50%{transform:scale(1.13);opacity:1}}@keyframes momentIcon{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-2px) rotate(2deg)}}@keyframes momentCloseBackdrop{to{opacity:0}}@keyframes momentCloseCard{to{opacity:0;transform:translateY(14px) scale(.96)}}@keyframes cardMysterySpin{0%{transform:rotateY(0) scale(.85)}45%{transform:rotateY(540deg) scale(1.05)}100%{transform:rotateY(720deg) scale(1)}}@keyframes revealCopy{from{opacity:0;transform:translateY(10px);filter:blur(2px)}to{opacity:1;transform:none;filter:none}}@keyframes decisionResolve{55%{transform:scale(1.015);filter:brightness(1.03)}to{opacity:0;transform:scale(.96) translateY(8px)}}@keyframes dashboardSheen{0%,74%{transform:translateX(-100%)}90%,100%{transform:translateX(100%)}}@keyframes chartDraw{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}@keyframes chartPulse{0%,100%{opacity:.4}50%{opacity:1;transform:scale(1.5)}}@keyframes donutIn{from{opacity:0;transform:rotate(-18deg) scale(.9)}to{opacity:1;transform:none}}@keyframes workStackIn{from{opacity:0;transform:translateX(18px) scale(.97)}to{opacity:1;transform:none}}@keyframes ringBreathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}@keyframes workBar{from{width:0}}

        .bottom-dock{position:fixed;z-index:60;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:3px;padding:5px;background:linear-gradient(180deg,rgba(14,55,92,.97),rgba(7,34,61,.98));backdrop-filter:blur(16px);border:1px solid rgba(150,207,244,.24);border-radius:16px;box-shadow:0 14px 34px rgba(5,30,54,.30),inset 0 1px 0 rgba(255,255,255,.09)}.bottom-dock button{position:relative;width:78px;height:54px;border:1px solid transparent;background:transparent;color:#aac4d8;border-radius:11px;display:grid;place-items:center;align-content:center;gap:1px;cursor:pointer}.bottom-dock button span{font-size:18px;line-height:20px;filter:saturate(.8)}.bottom-dock button small{font-size:8.5px;font-weight:850;letter-spacing:.1px}.bottom-dock button:hover{background:rgba(255,255,255,.055);color:#fff}.bottom-dock button.active{background:linear-gradient(180deg,#229ce7,#147cc4);border-color:#64c8ff;color:white;box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 5px 14px rgba(5,95,157,.35)}.bottom-dock button.active:after{content:'';position:absolute;bottom:3px;left:31%;right:31%;height:2px;border-radius:2px;background:#c8efff}.bottom-dock button.active small{color:white}
        .more-backdrop{position:fixed;z-index:55;inset:0;background:rgba(4,20,36,.30);backdrop-filter:blur(2px);border:0}.more-sheet{position:fixed;z-index:58;left:50%;bottom:78px;transform:translateX(-50%);width:min(760px,calc(100vw - 28px));background:linear-gradient(180deg,#123c64,#0b2b4b);border:1px solid rgba(140,202,241,.24);border-radius:16px;padding:14px;box-shadow:0 20px 52px rgba(3,23,42,.38),inset 0 1px 0 rgba(255,255,255,.08);color:#fff}.more-sheet-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.more-sheet-head>div{display:grid}.more-sheet-head b{font-size:13px}.more-sheet-head small{font-size:9.5px;color:#9fc0d8;margin-top:2px}.more-sheet-head button{background:rgba(255,255,255,.08)!important;color:#fff!important;border-color:rgba(255,255,255,.14)!important}.more-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.more-grid button{border:1px solid rgba(150,207,244,.18);background:rgba(7,30,53,.52);color:#fff;border-radius:11px;padding:11px;text-align:left;cursor:pointer;display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:start}.more-grid button:hover{background:rgba(35,112,169,.36);border-color:rgba(113,201,255,.36)}.more-grid button>span{font-size:19px;grid-row:1/3}.more-grid button b{font-size:10.5px}.more-grid button small{font-size:8.5px;line-height:1.35;color:#9fc0d8;margin-top:2px}

        .hub-pulse{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:14px}.hub-pulse>div{background:linear-gradient(180deg,#fff,#f6faff);border:1px solid ${C.line};border-radius:12px;padding:12px;box-shadow:0 4px 13px rgba(20,53,84,.05)}.hub-pulse small{display:block;text-transform:uppercase;color:${C.faint};font-size:8px;font-weight:850;letter-spacing:.65px}.hub-pulse b{display:block;font-family:ui-monospace,monospace;font-size:21px;margin-top:3px;color:${C.navy}}
        .hub-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hub-cards button{background:linear-gradient(180deg,#fff,#f7fbff);border:1px solid ${C.line};border-radius:14px;padding:16px;text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;cursor:pointer;box-shadow:0 5px 17px rgba(20,53,84,.05)}.hub-cards button:hover{border-color:#9fc8e5;box-shadow:0 7px 22px rgba(20,89,140,.09)}.hub-cards button>span{font-size:26px}.hub-cards b{font-size:13px}.hub-cards p{color:${C.dim};font-size:10.5px;line-height:1.5;margin:5px 0 0}.hub-cards i{font-style:normal;color:${C.cyan};font-size:18px}
        @media(max-width:780px){.campus-world{left:0;top:108px}.left-rail{top:auto;bottom:8px;left:8px;right:8px;display:flex;justify-content:space-between}.left-rail button{width:auto;flex:1;min-height:46px}.left-rail button small{font-size:7px}.screen-overlay{inset:108px 0 0;padding:6px}.overlay-card{width:100%;height:calc(100vh - 120px);border-radius:13px}.event-toast{left:8px;right:8px;bottom:66px;max-width:none}.scenario-objectives,.outcome-grid{grid-template-columns:1fr}.achievement-grid{grid-template-columns:1fr}.legacy-hero{align-items:flex-start}.decision-modal{padding:17px;border-radius:18px}.decision-modal h1{font-size:24px}}
        table{font-variant-numeric:tabular-nums}thead th{font-weight:800!important;text-transform:uppercase;letter-spacing:.35px;font-size:9px!important;color:${C.faint}!important}tbody tr:hover{background:rgba(22,141,226,.025)}

        @media(max-width:1120px){.hud-metrics .hud-metric:nth-child(4){display:none}.company-mark{min-width:175px}.hud-controls .confidence{display:none}}
        @media(max-width:900px){.hud-metrics .hud-metric:nth-child(3){display:none}.difficulty-pill{display:none}.company-mark{min-width:145px}.company-mark small{display:none}}
        @media(max-width:780px){.game-hud{padding:7px 8px;gap:5px;flex-wrap:wrap;min-height:66px}.company-mark{min-width:auto;flex:1;border-right:0}.company-gem{width:34px;height:34px;border-radius:10px}.hud-metrics{order:3;width:100%;flex:none;overflow-x:auto}.hud-metric{min-width:101px;min-height:42px;padding-left:31px}.hud-controls{margin-left:auto}.hud-controls .difficulty-pill,.hud-controls button:last-child{display:none}.game-date{font-size:8.5px;padding:7px}.screen-heading{padding:18px 14px 8px}.screen-heading h1{font-size:23px}.screen-heading p{font-size:11px}.section-tabs{padding:0 14px 5px}.game-content,.game-content.campus-content{padding:8px 11px 102px}.event-banner{margin:8px 10px 0}.bottom-dock{bottom:7px;width:calc(100vw - 12px);justify-content:space-between;border-radius:14px}.bottom-dock button{width:auto;flex:1;height:48px;padding:0 2px}.bottom-dock button span{font-size:16px}.bottom-dock button small{font-size:7.5px}.more-sheet{bottom:66px}.more-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-pulse{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-cards{grid-template-columns:1fr}.campus-return{padding:7px 9px}.screen-heading{align-items:center}}
        /* v1.0 mobile certification — phone is a first-class layout, not a shrunken desktop. */
        .data-table-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.data-table-scroll table{min-width:680px}
        @media(hover:none){button:hover{filter:none}.left-rail button:hover,.hub-cards button:hover{background:inherit}}
        @media(max-width:640px){
          html,body,#root,.tycoon-shell,.play-surface{height:100%;height:100dvh;max-height:100dvh;overflow:hidden}
          .game-hud{position:fixed;left:0;right:0;top:0;height:96px;min-height:96px;padding:5px 7px calc(5px + env(safe-area-inset-top));gap:4px;display:grid;grid-template-columns:minmax(118px,1fr) auto;grid-template-rows:42px 42px;z-index:60}
          .company-mark{min-width:0;width:100%;padding:2px 5px 2px 1px;border-right:0;gap:7px;overflow:hidden}.company-mark .company-gem{flex:0 0 auto}.company-mark span:last-child{min-width:0}.company-mark b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.company-mark small{display:block!important;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .hud-metrics{grid-column:1/-1;grid-row:2;display:grid;width:100%;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;overflow:visible}.hud-metric{min-width:0!important;min-height:38px!important;height:38px;padding:4px 5px 4px 27px;border-radius:8px}.hud-metric:nth-child(4){display:none!important}.hud-metric .metric-icon{left:6px;width:16px;height:16px;font-size:9px}.hud-metric small{font-size:6.5px;letter-spacing:.35px}.hud-metric b{font-size:10.5px}.hud-metric em{display:none}
          .hud-controls{grid-column:2;grid-row:1;display:flex;gap:3px;margin:0!important;justify-content:flex-end}.hud-controls .confidence,.hud-controls .difficulty-pill,.hud-controls button:last-child{display:none!important}.hud-controls>button:not(.task-pill){min-width:31px!important;height:34px;padding:4px 6px!important;font-size:10px!important;border-radius:8px}.hud-controls>button:nth-of-type(1){font-size:12px!important}.game-date{font-size:7px!important;padding:5px 6px!important;white-space:nowrap}.task-pill{position:fixed!important;top:102px;right:7px;z-index:55;min-width:0!important;max-width:116px;height:35px;padding:4px 7px;border-radius:9px;grid-template-columns:auto 1fr}.task-pill span{font-size:13px}.task-pill b{font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.task-pill em{font-size:7px}
          .campus-world{left:0!important;top:96px!important;bottom:calc(58px + env(safe-area-inset-bottom))!important}.play-surface{height:100dvh!important}
          .left-rail{top:auto!important;bottom:max(5px,env(safe-area-inset-bottom))!important;left:5px!important;right:5px!important;padding:4px!important;gap:1px!important;display:flex!important;border-radius:13px!important;z-index:65}.left-rail button{width:auto!important;flex:1 1 0;min-width:0;min-height:49px!important;padding:2px 0!important;border-radius:9px}.left-rail button>span{font-size:15px!important;width:26px!important;height:26px!important}.left-rail button small{font-size:6.3px!important;max-width:100%;overflow:hidden;text-overflow:ellipsis}.left-rail button i{right:1px;top:1px;min-width:14px;height:14px;font-size:7px;padding:0 3px}
          .screen-overlay{inset:96px 0 calc(58px + env(safe-area-inset-bottom)) 0!important;padding:0!important;align-items:stretch;background:rgba(5,24,42,.34)}.overlay-card{width:100%!important;height:100%!important;max-height:none!important;border-radius:0!important;border-left:0;border-right:0;box-shadow:none}.overlay-head{padding:10px 11px 8px;gap:8px;position:sticky;top:0;z-index:5}.overlay-head h1{font-size:18px;margin:2px 0}.overlay-head p{font-size:9.5px;line-height:1.35;max-width:none}.screen-eyebrow{font-size:7px}.overlay-close{width:40px;height:40px;min-width:40px;font-size:14px}.overlay-tabs{padding:6px 8px;gap:4px;position:sticky;top:61px;z-index:4}.overlay-tabs button{min-height:36px;padding:6px 9px;font-size:9px}.overlay-body{padding:9px 8px calc(18px + env(safe-area-inset-bottom));overscroll-behavior:contain}.overlay-body>div{max-width:100%}
          .event-toast{left:6px!important;right:6px!important;bottom:calc(62px + env(safe-area-inset-bottom))!important;max-width:none!important;padding:8px 9px;font-size:9.5px}
          .product-moment-backdrop{padding:10px!important}.product-moment-card{width:100%!important;padding:16px!important;border-radius:19px!important}.product-moment-hero{margin:5px 0 -4px!important;transform:scale(.86)}.product-moment-copy h2{font-size:20px!important}.product-moment-copy p{font-size:10.5px!important;line-height:1.45!important}.product-moment-metrics{gap:4px!important;margin-top:12px!important}.product-moment-metrics>div{padding:7px 3px!important}.product-moment-metrics b{font-size:9px!important}.product-moment-actions{margin-top:12px!important}.product-moment-actions button{min-height:40px!important;font-size:10px!important;padding:8px!important}
          .product-reveal-stage{height:185px!important}.product-reveal-card{width:133px!important;height:166px!important}.market-visual-dashboard{margin:-1px -1px 12px;padding:12px;border-radius:14px}.market-visual-head{display:block}.market-window-pills{justify-content:flex-start;margin-top:9px}.market-visual-grid{grid-template-columns:1fr}.market-revenue-card{grid-column:auto}.market-donut-layout{flex-direction:column;align-items:stretch}.market-donut-layout>div:first-child{align-self:center}.market-rank-list{width:100%}.campus-work-stack{right:7px;bottom:7px;width:min(292px,calc(100% - 14px));padding:7px}.campus-work-stack>button{padding:5px 3px}.campus-work-stack>button:nth-of-type(n+4){display:none}
          .goals-summary{align-items:flex-start!important;flex-direction:column}.goals-progress{width:100%!important}
          .hub-pulse{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px}.hub-pulse>div{padding:8px}.hub-pulse b{font-size:16px}.hub-cards{grid-template-columns:1fr!important;gap:7px}.hub-cards button{padding:11px;gap:9px}.hub-cards button>span{font-size:21px}
          .inventory-product-row{grid-template-columns:1fr 1fr!important;gap:6px 10px!important;padding:10px 3px!important}.inventory-product-row>div:first-child{grid-column:1/-1}.inventory-product-row>span:last-child{grid-column:1/-1;text-align:right}.inventory-product-row>div{font-size:10px}
          .data-table-scroll{margin:0 -2px;padding-bottom:3px}.data-table-scroll table{min-width:650px}
          .overlay-body table{font-size:10.5px;display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap}.overlay-body input,.overlay-body select,.overlay-body textarea,.game-modal-card input,.game-modal-card select,.game-modal-card textarea{font-size:16px!important;min-height:42px}.overlay-body button,.game-modal-card button{touch-action:manipulation}
          .game-modal-backdrop{padding:0!important;align-items:flex-end!important;background:rgba(4,8,12,.68)!important}.game-modal-card{max-width:none!important;width:100%!important;max-height:calc(100dvh - 18px)!important;border-radius:18px 18px 0 0!important;padding:13px 11px calc(16px + env(safe-area-inset-bottom))!important}.game-modal-head{position:sticky;top:-13px;z-index:5;background:${C.panel};padding:12px 0 8px;margin-bottom:10px!important;border-bottom:1px solid ${C.line}}.game-modal-head h2{font-size:17px!important;line-height:1.2;padding-right:8px}.game-modal-close{min-width:42px!important;min-height:42px!important}
          .more-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:390px){.company-mark small{display:none!important}.game-hud{grid-template-columns:minmax(92px,1fr) auto}.hud-controls>button:not(.task-pill){min-width:28px!important;padding:4px!important}.game-date{padding:5px 4px!important}.left-rail button small{font-size:5.8px!important}.overlay-head p{display:none}.overlay-tabs{top:50px}.hub-pulse{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
        @media(max-height:650px) and (max-width:900px){.game-hud{height:78px;min-height:78px;grid-template-rows:34px 34px}.campus-world{top:78px!important}.screen-overlay{inset:78px 0 calc(55px + env(safe-area-inset-bottom)) 0!important}.task-pill{top:83px}.hud-metric{height:32px!important;min-height:32px!important}.left-rail button{min-height:45px!important}}
        /* v2.2 readability reset: information may be dense, but essential UI is never miniature. */
        .company-mark small{font-size:11px}.hud-metric small{font-size:10px}.hud-metric b{font-size:14px}.hud-metric em{font-size:10px}.game-date{font-size:12px}.difficulty-pill,.confidence{font-size:11px}
        .left-rail button{width:76px;min-height:64px}.left-rail button small{font-size:10.5px}.left-rail button>span{font-size:20px}.screen-eyebrow{font-size:11px}.screen-heading p{font-size:14px}.section-tabs button{min-height:42px;padding:9px 14px;font-size:13px}
        .overlay-card{width:min(1180px,calc(100vw - 118px))}.overlay-head h1{font-size:26px}.overlay-head p{font-size:13.5px}.overlay-close{width:44px;height:44px;font-size:16px}.overlay-tabs button{min-height:46px;padding:8px 13px 8px 8px;font-size:13px}.overlay-body{font-size:14px}.event-toast{left:104px;font-size:13px}.task-pill b{font-size:11px}.task-pill em{font-size:10px}
        thead th{font-size:11.5px!important}.hub-pulse small{font-size:10px}.hub-cards p{font-size:13px}.more-grid button b{font-size:13px}.more-grid button small{font-size:11px}
        @media(max-width:780px){.left-rail button small{font-size:10px}.section-tabs button{font-size:12.5px}.overlay-tabs button{font-size:12.5px}}
        @media(max-width:640px){
          .company-mark small{font-size:9px!important}.hud-metric small{font-size:8.5px!important}.hud-metric b{font-size:12px!important}.game-date{font-size:9px!important}.task-pill b{font-size:9px!important}.task-pill em{font-size:8.5px!important}
          .left-rail button small{font-size:9px!important;line-height:1.05}.left-rail button>span{font-size:17px!important}.overlay-head h1{font-size:22px!important}.overlay-head p{font-size:12px!important}.screen-eyebrow{font-size:9px!important}.overlay-tabs button{min-height:44px!important;font-size:12px!important}.overlay-body{font-size:14px}.event-toast{font-size:12px!important}.product-moment-copy p{font-size:12px!important}.product-moment-metrics small{font-size:9px!important}.product-moment-metrics b{font-size:11px!important}.bottom-dock button small{font-size:9px!important}.more-grid button b{font-size:13px}.more-grid button small{font-size:12px}
        }
        @media(max-width:390px){.left-rail button small{font-size:8.5px!important}.overlay-head p{display:none}.company-mark small{display:none!important}}
        @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.product-reveal-stage.is-spinning .product-reveal-card{transform:rotateY(180deg)!important}.market-visual-dashboard:before{display:none}}
      `}</style>
      {children}
    </div>
  );
}
