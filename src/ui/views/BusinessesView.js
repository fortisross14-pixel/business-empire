"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessesView = BusinessesView;
var industries_1 = require("../../engine/industries");
var businesses_1 = require("../../engine/businesses");
var growth_1 = require("../../engine/growth");
var components_1 = require("../components");
var visualIdentity_1 = require("../visualIdentity");
var theme_1 = require("../theme");
var stars = function (n) { return "★".repeat(Math.max(0, Math.min(5, Math.round(n)))) + "☆".repeat(Math.max(0, 5 - Math.round(n))); };
function BusinessesView(_a) {
    var _b, _c;
    var world = _a.world, startIndustryEntry = _a.startIndustryEntry;
    var active = Object.values((_b = world.player.businesses) !== null && _b !== void 0 ? _b : {}).filter(function (b) { return Boolean(b && b.status === "active"); });
    var projectByIndustry = Object.fromEntries(((_c = world.player.industryEntryProjects) !== null && _c !== void 0 ? _c : []).map(function (p) { return [p.industryId, p]; }));
    var caps = world.player.corporateCapabilities;
    var scale = (0, growth_1.companyScale)(world);
    var entryRate = (0, businesses_1.industryEntrySpeed)(world);
    return <div style={{ display: "grid", gap: 16 }}>
    <components_1.Panel title="Business Portfolio">
      <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 12 }}>Compare your businesses at a glance. Each industry has its own customers, competitors and product economics, while cash, people and corporate capabilities are shared across the company.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10 }}>
        {active.map(function (b) {
            var _a, _b, _c, _d, _e;
            var cfg = industries_1.INDUSTRIES[b.industryId];
            var brands = world.brands.filter(function (x) { return x.industryId === b.industryId; });
            var skus = world.player.skus.filter(function (x) { return x.industryId === b.industryId; });
            var runtime = (_a = world.industryMarkets) === null || _a === void 0 ? void 0 : _a[b.industryId];
            var customers = runtime ? Object.values(runtime.customers).reduce(function (n, x) { return n + x.count; }, 0) : (b.industryId === world.industryId ? Object.values(world.customers).reduce(function (n, x) { return n + x.count; }, 0) : 0);
            var runRateRevenue = world.player.skus.reduce(function (sum, sku, i) { var _a, _b, _c, _d; return sum + (sku.industryId === b.industryId ? ((_d = (_c = (_b = (_a = world.live) === null || _a === void 0 ? void 0 : _a.skuResults) === null || _b === void 0 ? void 0 : _b[i]) === null || _c === void 0 ? void 0 : _c.revenue) !== null && _d !== void 0 ? _d : 0) : 0); }, 0);
            var runRateMargin = world.player.skus.reduce(function (sum, sku, i) { var _a, _b, _c, _d; return sum + (sku.industryId === b.industryId ? ((_d = (_c = (_b = (_a = world.live) === null || _a === void 0 ? void 0 : _a.skuResults) === null || _b === void 0 ? void 0 : _b[i]) === null || _c === void 0 ? void 0 : _c.margin) !== null && _d !== void 0 ? _d : 0) : 0); }, 0);
            return <div key={b.industryId} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 16 }}>{(_b = cfg === null || cfg === void 0 ? void 0 : cfg.label) !== null && _b !== void 0 ? _b : b.industryId}</b><span style={{ color: theme_1.C.green, fontSize: 10, fontWeight: 800 }}>ACTIVE</span></div>
            <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 4 }}>{brands.length} brand{brands.length === 1 ? "" : "s"} · {skus.length} product{skus.length === 1 ? "" : "s"} · {customers.toLocaleString()} customers · {(_c = runtime === null || runtime === void 0 ? void 0 : runtime.comps.length) !== null && _c !== void 0 ? _c : (b.industryId === world.industryId ? world.comps.length : 0)} competitors · entered Y{Math.floor(b.enteredTick / 360) + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
              <div style={{ background: theme_1.C.panel, borderRadius: 7, padding: 7 }}><div style={{ color: theme_1.C.faint, fontSize: 9 }}>REVENUE / Q</div><b style={{ fontSize: 12 }}>{(0, theme_1.fmtMoney)(runRateRevenue)}</b></div>
              <div style={{ background: theme_1.C.panel, borderRadius: 7, padding: 7 }}><div style={{ color: theme_1.C.faint, fontSize: 9 }}>PRODUCT MARGIN / Q</div><b style={{ fontSize: 12, color: runRateMargin >= 0 ? theme_1.C.green : theme_1.C.red }}>{(0, theme_1.fmtMoney)(runRateMargin)}</b></div>
            </div>
            <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 8 }}>Main rivals</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{((_d = runtime === null || runtime === void 0 ? void 0 : runtime.comps) !== null && _d !== void 0 ? _d : (b.industryId === world.industryId ? world.comps : [])).slice(0, 3).map(function (c) { return <visualIdentity_1.CompetitorChip key={c.id} comp={c}/>; })}{((_e = runtime === null || runtime === void 0 ? void 0 : runtime.comps) !== null && _e !== void 0 ? _e : (b.industryId === world.industryId ? world.comps : [])).length === 0 && <b style={{ color: theme_1.C.ink }}>—</b>}</div>
            <div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 10 }}>Categories ready: {b.unlockedCategories.map(function (k) { var _a, _b; return (_b = (_a = cfg === null || cfg === void 0 ? void 0 : cfg.products.find(function (p) { return p.key === k; })) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : k; }).join(", ") || "No categories ready"}</div>
            {Object.keys(b.capabilities).length > 0 && <div style={{ marginTop: 10, display: "grid", gap: 4 }}>{Object.entries(b.capabilities).slice(0, 5).map(function (_a) {
                var k = _a[0], v = _a[1];
                return <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}><span style={{ color: theme_1.C.faint }}>{k.replaceAll("_", " ")}</span><span style={{ color: theme_1.C.amber }}>{stars(v)}</span></div>;
            })}</div>}
          </div>;
        })}
      </div>
    </components_1.Panel>

    <components_1.Panel title="Shared Corporate Capabilities">
      <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 10 }}>These are the advantages your parent company carries into every business. A mature company can enter a new industry with stronger finance, marketing, operations and retail relationships — but still has to learn the category.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
        {Object.entries(caps).map(function (_a) {
        var k = _a[0], v = _a[1];
        return <div key={k} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 10 }}><div style={{ textTransform: "capitalize", fontWeight: 700, fontSize: 12 }}>{k}</div><div style={{ color: theme_1.C.amber, marginTop: 4, letterSpacing: 1 }}>{stars(v)}</div></div>;
    })}
      </div>
    </components_1.Panel>

    <components_1.Panel title="Enter a New Industry">
      <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 12 }}>Organic entry builds a new business from scratch. It uses shared corporate capabilities, but new industry-specific expertise starts weak. Company stage: <b style={{ color: theme_1.C.ink }}>{scale.label}</b>.</div>
      {Object.values(businesses_1.INDUSTRY_ENTRY_DEFS).map(function (def) {
            var _a;
            var business = (_a = world.player.businesses) === null || _a === void 0 ? void 0 : _a[def.industryId];
            var project = projectByIndustry[def.industryId];
            var check = (0, businesses_1.canStartIndustryEntry)(world, def.industryId);
            var done = (business === null || business === void 0 ? void 0 : business.status) === "active";
            var progress = project ? 1 - project.daysLeft / project.totalDays : 0;
            return <div key={def.industryId} style={{ borderTop: "1px solid ".concat(theme_1.C.line), padding: "13px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px" }}><div style={{ fontWeight: 800 }}>{def.label}</div><div style={{ color: theme_1.C.dim, fontSize: 11.5, marginTop: 4 }}>{def.blurb}</div><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 6 }}>{(0, theme_1.fmtMoney)(def.investment)} · {def.days} days · Organic entry</div></div>
            {done ? <span style={{ color: theme_1.C.green, fontWeight: 800, fontSize: 11 }}>BUSINESS ESTABLISHED</span> : project ? <span style={{ color: entryRate > 0 ? theme_1.C.cyan : theme_1.C.amber, fontWeight: 800, fontSize: 11 }}>{entryRate > 0 ? "".concat(Math.ceil(project.daysLeft / entryRate), "d estimated") : "PAUSED \u00B7 Product + Strategy required"}</span> : <button disabled={!check.ok} onClick={function () { return startIndustryEntry(def.industryId); }} style={{ background: check.ok ? theme_1.C.violet : theme_1.C.panel2, color: check.ok ? "#fff" : theme_1.C.faint, border: "1px solid ".concat(check.ok ? theme_1.C.violet : theme_1.C.line), borderRadius: 7, padding: "7px 11px", cursor: check.ok ? "pointer" : "default", fontWeight: 700 }}>Enter {def.label}</button>}
          </div>
          {project && <div style={{ height: 7, background: theme_1.C.grid, borderRadius: 5, marginTop: 9 }}><div style={{ width: "".concat(Math.max(0, Math.min(1, progress)) * 100, "%"), height: "100%", background: theme_1.C.cyan, borderRadius: 5 }}/></div>}
          {!done && !project && !check.ok && <div style={{ color: theme_1.C.amber, fontSize: 10.5, marginTop: 7 }}>{check.reason}</div>}
        </div>;
        })}
    </components_1.Panel>
  </div>;
}
