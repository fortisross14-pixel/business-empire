"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsView = FinancialsView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var ip_1 = require("../../engine/ip");
function FinancialsView(_a) {
    var world = _a.world, hist = _a.hist, borrow = _a.borrow, repay = _a.repay;
    var tier = world.player.financeDept;
    var live = world.live;
    if (!live)
        return <components_1.Panel title="Company Money"><div style={{ color: theme_1.C.dim, fontSize: 13 }}>Cash on hand: <b style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtMoney)(world.player.cash)}</b>. Run the simulation to generate operating data.</div></components_1.Panel>;
    var I = live.income, F = live.cashflow;
    var markers = world.events.map(function (e) { return ({ i: hist.findIndex(function (h) { return h.tick >= e.tick; }) }); }).filter(function (m) { return m.i >= 0; });
    var cashNegative = F.cash < 0;
    var profitCashGap = Math.abs(I.profit - F.operatingCashFlow);
    var operatingSpend = I.marketing + I.brandMarketing + I.slotting + I.deptOverhead + I.licensingCost + I.locationCost + I.personnelCost;
    var grossMarginPct = I.netRevenue > 0 ? I.contribution / I.netRevenue : 0;
    var cashGap = F.operatingCashFlow - I.profit;
    var diagnosis = I.netRevenue <= 0
        ? "You are not generating meaningful sales yet. Cash burn is mostly fixed operating spend and launch investment."
        : I.contribution < 0
            ? "Sales are growing, but product/channel economics are destroying value before overhead. Fix price, unit cost or route to market first."
            : I.profit < 0
                ? "Products are contributing positively, but operating spend is larger than the contribution they generate. Scale revenue or trim overhead/marketing."
                : cashGap < -Math.max(50000, Math.abs(I.profit) * .25)
                    ? "The business is profitable, but working capital is absorbing cash. Inventory and retailer payment timing are the main place to look."
                    : "The core business is currently profitable and converting reasonably into cash. Watch stock-outs and unnecessary overhead as you scale.";
    return (<div>
      <components_1.Panel title="Company Money — what is happening?">
        {tier === 0 && <div style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#fff8e8", border: "1px solid #f3d58a", color: "#7a5707", fontSize: 10.5 }}>Founder view: cash, sales and product profitability are always visible. Seat Finance staff to unlock the full income statement, working capital and customer contribution detail.</div>}
        <div style={{ color: I.profit >= 0 ? theme_1.C.dim : theme_1.C.ink, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{diagnosis}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
          <MoneyDriver label="Product contribution" value={(0, theme_1.fmtMoney)(I.contribution)} detail={"".concat((grossMarginPct * 100).toFixed(0), "% of net revenue")} tone={I.contribution >= 0 ? "good" : "bad"}/>
          <MoneyDriver label="Operating spend" value={(0, theme_1.fmtMoney)(operatingSpend)} detail="Marketing + people + facilities + departments" tone={operatingSpend > Math.max(1, I.contribution) ? "warn" : "normal"}/>
          <MoneyDriver label="Net profit" value={(0, theme_1.fmtMoney)(I.profit)} detail="After overhead and interest" tone={I.profit >= 0 ? "good" : "bad"}/>
          <MoneyDriver label="Operating cash flow" value={(0, theme_1.fmtMoney)(F.operatingCashFlow)} detail={cashGap < 0 ? "".concat((0, theme_1.fmtMoney)(Math.abs(cashGap)), " below profit") : "".concat((0, theme_1.fmtMoney)(cashGap), " above profit")} tone={F.operatingCashFlow >= 0 ? "good" : "bad"}/>
          <MoneyDriver label="Cash on hand" value={(0, theme_1.fmtMoney)(world.player.cash)} detail={I.profit < 0 ? "~".concat(Math.max(0, world.player.cash / Math.max(1, -I.profit / 90)).toFixed(0), " days at current loss rate") : "Current bank balance"} tone={world.player.cash < 0 ? "bad" : world.player.cash < 250000 ? "warn" : "normal"}/>
        </div>
      </components_1.Panel>

      {/* Tier 1+: Sales by SKU */}
      <components_1.Panel title="Sales by SKU">
        {world.player.skus.length === 0 ? <div style={{ color: theme_1.C.faint }}>No products yet.</div> :
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ color: theme_1.C.dim, textAlign: "right" }}><th style={{ textAlign: "left", padding: "6px 4px" }}>SKU</th><th>List</th><th>Cost</th><th>Inventory</th><th>Units/day</th><th>Units/Q</th><th>Net Rev</th><th>Contribution</th></tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {world.player.skus.map(function (s, i) {
                    var _a, _b;
                    var r = live.skuResults[i] || {};
                    var out = ((_a = r.inventory) !== null && _a !== void 0 ? _a : s.inventory) < 1;
                    return (<tr key={i} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
                    <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "8px 4px" }}>{s.name}</td>
                    <td style={{ color: theme_1.C.dim }}>${s.listPrice}</td>
                    <td style={{ color: theme_1.C.dim }}>${s.unitCost.toFixed(1)}</td>
                    <td style={{ color: out ? theme_1.C.red : theme_1.C.ink }}>{out ? "OUT" : (0, theme_1.fmtNum)((_b = r.inventory) !== null && _b !== void 0 ? _b : s.inventory)}</td>
                    <td style={{ color: theme_1.C.ink }}>{((r.units || 0) / 90).toFixed(((r.units || 0) / 90) < 10 ? 1 : 0)}</td>
                    <td style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtNum)(r.units || 0)}</td>
                    <td style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtMoney)(r.revenue || 0)}</td>
                    <td style={{ color: (r.margin || 0) >= 0 ? theme_1.C.green : theme_1.C.red }}>{(0, theme_1.fmtMoney)(r.margin || 0)}</td>
                  </tr>);
                })}
            </tbody>
          </table>}
        {world.player.lostSales > 1 && <div style={{ marginTop: 10, color: theme_1.C.amber, fontSize: 12 }}>⚠ Lost sales from stock-outs: {(0, theme_1.fmtNum)(world.player.lostSales)} units cumulative.</div>}
      </components_1.Panel>

      {/* Tier 3+: Charts */}
      {tier >= 3 && (<div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <components_1.Panel title="Profit vs. Operating Cash Flow" style={{ flex: "1 1 320px" }}>
            <components_1.LineChart series={[
                { data: hist.map(function (h) { return h.profit; }), color: theme_1.C.green },
                { data: hist.map(function (h) { return h.operatingCashFlow; }), color: theme_1.C.cyan },
            ]} fmt={theme_1.fmtMoney} zeroLine markers={markers}/>
            <div style={{ color: theme_1.C.dim, fontSize: 12, marginTop: 6 }}>
              <span style={{ color: theme_1.C.green }}>● profit</span> &nbsp; <span style={{ color: theme_1.C.cyan }}>● cash flow</span> — when they diverge, working capital is the cause.
            </div>
          </components_1.Panel>
          <components_1.Panel title="Cash Balance" style={{ flex: "1 1 320px" }}>
            <components_1.LineChart series={[{ data: hist.map(function (h) { return h.cash; }), color: cashNegative ? theme_1.C.red : theme_1.C.amber }]} fmt={theme_1.fmtMoney} zeroLine markers={markers}/>
            {cashNegative && <div style={{ color: theme_1.C.red, fontSize: 12, marginTop: 6 }}>⚠ Cash is negative. Draw a credit line below or you'll be insolvent.</div>}
          </components_1.Panel>
        </div>)}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {tier >= 1 && <components_1.Panel title="Income Statement (per quarter)" style={{ flex: "1 1 320px" }}>
          <components_1.Row k="Gross revenue" v={(0, theme_1.fmtMoney)(I.grossRevenue)}/>
          <components_1.Row k="− Channel cut" v={(0, theme_1.fmtMoney)(-I.channelCut)} indent/>
          <components_1.Row k="Net revenue" v={(0, theme_1.fmtMoney)(I.netRevenue)} strong/>
          <components_1.Row k="− COGS" v={(0, theme_1.fmtMoney)(-I.cogs)} indent/>
          <components_1.Row k="Contribution" v={(0, theme_1.fmtMoney)(I.contribution)} strong/>
          <components_1.Row k="− Marketing" v={(0, theme_1.fmtMoney)(-I.marketing)} indent/>
          <components_1.Row k="− Brand marketing" v={(0, theme_1.fmtMoney)(-I.brandMarketing)} indent/>
          <components_1.Row k="− Slotting fees" v={(0, theme_1.fmtMoney)(-I.slotting)} indent/>
          {I.deptOverhead > 0 && <components_1.Row k="− Departments" v={(0, theme_1.fmtMoney)(-I.deptOverhead)} indent/>}
          {I.licensingCost > 0 && <components_1.Row k="− Licensing" v={(0, theme_1.fmtMoney)(-I.licensingCost)} indent/>}
          {I.locationCost > 0 && <components_1.Row k="− Buildings" v={(0, theme_1.fmtMoney)(-I.locationCost)} indent/>}
          {I.personnelCost > 0 && <components_1.Row k="− Personnel" v={(0, theme_1.fmtMoney)(-I.personnelCost)} indent/>}
          <components_1.Row k="EBITDA" v={(0, theme_1.fmtMoney)(I.ebitda)} strong/>
          <components_1.Row k="− Interest" v={(0, theme_1.fmtMoney)(-I.interest)} indent/>
          <components_1.Row k="Net profit" v={(0, theme_1.fmtMoney)(I.profit)} strong/>
        </components_1.Panel>}

        {/* Tier 2+: Cash Flow & Working Capital */}
        {tier >= 2 && (<components_1.Panel title="Cash Flow & Working Capital" style={{ flex: "1 1 320px" }}>
            <components_1.Row k="Cash on hand" v={(0, theme_1.fmtMoney)(F.cash)} strong/>
            <components_1.Row k="Inventory (cash tied up)" v={(0, theme_1.fmtMoney)(F.inventoryValue)}/>
            <components_1.Row k="Receivables (owed to you)" v={(0, theme_1.fmtMoney)(F.receivables)}/>
            <components_1.Row k="Debt" v={(0, theme_1.fmtMoney)(F.debt)}/>
            {(0, ip_1.companyIPPortfolioValue)(world) > 0 && <components_1.Row k="Owned IP value (est.)" v={(0, theme_1.fmtMoney)((0, ip_1.companyIPPortfolioValue)(world))}/>}
            <components_1.Row k="Estimated company value" v={(0, theme_1.fmtMoney)((0, ip_1.estimatedCompanyValue)(world))} strong/>
            <components_1.Row k="Cash conversion cycle" v={"".concat(Math.round(F.cashCycleDays), " days")}/>
            <components_1.Row k="Operating cash flow / Q" v={(0, theme_1.fmtMoney)(F.operatingCashFlow)} strong/>
            <div style={{ marginTop: 10, color: theme_1.C.faint, fontSize: 11, lineHeight: 1.5 }}>
              Profit and cash differ by {(0, theme_1.fmtMoney)(profitCashGap)}/Q. Inventory and slow channel payments lock up cash even when you're profitable.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={function () { return borrow(1000000); }} style={{ background: theme_1.C.panel2, color: theme_1.C.ink, border: "1px solid ".concat(theme_1.C.line), borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>+ Draw $1M credit</button>
              <button onClick={function () { return repay(1000000); }} style={{ background: theme_1.C.panel2, color: theme_1.C.dim, border: "1px solid ".concat(theme_1.C.line), borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Repay $1M</button>
            </div>
            <div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 4 }}>Credit line costs 10%/yr interest.</div>
          </components_1.Panel>)}
      </div>

      {/* Tier 2+: Contribution by Cell */}
      {tier >= 2 && (<components_1.Panel title="Contribution by Customer Cell — not all customers are equally valuable">
          <CellContributionTable cells={live.cellFinance} brandColor={theme_1.C.violet}/>
        </components_1.Panel>)}

      {tier < 2 && (<components_1.Panel>
          <div style={{ color: theme_1.C.faint, fontSize: 12 }}>
            {tier === 0 ? "Hire and seat a Finance employee to unlock the formal income statement. Grow that team further to unlock working capital and customer-level contribution." : "Grow your staffed Finance office to unlock cash flow, working capital, and customer-level contribution detail."}
          </div>
        </components_1.Panel>)}
    </div>);
}
function MoneyDriver(_a) {
    var label = _a.label, value = _a.value, detail = _a.detail, tone = _a.tone;
    var color = tone === "good" ? theme_1.C.green : tone === "bad" ? theme_1.C.red : tone === "warn" ? theme_1.C.amber : theme_1.C.ink;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: 10 }}><div style={{ color: theme_1.C.faint, fontSize: 9, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><div style={{ color: color, fontFamily: "ui-monospace", fontWeight: 800, fontSize: 15, marginTop: 2 }}>{value}</div><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 4, lineHeight: 1.35 }}>{detail}</div></div>;
}
function CellContributionTable(_a) {
    var cells = _a.cells, brandColor = _a.brandColor;
    if (!cells.length)
        return <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No sales yet — launch a product and build awareness.</div>;
    var top = __spreadArray([], cells, true).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 10);
    var maxRev = Math.max.apply(Math, top.map(function (c) { return c.revenue; }));
    return (<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr style={{ color: theme_1.C.dim, textAlign: "right" }}>
        <th style={{ textAlign: "left", padding: "4px" }}>Cell</th><th>Revenue</th><th>Gross margin</th><th>Marketing</th><th>Contribution</th><th>Margin %</th>
      </tr></thead>
      <tbody style={{ fontFamily: "ui-monospace" }}>
        {top.map(function (c, i) {
            var marginPct = c.revenue > 0 ? c.contribution / c.revenue : 0;
            return (<tr key={i} style={{ borderTop: "1px solid ".concat(theme_1.C.grid), textAlign: "right" }}>
              <td style={{ textAlign: "left", color: theme_1.C.ink, padding: "6px 4px" }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: brandColor, opacity: c.revenue / maxRev, marginRight: 6 }}/>
                {c.coord.age} {c.coord.gender.slice(0, 1)} {c.coord.class} {c.coord.leaning.slice(0, 4)}
              </td>
              <td style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtMoney)(c.revenue)}</td>
              <td style={{ color: theme_1.C.dim }}>{(0, theme_1.fmtMoney)(c.grossMargin)}</td>
              <td style={{ color: theme_1.C.dim }}>{(0, theme_1.fmtMoney)(c.marketingAllocated)}</td>
              <td style={{ color: c.contribution >= 0 ? theme_1.C.green : theme_1.C.red }}>{(0, theme_1.fmtMoney)(c.contribution)}</td>
              <td style={{ color: marginPct >= 0.2 ? theme_1.C.green : marginPct >= 0 ? theme_1.C.amber : theme_1.C.red }}>{(0, theme_1.fmtPct)(marginPct)}</td>
            </tr>);
        })}
      </tbody>
    </table>);
}
