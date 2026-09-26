import React, { useState } from "react";
import { C, fmtMoney, fmtNum, fmtPct } from "../theme";
import { DonutChart, Panel, LineChart, Seg } from "../components";
import { CompetitorCard, CompetitorLogoMark, ProductVisualCard } from "../visualIdentity";
import { segmentStats } from "../../engine/segments";
import { AXES, INDUSTRIES } from "../../engine/industries";
import { competitiveStandings, segmentBattle } from "../../engine/competitiveWorld";
import { archetypeByKey } from "../../engine/productCatalog";
import type { World, Coord, Competitor, MarketEvent, SKU } from "../../engine/types";

export function MarketView({ world, hist, selectCell, mode = "overview" }:
  { world: World; hist: World["history"]; selectCell: (c: Coord) => void; mode?: "overview" | "competitive" }) {
  const tier = world.player.intelDept;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scope, setScope] = useState("portfolio");
  const intelligenceUnlocked = (world.player.research?.completed ?? []).includes("market_intelligence");
  // Public rival moves, shelf prices and quarterly rankings are always visible.
  // Research still gates the deeper population cube and formal market analysis.
  if (mode === "competitive") return <CompetitiveWorld world={world} />;
  const liveSkus = world.player.skus
    .map((sku, index) => ({ sku, index }))
    .filter(({ sku }) => !sku.archived && Boolean(sku.releasedToMarket || sku.status === "active"));
  const selectedEntry = scope === "portfolio" ? undefined : liveSkus.find(({ sku }) => sku.id === scope);
  const effectiveScope = selectedEntry ? scope : "portfolio";
  const intelligenceAvailable = intelligenceUnlocked && tier > 0;
  const scopeHeader = <MarketScopeSelector world={world} entries={liveSkus} value={effectiveScope} onChange={setScope} />;
  if (selectedEntry) {
    return <>
      {scopeHeader}
      <ProductMarketScope world={world} sku={selectedEntry.sku} skuIndex={selectedEntry.index} intelligenceAvailable={intelligenceAvailable} intelligenceUnlocked={intelligenceUnlocked} />
    </>;
  }
  if (!intelligenceUnlocked) {
    return <>{scopeHeader}<Panel><div style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>Structured market intelligence has not been developed yet.</div><div style={{ color: C.faint, fontSize: 12, marginTop: 10 }}>Research <b>Market Intelligence</b> from Company → Research. After that, seat Strategy / Intelligence staff to operate the function. You can still select any live product above to see its public sales facts and shelf competition.</div></Panel></>;
  }
  if (tier === 0) {
    return (
      <>{scopeHeader}<Panel>
        <div style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
          You have no Market Intelligence department. You can't see the market yet.
        </div>
        <div style={{ color: C.faint, fontSize: 12, marginTop: 10 }}>
          Assign Strategy / Intelligence staff to an office on the Campus to unlock market visibility. Public facts for a specific live product remain available from the scope selector above.
        </div>
      </Panel></>
    );
  }
  const markers = world.events.map((e) => ({ i: hist.findIndex((h) => h.tick >= e.tick) })).filter((m) => m.i >= 0);
  return (
    <>
      {scopeHeader}
      <MarketPulseDashboard world={world} hist={hist} markers={markers} />
      <SegmentOverview world={world} />
      <Panel title="Advanced Market Research">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, flex: "1 1 320px" }}>
            Your market contains {world.cube.length} detailed customer cells. You normally manage recognizable segments; open the population cube only when you want analyst-level detail.
          </div>
          <button className="market-advanced-toggle" onClick={() => setShowAdvanced((v) => !v)} style={{ background: C.panel2, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 700 }}>
            {showAdvanced ? "Hide population cube" : "Open population cube"}
          </button>
        </div>
      </Panel>
      {showAdvanced && <CubeInspector world={world} selectCell={selectCell} />}
    </>
  );
}

function MarketScopeSelector({ world, entries, value, onChange }: {
  world: World;
  entries: { sku: SKU; index: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const allById = new Map(world.player.skus.map((sku) => [sku.id, sku]));
  const rootFor = (sku: SKU) => {
    let current = sku;
    const seen = new Set<string>();
    while (current.parentSkuId && !seen.has(current.parentSkuId)) {
      seen.add(current.id);
      const parent = allById.get(current.parentSkuId);
      if (!parent) break;
      current = parent;
    }
    return current;
  };
  const groups = new Map<string, { label: string; category: string; entries: { sku: SKU; index: number }[] }>();
  for (const entry of entries) {
    const root = rootFor(entry.sku);
    const category = archetypeByKey(entry.sku.productKey)?.label ?? entry.sku.productKey;
    const group = groups.get(root.id) ?? { label: root.name, category, entries: [] };
    group.entries.push(entry);
    groups.set(root.id, group);
  }
  for (const group of groups.values()) group.entries.sort((a, b) => (b.sku.version ?? 1) - (a.sku.version ?? 1));
  return <section className="market-scope-hero" style={{
    borderRadius: 18,
    padding: "20px clamp(16px,3vw,30px)",
    marginBottom: 14,
    color: "white",
    backgroundImage: "linear-gradient(90deg,rgba(5,30,58,.97) 0%,rgba(8,53,91,.9) 46%,rgba(18,72,112,.6) 100%), url('/assets/ui/backgrounds/market-command.png')",
    backgroundSize: "cover",
    backgroundPosition: "center 48%",
    boxShadow: "0 14px 34px rgba(8,45,78,.24)",
    overflow: "hidden",
  }}>
    <style>{marketResponsiveCss}</style>
    <style>{`
      .market-scope-layout{display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,.78fr);gap:24px;align-items:end}
      .market-scope-select{width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.96);color:#18334d;padding:0 42px 0 14px;font-size:14px;font-weight:850;cursor:pointer;box-shadow:0 8px 20px rgba(1,20,38,.2)}
      .product-market-hero{display:grid;grid-template-columns:auto minmax(230px,1.15fr) minmax(320px,1fr);gap:20px;align-items:center}
      .product-market-metrics{display:grid;grid-template-columns:repeat(2,minmax(132px,1fr));gap:9px}
      .product-market-compare-head,.product-market-compare-row{display:grid;grid-template-columns:minmax(170px,1.3fr) minmax(120px,.8fr) 100px 120px;gap:12px;align-items:center}
      @media(max-width:840px){.market-scope-layout{grid-template-columns:1fr;gap:14px}.product-market-hero{grid-template-columns:auto 1fr}.product-market-metrics{grid-column:1/-1}.product-market-compare-head{display:none}.product-market-compare-row{grid-template-columns:minmax(150px,1fr) 1fr}.product-market-compare-row>*:nth-child(n+3){justify-self:start}}
      @media(max-width:520px){.market-scope-hero{padding:16px!important}.product-market-hero{grid-template-columns:1fr}.product-market-hero-art{display:grid;place-items:center}.product-market-metrics{grid-template-columns:1fr 1fr}.product-market-compare-row{grid-template-columns:1fr}.product-market-compare-row>*{justify-self:start!important}}
    `}</style>
    <div className="market-scope-layout">
      <div>
        <div style={{ color: "#8ed9ff", fontSize: 11, fontWeight: 950, letterSpacing: 1.05 }}>MARKET SCOPE</div>
        <h2 style={{ margin: "5px 0 6px", fontSize: "clamp(22px,3vw,31px)", lineHeight: 1.08 }}>Whose market are you analyzing?</h2>
        <p style={{ margin: 0, maxWidth: 650, color: "#d6ebf8", fontSize: 13.5, lineHeight: 1.52 }}>Start with the company portfolio, or focus the room on one exact product version. Every chart below follows this choice.</p>
      </div>
      <label style={{ display: "grid", gap: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: "#dff3ff" }}>Portfolio or live product version</span>
        <select className="market-scope-select" value={value} onChange={(event) => onChange(event.target.value)} aria-label="Choose market scope">
          <option value="portfolio">◉ Portfolio overview · all products</option>
          {[...groups.entries()].map(([id, group]) => <optgroup key={id} label={`${group.label} · ${group.category}`}>
            {group.entries.map(({ sku }) => <option key={sku.id} value={sku.id}>{`V${sku.version ?? 1} · ${sku.name} · ${sku.targetLabel ?? "General market"}`}</option>)}
          </optgroup>)}
        </select>
        <span style={{ color: "#afd6ed", fontSize: 12 }}>{entries.length ? `${entries.length} live version${entries.length === 1 ? "" : "s"} available` : "Launch a product to unlock exact-product scope"}</span>
      </label>
    </div>
  </section>;
}

function ProductMarketScope({ world, sku, skuIndex, intelligenceAvailable, intelligenceUnlocked }: {
  world: World;
  sku: SKU;
  skuIndex: number;
  intelligenceAvailable: boolean;
  intelligenceUnlocked: boolean;
}) {
  const result = world.live?.skuResults?.[skuIndex];
  const category = archetypeByKey(sku.productKey)?.label ?? sku.productKey;
  const industry = INDUSTRIES[sku.industryId]?.label ?? sku.industryId;
  const target = sku.targetLabel ?? targetSummary(sku.target);
  const currentUnits = result?.units ?? 0;
  const currentRevenue = result?.revenue ?? 0;
  const currentContribution = result?.margin ?? 0;
  const marketState = world.industryMarkets?.[sku.industryId];
  const marketCube = marketState?.cube ?? (sku.industryId === world.industryId ? world.cube : []);
  const categoryMarketAnnual = marketCube.reduce((sum, cell) => sum + cell.head * cell.spend * (cell.categoryPref[sku.productKey] ?? .5), 0);
  const annualizedGross = (result?.gross ?? 0) * 4;
  const estimatedCategoryShare = categoryMarketAnnual > 0 ? Math.max(0, Math.min(1, annualizedGross / categoryMarketAnnual)) : 0;
  return <>
    <section style={{ border: `1px solid ${C.line}`, background: "linear-gradient(145deg,#fff,#f3f8fc)", borderRadius: 16, padding: "clamp(14px,2.5vw,22px)", boxShadow: "0 10px 26px rgba(24,50,77,.10)", marginBottom: 14 }}>
      <div className="product-market-hero">
        <div className="product-market-hero-art"><ProductVisualCard world={world} sku={sku} size={136} showLabels={false} /></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 7 }}><ScopeTag text={industry} color={C.cyan} /><ScopeTag text={category} color={C.violet} /><ScopeTag text={`Version ${sku.version ?? 1}`} color={C.green} /></div>
          <h2 style={{ margin: 0, color: C.ink, fontSize: "clamp(22px,3vw,30px)", lineHeight: 1.08 }}>{sku.name}</h2>
          <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.48, margin: "7px 0 0" }}><b>Target:</b> {target}</p>
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}><span style={{ color: "#b77912", fontSize: 22, fontWeight: 950 }}>★ {(sku.reviewScore ?? 1).toFixed(1)}</span><span style={{ color: C.faint, fontSize: 12 }}>Product review · fact for this version</span></div>
        </div>
        <div className="product-market-metrics">
          <ProductFact label="Current units / quarter" value={fmtNum(currentUnits)} icon="▣" />
          <ProductFact label="Net revenue / quarter" value={fmtMoney(currentRevenue)} icon="↗" />
          <ProductFact label="Contribution / quarter" value={fmtMoney(currentContribution)} icon="$" tone={currentContribution >= 0 ? C.green : C.red} />
          <ProductFact label="Inventory on hand" value={fmtNum(sku.inventory)} icon="◫" />
        </div>
      </div>
      <div style={{ color: C.faint, fontSize: 12, lineHeight: 1.45, marginTop: 13, borderTop: `1px solid ${C.grid}`, paddingTop: 10 }}><b style={{ color: C.ink }}>ACTUAL OPERATING FACTS.</b> Current values use the live quarterly run-rate; inventory and review belong to this exact version, not the wider brand.</div>
    </section>
    <ProductCompetition world={world} sku={sku} estimatedCategoryShare={estimatedCategoryShare} />
    <ProductConsumerIntelligence sku={sku} intelligenceAvailable={intelligenceAvailable} intelligenceUnlocked={intelligenceUnlocked} />
  </>;
}

function ScopeTag({ text, color }: { text: string; color: string }) {
  return <span style={{ border: `1px solid ${color}55`, background: `${color}10`, color, borderRadius: 99, padding: "5px 9px", fontSize: 12, fontWeight: 850 }}>{text}</span>;
}

function ProductFact({ label, value, icon, tone = C.ink }: { label: string; value: string; icon: string; tone?: string }) {
  return <div style={{ minHeight: 75, border: `1px solid ${C.line}`, borderRadius: 12, background: "rgba(255,255,255,.92)", padding: 11, boxSizing: "border-box" }}>
    <div style={{ color: C.faint, fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><span style={{ color: C.cyan, fontWeight: 950 }}>{icon}</span>{label}</div>
    <b style={{ display: "block", color: tone, fontSize: 19, marginTop: 5, fontFamily: "ui-monospace" }}>{value}</b>
  </div>;
}

function ProductCompetition({ world, sku, estimatedCategoryShare }: { world: World; sku: SKU; estimatedCategoryShare: number }) {
  const marketState = world.industryMarkets?.[sku.industryId];
  const competitors = marketState?.comps ?? (sku.industryId === world.industryId ? world.comps : []);
  const rivals = competitors.flatMap((competitor) => competitor.products
    .filter((product) => product.productKey === sku.productKey)
    .map((product) => ({ competitor, product })));
  const category = archetypeByKey(sku.productKey)?.label ?? sku.productKey;
  return <Panel title={`${category} — shelf competition`}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap", marginBottom: 12 }}>
      <div style={{ maxWidth: 680 }}><b style={{ color: C.ink, fontSize: 15 }}>How this exact version compares</b><div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>Prices are observable shelf facts. Quality indices, positioning and category share are simulation estimates—not audited sales figures.</div></div>
      <div style={{ minWidth: 180, background: `${C.violet}0d`, border: `1px solid ${C.violet}44`, borderRadius: 11, padding: "9px 12px" }}><small style={{ display: "block", color: C.violet, fontSize: 12, fontWeight: 900 }}>ESTIMATED CATEGORY SHARE</small><b style={{ display: "block", color: C.ink, fontSize: 22, marginTop: 3 }}>{fmtPct(estimatedCategoryShare)}</b><span style={{ color: C.faint, fontSize: 12 }}>This SKU · annualized current run-rate</span></div>
    </div>
    <div className="product-market-compare-head" style={{ color: C.faint, fontSize: 12, fontWeight: 850, padding: "0 11px 7px" }}><span>Product</span><span>Positioning</span><span>Price</span><span>Quality index</span></div>
    <div style={{ display: "grid", gap: 7 }}>
      <div className="product-market-compare-row" style={{ border: `1px solid ${C.violet}55`, background: `${C.violet}08`, borderRadius: 11, padding: 11, fontSize: 12.5 }}>
        <div><b style={{ color: C.ink }}>{sku.name} · V{sku.version ?? 1}</b><span style={{ display: "block", color: C.violet, fontSize: 12, marginTop: 2 }}>Your product</span></div>
        <span style={{ color: C.dim }}>{sku.positioning ?? sku.targetLabel ?? "Broad market"}</span><b>{fmtMoney(sku.listPrice)}</b><span><b>{Math.round(sku.perceivedQuality * 100)}</b> / 100 <small style={{ color: C.faint, fontSize: 12 }}>estimate</small></span>
      </div>
      {rivals.map(({ competitor, product }) => <div key={`${competitor.id}_${product.awarenessKey}`} className="product-market-compare-row" style={{ border: `1px solid ${C.line}`, background: "white", borderRadius: 11, padding: 11, fontSize: 12.5 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}><CompetitorLogoMark comp={competitor} size={34}/><span><b style={{ color: C.ink }}>{competitor.name}</b><small style={{ display: "block", color: C.faint, fontSize: 12, marginTop: 2 }}>{category} rival line</small></span></div>
        <span style={{ color: C.dim }}>{competitor.personality === "premium" ? "Premium / quality" : competitor.personality === "discounter" ? "Price-led" : "Balanced"}</span><b>{fmtMoney(product.price)}</b><span><b>{Math.round(product.quality * 100)}</b> / 100 <small style={{ color: C.faint, fontSize: 12 }}>estimate</small></span>
      </div>)}
    </div>
    {!rivals.length && <div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 12 }}>No same-category rival product is currently tracked. The game will not substitute unrelated products just to fill this comparison.</div>}
  </Panel>;
}

function ProductConsumerIntelligence({ sku, intelligenceAvailable, intelligenceUnlocked }: { sku: SKU; intelligenceAvailable: boolean; intelligenceUnlocked: boolean }) {
  const report = sku.marketStudy;
  if (!intelligenceAvailable) return <Panel title="Consumer intelligence">
    <div style={{ border: "1px solid #f3d58a", background: "#fff9e9", borderRadius: 11, padding: 13, color: "#70540e", fontSize: 12.5, lineHeight: 1.55 }}><b>Advanced diagnosis is locked.</b> {intelligenceUnlocked ? "Seat Strategy / Intelligence staff in an office to read preference gaps and retained market-study findings." : "Research Market Intelligence, then staff the function to read preference gaps and retained market-study findings."} The public operating facts and shelf comparison above remain available.</div>
  </Panel>;
  if (!report) return <Panel title="Consumer intelligence"><div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.55 }}>No post-launch market study is retained for this version yet. Commission one from the product screen to learn why its audience responds—and which choices to change in the next version.</div></Panel>;
  const gaps = report.preferences.map((preference) => ({ ...preference, gap: preference.recommendedStars - preference.currentStars })).sort((a, b) => b.gap - a.gap);
  return <Panel title="Retained study & preference gaps">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
      <div style={{ border: `1px solid ${C.cyan}44`, background: `${C.cyan}08`, borderRadius: 12, padding: 13 }}><div style={{ color: C.cyan, fontSize: 12, fontWeight: 950, letterSpacing: .5 }}>STUDY FINDING</div><b style={{ display: "block", color: C.ink, fontSize: 16, marginTop: 4 }}>{report.headline}</b><p style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5, margin: "6px 0 0" }}>{report.summary}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}><ScopeTag text={`Best route: ${report.bestChannel.label}`} color={C.green} /><ScopeTag text={`Audience estimate: ${Math.round(report.targetMarketShare * 100)}%`} color={C.violet} /></div></div>
      <div style={{ border: `1px solid ${C.line}`, background: "white", borderRadius: 12, padding: 13 }}><b style={{ color: C.ink, fontSize: 14 }}>What the audience values</b><div style={{ color: C.faint, fontSize: 12, marginTop: 3 }}>Current design versus the study recommendation</div><div style={{ display: "grid", gap: 9, marginTop: 11 }}>{gaps.map((preference) => <PreferenceGap key={preference.key} label={preference.label} current={preference.currentStars} recommended={preference.recommendedStars} gap={preference.gap} />)}</div></div>
    </div>
    <div style={{ marginTop: 13 }}><b style={{ color: C.ink, fontSize: 14 }}>Actionable lessons for the next decision</b><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 8, marginTop: 8 }}>{report.lessons.map((lesson) => <article key={lesson.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: 11, background: "linear-gradient(180deg,#fff,#f8fbfd)" }}><b style={{ color: C.ink, fontSize: 13 }}>{lesson.title}</b><p style={{ color: C.dim, fontSize: 12, lineHeight: 1.45, margin: "4px 0" }}>{lesson.finding}</p><div style={{ color: C.green, fontSize: 12, lineHeight: 1.45 }}><b>Next move:</b> {lesson.action}</div></article>)}</div></div>
    <div style={{ color: C.faint, fontSize: 12, lineHeight: 1.45, marginTop: 11 }}><b style={{ color: C.violet }}>MODEL ESTIMATES.</b> Audience size, preferred route and attribute gaps come from the retained market study. They are intelligence—not guaranteed outcomes.</div>
  </Panel>;
}

function PreferenceGap({ label, current, recommended, gap }: { label: string; current: number; recommended: number; gap: number }) {
  const tone = gap > .7 ? C.red : gap > .2 ? C.amber : C.green;
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}><span style={{ color: C.ink, fontWeight: 750 }}>{label}</span><span style={{ color: tone, fontWeight: 850 }}>{current.toFixed(1)} → {recommended.toFixed(1)}★</span></div>
    <div style={{ height: 8, background: C.grid, borderRadius: 99, marginTop: 5, overflow: "hidden", position: "relative" }}><div style={{ width: `${Math.max(2, Math.min(100, current / 5 * 100))}%`, height: "100%", background: tone, borderRadius: 99 }} /><i style={{ position: "absolute", top: -2, bottom: -2, left: `${Math.max(0, Math.min(100, recommended / 5 * 100))}%`, width: 2, background: C.ink }} /></div>
  </div>;
}

function MarketPulseDashboard({ world, hist, markers }: { world: World; hist: World["history"]; markers: { i: number }[] }) {
  const standings = competitiveStandings(world);
  const player = standings.find((row) => row.isPlayer);
  const colors = ["#7c3aed", "#ef476f", "#f59e0b", "#06b6d4", "#10b981", "#64748b"];
  const donut = standings.map((row, index) => ({ label: row.name, value: row.share, color: colors[index % colors.length] }));
  const reviews = world.competitiveReviews.slice(-12);
  const shareSeries = standings.slice(0, 5).map((row, index) => {
    if (row.isPlayer) return { label: row.name, color: colors[index], data: reviews.length ? reviews.map((review) => review.playerShare) : [row.share], area: true };
    const competitor = world.comps.find((candidate) => candidate.id === row.id);
    const data = reviews.length ? reviews.map((review) => competitor?.shareHistory?.find((point) => point.tick === review.tick)?.share ?? row.share) : [row.share];
    return { label: row.name, color: colors[index], data };
  });
  const recent = hist.slice(-180);
  const revenue = recent.map((point) => point.revenue);
  const profit = recent.map((point) => point.profit);
  return <section className="market-visual-dashboard">
    <div className="market-visual-head"><div><span>LIVE MARKET INTELLIGENCE</span><h2>The market at a glance</h2><p>Current competitive position, share movement and commercial momentum from the live simulation.</p></div>{world.live && <div className="market-window-pills"><SharePill label="Today" value={world.live.overallShare} color={C.violet} /><SharePill label="Month" value={world.live.shareMonth} color={C.cyan} /><SharePill label="Year" value={world.live.shareYear} color={C.green} /></div>}</div>
    <div className="market-visual-grid">
      <article className="market-share-card">
        <div className="visual-card-title"><div><small>ESTIMATED MARKET</small><b>Competitive share</b></div><span>LIVE</span></div>
        <div className="market-donut-layout"><DonutChart segments={donut} centerLabel="YOUR SHARE" centerValue={fmtPct(player?.share ?? 0)} size={190}/><div className="market-rank-list">{standings.slice(0, 6).map((row, index) => <div key={row.id} className={row.isPlayer ? "player" : ""}><span className="rank">#{row.rank}</span><span className="swatch" style={{ background: colors[index % colors.length] }}/><span className="name">{row.isPlayer ? <b>{world.company}</b> : <>{world.comps.find((comp) => comp.id === row.id) && <CompetitorLogoMark comp={world.comps.find((comp) => comp.id === row.id)!} size={22}/>}<b>{row.name}</b></>}</span><strong>{fmtPct(row.share)}</strong></div>)}</div></div>
      </article>
      <article className="market-trend-card">
        <div className="visual-card-title"><div><small>QUARTERLY REVIEWS</small><b>Share race</b></div><span>{reviews.length || 1} snapshots</span></div>
        <div className="chart-legend">{shareSeries.map((series) => <span key={series.label}><i style={{ background: series.color }}/>{series.label}</span>)}</div>
        <LineChart series={shareSeries} height={176} fmt={fmtPct}/>
        <p>Competitor lines use the same formal quarterly market reviews as your ranking.</p>
      </article>
      <article className="market-revenue-card">
        <div className="visual-card-title"><div><small>TRAILING 180 DAYS</small><b>Revenue & profit momentum</b></div><span>{recent.length} days</span></div>
        <div className="chart-legend"><span><i style={{ background: C.cyan }}/>Revenue / Q</span><span><i style={{ background: C.green }}/>Profit / Q</span></div>
        <LineChart series={[{ data: revenue, color: C.cyan, area: true, label: "Revenue" }, { data: profit, color: C.green, label: "Profit" }]} height={176} fmt={fmtMoney} zeroLine markers={markers.filter((marker) => marker.i >= Math.max(0, hist.length - 180)).map((marker) => ({ i: marker.i - Math.max(0, hist.length - 180) }))}/>
        <p>Events are marked on the chart so you can connect decisions with commercial movement.</p>
      </article>
    </div>
  </section>;
}

function CompetitiveWorld({ world }: { world: World }) {
  const [tab, setTab] = useState<"battles" | "rivals" | "news">("battles");
  const [selectedId, setSelectedId] = useState(world.comps[0]?.id ?? "");
  const selected = world.comps.find((competitor) => competitor.id === selectedId) ?? world.comps[0];
  const latestReview = world.competitiveReviews.at(-1);
  const standings = competitiveStandings(world);
  const player = standings.find((standing) => standing.isPlayer);
  return <div className="market-competitive">
    <style>{marketResponsiveCss}</style>
    <section className="market-competitive-hero" style={{ padding: 18, borderRadius: 16, color: "white", background: "linear-gradient(135deg,#102d4a,#1d4f78 58%,#5b3fb1)", boxShadow: "0 12px 28px rgba(16,45,74,.2)", marginBottom: 12 }}>
      <div style={{ color: "#9fd7ff", fontSize: 12, fontWeight: 900, letterSpacing: .9 }}>COMPETITIVE COMMAND CENTER</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "end", flexWrap: "wrap", marginTop: 5 }}>
        <div><h2 style={{ margin: 0, fontSize: 24 }}>{latestReview?.headline ?? "Your market is taking shape"}</h2><div style={{ color: "#c8dced", fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>Rivals remember where you beat them, react to threatened strongholds, and build a history you can study.</div></div>
        <div style={{ display: "flex", gap: 16 }}><BriefMetric label="Position" value={player ? `#${player.rank}` : "—"} /><BriefMetric label="Share" value={player ? fmtPct(player.share) : "—"} /><BriefMetric label="Rivals" value={String(world.comps.length)} /></div>
      </div>
    </section>
    <div className="market-command-tabs">
      {(["battles","rivals","news"] as const).map((item) => <button key={item} onClick={() => setTab(item)} style={{ border: `1px solid ${tab === item ? C.violet : C.line}`, background: tab === item ? C.violet : "white", color: tab === item ? "white" : C.dim, borderRadius: 10, padding: "8px 14px", fontWeight: 850, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>{item === "battles" ? "⚔ Segment battles" : item === "rivals" ? "🏢 Rival dossiers" : "📰 Market news"}</button>)}
    </div>
    {tab === "battles" && <SegmentBattles world={world} />}
    {tab === "rivals" && <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))", gap: 9, marginBottom: 12 }}>{world.comps.map((competitor) => <CompetitorCard key={competitor.id} comp={competitor} onClick={() => setSelectedId(competitor.id)} selected={selected?.id === competitor.id} />)}</div>{selected && <RivalDossier world={world} competitor={selected} />}</>}
    {tab === "news" && <MarketNews world={world} />}
  </div>;
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return <div><small style={{ display: "block", color: "#9fc5df", fontSize: 11, textTransform: "uppercase", letterSpacing: .55 }}>{label}</small><b style={{ display: "block", marginTop: 2, fontSize: 18 }}>{value}</b></div>;
}

function SegmentBattles({ world }: { world: World }) {
  const battles = world.savedSegments.map((segment) => segmentBattle(world, segment)).sort((a, b) => {
    const priority = { Hostile: 0, Contested: 1, Open: 2, Leading: 3 } as const;
    return priority[a.intensity] - priority[b.intensity];
  });
  return <Panel title="Where the market is being won and lost">
    <div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>Every segment is summarized as a strategic situation: who leads, how far behind you are, which products are committed, and the most direct response available.</div>
    {!battles.length ? <div style={{ color: C.faint, fontSize: 12 }}>Create saved market segments to begin tracking competitive battles.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 9 }}>{battles.map((battle) => {
      const tone = battle.intensity === "Leading" ? C.green : battle.intensity === "Hostile" ? C.red : battle.intensity === "Open" ? C.cyan : C.amber;
      return <article key={battle.segment.id} style={{ border: `1px solid ${tone}55`, background: "linear-gradient(180deg,#fff,#f8fbff)", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}><div><b style={{ fontSize: 14 }}>{battle.segment.name}</b><div style={{ color: C.faint, fontSize: 12, marginTop: 2 }}>{battle.playerProducts.length ? `${battle.playerProducts.length} dedicated product${battle.playerProducts.length === 1 ? "" : "s"}` : "No dedicated product"}</div></div><span style={{ color: tone, background: `${tone}12`, border: `1px solid ${tone}55`, padding: "5px 8px", borderRadius: 99, fontSize: 11, fontWeight: 900 }}>{battle.intensity.toUpperCase()}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, marginTop: 10 }}><BattleMetric label="Your rank" value={`#${battle.playerRank}`} /><BattleMetric label="Your share" value={fmtPct(battle.playerShare)} /><BattleMetric label="Leader" value={battle.leader.isPlayer ? "You" : battle.leader.name} /></div>
        <p style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5, margin: "10px 0 0" }}>{battle.situation}</p>
        <div style={{ color: C.ink, background: C.panel2, borderRadius: 8, padding: 10, fontSize: 12.5, lineHeight: 1.45, marginTop: 8 }}><b style={{ color: C.violet }}>Recommended response:</b> {battle.response}</div>
      </article>;
    })}</div>}
  </Panel>;
}

function BattleMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ background: C.panel2, borderRadius: 8, padding: 8, minWidth: 0 }}><small style={{ display: "block", color: C.faint, fontSize: 11 }}>{label}</small><b style={{ display: "block", color: C.ink, fontSize: 12.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</b></div>;
}

function RivalDossier({ world, competitor }: { world: World; competitor: Competitor }) {
  const standing = competitiveStandings(world).find((row) => row.id === competitor.id);
  const history = competitor.shareHistory ?? [];
  const momentum = history.length > 1 ? history.at(-1)!.share - history.at(-2)!.share : 0;
  const actions = [...(competitor.actionHistory ?? [])].reverse();
  return <Panel title={`${competitor.name} — Rival dossier`}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 7, marginBottom: 12 }}>
      <DossierMetric label="Market position" value={standing ? `#${standing.rank} · ${fmtPct(standing.share)}` : "Unknown"} />
      <DossierMetric label="Momentum" value={Math.abs(momentum) < .001 ? "Stable" : `${momentum > 0 ? "▲" : "▼"} ${Math.abs(momentum * 100).toFixed(1)} pp`} />
      <DossierMetric label="Posture" value={competitor.personality === "premium" ? "Premium / quality" : competitor.personality === "discounter" ? "Price aggressor" : "Balanced operator"} />
      <DossierMetric label="Current move" value={competitor.lastAction ?? "holding"} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
      <div><b style={{ fontSize: 14 }}>Product portfolio</b><div style={{ display: "grid", gap: 6, marginTop: 7 }}>{competitor.products.map((product, index) => <div className="rival-product-row" key={product.awarenessKey} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 9, padding: 10, borderRadius: 8, background: C.panel2, fontSize: 12 }}><span><b>{archetypeByKey(product.productKey)?.label ?? product.productKey}</b><small style={{ display: "block", color: C.faint, marginTop: 2, fontSize: 11 }}>{targetSummary(product.target)}</small></span><span>${product.price.toFixed(0)}</span><span>Q{Math.round(product.quality * 100)}</span>{index === 0 && <span style={{ gridColumn: "1/-1", color: C.violet, fontSize: 11, fontWeight: 850 }}>FLAGSHIP LINE</span>}</div>)}</div></div>
      <div><b style={{ fontSize: 14 }}>Strategic memory</b>{!actions.length ? <div style={{ color: C.faint, fontSize: 12, marginTop: 7 }}>No major countermove recorded yet. That will change when you threaten one of their strongholds.</div> : <div style={{ display: "grid", gap: 9, marginTop: 7 }}>{actions.slice(0, 8).map((action, index) => <div key={`${action.tick}_${index}`} style={{ borderLeft: `3px solid ${action.kind === "launch" ? C.red : action.kind === "defend" ? C.amber : C.cyan}`, paddingLeft: 9 }}><b style={{ fontSize: 12.5 }}>{action.headline}</b><div style={{ color: C.dim, fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>{action.detail}</div><small style={{ color: C.faint, fontSize: 11 }}>{gameDate(action.tick)}</small></div>)}</div>}</div>
    </div>
  </Panel>;
}

function DossierMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 8, padding: 10 }}><small style={{ color: C.faint, fontSize: 11 }}>{label}</small><b style={{ display: "block", marginTop: 3, fontSize: 13 }}>{value}</b></div>;
}

function targetSummary(target: Record<string, number>) {
  const label = (axis: keyof typeof AXES) => AXES[axis][Math.round((target[axis] ?? .5) * (AXES[axis].length - 1))];
  return `${label("age")} · ${label("class")} · ${label("geography")}`;
}

function MarketNews({ world }: { world: World }) {
  const news = [...world.events].filter((event) => ["rival","market","product","shock"].includes(event.kind)).reverse().slice(0, 80);
  return <Panel title="Market newswire">
    <div style={{ color: C.dim, fontSize: 11.5, lineHeight: 1.5, marginBottom: 10 }}>A commercial timeline of rival moves, quarterly standings, launches, breakouts and market shocks. Major rival entries and quarterly reviews also interrupt the simulation.</div>
    {!news.length ? <div style={{ color: C.faint }}>The market is quiet—for now.</div> : <div style={{ display: "grid", gap: 7 }}>{news.map((event, index) => <NewsRow key={`${event.tick}_${index}`} event={event} />)}</div>}
  </Panel>;
}

function NewsRow({ event }: { event: MarketEvent }) {
  const major = event.code === "quarterly_market_review" || event.code === "rival_launch";
  const color = event.kind === "rival" ? C.red : event.kind === "product" ? C.violet : C.cyan;
  return <div className="market-news-row" style={{ display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 10, alignItems: "start", border: `1px solid ${major ? `${color}66` : C.line}`, background: major ? `${color}08` : "white", borderRadius: 10, padding: 11 }}><small style={{ color: C.faint, fontSize: 11 }}>{gameDate(event.tick)}</small><div style={{ color: C.ink, fontSize: 12.5, lineHeight: 1.45, fontWeight: major ? 750 : 500 }}>{event.text}</div><span style={{ color, fontSize: 11, fontWeight: 900, letterSpacing: .5 }}>{event.kind.toUpperCase()}</span></div>;
}

function gameDate(tick: number) {
  const year = Math.floor(tick / 360) + 1;
  const month = Math.floor(tick / 30) % 12 + 1;
  const day = tick % 30 + 1;
  return `Y${year} · M${month} · D${day}`;
}

function SegmentOverview({ world }: { world: World }) {
  const revealed = world.revealed.market_map;
  return (
    <Panel title="Market Segments">
      <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 12 }}>
        These are the customer groups you can target in product design and marketing. Create or refine them in Segments; open the population cube only when you need deeper demographic detail.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
        {world.savedSegments.map((seg) => {
          const st = segmentStats(world, seg.filter);
          const needs = Object.entries(st.needPref).sort((a, b) => b[1] - a[1]).slice(0, 2)
            .map(([key]) => world.cfg.needs.find((n) => n.key === key)?.label).filter(Boolean);
          const products = world.player.skus.filter((sku) => sku.targetLabel === seg.name).length;
          return (
            <div key={seg.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <b style={{ color: C.ink, fontSize: 13 }}>{seg.name}</b>
                {products > 0 && <span style={{ color: C.violet, fontSize: 12 }}>{products} targeted product{products === 1 ? "" : "s"}</span>}
              </div>
              <div style={{ color: C.green, fontFamily: "ui-monospace", fontSize: 16, fontWeight: 700, marginTop: 5 }}>{revealed ? fmtMoney(st.market) : "Research required"}</div>
              {revealed ? (
                <>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>{fmtNum(st.population)} people · ${st.avgSpend.toFixed(0)} avg spend/year</div>
                  <div style={{ color: C.faint, fontSize: 12, marginTop: 6 }}>Cares most about <span style={{ color: C.violet }}>{needs.join(" & ")}</span></div>
                  {st.playerShareValue > 0 && <div style={{ color: C.green, fontSize: 12, marginTop: 3 }}>Current captured revenue: {fmtMoney(st.playerShareValue)}</div>}
                </>
              ) : <div style={{ color: C.faint, fontSize: 12, marginTop: 5 }}>Run Population Map Scan to reveal size, spend and needs.</div>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function CubeInspector({ world, selectCell }: { world: World; selectCell: (c: Coord) => void }) {
  const mapRevealed = world.revealed.market_map;
  const [gender, setGender] = useState("Female");
  const [leaning, setLeaning] = useState("Neutral");
  const [geography, setGeography] = useState("Suburban");
  const [family, setFamily] = useState("Family");
  const cellFor = (age: string, klass: string) =>
    world.cube.find((c) => c.coord.gender === gender && c.coord.age === age && c.coord.class === klass && c.coord.leaning === leaning && c.coord.geography === geography && c.coord.family === family)!;
  const maxMarket = Math.max(...world.cube.map((c) => c.head * c.spend));
  const sel = world.selectedCell;
  const info = world.selectedInfo;

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Panel title="Population Cube — click a cell" style={{ flex: "1 1 420px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Seg label="Gender" opts={AXES.gender} val={gender} set={setGender} />
          <Seg label="Leaning" opts={AXES.leaning} val={leaning} set={setLeaning} />
          <Seg label="Geography" opts={AXES.geography} val={geography} set={setGeography} />
          <Seg label="Family" opts={AXES.family} val={family} set={setFamily} />
        </div>
        <div className="population-cube-grid" style={{ display: "grid", gridTemplateColumns: `auto repeat(${AXES.class.length}, 1fr)`, gap: 4, fontSize: 12 }}>
          <div />{AXES.class.map((k) => <div key={k} style={{ color: C.dim, textAlign: "center", paddingBottom: 4 }}>{k}</div>)}
          {AXES.age.map((age) => (
            <React.Fragment key={age}>
              <div style={{ color: C.dim, display: "flex", alignItems: "center", paddingRight: 6 }}>{age}</div>
              {AXES.class.map((klass) => {
                const cell = cellFor(age, klass); const market = cell.head * cell.spend; const intensity = market / maxMarket;
                const isSel = sel && sel.gender === gender && sel.age === age && sel.class === klass && sel.leaning === leaning && sel.geography === geography && sel.family === family;
                return (
                  <button key={klass} onClick={() => selectCell({ gender, age, class: klass, leaning, geography, family })}
                    style={{ background: `rgba(52,195,255,${0.08 + intensity * 0.5})`, border: `1px solid ${isSel ? C.cyan : C.line}`, borderRadius: 6, padding: "10px 6px", cursor: "pointer", color: C.ink }}>
                    {mapRevealed
                      ? <><div style={{ fontFamily: "ui-monospace", fontSize: 12 }}>{fmtMoney(market)}</div><div style={{ color: C.dim, fontSize: 11 }}>{fmtNum(cell.head)} ppl</div></>
                      : <div style={{ color: C.faint, fontSize: 16 }}>◌</div>}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        {!mapRevealed && <div style={{ marginTop: 10, color: C.faint, fontSize: 12 }}>Cells hidden — run a Population Map Scan in Intelligence to reveal sizes.</div>}
      </Panel>
      <Panel title="Cell Detail" style={{ flex: "1 1 280px" }}>
        {!sel ? <div style={{ color: C.faint, fontSize: 13 }}>Click a cell to inspect its size, spend, and who they currently buy.</div> :
          <div>
            <div style={{ color: C.cyan, fontWeight: 600, marginBottom: 8 }}>{sel.age} · {sel.gender} · {sel.class} · {sel.geography} · {sel.family} · {sel.leaning}</div>
            {info && <>
              <Detail k="Headcount" v={fmtNum(info.head) + " people"} />
              <Detail k="Avg annual spend" v={"$" + info.spend.toFixed(0)} />
              <Detail k="Cell market" v={fmtMoney(info.market)} color={C.green} />
              {world.revealed.market_map && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>What they want</div>
                  {topNeeds(world, sel).map((n, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                      <span style={{ color: C.ink }}>{n.label}</span>
                      <div style={{ flex: 1, margin: "0 8px", alignSelf: "center", height: 5, background: C.grid, borderRadius: 3 }}>
                        <div style={{ width: `${n.value * 100}%`, height: "100%", background: C.violet, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "ui-monospace", color: C.dim, fontSize: 11 }}>{(n.value * 100).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ margin: "12px 0 6px", color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6 }}>Who they buy</div>
              {info.breakdown.length === 0 ? <div style={{ color: C.faint, fontSize: 12 }}>Largely unserved — a potential niche.</div> :
                info.breakdown.map((b: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ color: b.isComp ? C.dim : C.violet }}>{b.name}{b.isComp ? "" : " (you)"}</span>
                    <span style={{ fontFamily: "ui-monospace", color: C.ink }}>{fmtPct(b.share)}</span>
                  </div>
                ))}
              {info.breakdown.filter((b: any) => !b.isComp).length === 0 && info.breakdown.length > 0 &&
                <div style={{ marginTop: 8, color: C.amber, fontSize: 11 }}>You don't serve this cell. Big market + weak rival fit = your gap.</div>}
            </>}
          </div>}
      </Panel>
    </div>
  );
}
const Detail = ({ k, v, color = C.ink }: { k: string; v: string; color?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: C.dim }}>{k}</span><span style={{ color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>
);

function topNeeds(world: World, coord: Coord) {
  const cell = world.cube.find((c) => c.coord.gender === coord.gender && c.coord.age === coord.age && c.coord.class === coord.class && c.coord.leaning === coord.leaning && c.coord.geography === coord.geography && c.coord.family === coord.family);
  if (!cell) return [];
  return world.cfg.needs.map((n) => ({ label: n.label, value: cell.needPref[n.key] ?? 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 4);
}

function SharePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: "1 1 90px", background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ color: C.dim, fontSize: 11 }}>{label}</div>
      <div style={{ color, fontSize: 20, fontWeight: 700, fontFamily: "ui-monospace" }}>{fmtPct(value)}</div>
    </div>
  );
}

const marketResponsiveCss = `
.market-advanced-toggle,.market-command-tabs button,.population-cube-grid button{min-height:44px}.market-command-tabs{display:flex;gap:7px;margin-bottom:12px;overflow-x:auto;scroll-snap-type:x proximity;position:relative;padding:2px 26px 4px 2px}.market-command-tabs:after{content:'›';position:sticky;right:-26px;min-width:28px;display:grid;place-items:center;background:linear-gradient(90deg,transparent,#eef3f7 48%);color:#42617a;font-size:24px;pointer-events:none}.market-command-tabs button{scroll-snap-align:start}.market-visual-head>div:first-child>span{font-size:11px!important}.market-visual-head p{font-size:12px!important}.visual-card-title small,.visual-card-title>span{font-size:11px!important}.visual-card-title b{font-size:14px!important}.market-rank-list>div,.market-rank-list strong{font-size:11px!important}.chart-legend,.market-visual-grid article>p{font-size:11px!important}.population-cube-grid button{min-width:84px}.population-cube-grid{overflow-x:auto;padding-bottom:6px}.market-competitive button{min-height:44px}.market-competitive [style*="font-size: 9"],.market-competitive [style*="font-size: 8"],.market-competitive [style*="font-size: 7"]{font-size:11px!important}
@media(max-width:680px){.market-competitive-hero>div:last-child{align-items:flex-start!important;flex-direction:column}.market-command-tabs button{min-width:150px}.rival-product-row{grid-template-columns:minmax(0,1fr) auto!important}.rival-product-row>span:nth-child(3){grid-column:2}.market-news-row{grid-template-columns:1fr auto!important}.market-news-row>div{grid-column:1/-1;grid-row:2}.product-market-metrics{grid-template-columns:1fr!important}.product-market-compare-row{grid-template-columns:1fr!important;gap:6px!important}.market-scope-select{font-size:16px!important}.market-visual-dashboard{padding:15px!important}.market-rank-list>div{padding:7px 8px!important}.market-visual-grid article>p{line-height:1.45!important}}
`;
