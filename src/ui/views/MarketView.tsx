import React, { useState } from "react";
import { C, fmtMoney, fmtNum, fmtPct } from "../theme";
import { DonutChart, Panel, LineChart, Seg } from "../components";
import { CompetitorCard, CompetitorLogoMark } from "../visualIdentity";
import { segmentStats } from "../../engine/segments";
import { AXES } from "../../engine/industries";
import { competitiveStandings, segmentBattle } from "../../engine/competitiveWorld";
import { archetypeByKey } from "../../engine/productCatalog";
import type { World, Coord, Competitor, MarketEvent } from "../../engine/types";

export function MarketView({ world, hist, selectCell, mode = "overview" }:
  { world: World; hist: World["history"]; selectCell: (c: Coord) => void; mode?: "overview" | "competitive" }) {
  const tier = world.player.intelDept;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const intelligenceUnlocked = (world.player.research?.completed ?? []).includes("market_intelligence");
  // Public rival moves, shelf prices and quarterly rankings are always visible.
  // Research still gates the deeper population cube and formal market analysis.
  if (mode === "competitive") return <CompetitiveWorld world={world} />;
  if (!intelligenceUnlocked) {
    return <Panel><div style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>Structured market intelligence has not been developed yet.</div><div style={{ color: C.faint, fontSize: 12, marginTop: 10 }}>Research <b>Market Intelligence</b> from Company → Research. After that, seat Strategy / Intelligence staff to operate the function.</div></Panel>;
  }
  if (tier === 0) {
    return (
      <Panel>
        <div style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
          You have no Market Intelligence department. You can't see the market yet.
        </div>
        <div style={{ color: C.faint, fontSize: 12, marginTop: 10 }}>
          Assign Strategy / Intelligence staff to an office on the Campus to unlock market visibility.
        </div>
      </Panel>
    );
  }
  const markers = world.events.map((e) => ({ i: hist.findIndex((h) => h.tick >= e.tick) })).filter((m) => m.i >= 0);
  return (
    <>
      <MarketPulseDashboard world={world} hist={hist} markers={markers} />
      <SegmentOverview world={world} />
      <Panel title="Advanced Market Research">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, flex: "1 1 320px" }}>
            Your market contains {world.cube.length} detailed customer cells. You normally manage recognizable segments; open the population cube only when you want analyst-level detail.
          </div>
          <button onClick={() => setShowAdvanced((v) => !v)} style={{ background: C.panel2, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 600 }}>
            {showAdvanced ? "Hide population cube" : "Open population cube"}
          </button>
        </div>
      </Panel>
      {showAdvanced && <CubeInspector world={world} selectCell={selectCell} />}
    </>
  );
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
  return <>
    <section style={{ padding: 15, borderRadius: 14, color: "white", background: "linear-gradient(135deg,#102d4a,#1d4f78 58%,#5b3fb1)", boxShadow: "0 12px 28px rgba(16,45,74,.2)", marginBottom: 12 }}>
      <div style={{ color: "#9fd7ff", fontSize: 9, fontWeight: 900, letterSpacing: .9 }}>COMPETITIVE COMMAND CENTER</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "end", flexWrap: "wrap", marginTop: 5 }}>
        <div><h2 style={{ margin: 0, fontSize: 21 }}>{latestReview?.headline ?? "Your market is taking shape"}</h2><div style={{ color: "#c8dced", fontSize: 11, marginTop: 4 }}>Rivals remember where you beat them, react to threatened strongholds, and build a history you can study.</div></div>
        <div style={{ display: "flex", gap: 16 }}><BriefMetric label="Position" value={player ? `#${player.rank}` : "—"} /><BriefMetric label="Share" value={player ? fmtPct(player.share) : "—"} /><BriefMetric label="Rivals" value={String(world.comps.length)} /></div>
      </div>
    </section>
    <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
      {(["battles","rivals","news"] as const).map((item) => <button key={item} onClick={() => setTab(item)} style={{ border: `1px solid ${tab === item ? C.violet : C.line}`, background: tab === item ? C.violet : "white", color: tab === item ? "white" : C.dim, borderRadius: 9, padding: "8px 12px", fontWeight: 850, fontSize: 10.5, cursor: "pointer", whiteSpace: "nowrap" }}>{item === "battles" ? "⚔ Segment battles" : item === "rivals" ? "🏢 Rival dossiers" : "📰 Market news"}</button>)}
    </div>
    {tab === "battles" && <SegmentBattles world={world} />}
    {tab === "rivals" && <><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))", gap: 9, marginBottom: 12 }}>{world.comps.map((competitor) => <CompetitorCard key={competitor.id} comp={competitor} onClick={() => setSelectedId(competitor.id)} selected={selected?.id === competitor.id} />)}</div>{selected && <RivalDossier world={world} competitor={selected} />}</>}
    {tab === "news" && <MarketNews world={world} />}
  </>;
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return <div><small style={{ display: "block", color: "#9fc5df", fontSize: 8, textTransform: "uppercase", letterSpacing: .55 }}>{label}</small><b style={{ display: "block", marginTop: 2, fontSize: 18 }}>{value}</b></div>;
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}><div><b style={{ fontSize: 13.5 }}>{battle.segment.name}</b><div style={{ color: C.faint, fontSize: 9.5, marginTop: 2 }}>{battle.playerProducts.length ? `${battle.playerProducts.length} dedicated product${battle.playerProducts.length === 1 ? "" : "s"}` : "No dedicated product"}</div></div><span style={{ color: tone, background: `${tone}12`, border: `1px solid ${tone}55`, padding: "3px 7px", borderRadius: 99, fontSize: 8.5, fontWeight: 900 }}>{battle.intensity.toUpperCase()}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, marginTop: 10 }}><BattleMetric label="Your rank" value={`#${battle.playerRank}`} /><BattleMetric label="Your share" value={fmtPct(battle.playerShare)} /><BattleMetric label="Leader" value={battle.leader.isPlayer ? "You" : battle.leader.name} /></div>
        <p style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45, margin: "10px 0 0" }}>{battle.situation}</p>
        <div style={{ color: C.ink, background: C.panel2, borderRadius: 8, padding: 8, fontSize: 10.5, lineHeight: 1.42, marginTop: 8 }}><b style={{ color: C.violet }}>Recommended response:</b> {battle.response}</div>
      </article>;
    })}</div>}
  </Panel>;
}

function BattleMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ background: C.panel2, borderRadius: 7, padding: 6, minWidth: 0 }}><small style={{ display: "block", color: C.faint, fontSize: 7.5 }}>{label}</small><b style={{ display: "block", color: C.ink, fontSize: 10.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</b></div>;
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
      <div><b style={{ fontSize: 11.5 }}>Product portfolio</b><div style={{ display: "grid", gap: 6, marginTop: 7 }}>{competitor.products.map((product, index) => <div key={product.awarenessKey} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 9, padding: 9, borderRadius: 8, background: C.panel2, fontSize: 10.5 }}><span><b>{archetypeByKey(product.productKey)?.label ?? product.productKey}</b><small style={{ display: "block", color: C.faint, marginTop: 2 }}>{targetSummary(product.target)}</small></span><span>${product.price.toFixed(0)}</span><span>Q{Math.round(product.quality * 100)}</span>{index === 0 && <span style={{ gridColumn: "1/-1", color: C.violet, fontSize: 8.5, fontWeight: 850 }}>FLAGSHIP LINE</span>}</div>)}</div></div>
      <div><b style={{ fontSize: 11.5 }}>Strategic memory</b>{!actions.length ? <div style={{ color: C.faint, fontSize: 10.5, marginTop: 7 }}>No major countermove recorded yet. That will change when you threaten one of their strongholds.</div> : <div style={{ display: "grid", gap: 7, marginTop: 7 }}>{actions.slice(0, 8).map((action, index) => <div key={`${action.tick}_${index}`} style={{ borderLeft: `3px solid ${action.kind === "launch" ? C.red : action.kind === "defend" ? C.amber : C.cyan}`, paddingLeft: 8 }}><b style={{ fontSize: 10.5 }}>{action.headline}</b><div style={{ color: C.dim, fontSize: 9.5, lineHeight: 1.35, marginTop: 2 }}>{action.detail}</div><small style={{ color: C.faint }}>{gameDate(action.tick)}</small></div>)}</div>}</div>
    </div>
  </Panel>;
}

function DossierMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 8, padding: 8 }}><small style={{ color: C.faint, fontSize: 8 }}>{label}</small><b style={{ display: "block", marginTop: 3, fontSize: 11.5 }}>{value}</b></div>;
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
  return <div style={{ display: "grid", gridTemplateColumns: "78px 1fr auto", gap: 9, alignItems: "start", border: `1px solid ${major ? `${color}66` : C.line}`, background: major ? `${color}08` : "white", borderRadius: 9, padding: 9 }}><small style={{ color: C.faint, fontSize: 8.5 }}>{gameDate(event.tick)}</small><div style={{ color: C.ink, fontSize: 10.5, lineHeight: 1.4, fontWeight: major ? 750 : 500 }}>{event.text}</div><span style={{ color, fontSize: 7.5, fontWeight: 900, letterSpacing: .5 }}>{event.kind.toUpperCase()}</span></div>;
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
                {products > 0 && <span style={{ color: C.violet, fontSize: 10.5 }}>{products} targeted product{products === 1 ? "" : "s"}</span>}
              </div>
              <div style={{ color: C.green, fontFamily: "ui-monospace", fontSize: 16, fontWeight: 700, marginTop: 5 }}>{revealed ? fmtMoney(st.market) : "Research required"}</div>
              {revealed ? (
                <>
                  <div style={{ color: C.dim, fontSize: 10.5, marginTop: 2 }}>{fmtNum(st.population)} people · ${st.avgSpend.toFixed(0)} avg spend/year</div>
                  <div style={{ color: C.faint, fontSize: 10.5, marginTop: 6 }}>Cares most about <span style={{ color: C.violet }}>{needs.join(" & ")}</span></div>
                  {st.playerShareValue > 0 && <div style={{ color: C.green, fontSize: 10.5, marginTop: 3 }}>Current captured revenue: {fmtMoney(st.playerShareValue)}</div>}
                </>
              ) : <div style={{ color: C.faint, fontSize: 10.5, marginTop: 5 }}>Run Population Map Scan to reveal size, spend and needs.</div>}
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
        <div style={{ display: "grid", gridTemplateColumns: `auto repeat(${AXES.class.length}, 1fr)`, gap: 4, fontSize: 11 }}>
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
                      ? <><div style={{ fontFamily: "ui-monospace", fontSize: 12 }}>{fmtMoney(market)}</div><div style={{ color: C.dim, fontSize: 9 }}>{fmtNum(cell.head)} ppl</div></>
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
