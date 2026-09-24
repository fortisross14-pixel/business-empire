"use strict";
// ============================================================================
// Domain types. Money is in whole currency units (dollars). Units are item counts.
// One TICK = one day. Months are 30 days, quarters 90, years 360 (clean calendar).
// "PerQuarter" quantities are run-rates; the loop slices them by TICKS_PER_QUARTER.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEPT_TIERS = exports.BASE_SALARIES = exports.RARITY_DEFS = exports.VISION_GOALS = exports.PRODUCT_PROJECT_TIERS = exports.DESIGN_DEPTHS = exports.PRODUCT_RARITY_DEFS = exports.TICK_RATE_SCALE = exports.TICKS_PER_YEAR = exports.TICKS_PER_QUARTER = exports.TICKS_PER_MONTH = exports.DAYS_PER_MONTH = exports.TICKS_PER_DAY = void 0;
exports.computeProductRarity = computeProductRarity;
exports.TICKS_PER_DAY = 1;
exports.DAYS_PER_MONTH = 30;
exports.TICKS_PER_MONTH = 30;
exports.TICKS_PER_QUARTER = 90;
exports.TICKS_PER_YEAR = 360;
// Per-tick easing rates were tuned at 24 ticks/quarter. With 90 now, scale them so the
// per-quarter behaviour (how fast awareness/equity/customers move) stays balanced.
exports.TICK_RATE_SCALE = 24 / exports.TICKS_PER_QUARTER;
exports.PRODUCT_RARITY_DEFS = {
    common: { label: "Common", color: "#9ca3af", minScore: 0 },
    uncommon: { label: "Uncommon", color: "#34d399", minScore: 0.25 },
    rare: { label: "Rare", color: "#38bdf8", minScore: 0.45 },
    epic: { label: "Epic", color: "#c084fc", minScore: 0.65 },
    legendary: { label: "Legendary", color: "#fbbf24", minScore: 0.82 },
};
function computeProductRarity(score) {
    if (score >= 0.82)
        return "legendary";
    if (score >= 0.65)
        return "epic";
    if (score >= 0.45)
        return "rare";
    if (score >= 0.25)
        return "uncommon";
    return "common";
}
exports.DESIGN_DEPTHS = {
    quick: { label: "Quick", days: 14, qualityMult: 0.72, desc: "Fast follower. Cheap and quick, but less differentiation." },
    standard: { label: "Standard", days: 45, qualityMult: 1.00, desc: "Balanced development for a normal commercial launch." },
    advanced: { label: "Advanced", days: 90, qualityMult: 1.22, desc: "More research, testing and refinement." },
    breakthrough: { label: "Breakthrough", days: 150, qualityMult: 1.42, desc: "Long, expensive-to-wait development aimed at standout products." },
};
exports.PRODUCT_PROJECT_TIERS = {
    A: { label: "A", baseDays: 35, designerSlots: 1, leadRequired: false, designQualityCap: .46, priorityPoints: 13, description: "Focused startup project. One Product Designer; limited scope and roughly 1–2★ design ceiling." },
    AA: { label: "AA", baseDays: 80, designerSlots: 1, leadRequired: true, designQualityCap: .79, priorityPoints: 18, description: "Advanced project. One Product Lead plus one Product Designer; capable of a strong 3–4★ design." },
    AAA: { label: "AAA", baseDays: 150, designerSlots: 3, leadRequired: true, designQualityCap: 1, priorityPoints: 23, description: "Flagship program. One Product Lead plus three Product Designers; expensive in time and people, but capable of market-leading design." },
};
exports.VISION_GOALS = {
    quality: { label: "Quality", adjective: "best", bonusType: "quality", bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "design quality" },
    sales: { label: "Sales", adjective: "most sold", bonusType: "sales", bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "demand" },
    recognition: { label: "Recognition", adjective: "most valued", bonusType: "recognition", bonusMaxIndustry: 0.10, bonusMaxProduct: 0.20, desc: "brand equity gain" },
};
exports.RARITY_DEFS = {
    common: { label: "Common", color: "#9ca3af", salaryMult: 1.0, skillRange: [0.15, 0.35] },
    uncommon: { label: "Uncommon", color: "#34d399", salaryMult: 1.6, skillRange: [0.30, 0.50] },
    rare: { label: "Rare", color: "#38bdf8", salaryMult: 2.5, skillRange: [0.45, 0.65] },
    epic: { label: "Epic", color: "#c084fc", salaryMult: 4.0, skillRange: [0.60, 0.80] },
    legendary: { label: "Legendary", color: "#fbbf24", salaryMult: 7.0, skillRange: [0.80, 0.95] },
};
exports.BASE_SALARIES = {
    product_manager: 6000, finance: 4500, marketing: 5000, strategy: 5500, operations: 4000, innovation: 8500,
};
exports.DEPT_TIERS = [
    { tier: 0, label: "None", cost: 0, detail: "Cash balance + quarterly totals only." },
    { tier: 1, label: "Small team", cost: 0, detail: "1–2 staffed seats. Monthly high-level summaries (revenue, costs, share)." },
    { tier: 2, label: "Department", cost: 0, detail: "3–4 staffed seats. Detailed by-SKU and by-segment breakdowns, weekly." },
    { tier: 3, label: "Full department", cost: 0, detail: "5+ staffed seats. Everything, all charts, near-real-time (daily)." },
];
