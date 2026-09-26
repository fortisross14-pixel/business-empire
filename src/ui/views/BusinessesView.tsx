import type { World, IndustryBusiness } from "../../engine/types";
import { INDUSTRIES, INDUSTRY_ICONS } from "../../engine/industries";
import { canStartIndustryEntry, industryEntrySpeed, INDUSTRY_ENTRY_DEFS } from "../../engine/businesses";
import { companyScale } from "../../engine/growth";
import { Panel } from "../components";
import { CompetitorChip } from "../visualIdentity";
import { C, ctrlBtn, fmtMoney } from "../theme";

const stars = (n: number) => "★".repeat(Math.max(0, Math.min(5, Math.round(n)))) + "☆".repeat(Math.max(0, 5 - Math.round(n)));

export function BusinessesView({ world, startIndustryEntry }: { world: World; startIndustryEntry: (industryId: string) => boolean }) {
  const active = Object.values(world.player.businesses ?? {}).filter((b): b is IndustryBusiness => Boolean(b && b.status === "active"));
  const projectByIndustry = Object.fromEntries((world.player.industryEntryProjects ?? []).map(p => [p.industryId, p]));
  const caps = world.player.corporateCapabilities;
  const scale = companyScale(world);
  const entryRate = industryEntrySpeed(world);
  return <div style={{ display: "grid", gap: 16 }}>
    <section className="business-hero">
      <div className="business-hero-copy"><span>COMPANY PORTFOLIO</span><h2>Build one company. Compete in many worlds.</h2><p>Every business learns its own category while sharing the parent company’s cash, talent and operating strengths.</p></div>
      <div className="business-hero-kpis"><div><b>{active.length}</b><small>Active industries</small></div><div><b>{world.brands.length}</b><small>Brands</small></div><div><b>{world.player.skus.filter(s => !s.archived).length}</b><small>Live products</small></div><div><b>{scale.label}</b><small>Company stage</small></div></div>
    </section>
    <Panel title="Business Portfolio">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>Compare your businesses at a glance. Each industry has its own customers, competitors and product economics, while cash, people and corporate capabilities are shared across the company.</div>
      <div className="business-card-grid">
        {active.map(b => {
          const cfg = INDUSTRIES[b.industryId];
          const brands = world.brands.filter(x => x.industryId === b.industryId);
          const skus = world.player.skus.filter(x => x.industryId === b.industryId);
          const runtime = world.industryMarkets?.[b.industryId];
          const customers = runtime ? Object.values(runtime.customers).reduce((n, x) => n + x.count, 0) : (b.industryId === world.industryId ? Object.values(world.customers).reduce((n, x) => n + x.count, 0) : 0);
          const runRateRevenue = world.player.skus.reduce((sum, sku, i) => sum + (sku.industryId === b.industryId ? (world.live?.skuResults?.[i]?.revenue ?? 0) : 0), 0);
          const runRateMargin = world.player.skus.reduce((sum, sku, i) => sum + (sku.industryId === b.industryId ? (world.live?.skuResults?.[i]?.margin ?? 0) : 0), 0);
          return <div key={b.industryId} className="business-card">
            <div className="business-card-title"><span>{INDUSTRY_ICONS[b.industryId] ?? "🏭"}</span><div><b>{cfg?.label ?? b.industryId}</b><small>Entered Year {Math.floor(b.enteredTick / 360) + 1}</small></div><em>ACTIVE</em></div>
            <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.45, marginTop: 8 }}>{brands.length} brand{brands.length === 1 ? "" : "s"} · {skus.length} product{skus.length === 1 ? "" : "s"} · {customers.toLocaleString()} customers · {runtime?.comps.length ?? (b.industryId === world.industryId ? world.comps.length : 0)} competitors</div>
            <div className="business-card-money">
              <div><small>REVENUE / Q</small><b>{fmtMoney(runRateRevenue)}</b></div>
              <div><small>PRODUCT MARGIN / Q</small><b style={{ color: runRateMargin >= 0 ? C.green : C.red }}>{fmtMoney(runRateMargin)}</b></div>
            </div>
            <div style={{ color: C.dim, fontSize: 12, fontWeight: 800, marginTop: 11 }}>Main rivals</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{(runtime?.comps ?? (b.industryId === world.industryId ? world.comps : [])).slice(0,3).map((c) => <CompetitorChip key={c.id} comp={c} />)}{(runtime?.comps ?? (b.industryId === world.industryId ? world.comps : [])).length === 0 && <b style={{ color: C.ink }}>—</b>}</div>
            <div style={{ color: C.dim, fontSize: 12, marginTop: 11 }}><b>Categories ready:</b> {b.unlockedCategories.map(k => cfg?.products.find(p => p.key === k)?.label ?? k).join(", ") || "No categories ready"}</div>
            {Object.keys(b.capabilities).length > 0 && <div className="business-cap-list">{Object.entries(b.capabilities).slice(0, 5).map(([k,v]) => <div key={k}><span>{k.replaceAll("_", " ")}</span><strong>{stars(v)}</strong></div>)}</div>}
          </div>;
        })}
      </div>
    </Panel>

    <Panel title="Shared Corporate Capabilities">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>These are the advantages your parent company carries into every business. A mature company can enter a new industry with stronger finance, marketing, operations and retail relationships — but still has to learn the category.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
        {Object.entries(caps).map(([k,v]) => <div key={k} className="business-capability"><span>◆</span><div style={{ textTransform: "capitalize", fontWeight: 800, fontSize: 13 }}>{k}</div><div style={{ color: C.amber, marginTop: 4, letterSpacing: 1 }}>{stars(v)}</div></div>)}
      </div>
    </Panel>

    <Panel title="Enter a New Industry">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>Organic entry builds a new business from scratch. It uses shared corporate capabilities, but new industry-specific expertise starts weak. Company stage: <b style={{ color: C.ink }}>{scale.label}</b>.</div>
      {Object.values(INDUSTRY_ENTRY_DEFS).map(def => {
        const business = world.player.businesses?.[def.industryId];
        const project = projectByIndustry[def.industryId];
        const check = canStartIndustryEntry(world, def.industryId);
        const done = business?.status === "active";
        const progress = project ? 1 - project.daysLeft / project.totalDays : 0;
        return <div key={def.industryId} className="industry-entry-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px" }}><div className="industry-entry-title"><span>{INDUSTRY_ICONS[def.industryId] ?? "🏭"}</span><b>{def.label}</b></div><div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{def.blurb}</div><div style={{ color: C.dim, fontSize: 12, fontWeight: 750, marginTop: 7 }}>{fmtMoney(def.investment)} · {def.days} days · Organic entry</div></div>
            {done ? <span style={{ color: C.green, fontWeight: 900, fontSize: 12 }}>BUSINESS ESTABLISHED</span> : project ? <span style={{ color: entryRate>0?C.cyan:C.amber, fontWeight: 900, fontSize: 12 }}>{entryRate>0?`${Math.ceil(project.daysLeft/entryRate)}d estimated`:`PAUSED · Product + Strategy required`}</span> : <button disabled={!check.ok} onClick={() => startIndustryEntry(def.industryId)} style={{ ...ctrlBtn, background: check.ok ? C.violet : C.panel2, color: check.ok ? "#fff" : C.faint, borderColor: check.ok ? C.violet : C.line, opacity: check.ok ? 1 : .55 }}>Enter {def.label}</button>}
          </div>
          {project && <div style={{ height: 7, background: C.grid, borderRadius: 5, marginTop: 9 }}><div style={{ width: `${Math.max(0,Math.min(1,progress))*100}%`, height: "100%", background: C.cyan, borderRadius: 5 }} /></div>}
          {!done && !project && !check.ok && <div style={{ color: C.amber, fontSize: 12, marginTop: 7 }}>{check.reason}</div>}
        </div>;
      })}
    </Panel>
    <style>{`
      .business-hero{position:relative;overflow:hidden;min-height:190px;padding:24px;border-radius:19px;color:#fff;background:linear-gradient(90deg,rgba(7,34,63,.97),rgba(10,76,120,.86)),url('/assets/ui/backgrounds/campus-main-menu.png') center/cover;box-shadow:0 18px 40px rgba(7,34,63,.22)}.business-hero-copy{max-width:640px}.business-hero-copy>span{font-size:12px;letter-spacing:1.2px;font-weight:950;color:#85ddff}.business-hero h2{font-size:27px;line-height:1.12;margin:5px 0 7px}.business-hero p{font-size:13px;line-height:1.55;color:#d6ebf5;margin:0}.business-hero-kpis{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin-top:18px}.business-hero-kpis>div{padding:10px 12px;border-radius:11px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(4px)}.business-hero-kpis b{display:block;font-size:18px}.business-hero-kpis small{display:block;margin-top:2px;font-size:11px;color:#bddce9}.business-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:11px}.business-card{background:linear-gradient(180deg,#fff,#f3f8fc);border:1px solid ${C.line};border-radius:14px;padding:15px;box-shadow:0 7px 19px rgba(14,52,82,.07);transition:transform .16s,box-shadow .16s}.business-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(14,52,82,.12)}.business-card-title{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center}.business-card-title>span,.industry-entry-title>span{display:grid;place-items:center;width:48px;height:48px;border-radius:13px;background:linear-gradient(135deg,#dff4ff,#eeeaff);font-size:25px}.business-card-title b{display:block;font-size:17px}.business-card-title small{display:block;font-size:12px;color:${C.dim};margin-top:2px}.business-card-title em{font-style:normal;padding:5px 7px;border-radius:99px;background:#e7faf1;color:${C.green};font-size:11px;font-weight:900}.business-card-money{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.business-card-money>div{background:#fff;border:1px solid ${C.grid};border-radius:10px;padding:9px}.business-card-money small{display:block;color:${C.dim};font-size:11px;font-weight:800}.business-card-money b{display:block;font-size:15px;margin-top:3px}.business-cap-list{margin-top:11px;display:grid;gap:5px}.business-cap-list>div{display:flex;justify-content:space-between;gap:8px;padding-top:5px;border-top:1px solid ${C.grid};font-size:12px;text-transform:capitalize}.business-cap-list span{color:${C.dim}}.business-cap-list strong{color:${C.amber};letter-spacing:.6px}.business-capability{position:relative;overflow:hidden;background:linear-gradient(145deg,#fff,#f3f7fb);border:1px solid ${C.line};border-radius:12px;padding:13px;box-shadow:0 5px 14px rgba(17,52,80,.05)}.business-capability>span{position:absolute;right:10px;top:7px;color:#dbe9f4;font-size:24px}.industry-entry-card{margin-top:9px;padding:14px;border:1px solid ${C.line};border-radius:13px;background:linear-gradient(180deg,#fff,#f7faff)}.industry-entry-title{display:flex;gap:10px;align-items:center}.industry-entry-title>b{font-size:16px}.business-card-grid button,.industry-entry-card button{min-height:44px}.industry-entry-card button:focus-visible{outline:3px solid rgba(39,117,236,.3);outline-offset:2px}@media(max-width:640px){.business-hero{min-height:0;padding:18px 15px}.business-hero h2{font-size:22px}.business-hero-kpis{grid-template-columns:1fr 1fr}.business-card-grid{grid-template-columns:1fr}.business-card-title{grid-template-columns:44px 1fr}.business-card-title>span{width:44px;height:44px}.business-card-title em{grid-column:2;justify-self:start}.industry-entry-card>div{display:grid!important}.industry-entry-card button{width:100%;margin-top:5px}}
    `}</style>
  </div>;
}
