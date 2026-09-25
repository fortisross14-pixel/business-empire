import React from "react";
import type { World } from "../../engine/types";
import { ACHIEVEMENTS, achievementProgress, legacyScore, OUTCOMES, scenarioProgress, SCENARIOS } from "../../engine/gameplay";
import { C } from "../theme";

export function LegacyView({ world }: { world: World }) {
  const scenario = SCENARIOS[world.gameplay.scenarioId];
  const objectives = scenarioProgress(world);
  const unlocked = new Set(world.gameplay.achievements.map((a) => a.id));
  const reachedOutcomes = new Set(world.gameplay.outcomes.map((o) => o.id));
  return <div>
    <section className="legacy-hero">
      <div><small>CURRENT SCENARIO · RUN #{String(world.gameplay.runSeed ?? 0).padStart(9,"0").slice(-9)}</small><h2>{scenario.icon} {scenario.name}</h2><p>{scenario.pitch} Market events, timing and opportunities are seeded for this company, so another run will not tell the same story.</p></div>
      <div className="legacy-score"><small>LEGACY SCORE</small><b>{legacyScore(world).toLocaleString()}</b><span>{unlocked.size}/{ACHIEVEMENTS.length} achievements</span></div>
    </section>
    <div className="scenario-objectives">{objectives.map((objective) => <div key={objective.label} className={objective.done ? "done" : ""}><span>{objective.done ? "✓" : "○"}</span><div><b>{objective.label}</b><p>{objective.detail}</p></div></div>)}</div>

    <h3 style={{ margin: "20px 0 8px" }}>Achievements</h3>
    <div className="achievement-grid">{ACHIEVEMENTS.map((achievement) => {
      const done = unlocked.has(achievement.id); const progress = achievementProgress(world, achievement.id);
      return <article key={achievement.id} className={done ? "unlocked" : "locked"}><span className="achievement-icon">{done ? achievement.icon : "?"}</span><div><b>{achievement.name}</b><p>{achievement.desc}</p><div className="achievement-progress"><i style={{ width: `${progress * 100}%` }} /></div></div>{done && <em>UNLOCKED</em>}</article>;
    })}</div>

    <h3 style={{ margin: "20px 0 8px" }}>Run outcomes</h3>
    <p style={{ color: C.dim, fontSize: 11.5, marginTop: 0 }}>Outcomes are major endings to a chapter, not a hard stop. The company always continues in sandbox mode.</p>
    <div className="outcome-grid">{OUTCOMES.map((outcome) => <article key={outcome.id} className={reachedOutcomes.has(outcome.id) ? "reached" : ""}><span>{outcome.icon}</span><div><b>{outcome.name}</b><p>{outcome.desc}</p></div>{reachedOutcomes.has(outcome.id) && <em>REACHED</em>}</article>)}</div>

    <h3 style={{ margin: "20px 0 8px" }}>Decision history</h3>
    {!world.gameplay.decisionHistory.length ? <div style={{ color: C.faint, padding: 14, border: `1px dashed ${C.line}`, borderRadius: 10 }}>The choices that define this company will be recorded here.</div> : <div className="decision-history">{world.gameplay.decisionHistory.map((entry) => <article key={`${entry.eventId}_${entry.resolvedTick}`}><span>Day {entry.resolvedTick}</span><div><b>{entry.title} → {entry.choiceLabel}</b><p>{entry.immediateText}{entry.delayedText ? ` Later: ${entry.delayedText}` : ""}</p></div></article>)}</div>}
  </div>;
}
