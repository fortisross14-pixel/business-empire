"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyView = StrategyView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var strategy_1 = require("../../engine/strategy");
function StrategyView(_a) {
    var world = _a.world;
    if (world.player.intelDept < 2) {
        return (<components_1.Panel title="Strategy Reports">
        <div style={{ color: theme_1.C.dim, fontSize: 14, lineHeight: 1.6 }}>
          Your Strategy / Intelligence team is not large enough for strategic analysis. Add and seat more Strategy staff on the Campus.
        </div>
      </components_1.Panel>);
    }
    var swot = (0, strategy_1.computeSwot)(world);
    var forces = (0, strategy_1.computePorter)(world);
    var bcg = (0, strategy_1.computeBcg)(world);
    var memo = (0, strategy_1.computeBoardMemo)(world);
    return (<div>
      <components_1.Panel title="Board Memo — this quarter">
        <div style={{ color: theme_1.C.ink, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{memo.headline}</div>
        {memo.whatHappened.length > 0 && (<div style={{ marginBottom: 12 }}>
            <div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>What happened</div>
            {memo.whatHappened.map(function (h, i) { return <div key={i} style={{ color: theme_1.C.ink, fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>• {h}</div>; })}
          </div>)}
        <div>
          <div style={{ color: theme_1.C.amber, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Strategic issues — your call</div>
          {memo.issues.map(function (q, i) { return (<div key={i} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderLeft: "3px solid ".concat(theme_1.C.amber), borderRadius: 6, padding: "8px 12px", marginBottom: 6, color: theme_1.C.ink, fontSize: 13, lineHeight: 1.5 }}>{q}</div>); })}
        </div>
        <div style={{ marginTop: 10, color: theme_1.C.faint, fontSize: 11 }}>These frame the dilemma. The decision is yours — there's no “correct” button.</div>
      </components_1.Panel>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <components_1.Panel title="SWOT" style={{ flex: "1 1 360px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SwotBox title="Strengths" color={theme_1.C.green} items={swot.strengths}/>
            <SwotBox title="Weaknesses" color={theme_1.C.red} items={swot.weaknesses}/>
            <SwotBox title="Opportunities" color={theme_1.C.cyan} items={swot.opportunities}/>
            <SwotBox title="Threats" color={theme_1.C.amber} items={swot.threats}/>
          </div>
        </components_1.Panel>

        <components_1.Panel title="Porter's Five Forces — pressure on you" style={{ flex: "1 1 320px" }}>
          {forces.map(function (f, i) { return (<div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                <span style={{ color: theme_1.C.ink }}>{f.name}</span>
                <span style={{ color: pressureColor(f.pressure), fontFamily: "ui-monospace" }}>{pressureLabel(f.pressure)}</span>
              </div>
              <div style={{ height: 6, background: theme_1.C.grid, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: "".concat(f.pressure * 100, "%"), height: "100%", background: pressureColor(f.pressure) }}/>
              </div>
              <div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 3 }}>{f.note}</div>
            </div>); })}
        </components_1.Panel>
      </div>

      <components_1.Panel title="Portfolio — BCG Matrix">
        {bcg.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No products yet.</div> : <BcgMatrix items={bcg} brandColor={theme_1.C.violet}/>}
      </components_1.Panel>

      <components_1.Panel title="Product Analysis — where each product fits">
        {world.player.skus.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No products yet.</div> :
            (0, strategy_1.computeProductAnalysis)(world).map(function (pa, i) { return (<div key={i} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid ".concat(theme_1.C.grid) }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ color: theme_1.C.violet, fontWeight: 600 }}>{pa.sku}</span>
                <span style={{ color: theme_1.C.dim, fontSize: 11 }}>serves: {pa.topNeeds.map(function (n) { return "".concat(n.label, " ").concat((n.value * 100).toFixed(0)); }).join(" · ")}</span>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <FitList title="Best-fit segments" color={theme_1.C.green} rows={pa.best}/>
                <FitList title="Worst-fit segments" color={theme_1.C.red} rows={pa.worst}/>
              </div>
            </div>); })}
      </components_1.Panel>
    </div>);
}
function SwotBox(_a) {
    var title = _a.title, color = _a.color, items = _a.items;
    return (<div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderTop: "2px solid ".concat(color), borderRadius: 8, padding: 12 }}>
      <div style={{ color: color, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8, fontWeight: 700 }}>{title}</div>
      {items.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 12 }}>—</div> :
            items.map(function (it, i) { return <div key={i} style={{ color: theme_1.C.ink, fontSize: 12, lineHeight: 1.45, marginBottom: 6 }}>• {it.text}</div>; })}
    </div>);
}
var pressureColor = function (p) { return p > 0.66 ? theme_1.C.red : p > 0.4 ? theme_1.C.amber : theme_1.C.green; };
var pressureLabel = function (p) { return p > 0.66 ? "High" : p > 0.4 ? "Moderate" : "Low"; };
function BcgMatrix(_a) {
    var items = _a.items, brandColor = _a.brandColor;
    var W = 420, H = 320, pad = 50;
    // x = relative share (log-ish, 0..2+ mapped), high share on LEFT per BCG convention
    var xOf = function (rel) { return pad + (1 - Math.min(1, rel / 3)) * (W - 2 * pad); };
    var yOf = function (growth) {
        var g = Math.max(-0.02, Math.min(0.02, growth));
        return pad + (1 - (g + 0.02) / 0.04) * (H - 2 * pad);
    };
    var quadrantLabels = [
        { x: pad + 40, y: pad + 16, label: "Star", color: theme_1.C.green },
        { x: W - pad - 50, y: pad + 16, label: "Question Mark", color: theme_1.C.amber },
        { x: pad + 40, y: H - pad - 8, label: "Cash Cow", color: theme_1.C.cyan },
        { x: W - pad - 50, y: H - pad - 8, label: "Dog", color: theme_1.C.faint },
    ];
    return (<div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
      <svg viewBox={"0 0 ".concat(W, " ").concat(H)} style={{ width: "100%", maxWidth: 460 }}>
        <rect width={W} height={H} fill={theme_1.C.panel2} rx="8"/>
        <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke={theme_1.C.line}/>
        <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke={theme_1.C.line}/>
        {quadrantLabels.map(function (q, i) { return <text key={i} x={q.x} y={q.y} fill={q.color} fontSize="11" fontWeight="700" textAnchor="middle">{q.label}</text>; })}
        <text x={W / 2} y={H - 14} fill={theme_1.C.dim} fontSize="10" textAnchor="middle">← higher relative share          lower share →</text>
        <text x={16} y={H / 2} fill={theme_1.C.dim} fontSize="10" textAnchor="middle" transform={"rotate(-90 16 ".concat(H / 2, ")")}>← shrinking   market growth   growing →</text>
        {items.map(function (it, i) { return (<g key={i}>
            <circle cx={xOf(it.relShare)} cy={yOf(it.growth)} r={Math.max(6, Math.min(22, Math.sqrt(it.revenue) / 12))} fill={brandColor} opacity="0.5" stroke={brandColor}/>
            <text x={xOf(it.relShare)} y={yOf(it.growth) - 14} fill={theme_1.C.ink} fontSize="10" textAnchor="middle">{it.sku}</text>
          </g>); })}
      </svg>
      <div style={{ flex: "1 1 220px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ color: theme_1.C.dim, textAlign: "right" }}><th style={{ textAlign: "left", padding: "4px" }}>Product</th><th>Class</th><th>Rev/Q</th></tr></thead>
          <tbody style={{ fontFamily: "ui-monospace" }}>
            {items.map(function (it, i) { return (<tr key={i} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
                <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "6px 4px" }}>{it.sku}</td>
                <td style={{ color: classColor(it.klass) }}>{it.klass}</td>
                <td style={{ color: theme_1.C.dim }}>{(0, theme_1.fmtMoney)(it.revenue)}</td>
              </tr>); })}
          </tbody>
        </table>
        <div style={{ marginTop: 10, color: theme_1.C.faint, fontSize: 11, lineHeight: 1.5 }}>
          Bubble size ≈ revenue. Stars need investment, Cash Cows fund the rest, Question Marks are bets, Dogs are decisions.
        </div>
      </div>
    </div>);
}
var classColor = function (k) { return k === "Star" ? theme_1.C.green : k === "Cash Cow" ? theme_1.C.cyan : k === "Question Mark" ? theme_1.C.amber : theme_1.C.faint; };
function FitList(_a) {
    var title = _a.title, color = _a.color, rows = _a.rows;
    return (<div style={{ flex: "1 1 240px" }}>
      <div style={{ color: color, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr style={{ color: theme_1.C.faint, textAlign: "right" }}><th style={{ textAlign: "left" }}>Segment</th><th>Demo</th><th>Need</th><th>Fit</th></tr></thead>
        <tbody style={{ fontFamily: "ui-monospace" }}>
          {rows.map(function (r, i) { return (<tr key={i} style={{ textAlign: "right" }}>
              <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "2px 0" }}>{r.coord.age} {r.coord.class.slice(0, 3)} {r.coord.gender.slice(0, 1)}</td>
              <td style={{ color: theme_1.C.dim }}>{(r.demoFit * 100).toFixed(0)}</td>
              <td style={{ color: theme_1.C.dim }}>{(r.needFit * 100).toFixed(0)}</td>
              <td style={{ color: color }}>{(r.combined * 100).toFixed(0)}</td>
            </tr>); })}
        </tbody>
      </table>
    </div>);
}
