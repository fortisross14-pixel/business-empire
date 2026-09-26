import React from "react";
import { C, ctrlBtn, fmtMoney, fmtNum, fmtPct } from "../theme";
import { Panel, LineChart, Row } from "../components";
import type { World, CellFinance, DeptTier } from "../../engine/types";
import { companyIPPortfolioValue, estimatedCompanyValue } from "../../engine/ip";

export function FinancialsView({ world, hist, borrow, repay }:
  { world: World; hist: World["history"]; borrow: (a: number) => void; repay: (a: number) => void }) {
  const tier = world.player.financeDept;
  const live = world.live;
  const [view, setView] = React.useState<"overview" | "statements" | "customers">("overview");

  if (!live) return <div className="finance-center"><div className="finance-empty" style={{ position: "relative", overflow: "hidden", minHeight: 310, display: "flex", alignItems: "center", padding: 30, borderRadius: 18, color: "#fff", background: "linear-gradient(90deg,#071f37,#0b527f)" }}><img src="/assets/ui/backgrounds/market-command.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .22 }}/><div style={{ position: "relative", zIndex: 1, maxWidth: 610 }}><span style={{ fontSize: 12, color: "#8cddff", fontWeight: 900, letterSpacing: 1.2 }}>FINANCE OFFICE</span><h2 style={{ fontSize: 27, margin: "5px 0" }}>Your first operating period is waiting.</h2><p style={{ fontSize: 14, lineHeight: 1.55, color: "#d9edf6" }}>Cash on hand: <b>{fmtMoney(world.player.cash)}</b>. Run the simulation to generate revenue, margin and cash-flow evidence.</p></div></div></div>;
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
    <div className="finance-center">
      <section className="finance-hero"><div><span>EXECUTIVE FINANCE</span><h2>{I.profit >= 0 ? "The company is creating value." : "The company needs a financial decision."}</h2><p>{diagnosis}</p></div><div className="finance-hero-score"><small>NET PROFIT / Q</small><b style={{color:I.profit>=0?"#74efb5":"#ff9da5"}}>{fmtMoney(I.profit)}</b><em>{F.operatingCashFlow >= 0 ? "Positive cash generation" : "Cash is being consumed"}</em></div></section>
      <nav className="finance-tabs" aria-label="Finance sections">{([['overview','Executive overview'],['statements','Statements & products'],['customers','Customer economics']] as const).map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}>{id==='overview'?'▥':id==='statements'?'▤':'◎'} {label}</button>)}</nav>
      <div style={{display:view === "overview" ? "block" : "none"}}>
      <Panel title="Company Money — what is happening?">
        {tier === 0 && <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, background: "#fff8e8", border: "1px solid #f3d58a", color: "#7a5707", fontSize: 12.5, lineHeight: 1.45 }}>Founder view: cash, sales and product profitability are always visible. Seat Finance staff to unlock the full income statement, working capital and customer contribution detail.</div>}
        <div style={{ color: I.profit >= 0 ? C.dim : C.ink, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{diagnosis}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8 }}>
          <MoneyDriver label="Product contribution" value={fmtMoney(I.contribution)} detail={`${(grossMarginPct * 100).toFixed(0)}% of net revenue`} tone={I.contribution >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Operating spend" value={fmtMoney(operatingSpend)} detail="Marketing + people + facilities + departments" tone={operatingSpend > Math.max(1, I.contribution) ? "warn" : "normal"} />
          <MoneyDriver label="Net profit" value={fmtMoney(I.profit)} detail="After overhead and interest" tone={I.profit >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Operating cash flow" value={fmtMoney(F.operatingCashFlow)} detail={cashGap < 0 ? `${fmtMoney(Math.abs(cashGap))} below profit` : `${fmtMoney(cashGap)} above profit`} tone={F.operatingCashFlow >= 0 ? "good" : "bad"} />
          <MoneyDriver label="Cash on hand" value={fmtMoney(world.player.cash)} detail={I.profit < 0 ? `~${Math.max(0, world.player.cash / Math.max(1, -I.profit / 90)).toFixed(0)} days at current loss rate` : "Current bank balance"} tone={world.player.cash < 0 ? "bad" : world.player.cash < 250_000 ? "warn" : "normal"} />
        </div>
      </Panel>
      </div>

      {/* Tier 1+: Sales by SKU */}
      <div style={{display:view === "statements" ? "block" : "none"}}>
      <Panel title="Sales by SKU">
        {world.player.skus.every((s) => s.archived) ? <div style={{ color: C.faint }}>No current products. Archived commercial history remains available in the product archive and company records.</div> :
          <table className="finance-table finance-sku-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ color: C.dim, textAlign: "right" }}><th style={{ textAlign: "left", padding: "6px 4px" }}>SKU</th><th>List</th><th>Cost</th><th>Inventory</th><th>Units/day</th><th>Units/Q</th><th>Net Rev</th><th>Contribution</th></tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {world.player.skus.map((s, i) => ({s,i})).filter(({s}) => !s.archived).map(({s,i}) => {
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
      </div>

      {/* Tier 3+: Charts */}
      {view === "overview" && tier >= 3 && (
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

      <div style={{ display: view === "statements" ? "flex" : "none", gap: 16, flexWrap: "wrap" }}>
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button onClick={() => borrow(1_000_000)} style={ctrlBtn}>+ Draw $1M credit</button>
              <button onClick={() => repay(1_000_000)} style={ctrlBtn}>Repay $1M</button>
            </div>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>Credit line costs 10%/yr interest.</div>
          </Panel>
        )}
      </div>

      {/* Tier 2+: Contribution by Cell */}
      {view === "customers" && tier >= 2 && (
        <Panel title="Contribution by Customer Cell — not all customers are equally valuable">
          <CellContributionTable cells={live.cellFinance} brandColor={C.violet} />
        </Panel>
      )}

      {view === "customers" && tier < 2 && (
        <Panel>
          <div style={{ color: C.faint, fontSize: 12 }}>
            {tier === 0 ? "Hire and seat a Finance employee to unlock the formal income statement. Grow that team further to unlock working capital and customer-level contribution." : "Grow your staffed Finance office to unlock cash flow, working capital, and customer-level contribution detail."}
          </div>
        </Panel>
      )}
      <style>{`
        .finance-center{display:grid;gap:0}.finance-hero{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:20px;align-items:center;padding:22px;border-radius:18px;color:#fff;background:radial-gradient(circle at 90% 15%,rgba(78,202,255,.22),transparent 30%),linear-gradient(125deg,#082744,#124f76 62%,#177e9e);box-shadow:0 16px 36px rgba(8,39,67,.2);margin-bottom:12px}.finance-hero>div:first-child>span{font-size:12px;font-weight:950;letter-spacing:1.2px;color:#83dcff}.finance-hero h2{font-size:25px;line-height:1.15;margin:5px 0 7px}.finance-hero p{font-size:13px;line-height:1.55;color:#d5ecf5;margin:0;max-width:700px}.finance-hero-score{padding:14px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(5px)}.finance-hero-score small,.finance-hero-score b,.finance-hero-score em{display:block}.finance-hero-score small{font-size:11px;color:#b9dce9;font-weight:850}.finance-hero-score b{font-size:24px;margin-top:4px}.finance-hero-score em{font-style:normal;font-size:11px;color:#d6eaf3;margin-top:3px}.finance-tabs{display:flex;gap:7px;padding:5px;margin-bottom:14px;border-radius:13px;background:#dfeaf1;border:1px solid #ccdbe5;overflow-x:auto}.finance-tabs button{flex:1 1 170px;min-width:160px;min-height:44px;padding:9px 12px;border:0;border-radius:9px;background:transparent;color:${C.dim};font-size:13px;font-weight:850;cursor:pointer;transition:transform .14s,background .14s,box-shadow .14s}.finance-tabs button:hover{background:rgba(255,255,255,.65)}.finance-tabs button:active{transform:scale(.98)}.finance-tabs button:focus-visible{outline:3px solid #7dd3fc;outline-offset:1px}.finance-tabs button.active{background:#fff;color:${C.cyan};box-shadow:0 4px 12px rgba(17,58,88,.1)}.finance-empty{position:relative;overflow:hidden;min-height:310px;display:flex;align-items:center;padding:30px;border-radius:18px;color:#fff;background:#0c3558}.finance-empty>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.27}.finance-empty:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,31,55,.97),rgba(8,54,86,.72))}.finance-empty>div{position:relative;z-index:1;max-width:610px}.finance-empty span{font-size:12px;color:#8cddff;font-weight:900;letter-spacing:1.2px}.finance-empty h2{font-size:27px;margin:5px 0}.finance-empty p{font-size:14px;line-height:1.55;color:#d9edf6}.finance-table tr{transition:background .12s}.finance-table tbody tr:hover{background:#f2f8fc!important}@media(max-width:640px){.finance-hero{grid-template-columns:1fr;padding:17px 15px;gap:11px}.finance-hero h2{font-size:21px}.finance-hero-score{display:grid;grid-template-columns:1fr auto;align-items:center}.finance-hero-score b{grid-row:1/3;grid-column:2;font-size:20px}.finance-tabs button{min-width:145px}.finance-table,.finance-table tbody,.finance-table tr,.finance-table td{display:block!important;width:100%!important;box-sizing:border-box}.finance-table thead{display:none}.finance-table tr{margin-bottom:10px;padding:9px 11px!important;border:1px solid ${C.line}!important;border-radius:11px;background:#f7fafc;text-align:left!important}.finance-table td{display:flex!important;justify-content:space-between;gap:10px;padding:6px 0!important;border-bottom:1px solid ${C.grid};text-align:right!important;white-space:normal}.finance-table td:last-child{border-bottom:0}.finance-sku-table td:nth-child(1):before{content:'Product'}.finance-sku-table td:nth-child(2):before{content:'List price'}.finance-sku-table td:nth-child(3):before{content:'Unit cost'}.finance-sku-table td:nth-child(4):before{content:'Inventory'}.finance-sku-table td:nth-child(5):before{content:'Units / day'}.finance-sku-table td:nth-child(6):before{content:'Units / Q'}.finance-sku-table td:nth-child(7):before{content:'Net revenue'}.finance-sku-table td:nth-child(8):before{content:'Contribution'}.finance-cell-table td:nth-child(1):before{content:'Customer cell'}.finance-cell-table td:nth-child(2):before{content:'Revenue'}.finance-cell-table td:nth-child(3):before{content:'Gross margin'}.finance-cell-table td:nth-child(4):before{content:'Marketing'}.finance-cell-table td:nth-child(5):before{content:'Contribution'}.finance-cell-table td:nth-child(6):before{content:'Margin %'}.finance-table td:before{color:${C.dim};font-family:system-ui,sans-serif;font-weight:800;font-size:12px}}
      `}</style>
    </div>
  );
}

function MoneyDriver({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "good" | "bad" | "warn" | "normal" }) {
  const color = tone === "good" ? C.green : tone === "bad" ? C.red : tone === "warn" ? C.amber : C.ink;
  return <div style={{ background: "linear-gradient(180deg,#fff,#f4f8fb)", border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, boxShadow: "0 5px 13px rgba(17,54,84,.05)" }}><div style={{ color: C.dim, fontSize: 12, fontWeight: 850, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><div style={{ color, fontFamily: "ui-monospace", fontWeight: 900, fontSize: 18, marginTop: 3 }}>{value}</div><div style={{ color: C.dim, fontSize: 12, marginTop: 5, lineHeight: 1.4 }}>{detail}</div></div>;
}

function CellContributionTable({ cells, brandColor }: { cells: CellFinance[]; brandColor: string }) {
  if (!cells.length) return <div style={{ color: C.faint, fontSize: 13 }}>No sales yet — launch a product and build awareness.</div>;
  const top = [...cells].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const maxRev = Math.max(...top.map((c) => c.revenue));
  return (
    <table className="finance-table finance-cell-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
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
