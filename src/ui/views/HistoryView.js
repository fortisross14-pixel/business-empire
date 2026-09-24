"use strict";
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
exports.HistoryView = HistoryView;
var react_1 = require("react");
var chronicle_1 = require("../../engine/chronicle");
var theme_1 = require("../theme");
var components_1 = require("../components");
var productCatalog_1 = require("../../engine/productCatalog");
var ip_1 = require("../../engine/ip");
var kindLabel = {
    founding: "Founding", product: "Product", people: "People", operations: "Operations",
    finance: "Finance", market: "Market", milestone: "Milestone", annual: "Annual review",
};
var importanceLabel = function (v) { return v === 3 ? "ICONIC" : v === 2 ? "MAJOR" : "NOTABLE"; };
var importanceColor = function (v) { return v === 3 ? theme_1.C.amber : v === 2 ? theme_1.C.violet : theme_1.C.faint; };
var yearOfTick = function (tick) { return Math.floor(Math.max(0, tick - 1) / 360) + 1; };
var monthOfTick = function (tick) { return Math.floor((Math.max(1, tick) - 1) / 30) % 12 + 1; };
function Empty(_a) {
    var children = _a.children;
    return <div style={{ color: theme_1.C.faint, fontSize: 12.5, padding: "12px 0" }}>{children}</div>;
}
function HistoryView(_a) {
    var world = _a.world, mode = _a.mode;
    if (mode === "annual")
        return <AnnualReviews world={world}/>;
    if (mode === "records")
        return <RecordsView world={world}/>;
    return <ChronicleTimeline world={world}/>;
}
function ChronicleTimeline(_a) {
    var _b, _c;
    var world = _a.world;
    var _d = (0, react_1.useState)("major"), filter = _d[0], setFilter = _d[1];
    var all = __spreadArray([], ((_c = (_b = world.chronicle) === null || _b === void 0 ? void 0 : _b.entries) !== null && _c !== void 0 ? _c : []), true).sort(function (a, b) { return b.tick - a.tick || b.importance - a.importance; });
    var entries = all.filter(function (e) { return filter === "all" || (filter === "major" ? e.importance >= 2 : e.importance >= 3); });
    var groups = (0, react_1.useMemo)(function () {
        var _a;
        var out = [];
        var _loop_1 = function (e) {
            var y = (_a = e.year) !== null && _a !== void 0 ? _a : yearOfTick(e.tick);
            var g = out.find(function (x) { return x.year === y; });
            if (!g) {
                g = { year: y, entries: [] };
                out.push(g);
            }
            g.entries.push(e);
        };
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var e = entries_1[_i];
            _loop_1(e);
        }
        return out.sort(function (a, b) { return b.year - a.year; });
    }, [entries]);
    var iconic = all.filter(function (e) { return e.importance === 3; }).length;
    var launches = all.filter(function (e) { var _a; return (_a = e.tags) === null || _a === void 0 ? void 0 : _a.includes("launch"); }).length;
    return <div>
    <components_1.Panel title="📚 Company Chronicle">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, alignItems: "stretch" }}>
        <div style={{ color: theme_1.C.dim, fontSize: 13, lineHeight: 1.65, gridColumn: "1 / -1" }}>
          This is the permanent memory of <b style={{ color: theme_1.C.ink }}>{world.company}</b>. Routine alerts disappear; launches, people, milestones and turning points stay here for the life of the save.
        </div>
        <MiniStat label="Years played" value={"".concat(Math.floor(world.tick / 360) + 1)}/>
        <MiniStat label="Product launches" value={"".concat(launches)}/>
        <MiniStat label="Iconic moments" value={"".concat(iconic)} accent/>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {["major", "iconic", "all"].map(function (f) { return <button key={f} onClick={function () { return setFilter(f); }} style={{ background: filter === f ? theme_1.C.violet : theme_1.C.panel2, color: filter === f ? "#fff" : theme_1.C.dim, border: "1px solid ".concat(filter === f ? theme_1.C.violet : theme_1.C.line), borderRadius: 99, padding: "5px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{f === "major" ? "Major + iconic" : f}</button>; })}
      </div>
    </components_1.Panel>

    {groups.length === 0 ? <components_1.Panel title="Timeline"><Empty>No permanent history at this filter level yet. The company is still writing its first chapter.</Empty></components_1.Panel> : groups.map(function (group) { return <div key={group.year} style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 2px 9px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", background: "#ede9fe", border: "1px solid #ddd6fe", color: theme_1.C.violet, fontWeight: 900, fontSize: 12 }}>Y{group.year}</div>
        <div style={{ height: 1, background: theme_1.C.line, flex: 1 }}/>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {group.entries.map(function (e) { return <ChronicleCard key={e.id} entry={e}/>; })}
      </div>
    </div>; })}
  </div>;
}
function ChronicleCard(_a) {
    var _b;
    var e = _a.entry;
    var color = importanceColor(e.importance);
    return <div style={{ background: theme_1.C.panel, border: "1px solid ".concat(e.importance === 3 ? "#fcd34d" : theme_1.C.line), borderLeft: "4px solid ".concat(color), borderRadius: 11, padding: "11px 13px", display: "grid", gridTemplateColumns: "42px minmax(0,1fr) auto", gap: 10, alignItems: "start", boxShadow: e.importance === 3 ? "0 2px 12px rgba(245,158,11,.10)" : "0 1px 3px rgba(30,27,46,.03)" }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: theme_1.C.panel2, display: "grid", placeItems: "center", fontSize: 19 }}>{e.icon}</div>
    <div>
      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}><b style={{ color: theme_1.C.ink, fontSize: 13 }}>{e.title}</b><span style={{ color: color, border: "1px solid ".concat(color, "55"), background: "".concat(color, "12"), borderRadius: 99, padding: "2px 5px", fontSize: 8.5, fontWeight: 900 }}>{importanceLabel(e.importance)}</span></div>
      <div style={{ color: theme_1.C.dim, fontSize: 11.5, marginTop: 3, lineHeight: 1.5 }}>{e.text}</div>
    </div>
    <div style={{ textAlign: "right", color: theme_1.C.faint, fontSize: 9.5, whiteSpace: "nowrap" }}>Y{yearOfTick(e.tick)} · M{monthOfTick(e.tick)}<br />{(_b = kindLabel[e.kind]) !== null && _b !== void 0 ? _b : e.kind}</div>
  </div>;
}
function AnnualReviews(_a) {
    var _b, _c, _d, _e, _f, _g;
    var world = _a.world;
    var reviews = __spreadArray([], ((_c = (_b = world.chronicle) === null || _b === void 0 ? void 0 : _b.annualReviews) !== null && _c !== void 0 ? _c : []), true).sort(function (a, b) { return b.year - a.year; });
    var _h = (0, react_1.useState)((_e = (_d = reviews[0]) === null || _d === void 0 ? void 0 : _d.year) !== null && _e !== void 0 ? _e : null), selectedYear = _h[0], setSelectedYear = _h[1];
    var selected = (_f = reviews.find(function (r) { return r.year === selectedYear; })) !== null && _f !== void 0 ? _f : reviews[0];
    var acc = (_g = world.chronicle) === null || _g === void 0 ? void 0 : _g.yearAccumulator;
    return <div>
    <components_1.Panel title="📘 Annual Reviews">
      <div style={{ color: theme_1.C.dim, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>Every completed year becomes a permanent snapshot of the company: realized revenue and profit, launches, people changes, market position and the moments that defined the year.</div>
      {reviews.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{reviews.map(function (r) { return <button key={r.year} onClick={function () { return setSelectedYear(r.year); }} style={{ background: (selected === null || selected === void 0 ? void 0 : selected.year) === r.year ? theme_1.C.violet : theme_1.C.panel2, color: (selected === null || selected === void 0 ? void 0 : selected.year) === r.year ? "#fff" : theme_1.C.dim, border: "1px solid ".concat((selected === null || selected === void 0 ? void 0 : selected.year) === r.year ? theme_1.C.violet : theme_1.C.line), borderRadius: 7, padding: "5px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Year {r.year}</button>; })}</div>}
    </components_1.Panel>

    {selected ? <AnnualReviewCard world={world} review={selected}/> : <components_1.Panel title="First review pending"><Empty>Year 1 is still in progress. The first annual review closes after 360 simulated days.</Empty></components_1.Panel>}

    {acc && <components_1.Panel title={"Year ".concat(acc.year, " \u2014 Live Preview")}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9 }}>
        <ReviewMetric label="Revenue so far" value={(0, theme_1.fmtMoney)(acc.revenue)}/>
        <ReviewMetric label="Profit so far" value={(0, theme_1.fmtMoney)(acc.profit)} tone={acc.profit >= 0 ? theme_1.C.green : theme_1.C.red}/>
        <ReviewMetric label="Units" value={(0, theme_1.fmtNum)(acc.units)}/>
        <ReviewMetric label="Peak share" value={(0, theme_1.fmtPct)(acc.peakShare)}/>
        <ReviewMetric label="Cash" value={(0, theme_1.fmtMoney)(world.player.cash)} tone={world.player.cash >= 0 ? theme_1.C.ink : theme_1.C.red}/>
      </div>
      <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 9 }}>Live figures accumulate realized daily results; they become immutable when the year closes.</div>
    </components_1.Panel>}
  </div>;
}
function AnnualReviewCard(_a) {
    var _b, _c;
    var world = _a.world, r = _a.review;
    var entries = ((_c = (_b = world.chronicle) === null || _b === void 0 ? void 0 : _b.entries) !== null && _c !== void 0 ? _c : []).filter(function (e) { return r.highlightEntryIds.includes(e.id); });
    return <div>
    <components_1.Panel title={"Year ".concat(r.year, " \u2014 ").concat(world.company)}>
      <div style={{ fontSize: 17, fontWeight: 850, color: theme_1.C.ink, lineHeight: 1.35 }}>{r.headline}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 9, marginTop: 14 }}>
        <ReviewMetric label="Revenue" value={(0, theme_1.fmtMoney)(r.revenue)}/>
        <ReviewMetric label="Profit" value={(0, theme_1.fmtMoney)(r.profit)} tone={r.profit >= 0 ? theme_1.C.green : theme_1.C.red}/>
        <ReviewMetric label="Units sold" value={(0, theme_1.fmtNum)(r.units)}/>
        <ReviewMetric label="Peak share" value={(0, theme_1.fmtPct)(r.peakShare)}/>
        <ReviewMetric label="Year-end cash" value={(0, theme_1.fmtMoney)(r.endCash)} tone={r.endCash >= 0 ? theme_1.C.ink : theme_1.C.red}/>
        <ReviewMetric label="Named staff" value={"".concat(r.endingEmployees)}/>
      </div>
    </components_1.Panel>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
      <components_1.Panel title="Portfolio & People">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 12 }}><MiniStat label="Hires" value={"".concat(r.hires)}/><MiniStat label="Promotions" value={"".concat(r.promotions)}/><MiniStat label="Departures" value={"".concat(r.departures)}/></div>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>Products launched</div>
        {r.productsLaunched.length ? <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{r.productsLaunched.map(function (p) { return <span key={p} style={{ padding: "4px 7px", borderRadius: 99, background: "#ede9fe", border: "1px solid #ddd6fe", color: theme_1.C.violet, fontSize: 10, fontWeight: 700 }}>{p}</span>; })}</div> : <Empty>No product launches this year.</Empty>}
      </components_1.Panel>
      <components_1.Panel title="Defining Moments">
        {entries.length ? entries.map(function (e) { return <div key={e.id} style={{ padding: "7px 0", borderBottom: "1px solid ".concat(theme_1.C.grid), display: "flex", gap: 8 }}><span>{e.icon}</span><div><div style={{ fontSize: 11.5, fontWeight: 700 }}>{e.title}</div><div style={{ color: theme_1.C.faint, fontSize: 10 }}>{e.text}</div></div></div>; }) : <Empty>A quieter year: no major or iconic moments were recorded.</Empty>}
      </components_1.Panel>
    </div>
  </div>;
}
function RecordsView(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    var world = _a.world;
    var records = (0, chronicle_1.chronicleRecords)(world);
    var iconic = __spreadArray([], ((_c = (_b = world.chronicle) === null || _b === void 0 ? void 0 : _b.entries) !== null && _c !== void 0 ? _c : []), true).filter(function (e) { return e.importance === 3; }).sort(function (a, b) { return b.tick - a.tick; });
    var launched = __spreadArray([], world.player.skus, true).filter(function (s) { return s.launchTick > 0; }).sort(function (a, b) { return b.unitsSoldTotal - a.unitsSoldTotal; });
    var ownedIPs = __spreadArray([], ((_d = world.ipAssets) !== null && _d !== void 0 ? _d : []), true).filter(function (ip) { return ip.ownerType === "player"; }).sort(function (a, b) { return (0, ip_1.estimateIPValue)(b) - (0, ip_1.estimateIPValue)(a); });
    var topIP = ownedIPs[0];
    return <div>
    <components_1.Panel title="🏆 Company Records">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 9 }}>
        <RecordCard label="Best-selling product" value={(_f = (_e = records.topUnits) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : "—"} detail={records.topUnits ? "".concat((0, theme_1.fmtNum)(records.topUnits.unitsSoldTotal), " lifetime units") : "No launch yet"}/>
        <RecordCard label="Highest product contribution" value={(_h = (_g = records.topContribution) === null || _g === void 0 ? void 0 : _g.name) !== null && _h !== void 0 ? _h : "—"} detail={records.topContribution ? (0, theme_1.fmtMoney)((_j = records.topContribution.contributionTotal) !== null && _j !== void 0 ? _j : 0) : "No launch yet"}/>
        <RecordCard label="Longest-running product" value={(_l = (_k = records.longestProduct) === null || _k === void 0 ? void 0 : _k.name) !== null && _l !== void 0 ? _l : "—"} detail={records.longestProduct ? "".concat(Math.max(0, Math.floor((world.tick - records.longestProduct.launchTick) / 30)), " months") : "No launch yet"}/>
        <RecordCard label="Best revenue year" value={records.bestRevenueYear ? "Year ".concat(records.bestRevenueYear.year) : "—"} detail={records.bestRevenueYear ? (0, theme_1.fmtMoney)(records.bestRevenueYear.revenue) : "First year still open"}/>
        <RecordCard label="Best profit year" value={records.bestProfitYear ? "Year ".concat(records.bestProfitYear.year) : "—"} detail={records.bestProfitYear ? (0, theme_1.fmtMoney)(records.bestProfitYear.profit) : "First year still open"}/>
        <RecordCard label="Highest annual share" value={records.bestShareYear ? "Year ".concat(records.bestShareYear.year) : "—"} detail={records.bestShareYear ? (0, theme_1.fmtPct)(records.bestShareYear.peakShare) : "First year still open"}/>
        <RecordCard label="Toughest year" value={records.worstProfitYear ? "Year ".concat(records.worstProfitYear.year) : "—"} detail={records.worstProfitYear ? "".concat(records.worstProfitYear.profit >= 0 ? "Lowest profit " : "Loss ").concat((0, theme_1.fmtMoney)(records.worstProfitYear.profit)) : "First year still open"}/>
        <RecordCard label="Longest-serving leader" value={(_o = (_m = records.longestPerson) === null || _m === void 0 ? void 0 : _m.name) !== null && _o !== void 0 ? _o : "—"} detail={records.longestPerson ? records.longestPerson.title : "No staff history yet"}/>
        <RecordCard label="Most impactful PM" value={(_q = (_p = records.topPm) === null || _p === void 0 ? void 0 : _p.p.name) !== null && _q !== void 0 ? _q : "—"} detail={records.topPm ? "".concat((0, theme_1.fmtNum)(records.topPm.units), " units across products led") : "No PM product history yet"}/>
        <RecordCard label="Most valuable owned IP" value={(_r = topIP === null || topIP === void 0 ? void 0 : topIP.name) !== null && _r !== void 0 ? _r : "—"} detail={topIP ? "".concat((0, theme_1.fmtMoney)((0, ip_1.estimateIPValue)(topIP)), " estimated asset value") : "No original IP yet"}/>
      </div>
    </components_1.Panel>

    <components_1.Panel title="✨ Iconic Moments">
      {iconic.length === 0 ? <Empty>Iconic moments are deliberately rare. The Chronicle will surface true turning points rather than manufacture one every quarter.</Empty> : iconic.map(function (e) { return <ChronicleCard key={e.id} entry={e}/>; })}
    </components_1.Panel>

    <components_1.Panel title="Product Legacy">
      {launched.length === 0 ? <Empty>No launched products yet.</Empty> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760, fontSize: 11.5 }}>
        <thead><tr style={{ color: theme_1.C.faint, textAlign: "left" }}><th style={{ padding: "7px 5px" }}>Product</th><th>Launched</th><th>Legacy</th><th>Lifetime units</th><th>Contribution</th><th>Lead lineage</th></tr></thead>
        <tbody>{launched.map(function (sku) {
                var _a, _b, _c, _d, _e;
                var tags = (0, chronicle_1.productLegacyTags)(world, sku);
                var leads = __spreadArray([], new Set(((_a = sku.leadHistory) !== null && _a !== void 0 ? _a : []).map(function (h) { return h.personName; })), true);
                return <tr key={sku.id} style={{ borderTop: "1px solid ".concat(theme_1.C.grid) }}>
            <td style={{ padding: "9px 5px" }}><b>{sku.name}</b><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{(_c = (_b = (0, productCatalog_1.archetypeByKey)(sku.productKey)) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : sku.productKey}</div></td>
            <td>Y{yearOfTick(sku.launchTick)} · M{monthOfTick(sku.launchTick)}</td>
            <td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{tags.map(function (t) { return <span key={t} style={{ padding: "2px 5px", borderRadius: 99, border: "1px solid ".concat(t === "Breakthrough" || t === "Blockbuster" ? "#fcd34d" : theme_1.C.line), background: t === "Breakthrough" || t === "Blockbuster" ? "#fffbeb" : theme_1.C.panel2, color: t === "Breakthrough" || t === "Blockbuster" ? "#92400e" : theme_1.C.dim, fontSize: 9 }}>{t}</span>; })}</div></td>
            <td>{(0, theme_1.fmtNum)(sku.unitsSoldTotal)}</td><td style={{ color: ((_d = sku.contributionTotal) !== null && _d !== void 0 ? _d : 0) >= 0 ? theme_1.C.green : theme_1.C.red }}>{(0, theme_1.fmtMoney)((_e = sku.contributionTotal) !== null && _e !== void 0 ? _e : 0)}</td><td style={{ color: theme_1.C.dim }}>{leads.join(" → ") || sku.assignedPmName || "—"}</td>
          </tr>;
            })}</tbody>
      </table></div>}
    </components_1.Panel>
  </div>;
}
function MiniStat(_a) {
    var label = _a.label, value = _a.value, _b = _a.accent, accent = _b === void 0 ? false : _b;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: "9px 10px" }}><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: accent ? theme_1.C.amber : theme_1.C.ink, fontWeight: 850, fontSize: 15, marginTop: 2 }}>{value}</div></div>;
}
function ReviewMetric(_a) {
    var label = _a.label, value = _a.value, _b = _a.tone, tone = _b === void 0 ? theme_1.C.ink : _b;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: "10px 11px" }}><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: tone, fontWeight: 850, fontSize: 15, marginTop: 2 }}>{value}</div></div>;
}
function RecordCard(_a) {
    var label = _a.label, value = _a.value, detail = _a.detail;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, padding: 11 }}><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: theme_1.C.ink, fontWeight: 800, fontSize: 13, marginTop: 3 }}>{value}</div><div style={{ color: theme_1.C.violet, fontSize: 10, marginTop: 3 }}>{detail}</div></div>;
}
