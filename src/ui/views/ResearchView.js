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
exports.ResearchView = ResearchView;
var react_1 = require("react");
var components_1 = require("../components");
var theme_1 = require("../theme");
var research_1 = require("../../engine/research");
var industries_1 = require("../../engine/industries");
var growth_1 = require("../../engine/growth");
var people_1 = require("../../engine/people");
var infrastructure_1 = require("../../engine/infrastructure");
function ResearchView(_a) {
    var _b;
    var world = _a.world, startResearch = _a.startResearch, startCategoryExpansion = _a.startCategoryExpansion;
    var active = world.player.research.active;
    var rate = (0, research_1.researchRate)(world);
    var hasCio = (0, research_1.hasSeatedCIO)(world);
    var branches = ["Product", "Organization", "Operations", "Market"];
    var categoryRate = (0, growth_1.categoryExpansionSpeed)(world);
    var primaryIndustry = world.industryId;
    var aaWorkspaceReady = world.player.operatingRooms.some(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, primaryIndustry) && r.capacity >= 8; });
    var specializedCenter = (0, infrastructure_1.productCenterTypeForIndustry)(primaryIndustry);
    var aaaWorkspaceReady = specializedCenter ? (0, infrastructure_1.productCenterLevel)(world, primaryIndustry) >= 2 : world.player.operatingRooms.some(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, primaryIndustry) && r.capacity >= 16; });
    var aaaInfrastructureReady = (0, infrastructure_1.researchCenterLevel)(world) >= 2 && aaaWorkspaceReady;
    return <div style={{ display: "grid", gap: 14 }}>
    <components_1.Panel title="🔬 Company Development">
      <div style={{ color: theme_1.C.dim, fontSize: 12.5, lineHeight: 1.6 }}>Capabilities unlock what the company is actually able to coordinate. Research is owned by a Chief Innovation Officer seated in a Research Center; Product, Strategy and Operations teams can support the work, but the program needs both the facility and its owner.</div>
      <div style={{ marginTop: 10, padding: 10, border: "1px solid ".concat(hasCio ? "#bbf7d0" : "#fed7aa"), background: hasCio ? "#f0fdf4" : "#fff7ed", borderRadius: 9, fontSize: 10.5, color: hasCio ? theme_1.C.green : theme_1.C.amber, fontWeight: 700 }}>{hasCio ? "✓ Chief Innovation Officer seated in the Research Center — research capability online." : "! Research locked — build a Research Center, then seat a Chief Innovation Officer there."}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 12 }}>
        <Metric label="Development rate" value={"".concat(rate.toFixed(1), " pts/day")}/>
        <Metric label="Capabilities completed" value={"".concat(world.player.research.completed.length, "/").concat(research_1.RESEARCH_NODES.length)}/>
        <Metric label="Lifetime development" value={"".concat(Math.round(world.player.research.lifetimePoints).toLocaleString(), " pts")}/>
      </div>
      {active ? <div style={{ marginTop: 12, padding: 12, border: "1px solid ".concat(theme_1.C.cyan), borderRadius: 10, background: "#effbff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{(0, research_1.researchDef)(active.nodeId).title}</b><span style={{ color: theme_1.C.cyan, fontWeight: 800 }}>{Math.round(active.progress / active.requiredPoints * 100)}%</span></div>
        <div style={{ height: 7, background: theme_1.C.grid, borderRadius: 99, marginTop: 8 }}><div style={{ width: "".concat(Math.min(100, active.progress / active.requiredPoints * 100), "%"), height: "100%", background: theme_1.C.cyan, borderRadius: 99 }}/></div>
        <div style={{ color: rate > 0 ? theme_1.C.dim : theme_1.C.amber, fontSize: 10.5, marginTop: 6 }}>{rate > 0 ? "".concat(Math.ceil(Math.max(0, active.requiredPoints - active.progress) / rate), " days estimated \u00B7 ").concat(Math.round(active.progress), "/").concat(active.requiredPoints, " points") : "Paused \u2014 assign a Chief Innovation Officer to the Research Center to resume."}</div>
      </div> : <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 10 }}>No capability project is active. Choose one below.</div>}
    </components_1.Panel>

    <components_1.Panel title="🔐 Capability Gate Map">
      <div style={{ color: theme_1.C.dim, fontSize: 11.5, lineHeight: 1.5, marginBottom: 9 }}>Business Empire uses explicit gates: knowledge tells the company <i>how</i> to do something, people operate it, and physical infrastructure provides capacity. A locked action should always point to the missing piece.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 7 }}>
        {[
            ["Corporate research", hasCio, "Seated Chief Innovation Officer"],
            ["AA products", (0, research_1.hasResearch)(world, "advanced_product_development") && aaWorkspaceReady, "Advanced Product Development + an 8-seat product-capable workspace + Lead/Designer team"],
            ["AAA products", (0, research_1.hasResearch)(world, "flagship_product_development") && aaaInfrastructureReady, specializedCenter ? "Flagship Product Development + Research Center II + industry Design Center II + Lead + 3 Designers" : "Flagship Product Development + Research Center II + 16-seat product workspace + Lead + 3 Designers"],
            ["Owned manufacturing", (0, research_1.hasResearch)(world, "owned_manufacturing") && (0, people_1.teamEffectiveness)(world, "operations") > 0, "Owned Manufacturing + seated Operations specialist + compatible Factory"],
            ["Specialized storage", (0, research_1.hasResearch)(world, "specialized_storage") && (0, people_1.teamEffectiveness)(world, "operations") > 0, "Specialized Storage + Operations specialist + warehouse module"],
            ["Advanced market intelligence", (0, research_1.hasResearch)(world, "market_intelligence") && (0, people_1.teamEffectiveness)(world, "strategy") > 0, "Market Intelligence + seated Strategy specialist"],
        ].map(function (_a) {
            var label = _a[0], ok = _a[1], need = _a[2];
            return <div key={String(label)} style={{ border: "1px solid ".concat(ok ? "#bbf7d0" : theme_1.C.line), background: ok ? "#f0fdf4" : theme_1.C.bg, borderRadius: 9, padding: 9 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 10.5 }}>{label}</b><span style={{ color: ok ? theme_1.C.green : theme_1.C.faint, fontWeight: 900, fontSize: 9 }}>{ok ? "READY" : "GATED"}</span></div><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 3 }}>{need}</div></div>;
        })}
      </div>
    </components_1.Panel>

    {branches.map(function (branch) { return <components_1.Panel key={branch} title={"".concat(branch, " Capabilities")}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 9 }}>
        {research_1.RESEARCH_NODES.filter(function (n) { return n.branch === branch; }).map(function (node) {
                var done = (0, research_1.hasResearch)(world, node.id);
                var check = (0, research_1.canStartResearch)(world, node.id);
                return <div key={node.id} style={{ border: "1px solid ".concat(done ? "#bbf7d0" : (active === null || active === void 0 ? void 0 : active.nodeId) === node.id ? theme_1.C.cyan : theme_1.C.line), borderRadius: 10, padding: 12, background: done ? "#f0fdf4" : theme_1.C.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 12.5 }}>{node.title}</b><span style={{ fontSize: 9.5, fontWeight: 800, color: done ? theme_1.C.green : (active === null || active === void 0 ? void 0 : active.nodeId) === node.id ? theme_1.C.cyan : theme_1.C.faint }}>{done ? "COMPLETE" : (active === null || active === void 0 ? void 0 : active.nodeId) === node.id ? "RESEARCHING" : check.ok ? "AVAILABLE" : "LOCKED"}</span></div>
            <div style={{ color: theme_1.C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 6 }}>{node.description}</div>
            <div style={{ color: theme_1.C.violet, fontSize: 10.5, fontWeight: 700, marginTop: 7 }}>Unlocks: {node.unlock}</div>
            <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 5 }}>{(0, theme_1.fmtMoney)(node.cost)} setup · {node.points} development pts{node.prereq.length ? " \u00B7 Requires ".concat(node.prereq.map(function (id) { return (0, research_1.researchDef)(id).title; }).join(" + ")) : ""}</div>
            {!done && (active === null || active === void 0 ? void 0 : active.nodeId) !== node.id && <><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} onClick={function () { return startResearch(node.id); }} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 9, opacity: check.ok ? 1 : .45 })}>Start research</button>{!check.ok && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {check.reason}</div>}</>}
          </div>;
            })}
      </div>
    </components_1.Panel>; })}

    <components_1.Panel title="🧪 Product Category Development">
      <div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>Category expansion now lives here rather than inside Brands. A brand can only design categories the underlying business has learned to compete in.</div>
      {Object.values((_b = world.player.businesses) !== null && _b !== void 0 ? _b : {}).filter(function (b) { return Boolean(b && b.status === "active"); }).map(function (b) {
            var cfg = industries_1.INDUSTRIES[b.industryId];
            if (!cfg)
                return null;
            return <div key={b.industryId} style={{ marginBottom: 14 }}><b style={{ fontSize: 12 }}>{cfg.label}</b><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 8, marginTop: 7 }}>{cfg.products.map(function (pt) {
                    var unlocked = b.unlockedCategories.includes(pt.key);
                    var project = b.categoryExpansionProjects.find(function (p) { return p.productKey === pt.key; });
                    var def = (0, growth_1.categoryGrowthDef)(world, pt.key);
                    var check = !unlocked && !project ? (0, growth_1.canStartCategoryExpansion)(world, pt.key) : null;
                    return <div key={pt.key} style={{ border: "1px solid ".concat(unlocked ? "#bbf7d0" : project ? theme_1.C.cyan : theme_1.C.line), borderRadius: 9, padding: 10, background: theme_1.C.bg }}><div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><b style={{ fontSize: 11.5 }}>{pt.label}</b><span style={{ fontSize: 9, color: unlocked ? theme_1.C.green : project ? theme_1.C.cyan : theme_1.C.faint, fontWeight: 800 }}>{unlocked ? "READY" : project ? "DEVELOPING" : "LOCKED"}</span></div>{project ? <><div style={{ height: 5, background: theme_1.C.grid, borderRadius: 9, marginTop: 8 }}><div style={{ width: "".concat((1 - project.daysLeft / project.totalDays) * 100, "%"), height: "100%", background: theme_1.C.cyan, borderRadius: 9 }}/></div><div style={{ fontSize: 9.5, color: categoryRate > 0 ? theme_1.C.dim : theme_1.C.amber, marginTop: 4 }}>{categoryRate > 0 ? "".concat(Math.ceil(project.daysLeft / categoryRate), "d estimated") : "Paused \u2014 seat both CIO and Product staff to resume."}</div></> : !unlocked && def ? <><div style={{ fontSize: 9.5, color: theme_1.C.dim, marginTop: 6 }}>{def.blurb}</div><button disabled={!(check === null || check === void 0 ? void 0 : check.ok)} onClick={function () { return startCategoryExpansion(pt.key); }} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 7, opacity: (check === null || check === void 0 ? void 0 : check.ok) ? 1 : .45 })}>Develop · {(0, theme_1.fmtMoney)(def.investment)} · {def.days}d</button>{check && !check.ok && <div style={{ color: theme_1.C.amber, fontSize: 9, marginTop: 3 }}>↳ {check.reason}</div>}</> : <div style={{ fontSize: 9.5, color: theme_1.C.dim, marginTop: 6 }}>Available for product design.</div>}</div>;
                })}</div></div>;
        })}
    </components_1.Panel>
  </div>;
}
function Metric(_a) {
    var label = _a.label, value = _a.value;
    return <div style={{ padding: 10, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, background: theme_1.C.bg }}><small style={{ color: theme_1.C.faint }}>{label}</small><div style={{ fontWeight: 800, fontSize: 14, marginTop: 3 }}>{value}</div></div>;
}
