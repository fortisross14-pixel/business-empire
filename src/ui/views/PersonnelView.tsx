import React, { useState } from "react";
import { C, bigBtn, ctrlBtn, fmtMoney } from "../theme";
import type { PersonnelRole, TalentCandidate, TalentSearchMode, World } from "../../engine/types";
import { INDUSTRIES } from "../../engine/industries";
import { ROLE_LABELS, TALENT_SEARCH_MODES, starsFor } from "../../engine/people";
import { archetypeByKey } from "../../engine/productCatalog";
import { openSeatCountForRole, roleFitsRoom } from "../../engine/infrastructure";

const ROLES: PersonnelRole[] = ["product_manager", "marketing", "operations", "finance", "strategy", "innovation"];
const MODES: TalentSearchMode[] = ["quick", "online", "deep"];

export function PersonnelView({ world, hireCandidate, startRecruitingSearch, promotePersonnel, trainPersonnel, firePersonnel }: {
  world: World;
  hireCandidate: (candidateId: string, roomId: string) => { ok: boolean; reason?: string };
  startRecruitingSearch: (role: PersonnelRole, industryId: string, mode: TalentSearchMode) => { ok: boolean; reason?: string };
  promotePersonnel: (id: string) => void;
  trainPersonnel: (id: string) => { ok: boolean; reason?: string; days?: number };
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
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const search = world.player.talentSearch;
  const slate = world.player.talentMarket ?? [];
  const seatedIds = new Set(world.player.operatingRooms.flatMap((r) => r.assignedPersonnelIds));
  const openRoleSeats = openSeatCountForRole(world, role);

  const start = () => { const r = startRecruitingSearch(role, industryId, mode); setMessage(r.ok ? "Agency brief sent." : r.reason ?? "Could not start search."); };

  return <div className="people-playset" style={{ display: "grid", gap: 14 }}>
    <style>{peopleCss}</style>
    <section className="people-hero">
      <div className="people-hero-art" aria-hidden="true"><span>👤</span><span>👩🏽‍💼</span><span>👨🏻‍🔬</span></div>
      <div className="people-hero-copy"><div className="people-kicker">YOUR ORGANIZATION</div><h2>Build the team behind the business</h2><p>Recruit specialists, give them a real workplace and develop the people who can turn a promising company into a market leader.</p></div>
      <div className="people-hero-metrics"><div><small>TEAM</small><b>{staff.length}</b><span>employees</span></div><div><small>OPEN SEATS</small><b>{world.player.operatingRooms.filter((r)=>r.kind==="office").reduce((n,r)=>n+Math.max(0,(r.id === "founder-office" ? r.capacity-1 : r.capacity)-r.assignedPersonnelIds.length),0)}</b><span>across campus</span></div><div><small>TALENT</small><b>{slate.length}</b><span>candidates ready</span></div></div>
    </section>
    <div className="people-tabs" style={{ display: "flex", gap: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 9 }}>
      <button onClick={() => setTab("hiring")} style={{ ...tabBtn, borderColor: tab === "hiring" ? C.violet : C.line, color: tab === "hiring" ? C.violet : C.dim, background: tab === "hiring" ? "#f5f3ff" : "white" }}>Hiring {search ? `· ${Math.ceil(search.daysLeft)}d` : slate.length ? `· ${slate.length} candidates` : ""}</button>
      <button onClick={() => setTab("employees")} style={{ ...tabBtn, borderColor: tab === "employees" ? C.violet : C.line, color: tab === "employees" ? C.violet : C.dim, background: tab === "employees" ? "#f5f3ff" : "white" }}>Employees · {staff.length}</button>
    </div>

    {tab === "hiring" && <>
      <section className="people-panel" style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
          <div><div style={eyebrow}>RECRUITING AGENCY</div><h2 style={h2}>Find your next specialist</h2><p style={copy}>Choose the role you need, then decide how broad a search to run. Better searches take longer, but can uncover exceptional talent.</p></div>
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
            {MODES.map((m) => { const d = TALENT_SEARCH_MODES[m]; const on = mode === m; const gate = m === "online" && !(world.player.research?.completed ?? []).includes("professional_recruiting") ? "Research People & HR Foundations first." : m === "deep" && !(world.player.research?.completed ?? []).includes("executive_search") ? "Research Executive Search first." : null; return <button className="search-mode" key={m} disabled={Boolean(gate)} title={gate ?? undefined} onClick={() => setMode(m)} style={{ textAlign: "left", cursor: gate ? "default" : "pointer", padding: 14, borderRadius: 13, background: on ? "linear-gradient(145deg,#f7f3ff,#edf7ff)" : C.panel2, border: `1px solid ${on ? C.violet : C.line}`, color: C.ink, opacity: gate ? .58 : 1 }}><span className="search-mode-icon">{m === "quick" ? "⚡" : m === "online" ? "🌐" : "💎"}</span><b style={{ fontSize: 14 }}>{d.label}</b><div style={{ color: C.dim, fontSize: 12, marginTop: 5, lineHeight: 1.45 }}>{d.blurb}</div><div style={{ color: gate ? C.amber : on ? C.violet : C.faint, fontSize: 12, fontWeight: 800, marginTop: 8 }}>{gate ?? `${d.days} days · ${fmtMoney(d.cost)}`}</div></button>; })}
          </div>
          <button disabled={openRoleSeats <= 0} title={openRoleSeats <= 0 ? "Expand an office or build another compatible office before recruiting." : undefined} style={{ ...bigBtn, width: "100%", marginTop: 10, opacity: openRoleSeats > 0 ? 1 : .45 }} onClick={start}>Contact agency</button>
          {openRoleSeats <= 0 && <div style={{ color: C.amber, fontSize: 10.5, marginTop: 6 }}>↳ No compatible desk is open for this role. Expand an office or build another one first.</div>}
        </>}
        {message && !search && <div style={{ color: message.includes("sent") ? C.green : C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
      </section>

      {slate.length > 0 && !search && <section className="people-panel" style={panelStyle}>
        <div style={eyebrow}>SEARCH RESULTS</div><h2 style={h2}>Candidate slate</h2><p style={copy}>This slate stays available until you start another search. Hire the person you want; the others remain available for now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9, marginTop: 12 }}>{slate.map((c) => <CandidateCard key={c.id} world={world} candidate={c} review={() => { const compatible = compatibleOfficeSeats(world, c); setContractCandidateId(c.id); setContractRoomId(compatible[0]?.id ?? ""); setContractMessage(null); }} />)}</div>
      </section>}
    </>}

    {tab === "employees" && <section className="people-panel" style={panelStyle}>
      <div style={eyebrow}>YOUR TEAM</div><h2 style={h2}>Employees</h2><p style={copy}>Review your permanent team here. Office assignment happens from the campus building itself, so staffing has one clear home.</p>
      {trainingMessage && <div style={{ color: trainingMessage.startsWith("✓") ? C.green : C.amber, fontSize: 10.5, marginTop: 9 }}>{trainingMessage}</div>}
      {staff.length === 0 ? <div style={{ color: C.faint, fontSize: 12, marginTop: 12 }}>No employees yet. The founder does not consume a staff slot. Go to Hiring to brief a recruiting agency.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 12 }}>{staff.map((p) => {
        const room = world.player.operatingRooms.find((r) => r.assignedPersonnelIds.includes(p.id));
        const training = (world.player.trainingPrograms ?? []).find((t) => t.personnelId === p.id);
        const hasTrainingRoom = world.player.operatingRooms.some((r) => r.facilityType === "training_center");
        return <div className="employee-card" key={p.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 13, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div className="person-identity"><PersonMark name={p.name} role={p.role}/><div><b>{p.name}</b><div style={{ color: C.violet, fontSize: 12 }}>{p.title}</div></div></div><div style={{ color: C.faint, fontSize: 12, textAlign: "right" }}>{fmtMoney(p.salary)}/mo<br/>Age {p.age}</div></div>
          <div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>{specialtyLabel(p.specialty)} · {room?.name ?? <span style={{ color: C.amber }}>Unassigned</span>}</div>
          {training && <div style={{ marginTop: 8, padding: 8, borderRadius: 8, border: `1px solid ${C.line}`, background: "white" }}><div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:10.5 }}><b>🎓 Upskilling</b><span>{Math.ceil(training.daysLeft)}d</span></div><div style={{ height:5, background:C.grid, borderRadius:99, marginTop:6 }}><div style={{ width:`${Math.max(3,(1-training.daysLeft/training.totalDays)*100)}%`, height:"100%", background:C.violet, borderRadius:99 }}/></div></div>}
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap:"wrap" }}><button style={{ ...ctrlBtn, flex: 1 }} onClick={() => promotePersonnel(p.id)}>⬆ Promote</button><button disabled={Boolean(training) || !hasTrainingRoom} title={!hasTrainingRoom ? "Build a Training Room first." : training ? "This employee is already training." : undefined} style={{ ...ctrlBtn, flex: 1, color:C.violet, opacity: training || !hasTrainingRoom ? .45 : 1 }} onClick={() => { const result=trainPersonnel(p.id); setTrainingMessage(result.ok ? `✓ ${p.name} started training${result.days ? ` · ${result.days} days` : ""}.` : result.reason ?? "Could not start training."); }}>🎓 Train</button><button style={{ ...ctrlBtn, color: C.red }} onClick={() => setReleaseId(p.id)}>Release</button></div>
          {!seatedIds.has(p.id) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 6 }}>Assign this person to an office from the campus.</div>}
        </div>; })}</div>}
    </section>}

    {contractCandidateId && (() => {
      const candidate = slate.find((c) => c.id === contractCandidateId);
      if (!candidate) return null;
      const rooms = compatibleOfficeSeats(world, candidate);
      const room = rooms.find((r) => r.id === contractRoomId) ?? rooms[0];
      const seatNo = room ? (room.id === "founder-office" ? room.assignedPersonnelIds.length + 2 : room.assignedPersonnelIds.length + 1) : 0;
      return <div className="people-contract-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(8,28,48,.58)", display: "grid", placeItems: "center", padding: 14, zIndex: 190 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setContractCandidateId(null); }}>
        <div className="people-contract" role="dialog" aria-modal="true" style={{ width: "min(520px,96vw)", maxHeight: "88dvh", overflowY: "auto", background: "linear-gradient(155deg,#fff,#f4f9fd)", borderRadius: 19, border: `1px solid ${C.line}`, boxShadow: "0 24px 70px rgba(8,28,48,.34)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><div style={eyebrow}>EMPLOYMENT CONTRACT</div><h2 style={{ ...h2, marginBottom: 3 }}>{candidate.name}</h2><div style={{ color: C.violet, fontWeight: 800, fontSize: 12 }}>{candidate.title}</div></div><button style={ctrlBtn} onClick={() => setContractCandidateId(null)}>✕</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
            <ContractMetric label="Monthly salary" value={fmtMoney(candidate.salaryAsk)} />
            <ContractMetric label="Role" value={ROLE_LABELS[candidate.role]} />
            <ContractMetric label="Industry" value={INDUSTRIES[industryId]?.label ?? industryId} />
            <ContractMetric label="Specialty" value={specialtyLabel(candidate.specialty)} />
          </div>
          <label style={{ ...fieldStyle, marginTop: 14 }}>Workplace<select value={room?.id ?? ""} onChange={(e) => setContractRoomId(e.target.value)} style={selectStyle}>{rooms.map((r) => { const limit = r.id === "founder-office" ? r.capacity - 1 : r.capacity; return <option key={r.id} value={r.id}>{r.name} · {r.assignedPersonnelIds.length}/{limit} staff seats used</option>; })}</select></label>
          {room ? <div style={{ marginTop: 9, border: `1px solid ${C.line}`, borderRadius: 11, padding: 11, background: C.panel2 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b>Assigned position</b><div style={{ color: C.dim, fontSize: 10.5, marginTop: 3 }}>{room.name} · Desk {seatNo} of {room.capacity}</div></div><span style={{ color: C.green, fontWeight: 900 }}>OPEN</span></div>{room.id === "founder-office" && <div style={{ color: C.faint, fontSize: 9.5, marginTop: 6 }}>Desk 1 belongs permanently to the Founder / CEO. The remaining three desks can host different startup functions.</div>}</div> : <div style={{ color: C.amber, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 10, marginTop: 12, fontSize: 11 }}>No compatible open desk exists. Build or expand an office before signing this person.</div>}
          {contractMessage && <div style={{ color: C.amber, fontSize: 10.5, marginTop: 8 }}>{contractMessage}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><button style={ctrlBtn} onClick={() => setContractCandidateId(null)}>Cancel</button><button disabled={!room} style={{ ...bigBtn, opacity: room ? 1 : .45 }} onClick={() => { if (!room) return; const result = hireCandidate(candidate.id, room.id); if (result.ok) { setContractCandidateId(null); setTab("employees"); } else setContractMessage(result.reason ?? "Could not sign contract."); }}>Sign contract</button></div>
        </div>
      </div>;
    })()}

    {releaseId && (() => { const person=staff.find((p)=>p.id===releaseId); if(!person) return null; return <div className="people-dialog-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setReleaseId(null)}}><div className="people-confirm" role="dialog" aria-modal="true" aria-labelledby="release-title"><div className="people-confirm-icon">⚠️</div><div className="people-kicker">TEAM DECISION</div><h2 id="release-title">Release {person.name}?</h2><p>This removes {person.name} from the company and frees their workplace. This decision cannot be undone.</p><div className="people-confirm-actions"><button style={ctrlBtn} onClick={()=>setReleaseId(null)}>Keep employee</button><button style={{...bigBtn,background:C.red}} onClick={()=>{firePersonnel(person.id);setReleaseId(null)}}>Confirm release</button></div></div></div>; })()}
  </div>;
}

function CandidateCard({ world, candidate: c, review }: { world: World; candidate: TalentCandidate; review: () => void }) {
  return <div className="candidate-card" style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 13, padding: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div className="person-identity"><PersonMark name={c.name} role={c.role}/><div><b>{c.name}</b><div style={{ color: C.violet, fontSize: 12 }}>{c.title}</div></div></div><div style={{ color: C.faint, fontSize: 12, textAlign: "right" }}>{fmtMoney(c.salaryAsk)}/mo<br/>Age {c.age}</div></div>
    <div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>Specialty: <b>{specialtyLabel(c.specialty)}</b></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5, marginTop: 8 }}><Mini label="Skill" value={c.skill}/><Mini label="Potential" value={c.potential}/><Mini label="Execution" value={c.attributes.execution}/><Mini label="Commercial" value={c.attributes.commercial}/></div>
    <div style={{ color: C.faint, fontSize: 9.5, marginTop: 8 }}>{c.traits.join(" · ")}</div>
    <button style={{ ...bigBtn, width: "100%", marginTop: 9 }} onClick={review}>Review contract</button>
  </div>;
}

function PersonMark({name,role}:{name:string;role:PersonnelRole}) { const initials=name.split(/\s+/).slice(0,2).map((p)=>p[0]).join(""); const icon:Record<PersonnelRole,string>={product_manager:"📦",marketing:"📣",operations:"⚙️",finance:"💰",strategy:"♟️",innovation:"🔬"}; return <div className={`person-mark role-${role}`} aria-label={ROLE_LABELS[role]}><b>{initials}</b><span>{icon[role]}</span></div>; }

function compatibleOfficeSeats(world: World, candidate: TalentCandidate) {
  return world.player.operatingRooms.filter((r) => {
    if (r.kind !== "office" || !roleFitsRoom(candidate.role, r)) return false;
    const limit = r.id === "founder-office" ? Math.max(0, r.capacity - 1) : r.capacity;
    return r.assignedPersonnelIds.length < limit;
  });
}
function ContractMetric({ label, value }: { label: string; value: string }) { return <div style={{ border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 10, padding: 10 }}><div style={{ color: C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><b style={{ display: "block", fontSize: 13, marginTop: 3 }}>{value}</b></div>; }
function Mini({ label, value }: { label: string; value: number }) { const n = starsFor(value); return <div style={{ fontSize: 12 }}><span style={{ color: C.faint }}>{label}</span><div style={{ color: C.amber, fontSize: 14, letterSpacing: 1 }}>{"★".repeat(n)}<span style={{ color: C.grid }}>{"★".repeat(5-n)}</span></div></div>; }
function specialtyLabel(key: string | null | undefined) { return key ? archetypeByKey(key)?.label ?? key : "Generalist"; }
const tabBtn: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 999, padding: "10px 16px", minHeight:44, fontSize: 13, fontWeight: 800, cursor: "pointer" };
const panelStyle: React.CSSProperties = { background: "white", border: `1px solid ${C.line}`, borderRadius: 14, padding: 15, boxShadow: "0 5px 18px rgba(20,53,84,.05)" };
const eyebrow: React.CSSProperties = { color: C.cyan, fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
const h2: React.CSSProperties = { margin: "3px 0 4px", fontSize: 18 };
const copy: React.CSSProperties = { margin: 0, color: C.dim, fontSize: 13, lineHeight: 1.55, maxWidth: 720 };
const fieldStyle: React.CSSProperties = { display: "grid", gap: 6, color: C.dim, fontSize: 12, fontWeight: 700 };
const selectStyle: React.CSSProperties = { width: "100%", minHeight:44, border: `1px solid ${C.line}`, background: "white", color: C.ink, borderRadius: 9, padding: "10px 11px", boxSizing: "border-box", fontSize:14 };

const peopleCss = `
.people-playset{--people-shadow:0 12px 30px rgba(14,46,75,.10)}
.people-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(260px,1fr) auto;gap:20px;align-items:center;padding:20px 22px;border-radius:18px;color:white;background:radial-gradient(circle at 12% 20%,rgba(115,213,255,.32),transparent 26%),linear-gradient(135deg,#102f58,#235e92 58%,#6650bd);box-shadow:0 16px 38px rgba(8,37,68,.22)}
.people-hero:after{content:'';position:absolute;inset:auto -8% -80% 44%;height:190px;background:radial-gradient(ellipse,rgba(255,255,255,.18),transparent 65%);pointer-events:none}.people-hero-art{display:flex;align-items:end;isolation:isolate}.people-hero-art span{display:grid;place-items:center;width:64px;height:76px;margin-right:-14px;border:2px solid rgba(255,255,255,.55);border-radius:25px 25px 17px 17px;background:linear-gradient(160deg,#f5fbff,#b8dcf4);box-shadow:0 9px 20px rgba(1,20,42,.24);font-size:29px}.people-hero-art span:nth-child(2){width:76px;height:90px;z-index:2;background:linear-gradient(160deg,#fff0f8,#e7c7ff)}.people-hero-copy{position:relative;z-index:1}.people-kicker{font-size:11px;font-weight:950;letter-spacing:1.35px;color:#9fe3ff}.people-hero h2{font-size:24px;line-height:1.1;margin:5px 0 6px}.people-hero p{max-width:650px;margin:0;color:#d8ebf8;font-size:13px;line-height:1.5}.people-hero-metrics{display:grid;grid-template-columns:repeat(3,minmax(88px,1fr));gap:7px;position:relative;z-index:1}.people-hero-metrics>div{padding:10px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(4,28,55,.25);backdrop-filter:blur(8px)}.people-hero-metrics small{display:block;font-size:9px;font-weight:900;color:#9fe3ff;letter-spacing:.7px}.people-hero-metrics b{display:block;font-size:22px;margin-top:2px}.people-hero-metrics span{font-size:10px;color:#d4e5f3}.people-panel{box-shadow:var(--people-shadow)!important}.search-mode{position:relative;min-height:138px;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}.search-mode:not(:disabled):hover{transform:translateY(-3px);box-shadow:0 12px 24px rgba(55,49,130,.12)}.search-mode:not(:disabled):active{transform:translateY(0) scale(.985)}.search-mode:focus-visible,.people-playset button:focus-visible,.people-playset select:focus-visible{outline:3px solid rgba(39,162,229,.35);outline-offset:2px}.search-mode-icon{display:grid;place-items:center;width:38px;height:38px;margin-bottom:9px;border-radius:11px;background:linear-gradient(145deg,#fff,#e7f2fb);box-shadow:0 5px 12px rgba(22,63,100,.12);font-size:20px}.candidate-card,.employee-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.candidate-card:hover,.employee-card:hover{transform:translateY(-2px);border-color:#a5c7df!important;box-shadow:0 10px 24px rgba(16,56,88,.10)}.person-identity{display:flex;align-items:center;gap:10px;min-width:0}.person-mark{position:relative;flex:0 0 auto;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:white;background:linear-gradient(145deg,#248fd2,#6352bd);box-shadow:0 7px 16px rgba(40,67,138,.22)}.person-mark>b{font-size:15px}.person-mark>span{position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;display:grid;place-items:center;border:2px solid white;border-radius:8px;background:#edf6fc;font-size:12px}.people-playset button{min-height:44px;transition:transform .14s ease,filter .14s ease,box-shadow .14s ease}.people-playset button:not(:disabled):active{transform:scale(.975)}.people-dialog-backdrop{position:fixed;z-index:230;inset:0;display:grid;place-items:center;padding:18px;background:rgba(3,18,34,.72);backdrop-filter:blur(8px)}.people-confirm{width:min(480px,96vw);padding:25px;border:1px solid rgba(255,255,255,.75);border-radius:22px;background:linear-gradient(155deg,#fff,#f3f8fc);box-shadow:0 30px 90px rgba(0,10,24,.48);text-align:center;animation:peopleRise .24s cubic-bezier(.2,.9,.25,1)}.people-confirm-icon{font-size:42px}.people-confirm h2{font-size:24px;margin:7px 0}.people-confirm p{font-size:13px;line-height:1.55;color:${C.dim};margin:0}.people-confirm-actions{display:flex;justify-content:center;gap:9px;margin-top:18px}.people-confirm-actions button{flex:1}@keyframes peopleRise{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
.people-playset [style*="font-size: 9"],.people-playset [style*="font-size: 10"]{font-size:12px!important}.people-playset [style*="font-size: 11"]{font-size:12.5px!important}
@media(max-width:900px){.people-hero{grid-template-columns:auto 1fr}.people-hero-metrics{grid-column:1/-1}.people-hero-art span{width:54px;height:66px}.people-hero-art span:nth-child(2){width:65px;height:78px}}
@media(max-width:600px){.people-hero{grid-template-columns:1fr;padding:17px}.people-hero-art{display:none}.people-hero h2{font-size:21px}.people-hero-metrics{grid-template-columns:repeat(3,1fr)}.people-hero-metrics>div{padding:9px 7px}.people-hero-metrics small{font-size:10px}.people-hero-metrics b{font-size:19px}.people-hero-metrics span{font-size:11px}.people-tabs{overflow-x:auto}.people-tabs button{flex:1;white-space:nowrap}.people-contract-backdrop{padding:0!important;align-items:end!important}.people-contract{box-sizing:border-box;width:100%!important;max-height:calc(100dvh - 12px)!important;border-radius:20px 20px 0 0!important;padding:18px 13px calc(18px + env(safe-area-inset-bottom))!important}.people-confirm{width:100%;box-sizing:border-box}.people-confirm-actions{flex-direction:column-reverse}.candidate-card>div:first-child,.employee-card>div:first-child{align-items:flex-start}.people-playset button{font-size:13px}}
`;
