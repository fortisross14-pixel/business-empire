import React from "react";
import { C, fmtMoney, fmtPct } from "../theme";
import { Panel } from "../components";
import { CompetitorChip } from "../visualIdentity";
import { STUDY_DEFS } from "../../engine/world";
import { TICKS_PER_QUARTER } from "../../engine/types";
import type { World } from "../../engine/types";

export function IntelligenceView({ world, commission }: { world: World; commission: (t: string) => void }) {
  const consultantOnly = world.player.intelDept < 1;
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Panel title={consultantOnly ? "External Market Research" : "Commission a Study"} style={{ flex: "1 1 320px" }}>
        {consultantOnly && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>Without an Intelligence team you can still hire an external consultant for a post-launch product study. Build an Intelligence function later to unlock broader market research.</div>}
        {Object.entries(STUDY_DEFS).filter(([type]) => !consultantOnly || type === "product_diagnosis").map(([type, def]) => {
          const inflight = world.studies.find((s) => s.type === type && !s.done);
          const done = world.revealed[type];
          return (
            <div key={type} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.grid}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>{def.label}</span>
                <button onClick={() => commission(type)} disabled={!!inflight} style={{ background: inflight ? C.grid : C.cyan, color: inflight ? C.faint : "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: inflight ? "default" : "pointer" }}>{inflight ? `…${inflight.ticksLeft}t` : fmtMoney(def.cost)}</button>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>{def.blurb}</div>
              {done && <div style={{ color: C.faint, fontSize: 10, marginTop: 3 }}>last run: Q{Math.floor(done.asOfTick / TICKS_PER_QUARTER)}</div>}
            </div>
          );
        })}
      </Panel>
      <Panel title="Reports" style={{ flex: "1 1 360px" }}>
        {Object.keys(world.revealed).length === 0 && <div style={{ color: C.faint, fontSize: 13 }}>No reports yet.</div>}
        {world.revealed.market_map && <Report title="Population Map"><div style={{ fontSize: 13, color: C.dim }}>Population detail is now visible in Market. Total market: <span style={{ color: C.green }}>{fmtMoney(world.live?.totalMarket || 0)}</span>.</div></Report>}
        {world.revealed.gap_analysis && (
          <Report title="Gap Analysis — top underserved cells">
            {world.revealed.gap_analysis.gaps.map((g: any, i: number) => (
              <div key={i} style={{ fontSize: 12, padding: "3px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.ink }}>{g.coord.age} · {g.coord.class} · {g.coord.gender} · {g.coord.leaning}</span>
                <span style={{ fontFamily: "ui-monospace", color: C.amber }}>{fmtMoney(g.market)} · fit {g.bestFit.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, color: C.faint, fontSize: 11 }}>High market + low best-fit = a niche nobody serves well.</div>
          </Report>
        )}
        {world.revealed.competitor_benchmark && (
          <Report title="Competitor Benchmark">
            <div style={{ display: "grid", gap: 8 }}>
              {world.revealed.competitor_benchmark.rivals.map((r: any, i: number) => {
                const liveComp = world.comps.find((c) => c.name === r.name);
                return <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.grid}` }}>
                  <div>{liveComp ? <CompetitorChip comp={liveComp} /> : <span style={{ color: C.ink, fontWeight: 700 }}>{r.name}</span>}</div>
                  <div style={{ fontFamily: "ui-monospace", fontSize: 12, color: C.dim, textAlign: "right" }}>${r.price} · ~{(r.margin * 100).toFixed(0)}% margin</div>
                </div>;
              })}
              <div style={{ borderTop: `1px solid ${C.grid}`, margin: "4px 0" }} />
              {world.revealed.competitor_benchmark.you.map((r: any, i: number) => <div key={i} style={{ color: C.cyan, fontFamily: "ui-monospace", fontSize: 12 }}>{r.name}: ${r.price} · cost ${r.unitCost} · {(r.margin * 100).toFixed(0)}%</div>)}
            </div>
          </Report>
        )}
        {world.revealed.product_diagnosis && (
          <Report title="Post-launch Product Study">
            {world.revealed.product_diagnosis.diagnoses.length === 0
              ? <div style={{ color: C.faint, fontSize: 13 }}>No products to diagnose.</div>
              : world.revealed.product_diagnosis.diagnoses.map((d: any, i: number) => (
                <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, padding: "6px 0", borderBottom: i < world.revealed.product_diagnosis.diagnoses.length - 1 ? `1px solid ${C.grid}` : "none" }}>
                  <span style={{ color: d.verdict === "mismatch" ? C.amber : d.verdict === "weak" ? C.red : C.green }}>
                    {d.verdict === "mismatch" ? "⚠ " : d.verdict === "weak" ? "✕ " : "✓ "}
                  </span>
                  <span style={{ color: C.ink }}>{d.message}</span>
                  {d.stars && <div style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", color: C.dim, fontSize: 10.5 }}>
                    <span>Product {"★".repeat(d.stars.product)}{"☆".repeat(5-d.stars.product)}</span>
                    <span>Price {"★".repeat(d.stars.price)}{"☆".repeat(5-d.stars.price)}</span>
                    <span>Channel {"★".repeat(d.stars.channel)}{"☆".repeat(5-d.stars.channel)}</span>
                    <span>Brand {"★".repeat(d.stars.brand)}{"☆".repeat(5-d.stars.brand)}</span>
                    <span>IP {"★".repeat(d.stars.ip)}{"☆".repeat(5-d.stars.ip)}</span>
                  </div>}
                  {d.issues?.length > 0 && <div style={{ marginTop: 5, color: C.amber, fontSize: 11 }}>{d.issues.slice(0,2).join(" ")}</div>}
                  {d.recommendations?.length > 0 && d.stars?.channel <= 3 && <div style={{ marginTop: 4, color: C.cyan, fontSize: 11 }}>Try channels: {d.recommendations.join(", ")}.</div>}
                </div>
              ))}
            <div style={{ color: C.faint, fontSize: 11, marginTop: 8 }}>Studies explain what happened; they do not buff the product. Apply the learning to pricing, channels, brand/IP fit, or your next launch.</div>
          </Report>
        )}
        {world.revealed.market_report && (
          <Report title="Market Report">
            <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: 8 }}>
              {world.revealed.market_report.summary}
            </div>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: C.dim, marginBottom: 4 }}>Top 3 players:</div>
              {world.revealed.market_report.top3.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: C.ink }}>{i + 1}. {p.name}</span>
                  <span style={{ fontFamily: "ui-monospace", color: C.violet }}>{fmtPct(p.share)}</span>
                </div>
              ))}
            </div>
            <div style={{ color: C.faint, fontSize: 11, marginTop: 8 }}>
              Direction: <span style={{ color: world.revealed.market_report.direction === "growing" ? C.green : world.revealed.market_report.direction === "declining" ? C.red : C.dim }}>
                {world.revealed.market_report.direction}
              </span> ({fmtPct(world.revealed.market_report.marketGrowth)} vs base). {world.revealed.market_report.cover60} player(s) cover 60% of the market.
            </div>
          </Report>
        )}
      </Panel>
    </div>
  );
}
const Report = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14, background: C.panel2, borderRadius: 8, padding: 12, border: `1px solid ${C.line}` }}>
    <div style={{ color: C.cyan, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>{title}</div>{children}
  </div>
);
