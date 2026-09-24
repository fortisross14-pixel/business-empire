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
exports.useGame = useGame;
var react_1 = require("react");
var industries_1 = require("../engine/industries");
var world_1 = require("../engine/world");
var tick_1 = require("../engine/tick");
var brandEquity_1 = require("../engine/brandEquity");
var economics_1 = require("../engine/economics");
var productDesign_1 = require("../engine/productDesign");
var capacity_1 = require("../engine/capacity");
var infrastructure_1 = require("../engine/infrastructure");
var persistence_1 = require("../engine/persistence");
var suppliers_1 = require("../engine/suppliers");
var distribution_1 = require("../engine/distribution");
var people_1 = require("../engine/people");
var chronicle_1 = require("../engine/chronicle");
var growth_1 = require("../engine/growth");
var businesses_1 = require("../engine/businesses");
var brands_1 = require("../engine/brands");
var productCatalog_1 = require("../engine/productCatalog");
var markets_1 = require("../engine/markets");
var productDynamics_1 = require("../engine/productDynamics");
var ip_1 = require("../engine/ip");
var difficulty_1 = require("../engine/difficulty");
var segments_1 = require("../engine/segments");
var research_1 = require("../engine/research");
var fmtLaunchPrice = function (v) { return "$".concat(Math.round(v * 100) / 100); };
function useGame() {
    var worldRef = (0, react_1.useRef)(null);
    var _a = (0, react_1.useState)(0), force = _a[1];
    var rerender = (0, react_1.useCallback)(function () { return force(function (x) { return x + 1; }); }, []);
    var _b = (0, react_1.useState)("home"), phase = _b[0], setPhase = _b[1];
    var _c = (0, react_1.useState)(true), playing = _c[0], setPlaying = _c[1];
    var _d = (0, react_1.useState)(1), speed = _d[0], setSpeed = _d[1];
    var _e = (0, react_1.useState)(null), modal = _e[0], setModal = _e[1];
    var _f = (0, react_1.useState)(function () { return (0, persistence_1.hasAutosave)(); }), autosaveAvailable = _f[0], setAutosaveAvailable = _f[1];
    (0, react_1.useEffect)(function () {
        if (phase !== "play")
            return;
        var raf = 0, last = performance.now(), acc = 0;
        // ticks-per-second by speed setting: 1x = 1 day/sec, 2x = 4 days/sec, 3x = 7 days/sec (a week).
        var tps = function (s) { return (s <= 1 ? 1 : s === 2 ? 4 : 7); };
        var loop = function (t) {
            var dt = t - last;
            last = t;
            var paused = !playing || modal !== null;
            if (!paused && worldRef.current) {
                var msPerTick = 1000 / tps(speed);
                acc += dt;
                var guard = 0;
                while (acc >= msPerTick && guard < 30) {
                    (0, tick_1.step)(worldRef.current);
                    acc -= msPerTick;
                    guard++;
                }
                rerender();
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return function () { return cancelAnimationFrame(raf); };
    }, [phase, playing, speed, modal, rerender]);
    (0, react_1.useEffect)(function () {
        if (phase !== "play")
            return;
        var id = window.setInterval(function () {
            if (!worldRef.current)
                return;
            (0, persistence_1.saveWorld)(worldRef.current);
            setAutosaveAvailable(true);
        }, 5000);
        return function () { return window.clearInterval(id); };
    }, [phase]);
    var continueAutosave = (0, react_1.useCallback)(function () {
        var loaded = (0, persistence_1.loadWorld)();
        if (!loaded) {
            setAutosaveAvailable(false);
            return;
        }
        worldRef.current = loaded;
        setPhase("play");
        setPlaying(false);
        rerender();
    }, [rerender]);
    var newGame = (0, react_1.useCallback)(function () {
        (0, persistence_1.clearAutosave)();
        setAutosaveAvailable(false);
        worldRef.current = null;
        setPhase("setup");
    }, []);
    var saveNow = (0, react_1.useCallback)(function () {
        if (!worldRef.current)
            return;
        (0, persistence_1.saveWorld)(worldRef.current);
        setAutosaveAvailable(true);
    }, []);
    var launch = (0, react_1.useCallback)(function (industryId, company, difficulty) {
        worldRef.current = (0, world_1.initWorld)(industryId, company, null, difficulty);
        setPhase("play");
        rerender();
    }, [rerender]);
    var createProduct = (0, react_1.useCallback)(function (spec) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var w = worldRef.current;
        var fail = function (reason) { return ({ ok: false, reason: reason }); };
        var check = (0, capacity_1.canCreateProduct)(w);
        if (!check.ok)
            return fail(check.reason);
        var archetype = (0, productCatalog_1.archetypeByKey)(spec.productKey);
        if (!archetype)
            return fail("That product type is not available in the current product catalog.");
        var business = (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a[archetype.industryId];
        if (!business || business.status !== "active")
            return fail("Activate the ".concat((_c = (_b = industries_1.INDUSTRIES[archetype.industryId]) === null || _b === void 0 ? void 0 : _b.label) !== null && _c !== void 0 ? _c : archetype.industryId, " business before designing this product."));
        if (!business.unlockedCategories.includes(spec.productKey))
            return fail("Unlock this product category before starting the design.");
        var brand = w.brands.find(function (b) { return b.id === spec.brandId; });
        if (!brand)
            return fail("Choose an existing brand for this product.");
        if (brand.industryId !== archetype.industryId)
            return fail("The selected brand belongs to a different industry.");
        // Manufacturing is deliberately chosen after design. Only validate a supplier if an older save
        // or caller explicitly supplies one; a design must never be blocked by a skincare-only default supplier.
        if (spec.method === "outsource" && spec.supplierId) {
            var supplier = (0, suppliers_1.supplierById)(spec.supplierId);
            if (!(0, suppliers_1.supplierSupportsProduct)(supplier, spec.productKey))
                return fail("".concat(supplier.name, " cannot manufacture this product family. Choose a compatible partner after design."));
        }
        var productRooms = w.player.operatingRooms.filter(function (r) { return (0, infrastructure_1.roomSupportsProductDesign)(r, archetype.industryId); });
        if (!productRooms.length)
            return fail("Build a Founder Office or a dedicated Product office first.");
        var tier = (_d = spec.projectTier) !== null && _d !== void 0 ? _d : "A";
        var tierAccess = (0, capacity_1.productProjectTierAccess)(w, tier, spec.productKey);
        if (!tierAccess.ok)
            return fail(tierAccess.reason);
        var id = "P".concat(w.tick, "_").concat(w.player.skus.length, "_").concat(Math.floor(Math.random() * 10000));
        var lockedPeople = (0, capacity_1.productProjectLockedPeople)(w);
        var seated = new Set(productRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
        var availableProductStaff = w.player.personnel.filter(function (p) { return p.role === "product_manager" && seated.has(p.id) && !lockedPeople.has(p.id); });
        var requestedLead = spec.pmId ? availableProductStaff.find(function (p) { return p.id === spec.pmId; }) : null;
        var leadOrSolo = tier === "A"
            ? (requestedLead !== null && requestedLead !== void 0 ? requestedLead : __spreadArray([], availableProductStaff, true).sort(function (a, b) { return (0, people_1.productManagerEffectiveness)(b, spec.productKey) - (0, people_1.productManagerEffectiveness)(a, spec.productKey); })[0])
            : (requestedLead && (0, people_1.isProductLead)(requestedLead) ? requestedLead : __spreadArray([], availableProductStaff, true).filter(people_1.isProductLead).sort(function (a, b) { return (0, people_1.productManagerEffectiveness)(b, spec.productKey) - (0, people_1.productManagerEffectiveness)(a, spec.productKey); })[0]);
        if (!leadOrSolo)
            return fail(tier === "A" ? "Assign an available Product Designer to a product-capable office." : "Assign an eligible Product Lead to the project.");
        var designerIds = __spreadArray([], new Set((_e = spec.designerIds) !== null && _e !== void 0 ? _e : []), true).filter(function (id) { return id !== leadOrSolo.id && availableProductStaff.some(function (p) { return p.id === id; }); });
        var requiredDesigners = tier === "AAA" ? 3 : tier === "AA" ? 1 : 0;
        if (designerIds.length !== requiredDesigners)
            return fail("Assign ".concat(requiredDesigners, " additional Product Designer").concat(requiredDesigners === 1 ? "" : "s", " to this ").concat(tier, " project."));
        if (tier === "AAA") {
            var centerType_1 = (0, infrastructure_1.productCenterTypeForIndustry)(archetype.industryId);
            if (centerType_1) {
                var teamIds_1 = __spreadArray([leadOrSolo.id], designerIds, true);
                var center = w.player.operatingRooms.find(function (r) { var _a; return r.facilityType === centerType_1 && ((_a = r.upgradeLevel) !== null && _a !== void 0 ? _a : 1) >= 2 && teamIds_1.every(function (id) { return r.assignedPersonnelIds.includes(id); }); });
                if (!center)
                    return fail("Seat the entire AAA team together in a Level II ".concat(archetype.industryId === "toys" ? "Toy Center" : "Beauty Center", "."));
            }
        }
        var teamScore = (0, people_1.productProjectTeamEffectiveness)(w, tier, spec.productKey, leadOrSolo.id, designerIds);
        var pmRoom = productRooms.find(function (r) { return r.assignedPersonnelIds.includes(leadOrSolo.id); });
        if (pmRoom && !pmRoom.productKey)
            pmRoom.productKey = spec.productKey;
        var expertise = Math.max((_f = w.player.expertise.category[spec.productKey]) !== null && _f !== void 0 ? _f : 0, (_g = w.player.expertise.industry[archetype.industryId]) !== null && _g !== void 0 ? _g : 0);
        var sku = (0, world_1.buildSku)(w, __assign(__assign({}, spec), { supplierId: null, pmSkill: teamScore, pmId: leadOrSolo.id, pmName: leadOrSolo.name, designerIds: designerIds, designDepth: (_h = spec.designDepth) !== null && _h !== void 0 ? _h : (tier === "AAA" ? "breakthrough" : tier === "AA" ? "advanced" : "standard") }), id, w.tick, expertise);
        w.player.skus.push(sku);
        var market = (0, markets_1.ensureIndustryMarket)(w, sku.industryId);
        market.fitCacheDirty = true;
        if (sku.industryId === w.industryId)
            w.fitCacheDirty = true;
        setModal(null);
        rerender();
        return { ok: true, reason: "" };
    }, [rerender]);
    // Start manufacturing a designed product — costs cash, takes time
    var produce = (0, react_1.useCallback)(function (si, qty) {
        var _a, _b, _c, _d, _e, _f;
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return;
        if (s.status !== "designed" && s.status !== "active")
            return;
        if (((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0 || ((_b = s.mfgDaysLeft) !== null && _b !== void 0 ? _b : 0) > 0)
            return; // one inbound batch per SKU at a time
        // Reprice every new batch from the current raw-material market. Historical inventory keeps
        // its simplified SKU cost basis, while new production immediately feels commodity shocks.
        var cfg = (_c = industries_1.INDUSTRIES[s.industryId]) !== null && _c !== void 0 ? _c : w.cfg;
        var pt = cfg.products.find(function (p) { return p.key === s.productKey; });
        if (!pt)
            return;
        var standard = (0, productDesign_1.manufacturingStandard)((_d = s.manufacturingStars) !== null && _d !== void 0 ? _d : 3);
        var supplier = s.method === "outsource" && s.supplierId ? (0, suppliers_1.supplierById)(s.supplierId) : null;
        if (s.method === "outsource" && (!supplier || !(0, suppliers_1.supplierSupportsProduct)(supplier, s.productKey)))
            return;
        s.unitCost = (0, economics_1.deriveUnitCost)(pt, s.method, standard.materialQuality, standard.productionQuality, (_e = supplier === null || supplier === void 0 ? void 0 : supplier.costMult) !== null && _e !== void 0 ? _e : 1, w.materialPriceIndex) * productDynamics_1.TESTING_LEVELS[(_f = s.testingLevel) !== null && _f !== void 0 ? _f : "standard"].costMult;
        var check = (0, capacity_1.canProduce)(w, qty, s.unitCost, s.method, s.supplierId, s.productKey);
        if (!check.ok)
            return;
        var cost = qty * s.unitCost;
        w.player.cash -= cost;
        s.mfgBatchSize = qty;
        // Capacity + partner choice drive lead time. Faster outsourced partners cost more but replenish sooner.
        s.mfgDaysLeft = (0, capacity_1.productionLeadDays)(w, s, qty);
        // First batch is pre-launch; replenishment keeps an already-active SKU selling from on-hand stock.
        if (s.status === "designed")
            s.status = "manufacturing";
        rerender();
    }, [rerender]);
    var assignPartner = (0, react_1.useCallback)(function (si, partnerId, assign) {
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return;
        if (assign) {
            if (!(0, distribution_1.partnerSupportsIndustry)(partnerId, s.industryId))
                return;
            if (!s.assignedPartnerIds.includes(partnerId))
                s.assignedPartnerIds.push(partnerId);
        }
        else {
            s.assignedPartnerIds = s.assignedPartnerIds.filter(function (id) { return id !== partnerId; });
        }
        (0, distribution_1.deriveSkuChannels)(w, s);
        var market = (0, markets_1.ensureIndustryMarket)(w, s.industryId);
        market.fitCacheDirty = true;
        if (s.industryId === w.industryId)
            w.fitCacheDirty = true;
        rerender();
    }, [rerender]);
    // per-product distribution & packaging
    var setPackaging = (0, react_1.useCallback)(function (si, pkg) {
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return;
        s.packaging = pkg;
        var market = (0, markets_1.ensureIndustryMarket)(w, s.industryId);
        market.fitCacheDirty = true;
        if (s.industryId === w.industryId)
            w.fitCacheDirty = true;
        rerender();
    }, [rerender]);
    var setProductPrice = (0, react_1.useCallback)(function (si, price) {
        var w = worldRef.current;
        w.player.skus[si].listPrice = price;
        rerender();
    }, [rerender]);
    // Change the manufacturing standard for future batches. The player chooses 1–5 stars;
    // the engine keeps the detailed material/production variables hidden underneath.
    var setProductQuality = (0, react_1.useCallback)(function (si, stars) {
        var _a, _b, _c, _d, _e, _f;
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s || s.inventory > 0 || ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0 || s.status === "active")
            return;
        var pt = ((_b = industries_1.INDUSTRIES[s.industryId]) !== null && _b !== void 0 ? _b : w.cfg).products.find(function (p) { return p.key === s.productKey; });
        var standard = (0, productDesign_1.manufacturingStandard)(stars);
        var supplier = s.method === "outsource" && s.supplierId ? (0, suppliers_1.supplierById)(s.supplierId) : null;
        s.manufacturingStars = standard.stars;
        s.quality = (0, economics_1.deriveQuality)(standard.materialQuality, standard.productionQuality, (_c = supplier === null || supplier === void 0 ? void 0 : supplier.qualityAdj) !== null && _c !== void 0 ? _c : 0);
        s.unitCost = (0, economics_1.deriveUnitCost)(pt, s.method, standard.materialQuality, standard.productionQuality, (_d = supplier === null || supplier === void 0 ? void 0 : supplier.costMult) !== null && _d !== void 0 ? _d : 1, w.materialPriceIndex) * productDynamics_1.TESTING_LEVELS[(_e = s.testingLevel) !== null && _e !== void 0 ? _e : "standard"].costMult;
        s.safetyScore = (0, productDynamics_1.deriveSafetyScore)(s.productKey, (_f = s.testingLevel) !== null && _f !== void 0 ? _f : "standard", s.designQuality, s.quality);
        rerender();
    }, [rerender]);
    var setProductionSetup = (0, react_1.useCallback)(function (si, method, supplierId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s || ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0 || s.inventory > 0 || s.status === "active")
            return; // manufacturer/standard are frozen once the first batch starts
        var pt = ((_b = industries_1.INDUSTRIES[s.industryId]) !== null && _b !== void 0 ? _b : w.cfg).products.find(function (p) { return p.key === s.productKey; });
        var standard = (0, productDesign_1.manufacturingStandard)((_c = s.manufacturingStars) !== null && _c !== void 0 ? _c : 3);
        s.method = method;
        var compatibleFallbackId = (_e = (_d = (0, suppliers_1.suppliersForProduct)(s.productKey)[0]) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : null;
        var requestedSupplierId = method === "outsource" ? ((_f = supplierId !== null && supplierId !== void 0 ? supplierId : s.supplierId) !== null && _f !== void 0 ? _f : compatibleFallbackId) : null;
        var requestedSupplier = requestedSupplierId ? (0, suppliers_1.supplierById)(requestedSupplierId) : null;
        if (method === "outsource" && (!requestedSupplier || !(0, suppliers_1.supplierSupportsProduct)(requestedSupplier, s.productKey)))
            return;
        s.supplierId = (_g = requestedSupplier === null || requestedSupplier === void 0 ? void 0 : requestedSupplier.id) !== null && _g !== void 0 ? _g : null;
        var supplier = requestedSupplier;
        s.quality = (0, economics_1.deriveQuality)(standard.materialQuality, standard.productionQuality, (_h = supplier === null || supplier === void 0 ? void 0 : supplier.qualityAdj) !== null && _h !== void 0 ? _h : 0);
        s.unitCost = (0, economics_1.deriveUnitCost)(pt, method, standard.materialQuality, standard.productionQuality, (_j = supplier === null || supplier === void 0 ? void 0 : supplier.costMult) !== null && _j !== void 0 ? _j : 1, w.materialPriceIndex) * productDynamics_1.TESTING_LEVELS[(_k = s.testingLevel) !== null && _k !== void 0 ? _k : "standard"].costMult;
        s.safetyScore = (0, productDynamics_1.deriveSafetyScore)(s.productKey, (_l = s.testingLevel) !== null && _l !== void 0 ? _l : "standard", s.designQuality, s.quality);
        rerender();
    }, [rerender]);
    var retargetProduct = (0, react_1.useCallback)(function (si, segmentId) {
        var _a, _b;
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return false;
        var segment = segmentId === "broad" ? null : (_a = w.savedSegments.find(function (seg) { return seg.id === segmentId; })) !== null && _a !== void 0 ? _a : null;
        s.target = segment ? (0, segments_1.segmentTargetProfile)((0, markets_1.marketWorldView)(w, s.industryId), segment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
        s.targetLabel = (_b = segment === null || segment === void 0 ? void 0 : segment.name) !== null && _b !== void 0 ? _b : "Broad market";
        var market = (0, markets_1.ensureIndustryMarket)(w, s.industryId);
        market.fitCacheDirty = true;
        if (s.industryId === w.industryId)
            w.fitCacheDirty = true;
        if (s.releasedToMarket)
            w.events.push({ tick: w.tick, kind: "market", text: "\uD83C\uDFAF ".concat(s.name, " retargeted to ").concat(s.targetLabel, ".") });
        rerender();
        return true;
    }, [rerender]);
    var releaseProduct = (0, react_1.useCallback)(function (si, segmentId, launchBudget) {
        var _a, _b, _c, _d, _e, _f;
        if (launchBudget === void 0) { launchBudget = 0; }
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s || s.status !== "active" || s.releasedToMarket === true || s.inventory <= 0)
            return { ok: false, reason: "The first batch must be in the warehouse before launch." };
        if (s.listPrice <= 0)
            return { ok: false, reason: "Set a selling price first." };
        if (!((_a = s.assignedPartnerIds) !== null && _a !== void 0 ? _a : []).length)
            return { ok: false, reason: "Assign at least one sales channel before launch." };
        var seatedIds = new Set(w.player.operatingRooms.filter(function (r) { return r.kind === "office"; }).flatMap(function (r) { return r.assignedPersonnelIds; }));
        if (!w.player.personnel.some(function (p) { return p.role === "marketing" && seatedIds.has(p.id); }))
            return { ok: false, reason: "Hire a Marketing Specialist and give them an office seat before launch." };
        var segment = segmentId === "broad" ? null : (_b = w.savedSegments.find(function (seg) { return seg.id === segmentId; })) !== null && _b !== void 0 ? _b : null;
        var agency = (_c = industries_1.MARKETING_AGENCIES.find(function (a) { return a.id === "spark"; })) !== null && _c !== void 0 ? _c : industries_1.MARKETING_AGENCIES[0];
        var campaignCost = segment && launchBudget > 0 && agency ? launchBudget * agency.baseCostMult : 0;
        if (campaignCost > w.player.cash)
            return { ok: false, reason: "Not enough cash for the selected launch advertising." };
        s.target = segment ? (0, segments_1.segmentTargetProfile)((0, markets_1.marketWorldView)(w, s.industryId), segment.filter) : { gender: .5, age: .5, class: .5, leaning: .5, geography: .5, family: .5 };
        s.targetLabel = (_d = segment === null || segment === void 0 ? void 0 : segment.name) !== null && _d !== void 0 ? _d : "Broad market";
        s.releasedToMarket = true;
        s.launchTick = w.tick;
        var marketView = (0, markets_1.marketWorldView)(w, s.industryId);
        for (var ci = 0; ci < marketView.cube.length; ci++) {
            var inherit = (0, brandEquity_1.launchInheritance)(marketView, ci, s.productKey, s.brandId);
            if (inherit > 0.01)
                marketView.cube[ci].awareness[s.id] = Math.max((_e = marketView.cube[ci].awareness[s.id]) !== null && _e !== void 0 ? _e : 0, inherit);
        }
        (0, markets_1.commitMarketView)(w, marketView);
        (0, distribution_1.deriveSkuChannels)(w, s);
        if (segment && launchBudget > 0 && agency) {
            var rel = (_f = w.agencyRelationships[agency.id]) !== null && _f !== void 0 ? _f : 0;
            w.activeCampaigns.push({ id: "launch_".concat(s.id, "_").concat(w.tick), name: "".concat(s.name, " launch"), segmentId: segment.id, agencyId: agency.id, scope: s.id, budget: campaignCost, daysRemaining: 30, totalDays: 30, effectivenessMult: agency.effectivenessMult * (1 + rel * .05) * (.85 + (0, people_1.teamEffectiveness)(w, "marketing") * .30) });
        }
        var lead = w.player.personnel.find(function (x) { return x.id === s.assignedPmId; });
        if (lead)
            lead.careerEvents.push({ tick: w.tick, kind: "milestone", text: "Launched ".concat(s.name, ".") });
        (0, chronicle_1.recordProductLaunch)(w, s);
        w.events.push({ tick: w.tick, kind: "product", text: "\uD83D\uDE80 ".concat(s.name, " is now on the market at ").concat(fmtLaunchPrice(s.listPrice), " for ").concat(s.targetLabel, ".") });
        var market = (0, markets_1.ensureIndustryMarket)(w, s.industryId);
        market.fitCacheDirty = true;
        if (s.industryId === w.industryId)
            w.fitCacheDirty = true;
        rerender();
        return { ok: true };
    }, [rerender]);
    var discardProduct = (0, react_1.useCallback)(function (si) {
        var _a;
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return false;
        if (s.inventory > 0 || ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0 || s.releasedToMarket)
            return false;
        w.player.skus.splice(si, 1);
        for (var _i = 0, _b = w.player.operatingRooms; _i < _b.length; _i++) {
            var room = _b[_i];
            if (room.skuId === s.id)
                room.skuId = null;
        }
        w.events.push({ tick: w.tick, kind: "product", text: "\uD83D\uDDD1 ".concat(s.name, " was discarded before launch.") });
        rerender();
        return true;
    }, [rerender]);
    var setIP = (0, react_1.useCallback)(function (si, ipId) {
        var w = worldRef.current;
        var s = w.player.skus[si];
        if (!s)
            return false;
        var result = (0, ip_1.setSkuIP)(w, s, ipId);
        if (result.ok)
            rerender();
        return result.ok;
    }, [rerender]);
    var createIP = (0, react_1.useCallback)(function (name, audiencePresetId, productFamilies) {
        var w = worldRef.current;
        var result = (0, ip_1.createOriginalIP)(w, name, audiencePresetId, productFamilies);
        if (result.ok)
            rerender();
        return result;
    }, [rerender]);
    var licenseIP = (0, react_1.useCallback)(function (ipId, years) {
        var w = worldRef.current;
        var result = (0, ip_1.signIPLicense)(w, ipId, years);
        if (result.ok)
            rerender();
        return result;
    }, [rerender]);
    var signContract = (0, react_1.useCallback)(function (partnerId) {
        var _a;
        var w = worldRef.current;
        if (!(0, distribution_1.canNegotiatePartner)(w, partnerId))
            return;
        var partner = industries_1.RETAIL_PARTNERS.find(function (p) { return p.id === partnerId; });
        if (!partner)
            return;
        // don't sign with the same partner twice
        if (w.player.contracts.some(function (c) { return c.partnerId === partnerId; }))
            return;
        w.player.contracts.push({
            type: partner.channelType, marginCut: partner.marginCut,
            partnerId: partner.id, partnerName: partner.name,
            slotting: partner.slotting, paymentDays: partner.paymentDays,
        });
        for (var _i = 0, _b = Object.values((_a = w.industryMarkets) !== null && _a !== void 0 ? _a : {}); _i < _b.length; _i++) {
            var market = _b[_i];
            if (market)
                market.fitCacheDirty = true;
        }
        w.fitCacheDirty = true;
        setModal(null);
        rerender();
    }, [rerender]);
    var removeContract = (0, react_1.useCallback)(function (i) {
        var _a, _b;
        var w = worldRef.current;
        var removed = w.player.contracts[i];
        w.player.contracts.splice(i, 1);
        if (removed)
            for (var _i = 0, _c = w.player.skus; _i < _c.length; _i++) {
                var sku = _c[_i];
                sku.assignedPartnerIds = ((_a = sku.assignedPartnerIds) !== null && _a !== void 0 ? _a : []).filter(function (id) { return id !== removed.partnerId; });
                (0, distribution_1.deriveSkuChannels)(w, sku);
            }
        for (var _d = 0, _e = Object.values((_b = w.industryMarkets) !== null && _b !== void 0 ? _b : {}); _d < _e.length; _d++) {
            var market = _e[_d];
            if (market)
                market.fitCacheDirty = true;
        }
        w.fitCacheDirty = true;
        rerender();
    }, [rerender]);
    var setMarketing = (0, react_1.useCallback)(function (v) { var w = worldRef.current; w.player.marketingTarget = v > 0 && (0, people_1.teamEffectiveness)(w, "marketing") <= 0 ? 0 : v; rerender(); }, [rerender]);
    var setBrandMarketing = (0, react_1.useCallback)(function (v) { var w = worldRef.current; w.player.brandMarketingTarget = v > 0 && (0, people_1.teamEffectiveness)(w, "marketing") <= 0 ? 0 : v; rerender(); }, [rerender]);
    var setBackOffice = (0, react_1.useCallback)(function (v) { worldRef.current.player.backOfficeTarget = v; rerender(); }, [rerender]);
    var hireCandidate = (0, react_1.useCallback)(function (candidateId, roomId) {
        var w = worldRef.current;
        var candidate = w.player.talentMarket.find(function (c) { return c.id === candidateId; });
        if (!candidate)
            return { ok: false, reason: "Candidate is no longer available." };
        var room = w.player.operatingRooms.find(function (r) { return r.id === roomId && r.kind === "office"; });
        if (!room)
            return { ok: false, reason: "Choose an office before signing the contract." };
        var hiredSeats = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
        if (room.assignedPersonnelIds.length >= hiredSeats)
            return { ok: false, reason: "".concat(room.name, " has no open staff seats. Expand it or build another office first.") };
        if (!(0, infrastructure_1.roleFitsRoom)(candidate.role, room))
            return { ok: false, reason: "".concat(candidate.title, " is not compatible with ").concat(room.name, ".") };
        var person = (0, people_1.candidateToPersonnel)(candidate, w.tick);
        w.player.personnel.push(person);
        room.assignedPersonnelIds.push(person.id);
        w.player.talentMarket = w.player.talentMarket.filter(function (c) { return c.id !== candidateId; });
        (0, infrastructure_1.syncDerivedDepartments)(w);
        w.events.push({ tick: w.tick, kind: "people", text: "\uD83D\uDC64 ".concat(person.name, " joined as ").concat(person.title, " in ").concat(room.name, ".") });
        (0, chronicle_1.recordPeopleEvent)(w, person.id, "".concat(person.name, " joined"), "".concat(person.name, " joined ").concat(w.company, " as ").concat(person.title, ", assigned to ").concat(room.name, "."), "hire", person.level >= 3 ? 2 : 1);
        rerender();
        return { ok: true };
    }, [rerender]);
    var startRecruitingSearch = (0, react_1.useCallback)(function (role, industryId, mode) {
        var w = worldRef.current;
        var result = (0, people_1.startTalentSearch)(w, role, industryId, mode);
        if (result.ok) {
            w.events.push({ tick: w.tick, kind: "people", text: "\uD83D\uDD0E Recruiting agency engaged \u2014 ".concat(mode, " search started.") });
            rerender();
        }
        return result;
    }, [rerender]);
    var promotePersonnel = (0, react_1.useCallback)(function (id) {
        var w = worldRef.current;
        var p = w.player.personnel.find(function (x) { return x.id === id; });
        if (!p || !(0, people_1.canPromotePerson)(w, p).ok)
            return;
        var oldTitle = p.title;
        if ((0, people_1.promotePerson)(w, p)) {
            w.events.push({ tick: w.tick, kind: "people", text: "\u2B06 ".concat(p.name, " promoted from ").concat(oldTitle, " to ").concat(p.title, ".") });
            (0, chronicle_1.recordPeopleEvent)(w, p.id, "".concat(p.name, " promoted"), "".concat(p.name, " moved from ").concat(oldTitle, " to ").concat(p.title, "."), "promotion", p.level >= 3 ? 2 : 1);
            rerender();
        }
    }, [rerender]);
    var firePersonnel = (0, react_1.useCallback)(function (id) {
        var w = worldRef.current;
        var p = w.player.personnel.find(function (x) { return x.id === id; });
        if (!p)
            return;
        (0, chronicle_1.recordPeopleEvent)(w, p.id, "".concat(p.name, " left the company"), "".concat(p.name, ", ").concat(p.title, ", left after being released by the company."), "departure", p.level >= 3 ? 2 : 1);
        (0, people_1.archivePerson)(w, id, "Left after being released by the company.");
        (0, infrastructure_1.syncDerivedDepartments)(w);
        rerender();
    }, [rerender]);
    var setVision = (0, react_1.useCallback)(function (goal, scope, audience, audienceLabel) {
        var w = worldRef.current;
        w.player.vision = { goal: goal, scope: scope, audience: audience, audienceLabel: audienceLabel, setTick: w.tick, quartersPassed: 0 };
        rerender();
    }, [rerender]);
    var createBrand = (0, react_1.useCallback)(function (name, color, positioning, industryId, visual) {
        var _a;
        var w = worldRef.current;
        var clean = name.trim();
        if (!clean || w.brands.some(function (b) { return b.name.toLowerCase() === clean.toLowerCase(); }))
            return false;
        var check = (0, growth_1.canCreateBrand)(w);
        if (!check.ok)
            return false;
        var isFoundingBrand = w.brands.length === 0;
        w.player.cash -= check.cost;
        var targetIndustry = industryId !== null && industryId !== void 0 ? industryId : w.industryId;
        var business = (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a[targetIndustry];
        if (!business || business.status !== "active")
            return false;
        var chosenColor = color || industries_1.BRAND_COLORS[w.brands.length % industries_1.BRAND_COLORS.length];
        var brand = { id: "brand_".concat(w.tick, "_").concat(w.brands.length), name: clean, color: chosenColor, positioning: positioning, createdTick: w.tick, industryId: targetIndustry, visual: visual !== null && visual !== void 0 ? visual : (0, brands_1.defaultBrandVisual)(clean, chosenColor) };
        w.brands.push(brand);
        if (isFoundingBrand)
            w.primaryBrandId = brand.id;
        (0, markets_1.ensureIndustryMarket)(w, targetIndustry).brandEquity[brand.id] = {};
        if (targetIndustry === w.industryId)
            w.brandEquity[brand.id] = {};
        w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83C\uDFF7 ".concat(brand.name, " launched as a new ").concat(positioning, " brand.") });
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: isFoundingBrand ? 3 : (w.brands.length === 2 ? 3 : 2), title: "".concat(brand.name, " brand launched"),
            text: isFoundingBrand ? "".concat(w.company, " created its founding brand, ").concat(brand.name, ", positioned as ").concat(positioning, ".") : "".concat(w.company, " created ").concat(brand.name, ", a new ").concat(positioning, " brand, investing $").concat(Math.round(check.cost).toLocaleString(), " in portfolio expansion."),
            icon: "🏷️", entityType: "company", entityId: brand.id, tags: __spreadArray(["growth", "brand"], (w.brands.length === 2 ? ["iconic"] : []), true),
            dedupeKey: "brand_".concat(brand.id),
        });
        rerender();
        return true;
    }, [rerender]);
    var startCategoryExpansion = (0, react_1.useCallback)(function (productKey) {
        var _a, _b;
        var w = worldRef.current;
        var check = (0, growth_1.canStartCategoryExpansion)(w, productKey);
        if (!check.ok || !check.def)
            return false;
        w.player.cash -= check.def.investment;
        var project = { productKey: productKey, startedTick: w.tick, daysLeft: check.def.days, totalDays: check.def.days, investment: check.def.investment };
        var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
        var business = archetype ? (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a[archetype.industryId] : undefined;
        if (!business)
            return false;
        business.categoryExpansionProjects.push(project);
        if ((archetype === null || archetype === void 0 ? void 0 : archetype.industryId) === w.industryId)
            w.player.categoryExpansionProjects = business.categoryExpansionProjects;
        var label = (_b = archetype === null || archetype === void 0 ? void 0 : archetype.label) !== null && _b !== void 0 ? _b : productKey;
        w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83E\uDDED Category entry started: ".concat(label, " (").concat(check.def.days, " days).") });
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 1, title: "".concat(label, " expansion approved"),
            text: "".concat(w.company, " committed $").concat(Math.round(check.def.investment).toLocaleString(), " to build the capabilities required for ").concat(label, "."),
            icon: "🧭", entityType: "market", entityId: productKey, tags: ["growth", "category", "investment"],
            dedupeKey: "category_start_".concat(productKey),
        });
        rerender();
        return true;
    }, [rerender]);
    var startIndustryEntry = (0, react_1.useCallback)(function (industryId) {
        var w = worldRef.current;
        var check = (0, businesses_1.canStartIndustryEntry)(w, industryId);
        if (!check.ok || !check.def)
            return false;
        w.player.cash -= check.def.investment;
        w.player.industryEntryProjects.push({
            industryId: industryId,
            route: "organic", startedTick: w.tick, daysLeft: check.def.days, totalDays: check.def.days, investment: check.def.investment,
        });
        w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83C\uDF10 Organic entry into ".concat(check.def.label, " approved (").concat(check.def.days, " days).") });
        (0, chronicle_1.recordChronicle)(w, {
            kind: "milestone", importance: 2, title: "".concat(check.def.label, " entry program approved"),
            text: "".concat(w.company, " committed $").concat(Math.round(check.def.investment).toLocaleString(), " to build the capabilities required to enter ").concat(check.def.label, "."),
            icon: "🌐", entityType: "market", entityId: industryId, tags: ["growth", "industry", "investment"],
            dedupeKey: "industry_entry_start_".concat(industryId),
        });
        rerender();
        return true;
    }, [rerender]);
    var setFocus = (0, react_1.useCallback)(function (v) { worldRef.current.player.marketingFocus = v; rerender(); }, [rerender]);
    var saveSegment = (0, react_1.useCallback)(function (name, filter) {
        var w = worldRef.current;
        if (!(0, segments_1.canManageSegments)(w).ok)
            return;
        w.savedSegments.push({ id: "seg_" + Date.now(), name: name, filter: filter });
        rerender();
    }, [rerender]);
    var deleteSegment = (0, react_1.useCallback)(function (id) {
        var w = worldRef.current;
        w.savedSegments = w.savedSegments.filter(function (s) { return s.id !== id; });
        if (w.player.marketingFocus === "seg:" + id)
            w.player.marketingFocus = "all";
        rerender();
    }, [rerender]);
    var updateSegment = (0, react_1.useCallback)(function (id, name, filter) {
        var w = worldRef.current;
        if (!(0, segments_1.canManageSegments)(w).ok)
            return;
        var seg = w.savedSegments.find(function (s) { return s.id === id; });
        if (seg) {
            seg.name = name;
            seg.filter = filter;
        }
        rerender();
    }, [rerender]);
    var launchCampaign = (0, react_1.useCallback)(function (name, segmentId, agencyId, budget, days, scope) {
        var _a;
        if (scope === void 0) { scope = "company"; }
        var w = worldRef.current;
        if ((0, people_1.teamEffectiveness)(w, "marketing") <= 0)
            return;
        var agency = industries_1.MARKETING_AGENCIES.find(function (a) { return a.id === agencyId; });
        if (!agency)
            return;
        var cost = budget * agency.baseCostMult;
        if (w.player.cash < cost)
            return;
        var rel = (_a = w.agencyRelationships[agencyId]) !== null && _a !== void 0 ? _a : 0;
        var relBonus = 1 + rel * 0.05; // 5% better per past campaign
        w.activeCampaigns.push({
            id: "camp_" + Date.now(),
            name: name,
            segmentId: segmentId,
            agencyId: agencyId,
            scope: scope,
            budget: cost, daysRemaining: days, totalDays: days,
            effectivenessMult: agency.effectivenessMult * relBonus * (0.85 + (0, people_1.teamEffectiveness)(w, "marketing") * 0.30),
        });
        rerender();
    }, [rerender]);
    var selectCell = (0, react_1.useCallback)(function (coord) { worldRef.current.selectedCell = coord; rerender(); }, [rerender]);
    var borrow = (0, react_1.useCallback)(function (amount) {
        var w = worldRef.current;
        var d = (0, difficulty_1.difficultyConfig)(w.difficulty);
        var baseLimit = w.difficulty === "entrepreneur" ? 4000000 : w.difficulty === "standard" ? 2000000 : 500000;
        var confidenceMult = d.investorExpectations > 0 ? (0.35 + w.investorConfidence * 0.65) : 1;
        var limit = baseLimit * confidenceMult;
        var draw = Math.max(0, Math.min(amount, limit - w.player.debt));
        if (draw <= 0) {
            w.events.push({ tick: w.tick, kind: "finance", text: "Credit request denied — available financing is exhausted." });
            rerender();
            return;
        }
        w.player.cash += draw;
        w.player.debt += draw;
        rerender();
    }, [rerender]);
    var repay = (0, react_1.useCallback)(function (amount) { var w = worldRef.current; var a = Math.min(amount, w.player.debt, Math.max(0, w.player.cash)); w.player.cash -= a; w.player.debt -= a; rerender(); }, [rerender]);
    var startResearch = (0, react_1.useCallback)(function (nodeId) {
        var w = worldRef.current;
        var result = (0, research_1.startResearch)(w, nodeId);
        rerender();
        return result;
    }, [rerender]);
    var commission = (0, react_1.useCallback)(function (type) {
        var w = worldRef.current;
        if (type !== "product_diagnosis") {
            if (!(0, research_1.hasResearch)(w, "market_intelligence"))
                return;
            if ((0, people_1.teamEffectiveness)(w, "strategy") <= 0)
                return;
        }
        if (w.studies.find(function (s) { return s.type === type && !s.done; }))
            return;
        var def = world_1.STUDY_DEFS[type];
        if (!def || w.player.cash < def.cost)
            return;
        w.player.cash -= def.cost;
        w.studies = w.studies.filter(function (s) { return s.type !== type; });
        w.studies.push({ type: type, ticksLeft: world_1.STUDY_DEFS[type].ticks, done: false });
        rerender();
    }, [rerender]);
    var updateOperatingRooms = (0, react_1.useCallback)(function (rooms) {
        var w = worldRef.current;
        w.player.operatingRooms = (0, infrastructure_1.sanitizeOperatingRooms)(w, rooms);
        (0, infrastructure_1.syncDerivedDepartments)(w);
        rerender();
    }, [rerender]);
    var buildOperatingRoom = (0, react_1.useCallback)(function (incoming) {
        var _a, _b;
        var w = worldRef.current;
        var facilityType = (_a = incoming.facilityType) !== null && _a !== void 0 ? _a : incoming.kind;
        var gate = (0, infrastructure_1.facilityBuildRequirement)(w, facilityType);
        if (gate)
            return false;
        var firstOffice = incoming.kind === "office" && !w.player.operatingRooms.some(function (r) { return r.kind === "office"; });
        var room = firstOffice ? __assign(__assign({}, incoming), { id: "founder-office", name: "Founder Office", team: "unassigned", capacity: 4, facilityType: "office" }) : __assign(__assign({}, incoming), { facilityType: facilityType });
        if (room.x < 0 || room.y < 0 || room.x + room.w > 48 || room.y + room.h > 48)
            return false;
        var overlapsRoom = w.player.operatingRooms.some(function (r) { return room.x < r.x + r.w && room.x + room.w > r.x && room.y < r.y + r.h && room.y + room.h > r.y; });
        if (overlapsRoom)
            return false;
        var coversPath = ((_b = w.player.campusPaths) !== null && _b !== void 0 ? _b : []).some(function (p) { return p.x >= room.x && p.x < room.x + room.w && p.y >= room.y && p.y < room.y + room.h; });
        if (coversPath)
            return false;
        if (!(0, infrastructure_1.roomTouchesConnectedPath)(w, room))
            return false;
        if (w.player.cash < room.buildCost)
            return false;
        w.player.cash -= room.buildCost;
        w.player.operatingRooms = (0, infrastructure_1.sanitizeOperatingRooms)(w, __spreadArray(__spreadArray([], w.player.operatingRooms, true), [room], false));
        (0, infrastructure_1.syncDerivedDepartments)(w);
        (0, chronicle_1.recordBuildingEvent)(w, room);
        rerender();
        return true;
    }, [rerender]);
    var buildCampusPath = (0, react_1.useCallback)(function (x, y) {
        var w = worldRef.current;
        var check = (0, infrastructure_1.canBuildCampusPath)(w, { x: x, y: y });
        if (!check.ok)
            return check;
        w.player.cash -= infrastructure_1.CAMPUS_PATH_COST;
        w.player.campusPaths.push({ x: x, y: y });
        rerender();
        return { ok: true, reason: "" };
    }, [rerender]);
    var buildCampusPathLine = (0, react_1.useCallback)(function (tiles) {
        var w = worldRef.current;
        var unique = tiles.filter(function (tile, index) { return tiles.findIndex(function (other) { return other.x === tile.x && other.y === tile.y; }) === index; });
        if (!unique.length)
            return { ok: false, reason: "Select a path line first.", built: 0 };
        var built = 0;
        for (var _i = 0, unique_1 = unique; _i < unique_1.length; _i++) {
            var tile = unique_1[_i];
            var check = (0, infrastructure_1.canBuildCampusPath)(w, tile);
            if (!check.ok)
                return { ok: false, reason: check.reason, built: built };
            w.player.cash -= infrastructure_1.CAMPUS_PATH_COST;
            w.player.campusPaths.push(tile);
            built += 1;
        }
        rerender();
        return { ok: true, reason: "", built: built };
    }, [rerender]);
    var retoolFactory = (0, react_1.useCallback)(function (roomId, productKey) {
        var _a, _b, _c, _d;
        var w = worldRef.current;
        var room = w.player.operatingRooms.find(function (r) { return r.id === roomId && r.kind === "factory"; });
        if ((0, people_1.teamEffectiveness)(w, "operations") <= 0)
            return false;
        var archetype = (0, productCatalog_1.archetypeByKey)(productKey);
        var business = archetype ? (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a[archetype.industryId] : null;
        if (!room || !archetype || !business || business.status !== "active" || !business.unlockedCategories.includes(productKey))
            return false;
        var nextFamilies = __spreadArray([], archetype.manufacturingFamilies, true);
        if (!nextFamilies.length)
            return false;
        var same = __spreadArray([], ((_b = room.manufacturingFamilies) !== null && _b !== void 0 ? _b : []), true).sort().join("|") === __spreadArray([], nextFamilies, true).sort().join("|");
        if (same)
            return true;
        var cost = Math.max(150000, Math.round(room.buildCost * 0.18));
        if (w.player.cash < cost)
            return false;
        w.player.cash -= cost;
        room.manufacturingFamilies = nextFamilies;
        var industryLabel = (_d = (_c = industries_1.INDUSTRIES[archetype.industryId]) === null || _c === void 0 ? void 0 : _c.label) !== null && _d !== void 0 ? _d : archetype.industryId;
        w.events.push({ tick: w.tick, kind: "operations", text: "\uD83C\uDFED ".concat(room.name, " retooled for ").concat(archetype.label, " production (").concat(Math.round(cost).toLocaleString(), ").") });
        (0, chronicle_1.recordChronicle)(w, { kind: "operations", importance: 1, title: "".concat(room.name, " retooled"), text: "".concat(room.name, " was reconfigured for ").concat(archetype.label, " (").concat(industryLabel, ") manufacturing."), icon: "🔧", entityType: "building", entityId: room.id, tags: ["operations", "manufacturing", archetype.industryId, productKey] });
        rerender();
        return true;
    }, [rerender]);
    var installWarehouseModule = (0, react_1.useCallback)(function (roomId, profile) {
        var _a;
        var w = worldRef.current;
        var room = w.player.operatingRooms.find(function (r) { return r.id === roomId && r.kind === "warehouse"; });
        if (!room)
            return { ok: false, reason: "Warehouse not found." };
        if (profile === "standard")
            return { ok: true, reason: "" };
        if ((0, people_1.teamEffectiveness)(w, "operations") <= 0)
            return { ok: false, reason: "Seat a Sourcing / Operations specialist before installing specialized warehouse equipment." };
        var gate = (0, infrastructure_1.storageModuleRequirement)(w, profile);
        if (gate)
            return { ok: false, reason: gate };
        room.storageProfiles = ((_a = room.storageProfiles) === null || _a === void 0 ? void 0 : _a.length) ? room.storageProfiles : ["standard"];
        if (room.storageProfiles.includes(profile))
            return { ok: false, reason: "This storage module is already installed." };
        var cost = infrastructure_1.WAREHOUSE_MODULE_COST[profile];
        if (w.player.cash < cost)
            return { ok: false, reason: "Need $".concat(cost.toLocaleString(), " to install this module.") };
        w.player.cash -= cost;
        room.storageProfiles.push(profile);
        w.events.push({ tick: w.tick, kind: "operations", text: "\u2744 ".concat(room.name, " added ").concat(profile, " storage capability.") });
        rerender();
        return { ok: true, reason: "" };
    }, [rerender]);
    var upgradeOperatingRoom = (0, react_1.useCallback)(function (roomId) {
        var w = worldRef.current;
        var room = w.player.operatingRooms.find(function (r) { return r.id === roomId; });
        if (!room)
            return { ok: false, reason: "Facility not found." };
        var quote = (0, infrastructure_1.facilityUpgradeQuote)(room);
        if (!quote)
            return { ok: false, reason: "This facility is already at maximum capacity." };
        var upgradeGate = (0, infrastructure_1.facilityUpgradeRequirement)(w, room, quote.nextLevel);
        if (upgradeGate)
            return { ok: false, reason: upgradeGate };
        if (w.player.cash < quote.cost)
            return { ok: false, reason: "Not enough cash for this upgrade." };
        w.player.cash -= quote.cost;
        room.capacity += quote.capacityGain;
        room.monthlyCost += quote.monthlyCostGain;
        room.upgradeLevel = quote.nextLevel;
        (0, infrastructure_1.syncDerivedDepartments)(w);
        w.events.push({ tick: w.tick, kind: "operations", text: "\uD83C\uDFD7 ".concat(room.name, " expanded to level ").concat(quote.nextLevel, ".") });
        (0, chronicle_1.recordChronicle)(w, { kind: "operations", importance: 1, title: "".concat(room.name, " expanded"), text: "".concat(room.name, " reached facility level ").concat(quote.nextLevel, ", adding ").concat(quote.capacityGain.toLocaleString(), " capacity."), icon: "🏗", entityType: "building", entityId: room.id, tags: ["operations", "building", "upgrade"] });
        rerender();
        return { ok: true };
    }, [rerender]);
    var trainPersonnel = (0, react_1.useCallback)(function (personnelId) {
        var w = worldRef.current;
        var result = (0, people_1.startPersonnelTraining)(w, personnelId);
        if (result.ok)
            rerender();
        return result;
    }, [rerender]);
    var demolishOperatingRoom = (0, react_1.useCallback)(function (roomId) {
        var w = worldRef.current;
        var room = w.player.operatingRooms.find(function (r) { return r.id === roomId; });
        if (!room || room.id === "founder-office")
            return;
        w.player.cash += Math.round(room.buildCost * 0.25);
        w.player.operatingRooms = (0, infrastructure_1.sanitizeOperatingRooms)(w, w.player.operatingRooms.filter(function (r) { return r.id !== roomId; }));
        (0, infrastructure_1.syncDerivedDepartments)(w);
        rerender();
    }, [rerender]);
    return {
        world: worldRef.current,
        phase: phase,
        setPhase: setPhase,
        playing: playing,
        setPlaying: setPlaying,
        speed: speed,
        setSpeed: setSpeed,
        modal: modal,
        setModal: setModal,
        autosaveAvailable: autosaveAvailable,
        continueAutosave: continueAutosave,
        newGame: newGame,
        saveNow: saveNow,
        launch: launch,
        createProduct: createProduct,
        produce: produce,
        signContract: signContract,
        removeContract: removeContract,
        assignPartner: assignPartner,
        setPackaging: setPackaging,
        setProductPrice: setProductPrice,
        setProductQuality: setProductQuality,
        setProductionSetup: setProductionSetup,
        retargetProduct: retargetProduct,
        releaseProduct: releaseProduct,
        discardProduct: discardProduct,
        setIP: setIP,
        createIP: createIP,
        licenseIP: licenseIP,
        setMarketing: setMarketing,
        setBrandMarketing: setBrandMarketing,
        setBackOffice: setBackOffice,
        setFocus: setFocus,
        selectCell: selectCell,
        commission: commission,
        borrow: borrow,
        repay: repay,
        saveSegment: saveSegment,
        deleteSegment: deleteSegment,
        updateSegment: updateSegment,
        launchCampaign: launchCampaign,
        startResearch: startResearch,
        hireCandidate: hireCandidate,
        startRecruitingSearch: startRecruitingSearch,
        promotePersonnel: promotePersonnel,
        trainPersonnel: trainPersonnel,
        firePersonnel: firePersonnel,
        setVision: setVision,
        createBrand: createBrand,
        startCategoryExpansion: startCategoryExpansion,
        startIndustryEntry: startIndustryEntry,
        updateOperatingRooms: updateOperatingRooms,
        buildOperatingRoom: buildOperatingRoom,
        buildCampusPath: buildCampusPath,
        buildCampusPathLine: buildCampusPathLine,
        demolishOperatingRoom: demolishOperatingRoom,
        upgradeOperatingRoom: upgradeOperatingRoom,
        retoolFactory: retoolFactory,
        installWarehouseModule: installWarehouseModule,
    };
}
