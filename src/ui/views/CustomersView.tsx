import React from "react";
import { C, fmtNum, fmtPct } from "../theme";
import { customerTotals, getCustomers, cellLTV } from "../../engine/customers";
import { TICKS_PER_QUARTER } from "../../engine/types";
import type { World } from "../../engine/types";

export function CustomersView({ world }: { world: World }) {
  if (world.player.intelDept < 1) return <section className="customer-locked"><style>{customerCss}</style><div className="customer-locked-icon">🔭</div><div><small>CUSTOMER INTELLIGENCE</small><h2>Build the team that knows your audience</h2><p>Hire Strategy / Intelligence staff and seat them in a Campus office. They will turn anonymous buyers into a customer base you can understand and protect.</p></div></section>;

  const totals = customerTotals(world);
  const hasBase = totals.total > 0;
  const rows = world.savedSegments.map((segment) => {
    const indexes: number[] = [];
    world.cube.forEach((cell, index) => {
      const matches = Object.entries(segment.filter).every(([axis, values]) => !values || values.length === 0 || values.includes((cell.coord as any)[axis]));
      if (matches) indexes.push(index);
    });
    let count = 0, satisfactionWeight = 0, population = 0, ltvWeight = 0;
    for (const index of indexes) {
      const customers = getCustomers(world, index);
      count += customers.count;
      satisfactionWeight += customers.satisfaction * customers.count;
      population += world.cube[index].head;
      ltvWeight += cellLTV(world, index, world.cube[index].spend) * customers.count;
    }
    const satisfaction = count > 0 ? satisfactionWeight / count : 0;
    const churn = count > 0 ? Math.min(0.97, Math.max(0.01, (0.02 + (0.7 - satisfaction) * 0.28)) * TICKS_PER_QUARTER * 4) : 0;
    return { name: segment.name, count, satisfaction, penetration: population > 0 ? count / population : 0, ltv: count > 0 ? ltvWeight / count : 0, churn };
  }).sort((a, b) => b.count - a.count);
  const satTone = (value: number) => value > 0.62 ? C.green : value > 0.48 ? C.amber : C.red;
  const best = rows.find((row) => row.count > 0);

  return <div className="customer-command">
    <style>{customerCss}</style>
    <section className="customer-hero"><div className="customer-hero-copy"><small>CUSTOMER COMMAND</small><h1>Know who buys. Earn the next purchase.</h1><p>Customers are an asset you build, retain and can lose. Satisfaction drives repeat purchases and word of mouth; neglect and stronger rivals create churn.</p></div><div className="customer-hero-signal"><span>LOYALTY SIGNAL</span><b style={{ color: hasBase ? satTone(totals.avgSatisfaction) : "#9fc4db" }}>{hasBase ? fmtPct(totals.avgSatisfaction) : "No signal"}</b><small>{hasBase ? "Average satisfaction across the customer base" : "Launch a product to start acquiring customers"}</small></div></section>
    <section className="customer-kpis" aria-label="Customer summary">
      <CustomerKpi icon="👥" label="Total customers" value={hasBase ? fmtNum(totals.total) : "—"} note={best ? `${best.name} is your largest tracked segment` : "Build awareness to acquire your first customers"} tone="#1d9ed0" />
      <CustomerKpi icon="💙" label="Satisfaction" value={hasBase ? fmtPct(totals.avgSatisfaction) : "—"} note="High satisfaction improves retention and referrals" tone={hasBase ? satTone(totals.avgSatisfaction) : "#7b91a2"} />
      <CustomerKpi icon="🎯" label="Active market cells" value={hasBase ? fmtNum(totals.activeCells) : "—"} note="Distinct audiences currently buying from you" tone="#7458df" />
    </section>
    <section className="customer-panel"><header><div><small>SEGMENT HEALTH</small><h2>Where loyalty is growing—or leaking</h2></div><span>{rows.length} saved segment{rows.length === 1 ? "" : "s"}</span></header>
      {!hasBase ? <div className="customer-empty"><span>🛍️</span><b>Your customer story begins at launch</b><p>Release a product, build awareness and return here to see who bought, who stayed and where value is accumulating.</p></div> : <div className="customer-segment-grid">{rows.map((row) => {
        const tone = satTone(row.satisfaction);
        return <article key={row.name} className="customer-segment-card" style={{ "--customer-tone": tone } as React.CSSProperties}><div className="customer-card-head"><div><small>MARKET SEGMENT</small><h3>{row.name}</h3></div><span>{row.count > 0 ? `${fmtPct(row.satisfaction)} happy` : "Unserved"}</span></div><div className="customer-count"><b>{row.count > 0 ? fmtNum(row.count) : "—"}</b><span>customers</span></div><div className="customer-bar" aria-label={`${row.name} satisfaction ${fmtPct(row.satisfaction)}`}><i style={{ width: `${Math.max(0, Math.min(100, row.satisfaction * 100))}%` }} /></div><dl><div><dt>Penetration</dt><dd>{row.count > 0 ? fmtPct(row.penetration) : "—"}</dd></div><div><dt>Annual churn</dt><dd className={row.churn > .3 ? "risk" : ""}>{row.count > 0 ? fmtPct(row.churn) : "—"}</dd></div><div><dt>Lifetime value</dt><dd className="good">{row.count > 0 ? `$${row.ltv.toFixed(0)}` : "—"}</dd></div></dl></article>;
      })}</div>}
      <footer><b>How to read this:</b> LTV estimates annual spend × repeat rate ÷ churn. Protect high-value, high-satisfaction segments; diagnose weak ones through product studies, channel fit and rival pressure.</footer>
    </section>
  </div>;
}

function CustomerKpi({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: string }) {
  return <article style={{ "--customer-tone": tone } as React.CSSProperties}><span className="customer-kpi-icon">{icon}</span><div><small>{label}</small><b>{value}</b><p>{note}</p></div></article>;
}

const customerCss = `
.customer-command{color:#173550}.customer-hero{min-height:190px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.55fr);align-items:center;gap:24px;padding:26px clamp(20px,3.2vw,38px);border-radius:20px;color:white;background:linear-gradient(100deg,rgba(4,27,54,.97),rgba(10,66,105,.88) 58%,rgba(91,54,176,.72)),url('/assets/ui/backgrounds/market-command.png') center/cover;box-shadow:0 16px 34px rgba(8,45,78,.25);overflow:hidden}.customer-hero-copy>small,.customer-panel header small,.customer-locked small{color:#79d6ff;font-size:12px;font-weight:950;letter-spacing:1px}.customer-hero h1{margin:6px 0 7px;font-size:clamp(26px,3.2vw,39px);line-height:1.05}.customer-hero p{max-width:720px;margin:0;color:#d5e8f4;font-size:14px;line-height:1.55}.customer-hero-signal{padding:18px;border:1px solid rgba(182,223,248,.24);border-radius:15px;background:rgba(3,24,45,.58);box-shadow:inset 4px 0 0 #6a62e7}.customer-hero-signal>span{display:block;color:#98bdd4;font-size:12px;font-weight:900;letter-spacing:.7px}.customer-hero-signal>b{display:block;margin-top:5px;font-size:30px}.customer-hero-signal>small{display:block;margin-top:4px;color:#c7dce8;font-size:12px;line-height:1.4}.customer-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0}.customer-kpis>article{display:grid;grid-template-columns:54px minmax(0,1fr);gap:12px;align-items:center;padding:16px;border:1px solid #d6e2e9;border-radius:15px;background:linear-gradient(145deg,#fff,#f6fafc);box-shadow:inset 4px 0 0 var(--customer-tone),0 8px 20px rgba(18,52,80,.07)}.customer-kpi-icon{width:50px;height:50px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--customer-tone) 13%,white);font-size:27px}.customer-kpis small{color:#70889a;font-size:12px;font-weight:850}.customer-kpis b{display:block;margin-top:2px;color:var(--customer-tone);font-size:25px}.customer-kpis p{margin:3px 0 0;color:#718798;font-size:12px;line-height:1.35}.customer-panel{padding:19px;border:1px solid #d7e2e9;border-radius:17px;background:#fff;box-shadow:0 9px 22px rgba(18,52,80,.08)}.customer-panel>header{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:14px}.customer-panel header small{color:#1b8fbe}.customer-panel h2{margin:4px 0 0;font-size:21px}.customer-panel>header>span{color:#72899b;font-size:12px;font-weight:800}.customer-segment-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:11px}.customer-segment-card{padding:15px;border:1px solid #dce6eb;border-radius:14px;background:linear-gradient(155deg,#fff,#f6fafc);box-shadow:inset 0 4px 0 var(--customer-tone);min-width:0}.customer-card-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.customer-card-head small{color:#8294a2;font-size:11px;font-weight:900;letter-spacing:.55px}.customer-card-head h3{margin:3px 0 0;font-size:17px}.customer-card-head>span{padding:5px 8px;border-radius:99px;background:color-mix(in srgb,var(--customer-tone) 12%,white);color:var(--customer-tone);font-size:11px;font-weight:900;white-space:nowrap}.customer-count{display:flex;align-items:baseline;gap:7px;margin-top:14px}.customer-count b{font-size:25px;color:#173550}.customer-count span{color:#758a99;font-size:12px}.customer-bar{height:9px;margin-top:8px;border-radius:99px;background:#e6edf1;overflow:hidden}.customer-bar i{display:block;height:100%;border-radius:inherit;background:var(--customer-tone);transition:width .25s}.customer-segment-card dl{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0 0}.customer-segment-card dl>div{padding:8px;border-radius:9px;background:#edf3f6;min-width:0}.customer-segment-card dt{color:#718797;font-size:11px}.customer-segment-card dd{margin:3px 0 0;font-size:13px;font-weight:900;white-space:nowrap}.customer-segment-card dd.good{color:#15885f}.customer-segment-card dd.risk{color:#d25360}.customer-panel>footer{margin-top:14px;padding:12px;border-radius:10px;background:#eef5f8;color:#607a8d;font-size:12px;line-height:1.5}.customer-panel>footer b{color:#21445f}.customer-empty{min-height:220px;display:grid;place-items:center;align-content:center;text-align:center;padding:20px;border:1px dashed #bfcfd9;border-radius:13px;background:#f5f9fb}.customer-empty>span{font-size:42px}.customer-empty>b{margin-top:8px;font-size:17px}.customer-empty p{max-width:500px;margin:6px 0 0;color:#6d8393;font-size:13px;line-height:1.5}.customer-locked{display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:18px;min-height:170px;padding:25px;border-radius:18px;color:white;background:linear-gradient(135deg,#0a2947,#154f76 65%,#6848c9);box-shadow:0 14px 30px rgba(8,45,78,.24)}.customer-locked-icon{width:78px;height:78px;display:grid;place-items:center;border-radius:20px;background:rgba(255,255,255,.12);font-size:40px}.customer-locked h2{margin:5px 0;font-size:24px}.customer-locked p{max-width:680px;margin:0;color:#d0e3ee;font-size:13px;line-height:1.55}
@media(max-width:760px){.customer-hero{grid-template-columns:1fr}.customer-kpis{grid-template-columns:1fr}.customer-hero-signal{display:grid;grid-template-columns:1fr auto;gap:2px 12px;align-items:center}.customer-hero-signal>b{grid-row:1/3;grid-column:2}.customer-hero-signal>small{grid-column:1}.customer-segment-grid{grid-template-columns:1fr}}
@media(max-width:480px){.customer-hero{padding:20px 16px;border-radius:15px}.customer-hero h1{font-size:27px}.customer-hero p{font-size:13px}.customer-kpis>article{padding:13px}.customer-panel{padding:14px}.customer-panel>header{align-items:start;flex-direction:column}.customer-segment-card dl{grid-template-columns:1fr}.customer-segment-card dl>div{display:flex;justify-content:space-between;align-items:center}.customer-card-head{flex-direction:column}.customer-locked{grid-template-columns:1fr}.customer-locked-icon{width:62px;height:62px}.customer-command button,.customer-command select{min-height:44px}}
`;
