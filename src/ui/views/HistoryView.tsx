import React, { useMemo, useState } from "react";
import type { AnnualReview, ChronicleEntry, World } from "../../engine/types";
import { chronicleRecords, productLegacyTags } from "../../engine/chronicle";
import { C, fmtMoney, fmtNum, fmtPct } from "../theme";
import { Panel } from "../components";
import { archetypeByKey } from "../../engine/productCatalog";
import { estimateIPValue } from "../../engine/ip";

const kindLabel: Record<string, string> = {
  founding: "Founding", product: "Product", people: "People", operations: "Operations",
  finance: "Finance", market: "Market", milestone: "Milestone", annual: "Annual review",
};

const importanceLabel = (v: number) => v === 3 ? "ICONIC" : v === 2 ? "MAJOR" : "NOTABLE";
const importanceColor = (v: number) => v === 3 ? C.amber : v === 2 ? C.violet : C.faint;
const yearOfTick = (tick: number) => Math.floor(Math.max(0, tick - 1) / 360) + 1;
const monthOfTick = (tick: number) => Math.floor((Math.max(1, tick) - 1) / 30) % 12 + 1;

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: C.faint, fontSize: 12.5, padding: "12px 0" }}>{children}</div>;
}

export function HistoryView({ world, mode }: { world: World; mode: "chronicle" | "annual" | "records" }) {
  return <div className="be-history">
    <HistoryStyles />
    {mode === "annual" ? <AnnualReviews world={world} /> : mode === "records" ? <RecordsView world={world} /> : <ChronicleTimeline world={world} />}
  </div>;
}

function HistoryStyles() {
  return <style>{`
    .be-history{--hist-navy:#10265d;--hist-blue:#2675ec;--hist-gold:#f3b838;color:${C.ink};padding-bottom:24px}
    .hist-hero{position:relative;overflow:hidden;min-height:174px;padding:24px;border-radius:22px;margin-bottom:16px;color:white;background:linear-gradient(125deg,#10265d 0%,#174a9b 55%,#4b2fa3 100%);box-shadow:0 16px 38px rgba(16,38,93,.22)}
    .hist-hero:before{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-55px;top:-110px;background:radial-gradient(circle,rgba(105,214,255,.55),rgba(105,214,255,0) 66%)}
    .hist-hero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:62px;opacity:.35;background:linear-gradient(135deg,transparent 8%,rgba(255,255,255,.25) 8.5% 10%,transparent 10.5% 17%,rgba(255,255,255,.2) 17.5% 19%,transparent 19.5%)}
    .hist-hero__content{position:relative;z-index:1;max-width:720px}.hist-kicker{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#bde5ff}.hist-hero h2{font-size:clamp(25px,3.2vw,38px);line-height:1.05;margin:7px 0 9px;color:white}.hist-hero p{max-width:640px;margin:0;color:#e5efff;font-size:14px;line-height:1.55}
    .hist-metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:10px;margin-top:18px;max-width:650px}.hist-metric{padding:11px 13px;border-radius:13px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.23);backdrop-filter:blur(8px)}.hist-metric small{display:block;color:#d7e7ff;font-size:11px}.hist-metric b{display:block;font-size:20px;margin-top:2px;color:white}
    .hist-filter{display:flex;gap:8px;margin:0 0 17px;overflow:auto;padding:2px}.hist-filter button,.hist-year-tabs button{min-height:44px;padding:8px 16px;border-radius:999px;border:1px solid ${C.line};background:${C.panel};color:${C.dim};font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:.16s ease}.hist-filter button:hover,.hist-year-tabs button:hover{transform:translateY(-1px);border-color:#8bb7ff;box-shadow:0 5px 14px rgba(35,92,175,.12)}.hist-filter button:active,.hist-year-tabs button:active{transform:translateY(1px)}.hist-filter button:focus-visible,.hist-year-tabs button:focus-visible{outline:3px solid rgba(38,117,236,.3);outline-offset:2px}.hist-filter button.active,.hist-year-tabs button.active{color:#fff;border-color:#2675ec;background:linear-gradient(135deg,#277bed,#6155e8);box-shadow:0 7px 17px rgba(39,123,237,.24)}
    .hist-year{margin:18px 0 24px}.hist-year__rail{display:flex;align-items:center;gap:11px;margin-bottom:10px}.hist-year__badge{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#fff4bd,#f8c64c);border:2px solid #fff;box-shadow:0 5px 14px rgba(182,120,8,.2);color:#70440a;font-weight:950;font-size:14px}.hist-year__rail i{height:3px;flex:1;border-radius:9px;background:linear-gradient(90deg,#f1c14e,${C.line})}
    .chron-card{position:relative;background:${C.panel};border:1px solid ${C.line};border-radius:16px;padding:14px;display:grid;grid-template-columns:50px minmax(0,1fr) auto;gap:12px;align-items:start;box-shadow:0 4px 13px rgba(30,47,88,.06);transition:.17s ease}.chron-card:hover{transform:translateY(-2px);border-color:#b7cdf6;box-shadow:0 9px 22px rgba(30,76,145,.12)}.chron-card.iconic{border-color:#f4cf64;background:linear-gradient(110deg,#fffdf6,#fff 55%);box-shadow:0 8px 24px rgba(201,142,17,.13)}.chron-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:25px;background:linear-gradient(145deg,#edf5ff,#e7e5ff);box-shadow:inset 0 0 0 1px #dbe6fb}.chron-card.iconic .chron-icon{background:linear-gradient(145deg,#fff5b9,#ffd75d)}.chron-title{font-size:14.5px;font-weight:850}.chron-copy{color:${C.dim};font-size:13px;line-height:1.5;margin-top:4px}.chron-meta{text-align:right;color:${C.faint};font-size:11px;line-height:1.55;white-space:nowrap}.chron-tag{display:inline-flex;margin-left:7px;padding:3px 7px;border-radius:999px;font-size:9px;font-weight:950;letter-spacing:.07em;vertical-align:2px}
    .hist-section-title{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:22px 2px 10px}.hist-section-title h3{font-size:18px;margin:0}.hist-section-title span{font-size:12px;color:${C.faint}}
    .hist-year-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.review-cover{overflow:hidden;border-radius:20px;border:1px solid #c8d8f4;background:linear-gradient(140deg,#f7fbff 0%,#fff 60%,#fff7df);box-shadow:0 9px 24px rgba(37,72,129,.1);margin-bottom:14px}.review-cover__head{padding:22px;color:white;background:linear-gradient(115deg,#142e69,#2d73d9 70%,#8058df)}.review-cover__head small{color:#cbe7ff;font-size:11px;font-weight:900;letter-spacing:.15em}.review-cover__head h2{font-size:clamp(22px,3vw,34px);margin:8px 0 0;line-height:1.15;color:white}.review-grid{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:1px;background:#dae4f4}.review-cell{padding:15px;background:white}.review-cell small{display:block;color:${C.faint};font-size:11px}.review-cell b{display:block;font-size:18px;margin-top:4px}.review-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.story-list{display:grid;gap:8px}.story-row{display:flex;gap:10px;padding:10px;border-radius:12px;background:${C.panel2};border:1px solid ${C.line}}.story-row>span{font-size:22px}.story-row b{font-size:13px}.story-row p{font-size:12px;line-height:1.45;color:${C.dim};margin:3px 0 0}
    .record-podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:-32px 0 18px;position:relative;z-index:3;padding:0 18px}.record-podium article{min-height:118px;padding:14px;border-radius:17px;background:white;border:1px solid #d8e3f5;box-shadow:0 8px 22px rgba(24,63,125,.12)}.record-podium .record-icon{font-size:24px}.record-podium small{display:block;color:${C.faint};font-size:11px;margin-top:5px}.record-podium b{display:block;font-size:15px;margin-top:3px}.record-podium em{display:block;color:${C.violet};font-size:11px;font-style:normal;margin-top:4px}.record-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:10px}.record-card{background:${C.panel};border:1px solid ${C.line};border-radius:15px;padding:14px;box-shadow:0 3px 10px rgba(24,50,97,.05)}.record-card small{color:${C.faint};font-size:11px}.record-card b{display:block;font-size:14px;margin-top:5px}.record-card span{display:block;color:${C.violet};font-size:12px;margin-top:4px}
    .legacy-products{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:10px}.legacy-product{padding:14px;border:1px solid ${C.line};border-radius:16px;background:linear-gradient(145deg,#fff,#f8fbff);box-shadow:0 3px 11px rgba(29,54,96,.06)}.legacy-product__top{display:flex;gap:11px;align-items:center}.legacy-product__icon{width:45px;height:45px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#e5f1ff,#ece8ff);font-size:22px}.legacy-product h4{font-size:14px;margin:0}.legacy-product small{font-size:11px;color:${C.faint}}.legacy-product__metrics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}.legacy-product__metrics div{padding:8px;background:white;border:1px solid ${C.line};border-radius:10px}.legacy-product__metrics span{display:block;color:${C.faint};font-size:10px}.legacy-product__metrics b{display:block;margin-top:2px;font-size:13px}.legacy-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.legacy-tags span{padding:4px 7px;border-radius:99px;border:1px solid #dbe4f3;background:#f5f8fd;color:${C.dim};font-size:10px;font-weight:750}
    .be-history .chron-tag{font-size:10.5px}.be-history .legacy-product__metrics span,.be-history .legacy-tags span{font-size:11px}
    @media(max-width:700px){.hist-hero{padding:19px 17px;min-height:0}.hist-metrics{grid-template-columns:1fr 1fr}.hist-metrics .hist-metric:last-child{grid-column:1/-1}.chron-card{grid-template-columns:46px 1fr}.chron-meta{grid-column:2;text-align:left}.review-grid{grid-template-columns:1fr 1fr}.review-panels,.record-podium{grid-template-columns:1fr}.record-podium{margin:-20px 0 15px;padding:0 10px}.record-podium article{min-height:0}.hist-section-title{align-items:start;flex-direction:column}.legacy-products{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){.chron-card,.hist-filter button,.hist-year-tabs button{transition:none}}
  `}</style>;
}

function ChronicleTimeline({ world }: { world: World }) {
  const [filter, setFilter] = useState<"all" | "major" | "iconic">("major");
  const all = [...(world.chronicle?.entries ?? [])].sort((a, b) => b.tick - a.tick || b.importance - a.importance);
  const entries = all.filter((e) => filter === "all" || (filter === "major" ? e.importance >= 2 : e.importance >= 3));
  const groups = useMemo(() => {
    const out: { year: number; entries: ChronicleEntry[] }[] = [];
    for (const e of entries) {
      const y = e.year ?? yearOfTick(e.tick);
      let g = out.find((x) => x.year === y);
      if (!g) { g = { year: y, entries: [] }; out.push(g); }
      g.entries.push(e);
    }
    return out.sort((a, b) => b.year - a.year);
  }, [entries]);
  const iconic = all.filter((e) => e.importance === 3).length;
  const launches = all.filter((e) => e.tags?.includes("launch")).length;

  return <div>
    <section className="hist-hero">
      <div className="hist-hero__content"><div className="hist-kicker">The company magazine · permanent edition</div><h2>{world.company} Chronicle</h2><p>The launches, people and turning points that built your business. Everyday alerts fade; these stories become your permanent company history.</p></div>
      <div className="hist-metrics"><HeroMetric label="Years in business" value={`${Math.floor(world.tick / 360) + 1}`} /><HeroMetric label="Products launched" value={`${launches}`} /><HeroMetric label="Iconic moments" value={`${iconic}`} /></div>
    </section>
    <div className="hist-filter" aria-label="Chronicle importance filter">
      {(["major", "iconic", "all"] as const).map((f) => <button className={filter === f ? "active" : ""} aria-pressed={filter === f} key={f} onClick={() => setFilter(f)}>{f === "major" ? "★ Major & iconic" : f === "iconic" ? "🏆 Iconic only" : "All stories"}</button>)}
    </div>

    {groups.length === 0 ? <Panel title="The story begins"><Empty>No permanent history at this filter level yet. The company is still writing its first chapter.</Empty></Panel> : groups.map((group) => <div key={group.year} className="hist-year">
      <div className="hist-year__rail">
        <div className="hist-year__badge">Y{group.year}</div><i />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {group.entries.map((e) => <ChronicleCard key={e.id} entry={e} />)}
      </div>
    </div>)}
  </div>;
}

function ChronicleCard({ entry: e }: { entry: ChronicleEntry }) {
  const color = importanceColor(e.importance);
  return <div className={`chron-card ${e.importance === 3 ? "iconic" : ""}`}>
    <div className="chron-icon">{e.icon}</div>
    <div>
      <div><b className="chron-title">{e.title}</b><span className="chron-tag" style={{ color, border: `1px solid ${color}55`, background: `${color}16` }}>{importanceLabel(e.importance)}</span></div>
      <div className="chron-copy">{e.text}</div>
    </div>
    <div className="chron-meta">Year {yearOfTick(e.tick)} · Month {monthOfTick(e.tick)}<br />{kindLabel[e.kind] ?? e.kind}</div>
  </div>;
}

function AnnualReviews({ world }: { world: World }) {
  const reviews = [...(world.chronicle?.annualReviews ?? [])].sort((a, b) => b.year - a.year);
  const [selectedYear, setSelectedYear] = useState<number | null>(reviews[0]?.year ?? null);
  const selected = reviews.find((r) => r.year === selectedYear) ?? reviews[0];
  const acc = world.chronicle?.yearAccumulator;

  return <div>
    <section className="hist-hero">
      <div className="hist-hero__content"><div className="hist-kicker">Annual review · boardroom edition</div><h2>The Year in Business</h2><p>Open any completed year as a magazine issue: results on the cover, people and products inside, and the decisions that defined the chapter.</p></div>
      <div className="hist-metrics"><HeroMetric label="Completed editions" value={`${reviews.length}`} /><HeroMetric label="Current year" value={`${acc?.year ?? Math.floor(world.tick / 360) + 1}`} /><HeroMetric label="Company" value={world.company} /></div>
    </section>
    {reviews.length > 0 && <div className="hist-year-tabs" aria-label="Annual review year">{reviews.map((r) => <button aria-pressed={selected?.year === r.year} className={selected?.year === r.year ? "active" : ""} key={r.year} onClick={() => setSelectedYear(r.year)}>Year {r.year}</button>)}</div>}

    {selected ? <AnnualReviewCard world={world} review={selected} /> : <Panel title="First review pending"><Empty>Year 1 is still in progress. The first annual review closes after 360 simulated days.</Empty></Panel>}

    {acc && <Panel title={`🔴 Year ${acc.year} — Live newsroom`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9 }}>
        <ReviewMetric label="Revenue so far" value={fmtMoney(acc.revenue)} />
        <ReviewMetric label="Profit so far" value={fmtMoney(acc.profit)} tone={acc.profit >= 0 ? C.green : C.red} />
        <ReviewMetric label="Units" value={fmtNum(acc.units)} />
        <ReviewMetric label="Peak share" value={fmtPct(acc.peakShare)} />
        <ReviewMetric label="Cash" value={fmtMoney(world.player.cash)} tone={world.player.cash >= 0 ? C.ink : C.red} />
      </div>
      <div style={{ color: C.faint, fontSize: 12, marginTop: 10 }}>Live figures accumulate realized daily results; they become an immutable edition when the year closes.</div>
    </Panel>}
  </div>;
}

function AnnualReviewCard({ world, review: r }: { world: World; review: AnnualReview }) {
  const entries = (world.chronicle?.entries ?? []).filter((e) => r.highlightEntryIds.includes(e.id));
  return <div>
    <section className="review-cover">
      <div className="review-cover__head"><small>YEAR {r.year} · {world.company.toUpperCase()}</small><h2>{r.headline}</h2></div>
      <div className="review-grid"><ReviewCell label="Revenue" value={fmtMoney(r.revenue)} /><ReviewCell label="Profit" value={fmtMoney(r.profit)} tone={r.profit >= 0 ? C.green : C.red} /><ReviewCell label="Units sold" value={fmtNum(r.units)} /><ReviewCell label="Peak share" value={fmtPct(r.peakShare)} /><ReviewCell label="Year-end cash" value={fmtMoney(r.endCash)} tone={r.endCash >= 0 ? C.ink : C.red} /><ReviewCell label="Named staff" value={`${r.endingEmployees}`} /></div>
    </section>
    <div className="review-panels">
      <Panel title="Portfolio & People">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 12 }}><MiniStat label="Hires" value={`${r.hires}`} /><MiniStat label="Promotions" value={`${r.promotions}`} /><MiniStat label="Departures" value={`${r.departures}`} /></div>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 7 }}>Products launched</div>
        {r.productsLaunched.length ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{r.productsLaunched.map((p) => <span key={p} style={{ padding: "6px 9px", borderRadius: 99, background: "#ede9fe", border: "1px solid #ddd6fe", color: C.violet, fontSize: 11, fontWeight: 800 }}>{p}</span>)}</div> : <Empty>No product launches this year.</Empty>}
      </Panel>
      <Panel title="Defining Moments">
        {entries.length ? <div className="story-list">{entries.map((e) => <div className="story-row" key={e.id}><span>{e.icon}</span><div><b>{e.title}</b><p>{e.text}</p></div></div>)}</div> : <Empty>A quieter year: no major or iconic moments were recorded.</Empty>}
      </Panel>
    </div>
  </div>;
}

function RecordsView({ world }: { world: World }) {
  const records = chronicleRecords(world);
  const iconic = [...(world.chronicle?.entries ?? [])].filter((e) => e.importance === 3).sort((a, b) => b.tick - a.tick);
  const launched = [...world.player.skus].filter((s) => s.launchTick > 0).sort((a, b) => b.unitsSoldTotal - a.unitsSoldTotal);
  const ownedIPs = [...(world.ipAssets ?? [])].filter((ip) => ip.ownerType === "player").sort((a, b) => estimateIPValue(b) - estimateIPValue(a));
  const topIP = ownedIPs[0];

  return <div>
    <section className="hist-hero">
      <div className="hist-hero__content"><div className="hist-kicker">Hall of records · all-time leaders</div><h2>{world.company} Record Book</h2><p>Your biggest commercial wins, strongest years and enduring product legacies—kept together in one celebratory hall of fame.</p></div>
      <div className="hist-metrics"><HeroMetric label="Products on record" value={`${launched.length}`} /><HeroMetric label="Iconic moments" value={`${iconic.length}`} /><HeroMetric label="Owned IP" value={`${ownedIPs.length}`} /></div>
    </section>
    <div className="record-podium">
      <Podium icon="📦" label="Best seller" value={records.topUnits?.name ?? "No launch yet"} detail={records.topUnits ? `${fmtNum(records.topUnits.unitsSoldTotal)} lifetime units` : "Build your first product legacy"} />
      <Podium icon="💰" label="Contribution champion" value={records.topContribution?.name ?? "No launch yet"} detail={records.topContribution ? fmtMoney(records.topContribution.contributionTotal ?? 0) : "Awaiting a profitable launch"} />
      <Podium icon="💎" label="Most valuable IP" value={topIP?.name ?? "No original IP"} detail={topIP ? `${fmtMoney(estimateIPValue(topIP))} estimated value` : "Create or acquire an IP"} />
    </div>
    <div className="hist-section-title"><h3>Company bests</h3><span>Benchmarks from this save</span></div>
    <div className="record-grid">
        <RecordCard label="Longest-running product" value={records.longestProduct?.name ?? "—"} detail={records.longestProduct ? `${Math.max(0, Math.floor((world.tick - records.longestProduct.launchTick) / 30))} months` : "No launch yet"} />
        <RecordCard label="Best revenue year" value={records.bestRevenueYear ? `Year ${records.bestRevenueYear.year}` : "—"} detail={records.bestRevenueYear ? fmtMoney(records.bestRevenueYear.revenue) : "First year still open"} />
        <RecordCard label="Best profit year" value={records.bestProfitYear ? `Year ${records.bestProfitYear.year}` : "—"} detail={records.bestProfitYear ? fmtMoney(records.bestProfitYear.profit) : "First year still open"} />
        <RecordCard label="Highest annual share" value={records.bestShareYear ? `Year ${records.bestShareYear.year}` : "—"} detail={records.bestShareYear ? fmtPct(records.bestShareYear.peakShare) : "First year still open"} />
        <RecordCard label="Toughest year" value={records.worstProfitYear ? `Year ${records.worstProfitYear.year}` : "—"} detail={records.worstProfitYear ? `${records.worstProfitYear.profit >= 0 ? "Lowest profit " : "Loss "}${fmtMoney(records.worstProfitYear.profit)}` : "First year still open"} />
        <RecordCard label="Longest-serving leader" value={records.longestPerson?.name ?? "—"} detail={records.longestPerson ? records.longestPerson.title : "No staff history yet"} />
        <RecordCard label="Most impactful PM" value={records.topPm?.p.name ?? "—"} detail={records.topPm ? `${fmtNum(records.topPm.units)} units across products led` : "No PM product history yet"} />
    </div>

    <div className="hist-section-title"><h3>✨ Iconic moments</h3><span>The stories people will remember</span></div>
    <Panel>
      {iconic.length === 0 ? <Empty>Iconic moments are deliberately rare. The Chronicle will surface true turning points rather than manufacture one every quarter.</Empty> : iconic.map((e) => <ChronicleCard key={e.id} entry={e} />)}
    </Panel>

    <div className="hist-section-title"><h3>Product legacy</h3><span>Every launch leaves a footprint</span></div>
      {launched.length === 0 ? <Panel><Empty>No launched products yet.</Empty></Panel> : <div className="legacy-products">{launched.map((sku) => {
          const tags = productLegacyTags(world, sku);
          const leads = [...new Set((sku.leadHistory ?? []).map((h) => h.personName))];
          return <article className="legacy-product" key={sku.id}>
            <div className="legacy-product__top"><div className="legacy-product__icon">📦</div><div><h4>{sku.name}</h4><small>{archetypeByKey(sku.productKey)?.label ?? sku.productKey} · Launched Y{yearOfTick(sku.launchTick)} M{monthOfTick(sku.launchTick)}</small></div></div>
            <div className="legacy-product__metrics"><div><span>Lifetime units</span><b>{fmtNum(sku.unitsSoldTotal)}</b></div><div><span>Contribution</span><b style={{ color: (sku.contributionTotal ?? 0) >= 0 ? C.green : C.red }}>{fmtMoney(sku.contributionTotal ?? 0)}</b></div></div>
            <div className="legacy-tags">{tags.map((t) => <span key={t}>{t}</span>)}{(leads.length > 0 || sku.assignedPmName) && <span>Led by {leads.join(" → ") || sku.assignedPmName}</span>}</div>
          </article>;
        })}</div>}
  </div>;
}

function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 12px" }}><div style={{ color: C.faint, fontSize: 11 }}>{label}</div><div style={{ color: accent ? C.amber : C.ink, fontWeight: 850, fontSize: 17, marginTop: 3 }}>{value}</div></div>;
}
function ReviewMetric({ label, value, tone = C.ink }: { label: string; value: string; tone?: string }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 11, padding: "11px 12px" }}><div style={{ color: C.faint, fontSize: 11 }}>{label}</div><div style={{ color: tone, fontWeight: 850, fontSize: 17, marginTop: 3 }}>{value}</div></div>;
}
function RecordCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="record-card"><small>{label}</small><b>{value}</b><span>{detail}</span></div>;
}

function HeroMetric({ label, value }: { label: string; value: string }) { return <div className="hist-metric"><small>{label}</small><b>{value}</b></div>; }
function ReviewCell({ label, value, tone = C.ink }: { label: string; value: string; tone?: string }) { return <div className="review-cell"><small>{label}</small><b style={{ color: tone }}>{value}</b></div>; }
function Podium({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) { return <article><span className="record-icon">{icon}</span><small>{label}</small><b>{value}</b><em>{detail}</em></article>; }
