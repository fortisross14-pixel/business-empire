import type { World, IndustryBusiness } from "../../engine/types";
import { INDUSTRIES, INDUSTRY_ICONS } from "../../engine/industries";
import { canStartIndustryEntry, industryEntrySpeed, INDUSTRY_ENTRY_DEFS } from "../../engine/businesses";
import { companyScale } from "../../engine/growth";
import { Panel } from "../components";
import { CompetitorChip } from "../visualIdentity";
import { C, fmtMoney } from "../theme";

const stars = (n: number) => "★".repeat(Math.max(0, Math.min(5, Math.round(n)))) + "☆".repeat(Math.max(0, 5 - Math.round(n)));

export function BusinessesView({ world, startIndustryEntry }: { world: World; startIndustryEntry: (industryId: string) => boolean }) {
  const active = Object.values(world.player.businesses ?? {}).filter((b): b is IndustryBusiness => Boolean(b && b.status === "active"));
  const projectByIndustry = Object.fromEntries((world.player.industryEntryProjects ?? []).map(p => [p.industryId, p]));
  const caps = world.player.corporateCapabilities;
  const scale = companyScale(world);
  const entryRate = industryEntrySpeed(world);
  return <div style={{ display: "grid", gap: 16 }}>
    <Panel title="Business Portfolio">
      <div style={{ color: C.dim, fontSize: 12, marginBottom: 12 }}>Compare your businesses at a glance. Each industry has its own customers, competitors and product economics, while cash, people and corporate capabilities are shared across the company.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10 }}>
        {active.map(b => {
          const cfg = INDUSTRIES[b.industryId];
          const brands = world.brands.filter(x => x.industryId === b.industryId);
          const skus = world.player.skus.filter(x => x.industryId === b.industryId);
          const runtime = world.industryMarkets?.[b.industryId];
          const customers = runtime ? Object.values(runtime.customers).reduce((n, x) => n + x.count, 0) : (b.industryId === world.industryId ? Object.values(world.customers).reduce((n, x) => n + x.count, 0) : 0);
          const runRateRevenue = world.player.skus.reduce((sum, sku, i) => sum + (sku.industryId === b.industryId ? (world.live?.skuResults?.[i]?.revenue ?? 0) : 0), 0);
          const runRateMargin = world.player.skus.reduce((sum, sku, i) => sum + (sku.industryId === b.industryId ? (world.live?.skuResults?.[i]?.margin ?? 0) : 0), 0);
          return <div key={b.industryId} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ fontSize: 16 }}>{INDUSTRY_ICONS[b.industryId] ?? "🏭"} {cfg?.label ?? b.industryId}</b><span style={{ color: C.green, fontSize: 10, fontWeight: 800 }}>ACTIVE</span></div>
            <div style={{ color: C.faint, fontSize: 11, marginTop: 4 }}>{brands.length} brand{brands.length === 1 ? "" : "s"} · {skus.length} product{skus.length === 1 ? "" : "s"} · {customers.toLocaleString()} customers · {runtime?.comps.length ?? (b.industryId === world.industryId ? world.comps.length : 0)} competitors · entered Y{Math.floor(b.enteredTick / 360) + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
              <div style={{ background: C.panel, borderRadius: 7, padding: 7 }}><div style={{ color: C.faint, fontSize: 9 }}>REVENUE / Q</div><b style={{ fontSize: 12 }}>{fmtMoney(runRateRevenue)}</b></div>
              <div style={{ background: C.panel, borderRadius: 7, padding: 7 }}><div style={{ color: C.faint, fontSize: 9 }}>PRODUCT MARGIN / Q</div><b style={{ fontSize: 12, color: runRateMargin >= 0 ? C.green : C.red }}>{fmtMoney(runRateMargin)}</b></div>
            </div>
            <div style={{ color: C.faint, fontSize: 10.5, marginTop: 8 }}>Main rivals</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{(runtime?.comps ?? (b.industryId === world.industryId ? world.comps : [])).slice(0,3).map((c) => <CompetitorChip key={c.id} comp={c} />)}{(runtime?.comps ?? (b.industryId === world.industryId ? world.comps : [])).length === 0 && <b style={{ color: C.ink }}>—</b>}</div>
            <div style={{ color: C.dim, fontSize: 11, marginTop: 10 }}>Categories ready: {b.unlockedCategories.map(k => cfg?.products.find(p => p.key === k)?.label ?? k).join(", ") || "No categories ready"}</div>
            {Object.keys(b.capabilities).length > 0 && <div style={{ marginTop: 10, display: "grid", gap: 4 }}>{Object.entries(b.capabilities).slice(0, 5).map(([k,v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}><span style={{ color: C.faint }}>{k.replaceAll("_", " ")}</span><span style={{ color: C.amber }}>{stars(v)}</span></div>)}</div>}
          </div>;
        })}
      </div>
    </Panel>

    <Panel title="Shared Corporate Capabilities">
      <div style={{ color: C.dim, fontSize: 12, marginBottom: 10 }}>These are the advantages your parent company carries into every business. A mature company can enter a new industry with stronger finance, marketing, operations and retail relationships — but still has to learn the category.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
        {Object.entries(caps).map(([k,v]) => <div key={k} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10 }}><div style={{ textTransform: "capitalize", fontWeight: 700, fontSize: 12 }}>{k}</div><div style={{ color: C.amber, marginTop: 4, letterSpacing: 1 }}>{stars(v)}</div></div>)}
      </div>
    </Panel>

    <Panel title="Enter a New Industry">
      <div style={{ color: C.dim, fontSize: 12, marginBottom: 12 }}>Organic entry builds a new business from scratch. It uses shared corporate capabilities, but new industry-specific expertise starts weak. Company stage: <b style={{ color: C.ink }}>{scale.label}</b>.</div>
      {Object.values(INDUSTRY_ENTRY_DEFS).map(def => {
        const business = world.player.businesses?.[def.industryId];
        const project = projectByIndustry[def.industryId];
        const check = canStartIndustryEntry(world, def.industryId);
        const done = business?.status === "active";
        const progress = project ? 1 - project.daysLeft / project.totalDays : 0;
        return <div key={def.industryId} style={{ borderTop: `1px solid ${C.line}`, padding: "13px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px" }}><div style={{ fontWeight: 800 }}>{INDUSTRY_ICONS[def.industryId] ?? "🏭"} {def.label}</div><div style={{ color: C.dim, fontSize: 11.5, marginTop: 4 }}>{def.blurb}</div><div style={{ color: C.faint, fontSize: 10.5, marginTop: 6 }}>{fmtMoney(def.investment)} · {def.days} days · Organic entry</div></div>
            {done ? <span style={{ color: C.green, fontWeight: 800, fontSize: 11 }}>BUSINESS ESTABLISHED</span> : project ? <span style={{ color: entryRate>0?C.cyan:C.amber, fontWeight: 800, fontSize: 11 }}>{entryRate>0?`${Math.ceil(project.daysLeft/entryRate)}d estimated`:`PAUSED · Product + Strategy required`}</span> : <button disabled={!check.ok} onClick={() => startIndustryEntry(def.industryId)} style={{ background: check.ok ? C.violet : C.panel2, color: check.ok ? "#fff" : C.faint, border: `1px solid ${check.ok ? C.violet : C.line}`, borderRadius: 7, padding: "7px 11px", cursor: check.ok ? "pointer" : "default", fontWeight: 700 }}>Enter {def.label}</button>}
          </div>
          {project && <div style={{ height: 7, background: C.grid, borderRadius: 5, marginTop: 9 }}><div style={{ width: `${Math.max(0,Math.min(1,progress))*100}%`, height: "100%", background: C.cyan, borderRadius: 5 }} /></div>}
          {!done && !project && !check.ok && <div style={{ color: C.amber, fontSize: 10.5, marginTop: 7 }}>{check.reason}</div>}
        </div>;
      })}
    </Panel>
  </div>;
}
