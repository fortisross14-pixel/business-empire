import React, { useId } from "react";
import { C, UI } from "../theme";

export function LineChart({ series, height = 150, fmt = (v: number) => v.toFixed(0), zeroLine = false, markers = [] }:
  { series: { data: number[]; color: string; label?: string; area?: boolean }[]; height?: number; fmt?: (v: number) => string; zeroLine?: boolean; markers?: { i: number }[] }) {
  const chartId = useId().replace(/:/g, "");
  const W = 520, H = height, pad = { l: 8, r: 8, t: 10, b: 16 };
  const all = series.flatMap((s) => s.data);
  if (!all.length) return <div style={{ height: H, color: C.faint, fontSize: 12, display: "flex", alignItems: "center" }}>no data yet…</div>;
  let min = Math.min(...all), max = Math.max(...all);
  if (zeroLine) { min = Math.min(min, 0); max = Math.max(max, 0); }
  if (min === max) { max += 1; min -= 1; }
  const n = Math.max(...series.map((item) => item.data.length));
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="game-line-chart" style={{ width: "100%", height: H, display: "block", overflow: "visible" }}>
      <defs>{series.map((s, si) => <linearGradient key={si} id={`area-${chartId}-${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".28"/><stop offset="1" stopColor={s.color} stopOpacity="0"/></linearGradient>)}</defs>
      {[0, .25, .5, .75, 1].map((f, i) => <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke={C.grid} />)}
      {markers.map((mk, i) => { const xi = x(mk.i); return <line key={"m" + i} x1={xi} x2={xi} y1={pad.t} y2={H - pad.b} stroke={C.amber} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />; })}
      {zeroLine && min < 0 && max > 0 && <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke={C.faint} strokeDasharray="3 3" />}
      {series.map((s, si) => {
        const line = s.data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
        const area = s.data.length ? `${line} L${x(s.data.length - 1).toFixed(1)},${H - pad.b} L${x(0).toFixed(1)},${H - pad.b} Z` : "";
        const last = s.data.at(-1);
        return <g key={si}>{s.area && <path d={area} fill={`url(#area-${chartId}-${si})`} />}
          <path className="chart-line-path" d={line} fill="none" stroke={s.color} strokeWidth={si === 0 ? "2.8" : "2"} strokeLinecap="round" strokeLinejoin="round" />
          {last != null && <><circle cx={x(s.data.length - 1)} cy={y(last)} r={si === 0 ? 4 : 3} fill="#fff" stroke={s.color} strokeWidth="2"/><circle className="chart-pulse-dot" cx={x(s.data.length - 1)} cy={y(last)} r={si === 0 ? 7 : 5} fill="none" stroke={s.color} strokeWidth="1" opacity=".42"/></>}</g>;
      })}
      <text x={pad.l} y={11} fill={C.faint} fontSize="9" fontFamily="ui-monospace">{fmt(max)}</text>
      <text x={pad.l} y={H - 4} fill={C.faint} fontSize="9" fontFamily="ui-monospace">{fmt(min)}</text>
    </svg>
  );
}

export function DonutChart({ segments, centerLabel, centerValue, size = 210 }: { segments: { label: string; value: number; color: string }[]; centerLabel: string; centerValue: string; size?: number }) {
  const total = Math.max(.0001, segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0));
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor; cursor += Math.max(0, segment.value) / total * 100;
    return `${segment.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  }).join(",");
  return <div className="donut-wrap" style={{ width: size, height: size, position: "relative", flex: "0 0 auto" }}>
    <div className="donut-chart" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from -90deg,${stops})`, boxShadow: "0 15px 32px rgba(18,47,75,.16),inset 0 0 0 1px rgba(255,255,255,.55)" }} />
    <div style={{ position: "absolute", inset: "23%", borderRadius: "50%", background: "linear-gradient(145deg,#fff,#edf5fb)", boxShadow: "inset 0 0 0 1px rgba(130,157,178,.18),0 4px 12px rgba(17,45,70,.12)", display: "grid", placeItems: "center", textAlign: "center", padding: 8 }}><div><small style={{ display: "block", color: C.faint, fontSize: 8, fontWeight: 900, letterSpacing: .7 }}>{centerLabel}</small><b style={{ display: "block", color: C.ink, font: "900 24px ui-monospace,monospace", marginTop: 2 }}>{centerValue}</b></div></div>
  </div>;
}

export const Stat = ({ label, value, color = C.ink, delta }: { label: string; value: string; color?: string; delta?: number }) => (
  <div style={{ background: "linear-gradient(180deg,#ffffff 0%,#f6f9fb 100%)", border: `1px solid ${C.line}`, borderRadius: UI.radius.md, padding: "11px 13px", minWidth: 112, boxShadow: UI.shadow.low }}>
    <div style={{ color: C.dim, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: .75 }}>{label}</div>
    <div style={{ color, fontSize: 20, fontWeight: 800, fontFamily: "ui-monospace", letterSpacing: -.5 }}>{value}</div>
    {delta != null && <div style={{ color: delta >= 0 ? C.green : C.red, fontSize: 10.5, fontWeight: 750 }}>{delta >= 0 ? "▲" : "▼"} {(Math.abs(delta) * 100).toFixed(1)}%</div>}
  </div>
);

export const Panel = ({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="game-panel" style={{ background: "linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)", border: `1px solid ${C.line}`, borderRadius: UI.radius.lg, padding: 18, marginBottom: 14, boxShadow: UI.shadow.card, ...style }}>
    {title && <div style={{ color: C.ink, fontSize: 14, fontWeight: 850, marginBottom: 13, paddingBottom: 10, borderBottom: `1px solid ${C.grid}`, letterSpacing: -.1 }}>{title}</div>}
    {children}
  </div>
);

export const Slider = ({ label, value, min, max, step, onChange, fmt = (v: number) => String(v) }:
  { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.dim, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: C.ink, fontFamily: "ui-monospace" }}>{fmt(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.cyan }} />
  </div>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{children}</div>
);
export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ width: "100%", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", color: C.ink, fontSize: 14, boxSizing: "border-box", boxShadow: "inset 0 1px 2px rgba(19,34,56,.04)" }} />
);
export const ChoiceCard = ({ active, onClick, children, disabled, accent = C.cyan }:
  { active?: boolean; onClick?: () => void; children: React.ReactNode; disabled?: boolean; accent?: string }) => (
  <button className="choice-card" onClick={onClick} disabled={disabled} style={{ flex: 1, textAlign: "left", background: active ? "linear-gradient(180deg,#eef8ff 0%,#e6f3fd 100%)" : "linear-gradient(180deg,#fff 0%,#f7faff 100%)", border: `1px solid ${active ? accent : C.line}`, borderRadius: 12, padding: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .45 : 1, color: C.ink, boxShadow: active ? "0 4px 12px rgba(22,141,226,.10)" : "0 2px 8px rgba(19,34,56,.035)" }}>{children}</button>
);
export const Center = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px,4vw,24px)" }}>{children}</div>
);
export const Econ = ({ k, v, color }: { k: string; v: string; color: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: C.dim }}>{k}</span><span style={{ color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>
);
export const Row = ({ k, v, strong, indent }: { k: string; v: string; strong?: boolean; indent?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", paddingLeft: indent ? 20 : 8, background: strong ? C.panel2 : "transparent", borderRadius: 4 }}>
    <span style={{ color: C.dim }}>{k}</span><span style={{ color: C.ink, fontWeight: strong ? 700 : 400, fontFamily: "ui-monospace" }}>{v}</span>
  </div>
);
export const Seg = ({ label, opts, val, set }: { label: string; opts: string[]; val: string; set: (v: string) => void }) => (
  <div><div style={{ color: C.faint, fontSize: 10, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", gap: 3, background: "#e8eef2", border: `1px solid ${C.line}`, borderRadius: UI.radius.md, padding: 3, flexWrap: "wrap" }}>
      {opts.map((o) => <button key={o} onClick={() => set(o)} style={{ background: val === o ? "linear-gradient(180deg,#249eea,#147fc8)" : "transparent", color: val === o ? "#fff" : C.dim, border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, fontWeight: 750, cursor: "pointer", boxShadow: val === o ? "0 2px 6px rgba(22,141,226,.20)" : "none" }}>{o}</button>)}
    </div>
  </div>
);

export const StarRating = ({ value, onChange, label, readOnly = false, size = 19 }:
  { value: number; onChange?: (v: number) => void; label?: string; readOnly?: boolean; size?: number }) => (
  <div style={{ marginBottom: 8 }}>
    {label && <div style={{ color: C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readOnly} onClick={() => !readOnly && onChange?.(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          style={{ background: "transparent", border: "none", padding: 0, cursor: readOnly ? "default" : "pointer", fontSize: size, lineHeight: 1, color: star <= Math.round(value) ? C.amber : C.grid }}>
          ★
        </button>
      ))}
    </div>
  </div>
);

export const NumberInput = ({ label, value, onChange, min, max, step = 1, prefix, suffix }:
  { label?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; prefix?: string; suffix?: string }) => (
  <div style={{ marginBottom: 10 }}>
    {label && <div style={{ color: C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 10px" }}>
      {prefix && <span style={{ color: C.dim }}>{prefix}</span>}
      <input type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n)));
        }}
        style={{ flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", color: C.ink, fontSize: 14, fontFamily: "ui-monospace" }} />
      {suffix && <span style={{ color: C.dim, fontSize: 12 }}>{suffix}</span>}
    </div>
  </div>
);

export const SelectInput = ({ label, value, onChange, children }:
  { label?: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
  <div style={{ marginBottom: 10 }}>
    {label && <div style={{ color: C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", color: C.ink, fontSize: 14 }}>
      {children}
    </select>
  </div>
);

export const DisabledReason = ({ children }: { children?: React.ReactNode }) => {
  if (!children) return null;
  return <div style={{ color: C.amber, fontSize: 10, lineHeight: 1.4, marginTop: 5 }}>↳ {children}</div>;
};
