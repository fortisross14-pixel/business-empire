"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.founderJourney = founderJourney;
var capacity_1 = require("./capacity");
var distribution_1 = require("./distribution");
var infrastructure_1 = require("./infrastructure");
function founderJourney(w) {
    var _a, _b, _c, _d, _e, _f;
    var founderOffice = w.player.operatingRooms.find(function (r) { return r.id === "founder-office"; });
    var connectedPaths = (0, infrastructure_1.campusPathConnectedSet)(w);
    var extendedPath = connectedPaths.size > 2;
    var officeConnected = Boolean(founderOffice && (0, infrastructure_1.roomTouchesConnectedPath)(w, founderOffice));
    var brandCreated = w.brands.length > 0;
    var seatedIds = new Set(w.player.operatingRooms.filter(function (r) { return r.kind === "office"; }).flatMap(function (r) { return r.assignedPersonnelIds; }));
    var designers = w.player.personnel.filter(function (p) { return p.role === "product_manager" && seatedIds.has(p.id); });
    var sourcing = w.player.personnel.filter(function (p) { return p.role === "operations" && seatedIds.has(p.id); });
    var marketers = w.player.personnel.filter(function (p) { return p.role === "marketing" && seatedIds.has(p.id); });
    var researchCenter = w.player.operatingRooms.find(function (r) { return r.facilityType === "research_center"; });
    var researchSeatIds = new Set((_a = researchCenter === null || researchCenter === void 0 ? void 0 : researchCenter.assignedPersonnelIds) !== null && _a !== void 0 ? _a : []);
    var innovators = w.player.personnel.filter(function (p) { return p.role === "innovation" && researchSeatIds.has(p.id); });
    var growthOffice = Boolean(((_b = founderOffice === null || founderOffice === void 0 ? void 0 : founderOffice.upgradeLevel) !== null && _b !== void 0 ? _b : 1) >= 2 || ((_c = founderOffice === null || founderOffice === void 0 ? void 0 : founderOffice.capacity) !== null && _c !== void 0 ? _c : 0) >= 8);
    var first = w.player.skus[0];
    var productionReady = first ? (0, capacity_1.productionCapacity)(w, first.method, first.supplierId, first.productKey) > 0 : sourcing.length > 0 || w.player.operatingRooms.some(function (r) { return r.kind === "factory" || r.kind === "outsourcing"; });
    var warehouseReady = w.player.operatingRooms.some(function (r) { return r.kind === "warehouse"; });
    var firstBatch = Boolean(first && (first.status === "manufacturing" || first.status === "active" || first.inventory > 0 || first.unitsSoldTotal > 0));
    var units = w.player.skus.reduce(function (a, s) { var _a; return a + ((_a = s.unitsSoldTotal) !== null && _a !== void 0 ? _a : 0); }, 0);
    var released = Boolean(first === null || first === void 0 ? void 0 : first.releasedToMarket);
    var launchReady = Boolean(first && first.inventory > 0 && first.listPrice > 0 && (0, distribution_1.distributionMetricsForSku)(w, first).contracts.length > 0 && marketers.length > 0);
    return [
        { id: "path", label: "Connect the lot", detail: "Extend a path from the campus entrance at ".concat(infrastructure_1.CAMPUS_ENTRANCE.x, ",").concat(infrastructure_1.CAMPUS_ENTRANCE.y, ". Every operating building must touch the connected path network."), done: extendedPath, topTab: "mgmt", subTab: "hq" },
        { id: "office", label: "Build the Founder Office", detail: "Place the first 4×4 office beside the path. It has four total positions: Founder/CEO plus three staff seats.", done: Boolean(founderOffice && officeConnected), topTab: "mgmt", subTab: "hq" },
        { id: "brand", label: "Create the founding brand", detail: "Now that the company physically exists, create its first brand, positioning, colors and logo.", done: brandCreated, topTab: "mgmt", subTab: "vision" },
        { id: "hire-designer", label: "Hire a Product Designer", detail: "Brief a recruiting agency, review the employment contract and assign the hire to an open Founder Office desk.", done: designers.length > 0, topTab: "mgmt", subTab: "personnel" },
        { id: "design", label: "Design the first product", detail: "Start with an A project using one Product Designer. Larger offices let you assemble AA and AAA teams later.", done: Boolean(first), topTab: "ops", subTab: "products" },
        { id: "hire-sourcing", label: "Hire a Sourcing Manager", detail: "Your startup can coordinate a small outsourced production run from the Founder Office before a dedicated Sourcing Office exists.", done: sourcing.length > 0, topTab: "mgmt", subTab: "personnel" },
        { id: "warehouse", label: "Build a warehouse", detail: "Finished goods need physical storage. Extend the path and place a connected warehouse before ordering the first batch.", done: warehouseReady, topTab: "mgmt", subTab: "hq" },
        { id: "capacity", label: "Secure production capacity", detail: "A seated Sourcing Manager unlocks starter outsourcing capacity; later you can build dedicated sourcing offices or factories.", done: productionReady, topTab: "mgmt", subTab: "hq" },
        { id: "batch", label: "Manufacture the first batch", detail: "After design completes, choose the manufacturer, production standard and first batch size.", done: firstBatch, topTab: "ops", subTab: "products" },
        { id: "hire-marketing", label: "Hire a Marketing Specialist", detail: "Fill the last Founder Office desk with someone who can own launch positioning, advertising and channel execution.", done: marketers.length > 0, topTab: "mgmt", subTab: "personnel" },
        { id: "launch-plan", label: "Build the launch plan", detail: "With inventory ready, set price, target audience, retail channels and launch advertising.", done: launchReady, topTab: "ops", subTab: "products" },
        { id: "release", label: "Release the product", detail: "Launch when the commercial setup makes sense. Marketing can amplify fit; it cannot repair a bad proposition.", done: released, topTab: "ops", subTab: "products" },
        { id: "sale", label: "Win the first customers", detail: "Watch the launch convert into real sales, then diagnose what worked and what did not.", done: units > 0, topTab: "ops", subTab: "products" },
        { id: "traction", label: "Reach 10,000 lifetime units", detail: "Replenish, reprice, retarget and iterate until the business has real traction.", done: units >= 10000, topTab: "ops", subTab: "products" },
        { id: "expand-office", label: "Grow the Founder Office", detail: "Upgrade Founder Office I to Level II. This is the first visible step from startup to a real campus and unlocks specialized facilities.", done: growthOffice, topTab: "mgmt", subTab: "hq" },
        { id: "research-center", label: "Build a Research Center", detail: "Company research needs a physical home. Build a connected Research Center before hiring innovation leadership.", done: Boolean(researchCenter), topTab: "mgmt", subTab: "hq" },
        { id: "hire-cio", label: "Hire a Chief Innovation Officer", detail: "Corporate research needs an owner. Recruit a CIO and assign them to a seat in the Research Center.", done: innovators.length > 0, topTab: "mgmt", subTab: "personnel" },
        { id: "research", label: "Develop the next capability", detail: "With a seated CIO, open Company → Research and choose what the company should learn next: AA programs, recruiting, sourcing, manufacturing, storage or organizational scale.", done: ((_f = (_e = (_d = w.player.research) === null || _d === void 0 ? void 0 : _d.completed) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0) > 0, topTab: "mgmt", subTab: "research" },
    ];
}
