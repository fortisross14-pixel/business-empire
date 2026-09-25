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
  const [notice, setNotice] = useState("");
  const act = (result: Result) => setNotice(result.reason);
  const investor = world.capital.relationships[0];
  return <div>
    <section style={{ borderRadius: 14, padding: 18, color: "white", background: "linear-gradient(135deg,#102f50,#154e78 62%,#1b7ca3)", boxShadow: "0 14px 30px rgba(10,40,70,.18)" }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "#80d9ff" }}>CAPITAL DESK</div>
      <h2 style={{ margin: "5px 0 5px", fontSize: 23 }}>Fund the plan. Understand the trade-off.</h2>
      <div style={{ color: "#c8e2f1", fontSize: 12 }}>Debt preserves ownership but adds fixed pressure. Equity buys runway but permanently shares the upside.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 16 }}>
        {[
          ["Cash", fmtMoney(world.player.cash)], ["Debt", fmtMoney(world.player.debt)], ["Company value", fmtMoney(metrics.companyValue)],
          ["Founder ownership", fmtPct(metrics.founderOwnership)], ["Runway", metrics.runwayDays == null ? "Cash-generative" : `${metrics.runwayDays} days`], ["Annual interest", fmtMoney(metrics.annualInterest)],
        ].map(([label, value]) => <div key={label} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 10, padding: 10 }}><small style={{ color: "#9dc9df" }}>{label}</small><div style={{ fontWeight: 900, fontSize: 16, marginTop: 3 }}>{value}</div></div>)}
      </div>
    </section>

    {notice && <div style={{ marginTop: 10, borderRadius: 9, padding: 9, background: "#eef8ff", border: "1px solid #b9def4", color: C.cyan, fontSize: 11.5 }}>{notice}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
      <CapitalCard icon="🏦" title="Credit line" detail={`${fmtMoney(metrics.creditAvailable)} available · 10% annual interest`} copy="Fast, flexible working capital. It is still debt, so interest rises immediately.">
        <button style={ctrlBtn} disabled={metrics.creditAvailable <= 0} onClick={() => borrow(Math.min(500_000, metrics.creditAvailable))}>Draw {fmtMoney(Math.min(500_000, metrics.creditAvailable))}</button>
        <button style={ctrlBtn} disabled={world.player.debt <= 0 || world.player.cash <= 0} onClick={() => repay(500_000)}>Repay up to $500k</button>
      </CapitalCard>
      <CapitalCard icon="📄" title="Growth loan" detail="$1.0M · no dilution" copy="A larger lender request for a defined growth plan. Approval depends on value and confidence.">
        <button style={ctrlBtn} onClick={() => act(requestGrowthLoan(1_000_000))}>Request $1M loan</button>
        <button style={ctrlBtn} onClick={() => act(requestGrowthLoan(2_500_000))}>Request $2.5M loan</button>
      </CapitalCard>
      <CapitalCard icon="🤝" title="Investor network" detail={`${world.capital.relationships.length} active relationship${world.capital.relationships.length === 1 ? "" : "s"}`} copy="Make one useful connection, then decide whether outside ownership is worth the runway.">
        {!investor ? <>
          {(["venture", "family_office", "strategic"] as InvestorType[]).map((type) => <button key={type} style={ctrlBtn} onClick={() => act(connectInvestor(type))}>Connect: {type.replace("_", " ")}</button>)}
        </> : <>
          <div style={{ width: "100%", fontSize: 11, color: C.dim }}><b style={{ color: C.ink }}>{investor.name}</b><br />Relationship {Math.round(investor.relationship * 100)}%</div>
          <button style={ctrlBtn} onClick={() => act(raiseCapital(investor.id, 1_500_000))}>Raise $1.5M equity</button>
          <button style={ctrlBtn} onClick={() => act(raiseCapital(investor.id, 3_000_000))}>Raise $3M equity</button>
        </>}
      </CapitalCard>
    </div>

    {world.capital.rounds.length > 0 && <section style={{ marginTop: 14, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}><b>Financing history</b><div style={{ display: "grid", gap: 7, marginTop: 9 }}>{[...world.capital.rounds].reverse().map((round) => <div key={round.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 9, borderRadius: 8, background: C.panel2, fontSize: 11 }}><span><b>{round.kind === "equity" ? "Equity round" : "Growth loan"}</b> · {round.counterparty}</span><span>{fmtMoney(round.amount)}{round.dilutionPct ? ` · ${fmtPct(round.dilutionPct)} dilution` : ""}</span></div>)}</div></section>}
  </div>;
}

function CapitalCard({ icon, title, detail, copy, children }: React.PropsWithChildren<{ icon: string; title: string; detail: string; copy: string }>) {
  return <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, boxShadow: "0 5px 14px rgba(20,45,70,.05)" }}><div style={{ fontSize: 24 }}>{icon}</div><h3 style={{ margin: "4px 0 2px" }}>{title}</h3><div style={{ color: C.green, fontSize: 11, fontWeight: 800 }}>{detail}</div><p style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, minHeight: 48 }}>{copy}</p><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{children}</div></section>;
}
