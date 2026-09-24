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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMPUS_ASSET_GROUPS = exports.CAMPUS_ASSETS = void 0;
exports.roomCampusAssetId = roomCampusAssetId;
exports.roomCampusAsset = roomCampusAsset;
exports.campusAssetImage = campusAssetImage;
var infrastructure_1 = require("../../engine/infrastructure");
var BASE_URL = (_b = (_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.BASE_URL) !== null && _b !== void 0 ? _b : "/";
var path = function (file) { return "".concat(BASE_URL, "assets/campus/").concat(file); };
var v2 = function (file) { return path("buildings/v2/".concat(file)); };
exports.CAMPUS_ASSETS = {
    founder_office_1: { id: "founder_office_1", label: "Founder Office I", category: "building", file: v2("founder_office_1.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: .78, compatibleKinds: ["office"], notes: "Deliberately visually modest so campus growth is obvious." },
    founder_office_2: { id: "founder_office_2", label: "Founder Office II", category: "building", file: v2("founder_office_2.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.00, compatibleKinds: ["office"] },
    founder_office_3: { id: "founder_office_3", label: "Founder Office III", category: "building", file: v2("founder_office_3.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.10, compatibleKinds: ["office"] },
    founder_office_4: { id: "founder_office_4", label: "Founder Office IV", category: "building", file: v2("founder_office_4.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.17, compatibleKinds: ["office"] },
    warehouse_small: { id: "warehouse_small", label: "Warehouse Small", category: "building", file: v2("warehouse_small.png"), footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .93 }, scale: 1.06, compatibleKinds: ["warehouse"] },
    warehouse_medium: { id: "warehouse_medium", label: "Warehouse Medium / Large", category: "building", file: v2("warehouse_medium.png"), footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.12, compatibleKinds: ["warehouse"] },
    research_center: { id: "research_center", label: "Research Center", category: "building", file: v2("research_center.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.04, compatibleKinds: ["office"] },
    beauty_center: { id: "beauty_center", label: "Beauty Center", category: "building", file: v2("beauty_center.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.04, compatibleKinds: ["office"] },
    toy_center: { id: "toy_center", label: "Toy Center", category: "building", file: v2("toy_center.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.04, compatibleKinds: ["office"] },
    training_center: { id: "training_center", label: "Training Room", category: "building", file: v2("training_center.png"), footprint: { w: 3, h: 3 }, anchor: { x: .5, y: .93 }, scale: 1.02, compatibleKinds: ["office"] },
    factory: { id: "factory", label: "Factory", category: "building", file: path("buildings/factory.png"), footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.16, compatibleKinds: ["factory"] },
    office_expansion: { id: "office_expansion", label: "Specialist Office", category: "expansion", file: v2("founder_office_1.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .94 }, scale: .92, compatibleKinds: ["office"] },
    warehouse_expansion: { id: "warehouse_expansion", label: "Warehouse Expansion", category: "expansion", file: v2("warehouse_medium.png"), footprint: { w: 6, h: 4 }, anchor: { x: .5, y: .94 }, scale: 1.08, compatibleKinds: ["warehouse"] },
    factory_upgrade: { id: "factory_upgrade", label: "Factory Upgrade", category: "expansion", file: path("expansions/factory_upgrade.png"), footprint: { w: 4, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.15, compatibleKinds: ["factory"] },
    loading_dock: { id: "loading_dock", label: "Loading Dock", category: "expansion", file: path("expansions/loading_dock.png"), footprint: { w: 3, h: 2 }, anchor: { x: .5, y: .965 }, scale: 1.16, compatibleKinds: ["outsourcing", "warehouse"] },
    parking_signage: { id: "parking_signage", label: "Parking & Signage", category: "decor", file: path("decor/parking_signage.png"), footprint: { w: 4, h: 3 }, anchor: { x: .5, y: .965 }, scale: 1.08 },
    landscaping: { id: "landscaping", label: "Landscaping Plaza", category: "decor", file: path("decor/landscaping.png"), footprint: { w: 4, h: 4 }, anchor: { x: .5, y: .965 }, scale: 1.08 },
};
exports.CAMPUS_ASSET_GROUPS = {
    buildings: ["founder_office_1", "founder_office_2", "founder_office_3", "founder_office_4", "warehouse_small", "warehouse_medium", "research_center", "beauty_center", "toy_center", "training_center", "factory"],
    expansions: ["office_expansion", "warehouse_expansion", "factory_upgrade", "loading_dock"],
    decor: ["parking_signage", "landscaping"],
};
function roomCampusAssetId(_world, room) {
    var _a;
    var level = Math.max(1, (_a = room.upgradeLevel) !== null && _a !== void 0 ? _a : 1);
    if (room.id === "founder-office")
        return "founder_office_".concat(Math.min(4, level));
    var type = (0, infrastructure_1.roomFacilityType)(room);
    if (type === "beauty_center")
        return "beauty_center";
    if (type === "toy_center")
        return "toy_center";
    if (type === "research_center")
        return "research_center";
    if (type === "training_center")
        return "training_center";
    if (type === "warehouse" || type === "cold_storage" || type === "distribution_hub")
        return level <= 1 && type === "warehouse" ? "warehouse_small" : "warehouse_medium";
    if (type === "factory")
        return "factory";
    if (type === "outsourcing")
        return "loading_dock";
    return "office_expansion";
}
function roomCampusAsset(world, room) {
    var _a;
    var base = exports.CAMPUS_ASSETS[roomCampusAssetId(world, room)];
    var level = Math.max(1, (_a = room.upgradeLevel) !== null && _a !== void 0 ? _a : 1);
    var type = (0, infrastructure_1.roomFacilityType)(room);
    // Founder stages have bespoke art. Other upgradeable facilities keep their
    // authored sprite but grow slightly on the map so upgrades still read
    // visually until a later art pass adds a unique sprite for every tier.
    if (room.id === "founder-office")
        return base;
    if (type === "warehouse" && level >= 3)
        return __assign(__assign({}, base), { scale: base.scale * 1.10 });
    if (["beauty_center", "toy_center", "research_center", "training_center", "cold_storage", "distribution_hub"].includes(type) && level > 1)
        return __assign(__assign({}, base), { scale: base.scale * (1 + Math.min(2, level - 1) * .06) });
    return base;
}
var imageCache = new Map();
var imageLoadHooked = new Set();
function campusAssetImage(asset, onReady) {
    if (typeof Image === "undefined")
        return null;
    var image = imageCache.get(asset.file);
    if (!image) {
        image = new Image();
        image.decoding = "async";
        image.src = asset.file;
        imageCache.set(asset.file, image);
    }
    if (!image.complete && onReady && !imageLoadHooked.has(asset.file)) {
        imageLoadHooked.add(asset.file);
        image.addEventListener("load", function () { imageLoadHooked.delete(asset.file); onReady(); }, { once: true });
    }
    return image;
}
