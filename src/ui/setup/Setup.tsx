import React, { useState } from "react";
import { C, bigBtn, ctrlBtn } from "../theme";
import { Panel, ChoiceCard, Center, FieldLabel, TextInput } from "../components";
import { INDUSTRIES, BRAND_COLORS, POSITIONINGS } from "../../engine/industries";
import type { Brand, DifficultyId } from "../../engine/types";
import { DIFFICULTIES } from "../../engine/difficulty";

export function Home({ onStart, onContinue, canContinue }: { onStart: () => void; onContinue: () => void; canContinue: boolean }) {
  return (
    <Center>
      <div style={{ width: "min(760px, 96vw)", textAlign: "center", background: "linear-gradient(180deg,#10385f 0%,#0a2848 100%)", border: "1px solid rgba(132,200,244,.25)", borderRadius: 24, padding: "46px 38px 40px", boxShadow: "0 28px 70px rgba(7,35,63,.28), inset 0 1px 0 rgba(255,255,255,.09)", color: "#fff" }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", display: "grid", placeItems: "center", background: "linear-gradient(145deg,#61c9ff,#2783ce)", border: "1px solid rgba(255,255,255,.35)", boxShadow: "0 10px 24px rgba(0,0,0,.24)", fontWeight: 950, fontSize: 23 }}>BE</div>
        <div style={{ fontSize: 11, color: "#84d3ff", letterSpacing: 4.5, marginBottom: 8, fontWeight: 850 }}>BUSINESS EMPIRE</div>
        <h1 style={{ fontSize: 42, lineHeight: 1.04, margin: "0 0 13px", fontWeight: 900, letterSpacing: -1.4 }}>Build products.<br />Build brands. Build an empire.</h1>
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

export function SetupWizard({ onLaunch }: { onLaunch: (id: string, company: string, brand: Brand, difficulty: DifficultyId) => void }) {
  const [step, setStep] = useState(0);
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyId>("standard");
  const [brand, setBrand] = useState<Brand>({ id: "brand_0", name: "", color: BRAND_COLORS[0], positioning: "premium", createdTick: 0, industryId: "skincare" });

  return (
    <Center>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {["Industry & Difficulty", "Company", "Brand"].map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? C.cyan : C.line }} />)}
        </div>
        {step === 0 && (
          <Panel title="Choose your industry">
            <div style={{ display: "flex", gap: 12 }}>
              {Object.values(INDUSTRIES).map((ind) => (
                <ChoiceCard key={ind.id} active={industryId === ind.id} onClick={() => setIndustryId(ind.id)}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{ind.label}</div>
                  <div style={{ color: C.dim, fontSize: 12 }}>Matters most: {Object.entries(ind.axisWeight).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ")}</div>
                </ChoiceCard>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <FieldLabel>Difficulty</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {(Object.values(DIFFICULTIES)).map((d) => (
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
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button style={ctrlBtn} onClick={() => setStep(0)}>← Back</button>
              <button style={bigBtn} disabled={!company.trim()} onClick={() => setStep(2)}>Next →</button>
            </div>
          </Panel>
        )}
        {step === 2 && (
          <Panel title="Launch your first brand">
            <FieldLabel>Brand name</FieldLabel>
            <TextInput placeholder="e.g. Lumina" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
            <div style={{ height: 16 }} />
            <FieldLabel>Brand color</FieldLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BRAND_COLORS.map((c) => <button key={c} onClick={() => setBrand({ ...brand, color: c })} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: brand.color === c ? `3px solid ${C.violet}` : "2px solid transparent", cursor: "pointer", boxShadow: brand.color === c ? "0 0 0 2px #fff" : "none" }} />)}
            </div>
            <div style={{ height: 16 }} />
            <FieldLabel>Positioning</FieldLabel>
            <div style={{ display: "flex", gap: 10 }}>
              {POSITIONINGS.map((p) => (
                <ChoiceCard key={p.key} active={brand.positioning === p.key} onClick={() => setBrand({ ...brand, positioning: p.key })} accent={brand.color}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.4 }}>{p.blurb}</div>
                </ChoiceCard>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <button style={ctrlBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={{ ...bigBtn, background: brand.color }} disabled={!brand.name.trim()} onClick={() => onLaunch(industryId!, company, brand, difficulty)}>Create company →</button>
            </div>
          </Panel>
        )}
      </div>
    </Center>
  );
}
