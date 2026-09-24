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
exports.CompanyMapView = CompanyMapView;
var react_1 = require("react");
var types_1 = require("../../engine/types");
var theme_1 = require("../theme");
var infrastructure_1 = require("../../engine/infrastructure");
var brands_1 = require("../../engine/brands");
var productCatalog_1 = require("../../engine/productCatalog");
var capacity_1 = require("../../engine/capacity");
var industries_1 = require("../../engine/industries");
var assetRegistry_1 = require("../campus/assetRegistry");
var people_1 = require("../../engine/people");
var MAP = 48;
var TW = 54;
var TH = 27;
var TEAM_LABEL = {
    unassigned: "Unassigned",
    product: "Product Management",
    marketing: "Marketing",
    finance: "Finance & FP&A",
    sales: "Sales & Distribution",
    operations: "Operations",
    strategy: "Corporate Strategy",
    innovation: "Innovation / R&D",
};
function iso(x, y, ox, oy, zoom) {
    return { x: (x - y) * (TW / 2) * zoom + ox, y: (x + y) * (TH / 2) * zoom + oy };
}
function screenToTile(sx, sy, ox, oy, zoom) {
    var x = (sx - ox) / zoom;
    var y = (sy - oy) / zoom;
    return {
        x: Math.floor((y / (TH / 2) + x / (TW / 2)) / 2),
        y: Math.floor((y / (TH / 2) - x / (TW / 2)) / 2),
    };
}
function fittedCampusCamera(width, height, rooms, compact) {
    var bounds = rooms.reduce(function (box, room) { return ({
        minX: Math.min(box.minX, room.x), minY: Math.min(box.minY, room.y),
        maxX: Math.max(box.maxX, room.x + room.w), maxY: Math.max(box.maxY, room.y + room.h),
    }); }, { minX: infrastructure_1.CAMPUS_ENTRANCE.x, minY: infrastructure_1.CAMPUS_ENTRANCE.y, maxX: infrastructure_1.CAMPUS_ENTRANCE.x + 1, maxY: infrastructure_1.CAMPUS_ENTRANCE.y + 1 });
    // Keep the active campus large on phones instead of zooming to the entire 48x48 lot.
    // A small company should feel like a place, not a postage stamp in an empty field.
    var margin = compact ? 2.6 : 3.5;
    var minX = Math.max(0, bounds.minX - margin), minY = Math.max(0, bounds.minY - margin);
    var maxX = Math.min(MAP, bounds.maxX + margin), maxY = Math.min(MAP, bounds.maxY + margin);
    var span = Math.max(4, (maxX - minX) + (maxY - minY));
    var fitX = (width * (compact ? .82 : .74)) / (span * (TW / 2));
    var fitY = (height * (compact ? .56 : .62)) / (span * (TH / 2));
    var minZoom = compact ? .48 : .44;
    var maxZoom = compact ? .78 : .88;
    var zoom = Math.max(minZoom, Math.min(maxZoom, fitX, fitY));
    var gx = (minX + maxX) / 2, gy = (minY + maxY) / 2;
    var targetX = width * (compact ? .50 : .53);
    var targetY = height * (compact ? .62 : .58);
    return { x: targetX - (gx - gy) * (TW / 2) * zoom, y: targetY - (gx + gy) * (TH / 2) * zoom, zoom: zoom };
}
function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function hashText(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function productColor(sku, fallback) {
    var hue = hashText(sku.name) % 360;
    return sku.name ? "hsl(".concat(hue, " 62% 57%)") : fallback;
}
function shade(hex, amt) {
    var clean = hex.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(clean))
        return hex;
    var n = parseInt(clean, 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "#".concat(((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
}
function roundedRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}
function roomNavigation(room) {
    if (room.id === "founder-office")
        return { top: "mgmt", sub: "company", label: "Enter Company HQ" };
    if (room.kind === "factory")
        return { top: "ops", sub: "products", label: "Open production" };
    if (room.kind === "warehouse")
        return { top: "ops", sub: "inventory", label: "Open inventory" };
    if (room.kind === "outsourcing")
        return { top: "ops", sub: "products", label: "Open sourcing / products" };
    if (room.team === "product")
        return { top: "ops", sub: "products", label: "Open products" };
    if (room.team === "marketing")
        return { top: "mkt", sub: "campaigns", label: "Open marketing" };
    if (room.team === "finance")
        return { top: "fin", sub: "overview", label: "Open finance" };
    if (room.team === "sales")
        return { top: "ops", sub: "distribution", label: "Open distribution" };
    if (room.team === "strategy")
        return { top: "mgmt", sub: "strategy", label: "Open strategy" };
    if (room.team === "innovation")
        return { top: "mgmt", sub: "research", label: "Open research" };
    return { top: "mgmt", sub: "personnel", label: "Open personnel" };
}
function roomHeight(room) {
    if (room.kind === "office")
        return room.id === "founder-office" ? 44 : 52;
    if (room.kind === "factory")
        return 38;
    if (room.kind === "warehouse")
        return 30;
    return 36;
}
function CompanyMapView(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    var world = _a.world, openCreator = _a.openCreator, updateRooms = _a.updateRooms, buildRoom = _a.buildRoom, buildPath = _a.buildPath, buildPathLine = _a.buildPathLine, demolishRoom = _a.demolishRoom, upgradeRoom = _a.upgradeRoom, retoolFactory = _a.retoolFactory, installWarehouseModule = _a.installWarehouseModule, onNavigate = _a.onNavigate;
    var canvasRef = (0, react_1.useRef)(null);
    var wrapRef = (0, react_1.useRef)(null);
    var rooms = world.player.operatingRooms;
    var paths = (_b = world.player.campusPaths) !== null && _b !== void 0 ? _b : [];
    var companyBrand = (0, brands_1.primaryBrand)(world);
    var setRooms = function (next) { return updateRooms(typeof next === "function" ? next(rooms) : next); };
    var _t = (0, react_1.useState)(null), selectedId = _t[0], setSelectedId = _t[1];
    var _u = (0, react_1.useState)("select"), tool = _u[0], setTool = _u[1];
    var _v = (0, react_1.useState)({ x: 0, y: 0 }), hover = _v[0], setHover = _v[1];
    var _w = (0, react_1.useState)({ x: 480, y: 28, zoom: 0.72 }), camera = _w[0], setCamera = _w[1];
    var _x = (0, react_1.useState)("Start from the entrance: build a path, then place your first office beside it."), message = _x[0], setMessage = _x[1];
    var _y = (0, react_1.useState)(Date.now()), visualClock = _y[0], setVisualClock = _y[1];
    var _z = (0, react_1.useState)(null), buildFx = _z[0], setBuildFx = _z[1];
    var _0 = (0, react_1.useState)(null), pathDraft = _0[0], setPathDraft = _0[1];
    var _1 = (0, react_1.useState)(false), compact = _1[0], setCompact = _1[1];
    var drag = (0, react_1.useRef)({ active: false, moved: false, x: 0, y: 0 });
    var pathStart = (0, react_1.useRef)(null);
    var roomsCountRef = (0, react_1.useRef)(rooms.length);
    var roomsRef = (0, react_1.useRef)(rooms);
    (0, react_1.useEffect)(function () { roomsCountRef.current = rooms.length; roomsRef.current = rooms; }, [rooms]);
    (0, react_1.useEffect)(function () {
        var id = window.setInterval(function () { return setVisualClock(Date.now()); }, 250);
        return function () { return window.clearInterval(id); };
    }, []);
    (0, react_1.useEffect)(function () {
        var apply = function () {
            var _a, _b;
            var width = ((_a = wrapRef.current) === null || _a === void 0 ? void 0 : _a.clientWidth) || window.innerWidth;
            var height = ((_b = wrapRef.current) === null || _b === void 0 ? void 0 : _b.clientHeight) || Math.max(320, window.innerHeight - 92);
            var isCompact = width < 980;
            setCompact(isCompact);
            setCamera(fittedCampusCamera(width, height, roomsRef.current, isCompact));
        };
        apply();
        window.addEventListener("resize", apply);
        return function () { return window.removeEventListener("resize", apply); };
    }, [rooms.length]);
    var selected = (_c = rooms.find(function (r) { return r.id === selectedId; })) !== null && _c !== void 0 ? _c : null;
    var productRooms = rooms.filter(function (r) { return r.kind === "office" && (r.team === "product" || r.id === "founder-office") && r.productKey; });
    var hasFactory = rooms.some(function (r) { return r.kind === "factory"; });
    var hasWarehouse = rooms.some(function (r) { return r.kind === "warehouse"; });
    var hasSourcing = rooms.some(function (r) { return r.kind === "outsourcing"; }) || Boolean((_d = rooms.find(function (r) { return r.id === "founder-office"; })) === null || _d === void 0 ? void 0 : _d.assignedPersonnelIds.some(function (id) { var _a; return ((_a = world.player.personnel.find(function (p) { return p.id === id; })) === null || _a === void 0 ? void 0 : _a.role) === "operations"; }));
    var totalBuildCost = rooms.reduce(function (sum, r) { return sum + r.buildCost; }, 0);
    var monthlyRoomCost = rooms.reduce(function (sum, r) { return sum + r.monthlyCost; }, 0);
    var warehouseUnits = rooms.filter(function (r) { return r.kind === "warehouse"; }).reduce(function (a, r) { return a + r.capacity; }, 0);
    var inventoryOnHand = world.player.skus.reduce(function (a, s) { return a + s.inventory; }, 0);
    var inventoryInbound = world.player.skus.reduce(function (a, s) { var _a; return a + ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0); }, 0);
    var inventoryUnits = inventoryOnHand + inventoryInbound;
    var warehouseUsed = (0, capacity_1.inventoryUsed)(world);
    var warehouseUtil = warehouseUnits > 0 ? Math.min(1, warehouseUsed / warehouseUnits) : 0;
    var factoryUnits = rooms.filter(function (r) { return r.kind === "factory"; }).reduce(function (a, r) { return a + r.capacity; }, 0);
    var supplierUnits = rooms.filter(function (r) { return r.kind === "outsourcing"; }).reduce(function (a, r) { return a + r.capacity; }, 0);
    var ownBatches = world.player.skus.filter(function (s) { var _a; return s.method === "own" && ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0; });
    var outsourceBatches = world.player.skus.filter(function (s) { var _a; return s.method === "outsource" && ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0; });
    var activeSkus = world.player.skus.filter(function (s) { return s.status === "active"; });
    var staffedSeats = rooms.filter(function (r) { return r.kind === "office"; }).reduce(function (n, r) { return n + r.assignedPersonnelIds.length + (r.id === "founder-office" ? 1 : 0); }, 0);
    var totalSeats = rooms.filter(function (r) { return r.kind === "office"; }).reduce(function (n, r) { return n + r.capacity; }, 0);
    var salesPulse = (_f = (_e = world.live) === null || _e === void 0 ? void 0 : _e.totalUnits) !== null && _f !== void 0 ? _f : 0;
    var activeBusinesses = Object.values((_g = world.player.businesses) !== null && _g !== void 0 ? _g : {}).filter(function (b) { return Boolean(b && b.status === "active"); });
    var activeProductTypes = __spreadArray([], new Map(activeBusinesses.flatMap(function (b) { return b.unlockedCategories; }).map(function (key) { return [key, (0, productCatalog_1.archetypeByKey)(key)]; })).values(), true).filter(function (p) { return Boolean(p); });
    var flow = (0, react_1.useMemo)(function () { return productRooms.map(function (r) {
        var _a, _b, _c, _d, _e;
        var sku = (_a = world.player.skus.find(function (s) { return s.id === r.skuId; })) !== null && _a !== void 0 ? _a : world.player.skus.find(function (s) { return s.productKey === r.productKey; });
        var productionReady = (sku === null || sku === void 0 ? void 0 : sku.method) === "own" ? hasFactory : hasSourcing;
        return {
            room: r,
            label: (_d = (_c = (0, productCatalog_1.archetypeByKey)((_b = r.productKey) !== null && _b !== void 0 ? _b : "")) === null || _c === void 0 ? void 0 : _c.label) !== null && _d !== void 0 ? _d : "New Product",
            sku: sku,
            productionReady: productionReady,
            inventoryReady: hasWarehouse,
            routeReady: Boolean((_e = sku === null || sku === void 0 ? void 0 : sku.assignedPartnerIds) === null || _e === void 0 ? void 0 : _e.length) || world.player.contracts.length > 0,
        };
    }); }, [productRooms, world, hasFactory, hasWarehouse, hasSourcing]);
    var roomStatus = function (room) {
        var _a, _b;
        var facilityType = (0, infrastructure_1.roomFacilityType)(room);
        if (facilityType === "training_center") {
            var active = ((_a = world.player.trainingPrograms) !== null && _a !== void 0 ? _a : []).filter(function (program) { return program.facilityRoomId === room.id; });
            var progress = room.capacity ? active.length / room.capacity : 0;
            return { label: active.length ? "".concat(active.length, "/").concat(room.capacity, " training") : "Training ready", progress: progress, tone: active.length ? "active" : "neutral" };
        }
        if (room.kind === "warehouse") {
            var tone = warehouseUtil > .9 ? "critical" : warehouseUtil > .72 ? "warn" : "ok";
            return { label: "".concat(Math.round(warehouseUtil * 100), "% full"), progress: warehouseUtil, tone: tone };
        }
        if (room.kind === "factory") {
            var load = factoryUnits ? Math.min(1, ownBatches.reduce(function (n, s) { var _a; return n + ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0); }, 0) / Math.max(factoryUnits, 1)) : 0;
            return { label: ownBatches.length ? "".concat(ownBatches.length, " batch").concat(ownBatches.length > 1 ? "es" : "", " running") : "Idle capacity", progress: load, tone: ownBatches.length ? "active" : "neutral" };
        }
        if (room.kind === "outsourcing") {
            var load = supplierUnits ? Math.min(1, outsourceBatches.reduce(function (n, s) { var _a; return n + ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0); }, 0) / Math.max(supplierUnits, 1)) : 0;
            return { label: outsourceBatches.length ? "".concat(outsourceBatches.length, " supplier batch").concat(outsourceBatches.length > 1 ? "es" : "") : "Partners ready", progress: load, tone: outsourceBatches.length ? "active" : "neutral" };
        }
        var occupiedSeats = room.assignedPersonnelIds.length + (room.id === "founder-office" ? 1 : 0);
        var occupancy = room.capacity ? occupiedSeats / room.capacity : 0;
        var linkedSku = room.skuId ? world.player.skus.find(function (s) { return s.id === room.skuId; }) : null;
        var productSku = linkedSku !== null && linkedSku !== void 0 ? linkedSku : (room.team === "product" && room.productKey ? world.player.skus.find(function (s) { return s.productKey === room.productKey && s.status === "designing"; }) : null);
        if ((productSku === null || productSku === void 0 ? void 0 : productSku.status) === "designing") {
            var tier = (_b = productSku.projectTier) !== null && _b !== void 0 ? _b : (productSku.designDepth === "breakthrough" ? "AAA" : productSku.designDepth === "advanced" ? "AA" : "A");
            var total = types_1.PRODUCT_PROJECT_TIERS[tier].baseDays;
            return { label: "".concat(productSku.name, " \u00B7 ").concat(Math.max(0, productSku.designDaysLeft), "d"), progress: Math.max(0, Math.min(1, 1 - productSku.designDaysLeft / total)), tone: "active" };
        }
        return { label: "".concat(occupiedSeats, "/").concat(room.capacity, " positions"), progress: occupancy, tone: room.id === "founder-office" ? "ok" : room.team === "unassigned" ? "warn" : "ok" };
    };
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        var wrap = wrapRef.current;
        if (!canvas || !wrap)
            return;
        var ratio = window.devicePixelRatio || 1;
        var width = wrap.clientWidth;
        var height = compact
            ? Math.max(260, wrap.clientHeight || window.innerHeight - 96)
            : Math.max(470, Math.min(900, wrap.clientHeight || window.innerHeight - 92));
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        var ctx = canvas.getContext("2d");
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        var bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, "#eef3f2");
        bg.addColorStop(.58, "#e5eceb");
        bg.addColorStop(1, "#d9e3e2");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        var drawDiamond = function (x, y, fill, stroke, alpha) {
            if (alpha === void 0) { alpha = 1; }
            var p = iso(x, y, camera.x, camera.y, camera.zoom);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + TW / 2 * camera.zoom, p.y + TH / 2 * camera.zoom);
            ctx.lineTo(p.x, p.y + TH * camera.zoom);
            ctx.lineTo(p.x - TW / 2 * camera.zoom, p.y + TH / 2 * camera.zoom);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 0.55;
            ctx.stroke();
            ctx.globalAlpha = 1;
        };
        // Empty grass parcel. Paths are player-built from the fixed entrance.
        for (var y = 0; y < MAP; y++)
            for (var x = 0; x < MAP; x++) {
                drawDiamond(x, y, (x + y) % 2 ? "#e8efed" : "#e3ebe8", "#ccd9d5", 0.9);
            }
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var path = paths_1[_i];
            drawDiamond(path.x, path.y, (path.x + path.y) % 2 ? "#cbd5dc" : "#bfcbd3", "#8797a2", 1);
        }
        ctx.save();
        var lot = [iso(0, 0, camera.x, camera.y, camera.zoom), iso(MAP, 0, camera.x, camera.y, camera.zoom), iso(MAP, MAP, camera.x, camera.y, camera.zoom), iso(0, MAP, camera.x, camera.y, camera.zoom)];
        ctx.beginPath();
        lot.forEach(function (point, index) { return index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y); });
        ctx.closePath();
        ctx.strokeStyle = "rgba(45,65,78,.48)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        // Campus entrance is the one piece of infrastructure present on day one.
        var entrance = iso(infrastructure_1.CAMPUS_ENTRANCE.x + .5, infrastructure_1.CAMPUS_ENTRANCE.y + .5, camera.x, camera.y, camera.zoom);
        ctx.save();
        var entranceLabelW = Math.max(128, 112 * camera.zoom);
        var entranceLabelX = Math.max(entranceLabelW / 2 + 8, Math.min(width - entranceLabelW / 2 - 8, entrance.x));
        ctx.fillStyle = "rgba(17,42,67,.94)";
        roundedRect(ctx, entranceLabelX - entranceLabelW / 2, entrance.y - 38 * camera.zoom, entranceLabelW, 25 * camera.zoom, 6 * camera.zoom);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 ".concat(Math.max(9, 10 * camera.zoom), "px system-ui");
        ctx.textAlign = "center";
        ctx.fillText("CAMPUS ENTRANCE", entranceLabelX, entrance.y - 21 * camera.zoom);
        ctx.restore();
        // Concrete apron around every facility makes the campus read as a place, not loose boxes.
        for (var _a = 0, rooms_1 = rooms; _a < rooms_1.length; _a++) {
            var room = rooms_1[_a];
            for (var yy = room.y - 1; yy <= room.y + room.h; yy++) {
                for (var xx = room.x - 1; xx <= room.x + room.w; xx++) {
                    if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP)
                        drawDiamond(xx, yy, "#e9eeee", "#c8d1d1", .94);
                }
            }
        }
        // Art-pack decor is intentionally data-driven and non-simulated. It can be moved/replaced later
        // without changing the room/save schema.
        var drawCampusSprite = function (assetId, tileX, tileY, tileW, tileH, opacity) {
            if (opacity === void 0) { opacity = 1; }
            var asset = assetRegistry_1.CAMPUS_ASSETS[assetId];
            var img = (0, assetRegistry_1.campusAssetImage)(asset, function () { return setVisualClock(Date.now()); });
            if (!img || !img.complete || !img.naturalWidth)
                return;
            var w = tileW !== null && tileW !== void 0 ? tileW : asset.footprint.w, h = tileH !== null && tileH !== void 0 ? tileH : asset.footprint.h;
            var base = iso(tileX + w / 2, tileY + h, camera.x, camera.y, camera.zoom);
            var projectedWidth = (w + h) * (TW / 2) * camera.zoom;
            var drawW = Math.max(72, projectedWidth * asset.scale);
            var drawH = drawW * (img.naturalHeight / img.naturalWidth);
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.drawImage(img, base.x - drawW * asset.anchor.x, base.y - drawH * asset.anchor.y, drawW, drawH);
            ctx.restore();
        };
        // Small environmental anchors keep the campus from feeling empty while staying outside simulation state.
        var decorSlots = [
            { id: "landscaping", x: 5, y: 32, w: 4, h: 4, opacity: .9 },
            { id: "parking_signage", x: 23, y: 33, w: 4, h: 3, opacity: .86 },
        ];
        if (rooms.length >= 2) {
            var _loop_1 = function (slot) {
                if (!rooms.some(function (room) { return overlaps({ x: slot.x, y: slot.y, w: slot.w, h: slot.h }, room); }))
                    drawCampusSprite(slot.id, slot.x, slot.y, slot.w, slot.h, slot.opacity);
            };
            for (var _b = 0, decorSlots_1 = decorSlots; _b < decorSlots_1.length; _b++) {
                var slot = decorSlots_1[_b];
                _loop_1(slot);
            }
        }
        var drawTruck = function (room, idx, activity) {
            if (activity <= 0)
                return;
            var center = iso(room.x + room.w / 2, room.y + room.h + .75, camera.x, camera.y, camera.zoom);
            var t = ((visualClock / 1400 + idx * 1.7) % 1);
            var dx = (t - .5) * 88 * camera.zoom;
            var x = center.x + dx, y = center.y + 10 + Math.abs(t - .5) * 10;
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = "rgba(30,41,59,.18)";
            ctx.beginPath();
            ctx.ellipse(0, 8, 16, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = companyBrand.color;
            ctx.fillRect(-11, -5, 16, 10);
            ctx.fillStyle = shade(companyBrand.color, -28);
            ctx.fillRect(5, -2, 8, 7);
            ctx.fillStyle = "#1f2937";
            ctx.beginPath();
            ctx.arc(-6, 6, 2.5, 0, Math.PI * 2);
            ctx.arc(8, 6, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        var drawPerson = function (room, person, idx) {
            var center = iso(room.x + room.w / 2, room.y + room.h + .2, camera.x, camera.y, camera.zoom);
            var seed = hashText(person.id) % 1000;
            var phase = visualClock / 1100 + seed / 93;
            var radius = (14 + (seed % 20)) * camera.zoom;
            var x = center.x + Math.cos(phase + idx) * radius;
            var y = center.y + 5 + Math.sin(phase * .7 + idx) * radius * .33;
            ctx.fillStyle = "rgba(31,41,55,.18)";
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 3.2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = idx % 3 === 0 ? companyBrand.color : idx % 3 === 1 ? "#334155" : "#64748b";
            ctx.fillRect(x - 1.8, y - 1, 3.6, 6);
            ctx.fillStyle = "#f2c9a5";
            ctx.beginPath();
            ctx.arc(x, y - 2.8, 2.2, 0, Math.PI * 2);
            ctx.fill();
        };
        var drawPackageStack = function (room) {
            var top = world.player.skus.filter(function (s) { var _a; return s.inventory + ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0; }).sort(function (a, b) { var _a, _b; return (b.inventory + ((_a = b.mfgBatchSize) !== null && _a !== void 0 ? _a : 0)) - (a.inventory + ((_b = a.mfgBatchSize) !== null && _b !== void 0 ? _b : 0)); }).slice(0, 3);
            if (!top.length)
                return;
            var p = iso(room.x + room.w - .5, room.y + room.h - .15, camera.x, camera.y, camera.zoom);
            top.forEach(function (sku, i) {
                var x = p.x + (i - 1) * 9 * camera.zoom;
                var y = p.y - i * 2;
                ctx.fillStyle = (0, brands_1.brandById)(world, sku.brandId).color;
                ctx.fillRect(x - 4, y - 7, 8, 7);
                ctx.strokeStyle = "rgba(30,41,59,.35)";
                ctx.strokeRect(x - 4, y - 7, 8, 7);
            });
        };
        var drawBuilding = function (room) {
            var selectedNow = room.id === selectedId;
            var status = roomStatus(room);
            var rawH = roomHeight(room) * camera.zoom;
            var p0 = iso(room.x, room.y, camera.x, camera.y, camera.zoom);
            var p1 = iso(room.x + room.w, room.y, camera.x, camera.y, camera.zoom);
            var p2 = iso(room.x + room.w, room.y + room.h, camera.x, camera.y, camera.zoom);
            var p3 = iso(room.x, room.y + room.h, camera.x, camera.y, camera.zoom);
            var t0 = { x: p0.x, y: p0.y - rawH }, t1 = { x: p1.x, y: p1.y - rawH }, t2 = { x: p2.x, y: p2.y - rawH }, t3 = { x: p3.x, y: p3.y - rawH };
            var center = iso(room.x + room.w / 2, room.y + room.h / 2, camera.x, camera.y, camera.zoom);
            var asset = (0, assetRegistry_1.roomCampusAsset)(world, room);
            var assetImg = (0, assetRegistry_1.campusAssetImage)(asset, function () { return setVisualClock(Date.now()); });
            var hasAsset = Boolean((assetImg === null || assetImg === void 0 ? void 0 : assetImg.complete) && assetImg.naturalWidth);
            var assetTopY = null;
            ctx.save();
            var foundation = iso(room.x + room.w / 2, room.y + room.h, camera.x, camera.y, camera.zoom);
            ctx.fillStyle = selectedNow ? "rgba(83,103,201,.16)" : "rgba(47,63,71,.11)";
            ctx.beginPath();
            ctx.ellipse(foundation.x, foundation.y + 4 * camera.zoom, Math.max(22, (room.w + room.h) * 8 * camera.zoom), Math.max(7, (room.w + room.h) * 2.2 * camera.zoom), 0, 0, Math.PI * 2);
            ctx.fill();
            if (hasAsset && assetImg) {
                var base = iso(room.x + room.w / 2, room.y + room.h, camera.x, camera.y, camera.zoom);
                var projectedWidth = (room.w + room.h) * (TW / 2) * camera.zoom;
                var drawW = Math.max(105, projectedWidth * asset.scale);
                var drawH = drawW * (assetImg.naturalHeight / assetImg.naturalWidth);
                var dx = base.x - drawW * asset.anchor.x;
                var dy = base.y - drawH * asset.anchor.y;
                assetTopY = dy + drawH * .12;
                ctx.shadowColor = selectedNow ? "rgba(124,58,237,.3)" : "rgba(30,41,59,.14)";
                ctx.shadowBlur = selectedNow ? 15 : 6;
                ctx.shadowOffsetY = 5;
                ctx.drawImage(assetImg, dx, dy, drawW, drawH);
                ctx.shadowColor = "transparent";
                if (selectedNow) {
                    ctx.strokeStyle = theme_1.C.violet;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(p0.x, p0.y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = "rgba(83,103,201,.08)";
                    ctx.fill();
                }
            }
            else {
                // Never flash a procedural block while authored art is loading. A quiet
                // footprint placeholder keeps placement legible without bringing back
                // the generic geometry that the finished campus art replaces.
                ctx.fillStyle = selectedNow ? "rgba(83,103,201,.12)" : "rgba(148,163,184,.10)";
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = selectedNow ? theme_1.C.violet : "rgba(100,116,139,.28)";
                ctx.lineWidth = selectedNow ? 2 : 1;
                ctx.stroke();
                assetTopY = Math.min(t0.y, t1.y, t2.y, t3.y);
            }
            var roofY = assetTopY !== null && assetTopY !== void 0 ? assetTopY : (center.y - rawH);
            // Short cosmetic construction flourish for newly placed facilities.
            if ((buildFx === null || buildFx === void 0 ? void 0 : buildFx.id) === room.id && buildFx.until > visualClock) {
                var pulse = .35 + .25 * Math.sin(visualClock / 120);
                ctx.globalAlpha = .7;
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 2;
                for (var i = -4; i <= 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(center.x - 54 + i * 14, roofY - 20);
                    ctx.lineTo(center.x - 20 + i * 14, center.y + 18);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.fillStyle = "rgba(245,158,11,".concat(pulse, ")");
                ctx.fillRect(center.x - 3, roofY - 24, 6, 6);
            }
            // Nameplate + live status, not decorative labels.
            var labelW = Math.min(178, Math.max(100, room.name.length * 6.4 + 30));
            roundedRect(ctx, center.x - labelW / 2, roofY - 44, labelW, 34, 8);
            ctx.fillStyle = selectedNow ? "rgba(255,255,255,.98)" : "rgba(255,255,255,.91)";
            ctx.fill();
            ctx.strokeStyle = selectedNow ? theme_1.C.violet : "rgba(100,116,139,.22)";
            ctx.lineWidth = selectedNow ? 1.5 : 1;
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.fillStyle = "#1f2937";
            ctx.font = "700 ".concat(Math.max(9, 11.5 * camera.zoom), "px system-ui");
            ctx.fillText("".concat((0, infrastructure_1.facilityDefForRoom)(room).icon, " ").concat(room.name), center.x, roofY - 28);
            ctx.font = "".concat(Math.max(8, 9.5 * camera.zoom), "px system-ui");
            ctx.fillStyle = status.tone === "critical" ? "#dc2626" : status.tone === "warn" ? "#b45309" : status.tone === "active" ? "#4f46e5" : "#64748b";
            ctx.fillText(status.label, center.x, roofY - 16);
            var barW = labelW - 18;
            ctx.fillStyle = "rgba(148,163,184,.2)";
            ctx.fillRect(center.x - barW / 2, roofY - 13, barW, 2.5);
            ctx.fillStyle = status.tone === "critical" ? "#ef4444" : status.tone === "warn" ? "#f59e0b" : status.tone === "active" ? companyBrand.color : "#22c55e";
            ctx.fillRect(center.x - barW / 2, roofY - 13, barW * Math.max(.03, Math.min(1, status.progress)), 2.5);
            ctx.restore();
            if (room.kind === "office") {
                room.assignedPersonnelIds.slice(0, 6).forEach(function (id, i) {
                    var p = world.player.personnel.find(function (person) { return person.id === id; });
                    if (p)
                        drawPerson(room, p, i);
                });
            }
        };
        var ordered = __spreadArray([], rooms, true).sort(function (a, b) { return (a.x + a.y + a.w + a.h) - (b.x + b.y + b.w + b.h); });
        ordered.forEach(drawBuilding);
        // Logistics movement. Activity comes from real inventory/manufacturing/sales state.
        var truckIndex = 0;
        for (var _c = 0, ordered_1 = ordered; _c < ordered_1.length; _c++) {
            var room = ordered_1[_c];
            if (room.kind === "factory")
                drawTruck(room, truckIndex++, ownBatches.length);
            if (room.kind === "outsourcing")
                drawTruck(room, truckIndex++, outsourceBatches.length);
            if (room.kind === "warehouse")
                drawTruck(room, truckIndex++, inventoryInbound > 0 || salesPulse > 0 ? 1 : 0);
        }
        if (tool === "path") {
            var draftTiles = pathDraft ? straightTiles(pathDraft.start, pathDraft.end) : [hover];
            var existing = new Set(paths.map(function (path) { return "".concat(path.x, ",").concat(path.y); }));
            var virtualConnected_1 = (0, infrastructure_1.campusPathConnectedSet)(world);
            var cashLeft = world.player.cash;
            var _loop_2 = function (tile) {
                var key = "".concat(tile.x, ",").concat(tile.y);
                if (existing.has(key)) {
                    // Existing path is part of the valid drag anchor, not an error state.
                    drawDiamond(tile.x, tile.y, "#bfd4e6", "#557b9b", 0.94);
                    virtualConnected_1.add(key);
                    return "continue";
                }
                var inBounds = tile.x >= 0 && tile.y >= 0 && tile.x < infrastructure_1.CAMPUS_MAP_SIZE && tile.y < infrastructure_1.CAMPUS_MAP_SIZE;
                var occupied = rooms.some(function (r) { return tile.x >= r.x && tile.x < r.x + r.w && tile.y >= r.y && tile.y < r.y + r.h; });
                var connected = (0, infrastructure_1.adjacentTiles)(tile.x, tile.y).some(function (n) { return virtualConnected_1.has("".concat(n.x, ",").concat(n.y)); });
                var valid = inBounds && !occupied && connected && cashLeft >= infrastructure_1.CAMPUS_PATH_COST;
                drawDiamond(tile.x, tile.y, valid ? "#b9e7d2" : "#fecaca", valid ? "#0f8a62" : "#dc2626", 0.88);
                if (valid) {
                    virtualConnected_1.add(key);
                    cashLeft -= infrastructure_1.CAMPUS_PATH_COST;
                }
            };
            for (var _d = 0, draftTiles_1 = draftTiles; _d < draftTiles_1.length; _d++) {
                var tile = draftTiles_1[_d];
                _loop_2(tile);
            }
        }
        else if (tool !== "select" && tool !== "navigate") {
            var _e = infrastructure_1.FACILITY_DEFS[tool].size, w_1 = _e[0], h_1 = _e[1];
            var candidate_1 = { x: hover.x, y: hover.y, w: w_1, h: h_1 };
            var coversPath = paths.some(function (p) { return p.x >= hover.x && p.x < hover.x + w_1 && p.y >= hover.y && p.y < hover.y + h_1; });
            var valid = hover.x >= 0 && hover.y >= 0 && hover.x + w_1 <= MAP && hover.y + h_1 <= MAP && !rooms.some(function (r) { return overlaps(candidate_1, r); }) && !coversPath && (0, infrastructure_1.roomTouchesConnectedPath)(world, candidate_1);
            for (var yy = hover.y; yy < hover.y + h_1; yy++)
                for (var xx = hover.x; xx < hover.x + w_1; xx++)
                    if (xx >= 0 && yy >= 0 && xx < MAP && yy < MAP)
                        drawDiamond(xx, yy, valid ? "#bbf7d0" : "#fecaca", valid ? "#16a34a" : "#dc2626", 0.73);
        }
    }, [rooms, paths, selectedId, hover, tool, camera, compact, visualClock, buildFx, pathDraft, world.tick, world.live, world.player.skus, world.player.personnel, companyBrand.color]);
    function straightTiles(start, end) {
        var horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y);
        var finish = horizontal ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
        var length = Math.max(Math.abs(finish.x - start.x), Math.abs(finish.y - start.y));
        return Array.from({ length: length + 1 }, function (_, index) { return ({
            x: start.x + (finish.x === start.x ? 0 : Math.sign(finish.x - start.x) * index),
            y: start.y + (finish.y === start.y ? 0 : Math.sign(finish.y - start.y) * index),
        }); });
    }
    var pickRoom = function (tileX, tileY) { return __spreadArray([], rooms, true).reverse().find(function (r) { return tileX >= r.x && tileX < r.x + r.w && tileY >= r.y && tileY < r.y + r.h; }); };
    var pointInPolygon = function (px, py, pts) {
        var inside = false;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            var a = pts[i], b = pts[j];
            var intersects = ((a.y > py) !== (b.y > py)) && (px < (b.x - a.x) * (py - a.y) / ((b.y - a.y) || .0001) + a.x);
            if (intersects)
                inside = !inside;
        }
        return inside;
    };
    // Hit testing deliberately uses only the projected foundation diamond. Tall isometric
    // sprites can overlap visually, but they never steal clicks from the parcel below.
    var pickRoomAtScreen = function (sx, sy) {
        var ordered = __spreadArray([], rooms, true).sort(function (a, b) { return (b.x + b.y + b.w + b.h) - (a.x + a.y + a.w + a.h); });
        return ordered.find(function (r) {
            var pts = [iso(r.x, r.y, camera.x, camera.y, camera.zoom), iso(r.x + r.w, r.y, camera.x, camera.y, camera.zoom), iso(r.x + r.w, r.y + r.h, camera.x, camera.y, camera.zoom), iso(r.x, r.y + r.h, camera.x, camera.y, camera.zoom)];
            return pointInPolygon(sx, sy, pts);
        });
    };
    var pointerTile = function (clientX, clientY, el) {
        var rect = el.getBoundingClientRect();
        return screenToTile(clientX - rect.left, clientY - rect.top, camera.x, camera.y, camera.zoom);
    };
    var place = function (kind, x, y) {
        var _a, _b;
        if (kind === "path") {
            var existing_1 = new Set(paths.map(function (path) { return "".concat(path.x, ",").concat(path.y); }));
            var result = buildPathLine(straightTiles((_a = pathStart.current) !== null && _a !== void 0 ? _a : { x: x, y: y }, { x: x, y: y }).filter(function (tile) { return !existing_1.has("".concat(tile.x, ",").concat(tile.y)); }));
            setMessage(result.ok ? "Path extended \u00B7 ".concat((0, theme_1.fmtMoney)(infrastructure_1.CAMPUS_PATH_COST), ".") : (_b = result.reason) !== null && _b !== void 0 ? _b : "Path cannot be built there.");
            return;
        }
        var meta = infrastructure_1.FACILITY_DEFS[kind];
        var _c = meta.size, w = _c[0], h = _c[1];
        var candidate = { x: x, y: y, w: w, h: h };
        var coversPath = paths.some(function (p) { return p.x >= x && p.x < x + w && p.y >= y && p.y < y + h; });
        if (x < 0 || y < 0 || x + w > MAP || y + h > MAP || rooms.some(function (r) { return overlaps(candidate, r); }) || coversPath) {
            setMessage(coversPath ? "Buildings sit beside paths, not on top of them." : "That facility does not fit there.");
            return;
        }
        if (!(0, infrastructure_1.roomTouchesConnectedPath)(world, candidate)) {
            setMessage("Facilities must touch a path connected to the campus entrance.");
            return;
        }
        var gate = (0, infrastructure_1.facilityBuildRequirement)(world, kind);
        if (gate) {
            setMessage(gate);
            return;
        }
        if (world.player.cash < meta.buildCost) {
            setMessage("Not enough cash to build ".concat(meta.label, "."));
            return;
        }
        var firstOffice = kind === "office" && !rooms.some(function (r) { return r.kind === "office"; });
        var n = rooms.filter(function (r) { return (0, infrastructure_1.roomFacilityType)(r) === kind; }).length + 1;
        var room = {
            id: firstOffice ? "founder-office" : "".concat(kind, "-").concat(Date.now()), kind: meta.kind, facilityType: firstOffice ? "office" : kind,
            x: x,
            y: y,
            w: w,
            h: h,
            name: firstOffice ? "Founder Office" : (meta.repeatable ? "".concat(meta.label, " ").concat(n) : meta.label), team: firstOffice ? "unassigned" : meta.team,
            productKey: null, skuId: null, assignedPersonnelIds: [], buildCost: meta.buildCost, monthlyCost: meta.monthlyCost,
            capacity: firstOffice ? 4 : meta.capacity, upgradeLevel: 1,
            manufacturingFamilies: meta.kind === "factory" ? (0, productCatalog_1.defaultFactoryFamiliesForIndustry)(world.industryId) : undefined,
            storageProfiles: kind === "cold_storage" ? ["standard", "climate", "refrigerated", "frozen"] : meta.kind === "warehouse" ? ["standard"] : undefined,
        };
        if (!buildRoom(room)) {
            setMessage("Could not build ".concat(meta.label, ". Check unlocks, cash and path access."));
            return;
        }
        setBuildFx({ id: room.id, until: Date.now() + 4200 });
        setSelectedId(room.id);
        setTool("select");
        setMessage(firstOffice ? "Founder Office I built. One of four positions belongs to you; three staff desks are open." : "".concat(meta.label, " complete. Its gameplay effect is now active."));
    };
    var updateSelected = function (patch) {
        if (!selectedId)
            return;
        setRooms(function (rs) { return rs.map(function (r) { return r.id === selectedId ? __assign(__assign({}, r), patch) : r; }); });
    };
    var openSelected = function (room) {
        var target = roomNavigation(room);
        onNavigate(target.top, target.sub);
    };
    var blockers = [
        !productRooms.length && "No product management team has a category mandate.",
        !hasFactory && !hasSourcing && "No factory or sourcing office can manufacture products.",
        !hasWarehouse && "No warehouse exists; scaled inventory will be constrained.",
        !world.player.contracts.length && !hasSourcing && "No route to market or distribution-contract team exists.",
        !rooms.some(function (r) { return r.kind === "office" && r.team === "finance"; }) && "No finance team is monitoring unit economics and cash.",
    ].filter(Boolean);
    var selectedStatus = selected ? roomStatus(selected) : null;
    var selectedType = selected ? (0, infrastructure_1.roomFacilityType)(selected) : null;
    var selectedNav = selected ? roomNavigation(selected) : null;
    var selectedUpgrade = selected ? (0, infrastructure_1.facilityUpgradeQuote)(selected) : null;
    var selectedUpgradeGate = selected && selectedUpgrade ? (0, infrastructure_1.facilityUpgradeRequirement)(world, selected, selectedUpgrade.nextLevel) : null;
    var warehouseProducts = world.player.skus.filter(function (s) { var _a; return s.inventory + ((_a = s.mfgBatchSize) !== null && _a !== void 0 ? _a : 0) > 0; }).sort(function (a, b) { var _a, _b; return (b.inventory + ((_a = b.mfgBatchSize) !== null && _a !== void 0 ? _a : 0)) - (a.inventory + ((_b = a.mfgBatchSize) !== null && _b !== void 0 ? _b : 0)); }).slice(0, 5);
    var resetCamera = function () {
        var _a, _b, _c, _d;
        var width = (_b = (_a = wrapRef.current) === null || _a === void 0 ? void 0 : _a.clientWidth) !== null && _b !== void 0 ? _b : 900;
        var height = (_d = (_c = wrapRef.current) === null || _c === void 0 ? void 0 : _c.clientHeight) !== null && _d !== void 0 ? _d : Math.max(320, window.innerHeight - 92);
        setCamera(fittedCampusCamera(width, height, rooms, compact));
    };
    return <div style={{ position: "relative", height: "100%", minHeight: compact ? 0 : 520, overflow: "hidden" }}>
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: "#e5ece7", overflow: "hidden" }}>
      <canvas ref={canvasRef} onPointerDown={function (e) { var tile = pointerTile(e.clientX, e.clientY, e.currentTarget); drag.current = { active: true, moved: false, x: e.clientX, y: e.clientY }; pathStart.current = tool === "path" ? tile : null; if (tool === "path")
        setPathDraft({ start: tile, end: tile }); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={function (e) {
            var t = pointerTile(e.clientX, e.clientY, e.currentTarget);
            setHover(t);
            if (!drag.current.active)
                return;
            var dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
            if (tool === "path" && pathStart.current) {
                var tile = pointerTile(e.clientX, e.clientY, e.currentTarget);
                setPathDraft({ start: pathStart.current, end: tile });
            }
            if (Math.abs(dx) + Math.abs(dy) > 3)
                drag.current.moved = true;
            if ((tool === "select" || tool === "navigate") && drag.current.moved) {
                setCamera(function (c) { return (__assign(__assign({}, c), { x: c.x + dx, y: c.y + dy })); });
                drag.current.x = e.clientX;
                drag.current.y = e.clientY;
            }
        }} onPointerUp={function (e) {
            var _a, _b, _c;
            var rect = e.currentTarget.getBoundingClientRect();
            var sx = e.clientX - rect.left, sy = e.clientY - rect.top;
            if (tool === "path") {
                var start = (_a = pathStart.current) !== null && _a !== void 0 ? _a : pointerTile(e.clientX, e.clientY, e.currentTarget);
                var end = pointerTile(e.clientX, e.clientY, e.currentTarget);
                var existing_2 = new Set(paths.map(function (path) { return "".concat(path.x, ",").concat(path.y); }));
                var result = buildPathLine(straightTiles(start, end).filter(function (tile) { return !existing_2.has("".concat(tile.x, ",").concat(tile.y)); }));
                setMessage(result.ok ? "".concat(result.built, " path tile").concat(result.built === 1 ? "" : "s", " built \u00B7 ").concat((0, theme_1.fmtMoney)(result.built * infrastructure_1.CAMPUS_PATH_COST), ".") : (_b = result.reason) !== null && _b !== void 0 ? _b : "Path cannot be built there.");
                setPathDraft(null);
                pathStart.current = null;
            }
            else if (!drag.current.moved) {
                if (tool === "select" || tool === "navigate") {
                    var r = pickRoomAtScreen(sx, sy);
                    setSelectedId((_c = r === null || r === void 0 ? void 0 : r.id) !== null && _c !== void 0 ? _c : null);
                    setMessage(r ? "".concat(r.name, " selected.") : "Empty parcel. Use Build to extend paths or place a connected facility.");
                }
                else {
                    var t = pointerTile(e.clientX, e.clientY, e.currentTarget);
                    place(tool, t.x, t.y);
                }
            }
            drag.current.active = false;
        }} style={{ display: "block", cursor: tool === "select" || tool === "navigate" ? "grab" : "crosshair", touchAction: "none" }}/>

      <div style={{ position: "absolute", left: compact ? 7 : 14, top: compact ? 7 : 14, right: compact ? 7 : undefined, display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap", maxWidth: compact ? "none" : "calc(100% - 160px)", zIndex: 6 }}>
        <button style={__assign(__assign({}, theme_1.ctrlBtn), { minHeight: compact ? 40 : undefined, background: tool === "select" ? theme_1.C.violet : "rgba(255,255,255,.94)", color: tool === "select" ? "white" : theme_1.C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" })} onClick={function () { setTool("select"); setMessage("Click a building footprint to inspect it. Drag empty ground to move the campus."); }}>↖ {compact ? "Map" : "Campus"}</button>
        <BuildMenu compact={compact} current={tool} world={world} cash={world.player.cash} hasOffice={rooms.some(function (r) { return r.kind === "office"; })} choose={function (kind) { setTool(kind); setSelectedId(null); setMessage(kind === "path" ? "Path mode: drag from any connected path tile. Blue = existing, green = new, red = blocked." : "Build mode: place ".concat(!rooms.some(function (r) { return r.kind === "office"; }) && kind === "office" ? "your 4-seat Founder Office I" : infrastructure_1.FACILITY_DEFS[kind].label.toLowerCase(), " beside the connected path.")); }}/>
        <button aria-label="Zoom out" style={__assign(__assign({}, theme_1.ctrlBtn), { minWidth: compact ? 40 : undefined, minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" })} onClick={function () { return setCamera(function (c) { return (__assign(__assign({}, c), { zoom: Math.max(.38, c.zoom - .08) })); }); }}>−</button>
        <button style={__assign(__assign({}, theme_1.ctrlBtn), { minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" })} onClick={resetCamera}>{compact ? "⌖" : "Center"}</button>
        <button aria-label="Zoom in" style={__assign(__assign({}, theme_1.ctrlBtn), { minWidth: compact ? 40 : undefined, minHeight: compact ? 40 : undefined, background: "rgba(255,255,255,.94)" })} onClick={function () { return setCamera(function (c) { return (__assign(__assign({}, c), { zoom: Math.min(1.15, c.zoom + .08) })); }); }}>＋</button>
      </div>
      {!compact && <div style={{ position: "absolute", right: 14, top: 14, background: "rgba(17,42,67,.88)", color: "white", borderRadius: 9, padding: "7px 10px", fontSize: 10, fontWeight: 800 }}>◈ {world.company} Campus</div>}
      {!compact && <div style={{ position: "absolute", left: 14, bottom: 14, maxWidth: 520, background: "rgba(255,255,255,.92)", backdropFilter: "blur(7px)", border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, padding: "7px 10px", color: theme_1.C.dim, fontSize: 10.5 }}>{message}</div>}
    </div>

    {selected && <div style={compact ? { position: "absolute", left: 6, right: 6, bottom: 6, top: "auto", width: "auto", maxHeight: "56%", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "rgba(255,255,255,.99)", border: "1px solid ".concat(theme_1.C.violet), borderRadius: "16px 16px 12px 12px", padding: 12, paddingBottom: "calc(12px + env(safe-area-inset-bottom))", boxShadow: "0 -12px 38px rgba(17,42,67,.25)", zIndex: 8 } : { position: "absolute", right: 18, top: 68, width: "min(390px,calc(100vw - 36px))", maxHeight: "calc(100vh - 158px)", overflowY: "auto", background: "rgba(255,255,255,.98)", border: "1px solid ".concat(theme_1.C.violet), borderRadius: 15, padding: 15, boxShadow: "0 18px 44px rgba(17,42,67,.24)", zIndex: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div><div style={{ color: theme_1.C.faint, fontSize: 8.5, fontWeight: 900, letterSpacing: .8 }}>FACILITY</div><div style={{ fontWeight: 900, fontSize: 16, marginTop: 2 }}>{(0, infrastructure_1.facilityDefForRoom)(selected).icon} {selected.name}</div><div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 3, lineHeight: 1.4 }}>{(0, infrastructure_1.facilityDefForRoom)(selected).description}</div></div>
        <button style={theme_1.ctrlBtn} onClick={function () { return setSelectedId(null); }}>✕</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginTop: 10 }}>
        <div style={facilityMetric}><span>Status</span><b style={{ color: (selectedStatus === null || selectedStatus === void 0 ? void 0 : selectedStatus.tone) === "critical" ? theme_1.C.red : (selectedStatus === null || selectedStatus === void 0 ? void 0 : selectedStatus.tone) === "warn" ? theme_1.C.amber : theme_1.C.violet }}>{selectedStatus === null || selectedStatus === void 0 ? void 0 : selectedStatus.label}</b></div>
        <div style={facilityMetric}><span>Footprint</span><b>{selected.w}×{selected.h}</b></div>
        <div style={facilityMetric}><span>Level</span><b>{selected.id === "founder-office" ? (0, infrastructure_1.officeStageForLevel)((_h = selected.upgradeLevel) !== null && _h !== void 0 ? _h : 1).label : "".concat((_j = selected.upgradeLevel) !== null && _j !== void 0 ? _j : 1, "/").concat((0, infrastructure_1.facilityDefForRoom)(selected).maxLevel)}</b></div>
      </div>
      <div style={{ marginTop: 6, padding: "8px 9px", borderRadius: 8, background: theme_1.C.panel2, fontSize: 10.5, display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: theme_1.C.dim }}>{selectedType === "training_center" ? "Training slots" : selected.kind === "office" ? "Staff seats" : selected.kind === "warehouse" ? "Storage capacity" : selected.kind === "factory" ? "Production / month" : "Supplier capacity / month"}</span><b>{selectedType === "training_center" ? "".concat(((_k = world.player.trainingPrograms) !== null && _k !== void 0 ? _k : []).filter(function (t) { return t.facilityRoomId === selected.id; }).length, " / ").concat(selected.capacity) : selected.kind === "office" ? "".concat(selected.assignedPersonnelIds.length + (selected.id === "founder-office" ? 1 : 0), " / ").concat(selected.capacity) : (0, theme_1.fmtNum)(selected.capacity)}</b></div>
      {selected.id === "founder-office" && world.brands.length === 0
                ? <button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 10 })} onClick={function () { return onNavigate("mgmt", "vision"); }}>Create your founding brand →</button>
                : <button style={__assign(__assign({}, theme_1.bigBtn), { width: "100%", marginTop: 10 })} onClick={function () { return openSelected(selected); }}>{selectedNav === null || selectedNav === void 0 ? void 0 : selectedNav.label} →</button>}
      <label style={labelStyle}>Facility name<input value={selected.name} onChange={function (e) { return updateSelected({ name: e.target.value }); }} style={inputStyle}/></label>

      {selected.kind === "office" && selectedType !== "training_center" && <>
        {selected.id === "founder-office" ? <div style={{ marginTop: 10, display: "grid", gap: 7 }}>
          <div style={__assign(__assign({}, slotStyle), { borderColor: "#9fc8e5" })}><div><b>Founder / CEO</b><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>Permanent leadership slot</div></div><span style={{ color: theme_1.C.green, fontWeight: 900 }}>FIXED</span></div>
          {Array.from({ length: Math.max(0, selected.capacity - 1) }).map(function (_, i) { var person = world.player.personnel.find(function (p) { return p.id === selected.assignedPersonnelIds[i]; }); return <div key={i} style={slotStyle}><div><b>{person ? person.name : "Open desk ".concat(i + 2)}</b><div style={{ color: theme_1.C.faint, fontSize: 9.5 }}>{person ? person.title : "Flexible startup seat"}</div></div><span style={{ color: person ? theme_1.C.green : theme_1.C.violet, fontWeight: 900 }}>{person ? "OCCUPIED" : "OPEN"}</span></div>; })}
        </div> : selectedType === "office" || selectedType === "executive_wing" ? <label style={labelStyle}>Assign team<select value={selected.team} onChange={function (e) { return updateSelected({ team: e.target.value, productKey: e.target.value === "product" ? selected.productKey : null }); }} style={inputStyle}>{Object.entries(TEAM_LABEL).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return <option key={k} value={k}>{v}</option>;
                })}</select></label> : <div style={{ marginTop: 10, padding: 9, borderRadius: 8, background: theme_1.C.panel2, color: theme_1.C.dim, fontSize: 10.5 }}><b style={{ color: theme_1.C.ink }}>Dedicated function:</b> {TEAM_LABEL[selected.team]}</div>}
        <div style={labelStyle}>Assigned employees
          <div style={{ display: "grid", gap: 6, marginTop: 3 }}>{world.player.personnel.filter(function (p) { return (0, infrastructure_1.roleFitsRoom)(p.role, selected); }).length ? world.player.personnel.filter(function (p) { return (0, infrastructure_1.roleFitsRoom)(p.role, selected); }).map(function (p) { var checked = selected.assignedPersonnelIds.includes(p.id); var otherRoom = rooms.find(function (r) { return r.id !== selected.id && r.assignedPersonnelIds.includes(p.id); }); var staffLimit = selected.id === "founder-office" ? Math.max(0, selected.capacity - 1) : selected.capacity; var full = !checked && selected.assignedPersonnelIds.length >= staffLimit; return <label key={p.id} title={full ? "This office has no free staff seats." : undefined} style={{ display: "flex", gap: 7, alignItems: "center", fontWeight: 400, opacity: full ? .5 : 1 }}><input disabled={full} type="checkbox" checked={checked} onChange={function () { return updateSelected({ assignedPersonnelIds: checked ? selected.assignedPersonnelIds.filter(function (id) { return id !== p.id; }) : __spreadArray(__spreadArray([], selected.assignedPersonnelIds, true), [p.id], false) }); }}/><span>{p.name} · {p.title}{otherRoom ? <span style={{ color: theme_1.C.amber }}> · currently {otherRoom.name}</span> : null}</span></label>; }) : <div style={{ color: theme_1.C.faint, fontWeight: 400 }}>No compatible employees. <button style={__assign(__assign({}, theme_1.ctrlBtn), { marginTop: 6 })} onClick={function () { return onNavigate("mgmt", "personnel"); }}>Search for people</button></div>}</div>
          {selected.assignedPersonnelIds.length >= (selected.id === "founder-office" ? selected.capacity - 1 : selected.capacity) && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 5 }}>↳ No free staff desks. Expand this office or build another compatible office.</div>}
        </div>
        {(selected.id === "founder-office" || selected.team === "product") && <>
          <label style={labelStyle}>Category mandate<select value={(_l = selected.productKey) !== null && _l !== void 0 ? _l : ""} onChange={function (e) { return updateSelected({ productKey: e.target.value || null, skuId: null, team: selected.id === "founder-office" ? "unassigned" : "product" }); }} style={inputStyle}><option value="">Choose product type…</option>{activeProductTypes.map(function (p) { var _a, _b; return <option key={p.key} value={p.key}>{p.label} · {(_b = (_a = industries_1.INDUSTRIES[p.industryId]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : p.industryId}</option>; })}</select></label>
          {(function () { var check = (0, capacity_1.canCreateProduct)(world); return <><button disabled={!check.ok} title={!check.ok ? check.reason : undefined} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 8, color: check.ok ? theme_1.C.violet : theme_1.C.faint, opacity: check.ok ? 1 : .5 })} onClick={openCreator}>＋ Design a product</button>{!check.ok && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 4 }}>↳ {check.reason}</div>}</>; })()}
        </>}
      </>}
      {selectedType === "training_center" && <div style={{ marginTop: 10, padding: 10, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, background: theme_1.C.panel2 }}><b style={{ fontSize: 11.5 }}>Employee upskilling</b><div style={{ color: theme_1.C.dim, fontSize: 10.5, marginTop: 4 }}>Training Room I supports 1 active course; Level II supports 3 and shortens programs. Start training from People → Employees.</div>{((_m = world.player.trainingPrograms) !== null && _m !== void 0 ? _m : []).filter(function (t) { return t.facilityRoomId === selected.id; }).map(function (t) { var _a; var p = world.player.personnel.find(function (x) { return x.id === t.personnelId; }); return <div key={t.id} style={{ marginTop: 7, fontSize: 10.5, display: "flex", justifyContent: "space-between", gap: 8 }}><span>{(_a = p === null || p === void 0 ? void 0 : p.name) !== null && _a !== void 0 ? _a : "Employee"}</span><b>{Math.ceil(t.daysLeft)}d</b></div>; })}</div>}
      {selected.kind === "warehouse" && <><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 9 }}>Storage: {((_o = selected.storageProfiles) !== null && _o !== void 0 ? _o : ["standard"]).map(function (id) { var _a, _b; return (_b = (_a = productCatalog_1.STORAGE_PROFILES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id; }).join(" + ")} · this building contributes <b style={{ color: theme_1.C.ink }}>{(0, theme_1.fmtNum)(selected.capacity)}</b> standard-space units to the pooled warehouse network.</div>
        <div style={{ marginTop: 10, padding: 9, border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, background: theme_1.C.panel2 }}>
          <b style={{ fontSize: 11 }}>Storage modules</b>
          <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 3 }}>Products with climate, chilled, frozen or secure storage requirements cannot be manufactured until a compatible module exists.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6, marginTop: 8 }}>{["climate", "refrigerated", "frozen", "secure"].map(function (profile) {
                    var _a;
                    var installed = ((_a = selected.storageProfiles) !== null && _a !== void 0 ? _a : ["standard"]).includes(profile);
                    var techGate = (0, infrastructure_1.storageModuleRequirement)(world, profile);
                    var peopleGate = (0, people_1.teamEffectiveness)(world, "operations") <= 0 ? "Seat a Sourcing / Operations specialist before installing specialized equipment." : null;
                    var gate = techGate !== null && techGate !== void 0 ? techGate : peopleGate;
                    var cost = infrastructure_1.WAREHOUSE_MODULE_COST[profile];
                    var affordable = world.player.cash >= cost;
                    return <button key={profile} disabled={installed || Boolean(gate) || !affordable} title={installed ? "Installed" : gate !== null && gate !== void 0 ? gate : (!affordable ? "Need ".concat((0, theme_1.fmtMoney)(cost - world.player.cash), " more cash.") : undefined)} onClick={function () { var _a; var r = installWarehouseModule(selected.id, profile); setMessage(r.ok ? "".concat(productCatalog_1.STORAGE_PROFILES[profile].infrastructureLabel, " installed.") : (_a = r.reason) !== null && _a !== void 0 ? _a : "Module installation failed."); }} style={__assign(__assign({}, theme_1.ctrlBtn), { textAlign: "left", opacity: installed || gate || !affordable ? .5 : 1 })}>
              <b>{installed ? "✓ " : ""}{productCatalog_1.STORAGE_PROFILES[profile].infrastructureLabel}</b><div style={{ color: gate ? theme_1.C.amber : theme_1.C.faint, fontSize: 9, marginTop: 2 }}>{installed ? "Installed" : gate !== null && gate !== void 0 ? gate : (0, theme_1.fmtMoney)(cost)}</div>
            </button>;
                })}</div>
        </div>
        <WarehouseMini world={world} products={warehouseProducts} utilization={warehouseUtil} totalCapacity={warehouseUnits} totalUsed={warehouseUsed}/></>}
      {selected.kind === "factory" && <><div style={{ color: theme_1.C.faint, fontSize: 10.5, marginTop: 9 }}>Lines: {((_p = selected.manufacturingFamilies) !== null && _p !== void 0 ? _p : []).map(function (id) { var _a, _b; return (_b = (_a = productCatalog_1.MANUFACTURING_FAMILIES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id; }).join(" + ") || "No production family configured"}</div>{(0, people_1.teamEffectiveness)(world, "operations") <= 0 && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 6 }}>↳ Factory engineering is idle until a Sourcing / Operations specialist is seated.</div>}<label style={labelStyle}>Production profile<select disabled={(0, people_1.teamEffectiveness)(world, "operations") <= 0} title={(0, people_1.teamEffectiveness)(world, "operations") <= 0 ? "Seat a Sourcing / Operations specialist before retooling a factory." : undefined} value="" onChange={function (e) { var _a; if (!e.target.value)
            return; var profile = (0, productCatalog_1.archetypeByKey)(e.target.value); var ok = retoolFactory(selected.id, e.target.value); setMessage(ok ? "".concat(selected.name, " retooled for ").concat((_a = profile === null || profile === void 0 ? void 0 : profile.label) !== null && _a !== void 0 ? _a : e.target.value, ".") : "Retooling requires an Operations specialist, an unlocked category and sufficient cash."); }} style={__assign(__assign({}, inputStyle), { opacity: (0, people_1.teamEffectiveness)(world, "operations") > 0 ? 1 : .5 })}><option value="">Retool factory for product…</option>{activeProductTypes.map(function (p) { return <option key={p.key} value={p.key}>{p.label} · {p.manufacturingFamilies.map(function (id) { var _a, _b; return (_b = (_a = productCatalog_1.MANUFACTURING_FAMILIES[id]) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : id; }).join(" + ")}</option>; })}</select></label><ActivityMini title="Owned production" skus={ownBatches} empty="No owned batches currently running."/></>}
      {selected.kind === "outsourcing" && <ActivityMini title="Supplier pipeline" skus={outsourceBatches} empty="No outsourced batches currently inbound."/>}
      <div style={{ marginTop: 12, borderTop: "1px solid ".concat(theme_1.C.line), paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><b style={{ fontSize: 11.5 }}>Expand / upgrade facility</b><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 2 }}>{selected.kind === "office" ? "Founder progression is I → II → III → IV. Specialist buildings have their own capped upgrade path." : "Capacity upgrades improve this facility without changing its current footprint."}</div></div>{selectedUpgrade ? <span style={{ color: theme_1.C.violet, fontWeight: 900, fontSize: 10 }}>{selected.kind === "office" ? "".concat(selectedUpgrade.currentLabel, " \u2192 ").concat(selectedUpgrade.nextLabel) : "L".concat(selectedUpgrade.currentLevel, " \u2192 L").concat(selectedUpgrade.nextLevel)}</span> : <span style={{ color: theme_1.C.green, fontWeight: 900, fontSize: 10 }}>MAX</span>}</div>
        {selectedUpgrade ? <><button disabled={Boolean(selectedUpgradeGate) || world.player.cash < selectedUpgrade.cost} title={selectedUpgradeGate !== null && selectedUpgradeGate !== void 0 ? selectedUpgradeGate : (world.player.cash < selectedUpgrade.cost ? "Need ".concat((0, theme_1.fmtMoney)(selectedUpgrade.cost - world.player.cash), " more cash.") : undefined)} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 8, borderColor: theme_1.C.violet, color: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? theme_1.C.violet : theme_1.C.faint, opacity: !selectedUpgradeGate && world.player.cash >= selectedUpgrade.cost ? 1 : .5 })} onClick={function () { var _a; var r = upgradeRoom(selected.id); setMessage(r.ok ? "".concat(selected.name, " expanded to level ").concat(selectedUpgrade.nextLevel, ".") : (_a = r.reason) !== null && _a !== void 0 ? _a : "Upgrade failed."); }}>{selectedType === "training_center" ? "Upgrade \u00B7 +".concat((0, theme_1.fmtNum)(selectedUpgrade.capacityGain), " training slots \u00B7 ").concat((0, theme_1.fmtMoney)(selectedUpgrade.cost)) : selected.kind === "office" ? "Expand \u00B7 +".concat((0, theme_1.fmtNum)(selectedUpgrade.capacityGain), " seats \u00B7 ").concat((0, theme_1.fmtMoney)(selectedUpgrade.cost)) : "Upgrade \u00B7 +".concat((0, theme_1.fmtNum)(selectedUpgrade.capacityGain), " capacity \u00B7 ").concat((0, theme_1.fmtMoney)(selectedUpgrade.cost))}</button>{selectedUpgradeGate ? <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 5 }}>↳ {selectedUpgradeGate}</div> : world.player.cash < selectedUpgrade.cost && <div style={{ color: theme_1.C.amber, fontSize: 9.5, marginTop: 5 }}>↳ Need {(0, theme_1.fmtMoney)(selectedUpgrade.cost - world.player.cash)} more cash for this upgrade.</div>}</> : <div style={{ color: theme_1.C.faint, fontSize: 10, marginTop: 6 }}>This facility is fully upgraded.</div>}
      </div>
      {selected.id !== "founder-office" && <button disabled={selectedType === "training_center" && ((_q = world.player.trainingPrograms) !== null && _q !== void 0 ? _q : []).some(function (t) { return t.facilityRoomId === selected.id; })} title={selectedType === "training_center" && ((_r = world.player.trainingPrograms) !== null && _r !== void 0 ? _r : []).some(function (t) { return t.facilityRoomId === selected.id; }) ? "Finish active training before demolishing this facility." : undefined} style={__assign(__assign({}, theme_1.ctrlBtn), { width: "100%", marginTop: 12, color: theme_1.C.red, opacity: selectedType === "training_center" && ((_s = world.player.trainingPrograms) !== null && _s !== void 0 ? _s : []).some(function (t) { return t.facilityRoomId === selected.id; }) ? .45 : 1 })} onClick={function () { demolishRoom(selected.id); setSelectedId(null); }}>Demolish facility</button>}
    </div>}
  </div>;
}
function BuildMenu(_a) {
    var current = _a.current, cash = _a.cash, choose = _a.choose, _b = _a.compact, compact = _b === void 0 ? false : _b, hasOffice = _a.hasOffice, world = _a.world;
    var _c = (0, react_1.useState)(false), open = _c[0], setOpen = _c[1];
    var activeBuild = current !== "select" && current !== "navigate";
    return <div style={{ position: "relative" }}>
    <button style={__assign(__assign({}, theme_1.ctrlBtn), { minHeight: compact ? 40 : undefined, background: open || activeBuild ? theme_1.C.violet : "rgba(255,255,255,.94)", color: open || activeBuild ? "white" : theme_1.C.dim, boxShadow: "0 4px 14px rgba(30,41,59,.12)" })} onClick={function () { return setOpen(function (v) { return !v; }); }}>＋ Build</button>
    {open && <div style={{ position: "absolute", left: 0, top: compact ? 44 : 38, width: compact ? "min(310px,calc(100vw - 20px))" : 310, maxHeight: compact ? "52vh" : undefined, overflowY: compact ? "auto" : undefined, background: "white", border: "1px solid ".concat(theme_1.C.line), borderRadius: 11, padding: 7, boxShadow: "0 12px 32px rgba(17,42,67,.22)", zIndex: 12 }}>
      <button disabled={cash < infrastructure_1.CAMPUS_PATH_COST} onClick={function () { choose("path"); setOpen(false); }} style={{ width: "100%", border: 0, background: current === "path" ? theme_1.C.panel2 : "transparent", padding: 9, textAlign: "left", borderRadius: 7, cursor: cash >= infrastructure_1.CAMPUS_PATH_COST ? "pointer" : "default", color: theme_1.C.ink, fontSize: 11, opacity: cash >= infrastructure_1.CAMPUS_PATH_COST ? 1 : .45 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>▰ Path</b><span style={{ color: theme_1.C.faint }}>{(0, theme_1.fmtMoney)(infrastructure_1.CAMPUS_PATH_COST)}/tile</span></div><div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 2 }}>1×1 · extend from the entrance · buildings must touch connected paths</div></button>
      {infrastructure_1.BUILDABLE_FACILITY_IDS.map(function (kind) {
                var d = infrastructure_1.FACILITY_DEFS[kind];
                var affordable = cash >= d.buildCost;
                var founder = kind === "office" && !hasOffice;
                var gate = founder ? null : (0, infrastructure_1.facilityBuildRequirement)(world, kind);
                var available = affordable && !gate;
                var capacityLabel = d.kind === "office" ? (kind === "training_center" ? "".concat(d.capacity, " training slot") : "".concat(founder ? 4 : d.capacity, " positions")) : "".concat((0, theme_1.fmtNum)(d.capacity), " capacity");
                return <button disabled={!available} title={gate !== null && gate !== void 0 ? gate : (!affordable ? "Need ".concat((0, theme_1.fmtMoney)(d.buildCost - cash), " more cash.") : undefined)} key={kind} onClick={function () { choose(kind); setOpen(false); }} style={{ width: "100%", border: 0, background: current === kind ? theme_1.C.panel2 : "transparent", padding: 9, textAlign: "left", borderRadius: 7, cursor: available ? "pointer" : "default", color: theme_1.C.ink, fontSize: 11, opacity: available ? 1 : .45 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><b>{d.icon} {founder ? "Founder Office I" : d.label}</b><span style={{ color: theme_1.C.faint }}>{(0, theme_1.fmtMoney)(d.buildCost)}</span></div><div style={{ color: available ? theme_1.C.faint : theme_1.C.amber, fontSize: 9.5, marginTop: 2 }}>{d.size[0]}×{d.size[1]} · {capacityLabel} · {(0, theme_1.fmtMoney)(d.monthlyCost)}/mo{founder ? " · Founder + 3 staff desks" : ""}{gate ? " \u00B7 ".concat(gate) : !affordable ? " \u00B7 need ".concat((0, theme_1.fmtMoney)(d.buildCost - cash), " more cash") : ""}</div></button>;
            })}
    </div>}
  </div>;
}
function WarehouseMini(_a) {
    var world = _a.world, products = _a.products, utilization = _a.utilization, totalCapacity = _a.totalCapacity, totalUsed = _a.totalUsed;
    return <div style={{ marginTop: 12, borderTop: "1px solid ".concat(theme_1.C.line), paddingTop: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><b>Warehouse network</b><span style={{ color: utilization > .9 ? theme_1.C.red : theme_1.C.dim }}>{(0, theme_1.fmtNum)(totalUsed)} / {(0, theme_1.fmtNum)(totalCapacity)} · {Math.round(utilization * 100)}%</span></div>
    {products.length === 0 ? <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 7 }}>The warehouse is currently empty.</div> : products.map(function (sku) {
            var _a, _b;
            var total = sku.inventory + ((_a = sku.mfgBatchSize) !== null && _a !== void 0 ? _a : 0);
            return <div key={sku.id} style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 7, alignItems: "center", marginTop: 8 }}>
        <div style={{ width: 24, height: 28, borderRadius: 5, background: (0, brands_1.brandById)(world, sku.brandId).color, border: "1px solid rgba(30,41,59,.15)", display: "grid", placeItems: "center", color: "white", fontSize: 8, fontWeight: 900, boxShadow: "inset 0 5px 0 rgba(255,255,255,.18)" }}>{sku.name.slice(0, 2).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sku.name}</div><div style={{ height: 4, background: theme_1.C.grid, borderRadius: 3, marginTop: 4 }}><div style={{ width: "".concat(Math.min(100, total / Math.max(1, products[0].inventory + ((_b = products[0].mfgBatchSize) !== null && _b !== void 0 ? _b : 0)) * 100), "%"), height: "100%", background: (0, brands_1.brandById)(world, sku.brandId).color, borderRadius: 3 }}/></div></div>
        <b style={{ fontSize: 10.5 }}>{(0, theme_1.fmtNum)(total)}</b>
      </div>;
        })}
  </div>;
}
function ActivityMini(_a) {
    var title = _a.title, skus = _a.skus, empty = _a.empty;
    return <div style={{ marginTop: 12, borderTop: "1px solid ".concat(theme_1.C.line), paddingTop: 10 }}>
    <b style={{ fontSize: 11.5 }}>{title}</b>
    {!skus.length ? <div style={{ color: theme_1.C.faint, fontSize: 11, marginTop: 7 }}>{empty}</div> : skus.slice(0, 5).map(function (sku) { var _a; return <div key={sku.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 7, fontSize: 11 }}><span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku.name}</span><b>{(0, theme_1.fmtNum)((_a = sku.mfgBatchSize) !== null && _a !== void 0 ? _a : 0)} · {Math.max(0, sku.mfgDaysLeft)}d</b></div>; })}
  </div>;
}
function CampusKpi(_a) {
    var icon = _a.icon, label = _a.label, value = _a.value, detail = _a.detail, tone = _a.tone;
    return <div style={{ background: theme_1.C.panel, border: "1px solid ".concat(tone === "warn" ? "#fed7aa" : theme_1.C.line), borderRadius: 11, padding: "10px 12px", minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span style={{ color: theme_1.C.dim, fontSize: 10.5, fontWeight: 700 }}>{icon} {label}</span><b style={{ fontSize: 14, color: tone === "warn" ? theme_1.C.red : theme_1.C.ink }}>{value}</b></div>
    <div style={{ color: theme_1.C.faint, fontSize: 9.5, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{detail}</div>
  </div>;
}
function FlowStep(_a) {
    var ok = _a.ok, label = _a.label, detail = _a.detail;
    return <div style={{ border: "1px solid ".concat(ok ? "#bbf7d0" : "#fecaca"), background: ok ? "#f0fdf4" : "#fef2f2", borderRadius: 8, padding: "7px 8px" }}><div style={{ color: ok ? "#166534" : "#991b1b", fontWeight: 700 }}>{ok ? "✓" : "!"} {label}</div><div style={{ color: theme_1.C.faint, marginTop: 2 }}>{detail}</div></div>;
}
function Metric(_a) {
    var label = _a.label, value = _a.value;
    return <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid ".concat(theme_1.C.line), fontSize: 12, gap: 12 }}><span style={{ color: theme_1.C.dim }}>{label}</span><b style={{ textAlign: "right" }}>{value}</b></div>;
}
var facilityMetric = { display: "grid", gap: 3, padding: "7px 8px", borderRadius: 8, background: theme_1.C.panel2, fontSize: 9.5, color: theme_1.C.dim };
var labelStyle = { display: "grid", gap: 5, fontSize: 12, color: theme_1.C.dim, marginTop: 10, fontWeight: 600 };
var inputStyle = { width: "100%", boxSizing: "border-box", border: "1px solid ".concat(theme_1.C.line), borderRadius: 8, padding: "8px 9px", background: "white", color: theme_1.C.ink, fontSize: 12 };
var slotStyle = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 9px", border: "1px solid ".concat(theme_1.C.line), borderRadius: 9, background: theme_1.C.panel2, fontSize: 10.5 };
