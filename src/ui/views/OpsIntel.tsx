import React from "react";
import { C, ctrlBtn, fmtMoney, fmtPct } from "../theme";
import { Panel } from "../components";
import { CompetitorChip } from "../visualIdentity";
import { STUDY_DEFS } from "../../engine/world";
import { TICKS_PER_QUARTER } from "../../engine/types";
import type { World } from "../../engine/types";
import { hasResearch } from "../../engine/research";

export function IntelligenceView({ world, commission }: { world: World; commission: (t: string) => void }) {
  const hasTech = hasResearch(world, "market_intelligence");
  const consultantOnly = world.player.intelDept < 1 || !hasTech;
  return (
    <div className="intel-center">
      <section className="intel-hero"><div><span>INTELLIGENCE CENTER</span><h2>Turn uncertainty into a decision.</h2><p>Commission focused research, read the evidence, then choose what the company changes next.</p><div className="intel-status"><b>{world.studies.filter(s => !s.done).length}<small>Studies running</small></b><b>{Object.keys(world.revealed).length}<small>Reports unlocked</small></b><b>{consultantOnly ? "External" : "In-house"}<small>Research model</small></b></div></div><img src="/assets/ui/actions/market-study.png" alt="" /></section>
      <div className="intel-layout">
      <Panel title={consultantOnly ? "External Market Research" : "Commission a Study"} style={{ flex: "1 1 320px" }}>
        {consultantOnly && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{!hasTech ? "Broader market research requires the Market Intelligence capability plus a seated Strategy team. You can still hire an external consultant for a post-launch product diagnosis." : "Market Intelligence is researched, but you still need a seated Strategy team to operate it. External product diagnosis remains available."}</div>}
        {Object.entries(STUDY_DEFS).filter(([type]) => !consultantOnly || type === "product_diagnosis").map(([type, def]) => {
          const inflight = world.studies.find((s) => s.type === type && !s.done);
          const done = world.revealed[type];
          return (
            <div key={type} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.grid}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>{def.label}</span>
                <button onClick={() => commission(type)} disabled={!!inflight} style={{ ...ctrlBtn, minWidth: 104, background: inflight ? C.grid : C.cyan, color: inflight ? C.faint : "#fff", borderColor: inflight ? C.grid : C.cyan, opacity: inflight ? .65 : 1 }}>{inflight ? `…${inflight.ticksLeft}t` : fmtMoney(def.cost)}</button>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>{def.blurb}</div>
              {done && <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>Last run: Q{Math.floor(done.asOfTick / TICKS_PER_QUARTER)}</div>}
            </div>
          );
        })}
      </Panel>
      <Panel title="Reports" style={{ flex: "1 1 360px" }}>
        {Object.keys(world.revealed).length === 0 && <div className="intel-empty"><img src="/assets/ui/actions/market-study.png" alt=""/><b>Your evidence shelf is empty</b><span>Commission a study to turn assumptions into visible market facts and next-step guidance.</span></div>}
        {world.revealed.market_map && <Report title="Population Map"><div style={{ fontSize: 13, color: C.dim }}>Population detail is now visible in Market. Total market: <span style={{ color: C.green }}>{fmtMoney(world.live?.totalMarket || 0)}</span>.</div></Report>}
        {world.revealed.gap_analysis && (
          <Report title="Gap Analysis — top underserved cells">
            {world.revealed.gap_analysis.gaps.map((g: any, i: number) => (
              <div key={i} style={{ fontSize: 12, padding: "3px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.ink }}>{g.coord.age} · {g.coord.class} · {g.coord.gender} · {g.coord.leaning}</span>
                <span style={{ fontFamily: "ui-monospace", color: C.amber }}>{fmtMoney(g.market)} · fit {g.bestFit.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, color: C.dim, fontSize: 12 }}>High market + low best-fit = a niche nobody serves well.</div>
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
                  {d.report ? <>
                    <div className="intel-report-kpis"><span>Review <b>★ {d.report.quality.reviewScore.toFixed(1)}</b></span><span>Audience size <b>{Math.round(d.report.targetMarketShare * 100)}%</b></span><span>Best route <b>{d.report.bestChannel.label}</b></span></div>
                    <div className="intel-lessons">{d.report.lessons.map((lesson: any) => <div key={lesson.id}><b>{lesson.title}</b><span>{lesson.finding}</span><strong>Next move: {lesson.action}</strong></div>)}</div>
                    <details className="intel-details"><summary>Product-review diagnosis</summary><div>{d.report.quality.diagnosis.map((reason: string) => <div key={reason}>• {reason}</div>)}</div></details>
                  </> : <>{d.issues?.length > 0 && <div style={{ marginTop: 5, color: C.amber, fontSize: 12 }}>{d.issues.slice(0,2).join(" ")}</div>}</>}
                </div>
              ))}
            <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginTop: 8 }}>Studies do not rewrite this SKU or award a hidden quality bonus. Findings remain attached to the product and reappear as explicit guidance in the next product brief. Price, channel and audience changes can be applied immediately.</div>
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
            <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>
              Direction: <span style={{ color: world.revealed.market_report.direction === "growing" ? C.green : world.revealed.market_report.direction === "declining" ? C.red : C.dim }}>
                {world.revealed.market_report.direction}
              </span> ({fmtPct(world.revealed.market_report.marketGrowth)} vs base). {world.revealed.market_report.cover60} player(s) cover 60% of the market.
            </div>
          </Report>
        )}
      </Panel>
      </div>
      <style>{`
        .intel-center{display:grid;gap:14px}.intel-hero{position:relative;overflow:hidden;min-height:172px;padding:22px 210px 20px 22px;border-radius:18px;color:#fff;background:linear-gradient(125deg,#0a2a4c,#155b83 66%,#1987a8);box-shadow:0 16px 36px rgba(8,43,72,.2)}.intel-hero>div{position:relative;z-index:1}.intel-hero>div>span{font-size:12px;font-weight:950;letter-spacing:1.2px;color:#84ddff}.intel-hero h2{font-size:26px;line-height:1.12;margin:5px 0 7px}.intel-hero p{font-size:13px;line-height:1.5;color:#d4ecf6;margin:0}.intel-hero>img{position:absolute;right:20px;top:12px;width:175px;height:145px;object-fit:contain;filter:drop-shadow(0 15px 20px rgba(0,0,0,.24))}.intel-status{display:flex;gap:8px;margin-top:14px}.intel-status b{min-width:110px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.17);background:rgba(255,255,255,.09);font-size:15px}.intel-status small{display:block;margin-top:2px;color:#b9dce9;font-size:11px}.intel-layout{display:flex;gap:16px;flex-wrap:wrap}.intel-center button{min-height:44px}.intel-center button:focus-visible,.intel-center summary:focus-visible{outline:3px solid rgba(25,135,168,.3);outline-offset:2px}.intel-center button:not(:disabled):active{transform:scale(.98)}.intel-empty{min-height:250px;display:grid;place-items:center;align-content:center;text-align:center;border:1px dashed #b6d5e8;border-radius:13px;background:#f7fbfe;padding:20px}.intel-empty img{width:125px;height:100px;object-fit:contain}.intel-empty b{font-size:16px}.intel-empty span{max-width:360px;margin-top:5px;color:${C.dim};font-size:12px;line-height:1.5}.intel-report-kpis{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.intel-report-kpis span{padding:7px 9px;border-radius:9px;background:#fff;border:1px solid ${C.line};color:${C.dim};font-size:12px}.intel-report-kpis b{color:${C.ink}}.intel-lessons{margin-top:9px;display:grid;gap:7px}.intel-lessons>div{padding:10px;border-radius:10px;border:1px solid ${C.line};border-left:4px solid ${C.green};background:#fff}.intel-lessons b,.intel-lessons span,.intel-lessons strong{display:block;font-size:12px;line-height:1.45}.intel-lessons span{color:${C.dim};margin-top:2px}.intel-lessons strong{color:${C.green};margin-top:4px}.intel-details{margin-top:9px;padding:9px;border-radius:9px;background:#eef8fe;color:${C.dim};font-size:12px}.intel-details summary{display:flex;align-items:center;color:${C.cyan};cursor:pointer;font-weight:800;min-height:44px}.intel-details>div{margin-top:5px;line-height:1.5}.intel-report{margin-bottom:14px;background:linear-gradient(180deg,#f8fbfe,#f2f7fb);border-radius:12px;padding:13px;border:1px solid ${C.line};box-shadow:0 4px 12px rgba(17,54,84,.04)}.intel-report-title{display:flex;align-items:center;gap:8px;color:${C.cyan};font-size:12px;text-transform:uppercase;letter-spacing:.7px;font-weight:900;margin-bottom:9px}.intel-report-title:before{content:'◆';display:grid;place-items:center;width:27px;height:27px;border-radius:8px;background:#dff3fd;color:${C.cyan}}@media(max-width:640px){.intel-hero{padding:17px 112px 16px 15px;min-height:170px}.intel-hero h2{font-size:21px}.intel-hero>img{width:100px;height:100px;right:5px;top:25px}.intel-status{display:grid;grid-template-columns:repeat(3,1fr);margin-right:-98px}.intel-status b{min-width:0;padding:8px 6px;font-size:13px}.intel-status small{font-size:10px}.intel-layout{display:block}}@media(max-width:420px){.intel-hero{padding:17px 15px}.intel-hero>img{display:none}.intel-status{margin-right:0}.intel-report-kpis{display:grid;grid-template-columns:1fr}.intel-report-kpis span{font-size:13px}}
      `}</style>
    </div>
  );
}
const Report = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="intel-report">
    <div className="intel-report-title">{title}</div>{children}
  </div>
);
