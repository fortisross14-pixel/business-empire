import React from "react";
import type { World } from "../../engine/types";
import { companyRoadmap, nextRoadmapAction, type RoadmapRequirement } from "../../engine/roadmap";
import { C, ctrlBtn } from "../theme";

export function RoadmapView({ world, onNavigate }: { world: World; onNavigate: (top: string, sub: string) => void }) {
  const milestones = companyRoadmap(world);
  const next = nextRoadmapAction(world);
  const completed = milestones.filter((item) => item.complete).length;

  return <div style={{ display: "grid", gap: 14 }}>
    <section style={{ border: `1px solid ${C.violet}55`, background: "linear-gradient(135deg,#f6f5ff,#eef9ff)", borderRadius: 14, padding: 15 }}>
      <div style={{ color: C.violet, fontSize: 9, fontWeight: 900, letterSpacing: .9 }}>COMPANY ROADMAP</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap", marginTop: 3 }}>
        <div><b style={{ fontSize: 18 }}>Make the next company decision obvious.</b><div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginTop: 3, maxWidth: 700 }}>This is the practical dependency map behind facilities, hiring and research. It does not play the game for you; it tells you what a strategic ambition actually requires.</div></div>
        <div style={{ color: C.violet, fontWeight: 900, fontSize: 13 }}>{completed}/{milestones.length} growth arcs complete</div>
      </div>
      {next && <button style={{ ...ctrlBtn, marginTop: 12, borderColor: C.violet, color: C.violet, background: "white" }} onClick={() => onNavigate(next.top, next.sub)}>Next move: {next.label} →</button>}
    </section>

    {milestones.map((milestone, index) => {
      const unmet = milestone.requirements.filter((item) => !item.done);
      const current = unmet[0];
      return <section key={milestone.id} style={{ border: `1px solid ${milestone.complete ? "#b8e6ce" : current ? C.line : "#bbf7d0"}`, borderRadius: 14, background: milestone.complete ? "#f4fcf7" : "white", overflow: "hidden" }}>
        <div style={{ padding: "13px 14px 11px", borderBottom: `1px solid ${milestone.complete ? "#d3f0de" : C.grid}`, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div style={{ display: "flex", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 9, display: "grid", placeItems: "center", background: milestone.complete ? "#d8f5e3" : "#eef0ff", color: milestone.complete ? C.green : C.violet, fontWeight: 900 }}>{milestone.complete ? "✓" : index + 1}</div><div><div style={{ color: C.faint, fontSize: 8.5, fontWeight: 900, letterSpacing: .75 }}>{milestone.kicker}</div><b style={{ fontSize: 14 }}>{milestone.title}</b><div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 3, maxWidth: 740 }}>{milestone.outcome}</div></div></div>
          <span style={{ color: milestone.complete ? C.green : C.amber, fontSize: 9, fontWeight: 900, whiteSpace: "nowrap" }}>{milestone.complete ? "COMPLETE" : `${unmet.length} STEP${unmet.length === 1 ? "" : "S"} LEFT`}</span>
        </div>
        <div style={{ display: "grid", gap: 0 }}>{milestone.requirements.map((item) => <RequirementRow key={item.id} item={item} active={current?.id === item.id} onNavigate={onNavigate} />)}</div>
      </section>;
    })}
  </div>;
}

function RequirementRow({ item, active, onNavigate }: { item: RoadmapRequirement; active: boolean; onNavigate: (top: string, sub: string) => void }) {
  return <button onClick={() => !item.done && onNavigate(item.top, item.sub)} disabled={item.done} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr) auto", gap: 9, alignItems: "center", textAlign: "left", border: 0, borderTop: `1px solid ${C.grid}`, background: active ? "#f8f8ff" : "transparent", padding: "10px 14px", color: C.ink, cursor: item.done ? "default" : "pointer" }}>
    <span style={{ width: 20, height: 20, borderRadius: 99, display: "grid", placeItems: "center", background: item.done ? "#d8f5e3" : active ? "#e3e7ff" : C.panel2, color: item.done ? C.green : active ? C.violet : C.faint, fontWeight: 900, fontSize: 10 }}>{item.done ? "✓" : "○"}</span>
    <span><b style={{ fontSize: 11.5 }}>{item.label}</b><small style={{ display: "block", color: C.dim, fontSize: 10, lineHeight: 1.35, marginTop: 2 }}>{item.detail}</small></span>
    {!item.done && <span style={{ color: active ? C.violet : C.faint, fontWeight: 900 }}>→</span>}
  </button>;
}
