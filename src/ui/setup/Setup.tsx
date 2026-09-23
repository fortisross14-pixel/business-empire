import React, { useState } from "react";
import { C, bigBtn, ctrlBtn } from "../theme";
import { Panel, ChoiceCard, Center, FieldLabel, TextInput } from "../components";
import { INDUSTRIES } from "../../engine/industries";
import type { DifficultyId } from "../../engine/types";
import { DIFFICULTIES } from "../../engine/difficulty";

export function Home({ onStart, onContinue, canContinue }: { onStart: () => void; onContinue: () => void; canContinue: boolean }) {
  return (
    <Center>
      <div style={{ width: "min(760px, 96vw)", textAlign: "center", background: "linear-gradient(180deg,#10385f 0%,#0a2848 100%)", border: "1px solid rgba(132,200,244,.25)", borderRadius: 24, padding: "clamp(28px,7vw,46px) clamp(18px,6vw,38px) clamp(26px,6vw,40px)", boxShadow: "0 28px 70px rgba(7,35,63,.28), inset 0 1px 0 rgba(255,255,255,.09)", color: "#fff" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "linear-gradient(145deg,#61c9ff,#2783ce)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 10px 24px rgba(0,0,0,.24)", fontWeight: 950, fontSize: 23 }}>BE</div>
        <div style={{ fontSize: 11, color: "#84d3ff", letterSpacing: 4.5, marginBottom: 8, fontWeight: 850 }}>BUSINESS EMPIRE</div>
        <h1 style={{ fontSize: "clamp(30px,10vw,42px)", lineHeight: 1.04, margin: "0 0 13px", fontWeight: 900, letterSpacing: -1.4 }}>Build products.<br />Build brands. Build an empire.</h1>
        <p style={{ color: "#b6cee1", fontSize: 14, lineHeight: 1.65, margin: "0 auto 30px", maxWidth: 610 }}>
          Start with one company, learn what customers actually want, survive your mistakes and turn the right bets into a portfolio of businesses.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {canContinue && <button style={{ ...bigBtn, minWidth: 190 }} onClick={onContinue}>▶ Continue company</button>}
          <button style={{ ...bigBtn, minWidth: 170, background: "rgba(255,255,255,.08)", color: "#e8f5ff", border: "1px solid rgba(150,207,244,.25)", boxShadow: "none" }} onClick={onStart}>{canContinue ? "＋ New company" : "▶ Start company"}</button>
        </div>
      </div>
    </Center>
  );
}

export function SetupWizard({ onLaunch }: { onLaunch: (id: string, company: string, difficulty: DifficultyId) => void }) {
  const [step, setStep] = useState(0);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyId>("standard");

  return (
    <Center>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {["Industry & Difficulty", "Company"].map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.cyan : C.line }} />)}
        </div>
        {step === 0 && (
          <Panel title="Choose your industry">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
              {Object.values(INDUSTRIES).map((ind) => (
                <ChoiceCard key={ind.id} active={industryId === ind.id} onClick={() => setIndustryId(ind.id)}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{ind.label}</div>
                  <div style={{ color: C.dim, fontSize: 12 }}>Matters most: {Object.entries(ind.axisWeight).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ")}</div>
                </ChoiceCard>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <FieldLabel>Difficulty</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                {Object.values(DIFFICULTIES).map((d) => (
                  <ChoiceCard key={d.id} active={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{d.label}</div>
                    <div style={{ color: C.green, fontFamily: "ui-monospace", fontSize: 12, marginBottom: 5 }}>${(d.startingCash / 1e6).toFixed(d.startingCash < 1_000_000 ? 2 : 1)}M start</div>
                    <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.4 }}>{d.description}</div>
                    <div style={{ color: C.faint, fontSize: 10.5, marginTop: 6 }}>{d.investorExpectations > 0 ? `${d.graceQuarters}Q grace · investor expectations` : "No outside expectations"}</div>
                  </ChoiceCard>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, textAlign: "right" }}><button style={bigBtn} disabled={!industryId} onClick={() => setStep(1)}>Next →</button></div>
          </Panel>
        )}
        {step === 1 && (
          <Panel title="Name your company">
            <FieldLabel>Company name</FieldLabel>
            <TextInput placeholder="e.g. Meridian Holdings" value={company} onChange={(e) => setCompany(e.target.value)} />
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: C.panel2, border: `1px solid ${C.line}`, color: C.dim, fontSize: 12, lineHeight: 1.55 }}>
              You are not creating a brand yet. The game begins on an empty lot. Build your first office, then create the brand and logo from inside the company.
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button style={ctrlBtn} onClick={() => setStep(0)}>← Back</button>
              <button style={bigBtn} disabled={!company.trim()} onClick={() => onLaunch(industryId!, company.trim(), difficulty)}>Start on the empty lot →</button>
            </div>
          </Panel>
        )}
      </div>
    </Center>
  );
}
