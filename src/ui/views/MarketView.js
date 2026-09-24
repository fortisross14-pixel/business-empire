"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketView = MarketView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var visualIdentity_1 = require("../visualIdentity");
var segments_1 = require("../../engine/segments");
var industries_1 = require("../../engine/industries");
function MarketView(_a) {
    var _b, _c;
    var world = _a.world, hist = _a.hist, selectCell = _a.selectCell;
    var tier = world.player.intelDept;
    var _d = (0, react_1.useState)(false), showAdvanced = _d[0], setShowAdvanced = _d[1];
    var intelligenceUnlocked = ((_c = (_b = world.player.research) === null || _b === void 0 ? void 0 : _b.completed) !== null && _c !== void 0 ? _c : []).includes("market_intelligence");
    if (!intelligenceUnlocked) {
        return <components_1.Panel><div style={{ color: theme_1.C.dim, fontSize: 14, lineHeight: 1.6 }}>Structured market intelligence has not been developed yet.</div><div style={{ color: theme_1.C.faint, fontSize: 12, marginTop: 10 }}>Research <b>Market Intelligence</b> from Company → Research. After that, seat Strategy / Intelligence staff to operate the function.</div></components_1.Panel>;
    }
    if (tier === 0) {
        return (<components_1.Panel>
        <div style={{ color: theme_1.C.dim, fontSize: 14, lineHeight: 1.6 }}>
          You have no Market Intelligence department. You can't see the market yet.
        </div>
        <div style={{ color: theme_1.C.faint, fontSize: 12, marginTop: 10 }}>
          Assign Strategy / Intelligence staff to an office on the Campus to unlock market visibility.
        </div>
      </components_1.Panel>);
    }
    var markers = world.events.map(function (e) { return ({ i: hist.findIndex(function (h) { return h.tick >= e.tick; }) }); }).filter(function (m) { return m.i >= 0; });
    return (<>
      <components_1.Panel title="Your Market Share" style={{ marginBottom: 16 }}>
        {world.live && (<div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <SharePill label="Today" value={world.live.overallShare} color={theme_1.C.violet}/>
            <SharePill label="This month" value={world.live.shareMonth} color={theme_1.C.violet}/>
            <SharePill label="This year" value={world.live.shareYear} color={theme_1.C.violet}/>
          </div>)}
        <components_1.LineChart series={[{ data: hist.map(function (h) { return h.share; }), color: theme_1.C.violet }]} fmt={theme_1.fmtPct} markers={markers}/>
        <div style={{ color: theme_1.C.dim, fontSize: 12, marginTop: 6 }}>Daily share spikes when you sell and drops to zero when you're out of stock. Month/year smooth that out — a product that sells out mid-period can still post a strong annual share.</div>
      </components_1.Panel>
      <SegmentOverview world={world}/>
      <components_1.Panel title="Advanced Market Research">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.55, flex: "1 1 320px" }}>
            Your market contains {world.cube.length} detailed customer cells. You normally manage recognizable segments; open the population cube only when you want analyst-level detail.
          </div>
          <button onClick={function () { return setShowAdvanced(function (v) { return !v; }); }} style={{ background: theme_1.C.panel2, color: theme_1.C.ink, border: "1px solid ".concat(theme_1.C.line), borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 600 }}>
            {showAdvanced ? "Hide population cube" : "Open population cube"}
          </button>
        </div>
      </components_1.Panel>
      {showAdvanced && <CubeInspector world={world} selectCell={selectCell}/>}
      <components_1.Panel title="Competitive Landscape" style={{ marginTop: 16 }}>
        <div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 12 }}>Your core rivals by current market setup. These cards are generated from competitor identity + flagship category so the market feels like a real shelf, not anonymous spreadsheets.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
          {world.comps.map(function (comp) { return <visualIdentity_1.CompetitorCard key={comp.id} comp={comp}/>; })}
        </div>
      </components_1.Panel>

    </>);
}
function SegmentOverview(_a) {
    var world = _a.world;
    var revealed = world.revealed.market_map;
    return (<components_1.Panel title="Market Segments">
      <div style={{ color: theme_1.C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 12 }}>
        These are the customer groups you can target in product design and marketing. Create or refine them in Segments; open the population cube only when you need deeper demographic detail.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 9 }}>
        {world.savedSegments.map(function (seg) {
            var st = (0, segments_1.segmentStats)(world, seg.filter);
            var needs = Object.entries(st.needPref).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 2)
                .map(function (_a) {
                var _b;
                var key = _a[0];
                return (_b = world.cfg.needs.find(function (n) { return n.key === key; })) === null || _b === void 0 ? void 0 : _b.label;
            }).filter(Boolean);
            var products = world.player.skus.filter(function (sku) { return sku.targetLabel === seg.name; }).length;
            return (<div key={seg.id} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <b style={{ color: theme_1.C.ink, fontSize: 13 }}>{seg.name}</b>
                {products > 0 && <span style={{ color: theme_1.C.violet, fontSize: 10.5 }}>{products} targeted product{products === 1 ? "" : "s"}</span>}
              </div>
              <div style={{ color: theme_1.C.green, fontFamily: "ui-monospace", fontSize: 16, fontWeight: 700, marginTop: 5 }}>{revealed ? (0, theme_1.fmtMoney)(st.market) : "Research required"}</div>
              {revealed ? (<>
                  <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 2 }}>{(0, theme_1.fmtNum)(st.population)} people · ${st.avgSpend.toFixed(0)} avg spend/year</div>
                  <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 6 }}>Cares most about <span style={{ color: theme_1.C.violet }}>{needs.join(" & ")}</span></div>
                  {st.playerShareValue > 0 && <div style={{ color: theme_1.C.green, fontSize: 10.5, marginTop: 3 }}>Current captured revenue: {(0, theme_1.fmtMoney)(st.playerShareValue)}</div>}
                </>) : <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 5 }}>Run Population Map Scan to reveal size, spend and needs.</div>}
            </div>);
        })}
      </div>
    </components_1.Panel>);
}
function CubeInspector(_a) {
    var world = _a.world, selectCell = _a.selectCell;
    var mapRevealed = world.revealed.market_map;
    var _b = (0, react_1.useState)("Female"), gender = _b[0], setGender = _b[1];
    var _c = (0, react_1.useState)("Neutral"), leaning = _c[0], setLeaning = _c[1];
    var _d = (0, react_1.useState)("Suburban"), geography = _d[0], setGeography = _d[1];
    var _e = (0, react_1.useState)("Family"), family = _e[0], setFamily = _e[1];
    var cellFor = function (age, klass) {
        return world.cube.find(function (c) { return c.coord.gender === gender && c.coord.age === age && c.coord.class === klass && c.coord.leaning === leaning && c.coord.geography === geography && c.coord.family === family; });
    };
    var maxMarket = Math.max.apply(Math, world.cube.map(function (c) { return c.head * c.spend; }));
    var sel = world.selectedCell;
    var info = world.selectedInfo;
    return (<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <components_1.Panel title="Population Cube — click a cell" style={{ flex: "1 1 420px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <components_1.Seg label="Gender" opts={industries_1.AXES.gender} val={gender} set={setGender}/>
          <components_1.Seg label="Leaning" opts={industries_1.AXES.leaning} val={leaning} set={setLeaning}/>
          <components_1.Seg label="Geography" opts={industries_1.AXES.geography} val={geography} set={setGeography}/>
          <components_1.Seg label="Family" opts={industries_1.AXES.family} val={family} set={setFamily}/>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto repeat(".concat(industries_1.AXES.class.length, ", 1fr)"), gap: 4, fontSize: 11 }}>
          <div />{industries_1.AXES.class.map(function (k) { return <div key={k} style={{ color: theme_1.C.dim, textAlign: "center", paddingBottom: 4 }}>{k}</div>; })}
          {industries_1.AXES.age.map(function (age) { return (<react_1.default.Fragment key={age}>
              <div style={{ color: theme_1.C.dim, display: "flex", alignItems: "center", paddingRight: 6 }}>{age}</div>
              {industries_1.AXES.class.map(function (klass) {
                var cell = cellFor(age, klass);
                var market = cell.head * cell.spend;
                var intensity = market / maxMarket;
                var isSel = sel && sel.gender === gender && sel.age === age && sel.class === klass && sel.leaning === leaning && sel.geography === geography && sel.family === family;
                return (<button key={klass} onClick={function () { return selectCell({ gender: gender, age: age, class: klass, leaning: leaning, geography: geography, family: family }); }} style={{ background: "rgba(52,195,255,".concat(0.08 + intensity * 0.5, ")"), border: "1px solid ".concat(isSel ? theme_1.C.cyan : theme_1.C.line), borderRadius: 6, padding: "10px 6px", cursor: "pointer", color: theme_1.C.ink }}>
                    {mapRevealed
                        ? <><div style={{ fontFamily: "ui-monospace", fontSize: 12 }}>{(0, theme_1.fmtMoney)(market)}</div><div style={{ color: theme_1.C.dim, fontSize: 9 }}>{(0, theme_1.fmtNum)(cell.head)} ppl</div></>
                        : <div style={{ color: theme_1.C.faint, fontSize: 16 }}>◌</div>}
                  </button>);
            })}
            </react_1.default.Fragment>); })}
        </div>
        {!mapRevealed && <div style={{ marginTop: 10, color: theme_1.C.faint, fontSize: 12 }}>Cells hidden — run a Population Map Scan in Intelligence to reveal sizes.</div>}
      </components_1.Panel>
      <components_1.Panel title="Cell Detail" style={{ flex: "1 1 280px" }}>
        {!sel ? <div style={{ color: theme_1.C.faint, fontSize: 13 }}>Click a cell to inspect its size, spend, and who they currently buy.</div> :
            <div>
            <div style={{ color: theme_1.C.cyan, fontWeight: 600, marginBottom: 8 }}>{sel.age} · {sel.gender} · {sel.class} · {sel.geography} · {sel.family} · {sel.leaning}</div>
            {info && <>
              <Detail k="Headcount" v={(0, theme_1.fmtNum)(info.head) + " people"}/>
              <Detail k="Avg annual spend" v={"$" + info.spend.toFixed(0)}/>
              <Detail k="Cell market" v={(0, theme_1.fmtMoney)(info.market)} color={theme_1.C.green}/>
              {world.revealed.market_map && (<div style={{ marginTop: 8 }}>
                  <div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 4 }}>What they want</div>
                  {topNeeds(world, sel).map(function (n, i) { return (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                      <span style={{ color: theme_1.C.ink }}>{n.label}</span>
                      <div style={{ flex: 1, margin: "0 8px", alignSelf: "center", height: 5, background: theme_1.C.grid, borderRadius: 3 }}>
                        <div style={{ width: "".concat(n.value * 100, "%"), height: "100%", background: theme_1.C.violet, borderRadius: 3 }}/>
                      </div>
                      <span style={{ fontFamily: "ui-monospace", color: theme_1.C.dim, fontSize: 11 }}>{(n.value * 100).toFixed(0)}</span>
                    </div>); })}
                </div>)}
              <div style={{ margin: "12px 0 6px", color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6 }}>Who they buy</div>
              {info.breakdown.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 12 }}>Largely unserved — a potential niche.</div> :
                        info.breakdown.map(function (b, i) { return (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ color: b.isComp ? theme_1.C.dim : theme_1.C.violet }}>{b.name}{b.isComp ? "" : " (you)"}</span>
                    <span style={{ fontFamily: "ui-monospace", color: theme_1.C.ink }}>{(0, theme_1.fmtPct)(b.share)}</span>
                  </div>); })}
              {info.breakdown.filter(function (b) { return !b.isComp; }).length === 0 && info.breakdown.length > 0 &&
                        <div style={{ marginTop: 8, color: theme_1.C.amber, fontSize: 11 }}>You don't serve this cell. Big market + weak rival fit = your gap.</div>}
            </>}
          </div>}
      </components_1.Panel>
    </div>);
}
var Detail = function (_a) {
    var k = _a.k, v = _a.v, _b = _a.color, color = _b === void 0 ? theme_1.C.ink : _b;
    return (<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
    <span style={{ color: theme_1.C.dim }}>{k}</span><span style={{ color: color, fontFamily: "ui-monospace", fontWeight: 600 }}>{v}</span>
  </div>);
};
function topNeeds(world, coord) {
    var cell = world.cube.find(function (c) { return c.coord.gender === coord.gender && c.coord.age === coord.age && c.coord.class === coord.class && c.coord.leaning === coord.leaning && c.coord.geography === coord.geography && c.coord.family === coord.family; });
    if (!cell)
        return [];
    return world.cfg.needs.map(function (n) { var _a; return ({ label: n.label, value: (_a = cell.needPref[n.key]) !== null && _a !== void 0 ? _a : 0 }); })
        .sort(function (a, b) { return b.value - a.value; }).slice(0, 4);
}
function SharePill(_a) {
    var label = _a.label, value = _a.value, color = _a.color;
    return (<div style={{ flex: "1 1 90px", background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ color: theme_1.C.dim, fontSize: 11 }}>{label}</div>
      <div style={{ color: color, fontSize: 20, fontWeight: 700, fontFamily: "ui-monospace" }}>{(0, theme_1.fmtPct)(value)}</div>
    </div>);
}
