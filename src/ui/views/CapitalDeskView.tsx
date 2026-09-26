import React, { useState } from "react";
import type { InvestorType, World } from "../../engine/types";
import { capitalMetrics } from "../../engine/capital";
import { C, ctrlBtn, fmtMoney, fmtPct } from "../theme";

type Result = { ok: boolean; reason: string };

export function CapitalDeskView({ world, borrow, repay, connectInvestor, requestGrowthLoan, raiseCapital }: {
  world: World;
  borrow: (amount: number) => void;
  repay: (amount: number) => void;
  connectInvestor: (type: InvestorType) => Result;
  requestGrowthLoan: (amount: number) => Result;
  raiseCapital: (investorId: string, amount: number) => Result;
}) {
  const metrics = capitalMetrics(world);
  const [notice, setNotice] = useState<Result | null>(null);
  const act = (result: Result) => setNotice(result);
  const investor = world.capital.relationships[0];
  const ownershipDegrees = Math.max(0, Math.min(360, metrics.founderOwnership * 360));
  return <div className="capital-desk">
    <section className="capital-hero">
      <div className="capital-hero-copy"><div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: "#80d9ff" }}>CAPITAL DESK</div>
      <h2 style={{ margin: "5px 0 5px", fontSize: 23 }}>Fund the plan. Understand the trade-off.</h2>
      <div style={{ color: "#c8e2f1", fontSize: 13, lineHeight: 1.55 }}>Debt preserves ownership but adds fixed pressure. Equity buys runway but permanently shares the upside.</div></div>
      <div className="capital-ownership" style={{ background: `conic-gradient(#68d9ff 0deg ${ownershipDegrees}deg,rgba(255,255,255,.14) ${ownershipDegrees}deg 360deg)` }}><div><b>{fmtPct(metrics.founderOwnership)}</b><small>Founder owned</small></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 16 }}>
        {[
          ["Cash", fmtMoney(world.player.cash)], ["Debt", fmtMoney(world.player.debt)], ["Company value", fmtMoney(metrics.companyValue)],
          ["Founder ownership", fmtPct(metrics.founderOwnership)], ["Runway", metrics.runwayDays == null ? "Cash-generative" : `${metrics.runwayDays} days`], ["Annual interest", fmtMoney(metrics.annualInterest)],
        ].map(([label, value]) => <div key={label} className="capital-kpi"><small>{label}</small><div>{value}</div></div>)}
      </div>
    </section>

    {notice && <div className={`capital-notice ${notice.ok ? "success" : "error"}`} role="status"><span>{notice.ok ? "✓" : "!"}</span>{notice.reason}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
      <CapitalCard icon="🏦" tone="#1888c4" title="Credit line" detail={`${fmtMoney(metrics.creditAvailable)} available · 10% annual interest`} copy="Fast, flexible working capital. It is still debt, so interest rises immediately.">
        <button style={ctrlBtn} disabled={metrics.creditAvailable <= 0} onClick={() => borrow(Math.min(500_000, metrics.creditAvailable))}>Draw {fmtMoney(Math.min(500_000, metrics.creditAvailable))}</button>
        <button style={ctrlBtn} disabled={world.player.debt <= 0 || world.player.cash <= 0} onClick={() => repay(500_000)}>Repay up to $500k</button>
      </CapitalCard>
      <CapitalCard icon="📄" tone="#7a62dc" title="Growth loan" detail="$1.0M · no dilution" copy="A larger lender request for a defined growth plan. Approval depends on value and confidence.">
        <button style={ctrlBtn} onClick={() => act(requestGrowthLoan(1_000_000))}>Request $1M loan</button>
        <button style={ctrlBtn} onClick={() => act(requestGrowthLoan(2_500_000))}>Request $2.5M loan</button>
      </CapitalCard>
      <CapitalCard icon="🤝" tone="#14a779" title="Investor network" detail={`${world.capital.relationships.length} active relationship${world.capital.relationships.length === 1 ? "" : "s"}`} copy="Make one useful connection, then decide whether outside ownership is worth the runway.">
        {!investor ? <>
          {(["venture", "family_office", "strategic"] as InvestorType[]).map((type) => <button key={type} style={ctrlBtn} onClick={() => act(connectInvestor(type))}>Connect: {type.replace("_", " ")}</button>)}
        </> : <>
          <div className="investor-relationship"><span>◎</span><div><b>{investor.name}</b><small>Relationship {Math.round(investor.relationship * 100)}%</small></div></div>
          <button style={ctrlBtn} onClick={() => act(raiseCapital(investor.id, 1_500_000))}>Raise $1.5M equity</button>
          <button style={ctrlBtn} onClick={() => act(raiseCapital(investor.id, 3_000_000))}>Raise $3M equity</button>
        </>}
      </CapitalCard>
    </div>

    {world.capital.rounds.length > 0 && <section className="capital-history"><b>Financing history</b><div>{[...world.capital.rounds].reverse().map((round) => <div key={round.id}><span><i>{round.kind === "equity" ? "◆" : "▰"}</i><b>{round.kind === "equity" ? "Equity round" : "Growth loan"}</b><small>{round.counterparty}</small></span><strong>{fmtMoney(round.amount)}<small>{round.dilutionPct ? `${fmtPct(round.dilutionPct)} dilution` : "No dilution"}</small></strong></div>)}</div></section>}
    {world.capital.rounds.length === 0 && <section className="capital-empty"><div>◇</div><b>No financing history</b><span>Your first debt or equity decision will be recorded here as part of the company story.</span></section>}
    <style>{`
      .capital-hero{position:relative;overflow:hidden;border-radius:18px;padding:22px;color:white;background:radial-gradient(circle at 82% 10%,rgba(79,201,255,.28),transparent 28%),linear-gradient(135deg,#092a4a,#15527b 62%,#1c82aa);box-shadow:0 16px 36px rgba(10,40,70,.21)}.capital-hero-copy{padding-right:150px}.capital-ownership{position:absolute;right:28px;top:24px;width:112px;height:112px;border-radius:50%;display:grid;place-items:center;box-shadow:0 12px 24px rgba(0,0,0,.2)}.capital-ownership:after{content:'';position:absolute;inset:11px;border-radius:50%;background:#123e62}.capital-ownership>div{position:relative;z-index:1;text-align:center}.capital-ownership b{display:block;font-size:20px}.capital-ownership small{display:block;font-size:10px;color:#abd7e9}.capital-kpi{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:10px;backdrop-filter:blur(4px)}.capital-kpi small{color:#b6d8e8;font-size:11px;font-weight:750}.capital-kpi div{font-weight:900;font-size:16px;margin-top:3px}.capital-notice{display:flex;gap:9px;align-items:center;margin-top:11px;border-radius:11px;padding:11px 12px;background:#eef9ff;border:1px solid #b9def4;color:${C.cyan};font-size:13px;font-weight:700}.capital-notice.error{background:#fff4f4;border-color:#fecaca;color:${C.red}}.capital-notice span{display:grid;place-items:center;flex:0 0 27px;width:27px;height:27px;border-radius:50%;background:${C.cyan};color:#fff}.capital-notice.error span{background:${C.red}}.capital-card{position:relative;overflow:hidden;background:linear-gradient(180deg,#fff,#f6f9fc);border:1px solid ${C.line};border-radius:14px;padding:15px;box-shadow:0 7px 19px rgba(20,45,70,.07);transition:transform .16s,box-shadow .16s}.capital-card:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--capital-tone)}.capital-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(20,45,70,.12)}.capital-card-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--capital-tone) 13%,white);font-size:25px}.capital-card h3{font-size:18px}.capital-card-detail{font-size:12px;font-weight:850}.capital-card-copy{color:${C.dim};font-size:12px;line-height:1.55;min-height:55px}.capital-card-actions{display:flex;gap:7px;flex-wrap:wrap}.capital-card-actions button{flex:1 1 125px;min-height:44px}.capital-desk button:focus-visible{outline:3px solid rgba(28,130,170,.3);outline-offset:2px}.capital-desk button:not(:disabled):active{transform:scale(.98)}.investor-relationship{width:100%;display:flex;gap:9px;align-items:center;padding:9px;border-radius:10px;background:#eefaf5;border:1px solid #b8e8d5}.investor-relationship>span{font-size:23px;color:${C.green}}.investor-relationship b,.investor-relationship small{display:block}.investor-relationship small{font-size:12px;color:${C.dim};margin-top:2px}.capital-history{margin-top:14px;background:#fff;border:1px solid ${C.line};border-radius:14px;padding:15px}.capital-history>b{font-size:16px}.capital-history>div{display:grid;gap:7px;margin-top:10px}.capital-history>div>div{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px;border-radius:10px;background:${C.panel2};font-size:12px}.capital-history span{display:grid;grid-template-columns:auto 1fr;gap:2px 8px}.capital-history i{grid-row:1/3;font-style:normal;color:${C.violet};font-size:20px}.capital-history small{display:block;color:${C.dim};font-size:11px;font-weight:600}.capital-history strong{text-align:right;font-size:14px}.capital-empty{margin-top:14px;min-height:130px;display:grid;place-items:center;align-content:center;text-align:center;border:1px dashed #bdd5e5;border-radius:14px;background:#f7fbfe}.capital-empty>div{font-size:29px;color:${C.cyan}}.capital-empty b{font-size:15px}.capital-empty span{max-width:440px;margin-top:4px;color:${C.dim};font-size:12px}@media(max-width:640px){.capital-hero{padding:17px 14px}.capital-hero-copy{padding-right:0}.capital-hero h2{font-size:21px!important;padding-right:82px}.capital-ownership{width:78px;height:78px;right:13px;top:44px}.capital-ownership:after{inset:8px}.capital-ownership b{font-size:15px}.capital-ownership small{font-size:10px}.capital-hero>div:last-child{grid-template-columns:repeat(2,1fr)!important;margin-top:13px!important}.capital-history>div>div{align-items:flex-start}.capital-history strong{font-size:13px}}
    `}</style>
  </div>;
}

function CapitalCard({ icon, tone, title, detail, copy, children }: React.PropsWithChildren<{ icon: string; tone: string; title: string; detail: string; copy: string }>) {
  return <section className="capital-card" style={{ "--capital-tone": tone } as React.CSSProperties}><div className="capital-card-icon">{icon}</div><h3 style={{ margin: "7px 0 2px" }}>{title}</h3><div className="capital-card-detail" style={{ color: tone }}>{detail}</div><p className="capital-card-copy">{copy}</p><div className="capital-card-actions">{children}</div></section>;
}
