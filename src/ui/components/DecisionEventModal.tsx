import React, { useState } from "react";
import type { DecisionEvent } from "../../engine/types";

export function DecisionEventModal({ event, onChoose }: { event: DecisionEvent; onChoose: (choiceId: string) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const choose = (choiceId: string) => { if (chosen) return; setChosen(choiceId); window.setTimeout(() => onChoose(choiceId), 360); };
  return <div className={`decision-backdrop ${chosen ? "resolving" : ""}`} role="dialog" aria-modal="true" aria-label={event.title}>
    <section className="decision-modal">
      <div className="decision-kicker">{event.icon} {event.category.toUpperCase()} EVENT</div>
      <h1>{event.title}</h1>
      <p className="decision-lead">{event.description}</p>
      <div className="decision-context">{event.context}</div>
      <div className="decision-choices">{event.choices.map((choice) => <button key={choice.id} className={chosen === choice.id ? "chosen" : chosen ? "not-chosen" : ""} onClick={() => choose(choice.id)}>
        <span className="choice-arrow">→</span><div><b>{choice.label}</b><p>{choice.summary}</p><small><strong>Now:</strong> {choice.immediateText}</small>{choice.delayedText && <small className="later"><strong>Later:</strong> {choice.delayedText}</small>}</div>
      </button>)}</div>
      <div className="decision-footer">The game is paused. Outcomes use the company’s real cash, products, customers, people and market position.</div>
    </section>
  </div>;
}
