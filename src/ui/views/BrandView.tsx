import React, { useMemo, useState } from "react";
import { C, fmtMoney, bigBtn, ctrlBtn } from "../theme";
import { Panel, FieldLabel, TextInput, ChoiceCard, SelectInput } from "../components";
import { brandAverageEquity, earnedSignals, getEquity, type Equity } from "../../engine/brandEquity";
import type { BrandLogoLayout, BrandLogoMotif, BrandLogoShape, BrandVisualRecipe, World, VisionGoal } from "../../engine/types";
import { VISION_GOALS } from "../../engine/types";
import { BRAND_COLORS, INDUSTRIES, POSITIONINGS } from "../../engine/industries";
import { brandById, defaultBrandVisual } from "../../engine/brands";
import { BrandLogoMark } from "../visualIdentity";
import { canCreateBrand, canStartCategoryExpansion, categoryGrowthDef, companyScale } from "../../engine/growth";
import { marketWorldView } from "../../engine/markets";
import "./BrandIP.css";

const METRICS: { key: keyof Equity; label: string; color: string }[] = [
  { key: "trust", label: "Trust", color: "#34d399" },
  { key: "prestige", label: "Prestige", color: "#c084fc" },
  { key: "value", label: "Value", color: "#38bdf8" },
  { key: "innovation", label: "Innovation", color: "#fbbf24" },
];

export function BrandView({ world, setVision, createBrand, startCategoryExpansion }: {
  world: World;
  setVision: (goal: VisionGoal, scope: string, audience: string, audienceLabel: string) => void;
  createBrand: (name: string, color: string, positioning: string, industryId?: string, visual?: BrandVisualRecipe) => boolean;
  startCategoryExpansion: (productKey: string) => boolean;
}) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "equity" | "vision">("portfolio");
  const [selectedBrandId, setSelectedBrandId] = useState(world.primaryBrandId);
  const selectedBrand = brandById(world, selectedBrandId);
  const selectedMarketWorld = selectedBrand.industryId === world.industryId ? world : marketWorldView(world, selectedBrand.industryId);
  const selectedCfg = INDUSTRIES[selectedBrand.industryId] ?? world.cfg;
  const avg = brandAverageEquity(selectedMarketWorld, undefined, selectedBrand.id);
  const earned = earnedSignals(selectedMarketWorld, selectedBrand.id);
  const selectedSkus = world.player.skus.filter((s) => s.brandId === selectedBrand.id);
  const hasProducts = selectedSkus.length > 0;
  const lifetimeRevenue = world.chronicle?.lifetimeRevenue ?? 0;
  const brandContribution = selectedSkus.reduce((sum, sku) => sum + (sku.contributionTotal ?? 0), 0);

  if (world.brands.length === 0) {
    return <div style={{ display: "grid", gap: 14 }}>
      <Panel title="Create your founding brand">
        <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.65 }}>Your company exists, but customers still have nothing to recognize. Create the first brand now — name, positioning, colors and logo. This founding brand has no launch fee.</div>
      </Panel>
      <BrandPortfolio world={world} selectedBrandId="" onSelect={() => {}} createBrand={createBrand} />
    </div>;
  }

  const segRows = world.savedSegments.map((seg) => {
    const idxs: number[] = [];
    selectedMarketWorld.cube.forEach((c, i) => {
      const ok = Object.entries(seg.filter).every(([ax, vals]) => !vals || vals.length === 0 || vals.includes((c.coord as any)[ax]));
      if (ok) idxs.push(i);
    });
    let tw = 0; const acc: Equity = { trust: 0, prestige: 0, value: 0, innovation: 0 };
    for (const i of idxs) {
      const h = selectedMarketWorld.cube[i].head; tw += h;
      const e = getEquity(selectedMarketWorld, i, undefined, selectedBrand.id);
      acc.trust += e.trust * h; acc.prestige += e.prestige * h; acc.value += e.value * h; acc.innovation += e.innovation * h;
    }
    const eq: Equity = tw > 0 ? { trust: acc.trust / tw, prestige: acc.prestige / tw, value: acc.value / tw, innovation: acc.innovation / tw } : { trust: 0, prestige: 0, value: 0, innovation: 0 };
    return { name: seg.name, eq };
  });

  return (
    <div className="brand-studio">
      <section className="brand-hero" style={{ "--brand-accent": selectedBrand.color } as React.CSSProperties}>
        <div className="brand-hero-copy">
          <div className="studio-kicker">BRAND STUDIO · {selectedCfg.label.toUpperCase()}</div>
          <div className="brand-hero-title"><BrandLogoMark brand={selectedBrand} size={72} /><div><h1>{selectedBrand.name}</h1><p>Shape what customers remember, trust and pay more for.</p></div></div>
          <div className="brand-hero-pills"><span>{selectedBrand.positioning} positioning</span><span>{selectedSkus.length} products</span><span>{Math.round(avg.trust * 100)} trust</span></div>
        </div>
        <div className="brand-hero-score">
          <span>Brand contribution</span><strong className={brandContribution >= 0 ? "positive" : "negative"}>{fmtMoney(brandContribution)}</strong>
          <small>{fmtMoney(lifetimeRevenue)} company lifetime revenue</small>
        </div>
        <div className="brand-orbit" aria-hidden="true"><i>★</i><i>♥</i><i>◆</i></div>
      </section>

      <div className="brand-switcher" aria-label="Select brand">
        {world.brands.map((brand) => <button type="button" key={brand.id} aria-pressed={brand.id === selectedBrand.id} onClick={() => setSelectedBrandId(brand.id)} style={{ "--brand-accent": brand.color } as React.CSSProperties}><BrandLogoMark brand={brand} size={34} /><span>{brand.name}</span></button>)}
      </div>

      <nav className="studio-tabs" aria-label="Brand workspace" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")}><span>▦</span> Portfolio</button>
        <button type="button" role="tab" aria-selected={activeTab === "equity"} onClick={() => setActiveTab("equity")}><span>◈</span> Customer equity</button>
        <button type="button" role="tab" aria-selected={activeTab === "vision"} onClick={() => setActiveTab("vision")}><span>◎</span> Company vision</button>
      </nav>

      {activeTab === "portfolio" && <>
        <CompanyGrowthPanel world={world} />
        <BrandPortfolio world={world} selectedBrandId={selectedBrand.id} onSelect={setSelectedBrandId} createBrand={createBrand} />
        <Panel title={`${selectedCfg.label} Category Access`}><div className="studio-help">Category development is managed centrally from <b>Company → Research</b>. This brand can currently design: <b>{(world.player.businesses?.[selectedBrand.industryId]?.unlockedCategories ?? []).map((k) => selectedCfg.products.find((p) => p.key === k)?.label ?? k).join(", ") || "none"}</b>.</div></Panel>
      </>}

      {activeTab === "equity" && <><div className="equity-explainer"><span>LIVE CUSTOMER SIGNAL</span><strong>Reputation is earned by product experience, price and channel choices.</strong><p>The filled bar is what customers think today. The marker shows where your current decisions are taking the brand.</p></div><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Panel title={`${selectedBrand.name} — Brand Equity`} style={{ flex: "1 1 320px" }}>
          {!hasProducts ? <div style={{ color: C.faint, fontSize: 13 }}>This brand has no products yet. Assign your next design to {selectedBrand.name} to start building its reputation.</div> : (
            <>
              {METRICS.map((m) => (
                <div key={m.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span style={{ color: C.ink }}>{m.label}</span>
                      <span style={{ color: C.dim, fontFamily: "ui-monospace", fontSize: 13 }}>
                      {(avg[m.key] * 100).toFixed(0)} <span style={{ color: C.faint }}>→ {(earned[m.key] * 100).toFixed(0)}</span>
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.grid, borderRadius: 4, position: "relative", overflow: "hidden" }}>
                    <div style={{ width: `${avg[m.key] * 100}%`, height: "100%", background: m.color, borderRadius: 4 }} />
                    <div style={{ position: "absolute", top: 0, left: `${earned[m.key] * 100}%`, width: 2, height: "100%", background: C.ink, opacity: .5 }} />
                  </div>
                </div>
              ))}
              <div style={{ color: C.faint, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
                Solid bar = current reputation. Tick = the identity this brand's own products, pricing and channels are earning. Sister brands no longer share the same equity.
              </div>
            </>
          )}
        </Panel>

        <Panel title={`${selectedBrand.name} — Perception by Segment`} style={{ flex: "1 1 360px" }}>
          {!hasProducts ? <div style={{ color: C.faint, fontSize: 13 }}>No consumer perception yet.</div> : (
            <table className="studio-data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ color: C.faint, textAlign: "right" }}><th style={{ textAlign: "left" }}>Segment</th>{METRICS.map((m) => <th key={m.key} style={{ color: m.color }}>{m.label.slice(0, 4)}</th>)}</tr></thead>
              <tbody style={{ fontFamily: "ui-monospace" }}>
                {segRows.map((r, i) => <tr key={i} style={{ borderTop: `1px solid ${C.grid}`, textAlign: "right" }}>
                  <td style={{ textAlign: "left", color: C.ink, padding: "5px 0" }}>{r.name}</td>
                  {METRICS.map((m) => <td key={m.key} style={{ color: C.dim }}>{(r.eq[m.key] * 100).toFixed(0)}</td>)}
                </tr>)}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      {hasProducts && (
        <Panel title={`${selectedBrand.name} — Equity by Category`}>
          <div className="studio-help">A brand can be trusted in one category and unknown in another. Category reputation remains separate inside each brand.</div>
          <table className="studio-data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ color: C.faint, textAlign: "right" }}><th style={{ textAlign: "left" }}>Category</th>{METRICS.map((m) => <th key={m.key} style={{ color: m.color }}>{m.label.slice(0, 4)}</th>)}</tr></thead>
            <tbody style={{ fontFamily: "ui-monospace" }}>
              {Array.from(new Set(selectedSkus.map((s) => s.productKey))).map((pk) => {
                const catEq = brandAverageEquity(selectedMarketWorld, pk, selectedBrand.id);
                const ptLabel = selectedCfg.products.find((p) => p.key === pk)?.label ?? pk;
                return <tr key={pk} style={{ borderTop: `1px solid ${C.grid}`, textAlign: "right" }}>
                  <td style={{ textAlign: "left", color: C.ink, padding: "5px 0" }}>{ptLabel}</td>
                  {METRICS.map((m) => <td key={m.key} style={{ color: C.dim }}>{(catEq[m.key] * 100).toFixed(0)}</td>)}
                </tr>;
              })}
            </tbody>
          </table>
        </Panel>
      )}</>}

      {activeTab === "vision" && <VisionPanel world={world} setVision={setVision} />}
    </div>
  );
}

function CompanyGrowthPanel({ world }: { world: World }) {
  const scale = companyScale(world);
  const revenue = world.chronicle?.lifetimeRevenue ?? 0;
  const next = scale.nextRevenue;
  const progress = next ? Math.min(1, revenue / next) : 1;
  const launched = world.player.skus.filter((s) => s.launchTick > 0).length;
  return <Panel title="Company Growth"><div className="growth-card">
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
      <div>
        <div style={{ color: C.violet, fontWeight: 800, fontSize: 20 }}>{scale.label}</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 3 }}>{scale.description}</div>
      </div>
      <div className="growth-stats">
        <div><div style={{ color: C.faint }}>Lifetime revenue</div><b>{fmtMoney(revenue)}</b></div>
        <div><div style={{ color: C.faint }}>Launched products</div><b>{launched}</b></div>
        <div><div style={{ color: C.faint }}>Brand capacity</div><b>{world.brands.length} / {scale.maxBrands}</b></div>
      </div>
    </div>
    {next && <><div className="studio-progress"><div style={{ width: `${progress * 100}%` }} /></div><div className="studio-caption">Revenue path to next scale: {fmtMoney(revenue)} / {fmtMoney(next)}. Product-count milestones can accelerate scale as well.</div></>}
  </div></Panel>;
}

function BrandPortfolio({ world, selectedBrandId, onSelect, createBrand }: { world: World; selectedBrandId: string; onSelect: (id: string) => void; createBrand: (name: string, color: string, positioning: string, industryId?: string, visual?: BrandVisualRecipe) => boolean }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(BRAND_COLORS[world.brands.length % BRAND_COLORS.length]);
  const [positioning, setPositioning] = useState("premium");
  const activeIndustries = Object.values(world.player.businesses ?? {}).filter((b) => b?.status === "active").map((b) => b!.industryId);
  const [industryId, setIndustryId] = useState(activeIndustries[0] ?? world.industryId);
  const [shape, setShape] = useState<BrandLogoShape>("circle");
  const [motif, setMotif] = useState<BrandLogoMotif>("orbit");
  const [textLayout, setTextLayout] = useState<BrandLogoLayout>("monogram");
  const [accentColor, setAccentColor] = useState("#dbeafe");
  const check = canCreateBrand(world);

  const visual: BrandVisualRecipe = { shape, motif, textLayout, accentColor };
  const shapeOptions: BrandLogoShape[] = ["square", "circle", "diamond", "triangle", "shield", "capsule", "hex"];
  const motifOptions: BrandLogoMotif[] = ["stripe", "star", "bolt", "orbit", "crown", "leaf", "spark"];
  const layoutOptions: BrandLogoLayout[] = ["monogram", "stacked", "wide"];

  const founding = world.brands.length === 0;
  return <Panel title={founding ? "Founding Brand" : "Brand Portfolio"}>
    <div className="studio-help">{founding ? "This is the first consumer identity of the company. Build it after the Founder Office so the run begins with a real empty-lot → company → brand progression." : "Brands share cash, people and infrastructure, but earn separate reputations. Use distinct brands to cover new audiences or price tiers without muddying the original."}</div>
    <div className="brand-card-grid">
      {world.brands.map((b) => {
        const skus = world.player.skus.filter((s) => s.brandId === b.id);
        const active = skus.filter((s) => s.status === "active").length;
        const units = skus.reduce((a, s) => a + s.unitsSoldTotal, 0);
        const contribution = skus.reduce((a, s) => a + (s.contributionTotal ?? 0), 0);
        const eq = brandAverageEquity(world, undefined, b.id);
        const on = selectedBrandId === b.id;
        return <button className="brand-portfolio-card" aria-pressed={on} key={b.id} onClick={() => onSelect(b.id)} style={{ "--brand-accent": b.color } as React.CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <BrandLogoMark brand={b} size={44} withName />
            <span className="brand-category-chip">{INDUSTRIES[b.industryId]?.label ?? b.industryId} · {b.positioning}</span>
          </div>
          <div className="brand-card-metrics"><span><b>{skus.length}</b> products</span><span><b>{active}</b> active</span><span><b>{Math.round(units).toLocaleString()}</b> units</span></div>
          <div className={contribution >= 0 ? "brand-contribution positive" : "brand-contribution negative"}>Lifetime contribution {fmtMoney(contribution)}</div>
          <div className="brand-equity-snapshot"><span>Trust <b>{Math.round(eq.trust * 100)}</b></span><span>Prestige <b>{Math.round(eq.prestige * 100)}</b></span><span>Value <b>{Math.round(eq.value * 100)}</b></span></div>
        </button>;
      })}
    </div>

    {!showCreate ? <button style={{ ...ctrlBtn, width: "100%", marginTop: 12, opacity: check.ok ? 1 : .55 }} disabled={!check.ok} onClick={() => {
      const seeded = defaultBrandVisual(name.trim() || `Brand ${world.brands.length + 1}`, color);
      setShape(seeded.shape); setMotif(seeded.motif); setTextLayout(seeded.textLayout); setAccentColor(seeded.accentColor);
      setShowCreate(true);
    }}>{founding ? "+ Create founding brand" : `+ Launch a new brand · ${fmtMoney(check.cost)}`}</button> : (
      <div style={{ marginTop: 14, padding: 14, border: `1px solid ${C.line}`, borderRadius: 10, background: C.panel2 }}>
        {activeIndustries.length > 1 && <><FieldLabel>Business</FieldLabel><SelectInput label="Industry" value={industryId} onChange={setIndustryId}>{activeIndustries.map((id) => <option key={id} value={id}>{INDUSTRIES[id]?.label ?? id}</option>)}</SelectInput></>}
        <FieldLabel>New brand name</FieldLabel>
        <TextInput placeholder="e.g. PureForm" value={name} onChange={(e) => { const next = e.target.value; setName(next); if (next.trim()) { const seeded = defaultBrandVisual(next, color); setShape(seeded.shape); setMotif(seeded.motif); setTextLayout(seeded.textLayout); if (!accentColor) setAccentColor(seeded.accentColor); } }} />
        <div style={{ height: 10 }} /><FieldLabel>Brand color</FieldLabel>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>{BRAND_COLORS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 7, background: c, border: color === c ? `3px solid ${C.ink}` : "2px solid transparent", cursor: "pointer" }} />)}</div>
        <FieldLabel>Positioning</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 12 }}>{POSITIONINGS.map((p) => <ChoiceCard key={p.key} active={positioning === p.key} onClick={() => setPositioning(p.key)} accent={color}><div style={{ fontWeight: 700, fontSize: 12 }}>{p.label}</div><div style={{ color: C.faint, fontSize: 10, marginTop: 2 }}>{p.blurb}</div></ChoiceCard>)}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, alignItems: "start" }}>
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: C.bg }}>
            <div style={{ color: C.faint, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Logo preview</div>
            <BrandLogoMark brand={{ id: "preview", name: name.trim() || "New Brand", color, positioning, createdTick: 0, industryId, visual }} size={64} withName emphasize />
            <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.5, marginTop: 10 }}>This recipe will be reused in the company header, brand cards, product packaging overlays and later competitor/company marks.</div>
          </div>
          <div>
            <FieldLabel>Logo shape</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{shapeOptions.map((opt) => <button key={opt} onClick={() => setShape(opt)} style={{ ...ctrlBtn, borderColor: shape === opt ? color : C.line, color: shape === opt ? color : C.dim }}>{opt}</button>)}</div>
            <FieldLabel>Logo motif</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{motifOptions.map((opt) => <button key={opt} onClick={() => setMotif(opt)} style={{ ...ctrlBtn, borderColor: motif === opt ? color : C.line, color: motif === opt ? color : C.dim }}>{opt}</button>)}</div>
            <FieldLabel>Text mode</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{layoutOptions.map((opt) => <button key={opt} onClick={() => setTextLayout(opt)} style={{ ...ctrlBtn, borderColor: textLayout === opt ? color : C.line, color: textLayout === opt ? color : C.dim }}>{opt}</button>)}</div>
            <FieldLabel>Accent color</FieldLabel>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>{["#ffffff", "#dbeafe", "#fde68a", "#fbcfe8", "#bbf7d0", "#ddd6fe", "#fdba74", "#a7f3d0"].map((c) => <button key={c} onClick={() => setAccentColor(c)} style={{ width: 26, height: 26, borderRadius: 999, background: c, border: accentColor === c ? `3px solid ${C.ink}` : "2px solid #d8e0eb", cursor: "pointer" }} />)}</div>
          </div>
        </div>

        <div style={{ color: C.faint, fontSize: 10.5, marginTop: 10 }}>{founding ? "Founding brand · no launch fee. Its reputation starts at zero and must be earned through products and execution." : `Launch investment: ${fmtMoney(check.cost)}. The new brand starts with no equity; it receives only a small corporate halo from sister brands.`}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, alignItems: "end" }}><button style={ctrlBtn} onClick={() => setShowCreate(false)}>Cancel</button><div style={{ display: "grid", justifyItems: "end" }}><button title={!name.trim() ? "Give the brand a name first." : !check.ok ? check.reason : undefined} style={{ ...bigBtn, background: color, opacity: name.trim() && check.ok ? 1 : .5 }} disabled={!name.trim() || !check.ok} onClick={() => { if (createBrand(name, color, positioning, industryId, visual)) { setName(""); setShowCreate(false); } }}>Launch {name.trim() || "brand"}</button>{(!name.trim() || !check.ok) && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {!name.trim() ? "Give the brand a name first." : check.reason}</div>}</div></div>
      </div>
    )}
    {!check.ok && !showCreate && <div style={{ color: C.amber, fontSize: 11, marginTop: 7 }}>{check.reason}</div>}
  </Panel>;
}

function CategoryGrowth({ world, industryId, startCategoryExpansion }: { world: World; industryId: string; startCategoryExpansion: (productKey: string) => boolean }) {
  const cfg = INDUSTRIES[industryId] ?? world.cfg;
  const business = world.player.businesses?.[industryId];
  const unlocked = new Set(business?.unlockedCategories ?? []);
  return <Panel title={`${cfg.label} Category Expansion`}>
    <div style={{ color: C.dim, fontSize: 12, marginBottom: 12 }}>New categories require capability-building before your teams can develop them credibly. Entering a category costs time and cash, and expertise grows through experience.</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
      {cfg.products.map((pt) => {
        const isUnlocked = unlocked.has(pt.key);
        const project = business?.categoryExpansionProjects.find((p) => p.productKey === pt.key);
        const def = categoryGrowthDef(world, pt.key);
        const check = !isUnlocked && !project ? canStartCategoryExpansion(world, pt.key) : null;
        const expertise = world.player.expertise.category[pt.key] ?? 0;
        return <div key={pt.key} style={{ background: C.bg, border: `1px solid ${isUnlocked ? C.green : project ? C.cyan : C.line}`, borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b style={{ color: C.ink, fontSize: 13 }}>{pt.label}</b><span style={{ color: isUnlocked ? C.green : project ? C.cyan : C.faint, fontSize: 10.5, fontWeight: 700 }}>{isUnlocked ? "UNLOCKED" : project ? "EXPANDING" : "LOCKED"}</span></div>
          <div style={{ color: C.faint, fontSize: 10.5, marginTop: 5 }}>Expertise {"★".repeat(Math.max(0, Math.min(5, Math.round(expertise))))}{"☆".repeat(5 - Math.max(0, Math.min(5, Math.round(expertise))))}</div>
          {isUnlocked ? <div style={{ color: C.dim, fontSize: 10.5, marginTop: 7 }}>Available for product development in {cfg.label} brands.</div> : project ? <><div style={{ height: 6, background: C.grid, borderRadius: 4, marginTop: 9 }}><div style={{ width: `${Math.max(0, Math.min(1, 1 - project.daysLeft / project.totalDays)) * 100}%`, height: "100%", background: C.cyan, borderRadius: 4 }} /></div><div style={{ color: C.dim, fontSize: 10.5, marginTop: 5 }}>{Math.ceil(project.daysLeft)} days remaining · {fmtMoney(project.investment)} committed</div></> : def ? <><div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.4, marginTop: 7 }}>{def.blurb}</div><button style={{ ...ctrlBtn, width: "100%", marginTop: 9, opacity: check?.ok ? 1 : .5 }} disabled={!check?.ok} onClick={() => startCategoryExpansion(pt.key)}>Enter category · {fmtMoney(def.investment)} · {def.days}d</button>{check && !check.ok && <div style={{ color: C.amber, fontSize: 9.5, marginTop: 4 }}>{check.reason}</div>}</> : <div style={{ color: C.faint, fontSize: 10.5, marginTop: 7 }}>Core category.</div>}
        </div>;
      })}
    </div>
  </Panel>;
}

function VisionPanel({ world, setVision }: { world: World; setVision: (goal: VisionGoal, scope: string, audience: string, audienceLabel: string) => void }) {
  const v = world.player.vision;
  const [goal, setGoal] = useState<VisionGoal>(v?.goal ?? "quality");
  const [scope, setScope] = useState(v?.scope ?? world.cfg.id);
  const [audience, setAudience] = useState(v?.audience ?? "anyone");

  const goalDef = VISION_GOALS[goal];
  const isIndustryScope = scope === world.cfg.id;
  const scopeLabel = scope === world.cfg.id ? world.cfg.label : world.cfg.products.find((p) => p.key === scope)?.label ?? scope;
  const audienceLabel = audience === "anyone" ? "everyone" : world.savedSegments.find((s) => s.id === audience)?.name ?? audience;
  const statement = `"We want to be the ${goalDef.adjective} ${scopeLabel} company for ${audienceLabel}."`;
  const ramp = v ? (1 + v.quartersPassed) / 5 : 0;
  const vIsIndustry = v ? v.scope === world.cfg.id : false;
  const currentBonusMax = v ? (vIsIndustry ? VISION_GOALS[v.goal].bonusMaxIndustry : VISION_GOALS[v.goal].bonusMaxProduct) : 0;
  const currentBonus = currentBonusMax * ramp;

  return <Panel title="Company Vision">
    {v && <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontStyle: "italic", marginBottom: 8 }}>{`"We want to be the ${VISION_GOALS[v.goal].adjective} ${v.scope === world.cfg.id ? world.cfg.label : world.cfg.products.find((p) => p.key === v.scope)?.label ?? v.scope} company for ${v.audienceLabel}."`}</div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}><div><span style={{ color: C.dim }}>Bonus: </span><span style={{ color: C.green, fontWeight: 600 }}>+{(currentBonusMax * 100).toFixed(0)}% {VISION_GOALS[v.goal].desc}</span></div><div><span style={{ color: C.dim }}>Ramp: </span><span style={{ color: C.amber, fontWeight: 600 }}>{(ramp * 100).toFixed(0)}%</span><span style={{ color: C.faint }}> ({v.quartersPassed}/4 quarters)</span></div><div><span style={{ color: C.dim }}>Current effect: </span><span style={{ color: C.cyan, fontWeight: 600 }}>+{(currentBonus * 100).toFixed(1)}%</span></div></div>
      <div style={{ height: 6, background: C.grid, borderRadius: 3, marginTop: 10 }}><div style={{ width: `${ramp * 100}%`, height: "100%", background: C.amber, borderRadius: 3 }} /></div>
    </div>}

    <div style={{ color: C.dim, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>Vision remains company-wide. It rewards strategic consistency over a year, while individual brands maintain their own positioning and reputation.</div>
    <div style={{ color: C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Target goal</div>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{(Object.keys(VISION_GOALS) as VisionGoal[]).map((g) => { const gd = VISION_GOALS[g]; return <button key={g} onClick={() => setGoal(g)} style={{ flex: 1, background: goal === g ? C.panel2 : C.bg, border: `1px solid ${goal === g ? C.cyan : C.line}`, borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "left" }}><div style={{ fontWeight: 600, fontSize: 13, color: goal === g ? C.ink : C.dim }}>{gd.adjective}</div><div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{gd.desc}</div></button>; })}</div>

    <div style={{ color: C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Scope — industry (+10%) or unlocked category (+20%)</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
      <button onClick={() => setScope(world.cfg.id)} style={{ background: scope === world.cfg.id ? C.cyan : C.panel2, color: scope === world.cfg.id ? "#fff" : C.dim, border: `1px solid ${scope === world.cfg.id ? C.cyan : C.line}`, borderRadius: 5, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{world.cfg.label} <span style={{ fontSize: 9, opacity: .7 }}>+10%</span></button>
      {world.cfg.products.filter((p) => world.player.unlockedCategories.includes(p.key)).map((pt) => <button key={pt.key} onClick={() => setScope(pt.key)} style={{ background: scope === pt.key ? C.cyan : C.bg, color: scope === pt.key ? "#fff" : C.faint, border: `1px solid ${scope === pt.key ? C.cyan : C.line}`, borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>{pt.label} <span style={{ fontSize: 9, opacity: .7 }}>+20%</span></button>)}
    </div>

    <div style={{ color: C.faint, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Target audience</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}><button onClick={() => setAudience("anyone")} style={{ background: audience === "anyone" ? C.cyan : C.panel2, color: audience === "anyone" ? "#fff" : C.dim, border: `1px solid ${audience === "anyone" ? C.cyan : C.line}`, borderRadius: 5, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Everyone</button>{world.savedSegments.map((seg) => <button key={seg.id} onClick={() => setAudience(seg.id)} style={{ background: audience === seg.id ? C.cyan : C.panel2, color: audience === seg.id ? "#fff" : C.dim, border: `1px solid ${audience === seg.id ? C.cyan : C.line}`, borderRadius: 5, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>{seg.name}</button>)}</div>

    <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 12, marginBottom: 12 }}><div style={{ fontSize: 15, fontStyle: "italic", color: C.ink, fontWeight: 600 }}>{statement}</div><div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>Bonus: {goalDef.desc} · {isIndustryScope ? "broad industry" : "category focus"} · full effect in 4 quarters</div></div>
    <button style={{ ...bigBtn, width: "100%", background: C.cyan, color: "#fff" }} onClick={() => setVision(goal, scope, audience, audienceLabel)}>{v ? "Change vision (resets ramp)" : "Set company vision"}</button>
  </Panel>;
}
