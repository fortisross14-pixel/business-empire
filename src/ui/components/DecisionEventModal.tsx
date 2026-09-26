import React, { useEffect, useId, useState } from "react";
import type { DecisionEvent } from "../../engine/types";

export function DecisionEventModal({ event, onChoose }: { event: DecisionEvent; onChoose: (choiceId: string) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const choose = (choiceId: string) => { if (chosen) return; setChosen(choiceId); window.setTimeout(() => onChoose(choiceId), 360); };
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return <div className={`decision-backdrop ${chosen ? "resolving" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
    <style>{`
      .decision-modal{border-top:6px solid #20b7e6!important;scrollbar-color:#64bde3 #e5f2f8}.decision-kicker{font-size:12px!important}.decision-context{font-size:13px!important;border-left:5px solid #23aada!important}.decision-choices button{min-height:78px!important;touch-action:manipulation}.decision-choices p{font-size:13px!important;line-height:1.45!important}.decision-choices small{font-size:12px!important;line-height:1.45!important}.decision-footer{font-size:12px!important;line-height:1.4!important}.decision-choices button:focus-visible{outline:4px solid rgba(24,158,218,.3);outline-offset:2px}.decision-choices button:disabled{cursor:default}.decision-choices button.chosen:after{content:"Decision locked";align-self:center;color:#188258;font-size:12px;font-weight:900}.decision-modal:before{content:"EXECUTIVE DECISION";display:block;float:right;margin:-2px 0 8px 12px;padding:7px 10px;border-radius:999px;color:#16648a;background:#e1f5fd;font-size:12px;font-weight:950;letter-spacing:.7px}
      @media(max-width:600px){.decision-backdrop{padding:0!important;align-items:end!important}.decision-modal{width:100%!important;max-height:calc(100dvh - 10px)!important;padding:17px 14px calc(17px + env(safe-area-inset-bottom))!important;border-radius:21px 21px 0 0!important}.decision-modal:before{display:none}.decision-modal h1{font-size:25px!important}.decision-choices button{grid-template-columns:22px 1fr!important;padding:13px 11px!important}.decision-footer{text-align:left!important}}
      @media(prefers-reduced-motion:reduce){.decision-backdrop,.decision-modal,.decision-choices button{animation:none!important;transition-duration:.01ms!important}}
    `}</style>
    <section className="decision-modal">
      <div className="decision-kicker">{event.icon} {event.category.toUpperCase()} EVENT</div>
      <h1 id={titleId}>{event.title}</h1>
      <p id={descriptionId} className="decision-lead">{event.description}</p>
      <div className="decision-context">{event.context}</div>
      <div className="decision-choices">{event.choices.map((choice, index) => <button type="button" autoFocus={index === 0} disabled={Boolean(chosen)} aria-pressed={chosen === choice.id} key={choice.id} className={chosen === choice.id ? "chosen" : chosen ? "not-chosen" : ""} onClick={() => choose(choice.id)}>
        <span className="choice-arrow">→</span><div><b>{choice.label}</b><p>{choice.summary}</p><small><strong>Now:</strong> {choice.immediateText}</small>{choice.delayedText && <small className="later"><strong>Later:</strong> {choice.delayedText}</small>}</div>
      </button>)}</div>
      <div className="decision-footer">The game is paused. Outcomes use the company’s real cash, products, customers, people and market position.</div>
    </section>
  </div>;
}
