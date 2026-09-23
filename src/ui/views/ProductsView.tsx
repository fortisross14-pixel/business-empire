import React, { useEffect, useState } from "react";
import { C, UI, bigBtn, ctrlBtn, fmtMoney, fmtNum } from "../theme";
import { FieldLabel, NumberInput, StarRating } from "../components";
import type { SKU, World } from "../../engine/types";
import { DESIGN_DEPTHS, PRODUCT_PROJECT_TIERS } from "../../engine/types";
import { canCreateProduct, canProduce, maxManufacturableBatch, productionLeadDays, factoryCapacity, productionCapacity, warehouseUnitCapacity, inventoryUsedForStorageProfile } from "../../engine/capacity";
import { manufacturingStandard, qualityToStars } from "../../engine/productDesign";
import { deriveQuality, deriveUnitCost } from "../../engine/economics";
import { supplierById, suppliersForProduct } from "../../engine/suppliers";
import { archetypeByKey, storageSpaceForProduct } from "../../engine/productCatalog";
import { TESTING_LEVELS } from "../../engine/productDynamics";
import { distributionMetricsForSku } from "../../engine/distribution";
import { brandById } from "../../engine/brands";
import { INDUSTRIES } from "../../engine/industries";
import { ProductVisualCard } from "../visualIdentity";

interface ActionResult { ok: boolean; reason?: string }

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

export function ProductsView({ world, produce, setProductPrice, setProductQuality, setProductionSetup, assignPartner, openContract, openCreator, commissionStudy, releaseProduct, retargetProduct, discardProduct, openMarketing, openSegments, focusProductId, onFocusHandled }: {
  world: World;
  produce: (si: number, qty: number) => void;
  setProductPrice: (si: number, price: number) => void;
  setProductQuality: (si: number, stars: number) => void;
  setProductionSetup: (si: number, method: "own" | "outsource", supplierId?: string | null) => void;
  assignPartner: (si: number, partnerId: string, assign: boolean) => void;
  openContract: () => void;
  openCreator: (baseSkuId?: string) => void;
  commissionStudy: () => void;
  releaseProduct: (si: number, segmentId: string, launchBudget?: number) => ActionResult;
  retargetProduct: (si: number, segmentId: string) => boolean;
  discardProduct: (si: number) => boolean;
  openMarketing: () => void;
  openSegments: () => void;
  focusProductId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const check = canCreateProduct(world);
  const skus = world.player.skus;
  const liveCount = skus.filter((s) => s.releasedToMarket).length;
  const readyCount = skus.filter((s) => stageOf(s) === "sell" || stageOf(s) === "manufacture").length;
  const selectedIndex = selectedId ? skus.findIndex((s) => s.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? skus[selectedIndex] : null;
  useEffect(() => {
    if (focusProductId && skus.some((s) => s.id === focusProductId)) {
      setSelectedId(focusProductId);
      onFocusHandled?.();
    }
  }, [focusProductId, skus, onFocusHandled]);

  return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ color: C.ink, fontSize: 18, fontWeight: 900 }}>Product portfolio</div>
        <div style={{ color: C.faint, fontSize: 11, marginTop: 2 }}>{skus.length} products · {liveCount} live · {readyCount} awaiting a decision</div>
      </div>
      <div style={{ display: "grid", gap: 4, justifyItems: "end" }}><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} onClick={() => openCreator()} style={{ ...bigBtn, opacity: check.ok ? 1 : .45 }}>＋ Design a product</button>{!check.ok && <ActionReason>{check.reason}</ActionReason>}</div>
    </div>

    {skus.length === 0 ? <div style={{ border: `1px dashed ${C.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: C.dim }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📦</div>
      <b>No products yet.</b><div style={{ fontSize: 11, marginTop: 5 }}>{check.ok ? "Start with a product brief." : check.reason}</div>
    </div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
      {skus.map((sku, si) => {
        const stage = stageOf(sku); const meta = STAGE_META[stage]; const r = world.live?.skuResults?.[si];
        return <button key={sku.id} onClick={() => setSelectedId(sku.id)} style={{ textAlign: "left", cursor: "pointer", background: "linear-gradient(180deg,#fff,#f7fafc)", border: `1px solid ${C.line}`, borderRadius: UI.radius.lg, padding: 12, color: C.ink, boxShadow: UI.shadow.card, transition: "transform .12s, box-shadow .12s, border-color .12s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</div><div style={{ color: C.faint, fontSize: 10, marginTop: 2 }}>{archetypeByKey(sku.productKey)?.label ?? sku.productKey} · V{sku.version ?? 1}</div></div>
            <span style={{ flex: "0 0 auto", color: meta.color, background: `${meta.color}16`, border: `1px solid ${meta.color}45`, borderRadius: 999, padding: "4px 7px", fontSize: 8.5, fontWeight: 900, letterSpacing: .55 }}>{meta.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 12, alignItems: "center", marginTop: 11 }}>
            <div style={{ display: "grid", placeItems: "center", padding: 7, borderRadius: UI.radius.md, background: "#eef3f6", border: `1px solid ${C.grid}` }}><ProductVisualCard world={world} sku={sku} size={78} showLabels={false} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45 }}>{meta.blurb}</div>
              {stage === "analyze" && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 10, fontSize: 9.5 }}><span><b>{((r?.units ?? 0)/90).toFixed((r?.units ?? 0)/90 < 10 ? 1 : 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>units/day</small></span><span><b>{fmtMoney(r?.revenue ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>revenue/Q</small></span><span style={{ color: (r?.margin ?? 0) >= 0 ? C.green : C.red }}><b>{fmtMoney(r?.margin ?? 0)}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>contribution/Q</small></span></div>}
              {stage === "sell" && <div style={{ color: C.violet, fontSize: 10.5, marginTop: 9 }}><b>{fmtNum(sku.inventory)}</b> units waiting in warehouse</div>}
            </div>
          </div>
        </button>;
      })}
    </div>}

    {selected && <ProductDetailModal world={world} sku={selected} si={selectedIndex} onClose={() => setSelectedId(null)} produce={produce} setProductPrice={setProductPrice} setProductQuality={setProductQuality} setProductionSetup={setProductionSetup} assignPartner={assignPartner} openContract={openContract} openCreator={openCreator} commissionStudy={commissionStudy} releaseProduct={releaseProduct} retargetProduct={retargetProduct} discardProduct={discardProduct} openMarketing={openMarketing} openSegments={openSegments} />}
  </div>;
}

function ProductDetailModal({ world, sku, si, onClose, produce, setProductPrice, setProductQuality, setProductionSetup, assignPartner, openContract, openCreator, commissionStudy, releaseProduct, retargetProduct, discardProduct, openMarketing, openSegments }: {
  world: World; sku: SKU; si: number; onClose: () => void;
  produce: (si: number, qty: number) => void; setProductPrice: (si: number, price: number) => void; setProductQuality: (si: number, stars: number) => void; setProductionSetup: (si: number, method: "own" | "outsource", supplierId?: string | null) => void;
  assignPartner: (si: number, partnerId: string, assign: boolean) => void; openContract: () => void; openCreator: (baseSkuId?: string) => void; commissionStudy: () => void;
  releaseProduct: (si: number, segmentId: string, launchBudget?: number) => ActionResult; retargetProduct: (si: number, segmentId: string) => boolean; discardProduct: (si: number) => boolean; openMarketing: () => void; openSegments: () => void;
}) {
  const stage = stageOf(sku); const meta = STAGE_META[stage]; const r = world.live?.skuResults?.[si] ?? {};
  const [price, setPrice] = useState(sku.listPrice);
  const [segment, setSegment] = useState(segmentIdFor(world, sku));
  const [launchBudget, setLaunchBudget] = useState(25_000);
  const [message, setMessage] = useState<string | null>(null);
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

  return <div style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(4,17,30,.56)", display: "grid", placeItems: "center", padding: 18 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ width: "min(820px,96vw)", maxHeight: "90vh", overflow: "auto", background: "white", borderRadius: 16, border: `1px solid ${C.line}`, boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.96)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}`, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><ProductVisualCard world={world} sku={sku} size={64} showLabels={false} /><div><div style={{ fontWeight: 900, fontSize: 17 }}>{sku.name} <span style={{ color: C.faint, fontSize: 10 }}>v{sku.version ?? 1}</span></div><div style={{ color: meta.color, fontSize: 10.5, fontWeight: 900, marginTop: 3 }}>{meta.icon} {meta.label}</div></div></div>
        <button style={ctrlBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <StageRail stage={stage} />
        {stage === "design" && <DesignStage world={world} sku={sku} discard={() => { if (discardProduct(si)) onClose(); }} />}
        {stage === "manufacture" && <ManufactureStage world={world} sku={sku} method={method} setMethod={setMethod} supplierId={supplierId} setSupplierId={setSupplierId} mfgStars={mfgStars} setMfgStars={setMfgStars} batch={batch} setBatch={setBatch} quote={manufactureQuote} orderBatch={orderBatch} discard={() => { if (discardProduct(si)) onClose(); }} />}
        {stage === "manufacturing" && <ManufacturingStage world={world} sku={sku} />}
        {stage === "sell" && <SellStage world={world} sku={sku} si={si} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} launchBudget={launchBudget} setLaunchBudget={setLaunchBudget} assignPartner={assignPartner} openContract={openContract} launch={launch} openSegments={openSegments} />}
        {stage === "analyze" && <AnalyzeStage world={world} sku={sku} si={si} r={r} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} setProductPrice={setProductPrice} retargetProduct={retargetProduct} assignPartner={assignPartner} openContract={openContract} batch={batch} setBatch={setBatch} produce={produce} commissionStudy={commissionStudy} newVersion={() => openCreator(sku.id)} openMarketing={openMarketing} openSegments={openSegments} />}
        {message && <div style={{ marginTop: 12, color: message.includes("launched") ? C.green : C.amber, fontSize: 11.5 }}>{message}</div>}
      </div>
    </div>
  </div>;
}

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
    <div style={{ color: C.faint, fontSize: 10, marginTop: 7 }}>{tier === "AAA" ? "AAA uses a Product Lead plus three designers; the Lead contributes 45% of team effectiveness." : tier === "AA" ? "AA uses a Product Lead plus one designer." : "A is a focused one-designer project with a 1–2★ design ceiling."}</div>
    <button style={{ ...ctrlBtn, color: C.red, marginTop: 14 }} onClick={discard}>Discard project</button></>;
}

function ManufactureStage({ world, sku, method, setMethod, supplierId, setSupplierId, mfgStars, setMfgStars, batch, setBatch, quote, orderBatch, discard }: any) {
  const suppliers = suppliersForProduct(sku.productKey); const ownAvailable = factoryCapacity(world, sku.productKey).total > 0; const selectedSupplier = supplierById(supplierId);
  const routeName = method === "own" ? "Own factory" : selectedSupplier?.name ?? "Manufacturing partner";
  const supplierCapacity = method === "own" ? factoryCapacity(world, sku.productKey).total : productionCapacity(world, "outsource", supplierId, sku.productKey);
  return <><SectionTitle title="Manufacture the design" text="Now choose the manufacturer, production standard and first batch. Nothing is charged until you place the order; once production starts, this manufacturer and standard are locked for this version." />
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
  return <><SectionTitle title="Prepare the launch" text="Decide who you are selling to, what they pay, where they can buy it, and how loudly you announce it." />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
      <div><FieldLabel>Price</FieldLabel><NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={setPrice} /><FieldLabel>Audience for launch</FieldLabel><AudienceSelect world={world} value={segment} onChange={setSegment} /><button style={{ ...ctrlBtn, width: "100%", marginTop: 5 }} onClick={openSegments}>＋ Create / edit audience segment</button><FieldLabel>Launch advertising</FieldLabel><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>{[0,25_000,100_000,250_000].map((v) => <button key={v} style={{ ...ctrlBtn, borderColor: launchBudget === v ? C.violet : C.line, color: launchBudget === v ? C.violet : C.dim }} onClick={() => setLaunchBudget(v)}>{v === 0 ? "No campaign" : fmtMoney(v)}</button>)}</div></div>
      <div><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract} /></div>
    </div>
    <div style={{ marginTop: 14, padding: 10, borderRadius: 9, background: C.panel2, color: C.dim, fontSize: 11 }}><b style={{ color: C.ink }}>{fmtNum(sku.inventory)} units</b> are ready in the warehouse. Launching makes the SKU visible to demand immediately.</div>
    <button disabled={Boolean(launchBlocker)} title={launchBlocker ?? undefined} style={{ ...bigBtn, width: "100%", marginTop: 12, opacity: launchBlocker ? .45 : 1 }} onClick={launch}>🚀 Release product</button>{launchBlocker && <ActionReason>{launchBlocker}</ActionReason>}</>;
}

function AnalyzeStage({ world, sku, si, r, price, setPrice, segment, setSegment, setProductPrice, retargetProduct, assignPartner, openContract, batch, setBatch, produce, commissionStudy, newVersion, openMarketing, openSegments }: any) {
  const dist = distributionMetricsForSku(world, sku);
  const reorderQuote = getManufacturingQuote(world, sku, sku.method, sku.supplierId ?? "", sku.manufacturingStars ?? 3, batch);
  const reorderBlocker = (sku.mfgBatchSize ?? 0) > 0 ? "A batch is already in production or inbound." : reorderQuote.check.reason;
  return <><SectionTitle title="Analyze and iterate" text="This version is live. You can change the commercial plan, reorder the same product, or create a redesigned V2 if manufacturing itself needs to change." />
    <InfoGrid rows={[["Sales / day", ((r.units ?? 0)/90).toFixed((r.units ?? 0)/90 < 10 ? 1 : 0)], ["Sales / Q", fmtNum(r.units ?? 0)], ["Revenue / Q", fmtMoney(r.revenue ?? 0)], ["Product contribution / Q", fmtMoney(r.margin ?? 0)], ["Inventory", fmtNum(sku.inventory)], ["Lifetime units", fmtNum(sku.unitsSoldTotal ?? 0)], ["Channels", String(dist.contracts.length)]]} />
    <CompetitiveSnapshot world={world} sku={sku} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 14 }}>
      <div style={subPanel}><b>Commercial plan</b><FieldLabel>Price</FieldLabel><NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={(v) => { setPrice(v); setProductPrice(si,v); }} /><FieldLabel>Audience</FieldLabel><AudienceSelect world={world} value={segment} onChange={(v) => { setSegment(v); retargetProduct(si,v); }} /><button style={{ ...ctrlBtn, width: "100%", marginTop: 5 }} onClick={openSegments}>＋ Create / edit audience segment</button><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract} /></div>
      <div style={subPanel}><b>Supply & learning</b><FieldLabel>Reorder same version</FieldLabel><NumberInput label="Batch" min={1000} max={Math.max(1000,reorderQuote.maxBatch)} step={1000} value={Math.max(1000,Math.min(batch,Math.max(1000,reorderQuote.maxBatch)))} suffix="units" onChange={setBatch} /><div style={{ display: "flex", justifyContent: "space-between", color: C.dim, fontSize: 10.5, marginTop: 6 }}><span>Estimated cost</span><b>{fmtMoney(reorderQuote.totalCost)}</b></div><button disabled={(sku.mfgBatchSize ?? 0) > 0 || !reorderQuote.check.ok} title={reorderBlocker || undefined} style={{ ...ctrlBtn, width: "100%", marginTop: 7, opacity: (sku.mfgBatchSize ?? 0) <= 0 && reorderQuote.check.ok ? 1 : .45 }} onClick={() => produce(si, batch)}>{(sku.mfgBatchSize ?? 0) > 0 ? "Batch already inbound" : `Order another batch · ${fmtMoney(reorderQuote.totalCost)}`}</button>{((sku.mfgBatchSize ?? 0) > 0 || !reorderQuote.check.ok) && <ActionReason>{reorderBlocker}</ActionReason>}<button style={{ ...ctrlBtn, width: "100%", marginTop: 7 }} onClick={commissionStudy}>🔎 Post-launch market study</button><button style={{ ...ctrlBtn, width: "100%", marginTop: 7 }} onClick={openMarketing}>📣 Change advertising / campaign</button><button style={{ ...bigBtn, width: "100%", marginTop: 7 }} onClick={newVersion}>Create redesigned V{(sku.version ?? 1) + 1}</button><div style={{ color: C.faint, fontSize: 9.5, marginTop: 6 }}>Use a new version if you want a different manufacturer or a redesigned product. Price, audience, channels and advertising can evolve without redesigning.</div></div>
    </div></>;
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
