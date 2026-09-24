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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentsView = SegmentsView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var industries_1 = require("../../engine/industries");
var segments_1 = require("../../engine/segments");
function SegmentsView(_a) {
    var world = _a.world, saveSegment = _a.saveSegment, deleteSegment = _a.deleteSegment, updateSegment = _a.updateSegment;
    var _b = (0, react_1.useState)(""), name = _b[0], setName = _b[1];
    var _c = (0, react_1.useState)({}), filter = _c[0], setFilter = _c[1];
    var _d = (0, react_1.useState)(null), editingId = _d[0], setEditingId = _d[1];
    var draftStats = (0, segments_1.segmentStats)(world, filter);
    var mapRevealed = world.revealed.market_map;
    var manageGate = (0, segments_1.canManageSegments)(world);
    var toggle = function (axis, val) {
        setFilter(function (f) {
            var _a;
            var _b;
            var cur = (_b = f[axis]) !== null && _b !== void 0 ? _b : [];
            var next = cur.includes(val) ? cur.filter(function (x) { return x !== val; }) : __spreadArray(__spreadArray([], cur, true), [val], false);
            return __assign(__assign({}, f), (_a = {}, _a[axis] = next, _a));
        });
    };
    var startEdit = function (seg) {
        setEditingId(seg.id);
        setName(seg.name);
        setFilter(__assign({}, seg.filter));
    };
    var saveOrUpdate = function () {
        if (editingId) {
            updateSegment(editingId, name, filter);
            setEditingId(null);
        }
        else {
            saveSegment(name, filter);
        }
        setName("");
        setFilter({});
    };
    return (<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <components_1.Panel title="Build a Segment" style={{ flex: "1 1 380px" }}>
        <components_1.FieldLabel>Segment name</components_1.FieldLabel>
        <components_1.TextInput placeholder="e.g. Soccer Moms" value={name} onChange={function (e) { return setName(e.target.value); }}/>
        <div style={{ height: 12 }}/>
        <components_1.FieldLabel>Filters (leave an axis empty to include all)</components_1.FieldLabel>
        {industries_1.AXIS_KEYS.map(function (axis) { return (<div key={axis} style={{ marginBottom: 8 }}>
            <div style={{ color: theme_1.C.faint, fontSize: 10, textTransform: "capitalize", marginBottom: 3 }}>{axis}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {industries_1.AXES[axis].map(function (val) {
                var _a;
                var on = ((_a = filter[axis]) !== null && _a !== void 0 ? _a : []).includes(val);
                return (<button key={val} onClick={function () { return toggle(axis, val); }} style={{ background: on ? theme_1.C.cyan : theme_1.C.panel2, color: on ? "#fff" : theme_1.C.dim, border: "1px solid ".concat(on ? theme_1.C.cyan : theme_1.C.line), borderRadius: 5, padding: "4px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    {val}
                  </button>);
            })}
            </div>
          </div>); })}
        <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: 12, marginTop: 8 }}>
          <Stat2 k="Population" v={mapRevealed ? (0, theme_1.fmtNum)(draftStats.population) + " people" : "—"}/>
          <Stat2 k="Total market" v={mapRevealed ? (0, theme_1.fmtMoney)(draftStats.market) : "—"} color={theme_1.C.green}/>
          <Stat2 k="Avg spend" v={mapRevealed ? "$" + draftStats.avgSpend.toFixed(0) : "—"}/>
          <Stat2 k="Cells covered" v={"".concat(draftStats.cellCount, " of ").concat(world.cube.length)}/>
        </div>
        {!manageGate.ok && <div style={{ color: theme_1.C.amber, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: 9, marginTop: 10, fontSize: 10.5 }}>↳ {manageGate.reason}</div>}
        <button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 12, opacity: manageGate.ok && name.trim() && draftStats.cellCount > 0 ? 1 : .5 })} disabled={!manageGate.ok || !name.trim() || draftStats.cellCount === 0} title={!manageGate.ok ? manageGate.reason : !name.trim() ? "Give this audience a name first." : draftStats.cellCount === 0 ? "The current filters do not include any customer cells." : undefined} onClick={saveOrUpdate}>
          {editingId ? "Save changes" : "Save segment"}
        </button>
        {manageGate.ok && (!name.trim() || draftStats.cellCount === 0) && <components_1.DisabledReason>{!name.trim() ? "Give this audience a name before saving it." : "The current filters contain no customers; broaden the segment."}</components_1.DisabledReason>}
        {editingId && <button style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 6 })} onClick={function () { setEditingId(null); setName(""); setFilter({}); }}>Cancel edit</button>}
      </components_1.Panel>

      <components_1.Panel title="Saved Segments" style={{ flex: "1 1 380px" }}>
        {world.savedSegments.length === 0 && <div style={{ color: theme_1.C.faint, fontSize: 13 }}>No saved segments yet.</div>}
        {world.savedSegments.map(function (seg) {
            var _a;
            var st = (0, segments_1.segmentStats)(world, seg.filter);
            var topNeed = Object.entries(st.needPref).sort(function (a, b) { return b[1] - a[1]; })[0];
            return (<div key={seg.id} style={{ marginBottom: 12, padding: 12, background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: theme_1.C.ink, fontWeight: 600 }}>{seg.name}</span>
                <span style={{ color: theme_1.C.dim, fontSize: 11, fontFamily: "ui-monospace" }}>{mapRevealed ? (0, theme_1.fmtMoney)(st.market) : "—"}</span>
              </div>
              <div style={{ color: theme_1.C.faint, fontSize: 11, margin: "3px 0 6px" }}>
                {mapRevealed ? "".concat((0, theme_1.fmtNum)(st.population), " people \u00B7 $").concat(st.avgSpend.toFixed(0), " avg") : "".concat(st.cellCount, " cells")}
                {mapRevealed && topNeed && <> · wants <span style={{ color: theme_1.C.violet }}>{(_a = world.cfg.needs.find(function (n) { return n.key === topNeed[0]; })) === null || _a === void 0 ? void 0 : _a.label}</span></>}
                {mapRevealed && st.playerShareValue > 0 && <> · you capture <span style={{ color: theme_1.C.green }}>{(0, theme_1.fmtMoney)(st.playerShareValue)}</span></>}
              </div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                {Object.entries(seg.filter).filter(function (_a) {
                    var v = _a[1];
                    return v && v.length > 0;
                }).map(function (_a) {
                    var axis = _a[0], vals = _a[1];
                    return (<span key={axis} style={{ background: theme_1.C.panel, border: "1px solid ".concat(theme_1.C.line), borderRadius: 4, padding: "2px 6px", fontSize: 10, color: theme_1.C.dim }}>{vals.join(", ")}</span>);
                })}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1 })} onClick={function () { return startEdit(seg); }}>Edit audience</button>
                <button style={theme_1.ctrlBtn} onClick={function () { return deleteSegment(seg.id); }}>✕</button>
              </div>
            </div>);
        })}
        <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
          Segments define reusable audiences. Choose which one to target later in Product launch or Marketing; audience definition and media decisions stay separate.
        </div>
      </components_1.Panel>
    </div>);
}
var Stat2 = function (_a) {
    var k = _a.k, v = _a.v, _b = _a.color, color = _b === void 0 ? theme_1.C.ink : _b;
    return (<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: theme_1.C.dim }}>{k}</span><span style={{ color: color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>);
};
