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
exports.IPView = IPView;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var industries_1 = require("../../engine/industries");
var ip_1 = require("../../engine/ip");
var productCatalog_1 = require("../../engine/productCatalog");
var visualIdentity_1 = require("../visualIdentity");
var people_1 = require("../../engine/people");
function IPView(_a) {
    var world = _a.world, createIP = _a.createIP, licenseIP = _a.licenseIP;
    var owned = world.ipAssets.filter(function (ip) { return ip.ownerType === "player"; });
    var licensed = world.ipAssets.filter(function (ip) { return ip.ownerType === "external" && Boolean((0, ip_1.activeIPContract)(world, ip.id)); });
    var market = world.ipAssets.filter(function (ip) { return ip.ownerType === "external"; });
    var portfolioValue = (0, ip_1.companyIPPortfolioValue)(world);
    var companyValue = (0, ip_1.estimatedCompanyValue)(world);
    return <div>
    <components_1.Panel title="🎬 Universal IP & Licensing">
      <div style={{ color: theme_1.C.dim, fontSize: 13, lineHeight: 1.65, maxWidth: 960 }}>
        IP is separate from the brand on the box. The same property can travel across compatible products and industries, while brand reputation and IP popularity remain distinct.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
        <MiniStat label="Owned IP" value={String(owned.length)}/>
        <MiniStat label="Active licenses" value={String(licensed.length)}/>
        <MiniStat label="Owned IP value" value={(0, theme_1.fmtMoney)(portfolioValue)} accent/>
        <MiniStat label="Royalty exposure / yr" value={(0, theme_1.fmtMoney)((0, ip_1.annualizedRoyaltyExposure)(world))}/>
        <MiniStat label="Est. company value" value={(0, theme_1.fmtMoney)(companyValue)} accent/>
      </div>
    </components_1.Panel>

    <OriginalIPCreator world={world} createIP={createIP}/>

    <components_1.Panel title="Your IP Portfolio">
      {owned.length === 0 && licensed.length === 0 ? <Empty>No IP assets or licenses yet. Create an original property or license one from the market below.</Empty> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {owned.map(function (ip) { return <IPCard key={ip.id} world={world} ip={ip} owned/>; })}
        {licensed.map(function (ip) { return <IPCard key={ip.id} world={world} ip={ip}/>; })}
      </div>
    </components_1.Panel>

    <components_1.Panel title="Licensing Market">
      <div style={{ color: theme_1.C.dim, fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
        Licenses use standardized 2-, 3- or 5-year deals with an upfront minimum guarantee and a royalty on net licensed-product revenue. Strong properties can accelerate demand, but only when the audience and product fit.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 12 }}>
        {market.map(function (ip) { return <LicenseOffer key={ip.id} world={world} ip={ip} onLicense={licenseIP}/>; })}
      </div>
    </components_1.Panel>
  </div>;
}
function OriginalIPCreator(_a) {
    var _b;
    var world = _a.world, createIP = _a.createIP;
    var families = (0, react_1.useMemo)(function () { return (0, ip_1.availableIPProductFamilies)(); }, []);
    var _c = (0, react_1.useState)(""), name = _c[0], setName = _c[1];
    var _d = (0, react_1.useState)(ip_1.IP_AUDIENCE_PRESETS[0].id), audience = _d[0], setAudience = _d[1];
    var _e = (0, react_1.useState)(function () { return families.filter(function (f) { return f.industryId === "toys"; }).slice(0, 3).map(function (f) { return f.key; }); }), selected = _e[0], setSelected = _e[1];
    var _f = (0, react_1.useState)(null), message = _f[0], setMessage = _f[1];
    var marketingReady = (0, people_1.teamEffectiveness)(world, "marketing") > 0;
    var grouped = (0, react_1.useMemo)(function () {
        var _a;
        var _b;
        var map = {};
        for (var _i = 0, families_1 = families; _i < families_1.length; _i++) {
            var family = families_1[_i];
            ((_a = map[_b = family.industryId]) !== null && _a !== void 0 ? _a : (map[_b] = [])).push(family);
        }
        return map;
    }, [families]);
    var toggle = function (key) { return setSelected(function (cur) { return cur.includes(key) ? cur.filter(function (x) { return x !== key; }) : __spreadArray(__spreadArray([], cur, true), [key], false); }); };
    var submit = function () {
        var _a;
        var result = createIP(name, audience, selected);
        if (!result.ok) {
            setMessage((_a = result.reason) !== null && _a !== void 0 ? _a : "Could not create IP.");
            return;
        }
        setName("");
        setMessage("Original IP created. Its value starts low; products, audience fit and commercial success must build it.");
    };
    return <components_1.Panel title="✨ Create Original IP">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
      <div>
        <components_1.FieldLabel>Property name</components_1.FieldLabel>
        <components_1.TextInput value={name} placeholder="e.g. Galaxy Knights" onChange={function (e) { return setName(e.target.value); }}/>
        <div style={{ height: 10 }}/>
        <components_1.FieldLabel>Core audience</components_1.FieldLabel>
        <components_1.SelectInput value={audience} onChange={setAudience}>
          {ip_1.IP_AUDIENCE_PRESETS.map(function (p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
        </components_1.SelectInput>
        <div style={{ color: theme_1.C.faint, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{(_b = ip_1.IP_AUDIENCE_PRESETS.find(function (p) { return p.id === audience; })) === null || _b === void 0 ? void 0 : _b.description}</div>
        <div style={{ marginTop: 12, padding: 10, border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, background: theme_1.C.panel2 }}>
          <div style={{ color: theme_1.C.dim, fontSize: 10.5 }}>Development investment</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: world.player.cash >= ip_1.ORIGINAL_IP_CREATION_COST ? theme_1.C.ink : theme_1.C.red }}>{(0, theme_1.fmtMoney)(ip_1.ORIGINAL_IP_CREATION_COST)}</div>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5 }}>Original IP starts with ~zero awareness and must earn its status.</div>
        </div>
      </div>
      <div>
        <components_1.FieldLabel>Compatible product families</components_1.FieldLabel>
        <div style={{ color: theme_1.C.faint, fontSize: 10.5, marginBottom: 8 }}>Choose the product families where this property has permission to appear. A broad IP can travel across industries; a narrow one may be much stronger in only a few categories.</div>
        {Object.entries(grouped).map(function (_a) {
            var _b, _c;
            var industryId = _a[0], rows = _a[1];
            return <div key={industryId} style={{ marginBottom: 10 }}>
          <div style={{ color: theme_1.C.dim, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .6, marginBottom: 5 }}>{(_c = (_b = industries_1.INDUSTRIES[industryId]) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : industryId}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rows.map(function (f) {
                    var on = selected.includes(f.key);
                    return <button key={f.key} onClick={function () { return toggle(f.key); }} style={__assign(__assign({}, theme_1.ctrlBtn), { borderColor: on ? theme_1.C.violet : theme_1.C.line, color: on ? theme_1.C.violet : theme_1.C.dim, background: on ? theme_1.C.panel2 : theme_1.C.panel })}>
                {on ? "✓ " : ""}{f.label} <span style={{ color: theme_1.C.faint }}>IP {Math.round(f.ipPotential * 100)}</span>
              </button>;
                })}
          </div>
        </div>;
        })}
      </div>
    </div>
    {message && <div style={{ color: message.startsWith("Original") ? theme_1.C.green : theme_1.C.amber, fontSize: 11.5, marginTop: 10 }}>{message}</div>}
    <button disabled={!marketingReady || !name.trim() || selected.length === 0 || world.player.cash < ip_1.ORIGINAL_IP_CREATION_COST} title={!marketingReady ? "Seat a Marketing specialist before developing original consumer IP." : !name.trim() ? "Name the IP first." : selected.length === 0 ? "Choose at least one compatible product family." : world.player.cash < ip_1.ORIGINAL_IP_CREATION_COST ? "Need ".concat((0, theme_1.fmtMoney)(ip_1.ORIGINAL_IP_CREATION_COST - world.player.cash), " more cash.") : undefined} onClick={submit} style={__assign(__assign({}, theme_1.bigBtn), { marginTop: 12, opacity: marketingReady && name.trim() && selected.length > 0 && world.player.cash >= ip_1.ORIGINAL_IP_CREATION_COST ? 1 : .45 })}>Create IP</button>
    {(!marketingReady || !name.trim() || selected.length === 0 || world.player.cash < ip_1.ORIGINAL_IP_CREATION_COST) && <components_1.DisabledReason>{!marketingReady ? "Seat a Marketing specialist before developing an original consumer IP." : !name.trim() ? "Name the IP before creating it." : selected.length === 0 ? "Select at least one compatible product family." : "You need ".concat((0, theme_1.fmtMoney)(ip_1.ORIGINAL_IP_CREATION_COST - world.player.cash), " more cash for development.")}</components_1.DisabledReason>}
  </components_1.Panel>;
}
function IPCard(_a) {
    var world = _a.world, ip = _a.ip, _b = _a.owned, owned = _b === void 0 ? false : _b;
    var contract = (0, ip_1.activeIPContract)(world, ip.id);
    var attached = world.player.skus.filter(function (sku) { return sku.ipId === ip.id; });
    var value = (0, ip_1.estimateIPValue)(ip);
    return <div style={{ border: "1px solid ".concat(owned ? theme_1.C.violet : theme_1.C.line), background: theme_1.C.panel2, borderRadius: 10, padding: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><visualIdentity_1.IPBadge ip={ip}/><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 4 }}>{owned ? "Owned by ".concat(world.company) : "Licensed from ".concat(ip.ownerName)}</div></div>
      <span style={{ fontSize: 10, border: "1px solid ".concat(owned ? theme_1.C.violet : theme_1.C.cyan), color: owned ? theme_1.C.violet : theme_1.C.cyan, borderRadius: 99, padding: "3px 7px", height: "fit-content" }}>{owned ? "OWNED" : "LICENSED"}</span>
    </div>
    <IPMetrics ip={ip}/>
    <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 8 }}>Audience: <b style={{ color: theme_1.C.ink }}>{ip.audienceLabel}</b></div>
    <div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 3 }}>Compatible: {familyLabels(ip.compatibleProductFamilies).slice(0, 7).join(" · ")}{ip.compatibleProductFamilies.length > 7 ? " · …" : ""}</div>
    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 10.5 }}>
      <span>{attached.length} attached product{attached.length === 1 ? "" : "s"}</span>
      <span>{(0, theme_1.fmtNum)(ip.lifetimeUnits)} units</span>
      <span>{(0, theme_1.fmtMoney)(ip.lifetimeProductRevenue)} linked revenue</span>
    </div>
    {owned && <div style={{ marginTop: 8, color: theme_1.C.amber, fontSize: 11, fontWeight: 700 }}>Estimated IP asset value: {(0, theme_1.fmtMoney)(value)}</div>}
    {contract && <div style={{ marginTop: 8, color: theme_1.C.cyan, fontSize: 10.5 }}>{(contract.royaltyRate * 100).toFixed(1)}% royalty · {(0, ip_1.daysUntilIPExpiry)(world, contract)} days left · royalties paid {(0, theme_1.fmtMoney)(contract.royaltiesPaid)}</div>}
  </div>;
}
function LicenseOffer(_a) {
    var _b, _c;
    var world = _a.world, ip = _a.ip, onLicense = _a.onLicense;
    var active = (0, ip_1.activeIPContract)(world, ip.id);
    var _d = (0, react_1.useState)(3), years = _d[0], setYears = _d[1];
    var _e = (0, react_1.useState)(null), message = _e[0], setMessage = _e[1];
    var terms = (0, ip_1.contractTerms)(ip, years);
    var strength = (0, ip_1.ipCommercialStrength)(ip);
    var commercialOwner = (0, people_1.teamEffectiveness)(world, "strategy") > 0 || (0, people_1.teamEffectiveness)(world, "marketing") > 0;
    var sign = function () {
        var _a;
        var result = onLicense(ip.id, years);
        setMessage(result.ok ? "".concat(ip.name, " licensed.") : (_a = result.reason) !== null && _a !== void 0 ? _a : "Could not sign license.");
    };
    return <div style={{ border: "1px solid ".concat(active ? theme_1.C.cyan : theme_1.C.line), borderRadius: 10, padding: 13, background: active ? theme_1.C.panel2 : theme_1.C.panel }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <div><visualIdentity_1.IPBadge ip={ip}/><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 4 }}>{ip.ownerName} · {ip.audienceLabel}</div></div>
      <span style={{ color: strength > .85 ? theme_1.C.green : strength > .5 ? theme_1.C.amber : theme_1.C.faint, fontSize: 10.5, fontWeight: 700 }}>{strength > 1.05 ? "HOT" : strength > .72 ? "ESTABLISHED" : "NICHE"}</span>
    </div>
    <IPMetrics ip={ip}/>
    <div style={{ color: theme_1.C.dim, fontSize: 10.5, lineHeight: 1.45, marginTop: 8 }}>Best fits: {familyLabels(ip.compatibleProductFamilies).slice(0, 8).join(" · ")}{ip.compatibleProductFamilies.length > 8 ? " · …" : ""}</div>
    {active ? <div style={{ marginTop: 10, color: theme_1.C.cyan, fontSize: 11.5, fontWeight: 700 }}>✓ Active license · {(0, ip_1.daysUntilIPExpiry)(world, active)} days remaining</div> : terms ? <>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {((_c = (_b = ip.marketTerms) === null || _b === void 0 ? void 0 : _b.durationsYears) !== null && _c !== void 0 ? _c : [3]).map(function (y) { return <button key={y} onClick={function () { return setYears(y); }} style={__assign(__assign({}, theme_1.ctrlBtn), { flex: 1, borderColor: years === y ? theme_1.C.violet : theme_1.C.line, color: years === y ? theme_1.C.violet : theme_1.C.dim })}>{y} yr</button>; })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 9 }}>
        <Term label="Minimum guarantee" value={(0, theme_1.fmtMoney)(terms.minimumGuarantee)}/>
        <Term label="Royalty" value={"".concat((terms.royaltyRate * 100).toFixed(1), "% net sales")}/>
      </div>
      <button disabled={!commercialOwner || world.player.cash < terms.minimumGuarantee} title={!commercialOwner ? "Seat a Strategy or Marketing specialist before negotiating external IP licenses." : world.player.cash < terms.minimumGuarantee ? "Need ".concat((0, theme_1.fmtMoney)(terms.minimumGuarantee - world.player.cash), " more cash for the minimum guarantee.") : undefined} onClick={sign} style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 10, fontSize: 12, opacity: commercialOwner && world.player.cash >= terms.minimumGuarantee ? 1 : .45 })}>License {ip.name}</button>
      {!commercialOwner ? <components_1.DisabledReason>Seat a Strategy or Marketing specialist to own the licensing negotiation.</components_1.DisabledReason> : world.player.cash < terms.minimumGuarantee && <components_1.DisabledReason>Minimum guarantee shortfall: {(0, theme_1.fmtMoney)(terms.minimumGuarantee - world.player.cash)}.</components_1.DisabledReason>}
    </> : null}
    {message && <div style={{ color: message.endsWith("licensed.") ? theme_1.C.green : theme_1.C.amber, fontSize: 10.5, marginTop: 7 }}>{message}</div>}
  </div>;
}
function IPMetrics(_a) {
    var ip = _a.ip;
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(105px,1fr))", gap: 6, marginTop: 10 }}>
    <Meter label="Aware" value={ip.awareness}/>
    <Meter label="Momentum" value={Math.min(1, ip.momentum / 1.8)} text={"".concat(ip.momentum.toFixed(2), "\u00D7")}/>
    <Meter label="Prestige" value={ip.prestige}/>
    <Meter label="Fatigue" value={ip.fatigue} danger/>
  </div>;
}
function Meter(_a) {
    var label = _a.label, value = _a.value, text = _a.text, _b = _a.danger, danger = _b === void 0 ? false : _b;
    var pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
    return <div>
    <div style={{ display: "flex", justifyContent: "space-between", color: theme_1.C.faint, fontSize: 9.5 }}><span>{label}</span><span>{text !== null && text !== void 0 ? text : "".concat(pct, "%")}</span></div>
    <div style={{ height: 4, borderRadius: 2, background: theme_1.C.grid, marginTop: 3 }}><div style={{ width: "".concat(pct, "%"), height: "100%", borderRadius: 2, background: danger && pct > 55 ? theme_1.C.red : theme_1.C.violet }}/></div>
  </div>;
}
function MiniStat(_a) {
    var label = _a.label, value = _a.value, _b = _a.accent, accent = _b === void 0 ? false : _b;
    return <div style={{ border: "1px solid ".concat(theme_1.C.line), background: theme_1.C.panel2, borderRadius: 9, padding: "9px 10px" }}><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: accent ? theme_1.C.amber : theme_1.C.ink, fontSize: 14, fontWeight: 800, marginTop: 2 }}>{value}</div></div>;
}
function Term(_a) {
    var label = _a.label, value = _a.value;
    return <div style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 7, padding: 8 }}><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{label}</div><div style={{ color: theme_1.C.ink, fontWeight: 700, fontSize: 11.5 }}>{value}</div></div>;
}
function Empty(_a) {
    var children = _a.children;
    return <div style={{ color: theme_1.C.faint, fontSize: 12.5, padding: "8px 0 12px" }}>{children}</div>;
}
function familyLabels(keys) {
    return keys.map(function (key) {
        var a = (0, productCatalog_1.archetypeByKey)(key);
        return a ? "".concat(a.label).concat(industries_1.INDUSTRIES[a.industryId] ? " (".concat(industries_1.INDUSTRIES[a.industryId].label, ")") : "") : key.replace(/_/g, " ");
    });
}
