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
exports.Home = Home;
exports.SetupWizard = SetupWizard;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var industries_1 = require("../../engine/industries");
var difficulty_1 = require("../../engine/difficulty");
function Home(_a) {
    var onStart = _a.onStart, onContinue = _a.onContinue, canContinue = _a.canContinue;
    return (<components_1.Center>
      <div style={{ width: "min(760px, 96vw)", textAlign: "center", background: "linear-gradient(180deg,#10385f 0%,#0a2848 100%)", border: "1px solid rgba(132,200,244,.25)", borderRadius: 24, padding: "clamp(28px,7vw,46px) clamp(18px,6vw,38px) clamp(26px,6vw,40px)", boxShadow: "0 28px 70px rgba(7,35,63,.28), inset 0 1px 0 rgba(255,255,255,.09)", color: "#fff" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "linear-gradient(145deg,#61c9ff,#2783ce)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 10px 24px rgba(0,0,0,.24)", fontWeight: 950, fontSize: 23 }}>BE</div>
        <div style={{ fontSize: 11, color: "#84d3ff", letterSpacing: 4.5, marginBottom: 8, fontWeight: 850 }}>BUSINESS EMPIRE</div>
        <h1 style={{ fontSize: "clamp(30px,10vw,42px)", lineHeight: 1.04, margin: "0 0 13px", fontWeight: 900, letterSpacing: -1.4 }}>Build products.<br />Build brands. Build an empire.</h1>
        <p style={{ color: "#b6cee1", fontSize: 14, lineHeight: 1.65, margin: "0 auto 30px", maxWidth: 610 }}>
          Start with one company, learn what customers actually want, survive your mistakes and turn the right bets into a portfolio of businesses.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {canContinue && <button style={__assign(__assign({}, theme_1.bigBtn), { minWidth: 190 })} onClick={onContinue}>▶ Continue company</button>}
          <button style={__assign(__assign({}, theme_1.bigBtn), { minWidth: 170, background: "rgba(255,255,255,.08)", color: "#e8f5ff", border: "1px solid rgba(150,207,244,.25)", boxShadow: "none" })} onClick={onStart}>{canContinue ? "＋ New company" : "▶ Start company"}</button>
        </div>
      </div>
    </components_1.Center>);
}
function SetupWizard(_a) {
    var onLaunch = _a.onLaunch;
    var _b = (0, react_1.useState)(0), step = _b[0], setStep = _b[1];
    var _c = (0, react_1.useState)(null), industryId = _c[0], setIndustryId = _c[1];
    var _d = (0, react_1.useState)(""), company = _d[0], setCompany = _d[1];
    var _e = (0, react_1.useState)("standard"), difficulty = _e[0], setDifficulty = _e[1];
    return (<components_1.Center>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {["Industry & Difficulty", "Company"].map(function (_, i) { return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? theme_1.C.cyan : theme_1.C.line }}/>; })}
        </div>
        {step === 0 && (<components_1.Panel title="Choose your industry">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {Object.values(industries_1.INDUSTRIES).map(function (ind) { return (<components_1.ChoiceCard key={ind.id} active={industryId === ind.id} onClick={function () { return setIndustryId(ind.id); }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{ind.label}</div>
                  <div style={{ color: theme_1.C.dim, fontSize: 12 }}>Matters most: {Object.entries(ind.axisWeight).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 2).map(function (_a) {
                var k = _a[0];
                return k;
            }).join(", ")}</div>
                </components_1.ChoiceCard>); })}
            </div>
            <div style={{ marginTop: 18 }}>
              <components_1.FieldLabel>Difficulty</components_1.FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                {Object.values(difficulty_1.DIFFICULTIES).map(function (d) { return (<components_1.ChoiceCard key={d.id} active={difficulty === d.id} onClick={function () { return setDifficulty(d.id); }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{d.label}</div>
                    <div style={{ color: theme_1.C.green, fontFamily: "ui-monospace", fontSize: 12, marginBottom: 5 }}>${(d.startingCash / 1e6).toFixed(d.startingCash < 1000000 ? 2 : 1)}M start</div>
                    <div style={{ color: theme_1.C.dim, fontSize: 11, lineHeight: 1.4 }}>{d.description}</div>
                    <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 6 }}>{d.investorExpectations > 0 ? "".concat(d.graceQuarters, "Q grace \u00B7 investor expectations") : "No outside expectations"}</div>
                  </components_1.ChoiceCard>); })}
              </div>
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}><button style={theme_1.bigBtn} disabled={!industryId} onClick={function () { return setStep(1); }}>Next →</button></div>
          </components_1.Panel>)}
        {step === 1 && (<components_1.Panel title="Name your company">
            <components_1.FieldLabel>Company name</components_1.FieldLabel>
            <components_1.TextInput placeholder="e.g. Meridian Holdings" value={company} onChange={function (e) { return setCompany(e.target.value); }}/>
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), color: theme_1.C.dim, fontSize: 12, lineHeight: 1.55 }}>
              You are not creating a brand yet. The game begins on an empty lot. Build your first office, then create the brand and logo from inside the company.
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button style={theme_1.ctrlBtn} onClick={function () { return setStep(0); }}>← Back</button>
              <button style={theme_1.bigBtn} disabled={!company.trim()} onClick={function () { return onLaunch(industryId, company.trim(), difficulty); }}>Start on the empty lot →</button>
            </div>
          </components_1.Panel>)}
      </div>
    </components_1.Center>);
}
