"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsView = ProductsView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var types_1 = require("../../engine/types");
var capacity_1 = require("../../engine/capacity");
var productDesign_1 = require("../../engine/productDesign");
var economics_1 = require("../../engine/economics");
var suppliers_1 = require("../../engine/suppliers");
var productCatalog_1 = require("../../engine/productCatalog");
var productDynamics_1 = require("../../engine/productDynamics");
var distribution_1 = require("../../engine/distribution");
var industries_1 = require("../../engine/industries");
var visualIdentity_1 = require("../visualIdentity");
function stageOf(sku) {
    if (sku.status === "designing")
        return "design";
    if (sku.status === "designed")
        return "manufacture";
    if (sku.status === "manufacturing")
        return "manufacturing";
    if (sku.status === "active" && !sku.releasedToMarket)
        return "sell";
    return "analyze";
}
var STAGE_META = {
    design: { label: "DESIGN", icon: "✏️", color: theme_1.C.amber, blurb: "The product team is developing the proposition." },
    manufacture: { label: "MANUFACTURE", icon: "🏭", color: theme_1.C.cyan, blurb: "Design approved. Choose how to make the first batch." },
    manufacturing: { label: "MANUFACTURING", icon: "⚙️", color: theme_1.C.cyan, blurb: "The first batch is in production." },
    sell: { label: "SELL", icon: "🚀", color: theme_1.C.violet, blurb: "Inventory is ready. Set the commercial launch." },
    analyze: { label: "ANALYZE", icon: "📈", color: theme_1.C.green, blurb: "Live in market. Learn, replenish and iterate." },
};
function ProductsView(_a) {
    var world = _a.world, produce = _a.produce, setProductPrice = _a.setProductPrice, setProductQuality = _a.setProductQuality, setProductionSetup = _a.setProductionSetup, assignPartner = _a.assignPartner, openContract = _a.openContract, openCreator = _a.openCreator, commissionStudy = _a.commissionStudy, releaseProduct = _a.releaseProduct, retargetProduct = _a.retargetProduct, discardProduct = _a.discardProduct, openMarketing = _a.openMarketing, openSegments = _a.openSegments, focusProductId = _a.focusProductId, onFocusHandled = _a.onFocusHandled;
    var _b = (0, react_1.useState)(null), selectedId = _b[0], setSelectedId = _b[1];
    var check = (0, capacity_1.canCreateProduct)(world);
    var skus = world.player.skus;
    var liveCount = skus.filter(function (s) { return s.releasedToMarket; }).length;
    var readyCount = skus.filter(function (s) { return stageOf(s) === "sell" || stageOf(s) === "manufacture"; }).length;
    var selectedIndex = selectedId ? skus.findIndex(function (s) { return s.id === selectedId; }) : -1;
    var selected = selectedIndex >= 0 ? skus[selectedIndex] : null;
    (0, react_1.useEffect)(function () {
        if (focusProductId && skus.some(function (s) { return s.id === focusProductId; })) {
            setSelectedId(focusProductId);
            onFocusHandled === null || onFocusHandled === void 0 ? void 0 : onFocusHandled();
        }
    }, [focusProductId, skus, onFocusHandled]);
    return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
      <div>
        <div style={{ color: theme_1.C.ink, fontSize: 18, fontWeight: 900 }}>Product portfolio</div>
        <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 2 }}>{skus.length} products · {liveCount} live · {readyCount} awaiting a decision</div>
      </div>
      <div style={{ display: "grid", gap: 4, justifyItems: "end" }}><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} onClick={function () { return openCreator(); }} style={__assign(__assign({}, theme_1.bigBtn), { opacity: check.ok ? 1 : .45 })}>＋ Design a product</button>{!check.ok && <ActionReason>{check.reason}</ActionReason>}</div>
    </div>

    {skus.length === 0 ? <div style={{ border: "1px dashed ".concat(theme_1.C.line), borderRadius: 14, padding: 30, textAlign: "center", color: theme_1.C.dim }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📦</div>
      <b>No products yet.</b><div style={{ fontSize: 11, marginTop: 5 }}>{check.ok ? "Start with a product brief." : check.reason}</div>
    </div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 11 }}>
      {skus.map(function (sku, si) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                var stage = stageOf(sku);
                var meta = STAGE_META[stage];
                var r = (_b = (_a = world.live) === null || _a === void 0 ? void 0 : _a.skuResults) === null || _b === void 0 ? void 0 : _b[si];
                return <button key={sku.id} onClick={function () { return setSelectedId(sku.id); }} style={{ textAlign: "left", cursor: "pointer", background: "linear-gradient(180deg,#fff,#f7fafc)", border: "1px solid ".concat(theme_1.C.line), borderRadius: theme_1.UI.radius.lg, padding: 12, color: theme_1.C.ink, boxShadow: theme_1.UI.shadow.card, transition: "transform .12s, box-shadow .12s, border-color .12s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</div><div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 2 }}>{(_d = (_c = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _c === void 0 ? void 0 : _c.label) !== null && _d !== void 0 ? _d : sku.productKey} · V{(_e = sku.version) !== null && _e !== void 0 ? _e : 1}</div></div>
            <span style={{ flex: "0 0 auto", color: meta.color, background: "".concat(meta.color, "16"), border: "1px solid ".concat(meta.color, "45"), borderRadius: 999, padding: "4px 7px", fontSize: 8.5, fontWeight: 900, letterSpacing: .55 }}>{meta.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "132px minmax(0,1fr)", gap: 12, alignItems: "center", marginTop: 11 }}>
            <div style={{ display: "grid", placeItems: "center", padding: 7, borderRadius: theme_1.UI.radius.md, background: "#eef3f6", border: "1px solid ".concat(theme_1.C.grid) }}><visualIdentity_1.ProductVisualCard world={world} sku={sku} size={116} showLabels={false}/></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: theme_1.C.dim, fontSize: 10.5, lineHeight: 1.45 }}>{meta.blurb}</div>
              {stage === "analyze" && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 10, fontSize: 9.5 }}><span><b>{(((_f = r === null || r === void 0 ? void 0 : r.units) !== null && _f !== void 0 ? _f : 0) / 90).toFixed(((_g = r === null || r === void 0 ? void 0 : r.units) !== null && _g !== void 0 ? _g : 0) / 90 < 10 ? 1 : 0)}</b><small style={{ display: "block", color: theme_1.C.faint, marginTop: 2 }}>units/day</small></span><span><b>{(0, theme_1.fmtMoney)((_h = r === null || r === void 0 ? void 0 : r.revenue) !== null && _h !== void 0 ? _h : 0)}</b><small style={{ display: "block", color: theme_1.C.faint, marginTop: 2 }}>revenue/Q</small></span><span style={{ color: ((_j = r === null || r === void 0 ? void 0 : r.margin) !== null && _j !== void 0 ? _j : 0) >= 0 ? theme_1.C.green : theme_1.C.red }}><b>{(0, theme_1.fmtMoney)((_k = r === null || r === void 0 ? void 0 : r.margin) !== null && _k !== void 0 ? _k : 0)}</b><small style={{ display: "block", color: theme_1.C.faint, marginTop: 2 }}>contribution/Q</small></span></div>}
              {stage === "sell" && <div style={{ color: theme_1.C.violet, fontSize: 10.5, marginTop: 9 }}><b>{(0, theme_1.fmtNum)(sku.inventory)}</b> units waiting in warehouse</div>}
            </div>
          </div>
        </button>;
            })}
    </div>}

    {selected && <ProductDetailModal world={world} sku={selected} si={selectedIndex} onClose={function () { return setSelectedId(null); }} produce={produce} setProductPrice={setProductPrice} setProductQuality={setProductQuality} setProductionSetup={setProductionSetup} assignPartner={assignPartner} openContract={openContract} openCreator={openCreator} commissionStudy={commissionStudy} releaseProduct={releaseProduct} retargetProduct={retargetProduct} discardProduct={discardProduct} openMarketing={openMarketing} openSegments={openSegments}/>}
  </div>;
}
function ProductDetailModal(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var world = _a.world, sku = _a.sku, si = _a.si, onClose = _a.onClose, produce = _a.produce, setProductPrice = _a.setProductPrice, setProductQuality = _a.setProductQuality, setProductionSetup = _a.setProductionSetup, assignPartner = _a.assignPartner, openContract = _a.openContract, openCreator = _a.openCreator, commissionStudy = _a.commissionStudy, releaseProduct = _a.releaseProduct, retargetProduct = _a.retargetProduct, discardProduct = _a.discardProduct, openMarketing = _a.openMarketing, openSegments = _a.openSegments;
    var stage = stageOf(sku);
    var meta = STAGE_META[stage];
    var r = (_d = (_c = (_b = world.live) === null || _b === void 0 ? void 0 : _b.skuResults) === null || _c === void 0 ? void 0 : _c[si]) !== null && _d !== void 0 ? _d : {};
    var _k = (0, react_1.useState)(sku.listPrice), price = _k[0], setPrice = _k[1];
    var _l = (0, react_1.useState)(segmentIdFor(world, sku)), segment = _l[0], setSegment = _l[1];
    var _m = (0, react_1.useState)(25000), launchBudget = _m[0], setLaunchBudget = _m[1];
    var _o = (0, react_1.useState)(null), message = _o[0], setMessage = _o[1];
    var _p = (0, react_1.useState)(5000), batch = _p[0], setBatch = _p[1];
    var _q = (0, react_1.useState)((_e = sku.manufacturingStars) !== null && _e !== void 0 ? _e : (0, productDesign_1.qualityToStars)(sku.quality)), mfgStars = _q[0], setMfgStars = _q[1];
    var _r = (0, react_1.useState)(sku.method), method = _r[0], setMethod = _r[1];
    var _s = (0, react_1.useState)((_h = (_f = sku.supplierId) !== null && _f !== void 0 ? _f : (_g = (0, suppliers_1.suppliersForProduct)(sku.productKey)[0]) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : ""), supplierId = _s[0], setSupplierId = _s[1];
    var manufactureQuote = getManufacturingQuote(world, sku, method, supplierId, mfgStars, batch);
    var maxBatch = manufactureQuote.maxBatch;
    (0, react_1.useEffect)(function () { if (maxBatch > 0 && batch > maxBatch)
        setBatch(maxBatch); }, [maxBatch, batch]);
    var saveManufacturing = function () { setProductionSetup(si, method, method === "outsource" ? supplierId : null); setProductQuality(si, mfgStars); };
    var orderBatch = function () { if (!manufactureQuote.check.ok)
        return; saveManufacturing(); produce(si, batch); };
    var launch = function () { var _a; setProductPrice(si, price); var result = releaseProduct(si, segment, launchBudget); setMessage(result.ok ? "Product launched." : (_a = result.reason) !== null && _a !== void 0 ? _a : "Could not launch."); };
    return <div style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(4,17,30,.56)", display: "grid", placeItems: "center", padding: 18 }} onMouseDown={function (e) { if (e.target === e.currentTarget)
        onClose(); }}>
    <div style={{ width: "min(820px,96vw)", maxHeight: "90vh", overflow: "auto", background: "white", borderRadius: 16, border: "1px solid ".concat(theme_1.C.line), boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,.96)", backdropFilter: "blur(10px)", borderBottom: "1px solid ".concat(theme_1.C.line), padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><visualIdentity_1.ProductVisualCard world={world} sku={sku} size={72} showLabels={false}/><div><div style={{ fontWeight: 900, fontSize: 17 }}>{sku.name} <span style={{ color: theme_1.C.faint, fontSize: 10 }}>v{(_j = sku.version) !== null && _j !== void 0 ? _j : 1}</span></div><div style={{ color: meta.color, fontSize: 10.5, fontWeight: 900, marginTop: 3 }}>{meta.icon} {meta.label}</div></div></div>
        <button style={theme_1.ctrlBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: 16 }}>
        <StageRail stage={stage}/>
        {stage === "design" && <DesignStage world={world} sku={sku} discard={function () { if (discardProduct(si))
        onClose(); }}/>}
        {stage === "manufacture" && <ManufactureStage world={world} sku={sku} method={method} setMethod={setMethod} supplierId={supplierId} setSupplierId={setSupplierId} mfgStars={mfgStars} setMfgStars={setMfgStars} batch={batch} setBatch={setBatch} quote={manufactureQuote} orderBatch={orderBatch} discard={function () { if (discardProduct(si))
        onClose(); }}/>}
        {stage === "manufacturing" && <ManufacturingStage world={world} sku={sku}/>}
        {stage === "sell" && <SellStage world={world} sku={sku} si={si} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} launchBudget={launchBudget} setLaunchBudget={setLaunchBudget} assignPartner={assignPartner} openContract={openContract} launch={launch} openSegments={openSegments}/>}
        {stage === "analyze" && <AnalyzeStage world={world} sku={sku} si={si} r={r} price={price} setPrice={setPrice} segment={segment} setSegment={setSegment} setProductPrice={setProductPrice} retargetProduct={retargetProduct} assignPartner={assignPartner} openContract={openContract} batch={batch} setBatch={setBatch} produce={produce} commissionStudy={commissionStudy} newVersion={function () { return openCreator(sku.id); }} openMarketing={openMarketing} openSegments={openSegments}/>}
        {message && <div style={{ marginTop: 12, color: message.includes("launched") ? theme_1.C.green : theme_1.C.amber, fontSize: 11.5 }}>{message}</div>}
      </div>
    </div>
  </div>;
}
function StageRail(_a) {
    var stage = _a.stage;
    var order = ["design", "manufacture", "sell", "analyze"];
    var logical = stage === "manufacturing" ? "manufacture" : stage;
    var current = order.indexOf(logical);
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 18 }}>{order.map(function (s, i) { return <div key={s} style={{ borderRadius: 9, padding: "7px 8px", background: i <= current ? "".concat(STAGE_META[s].color, "12") : theme_1.C.panel2, border: "1px solid ".concat(i === current ? STAGE_META[s].color : theme_1.C.line), color: i <= current ? STAGE_META[s].color : theme_1.C.faint, fontSize: 9, fontWeight: 900, textAlign: "center" }}>{i + 1}. {STAGE_META[s].label}</div>; })}</div>;
}
function DesignStage(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    var world = _a.world, sku = _a.sku, discard = _a.discard;
    var tier = (_b = sku.projectTier) !== null && _b !== void 0 ? _b : (sku.designDepth === "breakthrough" ? "AAA" : sku.designDepth === "advanced" ? "AA" : "A");
    var total = Math.ceil(((_d = (_c = types_1.PRODUCT_PROJECT_TIERS[tier]) === null || _c === void 0 ? void 0 : _c.baseDays) !== null && _d !== void 0 ? _d : types_1.DESIGN_DEPTHS[sku.designDepth].days) * productDynamics_1.TESTING_LEVELS[(_e = sku.testingLevel) !== null && _e !== void 0 ? _e : "standard"].timeMult);
    var lead = world.player.personnel.find(function (p) { return p.id === sku.assignedPmId; });
    var designers = ((_f = sku.assignedDesignerIds) !== null && _f !== void 0 ? _f : []).map(function (id) { return world.player.personnel.find(function (p) { return p.id === id; }); }).filter(Boolean);
    var teamLabel = tier === "A" ? ((_h = (_g = lead === null || lead === void 0 ? void 0 : lead.name) !== null && _g !== void 0 ? _g : sku.assignedPmName) !== null && _h !== void 0 ? _h : "—") : "".concat((_k = (_j = lead === null || lead === void 0 ? void 0 : lead.name) !== null && _j !== void 0 ? _j : sku.assignedPmName) !== null && _k !== void 0 ? _k : "—", " (Lead) + ").concat(designers.map(function (p) { return p.name; }).join(", ") || "—");
    return <><SectionTitle title={"".concat(tier, " product design")} text="The brief is locked while the assigned team develops it. Larger project classes consume more people for longer, but raise the design ceiling."/>
    <InfoGrid rows={[[tier === "A" ? "Product Designer" : "Project team", teamLabel], ["Audience hypothesis", (_l = sku.targetLabel) !== null && _l !== void 0 ? _l : "Broad market"], ["Positioning", (_m = sku.positioning) !== null && _m !== void 0 ? _m : "—"], ["Days remaining", String(Math.ceil(sku.designDaysLeft))]]}/>
    <div style={{ height: 8, background: theme_1.C.grid, borderRadius: 99, marginTop: 12 }}><div style={{ width: "".concat(Math.max(5, Math.min(100, 100 - (sku.designDaysLeft / total) * 100)), "%"), height: "100%", borderRadius: 99, background: theme_1.C.amber }}/></div>
    <div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 7 }}>{tier === "AAA" ? "AAA uses a Product Lead plus three designers; the Lead contributes 45% of team effectiveness." : tier === "AA" ? "AA uses a Product Lead plus one designer." : "A is a focused one-designer project with a 1–2★ design ceiling."}</div>
    <button style={__assign(__assign({}, theme_1.ctrlBtn), { color: theme_1.C.red, marginTop: 14 })} onClick={discard}>Discard project</button></>;
}
function ManufactureStage(_a) {
    var _b;
    var world = _a.world, sku = _a.sku, method = _a.method, setMethod = _a.setMethod, supplierId = _a.supplierId, setSupplierId = _a.setSupplierId, mfgStars = _a.mfgStars, setMfgStars = _a.setMfgStars, batch = _a.batch, setBatch = _a.setBatch, quote = _a.quote, orderBatch = _a.orderBatch, discard = _a.discard;
    var suppliers = (0, suppliers_1.suppliersForProduct)(sku.productKey);
    var ownAvailable = (0, capacity_1.factoryCapacity)(world, sku.productKey).total > 0;
    var selectedSupplier = (0, suppliers_1.supplierById)(supplierId);
    var routeName = method === "own" ? "Own factory" : (_b = selectedSupplier === null || selectedSupplier === void 0 ? void 0 : selectedSupplier.name) !== null && _b !== void 0 ? _b : "Manufacturing partner";
    var supplierCapacity = method === "own" ? (0, capacity_1.factoryCapacity)(world, sku.productKey).total : (0, capacity_1.productionCapacity)(world, "outsource", supplierId, sku.productKey);
    return <><SectionTitle title="Manufacture the design" text="Now choose the manufacturer, production standard and first batch. Nothing is charged until you place the order; once production starts, this manufacturer and standard are locked for this version."/>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
      <div><components_1.FieldLabel>Production route</components_1.FieldLabel><div style={{ display: "flex", gap: 7 }}><button disabled={!ownAvailable} title={!ownAvailable ? "No compatible owned factory is available for this product." : undefined} onClick={function () { return setMethod("own"); }} style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1, borderColor: method === "own" ? theme_1.C.violet : theme_1.C.line, color: method === "own" ? theme_1.C.violet : theme_1.C.dim, opacity: ownAvailable ? 1 : .45 })}>Own factory</button><button onClick={function () { return setMethod("outsource"); }} style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1, borderColor: method === "outsource" ? theme_1.C.violet : theme_1.C.line, color: method === "outsource" ? theme_1.C.violet : theme_1.C.dim })}>Manufacturing partner</button></div>
      {!ownAvailable && <ActionReason>No compatible factory on campus. Build/retool a factory, or use a manufacturing partner.</ActionReason>}
      {method === "outsource" && <><components_1.FieldLabel>Partner</components_1.FieldLabel><select value={supplierId} onChange={function (e) { return setSupplierId(e.target.value); }} style={selectStyle}>{suppliers.map(function (s) { return <option key={s.id} value={s.id}>{s.name} — {s.label}</option>; })}</select><div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 4 }}>{selectedSupplier === null || selectedSupplier === void 0 ? void 0 : selectedSupplier.desc}</div></>}</div>
      <div><components_1.FieldLabel>Production standard</components_1.FieldLabel><components_1.StarRating value={mfgStars} onChange={setMfgStars}/><div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 4 }}>{(0, productDesign_1.manufacturingStandard)(mfgStars).label}. Better manufacturing costs more and protects perceived quality.</div><components_1.FieldLabel>First batch</components_1.FieldLabel><components_1.NumberInput label="Units" min={1000} max={Math.max(1000, quote.maxBatch)} step={1000} value={Math.max(1000, Math.min(batch, Math.max(1000, quote.maxBatch)))} suffix="units" onChange={setBatch}/></div>
    </div>

    <div style={{ marginTop: 14, border: "1px solid ".concat(quote.check.ok ? "#b8e6ce" : "#fed7aa"), background: quote.check.ok ? "#f2fbf6" : "#fff8ed", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}><div><div style={{ color: theme_1.C.faint, fontSize: 9, fontWeight: 900, letterSpacing: .8 }}>MANUFACTURING ORDER</div><b style={{ fontSize: 14 }}>{routeName}</b></div><div style={{ textAlign: "right" }}><div style={{ color: theme_1.C.faint, fontSize: 9 }}>TOTAL ORDER</div><b style={{ fontSize: 18, color: quote.check.ok ? theme_1.C.ink : theme_1.C.amber }}>{(0, theme_1.fmtMoney)(quote.totalCost)}</b></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 7, marginTop: 10 }}>
        <QuoteStat label="Batch" value={"".concat((0, theme_1.fmtNum)(batch), " units")}/>
        <QuoteStat label="Unit cost" value={(0, theme_1.fmtMoney)(quote.unitCost)}/>
        <QuoteStat label="Lead time" value={quote.leadDays >= 999 ? "Unavailable" : "~".concat(quote.leadDays, " days")}/>
        <QuoteStat label="Monthly capacity" value={(0, theme_1.fmtNum)(supplierCapacity)}/>
        <QuoteStat label="Delivered quality" value={"".concat(Math.round(quote.quality * 100), "/100")}/>
        <QuoteStat label="Cash after order" value={(0, theme_1.fmtMoney)(world.player.cash - quote.totalCost)} tone={world.player.cash - quote.totalCost < 0 ? "bad" : undefined}/>
      </div>
      <div style={{ color: theme_1.C.faint, fontSize: 9.8, marginTop: 8 }}>Full manufacturing cost is paid when the order is placed. Warehouse space is reserved immediately for inbound inventory.</div>
    </div>

    <div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 10 }}>Maximum available with these terms: <b>{(0, theme_1.fmtNum)(quote.maxBatch)}</b> units.</div>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14, alignItems: "end" }}><button style={__assign(__assign({}, theme_1.ctrlBtn), { color: theme_1.C.red })} onClick={discard}>Discard design</button><div style={{ display: "grid", justifyItems: "end", gap: 4 }}><button disabled={!quote.check.ok} title={!quote.check.ok ? quote.check.reason : undefined} style={__assign(__assign({}, theme_1.bigBtn), { opacity: quote.check.ok ? 1 : .45 })} onClick={orderBatch}>Order first batch · {(0, theme_1.fmtMoney)(quote.totalCost)}</button>{!quote.check.ok && <ActionReason>{quote.check.reason}</ActionReason>}</div></div></>;
}
function ManufacturingStage(_a) {
    var _b, _c;
    var world = _a.world, sku = _a.sku;
    var total = (0, capacity_1.productionLeadDays)(world, sku, sku.mfgBatchSize || 1);
    var pct = total > 0 ? 1 - sku.mfgDaysLeft / total : 0;
    return <><SectionTitle title="Batch in production" text="You can watch it, but this version's manufacturer and production standard are now committed."/><InfoGrid rows={[["Manufacturer", sku.method === "own" ? "Own factory" : (_c = (_b = (0, suppliers_1.supplierById)(sku.supplierId)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "Partner"], ["Batch", "".concat((0, theme_1.fmtNum)(sku.mfgBatchSize), " units")], ["Unit cost", "$".concat(sku.unitCost.toFixed(2))], ["Days remaining", String(Math.ceil(sku.mfgDaysLeft))]]}/><div style={{ height: 9, background: theme_1.C.grid, borderRadius: 99, marginTop: 14 }}><div style={{ width: "".concat(Math.max(3, Math.min(100, pct * 100)), "%"), height: "100%", borderRadius: 99, background: theme_1.C.cyan }}/></div><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 7 }}>When the batch arrives it will sit in inventory. Nothing goes on sale until you configure the launch.</div></>;
}
function SellStage(_a) {
    var _b;
    var world = _a.world, sku = _a.sku, si = _a.si, price = _a.price, setPrice = _a.setPrice, segment = _a.segment, setSegment = _a.setSegment, launchBudget = _a.launchBudget, setLaunchBudget = _a.setLaunchBudget, assignPartner = _a.assignPartner, openContract = _a.openContract, launch = _a.launch, openSegments = _a.openSegments;
    var launchBlocker = sku.inventory <= 0 ? "The first batch must arrive in the warehouse before launch." : price <= 0 ? "Set a selling price first." : !((_b = sku.assignedPartnerIds) !== null && _b !== void 0 ? _b : []).length ? "Assign at least one signed sales channel before launch." : null;
    return <><SectionTitle title="Prepare the launch" text="Decide who you are selling to, what they pay, where they can buy it, and how loudly you announce it."/>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
      <div><components_1.FieldLabel>Price</components_1.FieldLabel><components_1.NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={setPrice}/><components_1.FieldLabel>Audience for launch</components_1.FieldLabel><AudienceSelect world={world} value={segment} onChange={setSegment}/><button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 5 })} onClick={openSegments}>＋ Create / edit audience segment</button><components_1.FieldLabel>Launch advertising</components_1.FieldLabel><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>{[0, 25000, 100000, 250000].map(function (v) { return <button key={v} style={__assign(__assign({}, theme_1.ctrlBtn), { borderColor: launchBudget === v ? theme_1.C.violet : theme_1.C.line, color: launchBudget === v ? theme_1.C.violet : theme_1.C.dim })} onClick={function () { return setLaunchBudget(v); }}>{v === 0 ? "No campaign" : (0, theme_1.fmtMoney)(v)}</button>; })}</div></div>
      <div><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract}/></div>
    </div>
    <div style={{ marginTop: 14, padding: 10, borderRadius: 9, background: theme_1.C.panel2, color: theme_1.C.dim, fontSize: 11 }}><b style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtNum)(sku.inventory)} units</b> are ready in the warehouse. Launching makes the SKU visible to demand immediately.</div>
    <button disabled={Boolean(launchBlocker)} title={launchBlocker !== null && launchBlocker !== void 0 ? launchBlocker : undefined} style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 12, opacity: launchBlocker ? .45 : 1 })} onClick={launch}>🚀 Release product</button>{launchBlocker && <ActionReason>{launchBlocker}</ActionReason>}</>;
}
function AnalyzeStage(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    var world = _a.world, sku = _a.sku, si = _a.si, r = _a.r, price = _a.price, setPrice = _a.setPrice, segment = _a.segment, setSegment = _a.setSegment, setProductPrice = _a.setProductPrice, retargetProduct = _a.retargetProduct, assignPartner = _a.assignPartner, openContract = _a.openContract, batch = _a.batch, setBatch = _a.setBatch, produce = _a.produce, commissionStudy = _a.commissionStudy, newVersion = _a.newVersion, openMarketing = _a.openMarketing, openSegments = _a.openSegments;
    var dist = (0, distribution_1.distributionMetricsForSku)(world, sku);
    var reorderQuote = getManufacturingQuote(world, sku, sku.method, (_b = sku.supplierId) !== null && _b !== void 0 ? _b : "", (_c = sku.manufacturingStars) !== null && _c !== void 0 ? _c : 3, batch);
    var reorderBlocker = ((_d = sku.mfgBatchSize) !== null && _d !== void 0 ? _d : 0) > 0 ? "A batch is already in production or inbound." : reorderQuote.check.reason;
    return <><SectionTitle title="Analyze and iterate" text="This version is live. You can change the commercial plan, reorder the same product, or create a redesigned V2 if manufacturing itself needs to change."/>
    <InfoGrid rows={[["Sales / day", (((_e = r.units) !== null && _e !== void 0 ? _e : 0) / 90).toFixed(((_f = r.units) !== null && _f !== void 0 ? _f : 0) / 90 < 10 ? 1 : 0)], ["Sales / Q", (0, theme_1.fmtNum)((_g = r.units) !== null && _g !== void 0 ? _g : 0)], ["Revenue / Q", (0, theme_1.fmtMoney)((_h = r.revenue) !== null && _h !== void 0 ? _h : 0)], ["Product contribution / Q", (0, theme_1.fmtMoney)((_j = r.margin) !== null && _j !== void 0 ? _j : 0)], ["Inventory", (0, theme_1.fmtNum)(sku.inventory)], ["Lifetime units", (0, theme_1.fmtNum)((_k = sku.unitsSoldTotal) !== null && _k !== void 0 ? _k : 0)], ["Channels", String(dist.contracts.length)]]}/>
    <CompetitiveSnapshot world={world} sku={sku}/>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginTop: 14 }}>
      <div style={subPanel}><b>Commercial plan</b><components_1.FieldLabel>Price</components_1.FieldLabel><components_1.NumberInput label="List price" min={1} max={500} step={1} value={price} prefix="$" onChange={function (v) { setPrice(v); setProductPrice(si, v); }}/><components_1.FieldLabel>Audience</components_1.FieldLabel><AudienceSelect world={world} value={segment} onChange={function (v) { setSegment(v); retargetProduct(si, v); }}/><button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 5 })} onClick={openSegments}>＋ Create / edit audience segment</button><PartnerPicker world={world} sku={sku} si={si} assignPartner={assignPartner} openContract={openContract}/></div>
      <div style={subPanel}><b>Supply & learning</b><components_1.FieldLabel>Reorder same version</components_1.FieldLabel><components_1.NumberInput label="Batch" min={1000} max={Math.max(1000, reorderQuote.maxBatch)} step={1000} value={Math.max(1000, Math.min(batch, Math.max(1000, reorderQuote.maxBatch)))} suffix="units" onChange={setBatch}/><div style={{ display: "flex", justifyContent: "space-between", color: theme_1.C.dim, fontSize: 10.5, marginTop: 6 }}><span>Estimated cost</span><b>{(0, theme_1.fmtMoney)(reorderQuote.totalCost)}</b></div><button disabled={((_l = sku.mfgBatchSize) !== null && _l !== void 0 ? _l : 0) > 0 || !reorderQuote.check.ok} title={reorderBlocker || undefined} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 7, opacity: ((_m = sku.mfgBatchSize) !== null && _m !== void 0 ? _m : 0) <= 0 && reorderQuote.check.ok ? 1 : .45 })} onClick={function () { return produce(si, batch); }}>{((_o = sku.mfgBatchSize) !== null && _o !== void 0 ? _o : 0) > 0 ? "Batch already inbound" : "Order another batch \u00B7 ".concat((0, theme_1.fmtMoney)(reorderQuote.totalCost))}</button>{(((_p = sku.mfgBatchSize) !== null && _p !== void 0 ? _p : 0) > 0 || !reorderQuote.check.ok) && <ActionReason>{reorderBlocker}</ActionReason>}<button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 7 })} onClick={commissionStudy}>🔎 Post-launch market study</button><button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 7 })} onClick={openMarketing}>📣 Change advertising / campaign</button><button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 7 })} onClick={newVersion}>Create redesigned V{((_q = sku.version) !== null && _q !== void 0 ? _q : 1) + 1}</button><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 6 }}>Use a new version if you want a different manufacturer or a redesigned product. Price, audience, channels and advertising can evolve without redesigning.</div></div>
    </div></>;
}
function CompetitiveSnapshot(_a) {
    var _b, _c;
    var world = _a.world, sku = _a.sku;
    var direct = world.comps.flatMap(function (comp) { return comp.products.filter(function (p) { return p.productKey === sku.productKey; }).map(function (p) { return ({ comp: comp, p: p }); }); });
    var fallback = world.comps.flatMap(function (comp) { return (comp.products[0] ? [{ comp: comp, p: comp.products[0] }] : []); });
    var rivals = (direct.length ? direct : fallback).sort(function (a, b) { return b.comp.strength - a.comp.strength; }).slice(0, 3);
    if (!rivals.length)
        return <div style={__assign(__assign({}, subPanel), { marginTop: 12 })}><b>Competitive check</b><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 5 }}>No competitor benchmark is available yet.</div></div>;
    var exactCategory = direct.length > 0;
    var avgPrice = rivals.reduce(function (a, x) { return a + x.p.price; }, 0) / rivals.length;
    var avgQuality = rivals.reduce(function (a, x) { return a + x.p.quality; }, 0) / rivals.length;
    var priceDelta = avgPrice > 0 ? sku.listPrice / avgPrice - 1 : 0;
    var qualityDelta = sku.quality - avgQuality;
    return <div style={__assign(__assign({}, subPanel), { marginTop: 12 })}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}><b>Competitive check — {(_c = (_b = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : sku.productKey}</b><span style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{exactCategory ? "same-category rivals" : "nearest market benchmark"}</span></div>
    {!exactCategory && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 5 }}>No direct rival SKU is tracked for this category yet, so this compares against each competitor's core line instead.</div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7, marginTop: 8 }}>
      <div style={{ background: "white", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 8 }}><div style={{ color: theme_1.C.faint, fontSize: 9 }}>YOUR PRICE VS BENCHMARK</div><b style={{ color: Math.abs(priceDelta) < .12 ? theme_1.C.green : theme_1.C.amber }}>{priceDelta >= 0 ? "+" : ""}{Math.round(priceDelta * 100)}%</b><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>You {(0, theme_1.fmtMoney)(sku.listPrice)} · avg {(0, theme_1.fmtMoney)(avgPrice)}</div></div>
      <div style={{ background: "white", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 8 }}><div style={{ color: theme_1.C.faint, fontSize: 9 }}>QUALITY VS BENCHMARK</div><b style={{ color: qualityDelta >= .05 ? theme_1.C.green : qualityDelta < -.05 ? theme_1.C.red : theme_1.C.amber }}>{qualityDelta >= 0 ? "+" : ""}{Math.round(qualityDelta * 100)} pts</b><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>You {Math.round(sku.quality * 100)} · avg {Math.round(avgQuality * 100)}</div></div>
    </div>
    <div style={{ display: "grid", gap: 5, marginTop: 8 }}>{rivals.map(function (_a) {
        var comp = _a.comp, p = _a.p;
        return <div key={"".concat(comp.id, "_").concat(p.awarenessKey)} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, fontSize: 10.5, borderTop: "1px solid ".concat(theme_1.C.grid), paddingTop: 5 }}><span><b>{comp.name}</b> · {comp.personality}</span><span>${p.price.toFixed(0)}</span><span>Q {Math.round(p.quality * 100)}</span></div>;
    })}</div>
    <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 7 }}>Contribution is after product cost and retailer cut, before company overhead. Use the post-launch market study to diagnose price, channel, brand and IP fit.</div>
  </div>;
}
function getManufacturingQuote(world, sku, method, supplierId, stars, qty) {
    var _a, _b, _c, _d, _e, _f, _g;
    var cfg = (_a = industries_1.INDUSTRIES[sku.industryId]) !== null && _a !== void 0 ? _a : world.cfg;
    var pt = (_b = cfg.products.find(function (p) { return p.key === sku.productKey; })) !== null && _b !== void 0 ? _b : cfg.products[0];
    var standard = (0, productDesign_1.manufacturingStandard)(stars);
    var supplier = method === "outsource" ? (0, suppliers_1.supplierById)(supplierId) : null;
    var unitCost = (0, economics_1.deriveUnitCost)(pt, method, standard.materialQuality, standard.productionQuality, (_c = supplier === null || supplier === void 0 ? void 0 : supplier.costMult) !== null && _c !== void 0 ? _c : 1, world.materialPriceIndex) * productDynamics_1.TESTING_LEVELS[(_d = sku.testingLevel) !== null && _d !== void 0 ? _d : "standard"].costMult;
    var quality = (0, economics_1.deriveQuality)(standard.materialQuality, standard.productionQuality, (_e = supplier === null || supplier === void 0 ? void 0 : supplier.qualityAdj) !== null && _e !== void 0 ? _e : 0);
    var preview = { unitCost: unitCost, method: method, supplierId: (_f = supplier === null || supplier === void 0 ? void 0 : supplier.id) !== null && _f !== void 0 ? _f : null, productKey: sku.productKey };
    var safeQty = Math.max(1000, Math.round(qty));
    var maxBatch = (0, capacity_1.maxManufacturableBatch)(world, preview);
    var check = (0, capacity_1.canProduce)(world, safeQty, unitCost, method, (_g = supplier === null || supplier === void 0 ? void 0 : supplier.id) !== null && _g !== void 0 ? _g : null, sku.productKey);
    var leadDays = (0, capacity_1.productionLeadDays)(world, preview, safeQty);
    var warehouseFree = Math.max(0, (0, capacity_1.warehouseUnitCapacity)(world, sku.productKey) - (0, capacity_1.inventoryUsedForStorageProfile)(world, sku.productKey));
    var warehouseNeeded = safeQty * (0, productCatalog_1.storageSpaceForProduct)(sku.productKey);
    return { unitCost: unitCost, quality: quality, maxBatch: maxBatch, check: check, leadDays: leadDays, totalCost: safeQty * unitCost, warehouseFree: warehouseFree, warehouseNeeded: warehouseNeeded };
}
function QuoteStat(_a) {
    var label = _a.label, value = _a.value, tone = _a.tone;
    return <div style={{ background: "rgba(255,255,255,.72)", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 8 }}><div style={{ color: theme_1.C.faint, fontSize: 8.5, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><b style={{ color: tone === "bad" ? theme_1.C.red : theme_1.C.ink, fontSize: 11.5 }}>{value}</b></div>;
}
function ActionReason(_a) {
    var children = _a.children;
    if (!children)
        return null;
    return <div style={{ color: theme_1.C.amber, fontSize: 9.8, lineHeight: 1.35, maxWidth: 330 }}>↳ {children}</div>;
}
function PartnerPicker(_a) {
    var world = _a.world, sku = _a.sku, si = _a.si, assignPartner = _a.assignPartner, openContract = _a.openContract;
    var contracts = world.player.contracts.filter(function (c) { return !c.partnerId || true; });
    return <><components_1.FieldLabel>Sales channels</components_1.FieldLabel>{contracts.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 11 }}>No partners signed yet.<br /><button style={__assign(__assign({}, theme_1.ctrlBtn), { marginTop: 7 })} onClick={openContract}>Negotiate a retailer</button></div> : <div style={{ display: "grid", gap: 6 }}>{contracts.map(function (c) { var _a; var on = ((_a = sku.assignedPartnerIds) !== null && _a !== void 0 ? _a : []).includes(c.partnerId); return <button key={c.partnerId} onClick={function () { return assignPartner(si, c.partnerId, !on); }} style={__assign(__assign({}, theme_1.ctrlBtn), { textAlign: "left", borderColor: on ? theme_1.C.violet : theme_1.C.line, color: on ? theme_1.C.violet : theme_1.C.dim })}> {on ? "✓" : "○"} {c.partnerName} <span style={{ float: "right", color: theme_1.C.faint }}>{Math.round(c.marginCut * 100)}% cut</span></button>; })}<button style={__assign(__assign({}, theme_1.ctrlBtn), { marginTop: 2 })} onClick={openContract}>＋ Negotiate another partner</button></div>}</>;
}
function AudienceSelect(_a) {
    var world = _a.world, value = _a.value, onChange = _a.onChange;
    return <select value={value} onChange={function (e) { return onChange(e.target.value); }} style={selectStyle}><option value="broad">Broad market</option>{world.savedSegments.map(function (s) { return <option key={s.id} value={s.id}>{s.name}</option>; })}</select>;
}
function segmentIdFor(world, sku) { var _a, _b; return (_b = (_a = world.savedSegments.find(function (s) { var _a; return s.name === ((_a = sku.targetLabel) !== null && _a !== void 0 ? _a : "").split(" · ")[0]; })) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "broad"; }
function SectionTitle(_a) {
    var title = _a.title, text = _a.text;
    return <div style={{ marginBottom: 14 }}><div style={{ fontSize: 15, fontWeight: 900 }}>{title}</div><div style={{ color: theme_1.C.dim, fontSize: 11.5, lineHeight: 1.5, marginTop: 3 }}>{text}</div></div>;
}
function InfoGrid(_a) {
    var rows = _a.rows;
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 7 }}>{rows.map(function (_a) {
        var k = _a[0], v = _a[1];
        return <div key={k} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: 9 }}><div style={{ color: theme_1.C.faint, fontSize: 9, textTransform: "uppercase" }}>{k}</div><b style={{ fontSize: 12.5 }}>{v}</b></div>;
    })}</div>;
}
var selectStyle = { width: "100%", boxSizing: "border-box", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "8px 9px", background: "white", color: theme_1.C.ink, fontSize: 12 };
var subPanel = { background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 11, padding: 12 };
