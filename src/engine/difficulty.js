"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIFFICULTIES = void 0;
exports.difficultyConfig = difficultyConfig;
exports.DIFFICULTIES = {
    entrepreneur: {
        id: "entrepreneur", label: "Entrepreneur", startingCash: 5000000,
        investorExpectations: 1, graceQuarters: 4, expectationTargetGrowth: 0.10,
        expectationTargetMargin: 0.04, maxExpectationStrikes: 5,
        description: "Well-funded, but investors expect visible traction. You can experiment — not drift forever.",
    },
    standard: {
        id: "standard", label: "Standard", startingCash: 2500000,
        investorExpectations: 0.55, graceQuarters: 6, expectationTargetGrowth: 0.06,
        expectationTargetMargin: 0.02, maxExpectationStrikes: 7,
        description: "Balanced capital and pressure. Enough runway for mistakes, but weak economics still hurt.",
    },
    bootstrap: {
        id: "bootstrap", label: "Bootstrap", startingCash: 850000,
        investorExpectations: 0, graceQuarters: 999, expectationTargetGrowth: 0,
        expectationTargetMargin: 0, maxExpectationStrikes: 999,
        description: "Very little cash and no investor pressure. Survive through disciplined choices and cash flow.",
    },
};
function difficultyConfig(id) {
    return exports.DIFFICULTIES[id !== null && id !== void 0 ? id : "standard"];
}
