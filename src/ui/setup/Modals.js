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
exports.ProductCreator = ProductCreator;
exports.ContractModal = ContractModal;
var react_1 = require("react");
var theme_1 = require("../theme");
var components_1 = require("../components");
var industries_1 = require("../../engine/industries");
var segments_1 = require("../../engine/segments");
var types_1 = require("../../engine/types");
var productCatalog_1 = require("../../engine/productCatalog");
var productDynamics_1 = require("../../engine/productDynamics");
var distribution_1 = require("../../engine/distribution");
var people_1 = require("../../engine/people");
var capacity_1 = require("../../engine/capacity");
var infrastructure_1 = require("../../engine/infrastructure");
var ip_1 = require("../../engine/ip");
var productDesign_1 = require("../../engine/productDesign");
function fitPriorityBudget(input, budget) {
    var _a;
    var out = __assign({}, input);
    var keys = Object.keys(out);
    var total = keys.reduce(function (sum, k) { var _a; return sum + Math.max(1, Math.min(5, (_a = out[k]) !== null && _a !== void 0 ? _a : 1)); }, 0);
    while (total > budget) {
        var k = keys.sort(function (a, b) { var _a, _b; return ((_a = out[b]) !== null && _a !== void 0 ? _a : 1) - ((_b = out[a]) !== null && _b !== void 0 ? _b : 1); })[0];
        if (!k || ((_a = out[k]) !== null && _a !== void 0 ? _a : 1) <= 1)
            break;
        out[k] -= 1;
        total -= 1;
    }
    return out;
}
function ProductCreator(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8;
    var world = _a.world, baseSku = _a.baseSku, onCreate = _a.onCreate, onClose = _a.onClose;
    var activeBrands = world.brands.filter(function (b) { var _a, _b; return ((_b = (_a = world.player.businesses) === null || _a === void 0 ? void 0 : _a[b.industryId]) === null || _b === void 0 ? void 0 : _b.status) === "active"; });
    var initialBrand = (_d = (_c = (_b = (baseSku ? world.brands.find(function (b) { return b.id === baseSku.brandId; }) : null)) !== null && _b !== void 0 ? _b : activeBrands.find(function (b) { return b.id === world.primaryBrandId; })) !== null && _c !== void 0 ? _c : activeBrands[0]) !== null && _d !== void 0 ? _d : world.brands[0];
    var initialCfg = (_e = industries_1.INDUSTRIES[initialBrand.industryId]) !== null && _e !== void 0 ? _e : world.cfg;
    var initialBusiness = (_f = world.player.businesses) === null || _f === void 0 ? void 0 : _f[initialCfg.id];
    var initialUnlocked = initialCfg.products.filter(function (p) { return initialBusiness === null || initialBusiness === void 0 ? void 0 : initialBusiness.unlockedCategories.includes(p.key); });
    var initialProductKey = (_j = (_g = baseSku === null || baseSku === void 0 ? void 0 : baseSku.productKey) !== null && _g !== void 0 ? _g : (_h = initialUnlocked[0]) === null || _h === void 0 ? void 0 : _h.key) !== null && _j !== void 0 ? _j : (_k = initialCfg.products[0]) === null || _k === void 0 ? void 0 : _k.key;
    var initialPositioning = (_l = baseSku === null || baseSku === void 0 ? void 0 : baseSku.positioning) !== null && _l !== void 0 ? _l : (initialBrand.positioning === "mass" ? "mainstream" : initialBrand.positioning === "luxury" ? "luxury" : "premium");
    var baseTargetName = (_o = (_m = baseSku === null || baseSku === void 0 ? void 0 : baseSku.targetLabel) === null || _m === void 0 ? void 0 : _m.split(" · ")[0]) !== null && _o !== void 0 ? _o : "";
    var initialSegment = (_q = (_p = world.savedSegments.find(function (s) { return s.name === baseTargetName; })) === null || _p === void 0 ? void 0 : _p.id) !== null && _q !== void 0 ? _q : "broad";
    var _9 = (0, react_1.useState)(1), step = _9[0], setStep = _9[1];
    var _10 = (0, react_1.useState)(null), createError = _10[0], setCreateError = _10[1];
    var _11 = (0, react_1.useState)(initialBrand.id), brandId = _11[0], setBrandId = _11[1];
    var _12 = (0, react_1.useState)(initialProductKey), productKey = _12[0], setProductKey = _12[1];
    var _13 = (0, react_1.useState)(baseSku ? "".concat(baseSku.name.replace(/ v\d+$/i, ""), " v").concat(((_r = baseSku.version) !== null && _r !== void 0 ? _r : 1) + 1) : ""), name = _13[0], setName = _13[1];
    var _14 = (0, react_1.useState)(initialSegment), targetSegmentId = _14[0], setTargetSegmentId = _14[1];
    var _15 = (0, react_1.useState)(initialPositioning), positioning = _15[0], setPositioning = _15[1];
    var _16 = (0, react_1.useState)((_s = baseSku === null || baseSku === void 0 ? void 0 : baseSku.projectTier) !== null && _s !== void 0 ? _s : ((baseSku === null || baseSku === void 0 ? void 0 : baseSku.designDepth) === "breakthrough" ? "AAA" : (baseSku === null || baseSku === void 0 ? void 0 : baseSku.designDepth) === "advanced" ? "AA" : "A")), projectTier = _16[0], setProjectTier = _16[1];
    var _17 = (0, react_1.useState)((_t = baseSku === null || baseSku === void 0 ? void 0 : baseSku.assignedPmId) !== null && _t !== void 0 ? _t : ""), leadPmId = _17[0], setLeadPmId = _17[1];
    var _18 = (0, react_1.useState)((_u = baseSku === null || baseSku === void 0 ? void 0 : baseSku.assignedDesignerIds) !== null && _u !== void 0 ? _u : []), designerIds = _18[0], setDesignerIds = _18[1];
    var _19 = (0, react_1.useState)((_v = baseSku === null || baseSku === void 0 ? void 0 : baseSku.testingLevel) !== null && _v !== void 0 ? _v : "standard"), testingLevel = _19[0], setTestingLevel = _19[1];
    var _20 = (0, react_1.useState)((_w = baseSku === null || baseSku === void 0 ? void 0 : baseSku.packaging) !== null && _w !== void 0 ? _w : (0, productDesign_1.positioningDef)(initialPositioning).packaging), packaging = _20[0], setPackaging = _20[1];
    var _21 = (0, react_1.useState)((_x = baseSku === null || baseSku === void 0 ? void 0 : baseSku.ipId) !== null && _x !== void 0 ? _x : null), ipId = _21[0], setIpId = _21[1];
    var _22 = (0, react_1.useState)(function () {
        var _a;
        var a = (0, productCatalog_1.archetypeByKey)(initialProductKey);
        if (baseSku === null || baseSku === void 0 ? void 0 : baseSku.designFacets)
            return __assign({}, baseSku.designFacets);
        return Object.fromEntries(((_a = a === null || a === void 0 ? void 0 : a.designFacets) !== null && _a !== void 0 ? _a : []).map(function (f) { return [f.id, f.defaultOptionId]; }));
    }), designFacets = _22[0], setDesignFacets = _22[1];
    var _23 = (0, react_1.useState)(function () {
        var _a, _b;
        var tier = (_a = baseSku === null || baseSku === void 0 ? void 0 : baseSku.projectTier) !== null && _a !== void 0 ? _a : ((baseSku === null || baseSku === void 0 ? void 0 : baseSku.designDepth) === "breakthrough" ? "AAA" : (baseSku === null || baseSku === void 0 ? void 0 : baseSku.designDepth) === "advanced" ? "AA" : "A");
        if (baseSku)
            return fitPriorityBudget((0, productDesign_1.attributesToStars)(initialCfg, baseSku.attributes), types_1.PRODUCT_PROJECT_TIERS[tier].priorityPoints);
        var pt = (_b = initialCfg.products.find(function (p) { return p.key === initialProductKey; })) !== null && _b !== void 0 ? _b : initialCfg.products[0];
        return fitPriorityBudget((0, productDesign_1.applyPositioningToPriorityStars)(initialCfg.id, (0, productDesign_1.attributesToStars)(initialCfg, pt.defaultAttributes), initialPositioning), types_1.PRODUCT_PROJECT_TIERS[tier].priorityPoints);
    }), priorityStars = _23[0], setPriorityStars = _23[1];
    var selectedBrand = (_y = world.brands.find(function (b) { return b.id === brandId; })) !== null && _y !== void 0 ? _y : initialBrand;
    var cfg = (_z = industries_1.INDUSTRIES[selectedBrand.industryId]) !== null && _z !== void 0 ? _z : world.cfg;
    var business = (_0 = world.player.businesses) === null || _0 === void 0 ? void 0 : _0[cfg.id];
    var unlockedProducts = cfg.products.filter(function (p) { return business === null || business === void 0 ? void 0 : business.unlockedCategories.includes(p.key); });
    var pt = (_1 = cfg.products.find(function (p) { return p.key === productKey; })) !== null && _1 !== void 0 ? _1 : cfg.products[0];
    var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
    var pos = (0, productDesign_1.positioningDef)(positioning);
    var attributes = (0, productDesign_1.starsToAttributes)(priorityStars);
    var tierDef = types_1.PRODUCT_PROJECT_TIERS[projectTier];
    var testDef = productDynamics_1.TESTING_LEVELS[testingLevel];
    var developmentDays = Math.ceil(tierDef.baseDays * testDef.timeMult);
    var priorityUsed = Object.values(priorityStars).reduce(function (sum, v) { return sum + v; }, 0);
    var productRooms = world.player.operatingRooms.filter(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, archetype === null || archetype === void 0 ? void 0 : archetype.industryId); });
    var seatedPmIds = new Set(productRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    var lockedPmIds = (0, capacity_1.productProjectLockedPeople)(world);
    if (baseSku === null || baseSku === void 0 ? void 0 : baseSku.assignedPmId)
        lockedPmIds.delete(baseSku.assignedPmId);
    for (var _i = 0, _24 = (_2 = baseSku === null || baseSku === void 0 ? void 0 : baseSku.assignedDesignerIds) !== null && _2 !== void 0 ? _2 : []; _i < _24.length; _i++) {
        var id = _24[_i];
        lockedPmIds.delete(id);
    }
    var availablePms = world.player.personnel.filter(function (person) { return person.role === "product_manager" && seatedPmIds.has(person.id) && !lockedPmIds.has(person.id); });
    var leadPool = projectTier === "A" ? availablePms : availablePms.filter(people_1.isProductLead);
    var selectedPm = (_3 = leadPool.find(function (person) { return person.id === leadPmId; })) !== null && _3 !== void 0 ? _3 : __spreadArray([], leadPool, true).sort(function (a, b) { return (0, people_1.productManagerEffectiveness)(b, productKey) - (0, people_1.productManagerEffectiveness)(a, productKey); })[0];
    var requiredDesigners = projectTier === "AAA" ? 3 : projectTier === "AA" ? 1 : 0;
    var validDesignerIds = designerIds.filter(function (id, i, arr) { return id !== (selectedPm === null || selectedPm === void 0 ? void 0 : selectedPm.id) && arr.indexOf(id) === i && availablePms.some(function (p) { return p.id === id; }); }).slice(0, requiredDesigners);
    var tierAccess = (0, capacity_1.productProjectTierAccess)(world, projectTier, productKey);
    var selectedSegment = targetSegmentId === "broad" ? null : (_4 = world.savedSegments.find(function (seg) { return seg.id === targetSegmentId; })) !== null && _4 !== void 0 ? _4 : null;
    var marketWorld = selectedBrand.industryId === world.industryId ? world : __assign(__assign({}, world), { cfg: cfg });
    var target = selectedSegment ? (0, segments_1.segmentTargetProfile)(marketWorld, selectedSegment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
    var facetLabel = ((_5 = archetype === null || archetype === void 0 ? void 0 : archetype.designFacets) !== null && _5 !== void 0 ? _5 : []).map(function (facet) {
        var option = facet.options.find(function (o) { var _a; return o.id === ((_a = designFacets[facet.id]) !== null && _a !== void 0 ? _a : facet.defaultOptionId); });
        return option ? "".concat(facet.label, ": ").concat(option.label) : null;
    }).filter(Boolean).join(" · ");
    var targetLabel = [(_6 = selectedSegment === null || selectedSegment === void 0 ? void 0 : selectedSegment.name) !== null && _6 !== void 0 ? _6 : "Broad market", facetLabel].filter(Boolean).join(" · ");
    var usableIps = archetype ? (0, ip_1.usableIPsForProduct)(world, productKey) : [];
    var canContinue = Boolean(name.trim() && pt && archetype && (business === null || business === void 0 ? void 0 : business.unlockedCategories.includes(productKey)));
    var canStart = canContinue && tierAccess.ok && Boolean(selectedPm) && validDesignerIds.length === requiredDesigners && priorityUsed <= tierDef.priorityPoints;
    var resetForProduct = function (nextProductKey, nextPositioning, nextCfg) {
        var _a, _b;
        if (nextCfg === void 0) { nextCfg = cfg; }
        var nextPt = (_a = nextCfg.products.find(function (p) { return p.key === nextProductKey; })) !== null && _a !== void 0 ? _a : nextCfg.products[0];
        setPriorityStars(fitPriorityBudget((0, productDesign_1.applyPositioningToPriorityStars)(nextCfg.id, (0, productDesign_1.attributesToStars)(nextCfg, nextPt.defaultAttributes), nextPositioning), types_1.PRODUCT_PROJECT_TIERS[projectTier].priorityPoints));
        setPackaging((0, productDesign_1.positioningDef)(nextPositioning).packaging);
        setTestingLevel("standard");
        setIpId(null);
        var nextArchetype = (0, productCatalog_1.archetypeByKey)(nextProductKey);
        setDesignFacets(Object.fromEntries(((_b = nextArchetype === null || nextArchetype === void 0 ? void 0 : nextArchetype.designFacets) !== null && _b !== void 0 ? _b : []).map(function (f) { return [f.id, f.defaultOptionId]; })));
    };
    return <Modal onClose={onClose} title={baseSku ? <>Design next version — <span style={{ color: selectedBrand.color }}>{baseSku.name}</span></> : <>Design new product — <span style={{ color: selectedBrand.color }}>{selectedBrand.name}</span></>} wide>
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 99, background: step >= 1 ? theme_1.C.violet : theme_1.C.grid }}/>
      <div style={{ flex: 1, height: 7, borderRadius: 99, background: step >= 2 ? theme_1.C.violet : theme_1.C.grid }}/>
    </div>
    <div style={{ padding: "10px 12px", background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, color: theme_1.C.dim, fontSize: 12, lineHeight: 1.55, marginBottom: 14 }}>
      <b style={{ color: theme_1.C.ink }}>Design first.</b> Manufacturer, production standard, batch size, selling price and retail channels are decided only after the design is complete.
    </div>

    {step === 1 ? <div>
      <components_1.FieldLabel>1. Product brief</components_1.FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
        <div>
          <components_1.SelectInput label="Brand" value={brandId} onChange={function (id) {
                var _a, _b, _c;
                var b = world.brands.find(function (x) { return x.id === id; });
                if (!b)
                    return;
                setBrandId(id);
                var nextCfg = (_a = industries_1.INDUSTRIES[b.industryId]) !== null && _a !== void 0 ? _a : world.cfg;
                var nextBusiness = (_b = world.player.businesses) === null || _b === void 0 ? void 0 : _b[b.industryId];
                var nextProduct = (_c = nextCfg.products.find(function (prod) { return nextBusiness === null || nextBusiness === void 0 ? void 0 : nextBusiness.unlockedCategories.includes(prod.key); })) !== null && _c !== void 0 ? _c : nextCfg.products[0];
                var nextPos = b.positioning === "mass" ? "mainstream" : b.positioning === "luxury" ? "luxury" : "premium";
                setProductKey(nextProduct.key);
                setPositioning(nextPos);
                setTargetSegmentId("broad");
                resetForProduct(nextProduct.key, nextPos, nextCfg);
            }}>{activeBrands.map(function (b) { var _a, _b; return <option key={b.id} value={b.id}>{b.name} — {(_b = (_a = industries_1.INDUSTRIES[b.industryId]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : b.industryId}</option>; })}</components_1.SelectInput>
          <components_1.SelectInput label="Product type" value={productKey} onChange={function (k) { setProductKey(k); resetForProduct(k, positioning, cfg); }}>{unlockedProducts.map(function (prod) { return <option key={prod.key} value={prod.key}>{prod.label}</option>; })}</components_1.SelectInput>
          {(function () { var profile = (0, productCatalog_1.storageProfileForProduct)(productKey); if (profile === "standard")
            return null; var ready = (0, capacity_1.warehouseUnitCapacity)(world, productKey) > 0; return <div style={{ marginTop: 7, padding: 8, border: "1px solid ".concat(ready ? "#bbf7d0" : "#fed7aa"), borderRadius: 8, background: ready ? "#f0fdf4" : "#fff7ed", fontSize: 10, color: ready ? theme_1.C.green : theme_1.C.amber }}>{ready ? "✓ " : "! "}{productCatalog_1.STORAGE_PROFILES[profile].infrastructureLabel} {ready ? "available" : "required before manufacturing"}.</div>; })()}
          <components_1.FieldLabel>Working name</components_1.FieldLabel><components_1.TextInput value={name} placeholder="e.g. Nova Serum" onChange={function (e) { return setName(e.target.value); }}/>
        </div>
        <div>
          <components_1.SelectInput label="Initial audience hypothesis" value={targetSegmentId} onChange={setTargetSegmentId}><option value="broad">Broad market</option>{world.savedSegments.map(function (seg) { return <option key={seg.id} value={seg.id}>{seg.name}</option>; })}</components_1.SelectInput>
          <components_1.SelectInput label="Commercial positioning" value={positioning} onChange={function (v) { var next = v; setPositioning(next); if (!baseSku)
            resetForProduct(productKey, next, cfg); }}>{productDesign_1.PRODUCT_POSITIONINGS.map(function (p) { return <option key={p.key} value={p.key}>{p.label}</option>; })}</components_1.SelectInput>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5, lineHeight: 1.45 }}>{pos.desc}</div>
          {((_7 = archetype === null || archetype === void 0 ? void 0 : archetype.designFacets) !== null && _7 !== void 0 ? _7 : []).map(function (facet) { var _a; return <div key={facet.id} style={{ marginTop: 9 }}><components_1.SelectInput label={facet.label} value={(_a = designFacets[facet.id]) !== null && _a !== void 0 ? _a : facet.defaultOptionId} onChange={function (v) { return setDesignFacets(function (cur) {
            var _a;
            return (__assign(__assign({}, cur), (_a = {}, _a[facet.id] = v, _a)));
        }); }}>{facet.options.map(function (o) { return <option key={o.id} value={o.id}>{o.label}</option>; })}</components_1.SelectInput></div>; })}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button style={theme_1.ctrlBtn} onClick={onClose}>Cancel</button><div style={{ display: "grid", justifyItems: "end" }}><button disabled={!canContinue} title={!canContinue ? (!name.trim() ? "Give the product a working name first." : "This category is not unlocked for the selected brand/business.") : undefined} style={__assign(__assign({}, theme_1.bigBtn), { opacity: canContinue ? 1 : .45 })} onClick={function () { return setStep(2); }}>Continue to design →</button>{!canContinue && <components_1.DisabledReason>{!name.trim() ? "Give the product a working name first." : "Choose a product category currently unlocked for this business."}</components_1.DisabledReason>}</div></div>
    </div> : <div>
      <components_1.FieldLabel>2. Build the design</components_1.FieldLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        <div>
          <div style={{ fontWeight: 750, marginBottom: 7, fontSize: 12.5 }}>Product priorities</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: priorityUsed > tierDef.priorityPoints ? theme_1.C.red : theme_1.C.dim, fontSize: 10.5, marginBottom: 5 }}><span>Design priority points</span><b>{priorityUsed} / {tierDef.priorityPoints}</b></div>
          {cfg.needs.map(function (need) { var _a; return <div key={need.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid ".concat(theme_1.C.grid) }}><span style={{ color: theme_1.C.ink, fontSize: 12.5 }}>{need.label}</span><components_1.StarRating value={(_a = priorityStars[need.key]) !== null && _a !== void 0 ? _a : 3} onChange={function (v) { return setPriorityStars(function (cur) {
            var _a;
            var next = __assign(__assign({}, cur), (_a = {}, _a[need.key] = v, _a));
            return Object.values(next).reduce(function (sum, x) { return sum + x; }, 0) <= tierDef.priorityPoints ? next : cur;
        }); }}/></div>; })}
          <div style={{ height: 12 }}/>
          <components_1.SelectInput label="Packaging direction" value={packaging} onChange={setPackaging}>{industries_1.PACKAGING.map(function (pk) { return <option key={pk.key} value={pk.key}>{pk.label}</option>; })}</components_1.SelectInput>
          <div style={{ color: theme_1.C.faint, fontSize: 10.5 }}>Packaging is part of the proposition. Manufacturing quality itself is chosen later with the manufacturer.</div>
        </div>
        <div>
          <components_1.FieldLabel>Project class</components_1.FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginBottom: 10 }}>{["A", "AA", "AAA"].map(function (tier) {
                var def = types_1.PRODUCT_PROJECT_TIERS[tier];
                var access = (0, capacity_1.productProjectTierAccess)(world, tier, productKey);
                var active = projectTier === tier;
                return <button key={tier} disabled={!access.ok} title={!access.ok ? access.reason : undefined} onClick={function () { setProjectTier(tier); setDesignerIds([]); setLeadPmId(""); setPriorityStars(function (cur) { return fitPriorityBudget(cur, def.priorityPoints); }); }} style={__assign(__assign({}, theme_1.ctrlBtn), { minHeight: 74, textAlign: "left", borderColor: active ? theme_1.C.violet : theme_1.C.line, color: active ? theme_1.C.violet : theme_1.C.ink, opacity: access.ok ? 1 : .45 })}><div style={{ fontWeight: 900, fontSize: 16 }}>{tier}</div><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 2 }}>{tier === "A" ? "1 Designer" : tier === "AA" ? "Lead + 1 Designer" : "Lead + 3 Designers"}</div><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>~{def.baseDays} base days</div></button>;
            })}</div>
          {!tierAccess.ok && <components_1.DisabledReason>{tierAccess.reason}</components_1.DisabledReason>}
          <div style={{ color: theme_1.C.dim, fontSize: 10.5, lineHeight: 1.45, marginBottom: 10 }}>{tierDef.description}</div>
          {(0, productDynamics_1.testingRequired)(productKey) && <components_1.SelectInput label="Testing & validation" value={testingLevel} onChange={function (v) { return setTestingLevel(v); }}>{Object.keys(productDynamics_1.TESTING_LEVELS).map(function (level) { return <option key={level} value={level}>{productDynamics_1.TESTING_LEVELS[level].label}</option>; })}</components_1.SelectInput>}
          <components_1.FieldLabel>{projectTier === "A" ? "Product Designer" : "Product Lead"}</components_1.FieldLabel>
          <select value={(_8 = selectedPm === null || selectedPm === void 0 ? void 0 : selectedPm.id) !== null && _8 !== void 0 ? _8 : ""} onChange={function (e) { return setLeadPmId(e.target.value); }} style={{ width: "100%", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "9px 10px", background: "white", color: theme_1.C.ink, marginBottom: 8 }}>
            {!leadPool.length && <option value="">{projectTier === "A" ? "No available Product Designer" : "No available Product Lead"}</option>}
            {leadPool.map(function (person) { return <option key={person.id} value={person.id}>{person.name} — {person.title} · {Math.round((0, people_1.productManagerEffectiveness)(person, productKey) * 100)} fit</option>; })}
          </select>
          {projectTier !== "A" && <div style={{ color: theme_1.C.faint, fontSize: 9.8, marginTop: -4, marginBottom: 9 }}>The Product Lead carries 45% of team effectiveness, so your strongest leader matters disproportionately.</div>}
          {Array.from({ length: requiredDesigners }).map(function (_, idx) { var _a; return <div key={idx} style={{ marginBottom: 7 }}><components_1.FieldLabel>Product Designer {idx + 1}</components_1.FieldLabel><select value={(_a = validDesignerIds[idx]) !== null && _a !== void 0 ? _a : ""} onChange={function (e) { var next = __spreadArray([], validDesignerIds, true); next[idx] = e.target.value; setDesignerIds(next); }} style={{ width: "100%", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "9px 10px", background: "white", color: theme_1.C.ink }}><option value="">Choose designer…</option>{availablePms.filter(function (p) { return p.id !== (selectedPm === null || selectedPm === void 0 ? void 0 : selectedPm.id) && !validDesignerIds.some(function (id, i) { return i !== idx && id === p.id; }); }).map(function (person) { return <option key={person.id} value={person.id}>{person.name} — {person.title} · {Math.round((0, people_1.productManagerEffectiveness)(person, productKey) * 100)} fit</option>; })}</select></div>; })}
          {!availablePms.length && <div style={{ color: theme_1.C.amber, fontSize: 10.5, marginBottom: 10 }}>Hire Product staff and assign them to open office desks before starting development.</div>}
          {archetype && archetype.ipPotential > 0 && <div style={{ marginTop: 10 }}>
            <components_1.FieldLabel>IP / collection — optional</components_1.FieldLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
              <button onClick={function () { return setIpId(null); }} style={__assign(__assign({}, theme_1.ctrlBtn), { textAlign: "left", borderColor: !ipId ? theme_1.C.violet : theme_1.C.line, color: !ipId ? theme_1.C.violet : theme_1.C.dim })}>No IP</button>
              {usableIps.map(function (ip) { return <button key={ip.id} onClick={function () { return setIpId(ip.id); }} style={__assign(__assign({}, theme_1.ctrlBtn), { textAlign: "left", borderColor: ipId === ip.id ? theme_1.C.violet : theme_1.C.line, color: ipId === ip.id ? theme_1.C.violet : theme_1.C.dim })}>{ip.name} · {Math.round((0, ip_1.ipProductFit)(ip, productKey) * 5)}/5 fit</button>; })}
            </div>
          </div>}
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), fontSize: 11.5 }}><b>{projectTier} product project</b> · ~{developmentDays} days · {projectTier === "A" ? "1-person team" : projectTier === "AA" ? "2-person team" : "4-person team"}<br /><span style={{ color: theme_1.C.faint }}>Audience: {targetLabel}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button style={theme_1.ctrlBtn} onClick={function () { setCreateError(null); setStep(1); }}>← Back</button><div style={{ display: "grid", justifyItems: "end" }}><button disabled={!canStart} title={!canStart ? "You need an available Product Designer seated in a product-capable office." : undefined} style={__assign(__assign({}, theme_1.bigBtn), { opacity: canStart ? 1 : .45 })} onClick={function () {
                var _a, _b, _c;
                setCreateError(null);
                var result = onCreate({
                    name: name.trim(),
                    productKey: productKey,
                    brandId: brandId,
                    method: "outsource", supplierId: null, manufacturingStars: 3,
                    listPrice: (0, productDesign_1.suggestedPrice)(pt.priceBand, .5),
                    target: target,
                    targetLabel: targetLabel,
                    positioning: positioning,
                    attributes: attributes,
                    packaging: packaging,
                    projectTier: projectTier,
                    designDepth: projectTier === "AAA" ? "breakthrough" : projectTier === "AA" ? "advanced" : "standard",
                    pmId: selectedPm === null || selectedPm === void 0 ? void 0 : selectedPm.id, designerIds: validDesignerIds,
                    testingLevel: testingLevel,
                    designFacets: designFacets,
                    ipId: ipId,
                    version: baseSku ? ((_a = baseSku.version) !== null && _a !== void 0 ? _a : 1) + 1 : 1, parentSkuId: (_b = baseSku === null || baseSku === void 0 ? void 0 : baseSku.id) !== null && _b !== void 0 ? _b : null,
                });
                if (!result.ok)
                    setCreateError((_c = result.reason) !== null && _c !== void 0 ? _c : "The design could not be started.");
            }}>Start {projectTier} design · ~{developmentDays} days</button>{!canStart && <components_1.DisabledReason>{!tierAccess.ok ? tierAccess.reason : !selectedPm ? (projectTier === "A" ? "Assign an available Product Designer." : "Assign an eligible Product Lead.") : validDesignerIds.length !== requiredDesigners ? "Assign ".concat(requiredDesigners, " additional Product Designer").concat(requiredDesigners === 1 ? "" : "s", ".") : "The project team or priority-point allocation is incomplete."}</components_1.DisabledReason>}{createError && <components_1.DisabledReason>{createError}</components_1.DisabledReason>}</div></div>
    </div>}
  </Modal>;
}
function ContractModal(_a) {
    var _b;
    var world = _a.world, onSign = _a.onSign, onClose = _a.onClose;
    var activeIndustries = new Set(Object.values((_b = world.player.businesses) !== null && _b !== void 0 ? _b : {}).filter(function (b) { return (b === null || b === void 0 ? void 0 : b.status) === "active"; }).map(function (b) { return b.industryId; }));
    var available = industries_1.RETAIL_PARTNERS.filter(function (p) {
        if (p.industries && !p.industries.some(function (id) { return activeIndustries.has(id); }))
            return false;
        if (world.player.contracts.some(function (c) { return c.partnerId === p.id; }))
            return false;
        return true;
    });
    var signed = world.player.contracts;
    var hasExternalCapability = (0, distribution_1.canNegotiatePartner)(world, "megazon");
    return (<Modal onClose={onClose} title="Distribution Partners" wide>
      {!hasExternalCapability && <div style={{ marginBottom: 14, padding: 10, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, color: "#9a3412", fontSize: 11.5, lineHeight: 1.45 }}>External retailers require someone to own the commercial relationship: seat a Sourcing / Operations or Strategy specialist. A Sourcing Office adds capacity later, but an empty building cannot negotiate. Your own website can still be opened immediately.</div>}
      {signed.length > 0 && (<div style={{ marginBottom: 16 }}>
          <div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Active contracts</div>
          {signed.map(function (c, i) { return (<div key={i} style={{ fontSize: 12, padding: "4px 0", color: theme_1.C.ink }}>{c.partnerName || c.type} — {(c.marginCut * 100).toFixed(0)}% cut</div>); })}
        </div>)}
      <div style={{ color: theme_1.C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Available partners</div>
      {available.length === 0 && <div style={{ color: theme_1.C.faint, fontSize: 13 }}>All available partners are signed or none match your active businesses.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, maxHeight: 400, overflowY: "auto" }}>
        {available.map(function (p) { return (<div key={p.id} style={{ background: theme_1.C.panel2, border: "1px solid ".concat(theme_1.C.line), borderRadius: 10, padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: theme_1.C.ink }}>{p.name}</div>
            <div style={{ color: theme_1.C.dim, fontSize: 11, marginTop: 2, marginBottom: 6 }}>{p.desc}</div>
            {p.industries && <div style={{ color: theme_1.C.violet, fontSize: 10, marginBottom: 5 }}>Best for: {p.industries.map(function (id) { var _a, _b; return (_b = (_a = industries_1.INDUSTRIES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id; }).join(", ")}</div>}
            <div style={{ fontSize: 11, color: theme_1.C.faint, display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <span>Cut: <span style={{ color: theme_1.C.amber }}>{(p.marginCut * 100).toFixed(0)}%</span></span>
              <span>Slotting: <span style={{ color: theme_1.C.amber }}>{(0, theme_1.fmtMoney)(p.slotting)}/Q</span></span>
              <span>Pays in: <span style={{ color: p.paymentDays > 60 ? theme_1.C.red : theme_1.C.cyan }}>{p.paymentDays}d</span></span>
              <span>Reach: <span style={{ color: theme_1.C.cyan }}>{(p.reachMult * 100).toFixed(0)}%</span></span>
            </div>
            <button disabled={!(0, distribution_1.canNegotiatePartner)(world, p.id)} title={!(0, distribution_1.canNegotiatePartner)(world, p.id) ? "Seat a Sourcing / Operations or Strategy specialist before negotiating with external retailers." : undefined} style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", fontSize: 12, opacity: (0, distribution_1.canNegotiatePartner)(world, p.id) ? 1 : .45 })} onClick={function () { return onSign(p.id); }}>Sign with {p.name}</button>
            {!(0, distribution_1.canNegotiatePartner)(world, p.id) && <components_1.DisabledReason>Seat a Sourcing / Operations or Strategy specialist. Buildings add capacity; people own the retailer relationship.</components_1.DisabledReason>}
          </div>); })}
      </div>
      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button style={theme_1.ctrlBtn} onClick={onClose}>Done</button>
      </div>
    </Modal>);
}
function Modal(_a) {
    var children = _a.children, onClose = _a.onClose, title = _a.title, wide = _a.wide;
    return (<div className="game-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(4,8,12,.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 140 }}>
      <div className={"game-modal-card".concat(wide ? " wide" : "")} style={{ background: theme_1.C.panel, border: "1px solid ".concat(theme_1.C.line), borderRadius: 14, padding: 22, width: "100%", maxWidth: wide ? 760 : 560, maxHeight: "92vh", overflow: "auto" }}>
        <div className="game-modal-head" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2><button className="game-modal-close" style={theme_1.ctrlBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>);
}
