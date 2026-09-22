import React, { useState } from "react";
import { C, bigBtn, ctrlBtn, fmtMoney } from "../theme";
import { FieldLabel, TextInput, ChoiceCard, Econ, StarRating, NumberInput, SelectInput } from "../components";
import { PACKAGING, RETAIL_PARTNERS, INDUSTRIES } from "../../engine/industries";
import type { ProductSpec } from "../../engine/world";
import { segmentStats, segmentTargetProfile } from "../../engine/segments";
import type { World, DesignDepth, ProductTestingLevel, SKU } from "../../engine/types";
import { DESIGN_DEPTHS } from "../../engine/types";
import { DEFAULT_SUPPLIER_ID } from "../../engine/suppliers";
import { archetypeByKey } from "../../engine/productCatalog";
import { TESTING_LEVELS, testingRequired } from "../../engine/productDynamics";
import { canNegotiatePartner, partnerSupportsIndustry } from "../../engine/distribution";
import { productManagerEffectiveness } from "../../engine/people";
import { brandById } from "../../engine/brands";
import { ipProductFit, usableIPsForProduct } from "../../engine/ip";
import {
  PRODUCT_POSITIONINGS, positioningDef, manufacturingStandard,
  attributesToStars, starsToAttributes, applyPositioningToPriorityStars, suggestedPrice,
  type ProductPositioning,
} from "../../engine/productDesign";

export function ProductCreator({ world, baseSku, onCreate, onClose }: { world: World; baseSku?: SKU | null; onCreate: (s: ProductSpec) => void; onClose: () => void }) {
  const activeBrands = world.brands.filter((b) => world.player.businesses?.[b.industryId]?.status === "active");
  const initialBrand = (baseSku ? world.brands.find((b) => b.id === baseSku.brandId) : null) ?? activeBrands.find((b) => b.id === world.primaryBrandId) ?? activeBrands[0] ?? world.brands[0];
  const initialCfg = INDUSTRIES[initialBrand.industryId] ?? world.cfg;
  const initialBusiness = world.player.businesses?.[initialCfg.id];
  const initialUnlocked = initialCfg.products.filter((p) => initialBusiness?.unlockedCategories.includes(p.key));
  const initialProductKey = baseSku?.productKey ?? initialUnlocked[0]?.key ?? initialCfg.products[0]?.key;
  const initialPositioning = (baseSku?.positioning as ProductPositioning | undefined) ?? (initialBrand.positioning === "mass" ? "mainstream" : initialBrand.positioning === "luxury" ? "luxury" : "premium");
  const baseTargetName = baseSku?.targetLabel?.split(" · ")[0] ?? "";
  const initialSegment = world.savedSegments.find((s) => s.name === baseTargetName)?.id ?? "broad";

  const [step, setStep] = useState<1 | 2>(1);
  const [brandId, setBrandId] = useState(initialBrand.id);
  const [productKey, setProductKey] = useState(initialProductKey);
  const [name, setName] = useState(baseSku ? `${baseSku.name.replace(/ v\d+$/i, "")} v${(baseSku.version ?? 1) + 1}` : "");
  const [targetSegmentId, setTargetSegmentId] = useState(initialSegment);
  const [positioning, setPositioning] = useState<ProductPositioning>(initialPositioning);
  const [designDepth, setDesignDepth] = useState<DesignDepth>(baseSku?.designDepth ?? "standard");
  const [leadPmId, setLeadPmId] = useState<string>(baseSku?.assignedPmId ?? "");
  const [testingLevel, setTestingLevel] = useState<ProductTestingLevel>(baseSku?.testingLevel ?? "standard");
  const [packaging, setPackaging] = useState(baseSku?.packaging ?? positioningDef(initialPositioning).packaging);
  const [ipId, setIpId] = useState<string | null>(baseSku?.ipId ?? null);
  const [designFacets, setDesignFacets] = useState<Record<string, string>>(() => {
    const a = archetypeByKey(initialProductKey);
    if (baseSku?.designFacets) return { ...baseSku.designFacets };
    return Object.fromEntries((a?.designFacets ?? []).map((f) => [f.id, f.defaultOptionId]));
  });
  const [priorityStars, setPriorityStars] = useState<Record<string, number>>(() => {
    if (baseSku) return attributesToStars(initialCfg, baseSku.attributes);
    const pt = initialCfg.products.find((p) => p.key === initialProductKey) ?? initialCfg.products[0];
    return applyPositioningToPriorityStars(initialCfg.id, attributesToStars(initialCfg, pt.defaultAttributes), initialPositioning);
  });

  const selectedBrand = world.brands.find((b) => b.id === brandId) ?? initialBrand;
  const cfg = INDUSTRIES[selectedBrand.industryId] ?? world.cfg;
  const business = world.player.businesses?.[cfg.id];
  const unlockedProducts = cfg.products.filter((p) => business?.unlockedCategories.includes(p.key));
  const pt = cfg.products.find((p) => p.key === productKey) ?? cfg.products[0];
  const archetype = archetypeByKey(productKey);
  const pos = positioningDef(positioning);
  const attributes = starsToAttributes(priorityStars);
  const depthDef = DESIGN_DEPTHS[designDepth];
  const testDef = TESTING_LEVELS[testingLevel];
  const developmentDays = Math.ceil(depthDef.days * testDef.timeMult);

  const productRooms = world.player.operatingRooms.filter((r) => r.kind === "office" && r.team === "product");
  const seatedPmIds = new Set(productRooms.flatMap((r) => r.assignedPersonnelIds));
  const lockedPmIds = new Set(world.player.skus.filter((sku) => sku.status === "designing" && sku.assignedPmId && sku.id !== baseSku?.id).map((sku) => sku.assignedPmId));
  const availablePms = world.player.personnel.filter((person) => person.role === "product_manager" && seatedPmIds.has(person.id) && !lockedPmIds.has(person.id));
  const selectedPm = availablePms.find((person) => person.id === leadPmId) ?? [...availablePms].sort((a, b) => productManagerEffectiveness(b, productKey) - productManagerEffectiveness(a, productKey))[0];
  const selectedSegment = targetSegmentId === "broad" ? null : world.savedSegments.find((seg) => seg.id === targetSegmentId) ?? null;
  const marketWorld = selectedBrand.industryId === world.industryId ? world : { ...world, cfg };
  const target = selectedSegment ? segmentTargetProfile(marketWorld as World, selectedSegment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
  const facetLabel = (archetype?.designFacets ?? []).map((facet) => {
    const option = facet.options.find((o) => o.id === (designFacets[facet.id] ?? facet.defaultOptionId));
    return option ? `${facet.label}: ${option.label}` : null;
  }).filter(Boolean).join(" · ");
  const targetLabel = [selectedSegment?.name ?? "Broad market", facetLabel].filter(Boolean).join(" · ");
  const usableIps = archetype ? usableIPsForProduct(world, productKey) : [];
  const canContinue = Boolean(name.trim() && pt && archetype && business?.unlockedCategories.includes(productKey));
  const canStart = canContinue && Boolean(selectedPm);

  const resetForProduct = (nextProductKey: string, nextPositioning: ProductPositioning, nextCfg = cfg) => {
    const nextPt = nextCfg.products.find((p) => p.key === nextProductKey) ?? nextCfg.products[0];
    setPriorityStars(applyPositioningToPriorityStars(nextCfg.id, attributesToStars(nextCfg, nextPt.defaultAttributes), nextPositioning));
    setPackaging(positioningDef(nextPositioning).packaging);
    setTestingLevel("standard");
    setIpId(null);
    const nextArchetype = archetypeByKey(nextProductKey);
    setDesignFacets(Object.fromEntries((nextArchetype?.designFacets ?? []).map((f) => [f.id, f.defaultOptionId])));
  };

  return <Modal onClose={onClose} title={baseSku ? <>Design next version — <span style={{ color: selectedBrand.color }}>{baseSku.name}</span></> : <>Design new product — <span style={{ color: selectedBrand.color }}>{selectedBrand.name}</span></>} wide>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 99, background: step >= 1 ? C.violet : C.grid }} />
      <div style={{ flex: 1, height: 7, borderRadius: 99, background: step >= 2 ? C.violet : C.grid }} />
    </div>
    <div style={{ padding: "10px 12px", background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, color: C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>
      <b style={{ color: C.ink }}>Design first.</b> Manufacturer, production standard, batch size, selling price and retail channels are decided only after the design is complete.
    </div>

    {step === 1 ? <div>
      <FieldLabel>1. Product brief</FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
        <div>
          <SelectInput label="Brand" value={brandId} onChange={(id) => {
            const b = world.brands.find((x) => x.id === id); if (!b) return;
            setBrandId(id);
            const nextCfg = INDUSTRIES[b.industryId] ?? world.cfg;
            const nextBusiness = world.player.businesses?.[b.industryId];
            const nextProduct = nextCfg.products.find((prod) => nextBusiness?.unlockedCategories.includes(prod.key)) ?? nextCfg.products[0];
            const nextPos: ProductPositioning = b.positioning === "mass" ? "mainstream" : b.positioning === "luxury" ? "luxury" : "premium";
            setProductKey(nextProduct.key); setPositioning(nextPos); setTargetSegmentId("broad"); resetForProduct(nextProduct.key, nextPos, nextCfg);
          }}>{activeBrands.map((b) => <option key={b.id} value={b.id}>{b.name} — {INDUSTRIES[b.industryId]?.label ?? b.industryId}</option>)}</SelectInput>
          <SelectInput label="Product type" value={productKey} onChange={(k) => { setProductKey(k); resetForProduct(k, positioning, cfg); }}>{unlockedProducts.map((prod) => <option key={prod.key} value={prod.key}>{prod.label}</option>)}</SelectInput>
          <FieldLabel>Working name</FieldLabel><TextInput value={name} placeholder="e.g. Nova Serum" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <SelectInput label="Initial audience hypothesis" value={targetSegmentId} onChange={setTargetSegmentId}><option value="broad">Broad market</option>{world.savedSegments.map((seg) => <option key={seg.id} value={seg.id}>{seg.name}</option>)}</SelectInput>
          <SelectInput label="Commercial positioning" value={positioning} onChange={(v) => { const next = v as ProductPositioning; setPositioning(next); if (!baseSku) resetForProduct(productKey, next, cfg); }}>{PRODUCT_POSITIONINGS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</SelectInput>
          <div style={{ color: C.faint, fontSize: 10.5, lineHeight: 1.45 }}>{pos.desc}</div>
          {(archetype?.designFacets ?? []).map((facet) => <div key={facet.id} style={{ marginTop: 9 }}><SelectInput label={facet.label} value={designFacets[facet.id] ?? facet.defaultOptionId} onChange={(v) => setDesignFacets((cur) => ({ ...cur, [facet.id]: v }))}>{facet.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</SelectInput></div>)}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button style={ctrlBtn} onClick={onClose}>Cancel</button><button disabled={!canContinue} style={{ ...bigBtn, opacity: canContinue ? 1 : .45 }} onClick={() => setStep(2)}>Continue to design →</button></div>
    </div> : <div>
      <FieldLabel>2. Build the design</FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        <div>
          <div style={{ fontWeight: 750, marginBottom: 7, fontSize: 12.5 }}>Product priorities</div>
          {cfg.needs.map((need) => <div key={need.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: `1px solid ${C.grid}` }}><span style={{ color: C.ink, fontSize: 12.5 }}>{need.label}</span><StarRating value={priorityStars[need.key] ?? 3} onChange={(v) => setPriorityStars((cur) => ({ ...cur, [need.key]: v }))} /></div>)}
          <div style={{ height: 12 }} />
          <SelectInput label="Packaging direction" value={packaging} onChange={setPackaging}>{PACKAGING.map((pk) => <option key={pk.key} value={pk.key}>{pk.label}</option>)}</SelectInput>
          <div style={{ color: C.faint, fontSize: 10.5 }}>Packaging is part of the proposition. Manufacturing quality itself is chosen later with the manufacturer.</div>
        </div>
        <div>
          <FieldLabel>Development approach</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>{(Object.keys(DESIGN_DEPTHS) as DesignDepth[]).map((d) => { const dd = DESIGN_DEPTHS[d]; return <ChoiceCard key={d} active={designDepth === d} onClick={() => setDesignDepth(d)}><div style={{ fontWeight: 700, fontSize: 12.5 }}>{dd.label}</div><div style={{ color: C.dim, fontSize: 10 }}>{dd.days} base days</div></ChoiceCard>; })}</div>
          {testingRequired(productKey) && <SelectInput label="Testing & validation" value={testingLevel} onChange={(v) => setTestingLevel(v as ProductTestingLevel)}>{(Object.keys(TESTING_LEVELS) as ProductTestingLevel[]).map((level) => <option key={level} value={level}>{TESTING_LEVELS[level].label}</option>)}</SelectInput>}
          <SelectInput label="Lead Product Manager" value={selectedPm?.id ?? ""} onChange={setLeadPmId}>{availablePms.length ? availablePms.map((person) => <option key={person.id} value={person.id}>{person.name} — {person.title} · {Math.round(productManagerEffectiveness(person, productKey) * 100)} fit</option>) : <option value="">No available PM</option>}</SelectInput>
          {!availablePms.length && <div style={{ color: C.amber, fontSize: 10.5, marginBottom: 10 }}>Hire and seat a Product Manager before starting development.</div>}
          {archetype && archetype.ipPotential > 0 && <div style={{ marginTop: 10 }}>
            <FieldLabel>IP / collection — optional</FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
              <button onClick={() => setIpId(null)} style={{ ...ctrlBtn, textAlign: "left", borderColor: !ipId ? C.violet : C.line, color: !ipId ? C.violet : C.dim }}>No IP</button>
              {usableIps.map((ip) => <button key={ip.id} onClick={() => setIpId(ip.id)} style={{ ...ctrlBtn, textAlign: "left", borderColor: ipId === ip.id ? C.violet : C.line, color: ipId === ip.id ? C.violet : C.dim }}>{ip.name} · {Math.round(ipProductFit(ip, productKey) * 5)}/5 fit</button>)}
            </div>
          </div>}
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: C.panel2, border: `1px solid ${C.line}`, fontSize: 11.5 }}><b>{depthDef.label} design</b> · ~{developmentDays} days<br /><span style={{ color: C.faint }}>Audience: {targetLabel}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button style={ctrlBtn} onClick={() => setStep(1)}>← Back</button><button disabled={!canStart} style={{ ...bigBtn, opacity: canStart ? 1 : .45 }} onClick={() => onCreate({
        name: name.trim(), productKey, brandId, method: "outsource", supplierId: DEFAULT_SUPPLIER_ID, manufacturingStars: 3,
        listPrice: suggestedPrice(pt.priceBand, .5), target, targetLabel, positioning, attributes, packaging, designDepth,
        pmId: selectedPm?.id, testingLevel, designFacets, ipId, version: baseSku ? (baseSku.version ?? 1) + 1 : 1, parentSkuId: baseSku?.id ?? null,
      })}>Start design · ~{developmentDays} days</button></div>
    </div>}
  </Modal>;
}

export function ContractModal({ world, onSign, onClose }: { world: World; onSign: (partnerId: string) => void; onClose: () => void }) {
  const activeIndustries = new Set(Object.values(world.player.businesses ?? {}).filter((b) => b?.status === "active").map((b) => b!.industryId));
  const available = RETAIL_PARTNERS.filter((p) => {
    if (p.industries && !p.industries.some((id) => activeIndustries.has(id))) return false;
    if (world.player.contracts.some((c) => c.partnerId === p.id)) return false;
    return true;
  });
  const signed = world.player.contracts;
  const hasExternalCapability = canNegotiatePartner(world, "megazon");
  return (
    <Modal onClose={onClose} title="Distribution Partners" wide>
      {!hasExternalCapability && <div style={{ marginBottom: 14, padding: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, color: "#9a3412", fontSize: 11.5, lineHeight: 1.45 }}>External retailers require commercial capability: build a Sourcing Office, or staff a Sales office with Operations/Strategy. Your own website can still be opened immediately.</div>}
      {signed.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Active contracts</div>
          {signed.map((c, i) => (
            <div key={i} style={{ fontSize: 12, padding: "4px 0", color: C.ink }}>{c.partnerName || c.type} — {(c.marginCut * 100).toFixed(0)}% cut</div>
          ))}
        </div>
      )}
      <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Available partners</div>
      {available.length === 0 && <div style={{ color: C.faint, fontSize: 13 }}>All available partners are signed or none match your active businesses.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
        {available.map((p) => (
          <div key={p.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{p.name}</div>
            <div style={{ color: C.dim, fontSize: 11, marginTop: 2, marginBottom: 6 }}>{p.desc}</div>
            {p.industries && <div style={{ color: C.violet, fontSize: 10, marginBottom: 5 }}>Best for: {p.industries.map((id) => INDUSTRIES[id]?.label ?? id).join(", ")}</div>}
            <div style={{ fontSize: 11, color: C.faint, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <span>Cut: <span style={{ color: C.amber }}>{(p.marginCut * 100).toFixed(0)}%</span></span>
              <span>Slotting: <span style={{ color: C.amber }}>{fmtMoney(p.slotting)}/Q</span></span>
              <span>Pays in: <span style={{ color: p.paymentDays > 60 ? C.red : C.cyan }}>{p.paymentDays}d</span></span>
              <span>Reach: <span style={{ color: C.cyan }}>{(p.reachMult * 100).toFixed(0)}%</span></span>
            </div>
            <button disabled={!canNegotiatePartner(world, p.id)} style={{ ...bigBtn, width: "100%", fontSize: 12, opacity: canNegotiatePartner(world, p.id) ? 1 : .45 }} onClick={() => onSign(p.id)}>Sign with {p.name}</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button style={ctrlBtn} onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,8,12,.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 140 }}>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22, width: "100%", maxWidth: wide ? 760 : 560, maxHeight: "92vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2><button style={ctrlBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
