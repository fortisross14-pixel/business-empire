import React, { useState } from "react";
import { C, bigBtn, ctrlBtn, fmtMoney } from "../theme";
import type { PersonnelRole, TalentCandidate, TalentSearchMode, World } from "../../engine/types";
import { INDUSTRIES } from "../../engine/industries";
import { ROLE_LABELS, TALENT_SEARCH_MODES, starsFor } from "../../engine/people";
import { archetypeByKey } from "../../engine/productCatalog";
import { openSeatCountForRole, roleFitsRoom } from "../../engine/infrastructure";

const ROLES: PersonnelRole[] = ["product_manager", "marketing", "operations", "finance", "strategy", "innovation"];
const MODES: TalentSearchMode[] = ["quick", "online", "deep"];

export function PersonnelView({ world, hireCandidate, startRecruitingSearch, promotePersonnel, firePersonnel }: {
  world: World;
  hireCandidate: (candidateId: string, roomId: string) => { ok: boolean; reason?: string };
  startRecruitingSearch: (role: PersonnelRole, industryId: string, mode: TalentSearchMode) => { ok: boolean; reason?: string };
  promotePersonnel: (id: string) => void;
  firePersonnel: (id: string) => void;
}) {
  const staff = world.player.personnel;
  const activeIndustries = Object.values(world.player.businesses ?? {}).filter((b) => b?.status === "active").map((b) => b!.industryId);
  const [role, setRole] = useState<PersonnelRole>("product_manager");
  const [industryId, setIndustryId] = useState(activeIndustries[0] ?? world.industryId);
  const [mode, setMode] = useState<TalentSearchMode>((world.player.research?.completed ?? []).includes("professional_recruiting") ? "online" : "quick");
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"hiring" | "employees">("hiring");
  const [contractCandidateId, setContractCandidateId] = useState<string | null>(null);
  const [contractRoomId, setContractRoomId] = useState<string>("");
  const [contractMessage, setContractMessage] = useState<string | null>(null);
  const search = world.player.talentSearch;
  const slate = world.player.talentMarket ?? [];
  const seatedIds = new Set(world.player.operatingRooms.flatMap((r) => r.assignedPersonnelIds));
  const openRoleSeats = openSeatCountForRole(world, role);

  const start = () => { const r = startRecruitingSearch(role, industryId, mode); setMessage(r.ok ? "Agency brief sent." : r.reason ?? "Could not start search."); };

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "flex", gap: 6, borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>
      <button onClick={() => setTab("hiring")} style={{ ...tabBtn, borderColor: tab === "hiring" ? C.violet : C.line, color: tab === "hiring" ? C.violet : C.dim, background: tab === "hiring" ? "#f5f3ff" : "white" }}>Hiring {search ? `· ${Math.ceil(search.daysLeft)}d` : slate.length ? `· ${slate.length} candidates` : ""}</button>
      <button onClick={() => setTab("employees")} style={{ ...tabBtn, borderColor: tab === "employees" ? C.violet : C.line, color: tab === "employees" ? C.violet : C.dim, background: tab === "employees" ? "#f5f3ff" : "white" }}>Employees · {staff.length}</button>
    </div>

    {tab === "hiring" && <>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 12 }}>
            {MODES.map((m) => { const d = TALENT_SEARCH_MODES[m]; const on = mode === m; const gate = m === "online" && !(world.player.research?.completed ?? []).includes("professional_recruiting") ? "Research People & HR Foundations first." : m === "deep" && !(world.player.research?.completed ?? []).includes("executive_search") ? "Research Executive Search first." : null; return <button key={m} disabled={Boolean(gate)} title={gate ?? undefined} onClick={() => setMode(m)} style={{ textAlign: "left", cursor: gate ? "default" : "pointer", padding: 12, borderRadius: 11, background: on ? "#f5f3ff" : C.panel2, border: `1px solid ${on ? C.violet : C.line}`, color: C.ink, opacity: gate ? .5 : 1 }}><b style={{ fontSize: 12 }}>{d.label}</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>{d.blurb}</div><div style={{ color: gate ? C.amber : on ? C.violet : C.faint, fontSize: 10, fontWeight: 800, marginTop: 7 }}>{gate ?? `${d.days} days · ${fmtMoney(d.cost)}`}</div></button>; })}
          </div>
          <button disabled={openRoleSeats <= 0} title={openRoleSeats <= 0 ? "Expand an office or build another compatible office before recruiting." : undefined} style={{ ...bigBtn, width: "100%", marginTop: 10, opacity: openRoleSeats > 0 ? 1 : .45 }} onClick={start}>Contact agency</button>
          {openRoleSeats <= 0 && <div style={{ color: C.amber, fontSize: 10.5, marginTop: 6 }}>↳ No compatible desk is open for this role. Expand an office or build another one first.</div>}
        </>}
        {message && !search && <div style={{ color: message.includes("sent") ? C.green : C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
      </section>

      {slate.length > 0 && !search && <section style={panelStyle}>
        <div style={eyebrow}>SEARCH RESULTS</div><h2 style={h2}>Candidate slate</h2><p style={copy}>This slate stays available until you start another search. Hire the person you want; the others remain available for now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9, marginTop: 12 }}>{slate.map((c) => <CandidateCard key={c.id} world={world} candidate={c} review={() => { const compatible = compatibleOfficeSeats(world, c); setContractCandidateId(c.id); setContractRoomId(compatible[0]?.id ?? ""); setContractMessage(null); }} />)}</div>
      </section>}
    </>}

    {tab === "employees" && <section style={panelStyle}>
      <div style={eyebrow}>YOUR TEAM</div><h2 style={h2}>Employees</h2><p style={copy}>Review your permanent team here. Office assignment happens from the campus building itself, so staffing has one clear home.</p>
      {staff.length === 0 ? <div style={{ color: C.faint, fontSize: 12, marginTop: 12 }}>No employees yet. The founder does not consume a staff slot. Go to Hiring to brief a recruiting agency.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 12 }}>{staff.map((p) => { const room = world.player.operatingRooms.find((r) => r.assignedPersonnelIds.includes(p.id)); return <div key={p.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{p.name}</b><div style={{ color: C.violet, fontSize: 10.5 }}>{p.title}</div></div><div style={{ color: C.faint, fontSize: 9.5, textAlign: "right" }}>{fmtMoney(p.salary)}/mo<br/>Age {p.age}</div></div><div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>{specialtyLabel(p.specialty)} · {room?.name ?? <span style={{ color: C.amber }}>Unassigned</span>}</div><div style={{ display: "flex", gap: 5, marginTop: 9 }}><button style={{ ...ctrlBtn, flex: 1 }} onClick={() => promotePersonnel(p.id)}>Promote</button><button style={{ ...ctrlBtn, color: C.red }} onClick={() => firePersonnel(p.id)}>Release</button></div>{!seatedIds.has(p.id) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 6 }}>Assign this person to an office from the campus.</div>}</div>; })}</div>}
    </section>}

    {contractCandidateId && (() => {
      const candidate = slate.find((c) => c.id === contractCandidateId);
      if (!candidate) return null;
      const rooms = compatibleOfficeSeats(world, candidate);
      const room = rooms.find((r) => r.id === contractRoomId) ?? rooms[0];
      const seatNo = room ? (room.id === "founder-office" ? room.assignedPersonnelIds.length + 2 : room.assignedPersonnelIds.length + 1) : 0;
      return <div style={{ position: "fixed", inset: 0, background: "rgba(8,28,48,.42)", display: "grid", placeItems: "center", padding: 14, zIndex: 90 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setContractCandidateId(null); }}>
        <div style={{ width: "min(520px,96vw)", maxHeight: "88dvh", overflowY: "auto", background: "white", borderRadius: 16, border: `1px solid ${C.line}`, boxShadow: "0 24px 70px rgba(8,28,48,.28)", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><div style={eyebrow}>EMPLOYMENT CONTRACT</div><h2 style={{ ...h2, marginBottom: 3 }}>{candidate.name}</h2><div style={{ color: C.violet, fontWeight: 800, fontSize: 12 }}>{candidate.title}</div></div><button style={ctrlBtn} onClick={() => setContractCandidateId(null)}>✕</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
            <ContractMetric label="Monthly salary" value={fmtMoney(candidate.salaryAsk)} />
            <ContractMetric label="Role" value={ROLE_LABELS[candidate.role]} />
            <ContractMetric label="Industry" value={INDUSTRIES[world.industryId]?.label ?? world.industryId} />
            <ContractMetric label="Specialty" value={specialtyLabel(candidate.specialty)} />
          </div>
          <label style={{ ...fieldStyle, marginTop: 14 }}>Workplace<select value={room?.id ?? ""} onChange={(e) => setContractRoomId(e.target.value)} style={selectStyle}>{rooms.map((r) => { const limit = r.id === "founder-office" ? r.capacity - 1 : r.capacity; return <option key={r.id} value={r.id}>{r.name} · {r.assignedPersonnelIds.length}/{limit} staff seats used</option>; })}</select></label>
          {room ? <div style={{ marginTop: 9, border: `1px solid ${C.line}`, borderRadius: 11, padding: 11, background: C.panel2 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b>Assigned position</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 3 }}>{room.name} · Desk {seatNo} of {room.capacity}</div></div><span style={{ color: C.green, fontWeight: 900 }}>OPEN</span></div>{room.id === "founder-office" && <div style={{ color: C.faint, fontSize: 9.5, marginTop: 6 }}>Desk 1 belongs permanently to the Founder / CEO. The remaining three desks can host different startup functions.</div>}</div> : <div style={{ color: C.amber, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 10, marginTop: 12, fontSize: 11 }}>No compatible open desk exists. Build or expand an office before signing this person.</div>}
          {contractMessage && <div style={{ color: C.amber, fontSize: 10.5, marginTop: 8 }}>{contractMessage}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><button style={ctrlBtn} onClick={() => setContractCandidateId(null)}>Cancel</button><button disabled={!room} style={{ ...bigBtn, opacity: room ? 1 : .45 }} onClick={() => { if (!room) return; const result = hireCandidate(candidate.id, room.id); if (result.ok) { setContractCandidateId(null); setTab("employees"); } else setContractMessage(result.reason ?? "Could not sign contract."); }}>Sign contract</button></div>
        </div>
      </div>;
    })()}
  </div>;
}

function CandidateCard({ world, candidate: c, review }: { world: World; candidate: TalentCandidate; review: () => void }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{c.name}</b><div style={{ color: C.violet, fontSize: 10.5 }}>{c.title}</div></div><div style={{ color: C.faint, fontSize: 9.5, textAlign: "right" }}>{fmtMoney(c.salaryAsk)}/mo<br/>Age {c.age}</div></div>
    <div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>Specialty: <b>{specialtyLabel(c.specialty)}</b></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5, marginTop: 8 }}><Mini label="Skill" value={c.skill}/><Mini label="Potential" value={c.potential}/><Mini label="Execution" value={c.attributes.execution}/><Mini label="Commercial" value={c.attributes.commercial}/></div>
    <div style={{ color: C.faint, fontSize: 9.5, marginTop: 8 }}>{c.traits.join(" · ")}</div>
    <button style={{ ...bigBtn, width: "100%", marginTop: 9 }} onClick={review}>Review contract</button>
  </div>;
}

function compatibleOfficeSeats(world: World, candidate: TalentCandidate) {
  return world.player.operatingRooms.filter((r) => {
    if (r.kind !== "office" || !roleFitsRoom(candidate.role, r)) return false;
    const limit = r.id === "founder-office" ? Math.max(0, r.capacity - 1) : r.capacity;
    return r.assignedPersonnelIds.length < limit;
  });
}
function ContractMetric({ label, value }: { label: string; value: string }) { return <div style={{ border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 9, padding: 9 }}><div style={{ color: C.faint, fontSize: 9, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><b style={{ fontSize: 11.5 }}>{value}</b></div>; }
function Mini({ label, value }: { label: string; value: number }) { const n = starsFor(value); return <div style={{ fontSize: 9.5 }}><span style={{ color: C.faint }}>{label}</span><div style={{ color: C.amber }}>{"★".repeat(n)}<span style={{ color: C.grid }}>{"★".repeat(5-n)}</span></div></div>; }
function specialtyLabel(key: string | null | undefined) { return key ? archetypeByKey(key)?.label ?? key : "Generalist"; }
const tabBtn: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 999, padding: "7px 11px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
const panelStyle: React.CSSProperties = { background: "white", border: `1px solid ${C.line}`, borderRadius: 14, padding: 15, boxShadow: "0 5px 18px rgba(20,53,84,.05)" };
const eyebrow: React.CSSProperties = { color: C.cyan, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
const h2: React.CSSProperties = { margin: "3px 0 4px", fontSize: 18 };
const copy: React.CSSProperties = { margin: 0, color: C.dim, fontSize: 11.5, lineHeight: 1.5, maxWidth: 720 };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 5, color: C.dim, fontSize: 10.5, fontWeight: 700 };
const selectStyle: React.CSSProperties = { width: "100%", border: `1px solid ${C.line}`, background: "white", color: C.ink, borderRadius: 8, padding: "8px 9px", boxSizing: "border-box" };
