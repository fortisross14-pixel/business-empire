"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceView = IntelligenceView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var visualIdentity_1 = require("../visualIdentity");
var world_1 = require("../../engine/world");
var types_1 = require("../../engine/types");
var research_1 = require("../../engine/research");
function IntelligenceView(_a) {
    var _b;
    var world = _a.world, commission = _a.commission;
    var hasTech = (0, research_1.hasResearch)(world, "market_intelligence");
    var consultantOnly = world.player.intelDept < 1 || !hasTech;
    return (<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <components_1.Panel title={consultantOnly ? "External Market Research" : "Commission a Study"} style={{ flex: "1 1 320px" }}>
        {consultantOnly && <div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{!hasTech ? "Broader market research requires the Market Intelligence capability plus a seated Strategy team. You can still hire an external consultant for a post-launch product diagnosis." : "Market Intelligence is researched, but you still need a seated Strategy team to operate it. External product diagnosis remains available."}</div>}
        {Object.entries(world_1.STUDY_DEFS).filter(function (_a) {
            var type = _a[0];
            return !consultantOnly || type === "product_diagnosis";
        }).map(function (_a) {
            var type = _a[0], def = _a[1];
            var inflight = world.studies.find(function (s) { return s.type === type && !s.done; });
            var done = world.revealed[type];
            return (<div key={type} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid ".concat(theme_1.C.grid) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme_1.C.ink, fontWeight: 600 }}>{def.label}</span>
                <button onClick={function () { return commission(type); }} disabled={!!inflight} style={{ background: inflight ? theme_1.C.grid : theme_1.C.cyan, color: inflight ? theme_1.C.faint : "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: inflight ? "default" : "pointer" }}>{inflight ? "\u2026".concat(inflight.ticksLeft, "t") : (0, theme_1.fmtMoney)(def.cost)}</button>
              </div>
              <div style={{ color: theme_1.C.dim, fontSize: 12, marginTop: 4 }}>{def.blurb}</div>
              {done && <div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 3 }}>last run: Q{Math.floor(done.asOfTick / types_1.TICKS_PER_QUARTER)}</div>}
            </div>);
        })}
      </components_1.Panel>
      <components_1.Panel title="Reports" style={{ flex: "1 1 360px" }}>
        {Object.keys(world.revealed).length === 0 && <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No reports yet.</div>}
        {world.revealed.market_map && <Report title="Population Map"><div style={{ fontSize: 13, color: theme_1.C.dim }}>Population detail is now visible in Market. Total market: <span style={{ color: theme_1.C.green }}>{(0, theme_1.fmtMoney)(((_b = world.live) === null || _b === void 0 ? void 0 : _b.totalMarket) || 0)}</span>.</div></Report>}
        {world.revealed.gap_analysis && (<Report title="Gap Analysis — top underserved cells">
            {world.revealed.gap_analysis.gaps.map(function (g, i) { return (<div key={i} style={{ fontSize: 12, padding: "3px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: theme_1.C.ink }}>{g.coord.age} · {g.coord.class} · {g.coord.gender} · {g.coord.leaning}</span>
                <span style={{ fontFamily: "ui-monospace", color: theme_1.C.amber }}>{(0, theme_1.fmtMoney)(g.market)} · fit {g.bestFit.toFixed(2)}</span>
              </div>); })}
            <div style={{ marginTop: 8, color: theme_1.C.faint, fontSize: 11 }}>High market + low best-fit = a niche nobody serves well.</div>
          </Report>)}
        {world.revealed.competitor_benchmark && (<Report title="Competitor Benchmark">
            <div style={{ display: "grid", gap: 8 }}>
              {world.revealed.competitor_benchmark.rivals.map(function (r, i) {
                var liveComp = world.comps.find(function (c) { return c.name === r.name; });
                return <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: "1px solid ".concat(theme_1.C.grid) }}>
                  <div>{liveComp ? <visualIdentity_1.CompetitorChip comp={liveComp}/> : <span style={{ color: theme_1.C.ink, fontWeight: 700 }}>{r.name}</span>}</div>
                  <div style={{ fontFamily: "ui-monospace", fontSize: 12, color: theme_1.C.dim, textAlign: "right" }}>${r.price} · ~{(r.margin * 100).toFixed(0)}% margin</div>
                </div>;
            })}
              <div style={{ borderTop: "1px solid ".concat(theme_1.C.grid), margin: "4px 0" }}/>
              {world.revealed.competitor_benchmark.you.map(function (r, i) { return <div key={i} style={{ color: theme_1.C.cyan, fontFamily: "ui-monospace", fontSize: 12 }}>{r.name}: ${r.price} · cost ${r.unitCost} · {(r.margin * 100).toFixed(0)}%</div>; })}
            </div>
          </Report>)}
        {world.revealed.product_diagnosis && (<Report title="Post-launch Product Study">
            {world.revealed.product_diagnosis.diagnoses.length === 0
                ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No products to diagnose.</div>
                : world.revealed.product_diagnosis.diagnoses.map(function (d, i) {
                    var _a, _b, _c;
                    return (<div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, padding: "6px 0", borderBottom: i < world.revealed.product_diagnosis.diagnoses.length - 1 ? "1px solid ".concat(theme_1.C.grid) : "none" }}>
                  <span style={{ color: d.verdict === "mismatch" ? theme_1.C.amber : d.verdict === "weak" ? theme_1.C.red : theme_1.C.green }}>
                    {d.verdict === "mismatch" ? "⚠ " : d.verdict === "weak" ? "✕ " : "✓ "}
                  </span>
                  <span style={{ color: theme_1.C.ink }}>{d.message}</span>
                  {d.stars && <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", color: theme_1.C.dim, fontSize: 10.5 }}>
                    <span>Product {"★".repeat(d.stars.product)}{"☆".repeat(5 - d.stars.product)}</span>
                    <span>Price {"★".repeat(d.stars.price)}{"☆".repeat(5 - d.stars.price)}</span>
                    <span>Channel {"★".repeat(d.stars.channel)}{"☆".repeat(5 - d.stars.channel)}</span>
                    <span>Brand {"★".repeat(d.stars.brand)}{"☆".repeat(5 - d.stars.brand)}</span>
                    <span>IP {"★".repeat(d.stars.ip)}{"☆".repeat(5 - d.stars.ip)}</span>
                  </div>}
                  {((_a = d.issues) === null || _a === void 0 ? void 0 : _a.length) > 0 && <div style={{ marginTop: 5, color: theme_1.C.amber, fontSize: 11 }}>{d.issues.slice(0, 2).join(" ")}</div>}
                  {((_b = d.recommendations) === null || _b === void 0 ? void 0 : _b.length) > 0 && ((_c = d.stars) === null || _c === void 0 ? void 0 : _c.channel) <= 3 && <div style={{ marginTop: 4, color: theme_1.C.cyan, fontSize: 11 }}>Try channels: {d.recommendations.join(", ")}.</div>}
                </div>);
                })}
            <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 8 }}>Studies explain what happened; they do not buff the product. Apply the learning to pricing, channels, brand/IP fit, or your next launch.</div>
          </Report>)}
        {world.revealed.market_report && (<Report title="Market Report">
            <div style={{ fontSize: 13, color: theme_1.C.ink, lineHeight: 1.6, marginBottom: 8 }}>
              {world.revealed.market_report.summary}
            </div>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: theme_1.C.dim, marginBottom: 4 }}>Top 3 players:</div>
              {world.revealed.market_report.top3.map(function (p, i) { return (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: theme_1.C.ink }}>{i + 1}. {p.name}</span>
                  <span style={{ fontFamily: "ui-monospace", color: theme_1.C.violet }}>{(0, theme_1.fmtPct)(p.share)}</span>
                </div>); })}
            </div>
            <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 8 }}>
              Direction: <span style={{ color: world.revealed.market_report.direction === "growing" ? theme_1.C.green : world.revealed.market_report.direction === "declining" ? theme_1.C.red : theme_1.C.dim }}>
                {world.revealed.market_report.direction}
              </span> ({(0, theme_1.fmtPct)(world.revealed.market_report.marketGrowth)} vs base). {world.revealed.market_report.cover60} player(s) cover 60% of the market.
            </div>
          </Report>)}
      </components_1.Panel>
    </div>);
}
var Report = function (_a) {
    var title = _a.title, children = _a.children;
    return (<div style={{ marginBottom: 14, background: theme_1.C.panel2, borderRadius: 8, padding: 12, border: "1px solid ".concat(theme_1.C.line) }}>
    <div style={{ color: theme_1.C.cyan, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>{title}</div>{children}
  </div>);
};
