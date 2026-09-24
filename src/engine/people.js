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
exports.TALENT_SEARCH_MODES = exports.ROLE_LABELS = void 0;
exports.titleFor = titleFor;
exports.starsFor = starsFor;
exports.normalizedAttributes = normalizedAttributes;
exports.roleEffectiveness = roleEffectiveness;
exports.teamEffectiveness = teamEffectiveness;
exports.productManagerEffectiveness = productManagerEffectiveness;
exports.isProductLead = isProductLead;
exports.productProjectTeamEffectiveness = productProjectTeamEffectiveness;
exports.generateCandidate = generateCandidate;
exports.refreshTalentMarket = refreshTalentMarket;
exports.candidateToPersonnel = candidateToPersonnel;
exports.enrichLegacyPerson = enrichLegacyPerson;
exports.canPromotePerson = canPromotePerson;
exports.promotePerson = promotePerson;
exports.archivePerson = archivePerson;
exports.updatePeopleQuarter = updatePeopleQuarter;
exports.updatePeopleYear = updatePeopleYear;
exports.startPersonnelTraining = startPersonnelTraining;
exports.updatePersonnelTraining = updatePersonnelTraining;
exports.startTalentSearch = startTalentSearch;
exports.updateTalentSearch = updateTalentSearch;
var types_1 = require("./types");
var chronicle_1 = require("./chronicle");
var industries_1 = require("./industries");
var infrastructure_1 = require("./infrastructure");
var FIRST_NAMES = [
    "Sarah", "Maya", "Elena", "Priya", "Sofia", "Nina", "Aisha", "Hannah", "Lucia", "Camila", "Mei", "Grace", "Zoe", "Amara", "Julia", "Leila",
    "Daniel", "Mateo", "Noah", "Ethan", "Leo", "Owen", "Julian", "Marco", "Adrian", "Samir", "Kenji", "Lucas", "Andre", "David", "Victor", "Jonah",
];
var LAST_NAMES = [
    "Chen", "Martinez", "Patel", "Brooks", "Kim", "Rivera", "Morgan", "Nguyen", "Silva", "Okafor", "Bennett", "Sato", "Ramirez", "Fischer", "Costa", "Reed",
    "Khan", "Rossi", "Turner", "Alvarez", "Park", "Dubois", "Shah", "Miller", "Torres", "Ibrahim", "Wang", "Sullivan", "Nakamura", "Flores", "Young", "Moretti",
];
exports.ROLE_LABELS = {
    product_manager: "Product Design",
    finance: "Finance",
    marketing: "Marketing",
    strategy: "Strategy",
    operations: "Sourcing / Operations",
    innovation: "Innovation / R&D",
};
var TITLES = {
    product_manager: ["Product Designer", "Senior Product Designer", "Product Lead", "VP Product"],
    finance: ["Financial Analyst", "Finance Manager", "Finance Director", "VP Finance"],
    marketing: ["Marketing Manager", "Senior Marketing Manager", "Marketing Director", "VP Marketing"],
    strategy: ["Strategy Analyst", "Strategy Manager", "Strategy Director", "VP Strategy"],
    operations: ["Sourcing Manager", "Senior Sourcing Manager", "Operations Director", "VP Operations"],
    innovation: ["Chief Innovation Officer", "Chief Innovation Officer", "Chief Innovation Officer", "Chief Innovation Officer"],
};
var TRAITS = [
    "Consumer instinct", "Calm operator", "Fast learner", "Creative thinker", "Commercial edge", "Detail obsessed",
    "Team builder", "Analytical", "Hands-on", "Big-picture thinker", "Reliable executor", "Strong communicator",
];
var clamp = function (v, lo, hi) {
    if (lo === void 0) { lo = 0; }
    if (hi === void 0) { hi = 1; }
    return Math.max(lo, Math.min(hi, v));
};
var rand = function (lo, hi) { return lo + Math.random() * (hi - lo); };
function titleFor(role, level) {
    if (level === void 0) { level = 1; }
    return TITLES[role][Math.max(0, Math.min(3, Math.round(level) - 1))];
}
function starsFor(value) {
    return Math.max(1, Math.min(5, Math.round(clamp(value) * 4 + 1)));
}
function normalizedAttributes(p) {
    var _a, _b, _c, _d, _e, _f;
    var fallback = clamp(Number((_a = p.skill) !== null && _a !== void 0 ? _a : 0.45));
    var attrs = p.attributes;
    return {
        expertise: clamp((_b = attrs === null || attrs === void 0 ? void 0 : attrs.expertise) !== null && _b !== void 0 ? _b : fallback),
        execution: clamp((_c = attrs === null || attrs === void 0 ? void 0 : attrs.execution) !== null && _c !== void 0 ? _c : fallback),
        creativity: clamp((_d = attrs === null || attrs === void 0 ? void 0 : attrs.creativity) !== null && _d !== void 0 ? _d : fallback),
        leadership: clamp((_e = attrs === null || attrs === void 0 ? void 0 : attrs.leadership) !== null && _e !== void 0 ? _e : fallback * 0.9),
        commercial: clamp((_f = attrs === null || attrs === void 0 ? void 0 : attrs.commercial) !== null && _f !== void 0 ? _f : fallback * 0.9),
    };
}
function roleEffectiveness(p, productKey) {
    var _a;
    var a = normalizedAttributes(p);
    var score = (_a = p.skill) !== null && _a !== void 0 ? _a : 0.45;
    if (p.role === "product_manager")
        score = a.expertise * .26 + a.execution * .24 + a.creativity * .27 + a.commercial * .15 + a.leadership * .08;
    if (p.role === "marketing")
        score = a.creativity * .34 + a.commercial * .32 + a.execution * .20 + a.expertise * .10 + a.leadership * .04;
    if (p.role === "finance")
        score = a.execution * .35 + a.expertise * .35 + a.leadership * .16 + a.commercial * .10 + a.creativity * .04;
    if (p.role === "strategy")
        score = a.expertise * .30 + a.commercial * .25 + a.leadership * .18 + a.creativity * .17 + a.execution * .10;
    if (p.role === "operations")
        score = a.execution * .38 + a.leadership * .24 + a.expertise * .20 + a.commercial * .12 + a.creativity * .06;
    if (p.role === "innovation")
        score = a.expertise * .31 + a.creativity * .29 + a.leadership * .20 + a.execution * .14 + a.commercial * .06;
    if (productKey && p.specialty === productKey)
        score += .08;
    return clamp(score);
}
function teamEffectiveness(w, role) {
    var staff = w.player.personnel.filter(function (p) { return p.role === role; });
    var seated = staff.filter(function (p) { return w.player.operatingRooms.some(function (r) { return r.kind === "office" && r.assignedPersonnelIds.includes(p.id); }); });
    if (!seated.length)
        return 0;
    var weighted = seated.reduce(function (sum, p) { return sum + roleEffectiveness(p); }, 0) / seated.length;
    var depthBonus = Math.min(.14, Math.log2(seated.length + 1) * .055);
    return clamp((weighted + depthBonus) * (0, infrastructure_1.facilityEffectMultiplier)(w, "leadership"));
}
function productManagerEffectiveness(p, productKey) {
    return roleEffectiveness(p, productKey);
}
function isProductLead(p) {
    return p.role === "product_manager" && (p.level >= 3 || p.title === "Product Lead" || p.title === "VP Product");
}
function productProjectTeamEffectiveness(w, tier, productKey, leadId, designerIds) {
    var _a;
    var byId = new Map(w.player.personnel.map(function (p) { return [p.id, p]; }));
    if (tier === "A") {
        var designer = byId.get((_a = leadId !== null && leadId !== void 0 ? leadId : designerIds[0]) !== null && _a !== void 0 ? _a : "");
        return designer ? productManagerEffectiveness(designer, productKey) : 0;
    }
    var lead = leadId ? byId.get(leadId) : null;
    var designers = designerIds.map(function (id) { return byId.get(id); }).filter(function (p) { return Boolean(p); });
    if (!lead || !designers.length)
        return 0;
    var leadScore = productManagerEffectiveness(lead, productKey);
    var designerAverage = designers.reduce(function (sum, p) { return sum + productManagerEffectiveness(p, productKey); }, 0) / designers.length;
    if (tier === "AA")
        return clamp(leadScore * .60 + designerAverage * .40);
    // The lead matters more than any individual designer: 45% of AAA comes from the lead,
    // while the three designers split the remaining 55% (~18.3% each).
    return clamp(leadScore * .45 + designerAverage * .55);
}
function rarityFromSkill(skill) {
    if (skill >= .82)
        return "legendary";
    if (skill >= .68)
        return "epic";
    if (skill >= .53)
        return "rare";
    if (skill >= .37)
        return "uncommon";
    return "common";
}
function roleBiasedAttributes(role, base) {
    var jitter = function () { return clamp(base + rand(-.15, .15)); };
    var a = { expertise: jitter(), execution: jitter(), creativity: jitter(), leadership: jitter(), commercial: jitter() };
    if (role === "product_manager") {
        a.creativity = clamp(a.creativity + .12);
        a.expertise = clamp(a.expertise + .08);
    }
    if (role === "marketing") {
        a.creativity = clamp(a.creativity + .13);
        a.commercial = clamp(a.commercial + .12);
    }
    if (role === "finance") {
        a.execution = clamp(a.execution + .13);
        a.expertise = clamp(a.expertise + .10);
    }
    if (role === "strategy") {
        a.expertise = clamp(a.expertise + .10);
        a.commercial = clamp(a.commercial + .08);
    }
    if (role === "operations") {
        a.execution = clamp(a.execution + .15);
        a.leadership = clamp(a.leadership + .07);
    }
    if (role === "innovation") {
        a.expertise = clamp(a.expertise + .14);
        a.creativity = clamp(a.creativity + .14);
        a.leadership = clamp(a.leadership + .08);
    }
    return a;
}
function uniqueName(existing) {
    for (var i = 0; i < 20; i++) {
        var name_1 = "".concat(FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)], " ").concat(LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]);
        if (!existing.has(name_1))
            return name_1;
    }
    return "Candidate ".concat(Math.floor(Math.random() * 900 + 100));
}
function generateCandidate(role, cfg, companyExpertise, existingNames, qualityBias) {
    var _a, _b;
    if (existingNames === void 0) { existingNames = new Set(); }
    if (qualityBias === void 0) { qualityBias = 0; }
    var levelRoll = Math.random() + companyExpertise * .035 + qualityBias * .65;
    // Search depth must materially change access to senior talent. Quick searches can occasionally
    // surface a lead, normal searches do so with meaningful odds, and Deep Search is the reliable
    // route to directors/executives. These thresholds also prevent AA staffing from becoming a
    // hidden one-year promotion wall after the technology itself is unlocked.
    var level = (levelRoll > 1.05 ? 4 : levelRoll > .88 ? 3 : levelRoll > .62 ? 2 : 1);
    var base = clamp(rand(.28, .58) + companyExpertise * .035 + (level - 1) * .08 + qualityBias, .2, .96);
    var attributes = roleBiasedAttributes(role, base);
    var overall = Object.values(attributes).reduce(function (a, b) { return a + b; }, 0) / 5;
    var rarity = rarityFromSkill(overall);
    var salaryMult = 1 + (level - 1) * .55 + Math.max(0, overall - .45) * 1.5;
    var specialty = role === "product_manager" || role === "marketing"
        ? (_b = (_a = cfg.products[Math.floor(Math.random() * cfg.products.length)]) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : null
        : null;
    var age = Math.round(rand(25 + (level - 1) * 4, 37 + (level - 1) * 6));
    var name = uniqueName(existingNames);
    return {
        id: "cand_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 1000000)),
        name: name,
        role: role,
        age: age,
        level: level,
        title: titleFor(role, level),
        salaryAsk: Math.round(types_1.BASE_SALARIES[role] * salaryMult / 250) * 250,
        skill: overall,
        rarity: rarity,
        potential: clamp(rand(overall, Math.min(1, overall + .32))),
        attributes: attributes,
        specialty: specialty,
        traits: [TRAITS[Math.floor(Math.random() * TRAITS.length)], TRAITS[Math.floor(Math.random() * TRAITS.length)]].filter(function (v, i, a) { return a.indexOf(v) === i; }),
    };
}
function refreshTalentMarket(w) {
    var _a, _b;
    var exp = Math.max.apply(Math, __spreadArray(__spreadArray([(_a = w.player.expertise.industry[w.cfg.id]) !== null && _a !== void 0 ? _a : 0], Object.values(w.player.expertise.category), false), [0], false));
    var names = new Set(__spreadArray(__spreadArray([], w.player.personnel, true), ((_b = w.player.formerPersonnel) !== null && _b !== void 0 ? _b : []), true).map(function (p) { return p.name; }));
    var roles = ["product_manager", "finance", "marketing", "strategy", "operations", "innovation"];
    var candidates = [];
    for (var _i = 0, roles_1 = roles; _i < roles_1.length; _i++) {
        var role = roles_1[_i];
        for (var i = 0; i < 2; i++) {
            var c = generateCandidate(role, w.cfg, exp, names);
            names.add(c.name);
            candidates.push(c);
        }
    }
    w.player.talentMarket = candidates;
    w.player.talentMarketRefreshTick = w.tick;
}
function candidateToPersonnel(c, tick) {
    return {
        id: "p_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 1000000)),
        name: c.name,
        role: c.role,
        rarity: c.rarity,
        salary: c.salaryAsk,
        skill: c.skill,
        age: c.age,
        hiredTick: tick,
        level: c.level,
        title: c.title,
        potential: c.potential,
        performance: .55,
        morale: .72,
        attributes: __assign({}, c.attributes),
        specialty: c.specialty,
        traits: __spreadArray([], c.traits, true),
        careerEvents: [{ tick: tick, kind: "hire", text: "Joined the company as ".concat(c.title, ".") }],
        lastPromotionTick: tick,
    };
}
function enrichLegacyPerson(p, tick, cfg) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    var attrs = normalizedAttributes(p);
    var level = ((_a = p.level) !== null && _a !== void 0 ? _a : 1);
    p.age = (_b = p.age) !== null && _b !== void 0 ? _b : Math.round(rand(27, 43));
    p.hiredTick = (_c = p.hiredTick) !== null && _c !== void 0 ? _c : Math.max(0, tick - Math.round(rand(30, 300)));
    p.level = level;
    p.title = (_d = p.title) !== null && _d !== void 0 ? _d : titleFor(p.role, level);
    p.potential = (_e = p.potential) !== null && _e !== void 0 ? _e : clamp(((_f = p.skill) !== null && _f !== void 0 ? _f : .45) + rand(.08, .28));
    p.performance = (_g = p.performance) !== null && _g !== void 0 ? _g : .58;
    p.morale = (_h = p.morale) !== null && _h !== void 0 ? _h : .7;
    p.attributes = attrs;
    p.specialty = (_j = p.specialty) !== null && _j !== void 0 ? _j : ((p.role === "product_manager" || p.role === "marketing") ? ((_l = (_k = cfg.products[0]) === null || _k === void 0 ? void 0 : _k.key) !== null && _l !== void 0 ? _l : null) : null);
    p.traits = ((_m = p.traits) === null || _m === void 0 ? void 0 : _m.length) ? p.traits : [TRAITS[Math.floor(Math.random() * TRAITS.length)]];
    p.careerEvents = (_o = p.careerEvents) !== null && _o !== void 0 ? _o : [{ tick: p.hiredTick, kind: "hire", text: "Joined the company as ".concat(p.title, ".") }];
    p.lastPromotionTick = (_p = p.lastPromotionTick) !== null && _p !== void 0 ? _p : p.hiredTick;
    return p;
}
function canPromotePerson(w, p) {
    var _a, _b, _c, _d;
    if (p.role === "innovation")
        return { ok: false, reason: "Chief Innovation Officer is already an executive role." };
    if (((_a = p.level) !== null && _a !== void 0 ? _a : 1) >= 4)
        return { ok: false, reason: "Already at VP level." };
    var since = w.tick - Math.max((_b = p.hiredTick) !== null && _b !== void 0 ? _b : 0, (_c = p.lastPromotionTick) !== null && _c !== void 0 ? _c : 0);
    if (since < 360)
        return { ok: false, reason: "Needs ".concat(Math.ceil((360 - since) / 30), " more months at current level.") };
    if (((_d = p.performance) !== null && _d !== void 0 ? _d : .5) < .64)
        return { ok: false, reason: "Performance must reach 64%." };
    return { ok: true, reason: "Ready for promotion." };
}
function promotePerson(w, p) {
    var _a, _b, _c;
    if (!canPromotePerson(w, p).ok)
        return false;
    p.level = Math.min(4, ((_a = p.level) !== null && _a !== void 0 ? _a : 1) + 1);
    p.title = titleFor(p.role, p.level);
    p.salary = Math.round(p.salary * 1.22 / 250) * 250;
    p.skill = clamp(((_b = p.skill) !== null && _b !== void 0 ? _b : .45) + .025);
    p.attributes.leadership = clamp(p.attributes.leadership + .05);
    p.morale = clamp(((_c = p.morale) !== null && _c !== void 0 ? _c : .7) + .16);
    p.lastPromotionTick = w.tick;
    p.careerEvents.push({ tick: w.tick, kind: "promotion", text: "Promoted to ".concat(p.title, ".") });
    return true;
}
function archivePerson(w, id, reason) {
    var _a;
    var p = w.player.personnel.find(function (x) { return x.id === id; });
    if (!p)
        return;
    p.careerEvents.push({ tick: w.tick, kind: "departure", text: reason });
    w.player.formerPersonnel = (_a = w.player.formerPersonnel) !== null && _a !== void 0 ? _a : [];
    w.player.formerPersonnel.push(__assign(__assign({}, p), { leftTick: w.tick, leftReason: reason }));
    w.player.personnel = w.player.personnel.filter(function (x) { return x.id !== id; });
    for (var _i = 0, _b = w.player.operatingRooms; _i < _b.length; _i++) {
        var room = _b[_i];
        room.assignedPersonnelIds = room.assignedPersonnelIds.filter(function (pid) { return pid !== id; });
    }
}
function performanceTarget(w, p) {
    var _a, _b, _c, _d, _e;
    var seated = w.player.operatingRooms.some(function (r) { return r.kind === "office" && r.assignedPersonnelIds.includes(p.id); });
    if (!seated)
        return .34;
    var target = .54 + roleEffectiveness(p) * .24;
    if (p.role === "product_manager") {
        var projects = w.player.skus.filter(function (s) { var _a; return s.assignedPmId === p.id || ((_a = s.assignedDesignerIds) !== null && _a !== void 0 ? _a : []).includes(p.id); });
        if (projects.length) {
            var impact = projects.reduce(function (sum, s) { return sum + s.designQuality * .35 + s.fame * .25 + Math.min(1, s.unitsSoldTotal / 100000) * .4; }, 0) / projects.length;
            target += impact * .17;
        }
    }
    if (p.role === "marketing")
        target += Math.min(.12, (w.player.marketing + w.player.brandMarketing) / 2000000);
    if (p.role === "operations")
        target += Math.max(-.08, .08 - Math.min(.16, w.player.lostSales / 500000));
    if (p.role === "finance" && ((_b = (_a = w.live) === null || _a === void 0 ? void 0 : _a.income.profit) !== null && _b !== void 0 ? _b : 0) > 0)
        target += .05;
    if (p.role === "strategy" && Object.keys(w.revealed).length > 0)
        target += .04;
    if (p.role === "innovation" && (((_d = (_c = w.player.research) === null || _c === void 0 ? void 0 : _c.completed.length) !== null && _d !== void 0 ? _d : 0) > 0 || Boolean((_e = w.player.research) === null || _e === void 0 ? void 0 : _e.active)))
        target += .06;
    return clamp(target, .2, .94);
}
function updatePeopleQuarter(w) {
    var _a, _b;
    var _loop_1 = function (p) {
        var target = performanceTarget(w, p);
        p.performance = clamp(((_a = p.performance) !== null && _a !== void 0 ? _a : .55) * .72 + target * .28);
        var seated = w.player.operatingRooms.some(function (r) { return r.kind === "office" && r.assignedPersonnelIds.includes(p.id); });
        var promoReady = canPromotePerson(w, p).ok;
        var moraleTarget = seated ? (promoReady ? .62 : .76) : .38;
        p.morale = clamp(((_b = p.morale) !== null && _b !== void 0 ? _b : .7) * .82 + moraleTarget * .18);
    };
    for (var _i = 0, _c = w.player.personnel; _i < _c.length; _i++) {
        var p = _c[_i];
        _loop_1(p);
    }
}
function updatePeopleYear(w) {
    var _a, _b, _c, _d, _e;
    var departures = [];
    for (var _i = 0, _f = w.player.personnel; _i < _f.length; _i++) {
        var p = _f[_i];
        p.age = ((_a = p.age) !== null && _a !== void 0 ? _a : 30) + 1;
        var growthRoom = Math.max(0, ((_b = p.potential) !== null && _b !== void 0 ? _b : p.skill) - p.skill);
        var growth = Math.min(.035, growthRoom * .12) * (0.65 + ((_c = p.performance) !== null && _c !== void 0 ? _c : .55) * .55);
        p.skill = clamp(p.skill + growth);
        p.attributes.expertise = clamp(p.attributes.expertise + growth * .9);
        p.attributes.execution = clamp(p.attributes.execution + growth * .7);
        if (p.age >= 68 || (p.age >= 64 && Math.random() < .28)) {
            departures.push({ id: p.id, reason: "Retired at age ".concat(p.age, ".") });
            continue;
        }
        var poachable = roleEffectiveness(p) > .76 && ((_d = p.morale) !== null && _d !== void 0 ? _d : .7) < .64;
        var leaveChance = .008 + (((_e = p.morale) !== null && _e !== void 0 ? _e : .7) < .48 ? .06 : 0) + (poachable ? .025 : 0);
        if (Math.random() < leaveChance)
            departures.push({ id: p.id, reason: poachable ? "Left after being recruited by a rival." : "Left the company for another opportunity." });
    }
    var _loop_2 = function (d) {
        var p = w.player.personnel.find(function (x) { return x.id === d.id; });
        if (p) {
            w.events.push({ tick: w.tick, kind: "people", text: "\uD83D\uDC64 ".concat(p.name, " \u2014 ").concat(d.reason) });
            (0, chronicle_1.recordPeopleEvent)(w, p.id, "".concat(p.name, " left the company"), "".concat(p.name, ", ").concat(p.title, ", ").concat(d.reason.charAt(0).toLowerCase()).concat(d.reason.slice(1)), "departure", p.level >= 3 || p.age >= 64 ? 2 : 1);
        }
        archivePerson(w, d.id, d.reason);
    };
    for (var _g = 0, departures_1 = departures; _g < departures_1.length; _g++) {
        var d = departures_1[_g];
        _loop_2(d);
    }
}
function startPersonnelTraining(w, personnelId) {
    var _a, _b, _c;
    var person = w.player.personnel.find(function (p) { return p.id === personnelId; });
    if (!person)
        return { ok: false, reason: "Employee not found." };
    var capacity = (0, infrastructure_1.trainingCapacity)(w);
    if (capacity <= 0)
        return { ok: false, reason: "Build a Training Room before starting an upskilling program." };
    w.player.trainingPrograms = (_a = w.player.trainingPrograms) !== null && _a !== void 0 ? _a : [];
    if (w.player.trainingPrograms.some(function (t) { return t.personnelId === personnelId; }))
        return { ok: false, reason: "".concat(person.name, " is already in training.") };
    var active = w.player.trainingPrograms.length;
    if (active >= capacity)
        return { ok: false, reason: "All ".concat(capacity, " training slot").concat(capacity === 1 ? " is" : "s are", " occupied.") };
    var last = (_b = person.lastTrainingTick) !== null && _b !== void 0 ? _b : -9999;
    if (w.tick - last < 180)
        return { ok: false, reason: "".concat(person.name, " can start another formal course in ").concat(Math.ceil((180 - (w.tick - last)) / 30), " month(s).") };
    var rooms = (0, infrastructure_1.facilityRooms)(w, "training_center");
    var room = rooms.find(function (candidate) { var _a; return ((_a = w.player.trainingPrograms) !== null && _a !== void 0 ? _a : []).filter(function (program) { return program.facilityRoomId === candidate.id; }).length < candidate.capacity; });
    if (!room)
        return { ok: false, reason: "All Training Rooms are currently full." };
    var advanced = ((_c = room.upgradeLevel) !== null && _c !== void 0 ? _c : 1) >= 2;
    var days = advanced ? 30 : 45;
    var cost = advanced ? 22000 : 18000;
    if (w.player.cash < cost)
        return { ok: false, reason: "Need $".concat(cost.toLocaleString(), " for this training program.") };
    w.player.cash -= cost;
    w.player.trainingPrograms.push({ id: "training_".concat(w.tick, "_").concat(personnelId), personnelId: personnelId, facilityRoomId: room.id, startedTick: w.tick, daysLeft: days, totalDays: days, cost: cost });
    w.events.push({ tick: w.tick, kind: "people", text: "\uD83C\uDF93 ".concat(person.name, " started a ").concat(days, "-day upskilling program.") });
    return { ok: true, days: days };
}
function updatePersonnelTraining(w) {
    var _a, _b;
    w.player.trainingPrograms = (_a = w.player.trainingPrograms) !== null && _a !== void 0 ? _a : [];
    var completed = [];
    var _loop_3 = function (program) {
        program.daysLeft = Math.max(0, program.daysLeft - 1);
        if (program.daysLeft > 0)
            return "continue";
        var p = w.player.personnel.find(function (person) { return person.id === program.personnelId; });
        if (p) {
            var boost = .045;
            var attrs = p.attributes;
            if (p.role === "product_manager") {
                attrs.creativity = clamp(attrs.creativity + boost);
                attrs.expertise = clamp(attrs.expertise + boost * .8);
                attrs.execution = clamp(attrs.execution + boost * .5);
            }
            if (p.role === "marketing") {
                attrs.creativity = clamp(attrs.creativity + boost);
                attrs.commercial = clamp(attrs.commercial + boost);
            }
            if (p.role === "finance") {
                attrs.expertise = clamp(attrs.expertise + boost);
                attrs.execution = clamp(attrs.execution + boost);
            }
            if (p.role === "strategy") {
                attrs.expertise = clamp(attrs.expertise + boost);
                attrs.commercial = clamp(attrs.commercial + boost * .8);
                attrs.leadership = clamp(attrs.leadership + boost * .5);
            }
            if (p.role === "operations") {
                attrs.execution = clamp(attrs.execution + boost);
                attrs.leadership = clamp(attrs.leadership + boost * .8);
            }
            if (p.role === "innovation") {
                attrs.expertise = clamp(attrs.expertise + boost);
                attrs.creativity = clamp(attrs.creativity + boost);
                attrs.leadership = clamp(attrs.leadership + boost * .5);
            }
            p.skill = clamp(Math.min(Math.max(p.potential, p.skill), p.skill + .025));
            p.lastTrainingTick = w.tick;
            p.morale = clamp(((_b = p.morale) !== null && _b !== void 0 ? _b : .7) + .05);
            p.careerEvents.push({ tick: w.tick, kind: "milestone", text: "Completed an employee upskilling program." });
            w.events.push({ tick: w.tick, kind: "people", text: "\uD83C\uDF93 ".concat(p.name, " completed training and improved core skills.") });
        }
        completed.push(program.id);
    };
    for (var _i = 0, _c = w.player.trainingPrograms; _i < _c.length; _i++) {
        var program = _c[_i];
        _loop_3(program);
    }
    if (completed.length)
        w.player.trainingPrograms = w.player.trainingPrograms.filter(function (program) { return !completed.includes(program.id); });
}
exports.TALENT_SEARCH_MODES = {
    quick: { label: "Quick available search", days: 2, cost: 5000, candidates: 3, qualityBias: -.08, blurb: "Who can interview immediately? Fast and cheap, but the slate is usually ordinary." },
    online: { label: "Search online", days: 7, cost: 18000, candidates: 4, qualityBias: .025, blurb: "A normal market search with a broader pool and better odds of a strong fit." },
    deep: { label: "Deep search", days: 21, cost: 55000, candidates: 5, qualityBias: .15, blurb: "The agency actively maps the market and approaches stronger candidates. Slow and expensive." },
};
function startTalentSearch(w, role, industryId, mode) {
    var _a, _b, _c, _d;
    if (w.player.talentSearch)
        return { ok: false, reason: "A recruiting search is already in progress." };
    if ((0, infrastructure_1.openSeatCountForRole)(w, role) <= 0)
        return { ok: false, reason: "No compatible office seat is open for this role. Expand an office or build another one before recruiting." };
    if (mode === "online" && !((_b = (_a = w.player.research) === null || _a === void 0 ? void 0 : _a.completed) !== null && _b !== void 0 ? _b : []).includes("professional_recruiting"))
        return { ok: false, reason: "Research People & HR Foundations to unlock online searches." };
    if (mode === "deep" && !((_d = (_c = w.player.research) === null || _c === void 0 ? void 0 : _c.completed) !== null && _d !== void 0 ? _d : []).includes("executive_search"))
        return { ok: false, reason: "Research Executive Search to unlock deep searches." };
    var cfg = (awaitIndustry(industryId));
    if (!cfg)
        return { ok: false, reason: "Unknown industry." };
    var def = exports.TALENT_SEARCH_MODES[mode];
    if (w.player.cash < def.cost)
        return { ok: false, reason: "Not enough cash for that search." };
    w.player.cash -= def.cost;
    w.player.talentMarket = [];
    w.player.talentSearch = { id: "talent_search_".concat(w.tick, "_").concat(Math.floor(Math.random() * 1000000)), role: role, industryId: industryId, mode: mode, startedTick: w.tick, daysLeft: def.days, totalDays: def.days, cost: def.cost };
    return { ok: true };
}
function awaitIndustry(industryId) { var _a; return (_a = industries_1.INDUSTRIES[industryId]) !== null && _a !== void 0 ? _a : null; }
function updateTalentSearch(w) {
    var _a, _b, _c;
    var search = w.player.talentSearch;
    if (!search)
        return;
    search.daysLeft = Math.max(0, search.daysLeft - (0, infrastructure_1.facilityEffectMultiplier)(w, "recruiting"));
    if (search.daysLeft > 0)
        return;
    var cfg = (_a = industries_1.INDUSTRIES[search.industryId]) !== null && _a !== void 0 ? _a : w.cfg;
    var def = exports.TALENT_SEARCH_MODES[search.mode];
    var exp = Math.max.apply(Math, __spreadArray(__spreadArray([(_b = w.player.expertise.industry[search.industryId]) !== null && _b !== void 0 ? _b : 0], Object.values(w.player.expertise.category), false), [0], false));
    var names = new Set(__spreadArray(__spreadArray([], w.player.personnel, true), ((_c = w.player.formerPersonnel) !== null && _c !== void 0 ? _c : []), true).map(function (p) { return p.name; }));
    var results = [];
    for (var i = 0; i < def.candidates; i++) {
        var c = generateCandidate(search.role, cfg, exp, names, def.qualityBias);
        names.add(c.name);
        results.push(c);
    }
    w.player.talentMarket = results.sort(function (a, b) { return b.skill - a.skill; });
    w.player.talentMarketRefreshTick = w.tick;
    w.player.talentSearch = null;
    w.events.push({ tick: w.tick, kind: "people", text: "\uD83D\uDD0E Recruiting search complete \u2014 ".concat(results.length, " ").concat(exports.ROLE_LABELS[search.role].toLowerCase(), " candidates are ready to review.") });
}
