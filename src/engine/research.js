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
exports.RESEARCH_NODES = void 0;
exports.researchDef = researchDef;
exports.hasResearch = hasResearch;
exports.hasSeatedCIO = hasSeatedCIO;
exports.researchRate = researchRate;
exports.canStartResearch = canStartResearch;
exports.startResearch = startResearch;
exports.updateResearch = updateResearch;
exports.facilityResearchRequirement = facilityResearchRequirement;
exports.officeUpgradeResearchRequirement = officeUpgradeResearchRequirement;
var people_1 = require("./people");
exports.RESEARCH_NODES = [
    { id: "advanced_product_development", branch: "Product", title: "Advanced Product Development", description: "Learn to coordinate a Product Lead and Designer on larger programs.", cost: 80000, points: 120, prereq: [], unlock: "AA product programs" },
    { id: "flagship_product_development", branch: "Product", title: "Flagship Product Development", description: "Build the processes needed to coordinate full four-person flagship product teams.", cost: 450000, points: 340, prereq: ["advanced_product_development", "organizational_scaling"], unlock: "AAA product programs" },
    { id: "professional_recruiting", branch: "Organization", title: "People & HR Foundations", description: "Formalize hiring briefs and broader talent sourcing beyond immediately available candidates.", cost: 55000, points: 90, prereq: [], unlock: "Online recruiting searches and formal HR processes" },
    { id: "executive_search", branch: "Organization", title: "Executive Search", description: "Develop the employer brand and search discipline needed to approach scarce senior talent.", cost: 180000, points: 190, prereq: ["professional_recruiting"], unlock: "Deep recruiting searches" },
    { id: "organizational_scaling", branch: "Organization", title: "Organizational Scaling", description: "Introduce team structures, management layers and workplace standards for a larger company.", cost: 175000, points: 180, prereq: [], unlock: "Large Office · 16 seats" },
    { id: "corporate_hq", branch: "Organization", title: "Corporate Headquarters", description: "Create the systems required to operate a multi-department corporate headquarters.", cost: 700000, points: 360, prereq: ["organizational_scaling"], unlock: "Massive Corporate HQ · 32 seats" },
    { id: "vertical_expansion", branch: "Organization", title: "Vertical Expansion", description: "Standardize floor-by-floor corporate expansion after the HQ reaches full scale.", cost: 1250000, points: 520, prereq: ["corporate_hq"], unlock: "Additional HQ floors · +8 seats each" },
    { id: "supplier_management", branch: "Operations", title: "Supplier Management", description: "Move beyond founder-led sourcing into a dedicated supplier-management function.", cost: 90000, points: 110, prereq: [], unlock: "Dedicated Sourcing Office" },
    { id: "owned_manufacturing", branch: "Operations", title: "Owned Manufacturing", description: "Develop process engineering, QA and operating controls for company-owned production.", cost: 325000, points: 250, prereq: ["supplier_management"], unlock: "Factories and owned production" },
    { id: "specialized_storage", branch: "Operations", title: "Specialized Storage", description: "Develop cold-chain, climate-control and secure handling standards for products that cannot live in a normal warehouse.", cost: 240000, points: 210, prereq: ["supplier_management"], unlock: "Climate-controlled, refrigerated, frozen and secure warehouse modules" },
    { id: "market_intelligence", branch: "Market", title: "Market Intelligence", description: "Build structured research capability for richer market and competitor analysis.", cost: 140000, points: 150, prereq: [], unlock: "Advanced market intelligence" },
];
function researchDef(id) { return exports.RESEARCH_NODES.find(function (n) { return n.id === id; }); }
function hasResearch(w, id) { var _a, _b; return ((_b = (_a = w.player.research) === null || _a === void 0 ? void 0 : _a.completed) !== null && _b !== void 0 ? _b : []).includes(id); }
function hasSeatedCIO(w) {
    var researchRooms = w.player.operatingRooms.filter(function (r) { return r.facilityType === "research_center"; });
    var researchSeats = new Set(researchRooms.flatMap(function (r) { return r.assignedPersonnelIds; }));
    return w.player.personnel.some(function (p) { return p.role === "innovation" && researchSeats.has(p.id); });
}
function researchRate(w) {
    // Corporate research is an organizational capability, not a free founder timer.
    // The Research Center is the physical home of the program; a seated CIO owns it.
    if (!hasSeatedCIO(w))
        return 0;
    var cio = (0, people_1.teamEffectiveness)(w, "innovation");
    var strategy = (0, people_1.teamEffectiveness)(w, "strategy") * .55;
    var product = (0, people_1.teamEffectiveness)(w, "product_manager") * .45;
    var operations = (0, people_1.teamEffectiveness)(w, "operations") * .35;
    var centerLevel = Math.max.apply(Math, __spreadArray([0], w.player.operatingRooms.filter(function (r) { return r.facilityType === "research_center"; }).map(function (r) { var _a; return (_a = r.upgradeLevel) !== null && _a !== void 0 ? _a : 1; }), false));
    var facilityMult = 1 + centerLevel * .12;
    return (cio * 2.65 + strategy + product + operations) * facilityMult;
}
function canStartResearch(w, id) {
    var _a;
    var def = researchDef(id);
    if (!w.player.operatingRooms.some(function (r) { return r.id === "founder-office"; }))
        return { ok: false, reason: "Build the Founder Office before starting company-development research.", def: def };
    if (!w.player.operatingRooms.some(function (r) { return r.facilityType === "research_center"; }))
        return { ok: false, reason: "Build a Research Center before starting company-development research.", def: def };
    if (!hasSeatedCIO(w))
        return { ok: false, reason: "Hire a Chief Innovation Officer and assign them to the Research Center before starting research.", def: def };
    if (hasResearch(w, id))
        return { ok: false, reason: "Already researched.", def: def };
    if ((_a = w.player.research) === null || _a === void 0 ? void 0 : _a.active)
        return { ok: false, reason: "Another capability project is already active.", def: def };
    var missing = def.prereq.find(function (p) { return !hasResearch(w, p); });
    if (missing)
        return { ok: false, reason: "Requires ".concat(researchDef(missing).title, " first."), def: def };
    if (w.player.cash < def.cost)
        return { ok: false, reason: "Need $".concat(def.cost.toLocaleString(), " to fund this capability project."), def: def };
    return { ok: true, reason: "", def: def };
}
function startResearch(w, id) {
    var check = canStartResearch(w, id);
    if (!check.ok)
        return { ok: false, reason: check.reason };
    w.player.cash -= check.def.cost;
    w.player.research.active = { nodeId: id, startedTick: w.tick, progress: 0, requiredPoints: check.def.points, cashCommitted: check.def.cost };
    w.events.push({ tick: w.tick, kind: "strategy", text: "\uD83D\uDD2C Capability project started \u2014 ".concat(check.def.title, ".") });
    return { ok: true, reason: "" };
}
function updateResearch(w) {
    var _a;
    var p = (_a = w.player.research) === null || _a === void 0 ? void 0 : _a.active;
    if (!p)
        return null;
    var gain = researchRate(w);
    p.progress = Math.min(p.requiredPoints, p.progress + gain);
    w.player.research.lifetimePoints += gain;
    if (p.progress < p.requiredPoints)
        return null;
    if (!w.player.research.completed.includes(p.nodeId))
        w.player.research.completed.push(p.nodeId);
    var id = p.nodeId;
    var def = researchDef(id);
    w.player.research.active = null;
    w.events.push({ tick: w.tick, kind: "strategy", text: "\u2705 Research complete \u2014 ".concat(def.title, ". ").concat(def.unlock, " unlocked.") });
    return id;
}
function facilityResearchRequirement(w, kind) {
    if (kind === "factory" && !hasResearch(w, "owned_manufacturing"))
        return "Research Owned Manufacturing first.";
    if (kind === "outsourcing" && !hasResearch(w, "supplier_management"))
        return "Research Supplier Management first.";
    return null;
}
function officeUpgradeResearchRequirement(w, nextLevel) {
    if (nextLevel === 3 && !hasResearch(w, "organizational_scaling"))
        return "Research Organizational Scaling to build a 16-seat Large Office.";
    if (nextLevel === 4 && !hasResearch(w, "corporate_hq"))
        return "Research Corporate Headquarters to reach 32 seats.";
    return null;
}
