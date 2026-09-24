import React, { useState } from "react";
import { C, ctrlBtn, bigBtn, fmtMoney, fmtPct, fmtNum } from "./theme";
import { Panel, Slider, SelectInput } from "./components";
import { Home, SetupWizard } from "./setup/Setup";
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
import { researchDef, researchRate } from "../engine/research";
import { MARKETING_AGENCIES } from "../engine/industries";
import { agencyFitLabel, agencyFitStars, marketingAgencyFitForSegment } from "../engine/segments";
import { TICKS_PER_QUARTER, DAYS_PER_MONTH } from "../engine/types";
import { useGame } from "../state/useGame";
import { inventoryUsed, warehouseUnitCapacity, maxManufacturableBatch, productionLeadDays } from "../engine/capacity";
import { founderJourney } from "../engine/progression";
import { categoryExpansionSpeed } from "../engine/growth";
import { industryEntrySpeed } from "../engine/businesses";
import { distributionMetricsForSku } from "../engine/distribution";
import { brandById } from "../engine/brands";
import { BrandLogoMark } from "./visualIdentity";
import { teamEffectiveness } from "../engine/people";

// ============================================================================
// Batch 10 UX architecture
// Campus is the game world. Buildings are contextual navigation. The bottom
// dock is a fast shortcut, not a second competing information architecture.
// ============================================================================

type Route = { top: string; sub: string };
type NavItem = Route & { id: string; label: string; icon: string; description?: string };

const GROUP_TABS: Record<string, NavItem[]> = {
  ops: [
    { id: "products", label: "Products", icon: "📦", top: "ops", sub: "products" },
    { id: "inventory", label: "Inventory", icon: "📚", top: "ops", sub: "inventory" },
    { id: "distribution", label: "Distribution", icon: "🚚", top: "ops", sub: "distribution" },
  ],
  fin: [
    { id: "overview", label: "Overview", icon: "💵", top: "fin", sub: "overview" },
    { id: "analysis", label: "Analysis", icon: "📊", top: "fin", sub: "analysis" },
  ],
  mkt: [
    { id: "customers", label: "Market", icon: "🎯", top: "mkt", sub: "customers" },
    { id: "segments", label: "Segments", icon: "🧭", top: "mkt", sub: "segments" },
    { id: "campaigns", label: "Marketing", icon: "📣", top: "mkt", sub: "campaigns" },
  ],
  history: [
    { id: "chronicle", label: "Chronicle", icon: "📖", top: "history", sub: "chronicle" },
    { id: "annual", label: "Annual Reviews", icon: "🗓", top: "history", sub: "annual" },
    { id: "records", label: "Records", icon: "🏆", top: "history", sub: "records" },
  ],
  company: [
    { id: "company", label: "HQ", icon: "🏢", top: "mgmt", sub: "company" },
    { id: "research", label: "Research", icon: "🔬", top: "mgmt", sub: "research" },
    { id: "strategy", label: "Strategy", icon: "♟", top: "mgmt", sub: "strategy" },
    { id: "brands", label: "Brands", icon: "🏷", top: "mgmt", sub: "vision" },
    { id: "businesses", label: "Businesses", icon: "🧱", top: "mgmt", sub: "businesses" },
    { id: "ip", label: "IP & Licensing", icon: "🎬", top: "mgmt", sub: "ip" },
  ],
};

function routeMeta(top: string, sub: string) {
  const key = `${top}/${sub}`;
  const map: Record<string, { title: string; eyebrow: string; description: string; group?: string }> = {
    "mgmt/personnel": { title: "People", eyebrow: "Your organization", description: "Hire, develop and assign the people who make the company better.", group: "people" },
    "mgmt/company": { title: "Company HQ", eyebrow: "Corporate office", description: "Direction, portfolio and the long-term identity of the business.", group: "company" },
    "mgmt/research": { title: "Research & Capabilities", eyebrow: "Company development", description: "Unlock the product, organization and operating capabilities required to grow the company.", group: "company" },
    "mgmt/strategy": { title: "Strategy & Intelligence", eyebrow: "Company HQ", description: "Choose where to compete, then research what the market is telling you.", group: "company" },
    "mgmt/vision": { title: "Brands", eyebrow: "Company HQ", description: "Give each brand a reason to exist and decide how far it should stretch.", group: "company" },
    "mgmt/businesses": { title: "Businesses", eyebrow: "Company HQ", description: "Compare the industries inside your company and decide where to expand.", group: "company" },
    "mgmt/ip": { title: "IP & Licensing", eyebrow: "Company HQ", description: "Own, license and deploy intellectual property across compatible products.", group: "company" },
    "ops/products": { title: "Products", eyebrow: "Product studio", description: "See what is working, what is stuck and what needs a decision next.", group: "ops" },
    "ops/inventory": { title: "Inventory", eyebrow: "Warehouse", description: "Keep enough stock to sell without turning cash into a warehouse full of mistakes.", group: "ops" },
    "ops/distribution": { title: "Distribution", eyebrow: "Sourcing & sales", description: "Put each product in channels that fit the buyer and the proposition.", group: "ops" },
    "fin/overview": { title: "Finance", eyebrow: "Finance office", description: "Understand where the money comes from, where it goes and why cash differs from profit.", group: "fin" },
    "fin/analysis": { title: "Financial Analysis", eyebrow: "Finance office", description: "Drill into economics by product and operating decision.", group: "fin" },
    "mkt/customers": { title: "Market", eyebrow: "Commercial intelligence", description: "Who buys, what they value and where your current opportunities are.", group: "mkt" },
    "mkt/segments": { title: "Segments", eyebrow: "Commercial intelligence", description: "Turn market understanding into reusable audiences for campaigns and decisions.", group: "mkt" },
    "mkt/internal": { title: "Marketing", eyebrow: "Marketing office", description: "Allocate ongoing spend without pretending money can rescue a bad proposition.", group: "mkt" },
    "mkt/campaigns": { title: "Marketing", eyebrow: "Marketing office", description: "Choose an audience, see which media partner fits it, and run targeted campaigns.", group: "mkt" },
    "history/chronicle": { title: "Company Chronicle", eyebrow: "Archive", description: "The moments that made the company what it is.", group: "history" },
    "history/annual": { title: "Annual Reviews", eyebrow: "Archive", description: "A year-by-year view of performance and turning points.", group: "history" },
    "history/records": { title: "Records & Legacy", eyebrow: "Archive", description: "The products, people and achievements that defined the run.", group: "history" },
  };
  return map[key] ?? { title: "Business Empire", eyebrow: "Company", description: "" };
}

export function Game() {
  const g = useGame();
  const [overlay, setOverlay] = useState<Route | null>(null);
  const [seenEvents, setSeenEvents] = useState(0);
  const [creatorBaseId, setCreatorBaseId] = useState<string | null>(null);
  const [focusProductId, setFocusProductId] = useState<string | null>(null);

  const navigate = (top: string, sub: string) => { if (top === "mgmt" && sub === "hq") setOverlay(null); else setOverlay({ top, sub }); };
  const closeOverlay = () => setOverlay(null);
  const openCreator = (baseSkuId?: string) => { setCreatorBaseId(baseSkuId ?? null); g.setModal("creator"); };
  const openProduct = (productId: string) => { setFocusProductId(productId); navigate("ops", "products"); };

  if (g.phase === "home") return <Shell><Home onStart={g.newGame} onContinue={g.continueAutosave} canContinue={g.autosaveAvailable} /></Shell>;
  if (g.phase === "setup") return <Shell><SetupWizard onLaunch={g.launch} /></Shell>;

  const w = g.world!;
  const hist = w.history;
  const last = hist.at(-1) ?? ({} as any);
  const prev = hist[Math.max(0, hist.length - TICKS_PER_QUARTER)] ?? ({} as any);
  const shareDelta = (last.share || 0) - (prev.share || 0);
  const newEvent = w.events.length > seenEvents ? w.events[w.events.length - 1] : null;
  const day = (w.tick % DAYS_PER_MONTH) + 1;
  const month = Math.floor(w.tick / DAYS_PER_MONTH) % 12 + 1;
  const year = Math.floor(w.tick / (TICKS_PER_QUARTER * 4)) + 1;
  const creatorBase = creatorBaseId ? w.player.skus.find((s) => s.id === creatorBaseId) ?? null : null;
  const workQueue = activeWorkQueue(w);
  const leadTask = workQueue[0];
  const productAttention = w.player.skus.filter((s) => s.status === "designed" || (s.status === "active" && !s.releasedToMarket)).length;

  const renderOverlay = () => {
    if (!overlay) return null;
    if (overlay.top === "goals") return <GoalsOverlay world={w} onNavigate={navigate} />;
    if (overlay.top === "mgmt" && overlay.sub === "company") return <CompanyHub world={w} onNavigate={navigate} />;
    if (overlay.top === "mgmt" && overlay.sub === "personnel") return <PersonnelView world={w} hireCandidate={g.hireCandidate} startRecruitingSearch={g.startRecruitingSearch} promotePersonnel={g.promotePersonnel} trainPersonnel={g.trainPersonnel} firePersonnel={g.firePersonnel} />;
    if (overlay.top === "mgmt" && overlay.sub === "research") return <ResearchView world={w} startResearch={g.startResearch} startCategoryExpansion={g.startCategoryExpansion} />;
    if (overlay.top === "mgmt" && overlay.sub === "strategy") return <div><StrategyView world={w} /><div style={{ marginTop: 14 }}><IntelligenceView world={w} commission={g.commission} /></div></div>;
    if (overlay.top === "mgmt" && overlay.sub === "vision") return <BrandView world={w} setVision={g.setVision} createBrand={g.createBrand} startCategoryExpansion={g.startCategoryExpansion} />;
    if (overlay.top === "mgmt" && overlay.sub === "businesses") return <BusinessesView world={w} startIndustryEntry={g.startIndustryEntry} />;
    if (overlay.top === "mgmt" && overlay.sub === "ip") return <IPView world={w} createIP={g.createIP} licenseIP={g.licenseIP} />;
    if (overlay.top === "ops" && overlay.sub === "products") return <ProductsView world={w} produce={g.produce} setProductPrice={g.setProductPrice} setProductQuality={g.setProductQuality} setProductionSetup={g.setProductionSetup} assignPartner={g.assignPartner} openContract={() => g.setModal("contract")} openCreator={openCreator} commissionStudy={() => g.commission("product_diagnosis")} releaseProduct={g.releaseProduct} retargetProduct={g.retargetProduct} discardProduct={g.discardProduct} openMarketing={() => navigate("mkt","campaigns")} openSegments={() => navigate("mkt","segments")} focusProductId={focusProductId} onFocusHandled={() => setFocusProductId(null)} />;
    if (overlay.top === "ops" && overlay.sub === "inventory") return <InventoryView world={w} openProduct={openProduct} />;
    if (overlay.top === "ops" && overlay.sub === "distribution") return <DistributionPlaceholder world={w} openContract={() => g.setModal("contract")} removeContract={g.removeContract} openProduct={openProduct} />;
    if (overlay.top === "fin" && overlay.sub === "overview") return <FinancialsView world={w} hist={hist} borrow={g.borrow} repay={g.repay} />;
    if (overlay.top === "fin" && overlay.sub === "analysis") return <AnalysisPlaceholder world={w} />;
    if (overlay.top === "mkt" && overlay.sub === "customers") return <div><MarketView world={w} hist={hist} selectCell={g.selectCell} /><div style={{ marginTop: 14 }}><CustomersView world={w} /></div></div>;
    if (overlay.top === "mkt" && overlay.sub === "segments") return <SegmentsView world={w} saveSegment={g.saveSegment} deleteSegment={g.deleteSegment} updateSegment={g.updateSegment} />;
    if (overlay.top === "mkt" && overlay.sub === "campaigns") return <CampaignsView world={w} launchCampaign={g.launchCampaign} openSegments={() => navigate("mkt","segments")} setMarketing={g.setMarketing} setBrandMarketing={g.setBrandMarketing} setFocus={g.setFocus} />;
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
        <div className="hud-controls">{leadTask && <button className="task-pill" onClick={() => navigate(leadTask.top, leadTask.sub)} title={workQueue.map((t) => `${t.label}: ${t.days == null ? "Paused" : `${t.days}d`}`).join(" · ")}><span>{leadTask.icon}</span><b>{leadTask.label}</b><em>{leadTask.days == null ? "Paused" : `${leadTask.days}d`}{workQueue.length > 1 ? ` · +${workQueue.length - 1}` : ""}</em></button>}{w.difficulty !== "bootstrap" && <span className={`confidence ${w.investorConfidence < .35 ? "low" : w.investorConfidence < .65 ? "mid" : "high"}`}>Backers {(w.investorConfidence * 100).toFixed(0)}%</span>}<span className="difficulty-pill">{w.difficulty}</span><button onClick={() => g.setPlaying(!g.playing)} style={{ ...ctrlBtn, fontSize: 14, padding: "6px 11px" }}>{g.playing ? "❚❚" : "▶"}</button>{[1,2,4].map((s) => <button key={s} onClick={() => g.setSpeed(s)} style={{ ...ctrlBtn, background: g.speed === s ? C.violet : C.panel, color: g.speed === s ? "#fff" : C.dim, minWidth: 34, padding: "6px 8px", fontWeight: 700 }}>{s}×</button>)}<span className="game-date">Y{year} · M{month} · D{day}</span><button onClick={g.saveNow} style={{ ...ctrlBtn, padding: "6px 9px" }}>Save</button></div>
      </header>

      <div className="campus-world"><CompanyMapView world={w} openCreator={() => openCreator()} updateRooms={g.updateOperatingRooms} buildRoom={g.buildOperatingRoom} buildPath={g.buildCampusPath} buildPathLine={g.buildCampusPathLine} demolishRoom={g.demolishOperatingRoom} upgradeRoom={g.upgradeOperatingRoom} retoolFactory={g.retoolFactory} installWarehouseModule={g.installWarehouseModule} onNavigate={navigate} /></div>

      <nav className="left-rail" aria-label="Company controls">
        <RailButton icon="◎" label="Goals" active={overlay?.top === "goals"} onClick={() => setOverlay({top:"goals",sub:"goals"})} badge={`${founderJourney(w).filter((s)=>!s.done).length}`} />
        <RailButton icon="📦" label="Products" active={overlay?.top === "ops" && overlay.sub === "products"} onClick={() => navigate("ops","products")} badge={productAttention ? String(productAttention) : undefined} />
        <RailButton icon="👥" label="People" active={overlay?.top === "mgmt" && overlay.sub === "personnel"} onClick={() => navigate("mgmt","personnel")} badge={w.player.talentSearch ? `${Math.ceil(w.player.talentSearch.daysLeft)}d` : undefined} />
        <RailButton icon="🎯" label="Market" active={overlay?.top === "mkt"} onClick={() => navigate("mkt","customers")} />
        <RailButton icon="💵" label="Finance" active={overlay?.top === "fin"} onClick={() => navigate("fin","overview")} />
        <RailButton icon="🏢" label="Company" active={overlay?.top === "mgmt" && overlay.sub !== "personnel"} onClick={() => navigate("mgmt","company")} />
        <RailButton icon="📖" label="History" active={overlay?.top === "history"} onClick={() => navigate("history","chronicle")} />
      </nav>

      {newEvent && <div className="event-toast"><span>⚡ {newEvent.text}</span><button onClick={() => setSeenEvents(w.events.length)}>✕</button></div>}

      {overlay && <div className="screen-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeOverlay(); }}>
        <section className="overlay-card">
          <div className="overlay-head"><div><div className="screen-eyebrow">{meta.eyebrow}</div><h1>{meta.title}</h1><p>{meta.description}</p></div><button className="overlay-close" onClick={closeOverlay}>✕</button></div>
          {tabs.length > 1 && <div className="overlay-tabs">{tabs.map((t) => <button key={t.id} className={overlay.top === t.top && overlay.sub === t.sub ? "active" : ""} onClick={() => navigate(t.top,t.sub)}>{t.icon} {t.label}</button>)}</div>}
          <div className="overlay-body">{renderOverlay()}</div>
        </section>
      </div>}

      {g.modal === "creator" && <ProductCreator world={w} baseSku={creatorBase} onCreate={(spec) => { const result = g.createProduct(spec); if (result.ok) setCreatorBaseId(null); return result; }} onClose={() => { setCreatorBaseId(null); g.setModal(null); }} />}
      {g.modal === "contract" && <ContractModal world={w} onSign={g.signContract} onClose={() => g.setModal(null)} />}
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

function RailButton({ icon, label, active, onClick, badge }: { icon: string; label: string; active: boolean; onClick: () => void; badge?: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span><small>{label}</small>{badge && badge !== "0" ? <i>{badge}</i> : null}</button>;
}

function GoalsOverlay({ world, onNavigate }: { world: any; onNavigate: (top: string, sub: string) => void }) {
  const steps = founderJourney(world); const done = steps.filter((s) => s.done).length;
  return <div><div className="goals-summary" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><div><b style={{ fontSize: 14 }}>{done}/{steps.length} milestones complete</b><div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>Goals are guidance, not a permanent banner over the campus.</div></div><div className="goals-progress" style={{ width: 180, height: 8, background: C.grid, borderRadius: 99 }}><div style={{ width: `${done/steps.length*100}%`, height: "100%", borderRadius: 99, background: C.violet }} /></div></div><div style={{ display: "grid", gap: 7 }}>{steps.map((st, i) => <button key={st.id} onClick={() => !st.done && onNavigate(st.topTab,st.subTab)} style={{ textAlign: "left", display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 8, alignItems: "center", border: `1px solid ${st.done ? "#bbf7d0" : C.line}`, background: st.done ? "#f0fdf4" : "white", borderRadius: 10, padding: 10, cursor: st.done ? "default" : "pointer", color: C.ink }}><span style={{ color: st.done ? C.green : C.faint, fontWeight: 900 }}>{st.done ? "✓" : i+1}</span><div><b style={{ fontSize: 11.5 }}>{st.label}</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 2 }}>{st.detail}</div></div>{!st.done && <span style={{ color: C.violet }}>→</span>}</button>)}</div></div>;
}

function HudMetric({ icon, label, value, detail, tone = "normal" }: { icon: string; label: string; value: string; detail?: string; tone?: "normal" | "good" | "bad" }) {
  return <div className={`hud-metric ${tone}`}><span className="metric-icon">{icon}</span><small>{label}</small><div><b>{value}</b>{detail && <em>{detail}</em>}</div></div>;
}

function CompanyHub({ world, onNavigate }: { world: any; onNavigate: (top: string, sub: string) => void }) {
  const activeBusinesses = Object.values(world.player.businesses ?? {}).filter((b: any) => b?.status === "active").length;
  const activeProducts = world.player.skus.filter((s: any) => s.status === "active").length;
  const ownedIp = world.ipAssets.filter((ip: any) => ip.ownerType === "player").length;
  const cards = [
    { icon: "🔬", title: "Research & Capabilities", text: "Unlock larger product programs, offices, recruiting methods, sourcing and owned manufacturing.", top: "mgmt", sub: "research" },
    { icon: "♟", title: "Strategy & Intelligence", text: "Choose direction and commission market studies that explain what went wrong or where opportunity sits.", top: "mgmt", sub: "strategy" },
    { icon: "🏷", title: "Brands", text: "Position brands, create new ones and decide which categories they can credibly enter.", top: "mgmt", sub: "vision" },
    { icon: "🧱", title: "Businesses", text: "See the operating portfolio by industry and manage expansion into new businesses.", top: "mgmt", sub: "businesses" },
    { icon: "🎬", title: "IP & Licensing", text: "Build owned IP, sign licenses and deploy them where the audience and product actually fit.", top: "mgmt", sub: "ip" },
  ];
  return <div>
    <div className="hub-pulse">
      <div><small>Businesses</small><b>{activeBusinesses}</b></div>
      <div><small>Brands</small><b>{world.brands.length}</b></div>
      <div><small>Active products</small><b>{activeProducts}</b></div>
      <div><small>People</small><b>{world.player.personnel.length}</b></div>
      <div><small>Owned IP</small><b>{ownedIp}</b></div>
    </div>
    <Panel title="Run the company, not the spreadsheet">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.65, maxWidth: 820 }}>HQ is for decisions that change what the company is. Day-to-day work is reached from the campus itself or the compact control rail.</div>
    </Panel>
    <div className="hub-cards">
      {cards.map((c) => <button key={c.sub} onClick={() => onNavigate(c.top, c.sub)}><span>{c.icon}</span><div><b>{c.title}</b><p>{c.text}</p></div><i>→</i></button>)}
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
      <button style={ctrlBtn} onClick={() => onNavigate("mgmt", "personnel")}>👥 Open People</button>
      <button style={ctrlBtn} onClick={() => onNavigate("history", "chronicle")}>📖 Open Company History</button>
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
  const active = world.player.skus.filter((s: any) => s.status === "active" || s.status === "manufacturing" || s.status === "designed");

  return <div>
    <Panel title="📦 Warehouse Network">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.6 }}>This is the supply overview. Product-specific manufacturing and reorders live inside the product itself, so there is only one place where you change a SKU.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 8, marginTop: 12 }}>
        <div style={summaryTile}><small>Total capacity</small><b>{fmtNum(capacity)} units</b></div>
        <div style={summaryTile}><small>Used / reserved</small><b>{fmtNum(used)} units</b></div>
        <div style={summaryTile}><small>Free space</small><b style={{ color: capacity-used < capacity*.15 ? C.amber : C.green }}>{fmtNum(Math.max(0,capacity-used))}</b></div>
        <div style={summaryTile}><small>Facilities</small><b>{warehouses.length}</b></div>
      </div>
      <div style={{ height: 8, background: C.grid, borderRadius: 4, marginTop: 10 }}><div style={{ width: `${utilization * 100}%`, height: "100%", background: utilization > .9 ? C.red : utilization > .75 ? C.amber : C.green, borderRadius: 4 }} /></div>
      <div style={{ color: C.faint, fontSize: 10.5, marginTop: 5 }}>Inbound batches reserve warehouse space immediately.</div>
    </Panel>

    <Panel title="Supply by Product">
      {active.length === 0 ? <div style={{ color: C.faint, fontSize: 13 }}>No designed products yet.</div> : active.map((sku: any) => {
        const si = world.player.skus.indexOf(sku);
        const r = world.live?.skuResults?.[si];
        const salesQ = r?.units ?? 0;
        const salesDay = salesQ / 90;
        const inbound = sku.mfgBatchSize ?? 0;
        const daysCover = salesDay > 0 ? (sku.inventory + inbound) / salesDay : 999;
        const lostQ = r?.lostUnits ?? 0;
        const stockColor = lostQ > 1 || daysCover < 20 ? C.red : daysCover < 45 ? C.amber : C.green;
        return <button className="inventory-product-row" key={sku.id} onClick={() => openProduct(sku.id)} style={{ width: "100%", border: 0, borderTop: `1px solid ${C.grid}`, background: "transparent", padding: "11px 0", display: "grid", gridTemplateColumns: "minmax(160px,1.2fr) repeat(4,minmax(90px,.7fr)) auto", gap: 10, alignItems: "center", fontSize: 11.5, textAlign: "left", cursor: "pointer", color: C.ink }}>
          <div><div style={{ fontWeight: 800 }}>{sku.name}</div><div style={{ color: C.faint, marginTop: 2 }}>{sku.status}{inbound > 0 ? ` · ${fmtNum(inbound)} inbound` : ""}</div></div>
          <div><div style={{ color: C.faint }}>On hand</div><b>{fmtNum(sku.inventory)}</b></div>
          <div><div style={{ color: C.faint }}>Sales / day</div><b>{salesDay > 0 ? salesDay.toFixed(salesDay < 10 ? 1 : 0) : "—"}</b></div>
          <div><div style={{ color: C.faint }}>Cover</div><b style={{ color: stockColor }}>{daysCover >= 365 ? "365+ d" : `${Math.round(daysCover)} d`}</b></div>
          <div><div style={{ color: C.faint }}>Lost / Q</div><b style={{ color: lostQ > 1 ? C.red : C.dim }}>{fmtNum(lostQ)}</b></div>
          <span style={{ color: C.violet, fontWeight: 800 }}>Open product →</span>
        </button>;
      })}
    </Panel>
  </div>;
}

const summaryTile: React.CSSProperties = { background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: 10, display: "grid", gap: 3 };

function DistributionPlaceholder({ world, openContract, removeContract, openProduct }: { world: any; openContract: () => void; removeContract: (i: number) => void; openProduct: (productId: string) => void }) {
  return (
    <div>
      <Panel title="🤝 Distribution Network">
        <div style={{ color: C.dim, fontSize: 13, marginBottom: 12 }}>This screen manages retailer relationships. Which retailers carry a specific SKU is changed inside that product's Sell / Analyze stage.</div>
        {world.player.contracts.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 13, marginBottom: 12 }}>No distribution contracts yet.</div>
        ) : <div style={{ display: "grid", gap: 7 }}>{world.player.contracts.map((c: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 9, fontSize: 12, alignItems: "center" }}>
            <div><b style={{ color: C.ink }}>{c.partnerName || c.type}</b><div style={{ color: C.faint, fontSize: 10.5, marginTop: 2 }}>{(c.marginCut * 100).toFixed(0)}% retailer cut · pays in {c.paymentDays ?? 60}d</div></div>
            <button style={ctrlBtn} onClick={() => removeContract(i)}>End contract</button>
          </div>
        ))}</div>}
        <button style={{ ...ctrlBtn, marginTop: 12, width: "100%" }} onClick={openContract}>+ Negotiate new retailer</button>
      </Panel>

      {world.player.skus.length > 0 && <Panel title="Routes to market by product">
        <div style={{ color: C.faint, fontSize: 11, marginBottom: 9 }}>Read-only overview. Open a product to change its channels.</div>
        {world.player.skus.map((sku: any) => {
          const partners = world.player.contracts.filter((c: any) => (sku.assignedPartnerIds ?? []).includes(c.partnerId));
          return <button key={sku.id} onClick={() => openProduct(sku.id)} style={{ width: "100%", border: 0, borderTop: `1px solid ${C.grid}`, background: "transparent", padding: "9px 0", display: "flex", justifyContent: "space-between", gap: 12, textAlign: "left", cursor: "pointer", color: C.ink }}><span><b>{sku.name}</b><span style={{ color: C.faint, fontSize: 10.5, marginLeft: 8 }}>{partners.map((p:any)=>p.partnerName).join(" · ") || "No retailer assigned"}</span></span><span style={{ color: C.violet, fontSize: 10.5, fontWeight: 800 }}>Open →</span></button>;
        })}
      </Panel>}
    </div>
  );
}

function AnalysisPlaceholder({ world }: { world: any }) {
  const live = world.live;
  return (
    <Panel title="📈 Analysis — by Brand & Product">
      {!live ? <div style={{ color: C.faint }}>No data yet.</div> : (
        <div className="data-table-scroll">
          <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ color: C.faint, textAlign: "right" }}><th style={{ textAlign: "left", padding: "6px 4px" }}>Product</th><th style={{ textAlign: "left" }}>Brand</th><th>Status</th><th>Inventory</th><th>Units Sold</th><th>Contribution</th></tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {world.player.skus.map((s: any, i: number) => {
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${C.grid}`, textAlign: "right" }}>
                    <td style={{ textAlign: "left", color: C.ink, padding: "8px 4px" }}>{s.name}</td>
                    <td style={{ textAlign: "left", color: brandById(world, s.brandId).color, fontWeight: 700 }}>{brandById(world, s.brandId).name}</td>
                    <td style={{ color: s.status === "active" ? C.green : s.status === "designing" ? C.amber : C.dim, fontSize: 11 }}>{s.status}</td>
                    <td style={{ color: C.dim }}>{Math.round(s.inventory).toLocaleString()}</td>
                    <td style={{ color: C.ink }}>{Math.round(s.unitsSoldTotal).toLocaleString()}</td>
                    <td style={{ color: (s.contributionTotal ?? 0) >= 0 ? C.green : C.red }}>{fmtMoney(s.contributionTotal ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
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
    <div>
      {world.activeCampaigns?.length > 0 && (
        <Panel title="Active Campaigns">
          {world.activeCampaigns.map((c: any) => {
            const target = world.savedSegments.find((s: any) => s.id === c.segmentId)?.name ?? "Audience";
            return <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, padding: "7px 0", borderBottom: `1px solid ${C.grid}` }}>
              <span style={{ color: C.ink }}><b>{c.name}</b><span style={{ color: C.faint }}> · {target}</span></span>
              <span style={{ color: C.cyan, fontFamily: "ui-monospace" }}>{c.daysRemaining}d left · {fmtMoney(c.budget)}</span>
            </div>;
          })}
        </Panel>
      )}

      <Panel title="Launch a Campaign">
        <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>Choose the audience first. The game then tells you which agency/media approach fits that audience instead of asking you to guess from vague copy.</div>
        {!hasMarketingTeam && <div style={{marginBottom:12,padding:9,border:"1px solid #fed7aa",background:"#fff7ed",borderRadius:8,color:C.amber,fontSize:10.5,fontWeight:700}}>! Marketing is locked until a Marketing specialist is seated in an office.</div>}

        <div style={campaignStep}><div style={campaignStepTitle}>1. TARGET AUDIENCE</div>
          {segs.length === 0 ? <div style={{ color: C.faint, fontSize: 12 }}>You have no saved audiences yet. <button style={{ ...ctrlBtn, marginLeft: 6 }} onClick={openSegments}>Create a segment</button></div> : <><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{segs.map((s: any) => <button key={s.id} onClick={() => { setCampSeg(s.id); setCampAgency(""); }} style={{ ...ctrlBtn, background: campSeg === s.id ? C.cyan : C.panel2, color: campSeg === s.id ? "#fff" : C.dim, borderColor: campSeg === s.id ? C.cyan : C.line }}>{s.name}</button>)}</div><button style={{ ...ctrlBtn, marginTop: 7 }} onClick={openSegments}>＋ Create / edit segments</button></>}
        </div>

        <div style={campaignStep}><div style={campaignStepTitle}>2. WHAT ARE YOU PROMOTING?</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <button onClick={() => setCampScope("company")} style={{ ...ctrlBtn, background: campScope === "company" ? C.violet : C.panel2, color: campScope === "company" ? "#fff" : C.dim }}>🏢 {world.company}</button>
            {world.brands.map((b: any) => { const scope = `brand:${b.id}`; return <button key={b.id} onClick={() => setCampScope(scope)} style={{ ...ctrlBtn, background: campScope === scope ? b.color : C.panel2, color: campScope === scope ? "#fff" : C.dim }}>🏷 {b.name}</button>; })}
            {world.player.skus.filter((s: any) => s.releasedToMarket || s.status === "active").map((s: any) => <button key={s.id} onClick={() => setCampScope(s.id)} style={{ ...ctrlBtn, background: campScope === s.id ? C.violet : C.panel2, color: campScope === s.id ? "#fff" : C.dim }}>📦 {s.name}</button>)}
          </div>
        </div>

        <div style={campaignStep}><div style={campaignStepTitle}>3. MEDIA / AGENCY FIT FOR {segName?.toUpperCase() ?? "YOUR TARGET"}</div>
          {!selectedSeg ? <div style={{ color: C.faint, fontSize: 12 }}>Choose a target audience first.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 8 }}>
            {rankedAgencies.map(({a, fit, rel}: any) => {
              const on = campAgency === a.id; const stars = agencyFitStars(fit); const fitLabel = agencyFitLabel(fit);
              return <button key={a.id} onClick={() => setCampAgency(a.id)} style={{ textAlign: "left", background: on ? "#f2fbff" : C.bg, border: `1px solid ${on ? C.cyan : C.line}`, borderRadius: 10, padding: 12, cursor: "pointer", color: C.ink }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 7 }}><b style={{ fontSize: 12.5 }}>{a.name}</b><span style={{ color: stars >= 4 ? C.green : stars <= 2 ? C.red : C.amber, fontSize: 10, fontWeight: 900 }}>{"★".repeat(stars)}{"☆".repeat(5-stars)}</span></div>
                <div style={{ color: C.dim, fontSize: 10.5, marginTop: 3 }}>{a.specialization}</div>
                <div style={{ color: stars >= 4 ? C.green : stars <= 2 ? C.red : C.amber, fontSize: 10, fontWeight: 800, marginTop: 5 }}>{fitLabel}</div>
                <div style={{ color: C.faint, fontSize: 9.5, marginTop: 5 }}>Cost ×{a.baseCostMult.toFixed(1)} · execution ×{a.effectivenessMult.toFixed(1)} · relationship {rel}</div>
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
      </Panel>

      <Panel title="Always-on marketing">
        <div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>Optional background spend between campaigns. Audience and spend are managed here so Segments stays purely about defining customer groups.</div>
        <div style={{ marginBottom: 11 }}><div style={campaignStepTitle}>ALWAYS-ON TARGET</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}><button onClick={() => setFocus("all")} style={{ ...ctrlBtn, background: world.player.marketingFocus === "all" ? C.cyan : C.panel2, color: world.player.marketingFocus === "all" ? "#fff" : C.dim }}>All customers</button>{segs.map((s: any) => { const key = `seg:${s.id}`; const on = world.player.marketingFocus === key; return <button key={s.id} onClick={() => setFocus(key)} style={{ ...ctrlBtn, background: on ? C.cyan : C.panel2, color: on ? "#fff" : C.dim }}>{s.name}</button>; })}<button style={{ ...ctrlBtn }} onClick={openSegments}>＋ Audience</button></div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          <AlwaysOnPresets label="Performance / Q" value={world.player.marketingTarget} onChange={setMarketing} disabled={!hasMarketingTeam} />
          <AlwaysOnPresets label="Brand / Q" value={world.player.brandMarketingTarget} onChange={setBrandMarketing} disabled={!hasMarketingTeam} />
        </div>
      </Panel>
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
        button{transition:filter .12s,transform .08s,background .12s,border-color .12s,box-shadow .12s;}
        button:hover{filter:brightness(1.02);}button:active{transform:translateY(1px) scale(.992);}
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
        .left-rail{position:fixed;z-index:45;left:14px;top:92px;display:grid;gap:6px;padding:6px;background:linear-gradient(180deg,rgba(14,55,92,.96),rgba(7,34,61,.97));border:1px solid rgba(150,207,244,.24);border-radius:14px;box-shadow:0 12px 32px rgba(5,30,54,.26)}.left-rail button{position:relative;width:58px;min-height:52px;border:1px solid transparent;background:transparent;color:#b6cede;border-radius:10px;display:grid;place-items:center;align-content:center;gap:1px;cursor:pointer}.left-rail button span{font-size:17px}.left-rail button small{font-size:7.5px;font-weight:850}.left-rail button i{position:absolute;right:3px;top:3px;background:#ef4444;color:#fff;border-radius:99px;min-width:16px;height:16px;padding:0 4px;display:grid;place-items:center;font-style:normal;font-size:8px;font-weight:900}.left-rail button:hover{background:rgba(255,255,255,.07);color:#fff}.left-rail button.active{background:linear-gradient(180deg,#229ce7,#147cc4);border-color:#64c8ff;color:#fff}
        .task-pill{border:1px solid rgba(119,208,255,.36);background:rgba(24,105,163,.24);color:#e9f7ff;border-radius:10px;padding:5px 8px;display:grid;grid-template-columns:auto auto;column-gap:5px;row-gap:0;align-items:center;cursor:pointer;min-width:125px;text-align:left}.task-pill span{grid-row:1/3;font-size:15px}.task-pill b{font-size:8.5px;line-height:1.1}.task-pill em{font-style:normal;color:#9fd4f2;font-size:7.8px;line-height:1.1}.task-pill:hover{background:rgba(31,135,205,.38)}
        .screen-overlay{position:fixed;z-index:70;inset:72px 0 0 0;background:rgba(5,24,42,.25);backdrop-filter:blur(2px);display:flex;justify-content:flex-end;padding:14px}.overlay-card{width:min(1050px,calc(100vw - 105px));height:calc(100vh - 100px);background:#f4f8fc;border:1px solid #b9cfdf;border-radius:17px;box-shadow:0 24px 65px rgba(4,25,46,.30);display:flex;flex-direction:column;overflow:hidden}.overlay-head{background:#fff;padding:15px 18px 12px;border-bottom:1px solid ${C.line};display:flex;justify-content:space-between;gap:16px;align-items:start}.overlay-head h1{margin:3px 0 4px;font-size:23px}.overlay-head p{margin:0;color:${C.dim};font-size:11.5px;max-width:700px}.overlay-close{border:1px solid ${C.line};background:${C.panel2};color:${C.navy};border-radius:9px;width:34px;height:34px;cursor:pointer;font-weight:900}.overlay-tabs{display:flex;gap:5px;padding:8px 14px;background:#eef4f9;border-bottom:1px solid ${C.line};overflow-x:auto}.overlay-tabs button{border:1px solid ${C.line};background:white;color:${C.dim};border-radius:8px;padding:6px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer}.overlay-tabs button.active{background:${C.violet};border-color:${C.violet};color:white}.overlay-body{padding:14px 16px 24px;overflow-y:auto;flex:1}.event-toast{position:fixed;z-index:80;left:88px;bottom:18px;max-width:min(650px,calc(100vw - 120px));background:#fff6d8;border:1px solid #eacb6b;color:#6b4a03;border-radius:10px;padding:9px 11px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 26px rgba(86,59,3,.16);font-size:11px;font-weight:700}.event-toast button{border:0;background:transparent;color:#6b4a03;cursor:pointer;font-weight:900}

        .bottom-dock{position:fixed;z-index:60;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:3px;padding:5px;background:linear-gradient(180deg,rgba(14,55,92,.97),rgba(7,34,61,.98));backdrop-filter:blur(16px);border:1px solid rgba(150,207,244,.24);border-radius:16px;box-shadow:0 14px 34px rgba(5,30,54,.30),inset 0 1px 0 rgba(255,255,255,.09)}.bottom-dock button{position:relative;width:78px;height:54px;border:1px solid transparent;background:transparent;color:#aac4d8;border-radius:11px;display:grid;place-items:center;align-content:center;gap:1px;cursor:pointer}.bottom-dock button span{font-size:18px;line-height:20px;filter:saturate(.8)}.bottom-dock button small{font-size:8.5px;font-weight:850;letter-spacing:.1px}.bottom-dock button:hover{background:rgba(255,255,255,.055);color:#fff}.bottom-dock button.active{background:linear-gradient(180deg,#229ce7,#147cc4);border-color:#64c8ff;color:white;box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 5px 14px rgba(5,95,157,.35)}.bottom-dock button.active:after{content:'';position:absolute;bottom:3px;left:31%;right:31%;height:2px;border-radius:2px;background:#c8efff}.bottom-dock button.active small{color:white}
        .more-backdrop{position:fixed;z-index:55;inset:0;background:rgba(4,20,36,.30);backdrop-filter:blur(2px);border:0}.more-sheet{position:fixed;z-index:58;left:50%;bottom:78px;transform:translateX(-50%);width:min(760px,calc(100vw - 28px));background:linear-gradient(180deg,#123c64,#0b2b4b);border:1px solid rgba(140,202,241,.24);border-radius:16px;padding:14px;box-shadow:0 20px 52px rgba(3,23,42,.38),inset 0 1px 0 rgba(255,255,255,.08);color:#fff}.more-sheet-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.more-sheet-head>div{display:grid}.more-sheet-head b{font-size:13px}.more-sheet-head small{font-size:9.5px;color:#9fc0d8;margin-top:2px}.more-sheet-head button{background:rgba(255,255,255,.08)!important;color:#fff!important;border-color:rgba(255,255,255,.14)!important}.more-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.more-grid button{border:1px solid rgba(150,207,244,.18);background:rgba(7,30,53,.52);color:#fff;border-radius:11px;padding:11px;text-align:left;cursor:pointer;display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:start}.more-grid button:hover{background:rgba(35,112,169,.36);border-color:rgba(113,201,255,.36)}.more-grid button>span{font-size:19px;grid-row:1/3}.more-grid button b{font-size:10.5px}.more-grid button small{font-size:8.5px;line-height:1.35;color:#9fc0d8;margin-top:2px}

        .hub-pulse{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:14px}.hub-pulse>div{background:linear-gradient(180deg,#fff,#f6faff);border:1px solid ${C.line};border-radius:12px;padding:12px;box-shadow:0 4px 13px rgba(20,53,84,.05)}.hub-pulse small{display:block;text-transform:uppercase;color:${C.faint};font-size:8px;font-weight:850;letter-spacing:.65px}.hub-pulse b{display:block;font-family:ui-monospace,monospace;font-size:21px;margin-top:3px;color:${C.navy}}
        .hub-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hub-cards button{background:linear-gradient(180deg,#fff,#f7fbff);border:1px solid ${C.line};border-radius:14px;padding:16px;text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;cursor:pointer;box-shadow:0 5px 17px rgba(20,53,84,.05)}.hub-cards button:hover{border-color:#9fc8e5;box-shadow:0 7px 22px rgba(20,89,140,.09)}.hub-cards button>span{font-size:26px}.hub-cards b{font-size:13px}.hub-cards p{color:${C.dim};font-size:10.5px;line-height:1.5;margin:5px 0 0}.hub-cards i{font-style:normal;color:${C.cyan};font-size:18px}
        @media(max-width:780px){.campus-world{left:0;top:108px}.left-rail{top:auto;bottom:8px;left:8px;right:8px;display:flex;justify-content:space-between}.left-rail button{width:auto;flex:1;min-height:46px}.left-rail button small{font-size:7px}.screen-overlay{inset:108px 0 0;padding:6px}.overlay-card{width:100%;height:calc(100vh - 120px);border-radius:13px}.event-toast{left:8px;right:8px;bottom:66px;max-width:none}}
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
          .left-rail{top:auto!important;bottom:max(5px,env(safe-area-inset-bottom))!important;left:5px!important;right:5px!important;padding:4px!important;gap:1px!important;display:flex!important;border-radius:13px!important;z-index:65}.left-rail button{width:auto!important;flex:1 1 0;min-width:0;min-height:49px!important;padding:2px 0!important;border-radius:9px}.left-rail button span{font-size:15px!important}.left-rail button small{font-size:6.3px!important;max-width:100%;overflow:hidden;text-overflow:ellipsis}.left-rail button i{right:1px;top:1px;min-width:14px;height:14px;font-size:7px;padding:0 3px}
          .screen-overlay{inset:96px 0 calc(58px + env(safe-area-inset-bottom)) 0!important;padding:0!important;align-items:stretch;background:rgba(5,24,42,.34)}.overlay-card{width:100%!important;height:100%!important;max-height:none!important;border-radius:0!important;border-left:0;border-right:0;box-shadow:none}.overlay-head{padding:10px 11px 8px;gap:8px;position:sticky;top:0;z-index:5}.overlay-head h1{font-size:18px;margin:2px 0}.overlay-head p{font-size:9.5px;line-height:1.35;max-width:none}.screen-eyebrow{font-size:7px}.overlay-close{width:40px;height:40px;min-width:40px;font-size:14px}.overlay-tabs{padding:6px 8px;gap:4px;position:sticky;top:61px;z-index:4}.overlay-tabs button{min-height:36px;padding:6px 9px;font-size:9px}.overlay-body{padding:9px 8px calc(18px + env(safe-area-inset-bottom));overscroll-behavior:contain}.overlay-body>div{max-width:100%}
          .event-toast{left:6px!important;right:6px!important;bottom:calc(62px + env(safe-area-inset-bottom))!important;max-width:none!important;padding:8px 9px;font-size:9.5px}
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
      `}</style>
      {children}
    </div>
  );
}

