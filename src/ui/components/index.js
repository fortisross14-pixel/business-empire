"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisabledReason = exports.SelectInput = exports.NumberInput = exports.StarRating = exports.Seg = exports.Row = exports.Econ = exports.Center = exports.ChoiceCard = exports.TextInput = exports.FieldLabel = exports.Slider = exports.Panel = exports.Stat = void 0;
exports.LineChart = LineChart;
var react_1 = require("react");
var theme_1 = require("../theme");
function LineChart(_a) {
    var series = _a.series, _b = _a.height, height = _b === void 0 ? 150 : _b, _c = _a.fmt, fmt = _c === void 0 ? function (v) { return v.toFixed(0); } : _c, _d = _a.zeroLine, zeroLine = _d === void 0 ? false : _d, _e = _a.markers, markers = _e === void 0 ? [] : _e;
    var W = 520, H = height, pad = { l: 8, r: 8, t: 10, b: 16 };
    var all = series.flatMap(function (s) { return s.data; });
    if (!all.length)
        return <div style={{ height: H, color: theme_1.C.faint, fontSize: 12, display: "flex", alignItems: "center" }}>no data yet…</div>;
    var min = Math.min.apply(Math, all), max = Math.max.apply(Math, all);
    if (zeroLine) {
        min = Math.min(min, 0);
        max = Math.max(max, 0);
    }
    if (min === max) {
        max += 1;
        min -= 1;
    }
    var n = series[0].data.length;
    var x = function (i) { return pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r); };
    var y = function (v) { return pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b); };
    return (<svg viewBox={"0 0 ".concat(W, " ").concat(H)} style={{ width: "100%", height: H, display: "block" }}>
      {[0, .25, .5, .75, 1].map(function (f, i) { return <line key={i} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke={theme_1.C.grid}/>; })}
      {markers.map(function (mk, i) { var xi = x(mk.i); return <line key={"m" + i} x1={xi} x2={xi} y1={pad.t} y2={H - pad.b} stroke={theme_1.C.amber} strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>; })}
      {zeroLine && min < 0 && max > 0 && <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke={theme_1.C.faint} strokeDasharray="3 3"/>}
      {series.map(function (s, si) { return <path key={si} d={s.data.map(function (v, i) { return "".concat(i ? "L" : "M").concat(x(i).toFixed(1), ",").concat(y(v).toFixed(1)); }).join(" ")} fill="none" stroke={s.color} strokeWidth="1.8"/>; })}
      <text x={pad.l} y={11} fill={theme_1.C.faint} fontSize="9" fontFamily="ui-monospace">{fmt(max)}</text>
      <text x={pad.l} y={H - 4} fill={theme_1.C.faint} fontSize="9" fontFamily="ui-monospace">{fmt(min)}</text>
    </svg>);
}
var Stat = function (_a) {
    var label = _a.label, value = _a.value, _b = _a.color, color = _b === void 0 ? theme_1.C.ink : _b, delta = _a.delta;
    return (<div style={{ background: "linear-gradient(180deg,#ffffff 0%,#f6f9fb 100%)", border: "1px solid ".concat(theme_1.C.line), borderRadius: theme_1.UI.radius.md, padding: "11px 13px", minWidth: 112, boxShadow: theme_1.UI.shadow.low }}>
    <div style={{ color: theme_1.C.dim, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: .75 }}>{label}</div>
    <div style={{ color: color, fontSize: 20, fontWeight: 800, fontFamily: "ui-monospace", letterSpacing: -.5 }}>{value}</div>
    {delta != null && <div style={{ color: delta >= 0 ? theme_1.C.green : theme_1.C.red, fontSize: 10.5, fontWeight: 750 }}>{delta >= 0 ? "▲" : "▼"} {(Math.abs(delta) * 100).toFixed(1)}%</div>}
  </div>);
};
exports.Stat = Stat;
var Panel = function (_a) {
    var title = _a.title, children = _a.children, style = _a.style;
    return (<div style={__assign({ background: "linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)", border: "1px solid ".concat(theme_1.C.line), borderRadius: theme_1.UI.radius.lg, padding: 18, marginBottom: 14, boxShadow: theme_1.UI.shadow.card }, style)}>
    {title && <div style={{ color: theme_1.C.ink, fontSize: 14, fontWeight: 850, marginBottom: 13, paddingBottom: 10, borderBottom: "1px solid ".concat(theme_1.C.grid), letterSpacing: -.1 }}>{title}</div>}
    {children}
  </div>);
};
exports.Panel = Panel;
var Slider = function (_a) {
    var label = _a.label, value = _a.value, min = _a.min, max = _a.max, step = _a.step, onChange = _a.onChange, _b = _a.fmt, fmt = _b === void 0 ? function (v) { return String(v); } : _b;
    return (<div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme_1.C.dim, marginBottom: 4 }}>
      <span>{label}</span><span style={{ color: theme_1.C.ink, fontFamily: "ui-monospace" }}>{fmt(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={function (e) { return onChange(parseFloat(e.target.value)); }} style={{ width: "100%", accentColor: theme_1.C.cyan }}/>
  </div>);
};
exports.Slider = Slider;
var FieldLabel = function (_a) {
    var children = _a.children;
    return (<div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .8, marginBottom: 8 }}>{children}</div>);
};
exports.FieldLabel = FieldLabel;
var TextInput = function (props) { return (<input {...props} style={{ width: "100%", background: "#fff", border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, padding: "10px 12px", color: theme_1.C.ink, fontSize: 14, boxSizing: "border-box", boxShadow: "inset 0 1px 2px rgba(19,34,56,.04)" }}/>); };
exports.TextInput = TextInput;
var ChoiceCard = function (_a) {
    var active = _a.active, onClick = _a.onClick, children = _a.children, disabled = _a.disabled, _b = _a.accent, accent = _b === void 0 ? theme_1.C.cyan : _b;
    return (<button onClick={onClick} disabled={disabled} style={{ flex: 1, textAlign: "left", background: active ? "linear-gradient(180deg,#eef8ff 0%,#e6f3fd 100%)" : "linear-gradient(180deg,#fff 0%,#f7faff 100%)", border: "1px solid ".concat(active ? accent : theme_1.C.line), borderRadius: 12, padding: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .45 : 1, color: theme_1.C.ink, boxShadow: active ? "0 4px 12px rgba(22,141,226,.10)" : "0 2px 8px rgba(19,34,56,.035)" }}>{children}</button>);
};
exports.ChoiceCard = ChoiceCard;
var Center = function (_a) {
    var children = _a.children;
    return (<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px,4vw,24px)" }}>{children}</div>);
};
exports.Center = Center;
var Econ = function (_a) {
    var k = _a.k, v = _a.v, color = _a.color;
    return (<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: theme_1.C.dim }}>{k}</span><span style={{ color: color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>);
};
exports.Econ = Econ;
var Row = function (_a) {
    var k = _a.k, v = _a.v, strong = _a.strong, indent = _a.indent;
    return (<div style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", paddingLeft: indent ? 20 : 8, background: strong ? theme_1.C.panel2 : "transparent", borderRadius: 4 }}>
    <span style={{ color: theme_1.C.dim }}>{k}</span><span style={{ color: theme_1.C.ink, fontWeight: strong ? 700 : 400, fontFamily: "ui-monospace" }}>{v}</span>
  </div>);
};
exports.Row = Row;
var Seg = function (_a) {
    var label = _a.label, opts = _a.opts, val = _a.val, set = _a.set;
    return (<div><div style={{ color: theme_1.C.faint, fontSize: 10, marginBottom: 4 }}>{label}</div>
    <div style={{ display: "flex", gap: 3, background: "#e8eef2", border: "1px solid ".concat(theme_1.C.line), borderRadius: theme_1.UI.radius.md, padding: 3, flexWrap: "wrap" }}>
      {opts.map(function (o) { return <button key={o} onClick={function () { return set(o); }} style={{ background: val === o ? "linear-gradient(180deg,#249eea,#147fc8)" : "transparent", color: val === o ? "#fff" : theme_1.C.dim, border: "none", borderRadius: 6, padding: "5px 9px", fontSize: 11, fontWeight: 750, cursor: "pointer", boxShadow: val === o ? "0 2px 6px rgba(22,141,226,.20)" : "none" }}>{o}</button>; })}
    </div>
  </div>);
};
exports.Seg = Seg;
var StarRating = function (_a) {
    var value = _a.value, onChange = _a.onChange, label = _a.label, _b = _a.readOnly, readOnly = _b === void 0 ? false : _b, _c = _a.size, size = _c === void 0 ? 19 : _c;
    return (<div style={{ marginBottom: 8 }}>
    {label && <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(function (star) { return (<button key={star} type="button" disabled={readOnly} onClick={function () { return !readOnly && (onChange === null || onChange === void 0 ? void 0 : onChange(star)); }} aria-label={"".concat(star, " star").concat(star === 1 ? "" : "s")} style={{ background: "transparent", border: "none", padding: 0, cursor: readOnly ? "default" : "pointer", fontSize: size, lineHeight: 1, color: star <= Math.round(value) ? theme_1.C.amber : theme_1.C.grid }}>
          ★
        </button>); })}
    </div>
  </div>);
};
exports.StarRating = StarRating;
var NumberInput = function (_a) {
    var label = _a.label, value = _a.value, onChange = _a.onChange, min = _a.min, max = _a.max, _b = _a.step, step = _b === void 0 ? 1 : _b, prefix = _a.prefix, suffix = _a.suffix;
    return (<div style={{ marginBottom: 10 }}>
    {label && <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: theme_1.C.bg, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "7px 10px" }}>
      {prefix && <span style={{ color: theme_1.C.dim }}>{prefix}</span>}
      <input type="number" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={function (e) {
            var n = Number(e.target.value);
            if (!Number.isFinite(n))
                return;
            onChange(Math.max(min !== null && min !== void 0 ? min : -Infinity, Math.min(max !== null && max !== void 0 ? max : Infinity, n)));
        }} style={{ flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", color: theme_1.C.ink, fontSize: 14, fontFamily: "ui-monospace" }}/>
      {suffix && <span style={{ color: theme_1.C.dim, fontSize: 12 }}>{suffix}</span>}
    </div>
  </div>);
};
exports.NumberInput = NumberInput;
var SelectInput = function (_a) {
    var label = _a.label, value = _a.value, onChange = _a.onChange, children = _a.children;
    return (<div style={{ marginBottom: 10 }}>
    {label && <div style={{ color: theme_1.C.dim, fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={function (e) { return onChange(e.target.value); }} style={{ width: "100%", background: theme_1.C.bg, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "10px 12px", color: theme_1.C.ink, fontSize: 14 }}>
      {children}
    </select>
  </div>);
};
exports.SelectInput = SelectInput;
var DisabledReason = function (_a) {
    var children = _a.children;
    if (!children)
        return null;
    return <div style={{ color: theme_1.C.amber, fontSize: 10, lineHeight: 1.4, marginTop: 5 }}>↳ {children}</div>;
};
exports.DisabledReason = DisabledReason;
