import React, { useState } from "react";
import { C, bigBtn, ctrlBtn, fmtMoney, fmtNum, fmtPct } from "../theme";
import { Panel, FieldLabel, TextInput, Slider, DisabledReason } from "../components";
import { AXES, AXIS_KEYS } from "../../engine/industries";
import { canManageSegments, segmentStats, type SegmentFilter } from "../../engine/segments";
import type { World, AxisKey } from "../../engine/types";

export function SegmentsView({ world, saveSegment, deleteSegment, updateSegment}: {
  world: World;
  saveSegment: (name: string, filter: Record<string, string[]>) => void;
  deleteSegment: (id: string) => void;
  updateSegment: (id: string, name: string, filter: Record<string, string[]>) => void;
}) {
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<SegmentFilter>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const draftStats = segmentStats(world, filter);
  const mapRevealed = world.revealed.market_map;
  const manageGate = canManageSegments(world);

  const toggle = (axis: AxisKey, val: string) => {
    setFilter((f) => {
      const cur = f[axis] ?? [];
      const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
      return { ...f, [axis]: next };
    });
  };

  const startEdit = (seg: { id: string; name: string; filter: SegmentFilter }) => {
    setEditingId(seg.id); setName(seg.name); setFilter({ ...seg.filter });
  };
  const saveOrUpdate = () => {
    if (editingId) { updateSegment(editingId, name, filter); setEditingId(null); }
    else { saveSegment(name, filter); }
    setName(""); setFilter({});
  };

  const selectedSignals = Object.values(filter).reduce((sum, values) => sum + (values?.length ?? 0), 0);
  return (
    <div className="segment-studio">
      <section className="segment-hero">
        <div><span>AUDIENCE STUDIO</span><h2>Turn a market into people you understand.</h2><p>Build a reusable audience once, then target it consistently across product, pricing and campaigns.</p></div>
        <img src="/assets/ui/actions/market-study.png" alt="" />
        <div className="segment-hero-stats"><b>{world.savedSegments.length}<small>Saved audiences</small></b><b>{selectedSignals}<small>Active filters</small></b><b>{mapRevealed ? fmtMoney(draftStats.market) : "Locked"}<small>Draft opportunity</small></b></div>
      </section>
      <div className="segment-layout">
      <Panel title="Build a Segment" style={{ flex: "1 1 380px" }}>
        <FieldLabel>Segment name</FieldLabel>
        <TextInput placeholder="e.g. Soccer Moms" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ height: 12 }} />
        <FieldLabel>Filters (leave an axis empty to include all)</FieldLabel>
        {AXIS_KEYS.map((axis) => (
          <div key={axis} style={{ marginBottom: 8 }}>
            <div style={{ color: C.dim, fontSize: 12, fontWeight: 800, textTransform: "capitalize", marginBottom: 6 }}>{axis}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {AXES[axis].map((val) => {
                const on = (filter[axis] ?? []).includes(val);
                return (
                  <button key={val} onClick={() => toggle(axis, val)}
                    className="segment-chip" style={{ background: on ? C.cyan : C.panel2, color: on ? "#fff" : C.dim, border: `1px solid ${on ? C.cyan : C.line}` }}>
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="segment-preview">
          <div className="segment-avatar"><span>◎</span></div><div><b>{name.trim() || "Your audience"}</b><small>{selectedSignals ? `${selectedSignals} targeting signals selected` : "Broad market audience"}</small></div>
        </div>
        <div style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginTop: 8 }}>
          <Stat2 k="Population" v={mapRevealed ? fmtNum(draftStats.population) + " people" : "—"} />
          <Stat2 k="Total market" v={mapRevealed ? fmtMoney(draftStats.market) : "—"} color={C.green} />
          <Stat2 k="Avg spend" v={mapRevealed ? "$" + draftStats.avgSpend.toFixed(0) : "—"} />
          <Stat2 k="Cells covered" v={`${draftStats.cellCount} of ${world.cube.length}`} />
        </div>
        {!manageGate.ok && <div style={{ color: C.amber, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 10, marginTop: 10, fontSize: 12 }}>↳ {manageGate.reason}</div>}
        <button style={{ ...bigBtn, width: "100%", marginTop: 12, opacity: manageGate.ok && name.trim() && draftStats.cellCount > 0 ? 1 : .5 }}
          disabled={!manageGate.ok || !name.trim() || draftStats.cellCount === 0}
          title={!manageGate.ok ? manageGate.reason : !name.trim() ? "Give this audience a name first." : draftStats.cellCount === 0 ? "The current filters do not include any customer cells." : undefined}
          onClick={saveOrUpdate}>
          {editingId ? "Save changes" : "Save segment"}
        </button>
        {manageGate.ok && (!name.trim() || draftStats.cellCount === 0) && <DisabledReason>{!name.trim() ? "Give this audience a name before saving it." : "The current filters contain no customers; broaden the segment."}</DisabledReason>}
        {editingId && <button style={{ ...ctrlBtn, width: "100%", marginTop: 6 }} onClick={() => { setEditingId(null); setName(""); setFilter({}); }}>Cancel edit</button>}
      </Panel>

      <Panel title="Saved Segments" style={{ flex: "1 1 380px" }}>
        {world.savedSegments.length === 0 && <div className="segment-empty"><img src="/assets/ui/actions/market-study.png" alt=""/><b>No audiences saved yet</b><span>Your first saved segment becomes available in product launches and marketing campaigns.</span></div>}
        {world.savedSegments.map((seg) => {
          const st = segmentStats(world, seg.filter);
          const topNeed = Object.entries(st.needPref).sort((a, b) => b[1] - a[1])[0];
          return (
            <div key={seg.id} className="segment-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: C.ink, fontWeight: 850, fontSize: 16 }}>{seg.name}</span>
                <span style={{ color: C.green, fontSize: 13, fontWeight: 800, fontFamily: "ui-monospace" }}>{mapRevealed ? fmtMoney(st.market) : "—"}</span>
              </div>
              <div style={{ color: C.dim, fontSize: 12, margin: "5px 0 9px", lineHeight: 1.45 }}>
                {mapRevealed ? `${fmtNum(st.population)} people · $${st.avgSpend.toFixed(0)} avg` : `${st.cellCount} cells`}
                {mapRevealed && topNeed && <> · wants <span style={{ color: C.violet }}>{world.cfg.needs.find((n) => n.key === topNeed[0])?.label}</span></>}
                {mapRevealed && st.playerShareValue > 0 && <> · you capture <span style={{ color: C.green }}>{fmtMoney(st.playerShareValue)}</span></>}
              </div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                {Object.entries(seg.filter).filter(([, v]) => v && v.length > 0).map(([axis, vals]) => (
                  <span key={axis} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 99, padding: "5px 8px", fontSize: 12, color: C.dim }}>{vals.join(", ")}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button style={{ ...ctrlBtn, flex: 1 }} onClick={() => startEdit(seg)}>Edit audience</button>
                <button style={{...ctrlBtn,color:C.red}} onClick={() => setConfirmDeleteId(seg.id)}>Delete</button>
              </div>
              {confirmDeleteId === seg.id && <div className="segment-confirm"><span>Delete <b>{seg.name}</b>? Products keep their data, but this audience will no longer be available for future targeting.</span><div><button style={ctrlBtn} onClick={() => setConfirmDeleteId(null)}>Keep</button><button style={{...ctrlBtn,background:C.red,color:"#fff",borderColor:C.red}} onClick={() => { deleteSegment(seg.id); setConfirmDeleteId(null); }}>Delete audience</button></div></div>}
            </div>
          );
        })}
        <div style={{ color: C.dim, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          Segments define reusable audiences. Choose which one to target later in Product launch or Marketing; audience definition and media decisions stay separate.
        </div>
      </Panel>
      </div>
      <style>{`
        .segment-studio{display:grid;gap:14px}.segment-hero{position:relative;overflow:hidden;min-height:155px;padding:22px 210px 20px 22px;border-radius:18px;color:#fff;background:linear-gradient(120deg,rgba(8,37,69,.98),rgba(31,111,159,.92));box-shadow:0 16px 36px rgba(9,43,73,.18)}.segment-hero>div:first-child{position:relative;z-index:2}.segment-hero span{font-size:12px;font-weight:950;letter-spacing:1.2px;color:#8de0ff}.segment-hero h2{font-size:25px;line-height:1.12;margin:5px 0 6px}.segment-hero p{font-size:13px;line-height:1.5;margin:0;max-width:610px;color:#d8effa}.segment-hero>img{position:absolute;right:20px;top:7px;width:178px;height:142px;object-fit:contain;filter:drop-shadow(0 16px 22px rgba(0,0,0,.22))}.segment-hero-stats{display:flex!important;gap:8px;margin-top:14px}.segment-hero-stats b{min-width:110px;padding:8px 10px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.09);font-size:15px}.segment-hero-stats small{display:block;margin-top:2px;color:#b9dce9;font-size:11px;font-weight:700}.segment-layout{display:flex;gap:16px;flex-wrap:wrap}.segment-studio button{min-height:44px}.segment-studio button:focus-visible{outline:3px solid #7dd3fc;outline-offset:2px}.segment-chip{min-height:44px;padding:9px 12px;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;transition:transform .14s,box-shadow .14s}.segment-chip:hover{transform:translateY(-1px);box-shadow:0 5px 12px rgba(20,65,95,.12)}.segment-chip:active{transform:scale(.97)}.segment-preview{display:flex;gap:11px;align-items:center;margin:12px 0 8px;padding:12px;border-radius:13px;background:linear-gradient(135deg,#eef8ff,#f8f5ff);border:1px solid #bddcf0}.segment-preview b{display:block;font-size:15px}.segment-preview small{display:block;margin-top:2px;font-size:12px;color:${C.dim}}.segment-avatar{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;color:white;background:linear-gradient(135deg,${C.cyan},${C.violet});font-size:23px}.segment-card{margin-bottom:12px;padding:14px;background:linear-gradient(180deg,#fff,#f5f9fc);border:1px solid ${C.line};border-radius:13px;box-shadow:0 6px 17px rgba(17,54,84,.06);transition:transform .14s,box-shadow .14s}.segment-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(17,54,84,.11)}.segment-confirm{margin-top:10px;padding:12px;border-radius:11px;background:#fff5f5;border:1px solid #fecaca;color:${C.dim};font-size:12px;line-height:1.45}.segment-confirm>div{display:flex;gap:7px;justify-content:flex-end;margin-top:9px;flex-wrap:wrap}.segment-empty{min-height:245px;display:grid;place-items:center;align-content:center;text-align:center;padding:20px;border:1px dashed #b9d7e9;border-radius:14px;background:#f7fbfe}.segment-empty img{width:118px;height:96px;object-fit:contain}.segment-empty b{font-size:16px;color:${C.ink}}.segment-empty span{max-width:330px;margin-top:4px;font-size:12px;line-height:1.5;color:${C.dim}}@media(max-width:640px){.segment-hero{padding:18px 115px 17px 16px;min-height:150px}.segment-hero>img{width:105px;height:105px;right:4px;top:22px}.segment-hero h2{font-size:21px}.segment-hero p{font-size:12.5px}.segment-hero-stats{grid-column:1/-1;display:grid!important;grid-template-columns:repeat(3,1fr);margin-right:-100px}.segment-hero-stats b{min-width:0;font-size:13px;padding:8px 6px}.segment-hero-stats small{font-size:10px}.segment-layout{display:block}.segment-chip{flex:1 1 auto}.segment-card{padding:12px}}@media(max-width:420px){.segment-hero{padding:18px 15px}.segment-hero>img{display:none}.segment-hero-stats{margin-right:0}.segment-card>div:first-child{align-items:flex-start!important;gap:8px}.segment-card>div:nth-last-child(2){flex-direction:column}.segment-card>div:nth-last-child(2) button{width:100%}}
      `}</style>
    </div>
  );
}

const Stat2 = ({ k, v, color = C.ink }: { k: string; v: string; color?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: C.dim }}>{k}</span><span style={{ color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>
);
