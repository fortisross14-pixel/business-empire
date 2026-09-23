import React, { useState } from "react";
import { C, fmtMoney, fmtNum, fmtPct } from "../theme";
import { Panel, LineChart, Seg } from "../components";
import { CompetitorCard } from "../visualIdentity";
import { segmentStats } from "../../engine/segments";
import { AXES } from "../../engine/industries";
import type { World, Coord } from "../../engine/types";

export function MarketView({ world, hist, selectCell }:
  { world: World; hist: World["history"]; selectCell: (c: Coord) => void }) {
  const tier = world.player.intelDept;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const intelligenceUnlocked = (world.player.research?.completed ?? []).includes("market_intelligence");
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
      <Panel title="Your Market Share" style={{ marginBottom: 16 }}>
        {world.live && (
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <SharePill label="Today" value={world.live.overallShare} color={C.violet} />
            <SharePill label="This month" value={world.live.shareMonth} color={C.violet} />
            <SharePill label="This year" value={world.live.shareYear} color={C.violet} />
          </div>
        )}
        <LineChart series={[{ data: hist.map((h) => h.share), color: C.violet }]} fmt={fmtPct} markers={markers} />
        <div style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>Daily share spikes when you sell and drops to zero when you're out of stock. Month/year smooth that out — a product that sells out mid-period can still post a strong annual share.</div>
      </Panel>
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
      <Panel title="Competitive Landscape" style={{ marginTop: 16 }}>
        <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 12 }}>Your core rivals by current market setup. These cards are generated from competitor identity + flagship category so the market feels like a real shelf, not anonymous spreadsheets.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
          {world.comps.map((comp) => <CompetitorCard key={comp.id} comp={comp} />)}
        </div>
      </Panel>

    </>
  );
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
