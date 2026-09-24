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
exports.adjacentTiles = exports.STARTER_ENTRANCE_PATH = exports.CAMPUS_ENTRANCE = exports.CAMPUS_PATH_COST = exports.CAMPUS_MAP_SIZE = exports.WAREHOUSE_MODULE_COST = exports.BUILDABLE_FACILITY_IDS = exports.FACILITY_DEFS = exports.OPERATING_ROOM_DEFS = void 0;
exports.roomFacilityType = roomFacilityType;
exports.facilityDefForRoom = facilityDefForRoom;
exports.founderOffice = founderOffice;
exports.founderOfficeLevel = founderOfficeLevel;
exports.facilityRooms = facilityRooms;
exports.highestFacilityLevel = highestFacilityLevel;
exports.hasFacility = hasFacility;
exports.facilityBuildRequirement = facilityBuildRequirement;
exports.storageModuleRequirement = storageModuleRequirement;
exports.campusPathConnectedSet = campusPathConnectedSet;
exports.roomTouchesConnectedPath = roomTouchesConnectedPath;
exports.canBuildCampusPath = canBuildCampusPath;
exports.roomSupportsProductDesign = roomSupportsProductDesign;
exports.roleFitsRoom = roleFitsRoom;
exports.officeStageForLevel = officeStageForLevel;
exports.facilityUpgradeQuote = facilityUpgradeQuote;
exports.facilityUpgradeRequirement = facilityUpgradeRequirement;
exports.departmentTierFromSeats = departmentTierFromSeats;
exports.assignedSeatCount = assignedSeatCount;
exports.syncDerivedDepartments = syncDerivedDepartments;
exports.roleFitsTeam = roleFitsTeam;
exports.openSeatCountForRole = openSeatCountForRole;
exports.sanitizeOperatingRooms = sanitizeOperatingRooms;
exports.roomOperatingCostPerQuarter = roomOperatingCostPerQuarter;
exports.trainingCapacity = trainingCapacity;
exports.researchCenterLevel = researchCenterLevel;
exports.productCenterTypeForIndustry = productCenterTypeForIndustry;
exports.productCenterLevel = productCenterLevel;
exports.facilityEffectMultiplier = facilityEffectMultiplier;
exports.OPERATING_ROOM_DEFS = {
    office: { label: "Office", size: [4, 4], buildCost: 25000, monthlyCost: 6000, capacity: 4 },
    factory: { label: "Factory", size: [6, 4], buildCost: 200000, monthlyCost: 18000, capacity: 100000 },
    warehouse: { label: "Warehouse", size: [6, 4], buildCost: 70000, monthlyCost: 8000, capacity: 50000 },
    outsourcing: { label: "Sourcing Office", size: [3, 2], buildCost: 40000, monthlyCost: 7000, capacity: 150000 },
};
exports.FACILITY_DEFS = {
    office: { id: "office", kind: "office", label: "General Office", icon: "🏢", size: [4, 4], buildCost: 25000, monthlyCost: 6000, capacity: 4, team: "unassigned", repeatable: true, maxLevel: 3, group: "Core", description: "Flexible office space. The first one becomes the Founder Office." },
    beauty_center: { id: "beauty_center", kind: "office", label: "Beauty Center", icon: "✨", size: [4, 4], buildCost: 140000, monthlyCost: 14000, capacity: 4, team: "product", repeatable: true, maxLevel: 2, group: "Product", description: "Dedicated skincare and beauty product-development center. Level II supports flagship AAA teams." },
    toy_center: { id: "toy_center", kind: "office", label: "Toy Center", icon: "🧸", size: [4, 4], buildCost: 140000, monthlyCost: 14000, capacity: 4, team: "product", repeatable: true, maxLevel: 2, group: "Product", description: "Dedicated toy-design center. Level II supports flagship AAA teams." },
    research_center: { id: "research_center", kind: "office", label: "Research Center", icon: "🔬", size: [4, 4], buildCost: 180000, monthlyCost: 18000, capacity: 2, team: "innovation", repeatable: false, maxLevel: 3, group: "Product", description: "Home for the CIO and R&D team. Required for company research; upgrades accelerate research and unlock flagship development infrastructure." },
    training_center: { id: "training_center", kind: "office", label: "Training Room", icon: "🎓", size: [3, 3], buildCost: 45000, monthlyCost: 5000, capacity: 1, team: "unassigned", repeatable: true, maxLevel: 2, group: "People", description: "Runs employee upskilling programs. Upgrade for more simultaneous trainees and faster courses." },
    brand_studio: { id: "brand_studio", kind: "office", label: "Brand Studio", icon: "🎨", size: [3, 3], buildCost: 60000, monthlyCost: 7000, capacity: 2, team: "marketing", repeatable: false, maxLevel: 2, group: "Commercial", description: "Creative brand hub. Improves the efficiency of long-term brand building." },
    hr_office: { id: "hr_office", kind: "office", label: "HR Office", icon: "🧑‍💼", size: [3, 3], buildCost: 80000, monthlyCost: 8000, capacity: 2, team: "strategy", repeatable: false, maxLevel: 2, group: "People", description: "Formal people operations. Speeds external recruiting searches." },
    marketing_office: { id: "marketing_office", kind: "office", label: "Marketing Office", icon: "📣", size: [4, 3], buildCost: 95000, monthlyCost: 10000, capacity: 4, team: "marketing", repeatable: false, maxLevel: 2, group: "Commercial", description: "Dedicated campaign team space. Improves paid marketing execution." },
    logistics_office: { id: "logistics_office", kind: "office", label: "Logistics Office", icon: "🚚", size: [3, 3], buildCost: 90000, monthlyCost: 9000, capacity: 3, team: "operations", repeatable: false, maxLevel: 2, group: "Operations", description: "Coordinates suppliers and freight. Shortens production lead times and improves external capacity." },
    consumer_insights: { id: "consumer_insights", kind: "office", label: "Consumer Insights Lab", icon: "🧭", size: [4, 3], buildCost: 160000, monthlyCost: 15000, capacity: 3, team: "strategy", repeatable: false, maxLevel: 2, group: "Commercial", description: "Dedicated market-research facility. Speeds commissioned studies and product diagnosis." },
    warehouse: { id: "warehouse", kind: "warehouse", label: "Warehouse", icon: "📦", size: [6, 4], buildCost: 70000, monthlyCost: 8000, capacity: 50000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Standard finished-goods storage. Build several or expand each from Small to Medium to Large." },
    cold_storage: { id: "cold_storage", kind: "warehouse", label: "Cold Storage", icon: "❄️", size: [5, 4], buildCost: 210000, monthlyCost: 18000, capacity: 60000, team: "operations", repeatable: true, maxLevel: 2, group: "Operations", description: "Purpose-built climate, refrigerated and frozen storage for temperature-sensitive products." },
    distribution_hub: { id: "distribution_hub", kind: "warehouse", label: "Distribution Hub", icon: "🚛", size: [7, 5], buildCost: 650000, monthlyCost: 42000, capacity: 250000, team: "operations", repeatable: false, maxLevel: 2, group: "Operations", description: "Late-game logistics hub with huge storage and faster inbound/outbound coordination." },
    factory: { id: "factory", kind: "factory", label: "Factory", icon: "🏭", size: [6, 4], buildCost: 200000, monthlyCost: 18000, capacity: 100000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Owned manufacturing capacity. Requires Owned Manufacturing research." },
    outsourcing: { id: "outsourcing", kind: "outsourcing", label: "Sourcing Office", icon: "🤝", size: [3, 2], buildCost: 40000, monthlyCost: 7000, capacity: 150000, team: "operations", repeatable: true, maxLevel: 3, group: "Operations", description: "Dedicated supplier-management capacity for outsourced production." },
    executive_wing: { id: "executive_wing", kind: "office", label: "Executive Wing", icon: "🏛️", size: [4, 4], buildCost: 480000, monthlyCost: 32000, capacity: 8, team: "unassigned", repeatable: false, maxLevel: 2, group: "Core", description: "Late-game leadership space. Adds flexible senior seats and a small company-wide management bonus." },
};
exports.BUILDABLE_FACILITY_IDS = [
    "office", "training_center", "brand_studio",
    "beauty_center", "toy_center", "research_center",
    "hr_office", "marketing_office", "logistics_office", "consumer_insights",
    "warehouse", "cold_storage", "distribution_hub", "outsourcing", "factory", "executive_wing",
];
exports.WAREHOUSE_MODULE_COST = {
    climate: 90000,
    refrigerated: 180000,
    frozen: 300000,
    secure: 220000,
};
function roomFacilityType(room) {
    if (room.id === "founder-office")
        return "office";
    if (room.facilityType)
        return room.facilityType;
    if (room.kind === "warehouse")
        return "warehouse";
    if (room.kind === "factory")
        return "factory";
    if (room.kind === "outsourcing")
        return "outsourcing";
    return "office";
}
function facilityDefForRoom(room) { return exports.FACILITY_DEFS[roomFacilityType(room)]; }
function founderOffice(w) { return w.player.operatingRooms.find(function (r) { return r.id === "founder-office"; }); }
function founderOfficeLevel(w) { var _a, _b; return Math.max(0, (_b = (_a = founderOffice(w)) === null || _a === void 0 ? void 0 : _a.upgradeLevel) !== null && _b !== void 0 ? _b : (founderOffice(w) ? 1 : 0)); }
function facilityRooms(w, type) { return w.player.operatingRooms.filter(function (r) { return roomFacilityType(r) === type && !(r.id === "founder-office" && type !== "office"); }); }
function highestFacilityLevel(w, type) { return Math.max.apply(Math, __spreadArray([0], facilityRooms(w, type).filter(function (r) { return r.id !== "founder-office" || type === "office"; }).map(function (r) { var _a; return (_a = r.upgradeLevel) !== null && _a !== void 0 ? _a : 1; }), false)); }
function hasFacility(w, type, minLevel) {
    if (minLevel === void 0) { minLevel = 1; }
    return facilityRooms(w, type).some(function (r) { var _a; return ((_a = r.upgradeLevel) !== null && _a !== void 0 ? _a : 1) >= minLevel && (type !== "office" || r.id !== "founder-office"); });
}
function facilityBuildRequirement(w, type) {
    var _a, _b, _c, _d, _e, _f;
    var def = exports.FACILITY_DEFS[type];
    var founder = founderOffice(w);
    var founderLevel = founderOfficeLevel(w);
    if (type !== "office" && !founder)
        return "Build the Founder Office first.";
    if (!def.repeatable && facilityRooms(w, type).some(function (r) { return r.id !== "founder-office"; }))
        return "".concat(def.label, " is unique; upgrade the existing facility instead.");
    if (["beauty_center", "toy_center", "research_center", "hr_office", "marketing_office", "logistics_office"].includes(type) && founderLevel < 2)
        return "Expand the Founder Office to Level II first.";
    if (type === "consumer_insights" && founderLevel < 3)
        return "Reach Founder Office III first.";
    if (["distribution_hub", "executive_wing"].includes(type) && founderLevel < 4)
        return "Reach Founder Office IV first.";
    if (type === "beauty_center" && ((_b = (_a = w.player.businesses) === null || _a === void 0 ? void 0 : _a.skincare) === null || _b === void 0 ? void 0 : _b.status) !== "active")
        return "Activate the Skincare business first.";
    if (type === "toy_center" && ((_d = (_c = w.player.businesses) === null || _c === void 0 ? void 0 : _c.toys) === null || _d === void 0 ? void 0 : _d.status) !== "active")
        return "Activate the Toys business first.";
    var researched = new Set((_f = (_e = w.player.research) === null || _e === void 0 ? void 0 : _e.completed) !== null && _f !== void 0 ? _f : []);
    if (type === "factory" && !researched.has("owned_manufacturing"))
        return "Research Owned Manufacturing first.";
    if (type === "outsourcing" && !researched.has("supplier_management"))
        return "Research Supplier Management first.";
    if (type === "cold_storage" && !researched.has("specialized_storage"))
        return "Research Specialized Storage first.";
    if (type === "consumer_insights" && !researched.has("market_intelligence"))
        return "Research Market Intelligence first.";
    if (["distribution_hub", "executive_wing"].includes(type) && !researched.has("corporate_hq"))
        return "Research Corporate Headquarters first.";
    return null;
}
function storageModuleRequirement(w, profile) {
    var _a, _b;
    if (profile === "standard")
        return null;
    if (!((_b = (_a = w.player.research) === null || _a === void 0 ? void 0 : _a.completed) !== null && _b !== void 0 ? _b : []).includes("specialized_storage"))
        return "Research Specialized Storage before installing warehouse modules.";
    return null;
}
exports.CAMPUS_MAP_SIZE = 48;
exports.CAMPUS_PATH_COST = 250;
exports.CAMPUS_ENTRANCE = { x: 2, y: 44 };
exports.STARTER_ENTRANCE_PATH = [exports.CAMPUS_ENTRANCE, { x: 3, y: 44 }];
var tileKey = function (x, y) { return "".concat(x, ",").concat(y); };
var adjacentTiles = function (x, y) { return [
    { x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 },
]; };
exports.adjacentTiles = adjacentTiles;
function campusPathConnectedSet(w) {
    var _a;
    var paths = (_a = w.player.campusPaths) !== null && _a !== void 0 ? _a : [];
    var all = new Set(paths.map(function (p) { return tileKey(p.x, p.y); }));
    var start = tileKey(exports.CAMPUS_ENTRANCE.x, exports.CAMPUS_ENTRANCE.y);
    var seen = new Set();
    if (!all.has(start))
        return seen;
    var queue = [exports.CAMPUS_ENTRANCE];
    seen.add(start);
    while (queue.length) {
        var cur = queue.shift();
        for (var _i = 0, _b = (0, exports.adjacentTiles)(cur.x, cur.y); _i < _b.length; _i++) {
            var n = _b[_i];
            var k = tileKey(n.x, n.y);
            if (all.has(k) && !seen.has(k)) {
                seen.add(k);
                queue.push(n);
            }
        }
    }
    return seen;
}
function roomTouchesConnectedPath(w, room) {
    var connected = campusPathConnectedSet(w);
    for (var x = room.x; x < room.x + room.w; x++) {
        if (connected.has(tileKey(x, room.y - 1)) || connected.has(tileKey(x, room.y + room.h)))
            return true;
    }
    for (var y = room.y; y < room.y + room.h; y++) {
        if (connected.has(tileKey(room.x - 1, y)) || connected.has(tileKey(room.x + room.w, y)))
            return true;
    }
    return false;
}
function canBuildCampusPath(w, tile) {
    var _a;
    if (tile.x < 0 || tile.y < 0 || tile.x >= exports.CAMPUS_MAP_SIZE || tile.y >= exports.CAMPUS_MAP_SIZE)
        return { ok: false, reason: "Path must stay inside the campus." };
    if (((_a = w.player.campusPaths) !== null && _a !== void 0 ? _a : []).some(function (p) { return p.x === tile.x && p.y === tile.y; }))
        return { ok: false, reason: "There is already a path here." };
    if (w.player.operatingRooms.some(function (r) { return tile.x >= r.x && tile.x < r.x + r.w && tile.y >= r.y && tile.y < r.y + r.h; }))
        return { ok: false, reason: "A facility already occupies this tile." };
    var connected = campusPathConnectedSet(w);
    if (!(0, exports.adjacentTiles)(tile.x, tile.y).some(function (n) { return connected.has(tileKey(n.x, n.y)); }))
        return { ok: false, reason: "Extend the path from the connected entrance network." };
    if (w.player.cash < exports.CAMPUS_PATH_COST)
        return { ok: false, reason: "Need $".concat(exports.CAMPUS_PATH_COST.toLocaleString(), " for this path tile.") };
    return { ok: true, reason: "" };
}
function roomSupportsProductDesign(room, industryId) {
    if (room.kind !== "office")
        return false;
    if (room.id === "founder-office")
        return true;
    var type = roomFacilityType(room);
    if (type === "training_center" || type === "research_center" || type === "hr_office" || type === "marketing_office" || type === "logistics_office" || type === "consumer_insights" || type === "brand_studio" || type === "executive_wing")
        return false;
    if (type === "beauty_center")
        return !industryId || industryId === "skincare";
    if (type === "toy_center")
        return !industryId || industryId === "toys";
    return room.team === "product";
}
function roleFitsRoom(role, room) {
    if (room.id === "founder-office")
        return true;
    var type = roomFacilityType(room);
    if (type === "training_center")
        return false;
    if (type === "beauty_center" || type === "toy_center")
        return role === "product_manager";
    if (type === "research_center")
        return role === "innovation";
    if (type === "brand_studio" || type === "marketing_office")
        return role === "marketing";
    if (type === "logistics_office")
        return role === "operations";
    if (type === "consumer_insights" || type === "hr_office")
        return role === "strategy";
    if (type === "executive_wing")
        return true;
    return roleFitsTeam(role, room.team);
}
function officeStageForLevel(level) {
    var lv = Math.max(1, Math.min(4, Math.floor(level)));
    if (lv === 1)
        return { label: "Founder Office I", capacity: 4 };
    if (lv === 2)
        return { label: "Founder Office II", capacity: 8 };
    if (lv === 3)
        return { label: "Founder Office III", capacity: 16 };
    return { label: "Founder Office IV · Corporate HQ", capacity: 32 };
}
function levelCapacity(type, level, room) {
    var _a, _b, _c, _d;
    var lv = Math.max(1, level);
    if (room.id === "founder-office")
        return officeStageForLevel(lv).capacity;
    if (type === "warehouse")
        return (_a = [0, 50000, 100000, 180000][Math.min(3, lv)]) !== null && _a !== void 0 ? _a : 180000;
    if (type === "cold_storage")
        return lv >= 2 ? 120000 : 60000;
    if (type === "distribution_hub")
        return lv >= 2 ? 450000 : 250000;
    if (type === "factory")
        return (_b = [0, 100000, 175000, 275000][Math.min(3, lv)]) !== null && _b !== void 0 ? _b : 275000;
    if (type === "outsourcing")
        return (_c = [0, 150000, 250000, 400000][Math.min(3, lv)]) !== null && _c !== void 0 ? _c : 400000;
    if (type === "beauty_center" || type === "toy_center")
        return lv >= 2 ? 8 : 4;
    if (type === "research_center")
        return (_d = [0, 2, 4, 6][Math.min(3, lv)]) !== null && _d !== void 0 ? _d : 6;
    if (type === "training_center")
        return lv >= 2 ? 3 : 1;
    if (type === "executive_wing")
        return lv >= 2 ? 12 : 8;
    var base = exports.FACILITY_DEFS[type].capacity;
    return Math.round(base * (1 + (lv - 1) * .75));
}
function facilityUpgradeQuote(room) {
    var _a, _b, _c;
    var currentLevel = Math.max(1, Math.floor((_a = room.upgradeLevel) !== null && _a !== void 0 ? _a : 1));
    var type = roomFacilityType(room);
    if (room.id === "founder-office") {
        if (currentLevel >= 4)
            return null;
        var current = officeStageForLevel(currentLevel);
        var next = officeStageForLevel(currentLevel + 1);
        var cost_1 = currentLevel === 1 ? 75000 : currentLevel === 2 ? 220000 : 900000;
        var monthlyCostGain_1 = currentLevel === 1 ? 6000 : currentLevel === 2 ? 10000 : 25000;
        return { currentLevel: currentLevel, nextLevel: currentLevel + 1, maxLevel: 4, cost: cost_1, capacityGain: next.capacity - current.capacity, monthlyCostGain: monthlyCostGain_1, currentLabel: current.label, nextLabel: next.label };
    }
    var def = exports.FACILITY_DEFS[type];
    if (currentLevel >= def.maxLevel)
        return null;
    var nextLevel = currentLevel + 1;
    var currentCap = levelCapacity(type, currentLevel, room);
    var nextCap = levelCapacity(type, nextLevel, room);
    var specialCosts = {
        beauty_center: [0, 240000], toy_center: [0, 240000], research_center: [0, 260000, 650000], training_center: [0, 110000],
        warehouse: [0, 85000, 180000], cold_storage: [0, 280000], distribution_hub: [0, 700000], executive_wing: [0, 650000],
    };
    var cost = (_c = (_b = specialCosts[type]) === null || _b === void 0 ? void 0 : _b[currentLevel]) !== null && _c !== void 0 ? _c : Math.round(def.buildCost * (currentLevel === 1 ? .65 : .95));
    var monthlyCostGain = Math.max(2000, Math.round(def.monthlyCost * .4));
    return { currentLevel: currentLevel, nextLevel: nextLevel, maxLevel: def.maxLevel, cost: cost, capacityGain: nextCap - currentCap, monthlyCostGain: monthlyCostGain, currentLabel: "".concat(def.label, " ").concat(roman(currentLevel)), nextLabel: "".concat(def.label, " ").concat(roman(nextLevel)) };
}
function facilityUpgradeRequirement(w, room, nextLevel) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (room.id === "founder-office") {
        if (nextLevel === 3 && !((_b = (_a = w.player.research) === null || _a === void 0 ? void 0 : _a.completed) !== null && _b !== void 0 ? _b : []).includes("organizational_scaling"))
            return "Research Organizational Scaling to reach Founder Office III.";
        if (nextLevel === 4 && !((_d = (_c = w.player.research) === null || _c === void 0 ? void 0 : _c.completed) !== null && _d !== void 0 ? _d : []).includes("corporate_hq"))
            return "Research Corporate Headquarters to reach Founder Office IV.";
        return null;
    }
    var type = roomFacilityType(room);
    if ((type === "beauty_center" || type === "toy_center") && nextLevel >= 2 && !((_f = (_e = w.player.research) === null || _e === void 0 ? void 0 : _e.completed) !== null && _f !== void 0 ? _f : []).includes("flagship_product_development"))
        return "Research Flagship Product Development before upgrading this design center to Level II.";
    if (type === "research_center" && nextLevel >= 2 && !((_h = (_g = w.player.research) === null || _g === void 0 ? void 0 : _g.completed) !== null && _h !== void 0 ? _h : []).includes("advanced_product_development"))
        return "Research Advanced Product Development before expanding the Research Center.";
    if (type === "research_center" && nextLevel >= 3 && !((_k = (_j = w.player.research) === null || _j === void 0 ? void 0 : _j.completed) !== null && _k !== void 0 ? _k : []).includes("flagship_product_development"))
        return "Research Flagship Product Development before building Research Center III.";
    if (type === "consumer_insights" && !((_m = (_l = w.player.research) === null || _l === void 0 ? void 0 : _l.completed) !== null && _m !== void 0 ? _m : []).includes("market_intelligence"))
        return "Research Market Intelligence first.";
    return null;
}
function roman(level) { var _a; return (_a = ["0", "I", "II", "III", "IV"][Math.min(4, Math.max(0, level))]) !== null && _a !== void 0 ? _a : String(level); }
function departmentTierFromSeats(seats) { return seats >= 5 ? 3 : seats >= 3 ? 2 : seats >= 1 ? 1 : 0; }
function assignedSeatCount(w, team) {
    var _a;
    var dedicated = w.player.operatingRooms
        .filter(function (r) { return r.kind === "office" && r.team === team && roomFacilityType(r) !== "training_center"; })
        .reduce(function (sum, r) { return sum + r.assignedPersonnelIds.length; }, 0);
    var founder = w.player.operatingRooms.find(function (r) { return r.id === "founder-office"; });
    if (!founder || team === "unassigned")
        return dedicated;
    var matchingRoles = {
        product: ["product_manager"], marketing: ["marketing"], finance: ["finance"], strategy: ["strategy"], innovation: ["innovation"],
        operations: ["operations"], sales: ["operations", "strategy"],
    };
    var allowed = (_a = matchingRoles[team]) !== null && _a !== void 0 ? _a : [];
    var founderCount = founder.assignedPersonnelIds.filter(function (id) {
        var p = w.player.personnel.find(function (person) { return person.id === id; });
        return Boolean(p && allowed.includes(p.role));
    }).length;
    return dedicated + founderCount;
}
function syncDerivedDepartments(w) {
    w.player.financeDept = departmentTierFromSeats(assignedSeatCount(w, "finance"));
    w.player.intelDept = departmentTierFromSeats(assignedSeatCount(w, "strategy"));
}
function roleFitsTeam(role, team) {
    if (team === "unassigned")
        return true;
    if (team === "product")
        return role === "product_manager";
    if (team === "finance")
        return role === "finance";
    if (team === "marketing")
        return role === "marketing";
    if (team === "strategy")
        return role === "strategy";
    if (team === "innovation")
        return role === "innovation";
    if (team === "operations" || team === "sales")
        return role === "operations" || role === "strategy";
    return false;
}
function openSeatCountForRole(w, role) {
    return w.player.operatingRooms
        .filter(function (room) { return room.kind === "office" && roomFacilityType(room) !== "training_center" && roleFitsRoom(role, room); })
        .reduce(function (sum, room) {
        var limit = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
        return sum + Math.max(0, limit - room.assignedPersonnelIds.length);
    }, 0);
}
function sanitizeOperatingRooms(w, nextRooms) {
    var validPersonnel = new Set(w.player.personnel.map(function (p) { return p.id; }));
    var personnelById = new Map(w.player.personnel.map(function (p) { return [p.id, p]; }));
    var claimed = new Set();
    return nextRooms.map(function (room) {
        var _a, _b;
        var type = (_a = room.facilityType) !== null && _a !== void 0 ? _a : room.kind;
        var baseRoom = __assign(__assign({}, room), { facilityType: room.id === "founder-office" ? "office" : type, upgradeLevel: (_b = room.upgradeLevel) !== null && _b !== void 0 ? _b : 1 });
        if (room.kind === "warehouse" && type === "cold_storage")
            baseRoom.storageProfiles = ["standard", "climate", "refrigerated", "frozen"];
        if (room.kind !== "office" || type === "training_center")
            return __assign(__assign({}, baseRoom), { assignedPersonnelIds: [] });
        var assigned = [];
        for (var _i = 0, _c = room.assignedPersonnelIds; _i < _c.length; _i++) {
            var id = _c[_i];
            var p = personnelById.get(id);
            if (!validPersonnel.has(id) || !p || claimed.has(id) || !roleFitsRoom(p.role, baseRoom))
                continue;
            var staffCapacity = room.id === "founder-office" ? Math.max(0, room.capacity - 1) : room.capacity;
            if (assigned.length >= staffCapacity)
                break;
            assigned.push(id);
            claimed.add(id);
        }
        return __assign(__assign({}, baseRoom), { assignedPersonnelIds: assigned });
    });
}
function roomOperatingCostPerQuarter(w) { return w.player.operatingRooms.reduce(function (sum, room) { return sum + room.monthlyCost * 3; }, 0); }
function trainingCapacity(w) { return facilityRooms(w, "training_center").reduce(function (sum, r) { return sum + r.capacity; }, 0); }
function researchCenterLevel(w) { return highestFacilityLevel(w, "research_center"); }
function productCenterTypeForIndustry(industryId) { return industryId === "skincare" ? "beauty_center" : industryId === "toys" ? "toy_center" : null; }
function productCenterLevel(w, industryId) { var t = productCenterTypeForIndustry(industryId); return t ? highestFacilityLevel(w, t) : 0; }
function facilityEffectMultiplier(w, effect) {
    var effectTypes = {
        brand: "brand_studio", marketing: "marketing_office", recruiting: "hr_office", logistics: "logistics_office", insights: "consumer_insights", leadership: "executive_wing",
    };
    var level = highestFacilityLevel(w, effectTypes[effect]);
    if (effect === "brand")
        return 1 + level * .10;
    if (effect === "marketing")
        return 1 + level * .08;
    if (effect === "recruiting")
        return 1 + level * .18;
    if (effect === "logistics")
        return 1 + level * .10;
    if (effect === "insights")
        return 1 + level * .15;
    return 1 + level * .04;
}
