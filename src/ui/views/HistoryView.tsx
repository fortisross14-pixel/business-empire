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
  if (mode === "annual") return <AnnualReviews world={world} />;
  if (mode === "records") return <RecordsView world={world} />;
  return <ChronicleTimeline world={world} />;
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
    <Panel title="📚 Company Chronicle">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, alignItems: "stretch" }}>
        <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.65, gridColumn: "1 / -1" }}>
          This is the permanent memory of <b style={{ color: C.ink }}>{world.company}</b>. Routine alerts disappear; launches, people, milestones and turning points stay here for the life of the save.
        </div>
        <MiniStat label="Years played" value={`${Math.floor(world.tick / 360) + 1}`} />
        <MiniStat label="Product launches" value={`${launches}`} />
        <MiniStat label="Iconic moments" value={`${iconic}`} accent />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {(["major", "iconic", "all"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.violet : C.panel2, color: filter === f ? "#fff" : C.dim, border: `1px solid ${filter === f ? C.violet : C.line}`, borderRadius: 99, padding: "5px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{f === "major" ? "Major + iconic" : f}</button>)}
      </div>
    </Panel>

    {groups.length === 0 ? <Panel title="Timeline"><Empty>No permanent history at this filter level yet. The company is still writing its first chapter.</Empty></Panel> : groups.map((group) => <div key={group.year} style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 2px 9px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: "#ede9fe", border: "1px solid #ddd6fe", color: C.violet, fontWeight: 900, fontSize: 12 }}>Y{group.year}</div>
        <div style={{ height: 1, background: C.line, flex: 1 }} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {group.entries.map((e) => <ChronicleCard key={e.id} entry={e} />)}
      </div>
    </div>)}
  </div>;
}

function ChronicleCard({ entry: e }: { entry: ChronicleEntry }) {
  const color = importanceColor(e.importance);
  return <div style={{ background: C.panel, border: `1px solid ${e.importance === 3 ? "#fcd34d" : C.line}`, borderLeft: `4px solid ${color}`, borderRadius: 11, padding: "11px 13px", display: "grid", gridTemplateColumns: "42px minmax(0,1fr) auto", gap: 10, alignItems: "start", boxShadow: e.importance === 3 ? "0 2px 12px rgba(245,158,11,.10)" : "0 1px 3px rgba(30,27,46,.03)" }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.panel2, display: "grid", placeItems: "center", fontSize: 19 }}>{e.icon}</div>
    <div>
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}><b style={{ color: C.ink, fontSize: 13 }}>{e.title}</b><span style={{ color, border: `1px solid ${color}55`, background: `${color}12`, borderRadius: 99, padding: "2px 5px", fontSize: 8.5, fontWeight: 900 }}>{importanceLabel(e.importance)}</span></div>
      <div style={{ color: C.dim, fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{e.text}</div>
    </div>
    <div style={{ textAlign: "right", color: C.faint, fontSize: 9.5, whiteSpace: "nowrap" }}>Y{yearOfTick(e.tick)} · M{monthOfTick(e.tick)}<br />{kindLabel[e.kind] ?? e.kind}</div>
  </div>;
}

function AnnualReviews({ world }: { world: World }) {
  const reviews = [...(world.chronicle?.annualReviews ?? [])].sort((a, b) => b.year - a.year);
  const [selectedYear, setSelectedYear] = useState<number | null>(reviews[0]?.year ?? null);
  const selected = reviews.find((r) => r.year === selectedYear) ?? reviews[0];
  const acc = world.chronicle?.yearAccumulator;

  return <div>
    <Panel title="📘 Annual Reviews">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Every completed year becomes a permanent snapshot of the company: realized revenue and profit, launches, people changes, market position and the moments that defined the year.</div>
      {reviews.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{reviews.map((r) => <button key={r.year} onClick={() => setSelectedYear(r.year)} style={{ background: selected?.year === r.year ? C.violet : C.panel2, color: selected?.year === r.year ? "#fff" : C.dim, border: `1px solid ${selected?.year === r.year ? C.violet : C.line}`, borderRadius: 7, padding: "5px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Year {r.year}</button>)}</div>}
    </Panel>

    {selected ? <AnnualReviewCard world={world} review={selected} /> : <Panel title="First review pending"><Empty>Year 1 is still in progress. The first annual review closes after 360 simulated days.</Empty></Panel>}

    {acc && <Panel title={`Year ${acc.year} — Live Preview`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9 }}>
        <ReviewMetric label="Revenue so far" value={fmtMoney(acc.revenue)} />
        <ReviewMetric label="Profit so far" value={fmtMoney(acc.profit)} tone={acc.profit >= 0 ? C.green : C.red} />
        <ReviewMetric label="Units" value={fmtNum(acc.units)} />
        <ReviewMetric label="Peak share" value={fmtPct(acc.peakShare)} />
        <ReviewMetric label="Cash" value={fmtMoney(world.player.cash)} tone={world.player.cash >= 0 ? C.ink : C.red} />
      </div>
      <div style={{ color: C.faint, fontSize: 10.5, marginTop: 9 }}>Live figures accumulate realized daily results; they become immutable when the year closes.</div>
    </Panel>}
  </div>;
}

function AnnualReviewCard({ world, review: r }: { world: World; review: AnnualReview }) {
  const entries = (world.chronicle?.entries ?? []).filter((e) => r.highlightEntryIds.includes(e.id));
  return <div>
    <Panel title={`Year ${r.year} — ${world.company}`}>
      <div style={{ fontSize: 17, fontWeight: 850, color: C.ink, lineHeight: 1.35 }}>{r.headline}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9, marginTop: 14 }}>
        <ReviewMetric label="Revenue" value={fmtMoney(r.revenue)} />
        <ReviewMetric label="Profit" value={fmtMoney(r.profit)} tone={r.profit >= 0 ? C.green : C.red} />
        <ReviewMetric label="Units sold" value={fmtNum(r.units)} />
        <ReviewMetric label="Peak share" value={fmtPct(r.peakShare)} />
        <ReviewMetric label="Year-end cash" value={fmtMoney(r.endCash)} tone={r.endCash >= 0 ? C.ink : C.red} />
        <ReviewMetric label="Named staff" value={`${r.endingEmployees}`} />
      </div>
    </Panel>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
      <Panel title="Portfolio & People">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 12 }}><MiniStat label="Hires" value={`${r.hires}`} /><MiniStat label="Promotions" value={`${r.promotions}`} /><MiniStat label="Departures" value={`${r.departures}`} /></div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Products launched</div>
        {r.productsLaunched.length ? <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{r.productsLaunched.map((p) => <span key={p} style={{ padding: "4px 7px", borderRadius: 99, background: "#ede9fe", border: "1px solid #ddd6fe", color: C.violet, fontSize: 10, fontWeight: 700 }}>{p}</span>)}</div> : <Empty>No product launches this year.</Empty>}
      </Panel>
      <Panel title="Defining Moments">
        {entries.length ? entries.map((e) => <div key={e.id} style={{ padding: "7px 0", borderBottom: `1px solid ${C.grid}`, display: "flex", gap: 8 }}><span>{e.icon}</span><div><div style={{ fontSize: 11.5, fontWeight: 700 }}>{e.title}</div><div style={{ color: C.faint, fontSize: 10 }}>{e.text}</div></div></div>) : <Empty>A quieter year: no major or iconic moments were recorded.</Empty>}
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
    <Panel title="🏆 Company Records">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 9 }}>
        <RecordCard label="Best-selling product" value={records.topUnits?.name ?? "—"} detail={records.topUnits ? `${fmtNum(records.topUnits.unitsSoldTotal)} lifetime units` : "No launch yet"} />
        <RecordCard label="Highest product contribution" value={records.topContribution?.name ?? "—"} detail={records.topContribution ? fmtMoney(records.topContribution.contributionTotal ?? 0) : "No launch yet"} />
        <RecordCard label="Longest-running product" value={records.longestProduct?.name ?? "—"} detail={records.longestProduct ? `${Math.max(0, Math.floor((world.tick - records.longestProduct.launchTick) / 30))} months` : "No launch yet"} />
        <RecordCard label="Best revenue year" value={records.bestRevenueYear ? `Year ${records.bestRevenueYear.year}` : "—"} detail={records.bestRevenueYear ? fmtMoney(records.bestRevenueYear.revenue) : "First year still open"} />
        <RecordCard label="Best profit year" value={records.bestProfitYear ? `Year ${records.bestProfitYear.year}` : "—"} detail={records.bestProfitYear ? fmtMoney(records.bestProfitYear.profit) : "First year still open"} />
        <RecordCard label="Highest annual share" value={records.bestShareYear ? `Year ${records.bestShareYear.year}` : "—"} detail={records.bestShareYear ? fmtPct(records.bestShareYear.peakShare) : "First year still open"} />
        <RecordCard label="Toughest year" value={records.worstProfitYear ? `Year ${records.worstProfitYear.year}` : "—"} detail={records.worstProfitYear ? `${records.worstProfitYear.profit >= 0 ? "Lowest profit " : "Loss "}${fmtMoney(records.worstProfitYear.profit)}` : "First year still open"} />
        <RecordCard label="Longest-serving leader" value={records.longestPerson?.name ?? "—"} detail={records.longestPerson ? records.longestPerson.title : "No staff history yet"} />
        <RecordCard label="Most impactful PM" value={records.topPm?.p.name ?? "—"} detail={records.topPm ? `${fmtNum(records.topPm.units)} units across products led` : "No PM product history yet"} />
        <RecordCard label="Most valuable owned IP" value={topIP?.name ?? "—"} detail={topIP ? `${fmtMoney(estimateIPValue(topIP))} estimated asset value` : "No original IP yet"} />
      </div>
    </Panel>

    <Panel title="✨ Iconic Moments">
      {iconic.length === 0 ? <Empty>Iconic moments are deliberately rare. The Chronicle will surface true turning points rather than manufacture one every quarter.</Empty> : iconic.map((e) => <ChronicleCard key={e.id} entry={e} />)}
    </Panel>

    <Panel title="Product Legacy">
      {launched.length === 0 ? <Empty>No launched products yet.</Empty> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 11.5 }}>
        <thead><tr style={{ color: C.faint, textAlign: "left" }}><th style={{ padding: "7px 5px" }}>Product</th><th>Launched</th><th>Legacy</th><th>Lifetime units</th><th>Contribution</th><th>Lead lineage</th></tr></thead>
        <tbody>{launched.map((sku) => {
          const tags = productLegacyTags(world, sku);
          const leads = [...new Set((sku.leadHistory ?? []).map((h) => h.personName))];
          return <tr key={sku.id} style={{ borderTop: `1px solid ${C.grid}` }}>
            <td style={{ padding: "9px 5px" }}><b>{sku.name}</b><div style={{ color: C.faint, fontSize: 9.5 }}>{archetypeByKey(sku.productKey)?.label ?? sku.productKey}</div></td>
            <td>Y{yearOfTick(sku.launchTick)} · M{monthOfTick(sku.launchTick)}</td>
            <td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{tags.map((t) => <span key={t} style={{ padding: "2px 5px", borderRadius: 99, border: `1px solid ${t === "Breakthrough" || t === "Blockbuster" ? "#fcd34d" : C.line}`, background: t === "Breakthrough" || t === "Blockbuster" ? "#fffbeb" : C.panel2, color: t === "Breakthrough" || t === "Blockbuster" ? "#92400e" : C.dim, fontSize: 9 }}>{t}</span>)}</div></td>
            <td>{fmtNum(sku.unitsSoldTotal)}</td><td style={{ color: (sku.contributionTotal ?? 0) >= 0 ? C.green : C.red }}>{fmtMoney(sku.contributionTotal ?? 0)}</td><td style={{ color: C.dim }}>{leads.join(" → ") || sku.assignedPmName || "—"}</td>
          </tr>;
        })}</tbody>
      </table></div>}
    </Panel>
  </div>;
}

function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 10px" }}><div style={{ color: C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: accent ? C.amber : C.ink, fontWeight: 850, fontSize: 15, marginTop: 2 }}>{value}</div></div>;
}
function ReviewMetric({ label, value, tone = C.ink }: { label: string; value: string; tone?: string }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, padding: "10px 11px" }}><div style={{ color: C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: tone, fontWeight: 850, fontSize: 15, marginTop: 2 }}>{value}</div></div>;
}
function RecordCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 11 }}><div style={{ color: C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: C.ink, fontWeight: 800, fontSize: 13, marginTop: 3 }}>{value}</div><div style={{ color: C.violet, fontSize: 10, marginTop: 3 }}>{detail}</div></div>;
}
