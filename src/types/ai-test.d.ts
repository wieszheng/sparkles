interface TestPoint {
  id: string;
  category: string;
  description: string;
}

interface TestCase {
  id: string;
  title: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  priority: "P0" | "P1" | "P2";
  type: "Functional" | "UI" | "Performance" | "Security";
}

interface AnalysisResult {
  summary: string;
  testPoints: TestPoint[];
}

interface GenerationResult {
  testCases: TestCase[];
}

// React Flow Types (Simplified for our internal usage)
interface MindMapNode {
  id: string;
  type?: string;
  data: { label: string };
  position: { x: number; y: number };
  style?: any;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}
