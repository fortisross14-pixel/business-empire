import React from "react";
import { C, fmtMoney, fmtNum, fmtPct } from "../theme";
import { Panel, LineChart, Row } from "../components";
import type { World, CellFinance, DeptTier } from "../../engine/types";
import { companyIPPortfolioValue, estimatedCompanyValue } from "../../engine/ip";

export function FinancialsView({ world, hist, borrow, repay }:
  { world: World; hist: World["history"]; borrow: (a: number) => void; repay: (a: number) => void }) {
  const tier = world.player.financeDept;
  const live = world.live;

  if (!live) return <Panel title="Company Money"><div style={{ color: C.dim, fontSize: 13 }}>Cash on hand: <b style={{ color: C.ink }}>{fmtMoney(world.player.cash)}</b>. Run the simulation to generate operating data.</div></Panel>;
  const I = live.income, F = live.cashflow;
  const markers = world.events.map((e) => ({ i: hist.findIndex((h) => h.tick >= e.tick) })).filter((m) => m.i >= 0);

  const cashNegative = F.cash < 0;
  const profitCashGap = Math.abs(I.profit - F.operatingCashFlow);
  const operatingSpend = I.marketing + I.brandMarketing + I.slotting + I.deptOverhead + I.licensingCost + I.locationCost + I.personnelCost;
  const grossMarginPct = I.netRevenue > 0 ? I.contribution / I.netRevenue : 0;
  const cashGap = F.operatingCashFlow - I.profit;
  const diagnosis = I.netRevenue <= 0
    ? "You are not generating meaningful sales yet. Cash burn is mostly fixed operating spend and launch investment."
    : I.contribution < 0
      ? "Sales are growing, but product/channel economics are destroying value before overhead. Fix price, unit cost or route to market first."
      : I.profit < 0
        ? "Products are contributing positively, but operating spend is larger than the contribution they generate. Scale revenue or trim overhead/marketing."
        : cashGap < -Math.max(50_000, Math.abs(I.profit) * .25)
          ? "The business is profitable, but working capital is absorbing cash. Inventory and retailer payment timing are the main place to look."
          : "The core business is currently profitable and converting reasonably into cash. Watch stock-outs and unnecessary overhead as you scale.";

  return (
    <div>
      <Panel title="Company Money — what is happening?">
        {tier === 0 && <div style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#fff8e8", border: "1px solid #f3d58a", color: "#7a5707", fontSize: 10.5 }}>Founder view: cash, sales and product profitability are always visible. Seat Finance staff to unlock the full income statement, working capital and customer contribution detail.</div>}
        <div style={{ color: I.profit >= 0 ? C.dim : C.ink, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{diagnosis}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
          <MoneyDriver label="Product contribution" value={fmtMoney(I.contribution)} detail={`${(grossMarginPct * 100).toFixed(0)}% of net revenue`} tone={I.contribution >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Operating spend" value={fmtMoney(operatingSpend)} detail="Marketing + people + facilities + departments" tone={operatingSpend > Math.max(1, I.contribution) ? "warn" : "normal"} />
          <MoneyDriver label="Net profit" value={fmtMoney(I.profit)} detail="After overhead and interest" tone={I.profit >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Operating cash flow" value={fmtMoney(F.operatingCashFlow)} detail={cashGap < 0 ? `${fmtMoney(Math.abs(cashGap))} below profit` : `${fmtMoney(cashGap)} above profit`} tone={F.operatingCashFlow >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Cash on hand" value={fmtMoney(world.player.cash)} detail={I.profit < 0 ? `~${Math.max(0, world.player.cash / Math.max(1, -I.profit / 90)).toFixed(0)} days at current loss rate` : "Current bank balance"} tone={world.player.cash < 0 ? "bad" : world.player.cash < 250_000 ? "warn" : "normal"} />
        </div>
      </Panel>

      {/* Tier 1+: Sales by SKU */}
      <Panel title="Sales by SKU">
        {world.player.skus.length === 0 ? <div style={{ color: C.faint }}>No products yet.</div> :
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ color: C.dim, textAlign: "right" }}><th style={{ textAlign: "left", padding: "6px 4px" }}>SKU</th><th>List</th><th>Cost</th><th>Inventory</th><th>Units/day</th><th>Units/Q</th><th>Net Rev</th><th>Contribution</th></tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {world.player.skus.map((s, i) => {
                const r = live.skuResults[i] || ({} as any);
                const out = (r.inventory ?? s.inventory) < 1;
                return (
                  <tr key={i} style={{ borderTop: `1px solid ${C.grid}`, textAlign: "right" }}>
                    <td style={{ textAlign: "left", color: C.ink, padding: "8px 4px" }}>{s.name}</td>
                    <td style={{ color: C.dim }}>${s.listPrice}</td>
                    <td style={{ color: C.dim }}>${s.unitCost.toFixed(1)}</td>
                    <td style={{ color: out ? C.red : C.ink }}>{out ? "OUT" : fmtNum(r.inventory ?? s.inventory)}</td>
                    <td style={{ color: C.ink }}>{((r.units || 0) / 90).toFixed(((r.units || 0) / 90) < 10 ? 1 : 0)}</td>
                    <td style={{ color: C.ink }}>{fmtNum(r.units || 0)}</td>
                    <td style={{ color: C.ink }}>{fmtMoney(r.revenue || 0)}</td>
                    <td style={{ color: (r.margin || 0) >= 0 ? C.green : C.red }}>{fmtMoney(r.margin || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>}
        {world.player.lostSales > 1 && <div style={{ marginTop: 10, color: C.amber, fontSize: 12 }}>⚠ Lost sales from stock-outs: {fmtNum(world.player.lostSales)} units cumulative.</div>}
      </Panel>

      {/* Tier 3+: Charts */}
      {tier >= 3 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
          <Panel title="Profit vs. Operating Cash Flow" style={{ flex: "1 1 320px" }}>
            <LineChart series={[
              { data: hist.map((h) => h.profit), color: C.green },
              { data: hist.map((h) => h.operatingCashFlow), color: C.cyan },
            ]} fmt={fmtMoney} zeroLine markers={markers} />
            <div style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>
              <span style={{ color: C.green }}>● profit</span> &nbsp; <span style={{ color: C.cyan }}>● cash flow</span> — when they diverge, working capital is the cause.
            </div>
          </Panel>
          <Panel title="Cash Balance" style={{ flex: "1 1 320px" }}>
            <LineChart series={[{ data: hist.map((h) => h.cash), color: cashNegative ? C.red : C.amber }]} fmt={fmtMoney} zeroLine markers={markers} />
            {cashNegative && <div style={{ color: C.red, fontSize: 12, marginTop: 6 }}>⚠ Cash is negative. Draw a credit line below or you'll be insolvent.</div>}
          </Panel>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {tier >= 1 && <Panel title="Income Statement (per quarter)" style={{ flex: "1 1 320px" }}>
          <Row k="Gross revenue" v={fmtMoney(I.grossRevenue)} />
          <Row k="− Channel cut" v={fmtMoney(-I.channelCut)} indent />
          <Row k="Net revenue" v={fmtMoney(I.netRevenue)} strong />
          <Row k="− COGS" v={fmtMoney(-I.cogs)} indent />
          <Row k="Contribution" v={fmtMoney(I.contribution)} strong />
          <Row k="− Marketing" v={fmtMoney(-I.marketing)} indent />
          <Row k="− Brand marketing" v={fmtMoney(-I.brandMarketing)} indent />
          <Row k="− Slotting fees" v={fmtMoney(-I.slotting)} indent />
          {I.deptOverhead > 0 && <Row k="− Departments" v={fmtMoney(-I.deptOverhead)} indent />}
          {I.licensingCost > 0 && <Row k="− Licensing" v={fmtMoney(-I.licensingCost)} indent />}
          {I.locationCost > 0 && <Row k="− Buildings" v={fmtMoney(-I.locationCost)} indent />}
          {I.personnelCost > 0 && <Row k="− Personnel" v={fmtMoney(-I.personnelCost)} indent />}
          <Row k="EBITDA" v={fmtMoney(I.ebitda)} strong />
          <Row k="− Interest" v={fmtMoney(-I.interest)} indent />
          <Row k="Net profit" v={fmtMoney(I.profit)} strong />
        </Panel>}

        {/* Tier 2+: Cash Flow & Working Capital */}
        {tier >= 2 && (
          <Panel title="Cash Flow & Working Capital" style={{ flex: "1 1 320px" }}>
            <Row k="Cash on hand" v={fmtMoney(F.cash)} strong />
            <Row k="Inventory (cash tied up)" v={fmtMoney(F.inventoryValue)} />
            <Row k="Receivables (owed to you)" v={fmtMoney(F.receivables)} />
            <Row k="Debt" v={fmtMoney(F.debt)} />
            {companyIPPortfolioValue(world) > 0 && <Row k="Owned IP value (est.)" v={fmtMoney(companyIPPortfolioValue(world))} />}
            <Row k="Estimated company value" v={fmtMoney(estimatedCompanyValue(world))} strong />
            <Row k="Cash conversion cycle" v={`${Math.round(F.cashCycleDays)} days`} />
            <Row k="Operating cash flow / Q" v={fmtMoney(F.operatingCashFlow)} strong />
            <div style={{ marginTop: 10, color: C.faint, fontSize: 11, lineHeight: 1.5 }}>
              Profit and cash differ by {fmtMoney(profitCashGap)}/Q. Inventory and slow channel payments lock up cash even when you're profitable.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => borrow(1_000_000)} style={{ background: C.panel2, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>+ Draw $1M credit</button>
              <button onClick={() => repay(1_000_000)} style={{ background: C.panel2, color: C.dim, border: `1px solid ${C.line}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Repay $1M</button>
            </div>
            <div style={{ color: C.faint, fontSize: 10, marginTop: 4 }}>Credit line costs 10%/yr interest.</div>
          </Panel>
        )}
      </div>

      {/* Tier 2+: Contribution by Cell */}
      {tier >= 2 && (
        <Panel title="Contribution by Customer Cell — not all customers are equally valuable">
          <CellContributionTable cells={live.cellFinance} brandColor={C.violet} />
        </Panel>
      )}

      {tier < 2 && (
        <Panel>
          <div style={{ color: C.faint, fontSize: 12 }}>
            {tier === 0 ? "Hire and seat a Finance employee to unlock the formal income statement. Grow that team further to unlock working capital and customer-level contribution." : "Grow your staffed Finance office to unlock cash flow, working capital, and customer-level contribution detail."}
          </div>
        </Panel>
      )}
    </div>
  );
}

function MoneyDriver({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "good" | "bad" | "warn" | "normal" }) {
  const color = tone === "good" ? C.green : tone === "bad" ? C.red : tone === "warn" ? C.amber : C.ink;
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: 10 }}><div style={{ color: C.faint, fontSize: 9, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><div style={{ color, fontFamily: "ui-monospace", fontWeight: 800, fontSize: 15, marginTop: 2 }}>{value}</div><div style={{ color: C.faint, fontSize: 9.5, marginTop: 4, lineHeight: 1.35 }}>{detail}</div></div>;
}

function CellContributionTable({ cells, brandColor }: { cells: CellFinance[]; brandColor: string }) {
  if (!cells.length) return <div style={{ color: C.faint, fontSize: 13 }}>No sales yet — launch a product and build awareness.</div>;
  const top = [...cells].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const maxRev = Math.max(...top.map((c) => c.revenue));
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr style={{ color: C.dim, textAlign: "right" }}>
        <th style={{ textAlign: "left", padding: "4px" }}>Cell</th><th>Revenue</th><th>Gross margin</th><th>Marketing</th><th>Contribution</th><th>Margin %</th>
      </tr></thead>
      <tbody style={{ fontFamily: "ui-monospace" }}>
        {top.map((c, i) => {
          const marginPct = c.revenue > 0 ? c.contribution / c.revenue : 0;
          return (
            <tr key={i} style={{ borderTop: `1px solid ${C.grid}`, textAlign: "right" }}>
              <td style={{ textAlign: "left", color: C.ink, padding: "6px 4px" }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: brandColor, opacity: c.revenue / maxRev, marginRight: 6 }} />
                {c.coord.age} {c.coord.gender.slice(0, 1)} {c.coord.class} {c.coord.leaning.slice(0, 4)}
              </td>
              <td style={{ color: C.ink }}>{fmtMoney(c.revenue)}</td>
              <td style={{ color: C.dim }}>{fmtMoney(c.grossMargin)}</td>
              <td style={{ color: C.dim }}>{fmtMoney(c.marketingAllocated)}</td>
              <td style={{ color: c.contribution >= 0 ? C.green : C.red }}>{fmtMoney(c.contribution)}</td>
              <td style={{ color: marginPct >= 0.2 ? C.green : marginPct >= 0 ? C.amber : C.red }}>{fmtPct(marginPct)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
