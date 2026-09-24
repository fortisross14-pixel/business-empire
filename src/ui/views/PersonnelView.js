"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelView = PersonnelView;
var react_1 = require("react");
var theme_1 = require("../theme");
var industries_1 = require("../../engine/industries");
var people_1 = require("../../engine/people");
var productCatalog_1 = require("../../engine/productCatalog");
var infrastructure_1 = require("../../engine/infrastructure");
var ROLES = ["product_manager", "marketing", "operations", "finance", "strategy", "innovation"];
var MODES = ["quick", "online", "deep"];
function PersonnelView(_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var world = _a.world, hireCandidate = _a.hireCandidate, startRecruitingSearch = _a.startRecruitingSearch, promotePersonnel = _a.promotePersonnel, trainPersonnel = _a.trainPersonnel, firePersonnel = _a.firePersonnel;
    var staff = world.player.personnel;
    var activeIndustries = Object.values((_b = world.player.businesses) !== null && _b !== void 0 ? _b : {}).filter(function (b) { return (b === null || b === void 0 ? void 0 : b.status) === "active"; }).map(function (b) { return b.industryId; });
    var _j = (0, react_1.useState)("product_manager"), role = _j[0], setRole = _j[1];
    var _k = (0, react_1.useState)((_c = activeIndustries[0]) !== null && _c !== void 0 ? _c : world.industryId), industryId = _k[0], setIndustryId = _k[1];
    var _l = (0, react_1.useState)(((_e = (_d = world.player.research) === null || _d === void 0 ? void 0 : _d.completed) !== null && _e !== void 0 ? _e : []).includes("professional_recruiting") ? "online" : "quick"), mode = _l[0], setMode = _l[1];
    var _m = (0, react_1.useState)(null), message = _m[0], setMessage = _m[1];
    var _o = (0, react_1.useState)("hiring"), tab = _o[0], setTab = _o[1];
    var _p = (0, react_1.useState)(null), contractCandidateId = _p[0], setContractCandidateId = _p[1];
    var _q = (0, react_1.useState)(""), contractRoomId = _q[0], setContractRoomId = _q[1];
    var _r = (0, react_1.useState)(null), contractMessage = _r[0], setContractMessage = _r[1];
    var _s = (0, react_1.useState)(null), trainingMessage = _s[0], setTrainingMessage = _s[1];
    var search = world.player.talentSearch;
    var slate = (_f = world.player.talentMarket) !== null && _f !== void 0 ? _f : [];
    var seatedIds = new Set(world.player.operatingRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    var openRoleSeats = (0, infrastructure_1.openSeatCountForRole)(world, role);
    var start = function () { var _a; var r = startRecruitingSearch(role, industryId, mode); setMessage(r.ok ? "Agency brief sent." : (_a = r.reason) !== null && _a !== void 0 ? _a : "Could not start search."); };
    return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "flex", gap: 6, borderBottom: "1px solid ".concat(theme_1.C.line), paddingBottom: 8 }}>
      <button onClick={function () { return setTab("hiring"); }} style={__assign(__assign({}, tabBtn), { borderColor: tab === "hiring" ? theme_1.C.violet : theme_1.C.line, color: tab === "hiring" ? theme_1.C.violet : theme_1.C.dim, background: tab === "hiring" ? "#f5f3ff" : "white" })}>Hiring {search ? "\u00B7 ".concat(Math.ceil(search.daysLeft), "d") : slate.length ? "\u00B7 ".concat(slate.length, " candidates") : ""}</button>
      <button onClick={function () { return setTab("employees"); }} style={__assign(__assign({}, tabBtn), { borderColor: tab === "employees" ? theme_1.C.violet : theme_1.C.line, color: tab === "employees" ? theme_1.C.violet : theme_1.C.dim, background: tab === "employees" ? "#f5f3ff" : "white" })}>Employees · {staff.length}</button>
    </div>

    {tab === "hiring" && <>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
          <div><div style={eyebrow}>RECRUITING AGENCY</div><h2 style={h2}>Find people</h2><p style={copy}>Tell the agency what role and industry you need. Faster searches are cheaper and shallower; a deep search takes time but reaches stronger candidates.</p></div>
          <div style={{ textAlign: "right" }}><b>{staff.length}</b><div style={{ color: theme_1.C.faint, fontSize: 10 }}>employees</div></div>
        </div>

        {search ? <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "#eff8ff", border: "1px solid #bae0f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b>{people_1.TALENT_SEARCH_MODES[search.mode].label}</b><div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 3 }}>{people_1.ROLE_LABELS[search.role]} · {(_h = (_g = industries_1.INDUSTRIES[search.industryId]) === null || _g === void 0 ? void 0 : _g.label) !== null && _h !== void 0 ? _h : search.industryId}</div></div><b style={{ color: theme_1.C.cyan }}>{Math.ceil(search.daysLeft)} days</b></div>
          <div style={{ height: 8, background: "#dceaf5", borderRadius: 99, marginTop: 10 }}><div style={{ width: "".concat(Math.max(3, (1 - search.daysLeft / search.totalDays) * 100), "%"), height: "100%", background: theme_1.C.cyan, borderRadius: 99 }}/></div>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 6 }}>The agency is building the slate. Simulation time must pass.</div>
        </div> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9, marginTop: 14 }}>
            <label style={fieldStyle}>Role<select value={role} onChange={function (e) { return setRole(e.target.value); }} style={selectStyle}>{ROLES.map(function (r) { return <option key={r} value={r}>{people_1.ROLE_LABELS[r]}</option>; })}</select></label>
            <label style={fieldStyle}>Industry<select value={industryId} onChange={function (e) { return setIndustryId(e.target.value); }} style={selectStyle}>{activeIndustries.map(function (id) { var _a, _b; return <option key={id} value={id}>{(_b = (_a = industries_1.INDUSTRIES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id}</option>; })}</select></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8, marginTop: 12 }}>
            {MODES.map(function (m) { var _a, _b, _c, _d; var d = people_1.TALENT_SEARCH_MODES[m]; var on = mode === m; var gate = m === "online" && !((_b = (_a = world.player.research) === null || _a === void 0 ? void 0 : _a.completed) !== null && _b !== void 0 ? _b : []).includes("professional_recruiting") ? "Research People & HR Foundations first." : m === "deep" && !((_d = (_c = world.player.research) === null || _c === void 0 ? void 0 : _c.completed) !== null && _d !== void 0 ? _d : []).includes("executive_search") ? "Research Executive Search first." : null; return <button key={m} disabled={Boolean(gate)} title={gate !== null && gate !== void 0 ? gate : undefined} onClick={function () { return setMode(m); }} style={{ textAlign: "left", cursor: gate ? "default" : "pointer", padding: 12, borderRadius: 11, background: on ? "#f5f3ff" : theme_1.C.panel2, border: "1px solid ".concat(on ? theme_1.C.violet : theme_1.C.line), color: theme_1.C.ink, opacity: gate ? .5 : 1 }}><b style={{ fontSize: 12 }}>{d.label}</b><div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 4, lineHeight: 1.4 }}>{d.blurb}</div><div style={{ color: gate ? theme_1.C.amber : on ? theme_1.C.violet : theme_1.C.faint, fontSize: 10, fontWeight: 800, marginTop: 7 }}>{gate !== null && gate !== void 0 ? gate : "".concat(d.days, " days \u00B7 ").concat((0, theme_1.fmtMoney)(d.cost))}</div></button>; })}
          </div>
          <button disabled={openRoleSeats <= 0} title={openRoleSeats <= 0 ? "Expand an office or build another compatible office before recruiting." : undefined} style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 10, opacity: openRoleSeats > 0 ? 1 : .45 })} onClick={start}>Contact agency</button>
          {openRoleSeats <= 0 && <div style={{ color: theme_1.C.amber, fontSize: 10.5, marginTop: 6 }}>↳ No compatible desk is open for this role. Expand an office or build another one first.</div>}
        </>}
        {message && !search && <div style={{ color: message.includes("sent") ? theme_1.C.green : theme_1.C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
      </section>

      {slate.length > 0 && !search && <section style={panelStyle}>
        <div style={eyebrow}>SEARCH RESULTS</div><h2 style={h2}>Candidate slate</h2><p style={copy}>This slate stays available until you start another search. Hire the person you want; the others remain available for now.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 9, marginTop: 12 }}>{slate.map(function (c) { return <CandidateCard key={c.id} world={world} candidate={c} review={function () { var _a, _b; var compatible = compatibleOfficeSeats(world, c); setContractCandidateId(c.id); setContractRoomId((_b = (_a = compatible[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : ""); setContractMessage(null); }}/>; })}</div>
      </section>}
    </>}

    {tab === "employees" && <section style={panelStyle}>
      <div style={eyebrow}>YOUR TEAM</div><h2 style={h2}>Employees</h2><p style={copy}>Review your permanent team here. Office assignment happens from the campus building itself, so staffing has one clear home.</p>
      {trainingMessage && <div style={{ color: trainingMessage.startsWith("✓") ? theme_1.C.green : theme_1.C.amber, fontSize: 10.5, marginTop: 9 }}>{trainingMessage}</div>}
      {staff.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 12, marginTop: 12 }}>No employees yet. The founder does not consume a staff slot. Go to Hiring to brief a recruiting agency.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 12 }}>{staff.map(function (p) {
                    var _a, _b;
                    var room = world.player.operatingRooms.find(function (r) { return r.assignedPersonnelIds.includes(p.id); });
                    var training = ((_a = world.player.trainingPrograms) !== null && _a !== void 0 ? _a : []).find(function (t) { return t.personnelId === p.id; });
                    var hasTrainingRoom = world.player.operatingRooms.some(function (r) { return r.facilityType === "training_center"; });
                    return <div key={p.id} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 11, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{p.name}</b><div style={{ color: theme_1.C.violet, fontSize: 10.5 }}>{p.title}</div></div><div style={{ color: theme_1.C.faint, fontSize: 9.5, textAlign: "right" }}>{(0, theme_1.fmtMoney)(p.salary)}/mo<br />Age {p.age}</div></div>
          <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 7 }}>{specialtyLabel(p.specialty)} · {(_b = room === null || room === void 0 ? void 0 : room.name) !== null && _b !== void 0 ? _b : <span style={{ color: theme_1.C.amber }}>Unassigned</span>}</div>
          {training && <div style={{ marginTop: 8, padding: 8, borderRadius: 8, border: "1px solid ".concat(theme_1.C.line), background: "white" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5 }}><b>🎓 Upskilling</b><span>{Math.ceil(training.daysLeft)}d</span></div><div style={{ height: 5, background: theme_1.C.grid, borderRadius: 99, marginTop: 6 }}><div style={{ width: "".concat(Math.max(3, (1 - training.daysLeft / training.totalDays) * 100), "%"), height: "100%", background: theme_1.C.violet, borderRadius: 99 }}/></div></div>}
          <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}><button style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1 })} onClick={function () { return promotePersonnel(p.id); }}>Promote</button><button disabled={Boolean(training) || !hasTrainingRoom} title={!hasTrainingRoom ? "Build a Training Room first." : training ? "This employee is already training." : undefined} style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1, color: theme_1.C.violet, opacity: training || !hasTrainingRoom ? .45 : 1 })} onClick={function () { var _a; var result = trainPersonnel(p.id); setTrainingMessage(result.ok ? "\u2713 ".concat(p.name, " started training").concat(result.days ? " \u00B7 ".concat(result.days, " days") : "", ".") : (_a = result.reason) !== null && _a !== void 0 ? _a : "Could not start training."); }}>Train</button><button style={__assign(__assign({}, theme_1.ctrlBtn), { color: theme_1.C.red })} onClick={function () { return firePersonnel(p.id); }}>Release</button></div>
          {!seatedIds.has(p.id) && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 6 }}>Assign this person to an office from the campus.</div>}
        </div>;
                })}</div>}
    </section>}

    {contractCandidateId && (function () {
            var _a, _b, _c, _d;
            var candidate = slate.find(function (c) { return c.id === contractCandidateId; });
            if (!candidate)
                return null;
            var rooms = compatibleOfficeSeats(world, candidate);
            var room = (_a = rooms.find(function (r) { return r.id === contractRoomId; })) !== null && _a !== void 0 ? _a : rooms[0];
            var seatNo = room ? (room.id === "founder-office" ? room.assignedPersonnelIds.length + 2 : room.assignedPersonnelIds.length + 1) : 0;
            return <div style={{ position: "fixed", inset: 0, background: "rgba(8,28,48,.42)", display: "grid", placeItems: "center", padding: 14, zIndex: 90 }} onMouseDown={function (e) { if (e.target === e.currentTarget)
                setContractCandidateId(null); }}>
        <div style={{ width: "min(520px,96vw)", maxHeight: "88dvh", overflowY: "auto", background: "white", borderRadius: 16, border: "1px solid ".concat(theme_1.C.line), boxShadow: "0 24px 70px rgba(8,28,48,.28)", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><div style={eyebrow}>EMPLOYMENT CONTRACT</div><h2 style={__assign(__assign({}, h2), { marginBottom: 3 })}>{candidate.name}</h2><div style={{ color: theme_1.C.violet, fontWeight: 800, fontSize: 12 }}>{candidate.title}</div></div><button style={theme_1.ctrlBtn} onClick={function () { return setContractCandidateId(null); }}>✕</button></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
            <ContractMetric label="Monthly salary" value={(0, theme_1.fmtMoney)(candidate.salaryAsk)}/>
            <ContractMetric label="Role" value={people_1.ROLE_LABELS[candidate.role]}/>
            <ContractMetric label="Industry" value={(_c = (_b = industries_1.INDUSTRIES[world.industryId]) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : world.industryId}/>
            <ContractMetric label="Specialty" value={specialtyLabel(candidate.specialty)}/>
          </div>
          <label style={__assign(__assign({}, fieldStyle), { marginTop: 14 })}>Workplace<select value={(_d = room === null || room === void 0 ? void 0 : room.id) !== null && _d !== void 0 ? _d : ""} onChange={function (e) { return setContractRoomId(e.target.value); }} style={selectStyle}>{rooms.map(function (r) { var limit = r.id === "founder-office" ? r.capacity - 1 : r.capacity; return <option key={r.id} value={r.id}>{r.name} · {r.assignedPersonnelIds.length}/{limit} staff seats used</option>; })}</select></label>
          {room ? <div style={{ marginTop: 9, border: "1px solid ".concat(theme_1.C.line), borderRadius: 11, padding: 11, background: theme_1.C.panel2 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b>Assigned position</b><div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 3 }}>{room.name} · Desk {seatNo} of {room.capacity}</div></div><span style={{ color: theme_1.C.green, fontWeight: 900 }}>OPEN</span></div>{room.id === "founder-office" && <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 6 }}>Desk 1 belongs permanently to the Founder / CEO. The remaining three desks can host different startup functions.</div>}</div> : <div style={{ color: theme_1.C.amber, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 10, marginTop: 12, fontSize: 11 }}>No compatible open desk exists. Build or expand an office before signing this person.</div>}
          {contractMessage && <div style={{ color: theme_1.C.amber, fontSize: 10.5, marginTop: 8 }}>{contractMessage}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><button style={theme_1.ctrlBtn} onClick={function () { return setContractCandidateId(null); }}>Cancel</button><button disabled={!room} style={__assign(__assign({}, theme_1.bigBtn), { opacity: room ? 1 : .45 })} onClick={function () { var _a; if (!room)
                return; var result = hireCandidate(candidate.id, room.id); if (result.ok) {
                setContractCandidateId(null);
                setTab("employees");
            }
            else
                setContractMessage((_a = result.reason) !== null && _a !== void 0 ? _a : "Could not sign contract."); }}>Sign contract</button></div>
        </div>
      </div>;
        })()}
  </div>;
}
function CandidateCard(_a) {
    var world = _a.world, c = _a.candidate, review = _a.review;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 11, padding: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><div><b>{c.name}</b><div style={{ color: theme_1.C.violet, fontSize: 10.5 }}>{c.title}</div></div><div style={{ color: theme_1.C.faint, fontSize: 9.5, textAlign: "right" }}>{(0, theme_1.fmtMoney)(c.salaryAsk)}/mo<br />Age {c.age}</div></div>
    <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 7 }}>Specialty: <b>{specialtyLabel(c.specialty)}</b></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 5, marginTop: 8 }}><Mini label="Skill" value={c.skill}/><Mini label="Potential" value={c.potential}/><Mini label="Execution" value={c.attributes.execution}/><Mini label="Commercial" value={c.attributes.commercial}/></div>
    <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 8 }}>{c.traits.join(" · ")}</div>
    <button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 9 })} onClick={review}>Review contract</button>
  </div>;
}
function compatibleOfficeSeats(world, candidate) {
    return world.player.operatingRooms.filter(function (r) {
        if (r.kind !== "office" || !(0, infrastructure_1.roleFitsRoom)(candidate.role, r))
            return false;
        var limit = r.id === "founder-office" ? Math.max(0, r.capacity - 1) : r.capacity;
        return r.assignedPersonnelIds.length < limit;
    });
}
function ContractMetric(_a) {
    var label = _a.label, value = _a.value;
    return <div style={{ border: "1px solid ".concat(theme_1.C.line), background: theme_1.C.panel2, borderRadius: 9, padding: 9 }}><div style={{ color: theme_1.C.faint, fontSize: 9, textTransform: "uppercase", letterSpacing: .5 }}>{label}</div><b style={{ fontSize: 11.5 }}>{value}</b></div>;
}
function Mini(_a) {
    var label = _a.label, value = _a.value;
    var n = (0, people_1.starsFor)(value);
    return <div style={{ fontSize: 9.5 }}><span style={{ color: theme_1.C.faint }}>{label}</span><div style={{ color: theme_1.C.amber }}>{"★".repeat(n)}<span style={{ color: theme_1.C.grid }}>{"★".repeat(5 - n)}</span></div></div>;
}
function specialtyLabel(key) { var _a, _b; return key ? (_b = (_a = (0, productCatalog_1.archetypeByKey)(key)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : key : "Generalist"; }
var tabBtn = { border: "1px solid ".concat(theme_1.C.line), borderRadius: 999, padding: "7px 11px", fontSize: 11, fontWeight: 800, cursor: "pointer" };
var panelStyle = { background: "white", border: "1px solid ".concat(theme_1.C.line), borderRadius: 14, padding: 15, boxShadow: "0 5px 18px rgba(20,53,84,.05)" };
var eyebrow = { color: theme_1.C.cyan, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
var h2 = { margin: "3px 0 4px", fontSize: 18 };
var copy = { margin: 0, color: theme_1.C.dim, fontSize: 11.5, lineHeight: 1.5, maxWidth: 720 };
var fieldStyle = { display: "grid", gap: 5, color: theme_1.C.dim, fontSize: 10.5, fontWeight: 700 };
var selectStyle = { width: "100%", border: "1px solid ".concat(theme_1.C.line), background: "white", color: theme_1.C.ink, borderRadius: 8, padding: "8px 9px", boxSizing: "border-box" };
