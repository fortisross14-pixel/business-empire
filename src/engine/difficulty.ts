import type { DifficultyId } from "./types";

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  startingCash: number;
  investorExpectations: number; // 0..1, how aggressively outside capital expects traction
  graceQuarters: number;
  expectationTargetGrowth: number; // quarterly revenue growth expected once grace ends
  expectationTargetMargin: number; // EBITDA margin expected once the company has meaningful revenue
  maxExpectationStrikes: number;
  description: string;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  entrepreneur: {
    id: "entrepreneur", label: "Entrepreneur", startingCash: 5_000_000,
    investorExpectations: 1, graceQuarters: 4, expectationTargetGrowth: 0.10,
    expectationTargetMargin: 0.04, maxExpectationStrikes: 5,
    description: "Well-funded, but investors expect visible traction. You can experiment — not drift forever.",
  },
  standard: {
    id: "standard", label: "Standard", startingCash: 2_500_000,
    investorExpectations: 0.55, graceQuarters: 6, expectationTargetGrowth: 0.06,
    expectationTargetMargin: 0.02, maxExpectationStrikes: 7,
    description: "Balanced capital and pressure. Enough runway for mistakes, but weak economics still hurt.",
  },
  bootstrap: {
    id: "bootstrap", label: "Bootstrap", startingCash: 850_000,
    investorExpectations: 0, graceQuarters: 999, expectationTargetGrowth: 0,
    expectationTargetMargin: 0, maxExpectationStrikes: 999,
    description: "Very little cash and no investor pressure. Survive through disciplined choices and cash flow.",
  },
};

export function difficultyConfig(id: DifficultyId | undefined) {
  return DIFFICULTIES[id ?? "standard"];
}
