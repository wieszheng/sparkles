export enum AppStep {
  INPUT = "INPUT",
  ANALYSIS = "ANALYSIS",
  REVIEW = "REVIEW",
  GENERATING = "GENERATING",
  RESULTS = "RESULTS",
}

export interface TestPoint {
  id: string;
  category: string;
  description: string;
}

export interface TestCase {
  id: string;
  title: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  priority: "P0" | "P1" | "P2";
  type: "Functional" | "UI" | "Performance" | "Security";
}

export interface AnalysisResult {
  summary: string;
  testPoints: TestPoint[];
}

export interface GenerationResult {
  testCases: TestCase[];
}

// React Flow Types (Simplified for our internal usage)
export interface MindMapNode {
  id: string;
  type?: string;
  data: { label: string };
  position: { x: number; y: number };
  style?: any;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}
