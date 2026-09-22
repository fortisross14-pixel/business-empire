import React, { useMemo, useState } from "react";
import type { IPAsset, World } from "../../engine/types";
import { C, bigBtn, ctrlBtn, fmtMoney, fmtNum } from "../theme";
import { FieldLabel, Panel, SelectInput, TextInput } from "../components";
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

interface ActionResult { ok: boolean; reason?: string; }

export function IPView({ world, createIP, licenseIP }: {
  world: World;
  createIP: (name: string, audiencePresetId: string, productFamilies: string[]) => ActionResult;
  licenseIP: (ipId: string, years: number) => ActionResult;
}) {
  const owned = world.ipAssets.filter((ip) => ip.ownerType === "player");
  const licensed = world.ipAssets.filter((ip) => ip.ownerType === "external" && Boolean(activeIPContract(world, ip.id)));
  const market = world.ipAssets.filter((ip) => ip.ownerType === "external");
  const portfolioValue = companyIPPortfolioValue(world);
  const companyValue = estimatedCompanyValue(world);

  return <div>
    <Panel title="🎬 Universal IP & Licensing">
      <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.65, maxWidth: 960 }}>
        IP is separate from the brand on the box. The same property can travel across compatible products and industries, while brand reputation and IP popularity remain distinct.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
        <MiniStat label="Owned IP" value={String(owned.length)} />
        <MiniStat label="Active licenses" value={String(licensed.length)} />
        <MiniStat label="Owned IP value" value={fmtMoney(portfolioValue)} accent />
        <MiniStat label="Royalty exposure / yr" value={fmtMoney(annualizedRoyaltyExposure(world))} />
        <MiniStat label="Est. company value" value={fmtMoney(companyValue)} accent />
      </div>
    </Panel>

    <OriginalIPCreator world={world} createIP={createIP} />

    <Panel title="Your IP Portfolio">
      {owned.length === 0 && licensed.length === 0 ? <Empty>No IP assets or licenses yet. Create an original property or license one from the market below.</Empty> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {owned.map((ip) => <IPCard key={ip.id} world={world} ip={ip} owned />)}
        {licensed.map((ip) => <IPCard key={ip.id} world={world} ip={ip} />)}
      </div>
    </Panel>

    <Panel title="Licensing Market">
      <div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
        Licenses use standardized 2-, 3- or 5-year deals with an upfront minimum guarantee and a royalty on net licensed-product revenue. Strong properties can accelerate demand, but only when the audience and product fit.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 12 }}>
        {market.map((ip) => <LicenseOffer key={ip.id} world={world} ip={ip} onLicense={licenseIP} />)}
      </div>
    </Panel>
  </div>;
}

function OriginalIPCreator({ world, createIP }: { world: World; createIP: (name: string, audiencePresetId: string, productFamilies: string[]) => ActionResult }) {
  const families = useMemo(() => availableIPProductFamilies(), []);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState(IP_AUDIENCE_PRESETS[0].id);
  const [selected, setSelected] = useState<string[]>(() => families.filter((f) => f.industryId === "toys").slice(0, 3).map((f) => f.key));
  const [message, setMessage] = useState<string | null>(null);
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

  return <Panel title="✨ Create Original IP">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
      <div>
        <FieldLabel>Property name</FieldLabel>
        <TextInput value={name} placeholder="e.g. Galaxy Knights" onChange={(e) => setName(e.target.value)} />
        <div style={{ height: 10 }} />
        <FieldLabel>Core audience</FieldLabel>
        <SelectInput value={audience} onChange={setAudience}>
          {IP_AUDIENCE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </SelectInput>
        <div style={{ color: C.faint, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{IP_AUDIENCE_PRESETS.find((p) => p.id === audience)?.description}</div>
        <div style={{ marginTop: 12, padding: 10, border: `1px solid ${C.line}`, borderRadius: 8, background: C.panel2 }}>
          <div style={{ color: C.dim, fontSize: 10.5 }}>Development investment</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: world.player.cash >= ORIGINAL_IP_CREATION_COST ? C.ink : C.red }}>{fmtMoney(ORIGINAL_IP_CREATION_COST)}</div>
          <div style={{ color: C.faint, fontSize: 10.5 }}>Original IP starts with ~zero awareness and must earn its status.</div>
        </div>
      </div>
      <div>
        <FieldLabel>Compatible product families</FieldLabel>
        <div style={{ color: C.faint, fontSize: 10.5, marginBottom: 8 }}>Choose the product families where this property has permission to appear. A broad IP can travel across industries; a narrow one may be much stronger in only a few categories.</div>
        {Object.entries(grouped).map(([industryId, rows]) => <div key={industryId} style={{ marginBottom: 10 }}>
          <div style={{ color: C.dim, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .6, marginBottom: 5 }}>{INDUSTRIES[industryId]?.label ?? industryId}</div>
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
    <button disabled={!name.trim() || selected.length === 0 || world.player.cash < ORIGINAL_IP_CREATION_COST} onClick={submit} style={{ ...bigBtn, marginTop: 12, opacity: !name.trim() || selected.length === 0 || world.player.cash < ORIGINAL_IP_CREATION_COST ? .45 : 1 }}>Create IP</button>
  </Panel>;
}

function IPCard({ world, ip, owned = false }: { world: World; ip: IPAsset; owned?: boolean }) {
  const contract = activeIPContract(world, ip.id);
  const attached = world.player.skus.filter((sku) => sku.ipId === ip.id);
  const value = estimateIPValue(ip);
  return <div style={{ border: `1px solid ${owned ? C.violet : C.line}`, background: C.panel2, borderRadius: 10, padding: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><IPBadge ip={ip} /><div style={{ color: C.faint, fontSize: 10.5, marginTop: 4 }}>{owned ? `Owned by ${world.company}` : `Licensed from ${ip.ownerName}`}</div></div>
      <span style={{ fontSize: 10, border: `1px solid ${owned ? C.violet : C.cyan}`, color: owned ? C.violet : C.cyan, borderRadius: 99, padding: "3px 7px", height: "fit-content" }}>{owned ? "OWNED" : "LICENSED"}</span>
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
  </div>;
}

function LicenseOffer({ world, ip, onLicense }: { world: World; ip: IPAsset; onLicense: (ipId: string, years: number) => ActionResult }) {
  const active = activeIPContract(world, ip.id);
  const [years, setYears] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const terms = contractTerms(ip, years);
  const strength = ipCommercialStrength(ip);
  const sign = () => {
    const result = onLicense(ip.id, years);
    setMessage(result.ok ? `${ip.name} licensed.` : result.reason ?? "Could not sign license.");
  };
  return <div style={{ border: `1px solid ${active ? C.cyan : C.line}`, borderRadius: 10, padding: 13, background: active ? C.panel2 : C.panel }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><IPBadge ip={ip} /><div style={{ color: C.faint, fontSize: 10.5, marginTop: 4 }}>{ip.ownerName} · {ip.audienceLabel}</div></div>
      <span style={{ color: strength > .85 ? C.green : strength > .5 ? C.amber : C.faint, fontSize: 10.5, fontWeight: 700 }}>{strength > 1.05 ? "HOT" : strength > .72 ? "ESTABLISHED" : "NICHE"}</span>
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
      <button disabled={world.player.cash < terms.minimumGuarantee} onClick={sign} style={{ ...bigBtn, width: "100%", marginTop: 10, fontSize: 12, opacity: world.player.cash < terms.minimumGuarantee ? .45 : 1 }}>License {ip.name}</button>
    </> : null}
    {message && <div style={{ color: message.endsWith("licensed.") ? C.green : C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
  </div>;
}

function IPMetrics({ ip }: { ip: IPAsset }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 10 }}>
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

function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div style={{ border: `1px solid ${C.line}`, background: C.panel2, borderRadius: 9, padding: "9px 10px" }}><div style={{ color: C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: accent ? C.amber : C.ink, fontSize: 14, fontWeight: 800, marginTop: 2 }}>{value}</div></div>;
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
