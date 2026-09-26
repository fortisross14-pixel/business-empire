import React, { useMemo, useState } from "react";
import type { IPAsset, World } from "../../engine/types";
import { C, bigBtn, ctrlBtn, fmtMoney, fmtNum } from "../theme";
import { DisabledReason, FieldLabel, Panel, SelectInput, TextInput } from "../components";
import { INDUSTRIES } from "../../engine/industries";
import {
  activeIPContract,
  annualizedRoyaltyExposure,
  availableIPProductFamilies,
  companyIPPortfolioValue,
  contractTerms,
  daysUntilIPExpiry,
  estimateIPValue,
  estimatedCompanyValue,
  IP_AUDIENCE_PRESETS,
  ipCommercialStrength,
  ORIGINAL_IP_CREATION_COST,
} from "../../engine/ip";
import { archetypeByKey } from "../../engine/productCatalog";
import { IPBadge } from "../visualIdentity";
import { teamEffectiveness } from "../../engine/people";
import "./BrandIP.css";

interface ActionResult { ok: boolean; reason?: string; }

export function IPView({ world, createIP, licenseIP }: {
  world: World;
  createIP: (name: string, audiencePresetId: string, productFamilies: string[]) => ActionResult;
  licenseIP: (ipId: string, years: number) => ActionResult;
}) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "create" | "market">("portfolio");
  const owned = world.ipAssets.filter((ip) => ip.ownerType === "player");
  const licensed = world.ipAssets.filter((ip) => ip.ownerType === "external" && Boolean(activeIPContract(world, ip.id)));
  const market = world.ipAssets.filter((ip) => ip.ownerType === "external");
  const portfolioValue = companyIPPortfolioValue(world);
  const companyValue = estimatedCompanyValue(world);

  return <div className="ip-studio">
    <section className="ip-hero">
      <div className="ip-hero-copy"><div className="studio-kicker">CREATIVE RIGHTS & LICENSING</div><h1>Build worlds customers want to join.</h1><p>Create original characters or borrow audience power from established properties. Great fit can turn an ordinary product into a franchise.</p><button type="button" onClick={() => setActiveTab("create")}>✦ Create original IP</button></div>
      <div className="ip-hero-art" aria-hidden="true"><span className="ip-star">★</span><span className="ip-bolt">ϟ</span><span className="ip-heart">♥</span><strong>IP</strong></div>
      <div className="ip-hero-value"><small>Portfolio value</small><b>{fmtMoney(portfolioValue)}</b><span>{owned.length} owned · {licensed.length} licensed</span></div>
    </section>

    <div className="ip-stat-ribbon">
      <MiniStat icon="✦" label="Owned IP" value={String(owned.length)} />
      <MiniStat icon="◉" label="Active licenses" value={String(licensed.length)} />
      <MiniStat icon="♛" label="Owned IP value" value={fmtMoney(portfolioValue)} accent />
      <MiniStat icon="↗" label="Royalty exposure / yr" value={fmtMoney(annualizedRoyaltyExposure(world))} />
      <MiniStat icon="◆" label="Est. company value" value={fmtMoney(companyValue)} accent />
    </div>

    <nav className="studio-tabs" aria-label="IP workspace" role="tablist">
      <button type="button" role="tab" aria-selected={activeTab === "portfolio"} onClick={() => setActiveTab("portfolio")}><span>▦</span> My portfolio</button>
      <button type="button" role="tab" aria-selected={activeTab === "create"} onClick={() => setActiveTab("create")}><span>✦</span> Create property</button>
      <button type="button" role="tab" aria-selected={activeTab === "market"} onClick={() => setActiveTab("market")}><span>◎</span> Licensing market</button>
    </nav>

    {activeTab === "create" && <OriginalIPCreator world={world} createIP={createIP} />}

    {activeTab === "portfolio" && <Panel title="Your IP Portfolio">
      {owned.length === 0 && licensed.length === 0 ? <Empty>No IP assets or licenses yet. Create an original property or license one from the market below.</Empty> : null}
      <div className="ip-card-grid">
        {owned.map((ip) => <IPCard key={ip.id} world={world} ip={ip} owned />)}
        {licensed.map((ip) => <IPCard key={ip.id} world={world} ip={ip} />)}
      </div>
      {owned.length === 0 && licensed.length === 0 && <div className="empty-actions"><button onClick={() => setActiveTab("create")}>Create original IP</button><button onClick={() => setActiveTab("market")}>Browse licenses</button></div>}
    </Panel>}

    {activeTab === "market" && <Panel title="Licensing Market">
      <div className="studio-help">
        Licenses use standardized 2-, 3- or 5-year deals with an upfront minimum guarantee and a royalty on net licensed-product revenue. Strong properties can accelerate demand, but only when the audience and product fit.
      </div>
      <div className="ip-card-grid">
        {market.map((ip) => <LicenseOffer key={ip.id} world={world} ip={ip} onLicense={licenseIP} />)}
      </div>
    </Panel>}
  </div>;
}

function OriginalIPCreator({ world, createIP }: { world: World; createIP: (name: string, audiencePresetId: string, productFamilies: string[]) => ActionResult }) {
  const families = useMemo(() => availableIPProductFamilies(), []);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState(IP_AUDIENCE_PRESETS[0].id);
  const [selected, setSelected] = useState<string[]>(() => families.filter((f) => f.industryId === "toys").slice(0, 3).map((f) => f.key));
  const [message, setMessage] = useState<string | null>(null);
  const marketingReady = teamEffectiveness(world, "marketing") > 0;
  const grouped = useMemo(() => {
    const map: Record<string, typeof families> = {};
    for (const family of families) (map[family.industryId] ??= []).push(family);
    return map;
  }, [families]);
  const toggle = (key: string) => setSelected((cur) => cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key]);
  const submit = () => {
    const result = createIP(name, audience, selected);
    if (!result.ok) { setMessage(result.reason ?? "Could not create IP."); return; }
    setName("");
    setMessage("Original IP created. Its value starts low; products, audience fit and commercial success must build it.");
  };

  return <Panel title="Create Original IP"><div className="creator-intro"><span>ORIGINAL PROPERTY</span><strong>Your ideas, your upside.</strong><p>Pick an audience first, then license the property to product families that naturally fit their interests.</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
      <div>
        <FieldLabel>Property name</FieldLabel>
        <TextInput value={name} placeholder="e.g. Galaxy Knights" onChange={(e) => setName(e.target.value)} />
        <div style={{ height: 10 }} />
        <FieldLabel>Core audience</FieldLabel>
        <SelectInput value={audience} onChange={setAudience}>
          {IP_AUDIENCE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </SelectInput>
        <div className="studio-caption">{IP_AUDIENCE_PRESETS.find((p) => p.id === audience)?.description}</div>
        <div className="investment-ticket">
          <div>Development investment</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: world.player.cash >= ORIGINAL_IP_CREATION_COST ? C.ink : C.red }}>{fmtMoney(ORIGINAL_IP_CREATION_COST)}</div>
          <small>Original IP starts unknown. Products and audience fit build its value.</small>
        </div>
      </div>
      <div>
        <FieldLabel>Compatible product families</FieldLabel>
        <div className="studio-help">Choose where this property may appear. A broad IP can travel across industries; a narrow one may be stronger in a few categories.</div>
        {Object.entries(grouped).map(([industryId, rows]) => <div key={industryId} style={{ marginBottom: 10 }}>
          <div className="family-heading">{INDUSTRIES[industryId]?.label ?? industryId}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rows.map((f) => {
              const on = selected.includes(f.key);
              return <button key={f.key} onClick={() => toggle(f.key)} style={{ ...ctrlBtn, borderColor: on ? C.violet : C.line, color: on ? C.violet : C.dim, background: on ? C.panel2 : C.panel }}>
                {on ? "✓ " : ""}{f.label} <span style={{ color: C.faint }}>IP {Math.round(f.ipPotential * 100)}</span>
              </button>;
            })}
          </div>
        </div>)}
      </div>
    </div>
    {message && <div style={{ color: message.startsWith("Original") ? C.green : C.amber, fontSize: 11.5, marginTop: 10 }}>{message}</div>}
    <button disabled={!marketingReady || !name.trim() || selected.length === 0 || world.player.cash < ORIGINAL_IP_CREATION_COST} title={!marketingReady ? "Seat a Marketing specialist before developing original consumer IP." : !name.trim() ? "Name the IP first." : selected.length === 0 ? "Choose at least one compatible product family." : world.player.cash < ORIGINAL_IP_CREATION_COST ? `Need ${fmtMoney(ORIGINAL_IP_CREATION_COST - world.player.cash)} more cash.` : undefined} onClick={submit} style={{ ...bigBtn, marginTop: 12, opacity: marketingReady && name.trim() && selected.length > 0 && world.player.cash >= ORIGINAL_IP_CREATION_COST ? 1 : .45 }}>Create IP</button>
    {(!marketingReady || !name.trim() || selected.length === 0 || world.player.cash < ORIGINAL_IP_CREATION_COST) && <DisabledReason>{!marketingReady ? "Seat a Marketing specialist before developing an original consumer IP." : !name.trim() ? "Name the IP before creating it." : selected.length === 0 ? "Select at least one compatible product family." : `You need ${fmtMoney(ORIGINAL_IP_CREATION_COST - world.player.cash)} more cash for development.`}</DisabledReason>}
  </Panel>;
}

function IPCard({ world, ip, owned = false }: { world: World; ip: IPAsset; owned?: boolean }) {
  const contract = activeIPContract(world, ip.id);
  const attached = world.player.skus.filter((sku) => sku.ipId === ip.id);
  const value = estimateIPValue(ip);
  return <article className="ip-property-card" data-owned={owned || undefined}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><IPBadge ip={ip} /><div style={{ color: C.faint, fontSize: 10.5, marginTop: 4 }}>{owned ? `Owned by ${world.company}` : `Licensed from ${ip.ownerName}`}</div></div>
      <span className="ip-status-chip">{owned ? "OWNED" : "LICENSED"}</span>
    </div>
    <IPMetrics ip={ip} />
    <div style={{ color: C.dim, fontSize: 10.5, marginTop: 8 }}>Audience: <b style={{ color: C.ink }}>{ip.audienceLabel}</b></div>
    <div style={{ color: C.dim, fontSize: 10.5, marginTop: 3 }}>Compatible: {familyLabels(ip.compatibleProductFamilies).slice(0, 7).join(" · ")}{ip.compatibleProductFamilies.length > 7 ? " · …" : ""}</div>
    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10.5 }}>
      <span>{attached.length} attached product{attached.length === 1 ? "" : "s"}</span>
      <span>{fmtNum(ip.lifetimeUnits)} units</span>
      <span>{fmtMoney(ip.lifetimeProductRevenue)} linked revenue</span>
    </div>
    {owned && <div style={{ marginTop: 8, color: C.amber, fontSize: 11, fontWeight: 700 }}>Estimated IP asset value: {fmtMoney(value)}</div>}
    {contract && <div style={{ marginTop: 8, color: C.cyan, fontSize: 10.5 }}>{(contract.royaltyRate * 100).toFixed(1)}% royalty · {daysUntilIPExpiry(world, contract)} days left · royalties paid {fmtMoney(contract.royaltiesPaid)}</div>}
  </article>;
}

function LicenseOffer({ world, ip, onLicense }: { world: World; ip: IPAsset; onLicense: (ipId: string, years: number) => ActionResult }) {
  const active = activeIPContract(world, ip.id);
  const [years, setYears] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const terms = contractTerms(ip, years);
  const strength = ipCommercialStrength(ip);
  const commercialOwner = teamEffectiveness(world, "strategy") > 0 || teamEffectiveness(world, "marketing") > 0;
  const sign = () => {
    const result = onLicense(ip.id, years);
    setMessage(result.ok ? `${ip.name} licensed.` : result.reason ?? "Could not sign license.");
  };
  return <article className="ip-property-card license-offer" data-active={Boolean(active) || undefined}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><IPBadge ip={ip} /><div style={{ color: C.faint, fontSize: 10.5, marginTop: 4 }}>{ip.ownerName} · {ip.audienceLabel}</div></div>
      <span className="heat-chip" data-heat={strength > 1.05 ? "hot" : strength > .72 ? "established" : "niche"}>{strength > 1.05 ? "HOT" : strength > .72 ? "ESTABLISHED" : "NICHE"}</span>
    </div>
    <IPMetrics ip={ip} />
    <div style={{ color: C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 8 }}>Best fits: {familyLabels(ip.compatibleProductFamilies).slice(0, 8).join(" · ")}{ip.compatibleProductFamilies.length > 8 ? " · …" : ""}</div>
    {active ? <div style={{ marginTop: 10, color: C.cyan, fontSize: 11.5, fontWeight: 700 }}>✓ Active license · {daysUntilIPExpiry(world, active)} days remaining</div> : terms ? <>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {(ip.marketTerms?.durationsYears ?? [3]).map((y) => <button key={y} onClick={() => setYears(y)} style={{ ...ctrlBtn, flex: 1, borderColor: years === y ? C.violet : C.line, color: years === y ? C.violet : C.dim }}>{y} yr</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 9 }}>
        <Term label="Minimum guarantee" value={fmtMoney(terms.minimumGuarantee)} />
        <Term label="Royalty" value={`${(terms.royaltyRate * 100).toFixed(1)}% net sales`} />
      </div>
      <button disabled={!commercialOwner || world.player.cash < terms.minimumGuarantee} title={!commercialOwner ? "Seat a Strategy or Marketing specialist before negotiating external IP licenses." : world.player.cash < terms.minimumGuarantee ? `Need ${fmtMoney(terms.minimumGuarantee - world.player.cash)} more cash for the minimum guarantee.` : undefined} onClick={sign} style={{ ...bigBtn, width: "100%", marginTop: 10, fontSize: 12, opacity: commercialOwner && world.player.cash >= terms.minimumGuarantee ? 1 : .45 }}>License {ip.name}</button>
      {!commercialOwner ? <DisabledReason>Seat a Strategy or Marketing specialist to own the licensing negotiation.</DisabledReason> : world.player.cash < terms.minimumGuarantee && <DisabledReason>Minimum guarantee shortfall: {fmtMoney(terms.minimumGuarantee - world.player.cash)}.</DisabledReason>}
    </> : null}
    {message && <div style={{ color: message.endsWith("licensed.") ? C.green : C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
  </article>;
}

function IPMetrics({ ip }: { ip: IPAsset }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 6, marginTop: 10 }}>
    <Meter label="Aware" value={ip.awareness} />
    <Meter label="Momentum" value={Math.min(1, ip.momentum / 1.8)} text={`${ip.momentum.toFixed(2)}×`} />
    <Meter label="Prestige" value={ip.prestige} />
    <Meter label="Fatigue" value={ip.fatigue} danger />
  </div>;
}

function Meter({ label, value, text, danger = false }: { label: string; value: number; text?: string; danger?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", color: C.faint, fontSize: 9.5 }}><span>{label}</span><span>{text ?? `${pct}%`}</span></div>
    <div style={{ height: 4, borderRadius: 2, background: C.grid, marginTop: 3 }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: danger && pct > 55 ? C.red : C.violet }} /></div>
  </div>;
}

function MiniStat({ icon, label, value, accent = false }: { icon: string; label: string; value: string; accent?: boolean }) {
  return <div className="ip-mini-stat"><span aria-hidden="true">{icon}</span><div><small>{label}</small><strong className={accent ? "accent" : undefined}>{value}</strong></div></div>;
}

function Term({ label, value }: { label: string; value: string }) {
  return <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 7, padding: 8 }}><div style={{ color: C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: C.ink, fontWeight: 700, fontSize: 11.5 }}>{value}</div></div>;
}

function Empty({ children }: { children: React.ReactNode }) { return <div style={{ color: C.faint, fontSize: 12.5, padding: "8px 0 12px" }}>{children}</div>; }

function familyLabels(keys: string[]): string[] {
  return keys.map((key) => {
    const a = archetypeByKey(key);
    return a ? `${a.label}${INDUSTRIES[a.industryId] ? ` (${INDUSTRIES[a.industryId].label})` : ""}` : key.replace(/_/g, " ");
  });
}
