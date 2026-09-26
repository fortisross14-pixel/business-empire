import React, { useEffect, useState } from "react";
import { C, UI, bigBtn, ctrlBtn, fmtMoney, fmtNum } from "../theme";
import { FieldLabel, LineChart, NumberInput, StarRating } from "../components";
import type { SKU, World } from "../../engine/types";
import { DESIGN_DEPTHS, PRODUCT_PROJECT_TIERS } from "../../engine/types";
import { canCreateProduct, canProduce, maxManufacturableBatch, productionLeadDays, factoryCapacity, productionCapacity, warehouseUnitCapacity, inventoryUsedForStorageProfile } from "../../engine/capacity";
import { manufacturingStandard, qualityToStars } from "../../engine/productDesign";
import { deriveQuality, deriveUnitCost } from "../../engine/economics";
import { supplierById, suppliersForProduct } from "../../engine/suppliers";
import { archetypeByKey, storageSpaceForProduct } from "../../engine/productCatalog";
import { TESTING_LEVELS } from "../../engine/productDynamics";
import { channelMixForSku, distributionMetricsForSku } from "../../engine/distribution";
import { brandById } from "../../engine/brands";
import { INDUSTRIES } from "../../engine/industries";
import { ProductVisualCard } from "../visualIdentity";
import { launchReadiness } from "../../engine/roadmap";

interface ActionResult { ok: boolean; reason?: string }
type PortfolioFilter = "portfolio" | "live" | "pipeline" | "archive";

type Stage = "design" | "manufacture" | "manufacturing" | "sell" | "analyze";

function stageOf(sku: SKU): Stage {
  if (sku.status === "designing") return "design";
  if (sku.status === "designed") return "manufacture";
  if (sku.status === "manufacturing") return "manufacturing";
  if (sku.status === "active" && !sku.releasedToMarket) return "sell";
  return "analyze";
}

const STAGE_META: Record<Stage, { label: string; icon: string; color: string; blurb: string }> = {
  design: { label: "DESIGN", icon: "✏️", color: C.amber, blurb: "The product team is developing the proposition." },
  manufacture: { label: "MANUFACTURE", icon: "🏭", color: C.cyan, blurb: "Design approved. Choose how to make the first batch." },
  manufacturing: { label: "MANUFACTURING", icon: "⚙️", color: C.cyan, blurb: "The first batch is in production." },
  sell: { label: "SELL", icon: "🚀", color: C.violet, blurb: "Inventory is ready. Set the commercial launch." },
  analyze: { label: "ANALYZE", icon: "📈", color: C.green, blurb: "Live in market. Learn, replenish and iterate." },
};

export function ProductsView({ world, produce, setProductPrice, setProductQuality, setProductionSetup, assignPartner, openContract, openCreator, commissionStudy, releaseProduct, retargetProduct, discardProduct, setProductArchived, openMarketing, openSegments, focusProductId, onFocusHandled }: {
  world: World;
  produce: (si: number, qty: number) => void;
  setProductPrice: (si: number, price: number) => void;
  setProductQuality: (si: number, stars: number) => void;
  setProductionSetup: (si: number, method: "own" | "outsource", supplierId?: string | null) => void;
  assignPartner: (si: number, partnerId: string, assign: boolean) => void;
  openContract: () => void;
  openCreator: (baseSkuId?: string) => void;
  commissionStudy: (skuId: string) => void;
  releaseProduct: (si: number, segmentId: string, launchBudget?: number) => ActionResult;
  retargetProduct: (si: number, segmentId: string) => boolean;
  discardProduct: (si: number) => boolean;
  setProductArchived: (si: number, archived: boolean, liquidate?: boolean) => ActionResult;
  openMarketing: () => void;
  openSegments: () => void;
  focusProductId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PortfolioFilter>("portfolio");
  const check = canCreateProduct(world);
  const skus = world.player.skus;
  const liveCount = skus.filter((s) => !s.archived && s.releasedToMarket).length;
  const readyCount = skus.filter((s) => !s.archived && (stageOf(s) === "sell" || stageOf(s) === "manufacture")).length;
  const archivedCount = skus.filter((s) => s.archived).length;
  const visible = skus.map((sku, si) => ({ sku, si })).filter(({ sku }) => filter === "archive" ? sku.archived : !sku.archived && (filter === "portfolio" || (filter === "live" ? sku.releasedToMarket : !sku.releasedToMarket)));
  const selectedIndex = selectedId ? skus.findIndex((s) => s.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? skus[selectedIndex] : null;
  useEffect(() => {
    if (focusProductId && skus.some((s) => s.id === focusProductId)) {
      setSelectedId(focusProductId);
      onFocusHandled?.();
    }
  }, [focusProductId, skus, onFocusHandled]);

  return <div className="product-portfolio-view">
    <style>{productPortfolioCss}</style>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ color: C.ink, fontSize: 18, fontWeight: 900 }}>Product portfolio</div>
        <div style={{ color: C.faint, fontSize: 11, marginTop: 2 }}>{skus.length - archivedCount} current · {liveCount} live · {readyCount} awaiting a decision · {archivedCount} archived</div>
      </div>
      <div style={{ display: "grid", gap: 4, justifyItems: "end" }}><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} onClick={() => openCreator()} style={{ ...bigBtn, opacity: check.ok ? 1 : .45 }}>＋ Design a product</button>{!check.ok && <ActionReason>{check.reason}</ActionReason>}</div>
    </div>

    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{([[
      "portfolio", "Portfolio", skus.length - archivedCount], ["live", "On market", liveCount], ["pipeline", "Pipeline", skus.length - archivedCount - liveCount], ["archive", "Archive", archivedCount],
    ] as [PortfolioFilter,string,number][]).map(([id,label,count]) => <button key={id} onClick={() => setFilter(id)} style={{ ...ctrlBtn, borderColor: filter === id ? C.violet : C.line, color: filter === id ? C.violet : C.dim, background: filter === id ? `${C.violet}0c` : "white" }}>{label} · {count}</button>)}</div>

    {visible.length === 0 ? <div style={{ border: `1px dashed ${C.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: C.dim }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>{filter === "archive" ? "🗄" : "📦"}</div>
      <b>{skus.length === 0 ? "No products yet." : filter === "archive" ? "The archive is empty." : "No products in this view."}</b><div style={{ fontSize: 11, marginTop: 5 }}>{skus.length === 0 ? (check.ok ? "Start with a product brief." : check.reason) : "Use the filters above to change the portfolio view."}</div>
    </div> : <div className="product-portfolio-grid">
      {visible.map(({ sku, si }) => {
        const stage = stageOf(sku); const meta = sku.archived ? { ...STAGE_META.analyze, label: "ARCHIVED", icon: "📁", color: C.faint, blurb: "Commercial history retained outside the active operating portfolio." } : STAGE_META[stage]; const r = world.live?.skuResults?.[si];
        return <button className={`product-portfolio-card rarity-${sku.rarity}`} key={sku.id} onClick={() => setSelectedId(sku.id)} style={{ textAlign: "left", cursor: "pointer", background: sku.archived ? "linear-gradient(180deg,#fafafa,#f1f5f9)" : "linear-gradient(180deg,#fff,#f7fafc)", border: `1px solid ${C.line}`, borderRadius: UI.radius.lg, padding: 13, color: C.ink, boxShadow: UI.shadow.card, transition: "transform .12s, box-shadow .12s, border-color .12s", opacity: sku.archived ? .78 : 1 }}>
          <div className="product-card-head">
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</div><div style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{archetypeByKey(sku.productKey)?.label ?? sku.productKey} · V{sku.version ?? 1} · {sku.targetLabel ?? "Broad market"}</div></div>
            <span style={{ flex: "0 0 auto", color: meta.color, background: `${meta.color}14`, border: `1px solid ${meta.color}40`, borderRadius: 999, padding: "5px 8px", fontSize: 8.8, fontWeight: 900, letterSpacing: .55 }}>{meta.label}</span>
          </div>
          <div className="product-card-body">
            <div className="product-card-art"><ProductVisualCard world={world} sku={sku} size={152} showLabels={false} /></div>
            <div className="product-card-copy">
              <div style={{ color: C.dim, fontSize: 10.8, lineHeight: 1.45 }}>{meta.blurb}</div>
              {stage === "analyze" && !sku.archived && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12, fontSize: 9.7 }}><span><b>{((r?.units ?? 0)/90).toFixed((r?.units ?? 0)/90 < 10 ? 1 : 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>units/day</small></span><span><b>{fmtMoney(r?.revenue ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>revenue/Q</small></span><span style={{ color: (r?.margin ?? 0) >= 0 ? C.green : C.red }}><b>{fmtMoney(r?.margin ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>contribution/Q</small></span></div>}
              {sku.archived && <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 12, fontSize: 9.7 }}><span><b>{fmtNum(sku.unitsSoldTotal ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>lifetime units</small></span><span><b>{fmtMoney(sku.contributionTotal ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>lifetime contribution</small></span></div>}
              {stage === "sell" && <div style={{ color: C.violet, fontSize: 10.8, marginTop: 11 }}><b>{fmtNum(sku.inventory)}</b> units waiting in warehouse</div>}
            </div>
          </div>
        </button>;
      })}
    </div>}

    {selected && <ProductDetailModal key={selected.id} world={world} sku={selected} si={selectedIndex} onClose={() => setSelectedId(null)} selectProduct={setSelectedId} produce={produce} setProductPrice={setProductPrice} setProductQuality={setProductQuality} setProductionSetup={setProductionSetup} assignPartner={assignPartner} openContract={openContract} openCreator={openCreator} commissionStudy={commissionStudy} releaseProduct={releaseProduct} retargetProduct={retargetProduct} discardProduct={discardProduct} setProductArchived={setProductArchived} openMarketing={openMarketing} openSegments={openSegments} />}
  </div>;
}

type WorkspaceTab = "summary" | "versions" | "sales" | "market" | "operations";

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; note: string; color: string }[] = [
  { id: "summary", label: "Summary", note: "What matters now", color: "#20a9f6" },
  { id: "versions", label: "Versions", note: "Product lineage", color: "#8b5cf6" },
  { id: "sales", label: "Sales", note: "Actual performance", color: "#16b87a" },
  { id: "market", label: "Market", note: "Audience & rivals", color: "#f29b38" },
  { id: "operations", label: "Operations", note: "Make changes", color: "#ec5f74" },
];

function ProductDetailModal({ world, sku, si, onClose, selectProduct, produce, setProductPrice, setProductQuality, setProductionSetup, assignPartner, openContract, openCreator, commissionStudy, releaseProduct, retargetProduct, discardProduct, setProductArchived, openMarketing, openSegments }: {
  world: World; sku: SKU; si: number; onClose: () => void; selectProduct: (id: string) => void;
  produce: (si: number, qty: number) => void; setProductPrice: (si: number, price: number) => void; setProductQuality: (si: number, stars: number) => void; setProductionSetup: (si: number, method: "own" | "outsource", supplierId?: string | null) => void;
  assignPartner: (si: number, partnerId: string, assign: boolean) => void; openContract: () => void; openCreator: (baseSkuId?: string) => void; commissionStudy: (skuId: string) => void;
  releaseProduct: (si: number, segmentId: string, launchBudget?: number) => ActionResult; retargetProduct: (si: number, segmentId: string) => boolean; discardProduct: (si: number) => boolean; setProductArchived: (si: number, archived: boolean, liquidate?: boolean) => ActionResult; openMarketing: () => void; openSegments: () => void;
}) {
  const stage = stageOf(sku); const meta = STAGE_META[stage]; const r = world.live?.skuResults?.[si] ?? {};
  const [tab, setTab] = useState<WorkspaceTab>(stage === "analyze" || sku.archived ? "summary" : "operations");
  const [salesPeriod, setSalesPeriod] = useState<7 | 30 | 90 | 360>(30);
  const [price, setPrice] = useState(sku.listPrice);
  const [segment, setSegment] = useState(segmentIdFor(world, sku));
  const [launchBudget, setLaunchBudget] = useState(25_000);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [batch, setBatch] = useState(5_000);
  const [mfgStars, setMfgStars] = useState(sku.manufacturingStars ?? qualityToStars(sku.quality));
  const [method, setMethod] = useState<"own" | "outsource">(sku.method);
  const [supplierId, setSupplierId] = useState(sku.supplierId ?? suppliersForProduct(sku.productKey)[0]?.id ?? "");
  const manufactureQuote = getManufacturingQuote(world, sku, method, supplierId, mfgStars, batch);
  const maxBatch = manufactureQuote.maxBatch;
  useEffect(() => { if (maxBatch > 0 && batch > maxBatch) setBatch(maxBatch); }, [maxBatch, batch]);

  const saveManufacturing = () => { setProductionSetup(si, method, method === "outsource" ? supplierId : null); setProductQuality(si, mfgStars); };
  const orderBatch = () => { if (!manufactureQuote.check.ok) return; saveManufacturing(); produce(si, batch); };
  const launch = () => { setProductPrice(si, price); const result = releaseProduct(si, segment, launchBudget); setMessage(result.ok ? "Product launched." : result.reason ?? "Could not launch."); };

  const archiveRecovery = Math.round(sku.inventory * sku.unitCost * .25);

  const history = sku.salesHistory ?? [];
  const last7 = history.slice(-7);
  const week = summarizeHistory(last7);
  const dailyUnits = last7.length ? week.units / last7.length : 0;
  const daysCover = dailyUnits > .001 ? sku.inventory / dailyUnits : null;
  const stageAction = stage === "design" ? "Review design progress" : stage === "manufacture" ? "Order the first batch" : stage === "manufacturing" ? "Track production" : stage === "sell" ? "Complete the launch" : "Run the product";

  return <div className="product-detail-backdrop pw-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <style>{productWorkspaceCss}</style>
    <section className="product-detail-card pw-shell" role="dialog" aria-modal="true" aria-label={`${sku.name} product workspace`}>
      <header className="pw-topbar">
        <div className="pw-breadcrumb"><span>PRODUCT PORTFOLIO</span><i>›</i><span>{archetypeByKey(sku.productKey)?.label ?? sku.productKey}</span><i>›</i><b>{sku.name} · V{sku.version ?? 1}</b></div>
        <button className="pw-close" aria-label="Close product workspace" onClick={onClose}>×</button>
      </header>

      <div className="pw-hero">
        <div className="pw-product-art"><ProductVisualCard world={world} sku={sku} size={224} showLabels={false} /></div>
        <div className="pw-identity">
          <div className="pw-kicker">{sku.archived ? "ARCHIVED PRODUCT" : `${meta.label} STAGE`} · {brandById(world, sku.brandId)?.name ?? "HOUSE BRAND"}</div>
          <h1>{sku.name}</h1>
          <p>{archetypeByKey(sku.productKey)?.label ?? sku.productKey} · Version {sku.version ?? 1} · {sku.targetLabel ?? "Broad market"}</p>
          <div className="pw-hero-stats">
            <HeroStat label="Customer rating" value={`${(sku.reviewScore ?? 1).toFixed(1)}`} detail="out of 5" accent="#ffd166" />
            <HeroStat label="Last 7 days" value={fmtNum(week.units)} detail={`${fmtMoney(week.netRevenue)} net sales`} accent="#55d7a2" />
            <HeroStat label="Inventory" value={fmtNum(sku.inventory)} detail={daysCover == null ? "No recent demand" : `${Math.round(daysCover)} days cover`} accent="#72c7ff" />
          </div>
        </div>
        <aside className="pw-action-stack">
          <small>PRODUCT ACTIONS</small>
          {sku.archived ? <>
            <GraphicAction asset="/assets/ui/actions/new-version.png" label={`Design V${(sku.version ?? 1) + 1}`} tone="#7c5ce7" onClick={() => openCreator(sku.id)} />
            <button className="pw-action-plain" onClick={() => { const result = setProductArchived(si, false); if (result.ok) onClose(); else setMessage(result.reason ?? "Could not restore product."); }}>Restore to portfolio</button>
          </> : stage !== "analyze" ? <button className="pw-stage-action" onClick={() => setTab("operations")}><WorkspaceIcon id="operations" /><span><b>{stageAction}</b><em>{meta.blurb}</em></span></button> : <>
            <GraphicAction asset="/assets/ui/actions/campaign.png" label="Adjust campaign" tone="#1c9cc7" onClick={openMarketing} />
            <GraphicAction asset="/assets/ui/actions/new-version.png" label={`Design V${(sku.version ?? 1) + 1}`} tone="#7c5ce7" onClick={() => openCreator(sku.id)} />
            <button className="pw-action-plain" onClick={() => setTab("operations")}>Price, supply & channels</button>
          </>}
        </aside>
      </div>

      <nav className="pw-tabs" aria-label="Product workspace sections">
        {WORKSPACE_TABS.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} style={{ "--tab-color": item.color } as React.CSSProperties} onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}><WorkspaceIcon id={item.id} /><span><b>{item.label}</b><small>{item.note}</small></span></button>)}
      </nav>

      <main className="pw-content">
        {tab === "summary" && <ProductSummary world={world} sku={sku} week={week} dailyUnits={dailyUnits} daysCover={daysCover} goTo={setTab} commissionStudy={() => commissionStudy(sku.id)} openCreator={() => openCreator(sku.id)} />}
        {tab === "versions" && <ProductVersions world={world} sku={sku} selectProduct={selectProduct} openCreator={() => openCreator(sku.id)} />}
        {tab === "sales" && <ProductSales world={world} sku={sku} period={salesPeriod} setPeriod={setSalesPeriod} />}
        {tab === "market" && <ProductMarket world={world} sku={sku} goTo={setTab} />}
        {tab === "operations" && <div className="pw-stage">
          {sku.archived ? <ArchivedOperations sku={sku} restore={() => { const result = setProductArchived(si, false); if (result.ok) onClose(); else setMessage(result.reason ?? "Could not restore product."); }} redesign={() => openCreator(sku.id)} /> : <>
            <StageRail stage={stage} />
            {stage === "design" && <DesignStage world={world} sku={sku} discard={() => { if (discardProduct(si)) onClose(); }} />}
            {stage === "manufacture" && <ManufactureStage world={world} sku={sku} method={method} setMethod={setMethod} supplierId={supplierId} setSupplierId={setSupplierId} mfgStars={mfgStars} setMfgStars={setMfgStars} batch={batch} setBatch={setBatch} quote={manufactureQuote} orderBatch={orderBatch} discard={() => { if (discardProduct(si)) onClose(); }} />}
            {stage === "manufacturing" && <ManufacturingStage world={world} sku={sku} />}
            {stage === "sell" && <SellStage world={world} sku={sku} si={si} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} launchBudget={launchBudget} setLaunchBudget={setLaunchBudget} assignPartner={assignPartner} openContract={openContract} launch={launch} openSegments={openSegments} />}
            {stage === "analyze" && <AnalyzeStage world={world} sku={sku} si={si} r={r} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} setProductPrice={setProductPrice} retargetProduct={retargetProduct} assignPartner={assignPartner} openContract={openContract} batch={batch} setBatch={setBatch} produce={produce} commissionStudy={() => commissionStudy(sku.id)} newVersion={() => openCreator(sku.id)} openMarketing={openMarketing} openSegments={openSegments} />}
            {stage !== "design" && stage !== "manufacturing" && <div className="pw-housekeeping"><b>Portfolio housekeeping</b><p>Archive a product you no longer plan to operate. Its commercial history and market learning remain available.</p>{confirmArchive ? <div className="pw-confirm"><b>{sku.inventory > 0 ? `Clear ${fmtNum(sku.inventory)} units and archive?` : "Archive this SKU?"}</b><p>{sku.inventory > 0 ? `Clearance recovers ${fmtMoney(archiveRecovery)} (25% of inventory cost). The remainder is written off.` : "The SKU stops selling and leaves active portfolio views."}</p><div><button onClick={() => setConfirmArchive(false)}>Cancel</button><button onClick={() => { const result = setProductArchived(si, true, sku.inventory > 0); if (result.ok) onClose(); else setMessage(result.reason ?? "Could not archive product."); }}>Confirm archive</button></div></div> : <button disabled={(sku.mfgBatchSize ?? 0) > 0} title={(sku.mfgBatchSize ?? 0) > 0 ? "Wait for the inbound batch before archiving." : undefined} onClick={() => setConfirmArchive(true)}>{sku.inventory > 0 ? `Clear stock & archive · recover ${fmtMoney(archiveRecovery)}` : "Archive product"}</button>}</div>}
          </>}
        </div>}
        {message && <div className="pw-message">{message}</div>}
      </main>
    </section>
  </div>;
}

interface HistorySummary { units: number; netRevenue: number; contribution: number }

function summarizeHistory(history: NonNullable<SKU["salesHistory"]>): HistorySummary {
  return history.reduce((total, point) => ({ units: total.units + point.units, netRevenue: total.netRevenue + point.netRevenue, contribution: total.contribution + point.contribution }), { units: 0, netRevenue: 0, contribution: 0 });
}

function HeroStat({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return <div style={{ "--metric-accent": accent } as React.CSSProperties}><small>{label}</small><b>{value}</b><span>{detail}</span></div>;
}

function WorkspaceIcon({ id }: { id: WorkspaceTab }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <span className="pw-icon"><svg viewBox="0 0 24 24" aria-hidden="true">
    {id === "summary" && <g {...common}><path d="M4 18V9M10 18V5M16 18v-7M3 19h18"/><circle cx="16" cy="7" r="2.5"/></g>}
    {id === "versions" && <g {...common}><rect x="4" y="4" width="11" height="11" rx="2"/><path d="M9 19h9a2 2 0 0 0 2-2V8"/><path d="m8 9 2 2 4-4"/></g>}
    {id === "sales" && <g {...common}><path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-7"/><path d="M16 6h3v3"/></g>}
    {id === "market" && <g {...common}><circle cx="11" cy="11" r="7"/><path d="M11 4v7h7M16.5 16.5 21 21"/></g>}
    {id === "operations" && <g {...common}><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/><circle cx="14" cy="7" r="2"/><circle cx="6" cy="17" r="2"/></g>}
  </svg></span>;
}

function GraphicAction({ asset, label, tone, detail, onClick, disabled }: { asset: string; label: string; tone: string; detail?: string; onClick: () => void; disabled?: boolean }) {
  return <button className="pw-graphic-action" style={{ "--action-tone": tone } as React.CSSProperties} onClick={onClick} disabled={disabled}><img src={asset} alt="" /><span><b>{label}</b>{detail && <small>{detail}</small>}</span><i>›</i></button>;
}

function ProductSummary({ world, sku, week, dailyUnits, daysCover, goTo, commissionStudy, openCreator }: { world: World; sku: SKU; week: HistorySummary; dailyUnits: number; daysCover: number | null; goTo: (tab: WorkspaceTab) => void; commissionStudy: () => void; openCreator: () => void }) {
  const history = sku.salesHistory ?? [];
  const recent = history.slice(-30);
  const weeklyContribution = week.contribution;
  const studyInFlight = world.studies.some((study: any) => study.type === "product_diagnosis" && study.skuId === sku.id && !study.done);
  const next = !sku.releasedToMarket
    ? { title: "Move this product forward", copy: `${STAGE_META[stageOf(sku)].blurb} Open Operations for the exact decision required now.`, asset: "/assets/ui/actions/produce.png", label: "Open operations", action: () => goTo("operations"), tone: "#e96572" }
    : sku.inventory <= 0 || (daysCover != null && daysCover < 14)
      ? { title: sku.inventory <= 0 ? "You are out of stock" : "Inventory is running low", copy: daysCover == null ? "Demand cannot convert without available stock." : `At the recent pace, stock covers roughly ${Math.max(0, Math.round(daysCover))} days.`, asset: "/assets/ui/actions/produce.png", label: "Plan a production batch", action: () => goTo("operations"), tone: "#ef655f" }
      : weeklyContribution < 0
        ? { title: "Sales are destroying value", copy: `The last seven recorded days generated ${fmtMoney(weeklyContribution)} contribution. Inspect channel cuts and unit economics before scaling.`, asset: "/assets/ui/actions/market-study.png", label: "Inspect sales economics", action: () => goTo("sales"), tone: "#f29b38" }
        : !sku.marketStudy
          ? { title: "Turn launch results into learning", copy: "A market study explains audience, price, channel and product-fit gaps. It does not magically improve this version.", asset: "/assets/ui/actions/market-study.png", label: studyInFlight ? "Study in progress" : "Commission market study", action: commissionStudy, tone: "#1d9dcd", disabled: studyInFlight }
          : { title: "Build on what the market taught you", copy: sku.marketStudy.headline, asset: "/assets/ui/actions/new-version.png", label: `Design version ${(sku.version ?? 1) + 1}`, action: openCreator, tone: "#7c5ce7" };
  return <div className="pw-summary">
    <section className="pw-kpi-grid">
      <WorkspaceKpi label="Product rating" value={`${(sku.reviewScore ?? 1).toFixed(1)} / 5`} note="Independent product review" tone="#f2a93b" />
      <WorkspaceKpi label="Last 7 days" value={`${fmtNum(week.units)} units`} note={`${fmtMoney(week.netRevenue)} net revenue`} tone="#159fd0" />
      <WorkspaceKpi label="Contribution" value={fmtMoney(week.contribution)} note="Last 7 actual days" tone={week.contribution >= 0 ? "#16a875" : "#df5664"} />
      <WorkspaceKpi label="Lifetime" value={`${fmtNum(sku.unitsSoldTotal ?? 0)} units`} note={`${fmtMoney(sku.contributionTotal ?? 0)} contribution`} tone="#775de2" />
      <WorkspaceKpi label="Inventory" value={fmtNum(sku.inventory)} note={daysCover == null ? "No cover estimate yet" : `${Math.round(daysCover)} days at recent pace`} tone="#208bc1" />
      <WorkspaceKpi label="Daily pace" value={dailyUnits ? `${fmtNum(dailyUnits)} units` : "—"} note="Seven-day actual average" tone="#2478d5" />
    </section>
    <div className="pw-summary-grid">
      <section className="pw-white-panel pw-trend-panel"><PanelHeading eyebrow="RECENT ACTUALS" title="30-day sales pulse" aside={`${recent.length} days recorded`} /><LineChart series={[{ data: recent.map((point) => point.units), color: "#20a9f6", area: true, label: "Units" }]} height={205} fmt={fmtNum}/><div className="pw-chart-footer"><span><i style={{ background: "#20a9f6" }}/>Units sold per day</span><button onClick={() => goTo("sales")}>Open full sales analysis →</button></div></section>
      <section className="pw-next-card" style={{ "--next-tone": next.tone } as React.CSSProperties}><div><small>NEXT BEST ACTION</small><h2>{next.title}</h2><p>{next.copy}</p></div><GraphicAction asset={next.asset} label={next.label} tone={next.tone} onClick={next.action} disabled={(next as any).disabled} /></section>
    </div>
  </div>;
}

function WorkspaceKpi({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <article style={{ "--kpi-tone": tone } as React.CSSProperties}><div/><small>{label}</small><b>{value}</b><span>{note}</span></article>;
}

function PanelHeading({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: string }) {
  return <div className="pw-panel-heading"><div><small>{eyebrow}</small><h2>{title}</h2></div>{aside && <span>{aside}</span>}</div>;
}

function rootSkuId(sku: SKU, all: SKU[]): string {
  let current = sku;
  const seen = new Set<string>();
  while (current.parentSkuId && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = all.find((candidate) => candidate.id === current.parentSkuId);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

function ProductVersions({ world, sku, selectProduct, openCreator }: { world: World; sku: SKU; selectProduct: (id: string) => void; openCreator: () => void }) {
  const root = rootSkuId(sku, world.player.skus);
  const lineage = world.player.skus.filter((candidate) => rootSkuId(candidate, world.player.skus) === root).sort((a, b) => (a.version ?? 1) - (b.version ?? 1));
  return <div><div className="pw-section-intro"><div><small>PRODUCT LINEAGE</small><h2>{sku.name.replace(/\s+v\d+$/i, "")} across {lineage.length} version{lineage.length === 1 ? "" : "s"}</h2><p>Compare what changed, what customers rated, and what each release achieved. History remains available when a version is archived.</p></div><GraphicAction asset="/assets/ui/actions/new-version.png" label={`Create V${Math.max(...lineage.map((item) => item.version ?? 1), sku.version ?? 1) + 1}`} tone="#785ce0" onClick={openCreator} /></div>
    <div className="pw-version-grid">{lineage.map((item) => {
      const active = item.id === sku.id; const recent = summarizeHistory((item.salesHistory ?? []).slice(-7));
      return <button key={item.id} className={active ? "current" : ""} onClick={() => !active && selectProduct(item.id)}><div className="pw-version-art"><ProductVisualCard world={world} sku={item} size={112} showLabels={false} /></div><div className="pw-version-copy"><div><span>VERSION {item.version ?? 1}</span>{active && <em>OPEN NOW</em>}{item.archived && <em className="archived">ARCHIVED</em>}</div><h3>{item.name}</h3><p>{item.positioning ?? "No positioning recorded"} · {item.targetLabel ?? "Broad market"}</p><dl><div><dt>Rating</dt><dd>{(item.reviewScore ?? 1).toFixed(1)} ★</dd></div><div><dt>Lifetime sales</dt><dd>{fmtNum(item.unitsSoldTotal ?? 0)}</dd></div><div><dt>Lifetime contribution</dt><dd className={(item.contributionTotal ?? 0) >= 0 ? "good" : "bad"}>{fmtMoney(item.contributionTotal ?? 0)}</dd></div><div><dt>Last 7 days</dt><dd>{fmtNum(recent.units)} units</dd></div></dl></div></button>;
    })}</div>
  </div>;
}

function ProductSales({ world, sku, period, setPeriod }: { world: World; sku: SKU; period: 7 | 30 | 90 | 360; setPeriod: (value: 7 | 30 | 90 | 360) => void }) {
  const allHistory = sku.salesHistory ?? [];
  const history = allHistory.slice(-period);
  const total = summarizeHistory(history);
  const avgSelling = total.units > 0 ? total.netRevenue / total.units : 0;
  const actualContribution = total.units > 0 ? total.contribution / total.units : 0;
  const actualChannels = Object.values(sku.channelSalesByPartner ?? {}).sort((a, b) => b.netRevenue - a.netRevenue);
  const mix = channelMixForSku(world, sku);
  const modeledNet = mix.length ? mix.reduce((sum, row) => sum + row.netRevenuePerUnit * row.share, 0) : sku.listPrice;
  const netPerUnit = total.units > 0 ? avgSelling : modeledNet;
  const contributionPerUnit = total.units > 0 ? actualContribution : netPerUnit - sku.unitCost;
  const channelCost = Math.max(0, sku.listPrice - netPerUnit);
  return <div>
    <div className="pw-section-intro"><div><small>SKU SALES · ACTUAL TELEMETRY</small><h2>Sales, channels and unit economics</h2><p>Every number below is scoped to <b>{sku.name} · V{sku.version ?? 1}</b>. Charts use stored daily sales—not the company-wide forecast.</p></div><div className="pw-periods">{([7,30,90,360] as const).map((value) => <button className={period === value ? "active" : ""} key={value} onClick={() => setPeriod(value)}>{value === 360 ? "1 year" : `${value} days`}</button>)}</div></div>
    <section className="pw-kpi-grid compact"><WorkspaceKpi label="Units sold" value={fmtNum(total.units)} note={`${history.length} recorded day${history.length === 1 ? "" : "s"}`} tone="#1f9ed0"/><WorkspaceKpi label="Net revenue" value={fmtMoney(total.netRevenue)} note="After retailer cuts" tone="#785ce0"/><WorkspaceKpi label="Contribution" value={fmtMoney(total.contribution)} note="Before company overhead" tone={total.contribution >= 0 ? "#16a875" : "#df5664"}/><WorkspaceKpi label="Contribution / unit" value={fmtMoney(contributionPerUnit)} note="Actual for selected period" tone={contributionPerUnit >= 0 ? "#16a875" : "#df5664"}/></section>
    <div className="pw-sales-grid">
      <section className="pw-white-panel"><PanelHeading eyebrow="DAILY ACTUALS" title="Units sold" aside={`${history.length} data points`} /><LineChart series={[{ data: history.map((point) => point.units), color: "#20a9f6", area: true }]} height={210} fmt={fmtNum}/></section>
      <section className="pw-white-panel"><PanelHeading eyebrow="COMMERCIAL VALUE" title="Revenue & contribution" aside={`Last ${period === 360 ? "year" : `${period} days`}`} /><LineChart series={[{ data: history.map((point) => point.netRevenue), color: "#795fe2", area: true }, { data: history.map((point) => point.contribution), color: "#18af78" }]} height={210} fmt={fmtMoney} zeroLine/><div className="pw-chart-legend"><span><i style={{background:"#795fe2"}}/>Net revenue</span><span><i style={{background:"#18af78"}}/>Contribution</span></div></section>
    </div>
    <div className="pw-sales-bottom">
      <section className="pw-white-panel"><PanelHeading eyebrow="ACTUAL LIFETIME ATTRIBUTION" title="Channel leaderboard" aside={actualChannels.length ? `${actualChannels.length} selling partners` : "Awaiting sales"}/>{actualChannels.length ? <div className="pw-channel-list">{actualChannels.map((row, index) => { const expected = mix.find((candidate) => candidate.partnerId === row.partnerId); return <div key={row.partnerId}><span className="pw-rank">{index + 1}</span><div><b>{row.partnerName}</b><small>{row.channelType} · modeled mix {expected ? `${Math.round(expected.share * 100)}%` : "not currently assigned"}</small></div><strong>{fmtNum(row.units)} units<small>{fmtMoney(row.netRevenue)} net · {fmtMoney(row.contribution)} contribution</small></strong></div>; })}</div> : <div className="pw-empty"><b>No attributed channel sales yet.</b><span>{mix.length ? `Current channel model: ${mix.map((row) => `${row.partnerName} ${Math.round(row.share*100)}%`).join(" · ")}. These are estimates until sales occur.` : "Assign at least one sales partner in Operations."}</span></div>}</section>
      <section className="pw-white-panel"><PanelHeading eyebrow="UNIT ECONOMICS" title="What one sale is worth" aside={total.units > 0 ? "Selected-period actual" : "Current-plan estimate"}/><div className="pw-waterfall"><EconomicsRow label="Customer list price" value={sku.listPrice} tone="#16385c"/><EconomicsRow label="Retailer / channel cut" value={-channelCost} tone="#e46d69"/><EconomicsRow label="Net revenue per unit" value={netPerUnit} tone="#785ce0" strong/><EconomicsRow label="Manufacturing cost" value={-sku.unitCost} tone="#e49a3d"/><EconomicsRow label="Product contribution" value={contributionPerUnit} tone={contributionPerUnit >= 0 ? "#16a875" : "#df5664"} strong/><div className="pw-margin-line"><span>Contribution margin</span><b>{netPerUnit > 0 ? `${(contributionPerUnit / netPerUnit * 100).toFixed(1)}%` : "—"}</b></div></div></section>
    </div>
  </div>;
}

function EconomicsRow({ label, value, tone, strong }: { label: string; value: number; tone: string; strong?: boolean }) {
  return <div className={strong ? "strong" : ""}><span>{label}</span><b style={{ color: tone }}>{value < 0 ? "−" : ""}{fmtMoney(Math.abs(value))}</b></div>;
}

function ProductMarket({ world, sku, goTo }: { world: World; sku: SKU; goTo: (tab: WorkspaceTab) => void }) {
  const direct = world.comps.flatMap((comp) => comp.products.filter((product) => product.productKey === sku.productKey).map((product) => ({ comp, product })));
  const avgPrice = direct.length ? direct.reduce((sum, row) => sum + row.product.price, 0) / direct.length : 0;
  const avgQuality = direct.length ? direct.reduce((sum, row) => sum + row.product.quality, 0) / direct.length : 0;
  const report = sku.marketStudy;
  return <div>
    <div className="pw-section-intro"><div><small>MARKET · {archetypeByKey(sku.productKey)?.label?.toUpperCase() ?? sku.productKey.toUpperCase()}</small><h2>{sku.name} in its competitive arena</h2><p>This view never mixes your other products into the analysis. Competitor product metrics are direct-category comparisons; market-study results are clearly marked as estimates.</p></div>{!report && <button className="pw-outline-action" onClick={() => goTo("operations")}>Commission a study in Operations →</button>}</div>
    <section className="pw-market-benchmarks"><WorkspaceKpi label="Your price" value={fmtMoney(sku.listPrice)} note={direct.length ? `${Math.round((sku.listPrice / avgPrice - 1) * 100)}% vs rival average` : "No direct rival benchmark"} tone="#1f9ed0"/><WorkspaceKpi label="Your quality index" value={`${Math.round(sku.quality*100)} / 100`} note={direct.length ? `${Math.round((sku.quality - avgQuality)*100)} pts vs rival average` : "Manufacturing quality"} tone="#16a875"/><WorkspaceKpi label="Study share estimate" value={report ? `${(report.targetMarketShare*100).toFixed(1)}%` : "Not studied"} note="Estimate for target audience" tone="#785ce0"/></section>
    <div className="pw-market-grid">
      <section className="pw-white-panel"><PanelHeading eyebrow="DIRECT CATEGORY RIVALS" title="Competitive products" aside={direct.length ? `${direct.length} tracked` : "No direct entries"}/>{direct.length ? <div className="pw-rival-list"><div className="header"><span>Product / company</span><span>Price</span><span>Quality</span><span>Company strength*</span></div>{direct.sort((a,b) => b.comp.strength-a.comp.strength).map(({comp,product}) => <div key={`${comp.id}-${product.awarenessKey}`}><span><b>{comp.name}</b><small>{comp.personality} competitor</small></span><strong>{fmtMoney(product.price)}</strong><strong>{Math.round(product.quality*100)} / 100</strong><strong>{Math.round(comp.strength*100)} / 100</strong></div>)}</div> : <div className="pw-empty"><b>No competitor has a tracked product in this exact category.</b><span>We do not substitute an unrelated flagship as though it were a direct rival.</span></div>}<p className="pw-estimate-note">* Company strength is a directional simulation estimate, not audited product market share.</p></section>
      <section className="pw-white-panel"><PanelHeading eyebrow="TARGET AUDIENCE" title={report ? report.headline : "What does this audience value?"} aside={report ? "Market-study estimate" : "Evidence required"}/>{report ? <><p className="pw-study-summary">{report.summary}</p><div className="pw-preference-list">{report.preferences.sort((a,b) => b.importance-a.importance).map((preference) => { const gap = preference.recommendedStars - preference.currentStars; return <div key={preference.key}><div><b>{preference.label}</b><small>Importance {Math.round(preference.importance*100)}%</small></div><span className="pw-stars">{"★".repeat(Math.max(0,Math.round(preference.currentStars)))}<i>{"★".repeat(Math.max(0,5-Math.round(preference.currentStars)))}</i></span><strong className={gap > .4 ? "gap" : "good"}>{gap > .4 ? `Needs +${gap.toFixed(1)}` : "On target"}</strong></div>; })}</div><div className="pw-study-channel"><span>Best channel for this audience</span><b>{report.bestChannel.label}</b></div></> : <div className="pw-empty illustrated"><img src="/assets/ui/actions/market-study.png" alt=""/><b>You have a hypothesis, not an answer.</b><span>Launch data plus a market study will identify preference, quality, pricing, channel and audience gaps for this exact SKU.</span></div>}</section>
    </div>
    {report && <section className="pw-white-panel pw-lessons"><PanelHeading eyebrow="RETAINED LEARNING" title="Lessons for the next decision" aside={`${report.lessons.length} findings`}/><div>{report.lessons.map((lesson) => <article key={lesson.id}><span>{lesson.kind}</span><b>{lesson.title}</b><p>{lesson.finding}</p><strong>Next move: {lesson.action}</strong></article>)}</div></section>}
  </div>;
}

function ArchivedOperations({ sku, restore, redesign }: { sku: SKU; restore: () => void; redesign: () => void }) {
  return <div><SectionTitle title="Archived product" text="This version is outside the active operating portfolio, but all sales, contribution and market-learning history is preserved."/><InfoGrid rows={[["Version", `V${sku.version ?? 1}`], ["Product review", `★ ${(sku.reviewScore ?? 1).toFixed(1)} / 5`], ["Lifetime units", fmtNum(sku.unitsSoldTotal ?? 0)], ["Lifetime contribution", fmtMoney(sku.contributionTotal ?? 0)]]}/><div className="pw-archived-actions"><button onClick={restore}>Restore this version</button><GraphicAction asset="/assets/ui/actions/new-version.png" label={`Create redesigned V${(sku.version ?? 1)+1}`} tone="#785ce0" onClick={redesign}/></div></div>;
}

const productPortfolioCss = `
.product-portfolio-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}.product-portfolio-card{min-height:44px}.product-portfolio-card:hover,.product-portfolio-card:focus-visible{transform:translateY(-3px);border-color:#43a9df!important;box-shadow:0 13px 28px rgba(24,91,137,.16)!important;outline:3px solid rgba(50,169,230,.2);outline-offset:2px}.product-portfolio-card:active{transform:translateY(0) scale(.99)}.product-card-head{display:flex;justify-content:space-between;align-items:start;gap:10px}.product-card-body{display:grid;grid-template-columns:158px minmax(0,1fr);gap:13px;align-items:center;margin-top:11px}.product-card-art{display:grid;place-items:center;min-width:0}.product-card-copy{min-width:0}.product-portfolio-view [style*="font-size: 8"],.product-portfolio-view [style*="font-size: 9"],.product-portfolio-view [style*="font-size: 10"]{font-size:11.5px!important}.product-portfolio-view button{min-height:44px}
@media(max-width:560px){.product-portfolio-grid{grid-template-columns:1fr}.product-portfolio-card{padding:12px!important}.product-card-body{grid-template-columns:108px minmax(0,1fr);gap:10px}.product-card-art{height:112px;overflow:hidden}.product-card-art>div{transform:scale(.72)}.product-card-copy [style*="font-size: 9.7"]{font-size:11px!important}.product-card-copy [style*="font-size: 10.8"]{font-size:12px!important}}
`;

const productWorkspaceCss = `
.pw-backdrop{position:fixed;inset:0;z-index:195;background:rgba(3,13,27,.82);backdrop-filter:blur(9px);display:grid;place-items:center;padding:12px;color:#15324f}
.pw-shell{width:min(1460px,calc(100vw - 24px));height:min(930px,calc(100dvh - 24px));overflow:hidden;background:#edf3f7;border:1px solid rgba(144,205,242,.35);border-radius:22px;box-shadow:0 34px 100px rgba(0,0,0,.55);display:grid;grid-template-rows:auto auto auto minmax(0,1fr);animation:momentRise .28s cubic-bezier(.2,.9,.25,1)}
.pw-shell button{font-family:inherit}.pw-topbar{min-height:46px;padding:0 16px 0 20px;background:#071b31;border-bottom:1px solid rgba(143,194,228,.16);display:flex;align-items:center;justify-content:space-between;gap:12px;color:#9ab9d0}.pw-breadcrumb{display:flex;align-items:center;gap:9px;min-width:0;font-size:12px;font-weight:750;letter-spacing:.25px}.pw-breadcrumb span,.pw-breadcrumb b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pw-breadcrumb b{color:white}.pw-breadcrumb i{color:#527795;font-style:normal}.pw-close{width:38px;height:38px;flex:0 0 auto;border:1px solid rgba(153,201,231,.22);border-radius:11px;background:rgba(255,255,255,.06);color:white;font-size:25px;line-height:1;cursor:pointer;transition:.16s}.pw-close:hover,.pw-close:focus-visible{background:#df5265;border-color:#ff91a0;transform:scale(1.04);outline:none}
.pw-hero{min-height:232px;padding:18px clamp(16px,2.4vw,34px);display:grid;grid-template-columns:minmax(260px,35%) minmax(360px,1fr) minmax(230px,290px);align-items:center;gap:clamp(18px,2.3vw,34px);color:white;background:linear-gradient(90deg,rgba(5,23,46,.97),rgba(9,40,69,.89) 50%,rgba(19,37,81,.93)),url('/assets/ui/backgrounds/product-studio.png') center 52%/cover;position:relative;isolation:isolate}.pw-hero:after{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 17% 45%,rgba(45,182,255,.21),transparent 28%),linear-gradient(180deg,rgba(255,255,255,.05),transparent 50%)}.pw-product-art{height:210px;display:grid;place-items:center;filter:drop-shadow(0 20px 24px rgba(0,0,0,.28))}.pw-product-art>div{transform:scale(1.03)}.pw-identity{min-width:0}.pw-kicker{color:#79d2ff;font-size:12px;font-weight:950;letter-spacing:1.15px}.pw-identity h1{margin:5px 0 0;font-size:clamp(27px,3vw,43px);line-height:1.03;letter-spacing:-1.1px}.pw-identity>p{margin:7px 0 0;color:#b9d0df;font-size:14px;line-height:1.4}.pw-hero-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:19px}.pw-hero-stats>div{position:relative;overflow:hidden;min-width:0;padding:10px 11px;border:1px solid rgba(165,213,242,.18);border-radius:11px;background:rgba(4,20,38,.52);box-shadow:inset 3px 0 0 var(--metric-accent)}.pw-hero-stats small{display:block;color:#90afc4;font-size:11px}.pw-hero-stats b{display:block;margin-top:2px;font-size:20px;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw-hero-stats span{display:block;color:#bed2df;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw-action-stack{align-self:stretch;display:flex;flex-direction:column;justify-content:center;gap:8px}.pw-action-stack>small{font-size:11px;font-weight:900;letter-spacing:1px;color:#86aec8}.pw-graphic-action{--action-tone:#208bc1;min-height:66px;width:100%;display:grid;grid-template-columns:56px minmax(0,1fr) 18px;align-items:center;gap:8px;border:1px solid color-mix(in srgb,var(--action-tone) 70%,white);border-radius:13px;padding:5px 9px 5px 5px;background:linear-gradient(115deg,color-mix(in srgb,var(--action-tone) 72%,#08213b),var(--action-tone));color:white;text-align:left;cursor:pointer;box-shadow:0 8px 20px color-mix(in srgb,var(--action-tone) 30%,transparent);transition:transform .15s,filter .15s,box-shadow .15s}.pw-graphic-action img{width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 5px 6px rgba(0,0,0,.22))}.pw-graphic-action span{min-width:0}.pw-graphic-action b{display:block;font-size:13px;line-height:1.2}.pw-graphic-action small{display:block;margin-top:3px;color:rgba(255,255,255,.78);font-size:11px}.pw-graphic-action i{font:normal 24px/1 sans-serif}.pw-graphic-action:hover:not(:disabled),.pw-graphic-action:focus-visible:not(:disabled){transform:translateY(-2px);filter:saturate(1.12) brightness(1.06);box-shadow:0 13px 25px color-mix(in srgb,var(--action-tone) 40%,transparent);outline:2px solid white;outline-offset:2px}.pw-graphic-action:active:not(:disabled){transform:translateY(1px) scale(.985)}.pw-graphic-action:disabled{opacity:.48;cursor:not-allowed}.pw-action-plain{min-height:46px;border:1px solid rgba(147,204,239,.28);border-radius:11px;background:rgba(255,255,255,.08);color:white;font-size:12px;font-weight:850;cursor:pointer}.pw-action-plain:hover,.pw-action-plain:focus-visible{background:rgba(73,180,239,.2);outline:2px solid #69c9ff}.pw-stage-action{min-height:92px;display:grid;grid-template-columns:47px 1fr;align-items:center;gap:11px;border:1px solid rgba(104,199,255,.52);border-radius:14px;padding:12px;background:linear-gradient(135deg,#178ccb,#7158db);color:white;text-align:left;cursor:pointer;box-shadow:0 12px 25px rgba(18,111,180,.25)}.pw-stage-action .pw-icon{width:44px;height:44px}.pw-stage-action b,.pw-stage-action em{display:block}.pw-stage-action b{font-size:14px}.pw-stage-action em{margin-top:4px;color:#d8eaf6;font-size:11px;font-style:normal;line-height:1.35}
.pw-tabs{display:flex;gap:5px;padding:8px 12px 0;background:#0a2039;border-top:1px solid rgba(255,255,255,.06);overflow-x:auto;scrollbar-width:thin;position:relative}.pw-tabs:after,.pw-action-stack:after{content:'›';position:sticky;right:0;align-self:stretch;min-width:22px;display:grid;place-items:center;background:linear-gradient(90deg,transparent,#0a2039 45%);color:#8fd6ff;font-size:23px;pointer-events:none}.pw-tabs button{--tab-color:#20a9f6;min-width:160px;min-height:62px;padding:7px 11px;display:flex;align-items:center;gap:10px;border:1px solid transparent;border-bottom:3px solid transparent;border-radius:10px 10px 0 0;background:transparent;color:#86a6bd;text-align:left;cursor:pointer;transition:.15s}.pw-tabs button:hover{background:rgba(255,255,255,.07);color:white}.pw-tabs button.active{color:white;background:linear-gradient(180deg,color-mix(in srgb,var(--tab-color) 34%,#102845),rgba(255,255,255,.05));border-color:color-mix(in srgb,var(--tab-color) 40%,transparent);border-bottom-color:var(--tab-color)}.pw-icon{width:34px;height:34px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;background:color-mix(in srgb,var(--tab-color,#60a5fa) 20%,transparent);color:var(--tab-color,#70c6ff)}.pw-icon svg{width:24px;height:24px}.pw-tabs b{display:block;font-size:13px}.pw-tabs small{display:block;margin-top:2px;font-size:11px;color:#89a9be}.pw-tabs button.active small{color:#c4d9e6}
.pw-content{overflow:auto;padding:clamp(16px,2.3vw,28px);background:linear-gradient(180deg,#eef4f8,#e8eff4);font-size:13px}.pw-content button{min-height:44px}.pw-content [style*="font-size: 8"],.pw-content [style*="font-size: 9"],.pw-content [style*="font-size: 10"]{font-size:11.5px!important;line-height:1.4}.pw-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.pw-kpi-grid.compact{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}.pw-kpi-grid>article,.pw-market-benchmarks>article{min-width:0;padding:13px 14px;border:1px solid #d7e2e9;border-radius:13px;background:linear-gradient(180deg,#fff,#f8fbfd);box-shadow:0 6px 15px rgba(19,50,77,.06);position:relative;overflow:hidden}.pw-kpi-grid>article>div,.pw-market-benchmarks>article>div{position:absolute;inset:0 auto 0 0;width:4px;background:var(--kpi-tone)}.pw-kpi-grid article small,.pw-market-benchmarks article small{display:block;color:#6a8092;font-size:11px;font-weight:800}.pw-kpi-grid article b,.pw-market-benchmarks article b{display:block;color:#15324f;margin-top:4px;font-size:20px;line-height:1.12;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pw-kpi-grid article span,.pw-market-benchmarks article span{display:block;color:#7890a1;margin-top:4px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pw-summary-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(290px,.7fr);gap:14px;margin-top:14px}.pw-white-panel{background:#fffdf9;border:1px solid #d8e3e9;border-radius:15px;padding:17px;box-shadow:0 8px 20px rgba(18,52,80,.07)}.pw-panel-heading{display:flex;align-items:start;justify-content:space-between;gap:14px;margin-bottom:9px}.pw-panel-heading small,.pw-section-intro>div>small{display:block;color:#208bc1;font-size:11px;font-weight:950;letter-spacing:.85px}.pw-panel-heading h2,.pw-section-intro h2{margin:3px 0 0;color:#15324f;font-size:20px;letter-spacing:-.2px}.pw-panel-heading>span{color:#7890a1;font-size:11px}.pw-chart-footer,.pw-chart-legend{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#617b8e;font-size:12px}.pw-chart-footer span,.pw-chart-legend span{display:flex;align-items:center;gap:6px}.pw-chart-footer i,.pw-chart-legend i{width:9px;height:9px;border-radius:99px}.pw-chart-footer button{border:0;background:transparent;color:#167fbd;font-weight:850;cursor:pointer}.pw-next-card{--next-tone:#785ce0;min-height:300px;padding:22px;border:1px solid color-mix(in srgb,var(--next-tone) 35%,#dbe5eb);border-radius:15px;background:radial-gradient(circle at 85% 15%,color-mix(in srgb,var(--next-tone) 17%,transparent),transparent 40%),linear-gradient(145deg,#fff,#f7f4ff);display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 5px 0 0 var(--next-tone),0 8px 20px rgba(18,52,80,.07)}.pw-next-card>div>small{color:var(--next-tone);font-size:11px;font-weight:950;letter-spacing:.9px}.pw-next-card h2{margin:8px 0 0;font-size:23px;color:#15324f}.pw-next-card p{margin:8px 0 18px;color:#60798c;font-size:13px;line-height:1.55}
.pw-section-intro{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:16px}.pw-section-intro p{max-width:760px;margin:6px 0 0;color:#617b8e;font-size:13px;line-height:1.5}.pw-section-intro .pw-graphic-action{width:min(300px,100%);flex:0 0 auto}.pw-version-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}.pw-version-grid>button{display:grid;grid-template-columns:126px minmax(0,1fr);gap:10px;padding:12px;border:1px solid #d6e1e8;border-radius:15px;background:linear-gradient(145deg,#fff,#f6faff);text-align:left;color:#15324f;cursor:pointer;box-shadow:0 7px 18px rgba(18,52,80,.07);transition:.16s}.pw-version-grid>button:hover,.pw-version-grid>button:focus-visible{transform:translateY(-3px);border-color:#45aee6;box-shadow:0 13px 25px rgba(18,90,140,.13);outline:none}.pw-version-grid>button.current{border:2px solid #785ce0;background:linear-gradient(145deg,#fff,#f5f0ff)}.pw-version-art{display:grid;place-items:center;min-height:142px;border-radius:11px;background:linear-gradient(145deg,#ecf7ff,#f4f0ff)}.pw-version-copy{min-width:0}.pw-version-copy>div{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pw-version-copy>div>span{font-size:11px;font-weight:950;color:#785ce0}.pw-version-copy em{padding:3px 6px;border-radius:99px;background:#e9e2ff;color:#6848ce;font-size:9px;font-style:normal;font-weight:900}.pw-version-copy em.archived{background:#e8eef2;color:#687d8d}.pw-version-copy h3{margin:5px 0 0;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw-version-copy p{margin:4px 0 10px;color:#6d8393;font-size:11px;line-height:1.35}.pw-version-copy dl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:7px}.pw-version-copy dl div{padding:6px;border-radius:7px;background:#edf3f7}.pw-version-copy dt{font-size:9px;color:#738899}.pw-version-copy dd{margin:2px 0 0;font-size:11px;font-weight:850}.pw-version-copy dd.good{color:#15885f}.pw-version-copy dd.bad{color:#cc4e5c}
.pw-periods{display:flex;align-items:center;gap:5px;padding:4px;border-radius:11px;background:#dfe8ee;flex:0 0 auto}.pw-periods button{min-height:38px!important;padding:0 12px;border:0;border-radius:8px;background:transparent;color:#657d8f;font-size:12px;font-weight:850;cursor:pointer}.pw-periods button.active{background:#153f67;color:white;box-shadow:0 3px 8px rgba(14,50,81,.2)}.pw-sales-grid,.pw-sales-bottom,.pw-market-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.pw-channel-list{display:grid}.pw-channel-list>div{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #e6edf1}.pw-channel-list>div:first-child{border-top:0}.pw-rank{width:27px;height:27px;border-radius:8px;background:#e5f3fb;color:#167fae;display:grid;place-items:center;font-weight:950}.pw-channel-list b{font-size:13px}.pw-channel-list small{display:block;margin-top:2px;color:#758b9b;font-size:11px}.pw-channel-list strong{text-align:right;font-size:12px}.pw-channel-list strong small{font-weight:500}.pw-empty{min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#6c8394;gap:7px;padding:14px;border:1px dashed #c4d4de;border-radius:11px;background:#f6fafc}.pw-empty b{color:#314f68;font-size:13px}.pw-empty span{max-width:480px;font-size:12px;line-height:1.45}.pw-empty.illustrated img{width:94px;height:94px;object-fit:contain}.pw-waterfall{display:grid;gap:2px}.pw-waterfall>div{display:flex;justify-content:space-between;gap:14px;padding:9px 4px;border-bottom:1px solid #e5ecef;color:#61798b;font-size:13px}.pw-waterfall>div.strong{margin:2px -5px;padding:10px 9px;border:0;border-radius:8px;background:#edf3f7;color:#23445f}.pw-waterfall b{font-size:13px}.pw-margin-line{margin-top:7px!important;border-top:2px solid #d5e1e8!important;border-bottom:0!important}.pw-margin-line b{color:#15324f;font-size:17px}
.pw-market-benchmarks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.pw-market-benchmarks>article{--kpi-tone:#208bc1}.pw-outline-action{padding:9px 13px;border:1px solid #268fc5;border-radius:10px;background:#fff;color:#167daf;font-weight:850;cursor:pointer}.pw-rival-list{display:grid}.pw-rival-list>div{display:grid;grid-template-columns:minmax(180px,1fr) repeat(3,minmax(80px,.45fr));align-items:center;gap:9px;padding:10px 5px;border-top:1px solid #e4ecef;font-size:12px}.pw-rival-list>div.header{border:0;background:#eef4f7;border-radius:8px;color:#708697;font-size:10px;font-weight:900}.pw-rival-list span small{display:block;color:#7c909f;font-size:10px;margin-top:2px}.pw-rival-list strong{font-size:12px}.pw-estimate-note{margin:10px 0 0;color:#8394a1;font-size:10px}.pw-study-summary{margin:0 0 10px;color:#5e788a;font-size:12px;line-height:1.5}.pw-preference-list>div{display:grid;grid-template-columns:minmax(120px,1fr) 110px 80px;align-items:center;gap:8px;padding:9px 0;border-top:1px solid #e4ecef}.pw-preference-list b{font-size:12px}.pw-preference-list small{display:block;color:#81929f;font-size:10px}.pw-stars{color:#f0a83a;letter-spacing:1px;font-size:13px}.pw-stars i{color:#d9e2e7;font-style:normal}.pw-preference-list strong{font-size:11px}.pw-preference-list strong.gap{color:#d56263}.pw-preference-list strong.good{color:#158b62}.pw-study-channel{display:flex;justify-content:space-between;margin-top:10px;padding:10px;border-radius:9px;background:#eaf7fd;color:#45738e;font-size:12px}.pw-study-channel b{color:#157da9}.pw-lessons{margin-top:14px}.pw-lessons>div>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px}.pw-lessons article{padding:12px;border:1px solid #dbe5ea;border-radius:11px;background:#f8fbfc}.pw-lessons article>span{text-transform:uppercase;color:#1788b8;font-size:9px;font-weight:950;letter-spacing:.7px}.pw-lessons article>b{display:block;margin-top:4px;font-size:13px}.pw-lessons article p{margin:5px 0;color:#61798b;font-size:11px;line-height:1.45}.pw-lessons article strong{color:#158b62;font-size:11px;line-height:1.4}.pw-stage{max-width:1120px;margin:0 auto}.pw-stage>*{font-size:12px!important}.pw-stage b{font-size:13px!important}.pw-stage button,.pw-stage input,.pw-stage select{font-size:13px!important;min-height:44px}.pw-housekeeping{margin-top:20px;padding:16px;border-top:1px solid #d6e1e8;background:#fff;border-radius:12px}.pw-housekeeping>p,.pw-confirm p{color:#6a8192;font-size:12px;line-height:1.45}.pw-housekeeping>button,.pw-confirm button,.pw-archived-actions>button{width:100%;border:1px solid #e2a15c;border-radius:10px;background:#fff8ed;color:#a9601d;font-weight:850;cursor:pointer}.pw-confirm{padding:12px;border:1px solid #e7ad6a;border-radius:10px;background:#fff8ed}.pw-confirm>div{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pw-archived-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.pw-message{position:sticky;bottom:0;margin-top:12px;padding:12px;border-radius:10px;background:#fff3cf;border:1px solid #efce71;color:#855c0d;font-weight:850}
@media(max-width:1100px){.pw-hero{grid-template-columns:220px minmax(340px,1fr) 225px}.pw-product-art{height:180px}.pw-product-art>div{transform:scale(.86)}.pw-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pw-tabs button{min-width:145px}.pw-hero-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.pw-hero-stats>div:last-child{display:none}}
@media(max-width:840px){.pw-backdrop{padding:0}.pw-shell{width:100vw;height:100dvh;border-radius:0;border:0}.pw-hero{min-height:0;padding:12px 14px;grid-template-columns:112px minmax(0,1fr);gap:12px}.pw-product-art{height:122px}.pw-product-art>div{transform:scale(.53)}.pw-identity h1{font-size:24px}.pw-kicker{font-size:11px}.pw-identity>p{font-size:12px}.pw-hero-stats{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:10px}.pw-hero-stats>div{padding:7px 8px}.pw-hero-stats b{font-size:16px}.pw-hero-stats>div:last-child{display:none}.pw-action-stack{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pw-action-stack>small{grid-column:1/-1}.pw-graphic-action{min-height:58px;grid-template-columns:46px minmax(0,1fr) 12px}.pw-graphic-action img{width:44px;height:44px}.pw-action-stack .pw-stage-action{grid-column:1/-1;min-height:64px}.pw-tabs button{min-width:128px;min-height:56px}.pw-tabs .pw-icon{width:29px;height:29px}.pw-tabs small{display:none}.pw-content{padding:14px}.pw-summary-grid,.pw-sales-grid,.pw-sales-bottom,.pw-market-grid{grid-template-columns:1fr}.pw-next-card{min-height:240px}.pw-section-intro{align-items:flex-start;flex-direction:column}.pw-section-intro .pw-graphic-action{width:100%}}
@media(max-width:540px){.pw-topbar{padding:0 9px 0 12px}.pw-close{width:44px;height:44px}.pw-breadcrumb span:not(:last-of-type),.pw-breadcrumb i{display:none}.pw-hero{grid-template-columns:88px minmax(0,1fr)}.pw-product-art{height:96px}.pw-product-art>div{transform:scale(.42)}.pw-identity h1{font-size:21px}.pw-identity>p{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pw-hero-stats{grid-template-columns:1fr 1fr}.pw-hero-stats small,.pw-hero-stats span{font-size:11px}.pw-hero-stats b{font-size:15px}.pw-action-stack{display:flex;flex-direction:row;overflow-x:auto;grid-column:1/-1;scroll-snap-type:x proximity}.pw-action-stack>small{display:none}.pw-action-stack>*{min-width:220px;scroll-snap-align:start}.pw-tabs{padding-left:7px;scroll-snap-type:x proximity}.pw-tabs button{min-width:108px;padding:7px 9px;justify-content:flex-start;scroll-snap-align:start}.pw-tabs button span{display:block}.pw-tabs .pw-icon{width:31px;height:31px}.pw-tabs b{font-size:12px}.pw-tabs small{display:none}.pw-kpi-grid,.pw-kpi-grid.compact,.pw-market-benchmarks{grid-template-columns:repeat(2,minmax(0,1fr))}.pw-kpi-grid article b,.pw-market-benchmarks article b{font-size:16px}.pw-white-panel{padding:13px}.pw-panel-heading h2,.pw-section-intro h2{font-size:18px}.pw-version-grid{grid-template-columns:1fr}.pw-version-grid>button{grid-template-columns:100px minmax(0,1fr)}.pw-version-art{min-height:120px}.pw-version-art>div{transform:scale(.85)}.pw-periods{width:100%;overflow-x:auto}.pw-periods button{flex:1;white-space:nowrap}.pw-preference-list>div{grid-template-columns:minmax(100px,1fr) 90px}.pw-preference-list strong{grid-column:1/-1}.pw-rival-list{overflow:visible}.pw-rival-list>div.header{display:none}.pw-rival-list>div:not(.header){min-width:0;grid-template-columns:1fr 1fr;gap:8px;padding:12px 4px}.pw-rival-list>div:not(.header)>span{grid-column:1/-1}.pw-rival-list>div:not(.header)>strong{padding:7px;border-radius:8px;background:#eef4f7}.pw-rival-list>div:not(.header)>strong:before{display:block;color:#718797;font-size:10px;font-weight:700}.pw-rival-list>div:not(.header)>strong:nth-child(2):before{content:'Price'}.pw-rival-list>div:not(.header)>strong:nth-child(3):before{content:'Quality'}.pw-rival-list>div:not(.header)>strong:nth-child(4):before{content:'Company strength'}.pw-archived-actions{grid-template-columns:1fr}.pw-content{padding-bottom:max(16px,env(safe-area-inset-bottom))}.pw-content small,.pw-content [style*="font-size: 9"],.pw-content [style*="font-size: 8"]{font-size:11px!important;line-height:1.4}.pw-stage p,.pw-stage div{line-height:1.45}.pw-stage button,.pw-stage select,.pw-stage input{font-size:16px!important}}
@media(prefers-reduced-motion:reduce){.pw-shell,.pw-shell *{animation:none!important;transition:none!important}}
`;

function StageRail({ stage }: { stage: Stage }) {
  const order: Stage[] = ["design", "manufacture", "sell", "analyze"];
  const logical = stage === "manufacturing" ? "manufacture" : stage;
  const current = order.indexOf(logical);
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 18 }}>{order.map((s, i) => <div key={s} style={{ borderRadius: 9, padding: "7px 8px", background: i <= current ? `${STAGE_META[s].color}12` : C.panel2, border: `1px solid ${i === current ? STAGE_META[s].color : C.line}`, color: i <= current ? STAGE_META[s].color : C.faint, fontSize: 9, fontWeight: 900, textAlign: "center" }}>{i + 1}. {STAGE_META[s].label}</div>)}</div>;
}

function DesignStage({ world, sku, discard }: { world: World; sku: SKU; discard: () => void }) {
  const tier = sku.projectTier ?? (sku.designDepth === "breakthrough" ? "AAA" : sku.designDepth === "advanced" ? "AA" : "A");
  const total = Math.ceil((PRODUCT_PROJECT_TIERS[tier]?.baseDays ?? DESIGN_DEPTHS[sku.designDepth].days) * TESTING_LEVELS[sku.testingLevel ?? "standard"].timeMult);
  const lead = world.player.personnel.find((p) => p.id === sku.assignedPmId);
  const designers = (sku.assignedDesignerIds ?? []).map((id) => world.player.personnel.find((p) => p.id === id)).filter(Boolean);
  const teamLabel = tier === "A" ? (lead?.name ?? sku.assignedPmName ?? "—") : `${lead?.name ?? sku.assignedPmName ?? "—"} (Lead) + ${designers.map((p: any) => p.name).join(", ") || "—"}`;
  return <><SectionTitle title={`${tier} product design`} text="The brief is locked while the assigned team develops it. Larger project classes consume more people for longer, but raise the design ceiling." />
    <InfoGrid rows={[[tier === "A" ? "Product Designer" : "Project team", teamLabel], ["Audience hypothesis", sku.targetLabel ?? "Broad market"], ["Positioning", sku.positioning ?? "—"], ["Days remaining", String(Math.ceil(sku.designDaysLeft))]]} />
    <div style={{ height: 8, background: C.grid, borderRadius: 99, marginTop: 12 }}><div style={{ width: `${Math.max(5, Math.min(100, 100 - (sku.designDaysLeft / total) * 100))}%`, height: "100%", borderRadius: 99, background: C.amber }} /></div>
    <div style={{ color: C.faint, fontSize: 10, marginTop: 7 }}>{tier === "AAA" ? "AAA uses a Product Lead plus three designers and can reach 4.8–4.9★; a perfect 5.0★ is exceptional." : tier === "AA" ? "AA uses a Product Lead plus one designer and tops out around 4.1★." : "A is a focused one-designer project with a 2.9★ review ceiling."}</div>
    <button style={{ ...ctrlBtn, color: C.red, marginTop: 14 }} onClick={discard}>Discard project</button></>;
}

function ManufactureStage({ world, sku, method, setMethod, supplierId, setSupplierId, mfgStars, setMfgStars, batch, setBatch, quote, orderBatch, discard }: any) {
  const suppliers = suppliersForProduct(sku.productKey); const ownAvailable = factoryCapacity(world, sku.productKey).total > 0; const selectedSupplier = supplierById(supplierId);
  const routeName = method === "own" ? "Own factory" : selectedSupplier?.name ?? "Manufacturing partner";
  const supplierCapacity = method === "own" ? factoryCapacity(world, sku.productKey).total : productionCapacity(world, "outsource", supplierId, sku.productKey);
  return <><SectionTitle title="Manufacture the design" text={`The product review is ${(sku.reviewScore ?? 1).toFixed(1)}/5. Now choose the manufacturer, production standard and first batch; manufacturing affects delivered quality and cost, but does not rewrite the product review.`} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
      <div><FieldLabel>Production route</FieldLabel><div style={{ display: "flex", gap: 7 }}><button disabled={!ownAvailable} title={!ownAvailable ? "No compatible owned factory is available for this product." : undefined} onClick={() => setMethod("own")} style={{ ...ctrlBtn, flex: 1, borderColor: method === "own" ? C.violet : C.line, color: method === "own" ? C.violet : C.dim, opacity: ownAvailable ? 1 : .45 }}>Own factory</button><button onClick={() => setMethod("outsource")} style={{ ...ctrlBtn, flex: 1, borderColor: method === "outsource" ? C.violet : C.line, color: method === "outsource" ? C.violet : C.dim }}>Manufacturing partner</button></div>
      {!ownAvailable && <ActionReason>No compatible factory on campus. Build/retool a factory, or use a manufacturing partner.</ActionReason>}
      {method === "outsource" && <><FieldLabel>Partner</FieldLabel><select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={selectStyle}>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.label}</option>)}</select><div style={{ color: C.faint, fontSize: 10, marginTop: 4 }}>{selectedSupplier?.desc}</div></>}</div>
      <div><FieldLabel>Production standard</FieldLabel><StarRating value={mfgStars} onChange={setMfgStars} /><div style={{ color: C.faint, fontSize: 10, marginTop: 4 }}>{manufacturingStandard(mfgStars).label}. Better manufacturing costs more and protects perceived quality.</div><FieldLabel>First batch</FieldLabel><NumberInput label="Units" min={1000} max={Math.max(1000,quote.maxBatch)} step={1000} value={Math.max(1000, Math.min(batch,Math.max(1000,quote.maxBatch)))} suffix="units" onChange={setBatch} /></div>
    </div>

    <div style={{ marginTop: 14, border: `1px solid ${quote.check.ok ? "#b8e6ce" : "#fed7aa"}`, background: quote.check.ok ? "#f2fbf6" : "#fff8ed", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}><div><div style={{ color: C.faint, fontSize: 9, fontWeight: 900, letterSpacing: .8 }}>MANUFACTURING ORDER</div><b style={{ fontSize: 14 }}>{routeName}</b></div><div style={{ textAlign: "right" }}><div style={{ color: C.faint, fontSize: 9 }}>TOTAL ORDER</div><b style={{ fontSize: 18, color: quote.check.ok ? C.ink : C.amber }}>{fmtMoney(quote.totalCost)}</b></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 7, marginTop: 10 }}>
        <QuoteStat label="Batch" value={`${fmtNum(batch)} units`} />
        <QuoteStat label="Unit cost" value={fmtMoney(quote.unitCost)} />
        <QuoteStat label="Lead time" value={quote.leadDays >= 999 ? "Unavailable" : `~${quote.leadDays} days`} />
        <QuoteStat label="Monthly capacity" value={fmtNum(supplierCapacity)} />
        <QuoteStat label="Delivered quality" value={`${Math.round(quote.quality * 100)}/100`} />
        <QuoteStat label="Cash after order" value={fmtMoney(world.player.cash - quote.totalCost)} tone={world.player.cash - quote.totalCost < 0 ? "bad" : undefined} />
      </div>
      <div style={{ color: C.faint, fontSize: 9.8, marginTop: 8 }}>Full manufacturing cost is paid when the order is placed. Warehouse space is reserved immediately for inbound inventory.</div>
    </div>

    <div style={{ color: C.dim, fontSize: 11, marginTop: 10 }}>Maximum available with these terms: <b>{fmtNum(quote.maxBatch)}</b> units.</div>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14, alignItems: "end" }}><button style={{ ...ctrlBtn, color: C.red }} onClick={discard}>Discard design</button><div style={{ display: "grid", justifyItems: "end", gap: 4 }}><button disabled={!quote.check.ok} title={!quote.check.ok ? quote.check.reason : undefined} style={{ ...bigBtn, opacity: quote.check.ok ? 1 : .45 }} onClick={orderBatch}>Order first batch · {fmtMoney(quote.totalCost)}</button>{!quote.check.ok && <ActionReason>{quote.check.reason}</ActionReason>}</div></div></>;
}

function ManufacturingStage({ world, sku }: { world: World; sku: SKU }) {
  const total = productionLeadDays(world, sku, sku.mfgBatchSize || 1); const pct = total > 0 ? 1 - sku.mfgDaysLeft / total : 0;
  return <><SectionTitle title="Batch in production" text="You can watch it, but this version's manufacturer and production standard are now committed." /><InfoGrid rows={[["Manufacturer", sku.method === "own" ? "Own factory" : supplierById(sku.supplierId)?.name ?? "Partner"], ["Batch", `${fmtNum(sku.mfgBatchSize)} units`], ["Unit cost", `$${sku.unitCost.toFixed(2)}`], ["Days remaining", String(Math.ceil(sku.mfgDaysLeft))]]} /><div style={{ height: 9, background: C.grid, borderRadius: 99, marginTop: 14 }}><div style={{ width: `${Math.max(3,Math.min(100,pct*100))}%`, height: "100%", borderRadius: 99, background: C.cyan }} /></div><div style={{ color: C.faint, fontSize: 10.5, marginTop: 7 }}>When the batch arrives it will sit in inventory. Nothing goes on sale until you configure the launch.</div></>;
}

function SellStage({ world, sku, si, price, setPrice, segment, setSegment, launchBudget, setLaunchBudget, assignPartner, openContract, launch, openSegments }: any) {
  const launchBlocker = sku.inventory <= 0 ? "The first batch must arrive in the warehouse before launch." : price <= 0 ? "Set a selling price first." : !(sku.assignedPartnerIds ?? []).length ? "Assign at least one signed sales channel before launch." : null;
  const readiness = launchReadiness(world, { ...sku, listPrice: price }, launchBudget);
  const readinessColor = readiness.score >= 80 ? C.green : readiness.score >= 60 ? C.cyan : readiness.score >= 35 ? C.amber : C.red;
  return <><SectionTitle title="Prepare the launch" text="Decide who you are selling to, what they pay, where they can buy it, and how loudly you announce it." />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
      <div><FieldLabel>Price</FieldLabel><NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={setPrice} /><FieldLabel>Audience for launch</FieldLabel><AudienceSelect world={world} value={segment} onChange={setSegment} /><button style={{ ...ctrlBtn, width: "100%", marginTop: 5 }} onClick={openSegments}>＋ Create / edit audience segment</button><FieldLabel>Launch advertising</FieldLabel><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>{[0,25_000,100_000,250_000].map((v) => <button key={v} style={{ ...ctrlBtn, borderColor: launchBudget === v ? C.violet : C.line, color: launchBudget === v ? C.violet : C.dim }} onClick={() => setLaunchBudget(v)}>{v === 0 ? "No campaign" : fmtMoney(v)}</button>)}</div></div>
      <div><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract} /></div>
    </div>
    <div style={{ marginTop: 14, border: `1px solid ${readinessColor}55`, background: `${readinessColor}0c`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: C.faint, fontSize: 8.5, fontWeight: 900, letterSpacing: .7 }}>LAUNCH READINESS</div><b style={{ fontSize: 14, color: readinessColor }}>{readiness.label}</b></div><div style={{ color: readinessColor, fontWeight: 900, fontSize: 18 }}>{readiness.score}/100</div></div>
      <div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{readiness.detail}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 6, marginTop: 9 }}>{readiness.checks.map((check) => <div key={check.label} style={{ background: "rgba(255,255,255,.72)", border: `1px solid ${check.done ? "#b8e6ce" : C.line}`, borderRadius: 8, padding: "7px 8px" }}><b style={{ fontSize: 10.5, color: check.done ? C.green : C.ink }}>{check.done ? "✓" : "○"} {check.label}</b><div style={{ color: C.faint, fontSize: 9, lineHeight: 1.35, marginTop: 2 }}>{check.detail}</div></div>)}</div>
      {!launchBlocker && <div style={{ color: readinessColor, fontSize: 10, fontWeight: 700, marginTop: 8 }}>Next: {readiness.next}</div>}
    </div>
    <div style={{ marginTop: 14, padding: 10, borderRadius: 9, background: C.panel2, color: C.dim, fontSize: 11 }}><b style={{ color: C.ink }}>{fmtNum(sku.inventory)} units</b> are ready in the warehouse. Launching makes the SKU visible to demand immediately.</div>
    <button disabled={Boolean(launchBlocker)} title={launchBlocker ?? undefined} style={{ ...bigBtn, width: "100%", marginTop: 12, opacity: launchBlocker ? .45 : 1 }} onClick={launch}>🚀 Release product</button>{launchBlocker && <ActionReason>{launchBlocker}</ActionReason>}</>;
}

function AnalyzeStage({ world, sku, si, r, price, setPrice, segment, setSegment, setProductPrice, retargetProduct, assignPartner, openContract, batch, setBatch, produce, commissionStudy, newVersion, openMarketing, openSegments }: any) {
  const dist = distributionMetricsForSku(world, sku);
  const reorderQuote = getManufacturingQuote(world, sku, sku.method, sku.supplierId ?? "", sku.manufacturingStars ?? 3, batch);
  const reorderBlocker = (sku.mfgBatchSize ?? 0) > 0 ? "A batch is already in production or inbound." : reorderQuote.check.reason;
  const studyInFlight = world.studies.some((study: any) => study.type === "product_diagnosis" && study.skuId === sku.id && !study.done);
  return <><SectionTitle title="Analyze and iterate" text="Review score, sales volume and margin answer different questions. Change the live commercial plan now, or redesign the next version using retained study lessons." />
    <InfoGrid rows={[["Product review", `★ ${(sku.reviewScore ?? 1).toFixed(1)} / 5`], ["Sales / day", ((r.units ?? 0)/90).toFixed((r.units ?? 0)/90 < 10 ? 1 : 0)], ["Sales / Q", fmtNum(r.units ?? 0)], ["Revenue / Q", fmtMoney(r.revenue ?? 0)], ["Product contribution / Q", fmtMoney(r.margin ?? 0)], ["Inventory", fmtNum(sku.inventory)], ["Lifetime units", fmtNum(sku.unitsSoldTotal ?? 0)], ["Channels", String(dist.contracts.length)]]} />
    {sku.marketStudy && <ProductStudyPanel sku={sku} />}
    <CompetitiveSnapshot world={world} sku={sku} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 14 }}>
      <div style={subPanel}><b>Commercial plan</b><FieldLabel>Price</FieldLabel><NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={(v) => { setPrice(v); setProductPrice(si,v); }} /><FieldLabel>Audience</FieldLabel><AudienceSelect world={world} value={segment} onChange={(v) => { setSegment(v); retargetProduct(si,v); }} /><button style={{ ...ctrlBtn, width: "100%", marginTop: 5 }} onClick={openSegments}>＋ Create / edit audience segment</button><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract} /></div>
      <div style={subPanel}><b>Supply & learning</b><FieldLabel>Reorder same version</FieldLabel><NumberInput label="Batch" min={1000} max={Math.max(1000,reorderQuote.maxBatch)} step={1000} value={Math.max(1000,Math.min(batch,Math.max(1000,reorderQuote.maxBatch)))} suffix="units" onChange={setBatch} /><div style={{ display: "flex", justifyContent: "space-between", color: C.dim, fontSize: 10.5, marginTop: 6 }}><span>Estimated cost</span><b>{fmtMoney(reorderQuote.totalCost)}</b></div><button disabled={(sku.mfgBatchSize ?? 0) > 0 || !reorderQuote.check.ok} title={reorderBlocker || undefined} style={{ ...ctrlBtn, width: "100%", marginTop: 7, opacity: (sku.mfgBatchSize ?? 0) <= 0 && reorderQuote.check.ok ? 1 : .45 }} onClick={() => produce(si, batch)}>{(sku.mfgBatchSize ?? 0) > 0 ? "Batch already inbound" : `Order another batch · ${fmtMoney(reorderQuote.totalCost)}`}</button>{((sku.mfgBatchSize ?? 0) > 0 || !reorderQuote.check.ok) && <ActionReason>{reorderBlocker}</ActionReason>}<button disabled={studyInFlight} style={{ ...ctrlBtn, width: "100%", marginTop: 7, opacity: studyInFlight ? .5 : 1 }} onClick={commissionStudy}>{studyInFlight ? "🔎 Study in progress…" : sku.marketStudy ? "🔎 Refresh market study" : "🔎 Post-launch market study"}</button><button style={{ ...ctrlBtn, width: "100%", marginTop: 7 }} onClick={openMarketing}>📣 Change advertising / campaign</button><button style={{ ...bigBtn, width: "100%", marginTop: 7 }} onClick={newVersion}>Create redesigned V{(sku.version ?? 1) + 1}</button><div style={{ color: C.faint, fontSize: 9.5, marginTop: 6 }}>The study never buffs this product. Apply its named lessons yourself in the next brief; live price, audience, channels and advertising can change immediately.</div></div>
    </div></>;
}

function ProductStudyPanel({ sku }: { sku: SKU }) {
  const report = sku.marketStudy;
  if (!report) return null;
  return <div style={{ ...subPanel, marginTop: 12, borderColor: `${C.cyan}55`, background: `${C.cyan}08` }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><div><div style={{ color: C.cyan, fontSize: 9, fontWeight: 900, letterSpacing: .7 }}>RETAINED MARKET STUDY</div><b style={{ fontSize: 13 }}>{report.headline}</b></div><span style={{ color: C.faint, fontSize: 9.5 }}>Target: {report.targetLabel}</span></div>
    <div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{report.summary}</div>
    <div style={{ display: "grid", gap: 7, marginTop: 9 }}>{report.lessons.map((lesson) => <div key={lesson.id} style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 8, padding: 8 }}><b style={{ fontSize: 10.8 }}>{lesson.title}</b><div style={{ color: C.dim, fontSize: 9.8, marginTop: 2 }}>{lesson.finding}</div><div style={{ color: C.green, fontSize: 9.8, marginTop: 3 }}>Next move: {lesson.action}</div></div>)}</div>
    <details style={{ marginTop: 8 }}><summary style={{ color: C.dim, fontSize: 10, cursor: "pointer" }}>Why the product review scored {report.quality.reviewScore.toFixed(1)}</summary><div style={{ color: C.faint, fontSize: 9.8, lineHeight: 1.45, marginTop: 5 }}>{report.quality.diagnosis.map((reason) => <div key={reason}>• {reason}</div>)}</div></details>
  </div>;
}

function CompetitiveSnapshot({ world, sku }: { world: World; sku: SKU }) {
  const direct = world.comps.flatMap((comp) => comp.products.filter((p) => p.productKey === sku.productKey).map((p) => ({ comp, p })));
  const fallback = world.comps.flatMap((comp) => (comp.products[0] ? [{ comp, p: comp.products[0] }] : []));
  const rivals = (direct.length ? direct : fallback).sort((a,b) => b.comp.strength - a.comp.strength).slice(0,3);
  if (!rivals.length) return <div style={{ ...subPanel, marginTop: 12 }}><b>Competitive check</b><div style={{ color: C.faint, fontSize: 10.5, marginTop: 5 }}>No competitor benchmark is available yet.</div></div>;
  const exactCategory = direct.length > 0;
  const avgPrice = rivals.reduce((a,x)=>a+x.p.price,0)/rivals.length;
  const avgQuality = rivals.reduce((a,x)=>a+x.p.quality,0)/rivals.length;
  const priceDelta = avgPrice > 0 ? sku.listPrice / avgPrice - 1 : 0;
  const qualityDelta = sku.quality - avgQuality;
  return <div style={{ ...subPanel, marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}><b>Competitive check — {archetypeByKey(sku.productKey)?.label ?? sku.productKey}</b><span style={{ color: C.faint, fontSize: 9.5 }}>{exactCategory ? "same-category rivals" : "nearest market benchmark"}</span></div>
    {!exactCategory && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 5 }}>No direct rival SKU is tracked for this category yet, so this compares against each competitor's core line instead.</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7, marginTop: 8 }}>
      <div style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 8, padding: 8 }}><div style={{ color: C.faint, fontSize: 9 }}>YOUR PRICE VS BENCHMARK</div><b style={{ color: Math.abs(priceDelta) < .12 ? C.green : C.amber }}>{priceDelta >= 0 ? "+" : ""}{Math.round(priceDelta*100)}%</b><div style={{ color: C.faint, fontSize: 9.5 }}>You {fmtMoney(sku.listPrice)} · avg {fmtMoney(avgPrice)}</div></div>
      <div style={{ background: "white", border: `1px solid ${C.line}`, borderRadius: 8, padding: 8 }}><div style={{ color: C.faint, fontSize: 9 }}>QUALITY VS BENCHMARK</div><b style={{ color: qualityDelta >= .05 ? C.green : qualityDelta < -.05 ? C.red : C.amber }}>{qualityDelta >= 0 ? "+" : ""}{Math.round(qualityDelta*100)} pts</b><div style={{ color: C.faint, fontSize: 9.5 }}>You {Math.round(sku.quality*100)} · avg {Math.round(avgQuality*100)}</div></div>
    </div>
    <div style={{ display: "grid", gap: 5, marginTop: 8 }}>{rivals.map(({comp,p}) => <div key={`${comp.id}_${p.awarenessKey}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, fontSize: 10.5, borderTop: `1px solid ${C.grid}`, paddingTop: 5 }}><span><b>{comp.name}</b> · {comp.personality}</span><span>${p.price.toFixed(0)}</span><span>Q {Math.round(p.quality*100)}</span></div>)}</div>
    <div style={{ color: C.faint, fontSize: 9.5, marginTop: 7 }}>Contribution is after product cost and retailer cut, before company overhead. Use the post-launch market study to diagnose price, channel, brand and IP fit.</div>
  </div>;
}

function getManufacturingQuote(world: World, sku: SKU, method: "own" | "outsource", supplierId: string | null, stars: number, qty: number) {
  const cfg = INDUSTRIES[sku.industryId] ?? world.cfg;
  const pt = cfg.products.find((p) => p.key === sku.productKey) ?? cfg.products[0];
  const standard = manufacturingStandard(stars);
  const supplier = method === "outsource" ? supplierById(supplierId) : null;
  const unitCost = deriveUnitCost(pt, method, standard.materialQuality, standard.productionQuality, supplier?.costMult ?? 1, world.materialPriceIndex) * TESTING_LEVELS[sku.testingLevel ?? "standard"].costMult;
  const quality = deriveQuality(standard.materialQuality, standard.productionQuality, supplier?.qualityAdj ?? 0);
  const preview = { unitCost, method, supplierId: supplier?.id ?? null, productKey: sku.productKey };
  const safeQty = Math.max(1000, Math.round(qty));
  const maxBatch = maxManufacturableBatch(world, preview);
  const check = canProduce(world, safeQty, unitCost, method, supplier?.id ?? null, sku.productKey);
  const leadDays = productionLeadDays(world, preview, safeQty);
  const warehouseFree = Math.max(0, warehouseUnitCapacity(world, sku.productKey) - inventoryUsedForStorageProfile(world, sku.productKey));
  const warehouseNeeded = safeQty * storageSpaceForProduct(sku.productKey);
  return { unitCost, quality, maxBatch, check, leadDays, totalCost: safeQty * unitCost, warehouseFree, warehouseNeeded };
}

function QuoteStat({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return <div style={{ background: "rgba(255,255,255,.72)", border: `1px solid ${C.line}`, borderRadius: 8, padding: 8 }}><div style={{ color: C.faint, fontSize: 8.5, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><b style={{ color: tone === "bad" ? C.red : C.ink, fontSize: 11.5 }}>{value}</b></div>;
}

function ActionReason({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <div style={{ color: C.amber, fontSize: 9.8, lineHeight: 1.35, maxWidth: 330 }}>↳ {children}</div>;
}

function PartnerPicker({ world, sku, si, assignPartner, openContract }: any) {
  const contracts = world.player.contracts.filter((c: any) => !c.partnerId || true);
  return <><FieldLabel>Sales channels</FieldLabel>{contracts.length === 0 ? <div style={{ color: C.faint, fontSize: 11 }}>No partners signed yet.<br/><button style={{ ...ctrlBtn, marginTop: 7 }} onClick={openContract}>Negotiate a retailer</button></div> : <div style={{ display: "grid", gap: 6 }}>{contracts.map((c: any) => { const on = (sku.assignedPartnerIds ?? []).includes(c.partnerId); return <button key={c.partnerId} onClick={() => assignPartner(si,c.partnerId,!on)} style={{ ...ctrlBtn, textAlign: "left", borderColor: on ? C.violet : C.line, color: on ? C.violet : C.dim }}> {on ? "✓" : "○"} {c.partnerName} <span style={{ float: "right", color: C.faint }}>{Math.round(c.marginCut*100)}% cut</span></button>; })}<button style={{ ...ctrlBtn, marginTop: 2 }} onClick={openContract}>＋ Negotiate another partner</button></div>}</>;
}

function AudienceSelect({ world, value, onChange }: { world: World; value: string; onChange: (v: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}><option value="broad">Broad market</option>{world.savedSegments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>; }
function segmentIdFor(world: World, sku: SKU) { return world.savedSegments.find((s) => s.name === (sku.targetLabel ?? "").split(" · ")[0])?.id ?? "broad"; }
function SectionTitle({ title, text }: { title: string; text: string }) { return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 15, fontWeight: 900 }}>{title}</div><div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginTop: 3 }}>{text}</div></div>; }
function InfoGrid({ rows }: { rows: [string,string][] }) { return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 7 }}>{rows.map(([k,v]) => <div key={k} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: 9 }}><div style={{ color: C.faint, fontSize: 9, textTransform: "uppercase" }}>{k}</div><b style={{ fontSize: 12.5 }}>{v}</b></div>)}</div>; }
const selectStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 9px", background: "white", color: C.ink, fontSize: 12 };
const subPanel: React.CSSProperties = { background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 };
