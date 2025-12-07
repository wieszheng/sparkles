export const AppStep = {
  INPUT: "INPUT",
  ANALYSIS: "ANALYSIS",
  REVIEW: "REVIEW",
  GENERATING: "GENERATING",
  RESULTS: "RESULTS",
} as const;

export type AppStep = (typeof AppStep)[keyof typeof AppStep];
