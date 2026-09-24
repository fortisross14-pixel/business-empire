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
exports.BrandView = BrandView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var brandEquity_1 = require("../../engine/brandEquity");
var types_1 = require("../../engine/types");
var industries_1 = require("../../engine/industries");
var brands_1 = require("../../engine/brands");
var visualIdentity_1 = require("../visualIdentity");
var growth_1 = require("../../engine/growth");
var markets_1 = require("../../engine/markets");
var METRICS = [
    { key: "trust", label: "Trust", color: "#34d399" },
    { key: "prestige", label: "Prestige", color: "#c084fc" },
    { key: "value", label: "Value", color: "#38bdf8" },
    { key: "innovation", label: "Innovation", color: "#fbbf24" },
];
function BrandView(_a) {
    var _b, _c, _d, _e;
    var world = _a.world, setVision = _a.setVision, createBrand = _a.createBrand, startCategoryExpansion = _a.startCategoryExpansion;
    var _f = (0, react_1.useState)(world.primaryBrandId), selectedBrandId = _f[0], setSelectedBrandId = _f[1];
    var selectedBrand = (0, brands_1.brandById)(world, selectedBrandId);
    var selectedMarketWorld = selectedBrand.industryId === world.industryId ? world : (0, markets_1.marketWorldView)(world, selectedBrand.industryId);
    var selectedCfg = (_b = industries_1.INDUSTRIES[selectedBrand.industryId]) !== null && _b !== void 0 ? _b : world.cfg;
    var avg = (0, brandEquity_1.brandAverageEquity)(selectedMarketWorld, undefined, selectedBrand.id);
    var earned = (0, brandEquity_1.earnedSignals)(selectedMarketWorld, selectedBrand.id);
    var selectedSkus = world.player.skus.filter(function (s) { return s.brandId === selectedBrand.id; });
    var hasProducts = selectedSkus.length > 0;
    var scale = (0, growth_1.companyScale)(world);
    if (world.brands.length === 0) {
        return <div style={{ display: "grid", gap: 14 }}>
      <components_1.Panel title="Create your founding brand">
        <div style={{ color: theme_1.C.dim, fontSize: 13, lineHeight: 1.65 }}>Your company exists, but customers still have nothing to recognize. Create the first brand now — name, positioning, colors and logo. This founding brand has no launch fee.</div>
      </components_1.Panel>
      <BrandPortfolio world={world} selectedBrandId="" onSelect={function () { }} createBrand={createBrand}/>
    </div>;
    }
    var segRows = world.savedSegments.map(function (seg) {
        var idxs = [];
        selectedMarketWorld.cube.forEach(function (c, i) {
            var ok = Object.entries(seg.filter).every(function (_a) {
                var ax = _a[0], vals = _a[1];
                return !vals || vals.length === 0 || vals.includes(c.coord[ax]);
            });
            if (ok)
                idxs.push(i);
        });
        var tw = 0;
        var acc = { trust: 0, prestige: 0, value: 0, innovation: 0 };
        for (var _i = 0, idxs_1 = idxs; _i < idxs_1.length; _i++) {
            var i = idxs_1[_i];
            var h = selectedMarketWorld.cube[i].head;
            tw += h;
            var e = (0, brandEquity_1.getEquity)(selectedMarketWorld, i, undefined, selectedBrand.id);
            acc.trust += e.trust * h;
            acc.prestige += e.prestige * h;
            acc.value += e.value * h;
            acc.innovation += e.innovation * h;
        }
        var eq = tw > 0 ? { trust: acc.trust / tw, prestige: acc.prestige / tw, value: acc.value / tw, innovation: acc.innovation / tw } : { trust: 0, prestige: 0, value: 0, innovation: 0 };
        return { name: seg.name, eq: eq };
    });
    return (<div>
      <CompanyGrowthPanel world={world}/>
      <BrandPortfolio world={world} selectedBrandId={selectedBrand.id} onSelect={setSelectedBrandId} createBrand={createBrand}/>
      <components_1.Panel title={"".concat(selectedCfg.label, " Category Access")}><div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.5 }}>Category development is managed centrally from <b>Company → Research</b>. This brand can currently design: <b>{((_e = (_d = (_c = world.player.businesses) === null || _c === void 0 ? void 0 : _c[selectedBrand.industryId]) === null || _d === void 0 ? void 0 : _d.unlockedCategories) !== null && _e !== void 0 ? _e : []).map(function (k) { var _a, _b; return (_b = (_a = selectedCfg.products.find(function (p) { return p.key === k; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : k; }).join(", ") || "none"}</b>.</div></components_1.Panel>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <components_1.Panel title={"".concat(selectedBrand.name, " \u2014 Brand Equity")} style={{ flex: "1 1 320px" }}>
          {!hasProducts ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>This brand has no products yet. Assign your next design to {selectedBrand.name} to start building its reputation.</div> : (<>
              {METRICS.map(function (m) { return (<div key={m.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span style={{ color: theme_1.C.ink }}>{m.label}</span>
                    <span style={{ color: theme_1.C.dim, fontFamily: "ui-monospace", fontSize: 11 }}>
                      {(avg[m.key] * 100).toFixed(0)} <span style={{ color: theme_1.C.faint }}>→ {(earned[m.key] * 100).toFixed(0)}</span>
                    </span>
                  </div>
                  <div style={{ height: 8, background: theme_1.C.grid, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "".concat(avg[m.key] * 100, "%"), height: "100%", background: m.color, borderRadius: 4 }}/>
                    <div style={{ position: "absolute", top: 0, left: "".concat(earned[m.key] * 100, "%"), width: 2, height: "100%", background: theme_1.C.ink, opacity: .5 }}/>
                  </div>
                </div>); })}
              <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
                Solid bar = current reputation. Tick = the identity this brand's own products, pricing and channels are earning. Sister brands no longer share the same equity.
              </div>
            </>)}
        </components_1.Panel>

        <components_1.Panel title={"".concat(selectedBrand.name, " \u2014 Perception by Segment")} style={{ flex: "1 1 360px" }}>
          {!hasProducts ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No consumer perception yet.</div> : (<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ color: theme_1.C.faint, textAlign: "right" }}><th style={{ textAlign: "left" }}>Segment</th>{METRICS.map(function (m) { return <th key={m.key} style={{ color: m.color }}>{m.label.slice(0, 4)}</th>; })}</tr></thead>
              <tbody style={{ fontFamily: "ui-monospace" }}>
                {segRows.map(function (r, i) { return <tr key={i} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
                  <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "5px 0" }}>{r.name}</td>
                  {METRICS.map(function (m) { return <td key={m.key} style={{ color: theme_1.C.dim }}>{(r.eq[m.key] * 100).toFixed(0)}</td>; })}
                </tr>; })}
              </tbody>
            </table>)}
        </components_1.Panel>
      </div>

      {hasProducts && (<components_1.Panel title={"".concat(selectedBrand.name, " \u2014 Equity by Category")}>
          <div style={{ color: theme_1.C.faint, fontSize: 11, marginBottom: 10 }}>A brand can be trusted in cleansers and unknown in anti-aging. Category reputation remains separate inside each brand.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ color: theme_1.C.faint, textAlign: "right" }}><th style={{ textAlign: "left" }}>Category</th>{METRICS.map(function (m) { return <th key={m.key} style={{ color: m.color }}>{m.label.slice(0, 4)}</th>; })}</tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {Array.from(new Set(selectedSkus.map(function (s) { return s.productKey; }))).map(function (pk) {
                var _a, _b;
                var catEq = (0, brandEquity_1.brandAverageEquity)(selectedMarketWorld, pk, selectedBrand.id);
                var ptLabel = (_b = (_a = selectedCfg.products.find(function (p) { return p.key === pk; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : pk;
                return <tr key={pk} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
                  <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "5px 0" }}>{ptLabel}</td>
                  {METRICS.map(function (m) { return <td key={m.key} style={{ color: theme_1.C.dim }}>{(catEq[m.key] * 100).toFixed(0)}</td>; })}
                </tr>;
            })}
            </tbody>
          </table>
        </components_1.Panel>)}

      <VisionPanel world={world} setVision={setVision}/>
    </div>);
}
function CompanyGrowthPanel(_a) {
    var _b, _c;
    var world = _a.world;
    var scale = (0, growth_1.companyScale)(world);
    var revenue = (_c = (_b = world.chronicle) === null || _b === void 0 ? void 0 : _b.lifetimeRevenue) !== null && _c !== void 0 ? _c : 0;
    var next = scale.nextRevenue;
    var progress = next ? Math.min(1, revenue / next) : 1;
    var launched = world.player.skus.filter(function (s) { return s.launchTick > 0; }).length;
    return <components_1.Panel title="Company Growth">
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
      <div>
        <div style={{ color: theme_1.C.violet, fontWeight: 800, fontSize: 20 }}>{scale.label}</div>
        <div style={{ color: theme_1.C.dim, fontSize: 12, marginTop: 3 }}>{scale.description}</div>
      </div>
      <div style={{ display: "flex", gap: 18, fontSize: 12 }}>
        <div><div style={{ color: theme_1.C.faint }}>Lifetime revenue</div><b>{(0, theme_1.fmtMoney)(revenue)}</b></div>
        <div><div style={{ color: theme_1.C.faint }}>Launched products</div><b>{launched}</b></div>
        <div><div style={{ color: theme_1.C.faint }}>Brand capacity</div><b>{world.brands.length} / {scale.maxBrands}</b></div>
      </div>
    </div>
    {next && <><div style={{ height: 7, background: theme_1.C.grid, borderRadius: 4, marginTop: 12 }}><div style={{ height: "100%", width: "".concat(progress * 100, "%"), background: theme_1.C.violet, borderRadius: 4 }}/></div><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 5 }}>Revenue path to next scale: {(0, theme_1.fmtMoney)(revenue)} / {(0, theme_1.fmtMoney)(next)}. Product-count milestones can accelerate scale as well.</div></>}
  </components_1.Panel>;
}
function BrandPortfolio(_a) {
    var _b, _c;
    var world = _a.world, selectedBrandId = _a.selectedBrandId, onSelect = _a.onSelect, createBrand = _a.createBrand;
    var _d = (0, react_1.useState)(false), showCreate = _d[0], setShowCreate = _d[1];
    var _e = (0, react_1.useState)(""), name = _e[0], setName = _e[1];
    var _f = (0, react_1.useState)(industries_1.BRAND_COLORS[world.brands.length % industries_1.BRAND_COLORS.length]), color = _f[0], setColor = _f[1];
    var _g = (0, react_1.useState)("premium"), positioning = _g[0], setPositioning = _g[1];
    var activeIndustries = Object.values((_b = world.player.businesses) !== null && _b !== void 0 ? _b : {}).filter(function (b) { return (b === null || b === void 0 ? void 0 : b.status) === "active"; }).map(function (b) { return b.industryId; });
    var _h = (0, react_1.useState)((_c = activeIndustries[0]) !== null && _c !== void 0 ? _c : world.industryId), industryId = _h[0], setIndustryId = _h[1];
    var _j = (0, react_1.useState)("circle"), shape = _j[0], setShape = _j[1];
    var _k = (0, react_1.useState)("orbit"), motif = _k[0], setMotif = _k[1];
    var _l = (0, react_1.useState)("monogram"), textLayout = _l[0], setTextLayout = _l[1];
    var _m = (0, react_1.useState)("#dbeafe"), accentColor = _m[0], setAccentColor = _m[1];
    var check = (0, growth_1.canCreateBrand)(world);
    var visual = { shape: shape, motif: motif, textLayout: textLayout, accentColor: accentColor };
    var shapeOptions = ["square", "circle", "diamond", "triangle", "shield", "capsule", "hex"];
    var motifOptions = ["stripe", "star", "bolt", "orbit", "crown", "leaf", "spark"];
    var layoutOptions = ["monogram", "stacked", "wide"];
    var founding = world.brands.length === 0;
    return <components_1.Panel title={founding ? "Founding Brand" : "Brand Portfolio"}>
    <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 12 }}>{founding ? "This is the first consumer identity of the company. Build it after the Founder Office so the run begins with a real empty-lot → company → brand progression." : "Brands share the parent company's cash, people and infrastructure, but maintain separate market reputations. A focused brand architecture can cover different price tiers without muddying the original brand."}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
      {world.brands.map(function (b) {
            var _a, _b;
            var skus = world.player.skus.filter(function (s) { return s.brandId === b.id; });
            var active = skus.filter(function (s) { return s.status === "active"; }).length;
            var units = skus.reduce(function (a, s) { return a + s.unitsSoldTotal; }, 0);
            var contribution = skus.reduce(function (a, s) { var _a; return a + ((_a = s.contributionTotal) !== null && _a !== void 0 ? _a : 0); }, 0);
            var eq = (0, brandEquity_1.brandAverageEquity)(world, undefined, b.id);
            var on = selectedBrandId === b.id;
            return <button key={b.id} onClick={function () { return onSelect(b.id); }} style={{ textAlign: "left", background: on ? theme_1.C.panel2 : theme_1.C.bg, border: "1px solid ".concat(on ? b.color : theme_1.C.line), borderRadius: 14, padding: 13, cursor: "pointer", color: theme_1.C.ink }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <visualIdentity_1.BrandLogoMark brand={b} size={44} withName/>
            <span style={{ color: theme_1.C.faint, fontSize: 10, textTransform: "uppercase" }}>{(_b = (_a = industries_1.INDUSTRIES[b.industryId]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : b.industryId} · {b.positioning}</span>
          </div>
          <div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 10 }}>{skus.length} product{skus.length !== 1 ? "s" : ""} · {active} active · {Math.round(units).toLocaleString()} units</div>
          <div style={{ color: contribution >= 0 ? theme_1.C.green : theme_1.C.red, fontSize: 11, marginTop: 3 }}>Lifetime contribution {(0, theme_1.fmtMoney)(contribution)}</div>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 6 }}>Trust {Math.round(eq.trust * 100)} · Prestige {Math.round(eq.prestige * 100)} · Value {Math.round(eq.value * 100)}</div>
        </button>;
        })}
    </div>

    {!showCreate ? <button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 12, opacity: check.ok ? 1 : .55 })} disabled={!check.ok} onClick={function () {
                var seeded = (0, brands_1.defaultBrandVisual)(name.trim() || "Brand ".concat(world.brands.length + 1), color);
                setShape(seeded.shape);
                setMotif(seeded.motif);
                setTextLayout(seeded.textLayout);
                setAccentColor(seeded.accentColor);
                setShowCreate(true);
            }}>{founding ? "+ Create founding brand" : "+ Launch a new brand \u00B7 ".concat((0, theme_1.fmtMoney)(check.cost))}</button> : (<div style={{ marginTop: 14, padding: 14, border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, background: theme_1.C.panel2 }}>
        {activeIndustries.length > 1 && <><components_1.FieldLabel>Business</components_1.FieldLabel><components_1.SelectInput label="Industry" value={industryId} onChange={setIndustryId}>{activeIndustries.map(function (id) { var _a, _b; return <option key={id} value={id}>{(_b = (_a = industries_1.INDUSTRIES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id}</option>; })}</components_1.SelectInput></>}
        <components_1.FieldLabel>New brand name</components_1.FieldLabel>
        <components_1.TextInput placeholder="e.g. PureForm" value={name} onChange={function (e) { var next = e.target.value; setName(next); if (next.trim()) {
            var seeded = (0, brands_1.defaultBrandVisual)(next, color);
            setShape(seeded.shape);
            setMotif(seeded.motif);
            setTextLayout(seeded.textLayout);
            if (!accentColor)
                setAccentColor(seeded.accentColor);
        } }}/>
        <div style={{ height: 10 }}/><components_1.FieldLabel>Brand color</components_1.FieldLabel>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>{industries_1.BRAND_COLORS.map(function (c) { return <button key={c} onClick={function () { return setColor(c); }} style={{ width: 28, height: 28, borderRadius: 7, background: c, border: color === c ? "3px solid ".concat(theme_1.C.ink) : "2px solid transparent", cursor: "pointer" }}/>; })}</div>
        <components_1.FieldLabel>Positioning</components_1.FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 12 }}>{industries_1.POSITIONINGS.map(function (p) { return <components_1.ChoiceCard key={p.key} active={positioning === p.key} onClick={function () { return setPositioning(p.key); }} accent={color}><div style={{ fontWeight: 700, fontSize: 12 }}>{p.label}</div><div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 2 }}>{p.blurb}</div></components_1.ChoiceCard>; })}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, alignItems: "start" }}>
          <div style={{ border: "1px solid ".concat(theme_1.C.line), borderRadius: 12, padding: 12, background: theme_1.C.bg }}>
            <div style={{ color: theme_1.C.faint, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Logo preview</div>
            <visualIdentity_1.BrandLogoMark brand={{ id: "preview", name: name.trim() || "New Brand", color: color, positioning: positioning, createdTick: 0, industryId: industryId, visual: visual }} size={64} withName emphasize/>
            <div style={{ color: theme_1.C.dim, fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>This recipe will be reused in the company header, brand cards, product packaging overlays and later competitor/company marks.</div>
          </div>
          <div>
            <components_1.FieldLabel>Logo shape</components_1.FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{shapeOptions.map(function (opt) { return <button key={opt} onClick={function () { return setShape(opt); }} style={__assign(__assign({}, theme_1.ctrlBtn), { borderColor: shape === opt ? color : theme_1.C.line, color: shape === opt ? color : theme_1.C.dim })}>{opt}</button>; })}</div>
            <components_1.FieldLabel>Logo motif</components_1.FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{motifOptions.map(function (opt) { return <button key={opt} onClick={function () { return setMotif(opt); }} style={__assign(__assign({}, theme_1.ctrlBtn), { borderColor: motif === opt ? color : theme_1.C.line, color: motif === opt ? color : theme_1.C.dim })}>{opt}</button>; })}</div>
            <components_1.FieldLabel>Text mode</components_1.FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{layoutOptions.map(function (opt) { return <button key={opt} onClick={function () { return setTextLayout(opt); }} style={__assign(__assign({}, theme_1.ctrlBtn), { borderColor: textLayout === opt ? color : theme_1.C.line, color: textLayout === opt ? color : theme_1.C.dim })}>{opt}</button>; })}</div>
            <components_1.FieldLabel>Accent color</components_1.FieldLabel>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>{["#ffffff", "#dbeafe", "#fde68a", "#fbcfe8", "#bbf7d0", "#ddd6fe", "#fdba74", "#a7f3d0"].map(function (c) { return <button key={c} onClick={function () { return setAccentColor(c); }} style={{ width: 26, height: 26, borderRadius: 999, background: c, border: accentColor === c ? "3px solid ".concat(theme_1.C.ink) : "2px solid #d8e0eb", cursor: "pointer" }}/>; })}</div>
          </div>
        </div>

        <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 10 }}>{founding ? "Founding brand · no launch fee. Its reputation starts at zero and must be earned through products and execution." : "Launch investment: ".concat((0, theme_1.fmtMoney)(check.cost), ". The new brand starts with no equity; it receives only a small corporate halo from sister brands.")}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, alignItems: "end" }}><button style={theme_1.ctrlBtn} onClick={function () { return setShowCreate(false); }}>Cancel</button><div style={{ display: "grid", justifyItems: "end" }}><button title={!name.trim() ? "Give the brand a name first." : !check.ok ? check.reason : undefined} style={__assign(__assign({}, theme_1.bigBtn), { background: color, opacity: name.trim() && check.ok ? 1 : .5 })} disabled={!name.trim() || !check.ok} onClick={function () { if (createBrand(name, color, positioning, industryId, visual)) {
            setName("");
            setShowCreate(false);
        } }}>Launch {name.trim() || "brand"}</button>{(!name.trim() || !check.ok) && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {!name.trim() ? "Give the brand a name first." : check.reason}</div>}</div></div>
      </div>)}
    {!check.ok && !showCreate && <div style={{ color: theme_1.C.amber, fontSize: 11, marginTop: 7 }}>{check.reason}</div>}
  </components_1.Panel>;
}
function CategoryGrowth(_a) {
    var _b, _c, _d;
    var world = _a.world, industryId = _a.industryId, startCategoryExpansion = _a.startCategoryExpansion;
    var cfg = (_b = industries_1.INDUSTRIES[industryId]) !== null && _b !== void 0 ? _b : world.cfg;
    var business = (_c = world.player.businesses) === null || _c === void 0 ? void 0 : _c[industryId];
    var unlocked = new Set((_d = business === null || business === void 0 ? void 0 : business.unlockedCategories) !== null && _d !== void 0 ? _d : []);
    return <components_1.Panel title={"".concat(cfg.label, " Category Expansion")}>
    <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 12 }}>New categories require capability-building before your teams can develop them credibly. Entering a category costs time and cash, and expertise grows through experience.</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
      {cfg.products.map(function (pt) {
            var _a;
            var isUnlocked = unlocked.has(pt.key);
            var project = business === null || business === void 0 ? void 0 : business.categoryExpansionProjects.find(function (p) { return p.productKey === pt.key; });
            var def = (0, growth_1.categoryGrowthDef)(world, pt.key);
            var check = !isUnlocked && !project ? (0, growth_1.canStartCategoryExpansion)(world, pt.key) : null;
            var expertise = (_a = world.player.expertise.category[pt.key]) !== null && _a !== void 0 ? _a : 0;
            return <div key={pt.key} style={{ background: theme_1.C.bg, border: "1px solid ".concat(isUnlocked ? theme_1.C.green : project ? theme_1.C.cyan : theme_1.C.line), borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ color: theme_1.C.ink, fontSize: 13 }}>{pt.label}</b><span style={{ color: isUnlocked ? theme_1.C.green : project ? theme_1.C.cyan : theme_1.C.faint, fontSize: 10.5, fontWeight: 700 }}>{isUnlocked ? "UNLOCKED" : project ? "EXPANDING" : "LOCKED"}</span></div>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 5 }}>Expertise {"★".repeat(Math.max(0, Math.min(5, Math.round(expertise))))}{"☆".repeat(5 - Math.max(0, Math.min(5, Math.round(expertise))))}</div>
          {isUnlocked ? <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 7 }}>Available for product development in {cfg.label} brands.</div> : project ? <><div style={{ height: 6, background: theme_1.C.grid, borderRadius: 4, marginTop: 9 }}><div style={{ width: "".concat(Math.max(0, Math.min(1, 1 - project.daysLeft / project.totalDays)) * 100, "%"), height: "100%", background: theme_1.C.cyan, borderRadius: 4 }}/></div><div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 5 }}>{Math.ceil(project.daysLeft)} days remaining · {(0, theme_1.fmtMoney)(project.investment)} committed</div></> : def ? <><div style={{ color: theme_1.C.dim, fontSize: 10.5, lineHeight: 1.4, marginTop: 7 }}>{def.blurb}</div><button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 9, opacity: (check === null || check === void 0 ? void 0 : check.ok) ? 1 : .5 })} disabled={!(check === null || check === void 0 ? void 0 : check.ok)} onClick={function () { return startCategoryExpansion(pt.key); }}>Enter category · {(0, theme_1.fmtMoney)(def.investment)} · {def.days}d</button>{check && !check.ok && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 4 }}>{check.reason}</div>}</> : <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 7 }}>Core category.</div>}
        </div>;
        })}
    </div>
  </components_1.Panel>;
}
function VisionPanel(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var world = _a.world, setVision = _a.setVision;
    var v = world.player.vision;
    var _l = (0, react_1.useState)((_b = v === null || v === void 0 ? void 0 : v.goal) !== null && _b !== void 0 ? _b : "quality"), goal = _l[0], setGoal = _l[1];
    var _m = (0, react_1.useState)((_c = v === null || v === void 0 ? void 0 : v.scope) !== null && _c !== void 0 ? _c : world.cfg.id), scope = _m[0], setScope = _m[1];
    var _o = (0, react_1.useState)((_d = v === null || v === void 0 ? void 0 : v.audience) !== null && _d !== void 0 ? _d : "anyone"), audience = _o[0], setAudience = _o[1];
    var goalDef = types_1.VISION_GOALS[goal];
    var isIndustryScope = scope === world.cfg.id;
    var scopeLabel = scope === world.cfg.id ? world.cfg.label : (_f = (_e = world.cfg.products.find(function (p) { return p.key === scope; })) === null || _e === void 0 ? void 0 : _e.label) !== null && _f !== void 0 ? _f : scope;
    var audienceLabel = audience === "anyone" ? "everyone" : (_h = (_g = world.savedSegments.find(function (s) { return s.id === audience; })) === null || _g === void 0 ? void 0 : _g.name) !== null && _h !== void 0 ? _h : audience;
    var statement = "\"We want to be the ".concat(goalDef.adjective, " ").concat(scopeLabel, " company for ").concat(audienceLabel, ".\"");
    var ramp = v ? (1 + v.quartersPassed) / 5 : 0;
    var vIsIndustry = v ? v.scope === world.cfg.id : false;
    var currentBonusMax = v ? (vIsIndustry ? types_1.VISION_GOALS[v.goal].bonusMaxIndustry : types_1.VISION_GOALS[v.goal].bonusMaxProduct) : 0;
    var currentBonus = currentBonusMax * ramp;
    return <components_1.Panel title="Company Vision">
    {v && <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme_1.C.ink, fontStyle: "italic", marginBottom: 8 }}>{"\"We want to be the ".concat(types_1.VISION_GOALS[v.goal].adjective, " ").concat(v.scope === world.cfg.id ? world.cfg.label : (_k = (_j = world.cfg.products.find(function (p) { return p.key === v.scope; })) === null || _j === void 0 ? void 0 : _j.label) !== null && _k !== void 0 ? _k : v.scope, " company for ").concat(v.audienceLabel, ".\"")}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}><div><span style={{ color: theme_1.C.dim }}>Bonus: </span><span style={{ color: theme_1.C.green, fontWeight: 600 }}>+{(currentBonusMax * 100).toFixed(0)}% {types_1.VISION_GOALS[v.goal].desc}</span></div><div><span style={{ color: theme_1.C.dim }}>Ramp: </span><span style={{ color: theme_1.C.amber, fontWeight: 600 }}>{(ramp * 100).toFixed(0)}%</span><span style={{ color: theme_1.C.faint }}> ({v.quartersPassed}/4 quarters)</span></div><div><span style={{ color: theme_1.C.dim }}>Current effect: </span><span style={{ color: theme_1.C.cyan, fontWeight: 600 }}>+{(currentBonus * 100).toFixed(1)}%</span></div></div>
      <div style={{ height: 6, background: theme_1.C.grid, borderRadius: 3, marginTop: 10 }}><div style={{ width: "".concat(ramp * 100, "%"), height: "100%", background: theme_1.C.amber, borderRadius: 3 }}/></div>
    </div>}

    <div style={{ color: theme_1.C.dim, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>Vision remains company-wide. It rewards strategic consistency over a year, while individual brands maintain their own positioning and reputation.</div>
    <div style={{ color: theme_1.C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Target goal</div>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{Object.keys(types_1.VISION_GOALS).map(function (g) { var gd = types_1.VISION_GOALS[g]; return <button key={g} onClick={function () { return setGoal(g); }} style={{ flex: 1, background: goal === g ? theme_1.C.panel2 : theme_1.C.bg, border: "1px solid ".concat(goal === g ? theme_1.C.cyan : theme_1.C.line), borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "left" }}><div style={{ fontWeight: 600, fontSize: 13, color: goal === g ? theme_1.C.ink : theme_1.C.dim }}>{gd.adjective}</div><div style={{ fontSize: 10, color: theme_1.C.faint, marginTop: 2 }}>{gd.desc}</div></button>; })}</div>

    <div style={{ color: theme_1.C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Scope — industry (+10%) or unlocked category (+20%)</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
      <button onClick={function () { return setScope(world.cfg.id); }} style={{ background: scope === world.cfg.id ? theme_1.C.cyan : theme_1.C.panel2, color: scope === world.cfg.id ? "#fff" : theme_1.C.dim, border: "1px solid ".concat(scope === world.cfg.id ? theme_1.C.cyan : theme_1.C.line), borderRadius: 5, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{world.cfg.label} <span style={{ fontSize: 9, opacity: .7 }}>+10%</span></button>
      {world.cfg.products.filter(function (p) { return world.player.unlockedCategories.includes(p.key); }).map(function (pt) { return <button key={pt.key} onClick={function () { return setScope(pt.key); }} style={{ background: scope === pt.key ? theme_1.C.cyan : theme_1.C.bg, color: scope === pt.key ? "#fff" : theme_1.C.faint, border: "1px solid ".concat(scope === pt.key ? theme_1.C.cyan : theme_1.C.line), borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>{pt.label} <span style={{ fontSize: 9, opacity: .7 }}>+20%</span></button>; })}
    </div>

    <div style={{ color: theme_1.C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Target audience</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}><button onClick={function () { return setAudience("anyone"); }} style={{ background: audience === "anyone" ? theme_1.C.cyan : theme_1.C.panel2, color: audience === "anyone" ? "#fff" : theme_1.C.dim, border: "1px solid ".concat(audience === "anyone" ? theme_1.C.cyan : theme_1.C.line), borderRadius: 5, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Everyone</button>{world.savedSegments.map(function (seg) { return <button key={seg.id} onClick={function () { return setAudience(seg.id); }} style={{ background: audience === seg.id ? theme_1.C.cyan : theme_1.C.panel2, color: audience === seg.id ? "#fff" : theme_1.C.dim, border: "1px solid ".concat(audience === seg.id ? theme_1.C.cyan : theme_1.C.line), borderRadius: 5, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>{seg.name}</button>; })}</div>

    <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 12, marginBottom: 12 }}><div style={{ fontSize: 15, fontStyle: "italic", color: theme_1.C.ink, fontWeight: 600 }}>{statement}</div><div style={{ fontSize: 11, color: theme_1.C.faint, marginTop: 6 }}>Bonus: {goalDef.desc} · {isIndustryScope ? "broad industry" : "category focus"} · full effect in 4 quarters</div></div>
    <button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", background: theme_1.C.cyan, color: "#fff" })} onClick={function () { return setVision(goal, scope, audience, audienceLabel); }}>{v ? "Change vision (resets ramp)" : "Set company vision"}</button>
  </components_1.Panel>;
}
