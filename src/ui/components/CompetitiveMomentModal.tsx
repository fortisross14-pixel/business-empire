import React, { useState } from "react";
import type { CompetitiveQuarterReview, Competitor, MarketEvent, World } from "../../engine/types";
import { C, bigBtn, ctrlBtn, fmtPct } from "../theme";
import { CompetitorLogoMark } from "../visualIdentity";

export type CompetitiveMoment = {
  key: string;
  kind: "rival-launch" | "quarter-review";
  event: MarketEvent;
  competitor?: Competitor;
  review?: CompetitiveQuarterReview;
};

export function competitiveMomentFromEvent(world: World, event: MarketEvent): CompetitiveMoment | null {
  if (event.code === "rival_launch") {
    const competitor = world.comps.find((candidate) => candidate.id === event.entityId);
    return competitor ? { key: `${event.tick}|${event.text}`, kind: "rival-launch", event, competitor } : null;
  }
  if (event.code === "quarterly_market_review") {
    const review = [...world.competitiveReviews].reverse().find((candidate) => candidate.tick === event.tick);
    return review ? { key: `${event.tick}|${event.text}`, kind: "quarter-review", event, review } : null;
  }
  return null;
}

export function CompetitiveMomentModal({ world, moment, onDismiss, onOpenCompetition }: { world: World; moment: CompetitiveMoment; onDismiss: () => void; onOpenCompetition: () => void }) {
  const [closing, setClosing] = useState(false);
  const finish = (after?: () => void) => { if (closing) return; setClosing(true); window.setTimeout(() => { onDismiss(); after?.(); }, 230); };
  const open = () => finish(onOpenCompetition);
  if (moment.kind === "rival-launch" && moment.competitor) {
    const competitor = moment.competitor;
    const product = competitor.products.at(-1);
    return <div className={`product-moment-backdrop ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label="Rival move">
      <section className="product-moment-card" style={{ "--moment": C.red } as React.CSSProperties}>
        <div className="product-moment-glow" />
        <div className="product-moment-top"><span className="product-moment-icon">⚔</span><span>RIVAL MOVE</span></div>
        <div style={{ display: "grid", placeItems: "center", margin: "24px 0 16px", position: "relative" }}><CompetitorLogoMark comp={competitor} size={94} withName /></div>
        <div className="product-moment-copy"><h2>{competitor.name} has entered your stronghold</h2><p>{moment.event.text.replace(/^🎯\s*/, "")} This is a direct strategic response to a segment where your company has held meaningful power.</p></div>
        <div className="product-moment-metrics"><div><small>New portfolio size</small><b>{competitor.products.length} products</b></div><div><small>Launch price</small><b>{product ? `$${product.price.toFixed(0)}` : "—"}</b></div><div><small>Product quality</small><b>{product ? `${Math.round(product.quality * 100)}/100` : "—"}</b></div></div>
        <div className="product-moment-actions"><button style={ctrlBtn} onClick={() => finish()}>Continue paused</button><button style={{ ...bigBtn, background: C.red, borderColor: C.red }} onClick={open}>Open rival dossier →</button></div>
      </section>
    </div>;
  }
  const review = moment.review!;
  const delta = review.previousPlayerShare == null ? null : review.playerShare - review.previousPlayerShare;
  return <div className={`product-moment-backdrop ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label="Quarterly market review">
    <section className="product-moment-card" style={{ "--moment": C.cyan } as React.CSSProperties}>
      <div className="product-moment-glow" />
      <div className="product-moment-top"><span className="product-moment-icon">◫</span><span>QUARTERLY MARKET REVIEW</span></div>
      <div style={{ display: "grid", placeItems: "center", margin: "14px 0 10px", position: "relative" }}><div style={{ width: 128, height: 128, borderRadius: 999, display: "grid", placeItems: "center", background: "linear-gradient(145deg,#103d61,#237db1)", color: "white", boxShadow: "0 18px 35px rgba(16,61,97,.25)" }}><div style={{ textAlign: "center" }}><small style={{ display: "block", color: "#a9daf5", fontSize: 8, fontWeight: 900, letterSpacing: .8 }}>MARKET POSITION</small><b style={{ display: "block", fontSize: 48, lineHeight: 1 }}>#{review.playerRank}</b></div></div></div>
      <div className="product-moment-copy"><h2>{review.headline}</h2><p>The quarter has closed. Review where you gained or lost ground, which rival is moving fastest, and which customer battle deserves the next investment.</p></div>
      <div className="product-moment-metrics"><div><small>Your market share</small><b>{fmtPct(review.playerShare)}</b></div><div><small>Quarter movement</small><b style={{ color: delta == null || Math.abs(delta) < .001 ? C.dim : delta > 0 ? C.green : C.red }}>{delta == null ? "First review" : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(1)} pp`}</b></div><div><small>Market leader</small><b>{review.leaderName} · {fmtPct(review.leaderShare)}</b></div></div>
      <div className="product-moment-actions"><button style={ctrlBtn} onClick={() => finish()}>Continue paused</button><button style={{ ...bigBtn, background: C.cyan, borderColor: C.cyan }} onClick={open}>Open competition →</button></div>
    </section>
  </div>;
}
