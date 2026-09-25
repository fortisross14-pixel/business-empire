import React, { useEffect, useState } from "react";
import type { MarketEvent, SKU, World } from "../../engine/types";
import { distributionMetricsForSku } from "../../engine/distribution";
import { C, bigBtn, ctrlBtn, fmtMoney, fmtNum } from "../theme";
import { ProductVisualCard } from "../visualIdentity";
import { archetypeByKey } from "../../engine/productCatalog";

export type ProductMomentKind = "design" | "batch" | "launch" | "week" | "breakout" | "recall";

export interface ProductMoment {
  key: string;
  kind: ProductMomentKind;
  event: MarketEvent;
  sku: SKU;
}

export function productMomentFromEvent(world: World, event: MarketEvent): ProductMoment | null {
  // Manufacturing arrivals are operations events; the rest normally originate from
  // product/market simulation. All three deserve the same executive treatment.
  if (event.kind !== "product" && event.kind !== "market" && event.kind !== "operations") return null;
  const sku = [...world.player.skus].sort((a, b) => b.name.length - a.name.length).find((candidate) => event.text.includes(candidate.name));
  if (!sku) return null;
  const text = event.text.toLowerCase();
  const kind: ProductMomentKind | null = text.includes("design complete") ? "design"
    : text.includes("first batch is ready") ? "batch"
    : text.includes("now on the market") ? "launch"
    : text.includes("first market week") ? "week"
    : text.includes("breaking out") ? "breakout"
    : text.includes("recall") ? "recall"
    : null;
  return kind ? { key: `${event.tick}|${event.text}`, kind, event, sku } : null;
}

export function ProductMomentModal({ world, moment, onDismiss, onOpenProduct }: { world: World; moment: ProductMoment; onDismiss: () => void; onOpenProduct: (skuId: string) => void }) {
  const { sku, kind } = moment;
  const index = world.player.skus.findIndex((item) => item.id === sku.id);
  const result = world.live?.skuResults?.[index];
  const distribution = distributionMetricsForSku(world, sku);
  const category = archetypeByKey(sku.productKey)?.label ?? sku.productKey;
  const firstWeekShare = moment.event.text.match(/share ([0-9.]+)%/i)?.[1];
  const meta: Record<ProductMomentKind, { eyebrow: string; icon: string; title: string; message: string; action: string; color: string }> = {
    design: { eyebrow: "NEW PRODUCT", icon: "✦", title: `${sku.name} is ready to manufacture`, message: "The product review is in. This score measures the product itself—not sales potential. Audience size, price, IP, channels and awareness will decide the commercial outcome.", action: "Open manufacturing", color: C.cyan },
    batch: { eyebrow: "FIRST BATCH ARRIVED", icon: "▣", title: `${sku.name} is ready for market`, message: "The first production run is in the warehouse. Set the price, sales channels and launch plan before taking it to customers.", action: "Prepare launch", color: C.violet },
    launch: { eyebrow: "PRODUCT ON THE MARKET", icon: "↗", title: `${sku.name} has launched`, message: "The commercial plan is now live. Let at least one week pass, then review actual sales, initial market position and the next move.", action: "Watch the market", color: C.green },
    week: { eyebrow: "LAUNCH WEEK REVIEW", icon: "◉", title: `${sku.name}: first market signal`, message: "These are the first actual commercial results. Treat them as a signal, not a final verdict: inventory, price, channel fit and awareness now determine what happens next.", action: "Open product analysis", color: C.cyan },
    breakout: { eyebrow: "MARKET BREAKOUT", icon: "⚡", title: `${sku.name} is breaking out`, message: "Demand has accelerated. Protect availability, avoid a stock-out and decide whether to support the momentum with more inventory or advertising.", action: "Defend the breakout", color: C.gold },
    recall: { eyebrow: "PRODUCT ALERT", icon: "!", title: `${sku.name} needs an executive decision`, message: "A safety issue has removed inventory and damaged commercial momentum. Review the product, supply plan and whether a redesigned version is needed.", action: "Open product", color: C.red },
  };
  const copy = meta[kind];
  const cinematicReveal = kind === "design" || kind === "launch" || kind === "breakout";
  const [revealed, setRevealed] = useState(!cinematicReveal);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    setClosing(false); setRevealed(!cinematicReveal);
    if (!cinematicReveal) return;
    const timer = window.setTimeout(() => setRevealed(true), 1150);
    return () => window.clearTimeout(timer);
  }, [moment.key, cinematicReveal]);
  const metrics: [string, string, string?][] = kind === "design"
    ? [["Category", category], ["Program", sku.projectTier ?? "A"], ["Product review", `★ ${(sku.reviewScore ?? 1).toFixed(1)} / 5`]]
    : kind === "batch"
      ? [["Inventory ready", `${fmtNum(sku.inventory)} units`], ["Unit cost", fmtMoney(sku.unitCost)], ["Sales routes", `${distribution.contracts.length} selected`]]
      : kind === "launch"
        ? [["Launch price", fmtMoney(sku.listPrice)], ["Channels", `${distribution.contracts.length} active`], ["Audience", sku.targetLabel ?? "Broad market"]]
        : kind === "week"
          ? [["Sales in week one", `${fmtNum(sku.unitsSoldTotal)} units`], ["Net sales", fmtMoney(sku.unitsSoldTotal * sku.listPrice * (1 - distribution.marginCut))], ["Initial category share", firstWeekShare ? `${firstWeekShare}%` : "Still forming"]]
          : kind === "breakout"
            ? [["Momentum", `${Math.round((sku.marketMomentum ?? 1) * 100)}%`], ["Inventory", `${fmtNum(sku.inventory)} units`], ["Sales / Q", fmtNum(result?.units ?? 0)]]
            : [["Inventory remaining", `${fmtNum(sku.inventory)} units`], ["Recalls", String(sku.recallCount ?? 1)], ["Momentum", `${Math.round((sku.marketMomentum ?? 1) * 100)}%`]];

  const finish = (after?: () => void) => { if (closing) return; setClosing(true); window.setTimeout(() => { onDismiss(); after?.(); }, 230); };
  const open = () => finish(() => onOpenProduct(sku.id));
  return <div className={`product-moment-backdrop ${closing ? "closing" : ""}`} role="dialog" aria-modal="true" aria-label={copy.title}>
    <section className={`product-moment-card ${revealed ? "revealed" : "awaiting-reveal"}`} style={{ "--moment": copy.color } as React.CSSProperties}>
      <div className="product-moment-glow" />
      <div className="product-moment-top"><span className="product-moment-icon">{copy.icon}</span><span>{copy.eyebrow}</span></div>
      {cinematicReveal ? <button className={`product-reveal-stage ${revealed ? "is-revealed" : "is-spinning"}`} onClick={() => setRevealed(true)} aria-label={revealed ? `${sku.name} revealed` : "Reveal product now"}>
        <span className="product-reveal-card"><span className="product-reveal-back"><i>BE</i><b>NEW PRODUCT</b><small>{category}</small></span><span className="product-reveal-front"><ProductVisualCard world={world} sku={sku} size={176} showLabels={false} /></span></span>
        {!revealed && <em>Tap to reveal</em>}
      </button> : <div className="product-moment-hero"><ProductVisualCard world={world} sku={sku} size={176} showLabels={false} /></div>}
      <div className="product-reveal-copy"><div className="product-moment-copy"><h2>{copy.title}</h2><p>{copy.message}</p></div>
      <div className="product-moment-metrics">{metrics.map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
      <div className="product-moment-actions"><button style={ctrlBtn} onClick={() => finish()}>Continue paused</button><button style={{ ...bigBtn, background: copy.color, borderColor: copy.color }} onClick={open}>{copy.action} →</button></div></div>
    </section>
  </div>;
}
