import React, { useState } from "react";
import { C, bigBtn, ctrlBtn, fmtMoney } from "../theme";
import type { PersonnelRole, TalentCandidate, TalentSearchMode, World } from "../../engine/types";
import { INDUSTRIES } from "../../engine/industries";
import { ROLE_LABELS, TALENT_SEARCH_MODES, starsFor } from "../../engine/people";
import { archetypeByKey } from "../../engine/productCatalog";

const ROLES: PersonnelRole[] = ["product_manager", "marketing", "operations", "finance", "strategy"];
const MODES: TalentSearchMode[] = ["quick", "online", "deep"];

export function PersonnelView({ world, hireCandidate, startRecruitingSearch, promotePersonnel, firePersonnel }: {
  world: World;
  hireCandidate: (candidateId: string) => void;
  startRecruitingSearch: (role: PersonnelRole, industryId: string, mode: TalentSearchMode) => { ok: boolean; reason?: string };
  promotePersonnel: (id: string) => void;
  firePersonnel: (id: string) => void;
}) {
  const staff = world.player.personnel;
  const activeIndustries = Object.values(world.player.businesses ?? {}).filter((b) => b?.status === "active").map((b) => b!.industryId);
  const [role, setRole] = useState<PersonnelRole>("product_manager");
  const [industryId, setIndustryId] = useState(activeIndustries[0] ?? world.industryId);
  const [mode, setMode] = useState<TalentSearchMode>("online");
  const [message, setMessage] = useState<string | null>(null);
  const search = world.player.talentSearch;
  const slate = world.player.talentMarket ?? [];
  const seatedIds = new Set(world.player.operatingRooms.flatMap((r) => r.assignedPersonnelIds));

  const start = () => { const r = startRecruitingSearch(role, industryId, mode); setMessage(r.ok ? "Agency brief sent." : r.reason ?? "Could not start search."); };

  return <div style={{ display: "grid", gap: 14 }}>
    <section style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
        <div><div style={eyebrow}>RECRUITING AGENCY</div><h2 style={h2}>Find people</h2><p style={copy}>Tell the agency what role and industry you need. Faster searches are cheaper and shallower; a deep search takes time but reaches stronger candidates.</p></div>
        <div style={{ textAlign: "right" }}><b>{staff.length}</b><div style={{ color: C.faint, fontSize: 10 }}>employees</div></div>
      </div>

      {search ? <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#eff8ff", border: "1px solid #bae0f7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b>{TALENT_SEARCH_MODES[search.mode].label}</b><div style={{ color: C.dim, fontSize: 11, marginTop: 3 }}>{ROLE_LABELS[search.role]} · {INDUSTRIES[search.industryId]?.label ?? search.industryId}</div></div><b style={{ color: C.cyan }}>{Math.ceil(search.daysLeft)} days</b></div>
        <div style={{ height: 8, background: "#dceaf5", borderRadius: 99, marginTop: 10 }}><div style={{ width: `${Math.max(3,(1-search.daysLeft/search.totalDays)*100)}%`, height: "100%", background: C.cyan, borderRadius: 99 }} /></div>
        <div style={{ color: C.faint, fontSize: 10.5, marginTop: 6 }}>The agency is building the slate. Simulation time must pass.</div>
      </div> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9, marginTop: 14 }}>
          <label style={fieldStyle}>Role<select value={role} onChange={(e) => setRole(e.target.value as PersonnelRole)} style={selectStyle}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
          <label style={fieldStyle}>Industry<select value={industryId} onChange={(e) => setIndustryId(e.target.value)} style={selectStyle}>{activeIndustries.map((id) => <option key={id} value={id}>{INDUSTRIES[id]?.label ?? id}</option>)}</select></label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginTop: 12 }}>
          {MODES.map((m) => { const d = TALENT_SEARCH_MODES[m]; const on = mode === m; return <button key={m} onClick={() => setMode(m)} style={{ textAlign: "left", cursor: "pointer", padding: 12, borderRadius: 11, background: on ? "#f5f3ff" : C.panel2, border: `1px solid ${on ? C.violet : C.line}`, color: C.ink }}><b style={{ fontSize: 12 }}>{d.label}</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>{d.blurb}</div><div style={{ color: on ? C.violet : C.faint, fontSize: 10, fontWeight: 800, marginTop: 7 }}>{d.days} days · {fmtMoney(d.cost)}</div></button>; })}
        </div>
        <button style={{ ...bigBtn, width: "100%", marginTop: 10 }} onClick={start}>Contact agency</button>
      </>}
      {message && !search && <div style={{ color: message.includes("sent") ? C.green : C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
    </section>

    {slate.length > 0 && !search && <section style={panelStyle}>
      <div style={eyebrow}>SEARCH RESULTS</div><h2 style={h2}>Candidate slate</h2><p style={copy}>This slate stays available until you start another search. Hire the person you want; the others remain available for now.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9, marginTop: 12 }}>{slate.map((c) => <CandidateCard key={c.id} world={world} candidate={c} hire={() => hireCandidate(c.id)} />)}</div>
    </section>}

    <section style={panelStyle}>
      <div style={eyebrow}>YOUR TEAM</div><h2 style={h2}>Employees</h2>
      {staff.length === 0 ? <div style={{ color: C.faint, fontSize: 12 }}>No employees yet. The founder does not consume a staff slot.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 12 }}>{staff.map((p) => { const room = world.player.operatingRooms.find((r) => r.assignedPersonnelIds.includes(p.id)); return <div key={p.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{p.name}</b><div style={{ color: C.violet, fontSize: 10.5 }}>{p.title}</div></div><div style={{ color: C.faint, fontSize: 9.5, textAlign: "right" }}>{fmtMoney(p.salary)}/mo<br/>Age {p.age}</div></div><div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>{specialtyLabel(p.specialty)} · {room?.name ?? <span style={{ color: C.amber }}>Unassigned</span>}</div><div style={{ display: "flex", gap: 5, marginTop: 9 }}><button style={{ ...ctrlBtn, flex: 1 }} onClick={() => promotePersonnel(p.id)}>Promote</button><button style={{ ...ctrlBtn, color: C.red }} onClick={() => firePersonnel(p.id)}>Release</button></div>{!seatedIds.has(p.id) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 6 }}>Assign this person to an office from the campus.</div>}</div>; })}</div>}
    </section>
  </div>;
}

function CandidateCard({ world, candidate: c, hire }: { world: World; candidate: TalentCandidate; hire: () => void }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{c.name}</b><div style={{ color: C.violet, fontSize: 10.5 }}>{c.title}</div></div><div style={{ color: C.faint, fontSize: 9.5, textAlign: "right" }}>{fmtMoney(c.salaryAsk)}/mo<br/>Age {c.age}</div></div>
    <div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>Specialty: <b>{specialtyLabel(c.specialty)}</b></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5, marginTop: 8 }}><Mini label="Skill" value={c.skill}/><Mini label="Potential" value={c.potential}/><Mini label="Execution" value={c.attributes.execution}/><Mini label="Commercial" value={c.attributes.commercial}/></div>
    <div style={{ color: C.faint, fontSize: 9.5, marginTop: 8 }}>{c.traits.join(" · ")}</div>
    <button style={{ ...bigBtn, width: "100%", marginTop: 9 }} onClick={hire}>Hire {c.name.split(" ")[0]}</button>
  </div>;
}
function Mini({ label, value }: { label: string; value: number }) { const n = starsFor(value); return <div style={{ fontSize: 9.5 }}><span style={{ color: C.faint }}>{label}</span><div style={{ color: C.amber }}>{"★".repeat(n)}<span style={{ color: C.grid }}>{"★".repeat(5-n)}</span></div></div>; }
function specialtyLabel(key: string | null | undefined) { return key ? archetypeByKey(key)?.label ?? key : "Generalist"; }
const panelStyle: React.CSSProperties = { background: "white", border: `1px solid ${C.line}`, borderRadius: 14, padding: 15, boxShadow: "0 5px 18px rgba(20,53,84,.05)" };
const eyebrow: React.CSSProperties = { color: C.cyan, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
const h2: React.CSSProperties = { margin: "3px 0 4px", fontSize: 18 };
const copy: React.CSSProperties = { margin: 0, color: C.dim, fontSize: 11.5, lineHeight: 1.5, maxWidth: 720 };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 5, color: C.dim, fontSize: 10.5, fontWeight: 700 };
const selectStyle: React.CSSProperties = { width: "100%", border: `1px solid ${C.line}`, background: "white", color: C.ink, borderRadius: 8, padding: "8px 9px", boxSizing: "border-box" };
