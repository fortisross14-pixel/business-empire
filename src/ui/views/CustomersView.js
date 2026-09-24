"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersView = CustomersView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var customers_1 = require("../../engine/customers");
var types_1 = require("../../engine/types");
function CustomersView(_a) {
    var world = _a.world;
    if (world.player.intelDept < 1) {
        return (<components_1.Panel title="Customer Base">
        <div style={{ color: theme_1.C.dim, fontSize: 14, lineHeight: 1.6 }}>
          You need at least a small Strategy / Intelligence team to see customer data. Hire Strategy staff and seat them in a Campus office.
        </div>
      </components_1.Panel>);
    }
    var totals = (0, customers_1.customerTotals)(world);
    var hasBase = totals.total > 0;
    // per saved-segment rollup of the customer base
    var segRows = world.savedSegments.map(function (seg) {
        var idxs = [];
        world.cube.forEach(function (c, i) {
            var ok = Object.entries(seg.filter).every(function (_a) {
                var ax = _a[0], vals = _a[1];
                return !vals || vals.length === 0 || vals.includes(c.coord[ax]);
            });
            if (ok)
                idxs.push(i);
        });
        var count = 0, satW = 0, pop = 0, ltvW = 0;
        for (var _i = 0, idxs_1 = idxs; _i < idxs_1.length; _i++) {
            var i = idxs_1[_i];
            var cc = (0, customers_1.getCustomers)(world, i);
            count += cc.count;
            satW += cc.satisfaction * cc.count;
            pop += world.cube[i].head;
            ltvW += (0, customers_1.cellLTV)(world, i, world.cube[i].spend) * cc.count;
        }
        var sat = count > 0 ? satW / count : 0;
        var churnAnnual = Math.min(0.97, Math.max(0.01, (0.02 + (0.7 - sat) * 0.28)) * types_1.TICKS_PER_QUARTER * 4);
        return { name: seg.name, count: count, sat: sat, penetration: pop > 0 ? count / pop : 0, ltv: count > 0 ? ltvW / count : 0, churn: count > 0 ? churnAnnual : 0 };
    });
    var satColor = function (s) { return s > 0.62 ? theme_1.C.green : s > 0.48 ? theme_1.C.amber : theme_1.C.red; };
    return (<div>
      <components_1.Panel title="Customer Base">
        {!hasBase ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No customers yet. Launch a product and build awareness to start acquiring a base.</div> : (<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <BigStat label="Total customers" value={(0, theme_1.fmtNum)(totals.total)} color={theme_1.C.cyan}/>
            <BigStat label="Avg satisfaction" value={(0, theme_1.fmtPct)(totals.avgSatisfaction)} color={satColor(totals.avgSatisfaction)}/>
            <BigStat label="Segments served" value={String(totals.activeCells)} color={theme_1.C.ink}/>
          </div>)}
        <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 12, lineHeight: 1.5 }}>
          Customers are a stock you build, retain, and can lose. Satisfied customers repurchase and recommend you (word-of-mouth grows the base); dissatisfied ones churn and dampen it. Neglect a segment — or let a rival serve it better — and the base erodes.
        </div>
      </components_1.Panel>

      <components_1.Panel title="By Segment">
        {!hasBase ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>—</div> : (<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: theme_1.C.faint, textAlign: "right" }}>
                <th style={{ textAlign: "left" }}>Segment</th><th>Customers</th><th>Penetration</th><th>Satisfaction</th><th>Churn/yr</th><th>LTV</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {segRows.map(function (r, i) { return (<tr key={i} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
                  <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "6px 0" }}>{r.name}</td>
                  <td style={{ color: theme_1.C.ink }}>{r.count > 0 ? (0, theme_1.fmtNum)(r.count) : "—"}</td>
                  <td style={{ color: theme_1.C.dim }}>{r.count > 0 ? (0, theme_1.fmtPct)(r.penetration) : "—"}</td>
                  <td style={{ color: r.count > 0 ? satColor(r.sat) : theme_1.C.faint }}>{r.count > 0 ? (0, theme_1.fmtPct)(r.sat) : "—"}</td>
                  <td style={{ color: theme_1.C.dim }}>{r.count > 0 ? (0, theme_1.fmtPct)(r.churn) : "—"}</td>
                  <td style={{ color: theme_1.C.green }}>{r.count > 0 ? "$" + r.ltv.toFixed(0) : "—"}</td>
                </tr>); })}
            </tbody>
          </table>)}
        <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
          LTV = a customer's expected lifetime value (annual spend × repeat rate ÷ churn). High-satisfaction segments churn slowly and are worth far more — protect them.
        </div>
      </components_1.Panel>
    </div>);
}
var BigStat = function (_a) {
    var label = _a.label, value = _a.value, color = _a.color;
    return (<div>
    <div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>{label}</div>
    <div style={{ color: color, fontSize: 28, fontWeight: 700, fontFamily: "ui-monospace" }}>{value}</div>
  </div>);
};
