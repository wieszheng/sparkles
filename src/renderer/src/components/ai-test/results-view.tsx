import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Handle,
  Position,
  type NodeProps,
  useNodesState,
  useEdgesState,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Table as TableIcon,
  Network,
  Download,
  CheckCircle,
  ListOrdered,
  FileText,
  ArrowLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { TestCase } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResultsViewProps {
  testCases: TestCase[];
  onBack: () => void;
}

const CaseTitleNode = ({ data }: NodeProps) => {
  const priorityColors = {
    P0: "bg-red-100 text-red-700 border-red-300",
    P1: "bg-amber-100 text-amber-700 border-amber-300",
    P2: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const typedData = data as { title: string; priority: string; type: string };
  const priorityClass =
    priorityColors[typedData.priority as keyof typeof priorityColors] ||
    priorityColors.P2;

  return (
    <div className="shadow-lg rounded-lg bg-card border w-[240px] overflow-hidden transition-all">
      <Handle type="target" position={Position.Left} />
      <div className="px-3 py-2 border-b-1 border-border flex justify-between items-center bg-muted/50">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-bold border-2",
            priorityClass,
          )}
        >
          {typedData.priority}
        </span>
        <span className="text-[10px] text-muted-foreground font-bold tracking-wide">
          {typedData.type}
        </span>
      </div>
      <div className="p-3">
        <div className="text-xs font-semibold leading-relaxed">
          {typedData.title}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-600"
      />
    </div>
  );
};

const StepsNode = ({ data }: NodeProps) => {
  const typedData = data as {
    precondition: string;
    steps: string[];
  };

  return (
    <div className="shadow-lg rounded-lg bg-card border w-[320px] overflow-hidden transition-shadow">
      <Handle type="target" position={Position.Left} className="!bg-blue-600" />
      <div className="flex-1">
        <div className="px-3 py-2 border-b-1 border-border flex gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-muted/50">
          <ListOrdered className="w-4 h-4" />
          步骤
        </div>
        <div className="p-3 text-[11px] leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar bg-card">
          {/* 前置条件 */}
          {typedData.precondition && typedData.precondition !== "无" && (
            <div className="mb-3">
              <div className="font-bold text-[11px] mb-1">前置条件：</div>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {typedData.precondition}
              </div>
            </div>
          )}

          {/* 操作步骤 */}
          <div>
            <div className="font-bold text-[11px] mb-1">操作步骤：</div>
            {typedData.steps.map((step, i) => (
              <div
                key={i}
                className="whitespace-pre-wrap mb-1 text-muted-foreground"
              >
                {i + 1}. {step}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-600"
      />
    </div>
  );
};

const ResultNode = ({ data }: NodeProps) => {
  const typedData = data as {
    content: string;
  };

  return (
    <div className="shadow-lg rounded-lg bg-card border w-[280px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-green-600"
      />
      <div className="flex-1">
        <div className="px-3 py-2 border-b-1 border-border flex gap-1 text-[11px] font-bold uppercase tracking-wider text-green-600 bg-muted/50">
          <CheckCircle className="w-4 h-4" />
          预期结果
        </div>
        <div className="p-3 text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar bg-card">
          {typedData.content}
        </div>
      </div>
    </div>
  );
};

const RootNode = () => {
  return (
    <div className="shadow-lg rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-1 border-primary/30 w-[200px] overflow-hidden transition-all">
      <Handle type="source" position={Position.Right} />
      <div className="flex flex-col items-center justify-center p-2">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-1">
          <Network className="w-6 h-6 text-primary" />
        </div>

        <div className="text-[10px] font-bold mt-1 text-center">
          测试用例总览
        </div>
      </div>
    </div>
  );
};

const CategoryNode = ({ data }: NodeProps) => {
  const typedData = data as { label: string; count?: number };

  return (
    <div className="shadow-lg rounded-lg bg-card border border-border/50 w-[200px] overflow-hidden transition-all">
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col items-center justify-center p-3">
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
          <FileText className="w-5 h-5" />
        </div>
        <div className="text-sm font-bold text-center leading-tight">
          {typedData.label}
        </div>
        {typedData.count && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {typedData.count} 条用例
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const calculateGraphLayout = (
  testCases: TestCase[],
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const X_ROOT = 50;
  const X_CAT = 350;
  const X_TITLE = 650;
  const X_STEPS = 1100;
  const X_RES = 1500;

  const ROW_HEIGHT = 280;
  let currentY = 100;

  const categories = Array.from(new Set(testCases.map((tc) => tc.type)));

  // Root Node
  const rootY = (testCases.length * ROW_HEIGHT) / 2 + 100;
  nodes.push({
    id: "root",
    type: "root",
    data: { label: "测试计划总览" },
    position: { x: X_ROOT, y: rootY },
  });

  // Category Nodes and Connections
  categories.forEach((cat) => {
    const catCases = testCases.filter((tc) => tc.type === cat);
    const catNodeY = currentY + (catCases.length * ROW_HEIGHT) / 2 - 40;
    const catId = `cat-${cat}`;

    // Category Node
    nodes.push({
      id: catId,
      type: "category",
      data: { label: cat, count: catCases.length },
      position: { x: X_CAT, y: catNodeY },
    });

    // Root to Category Edge
    edges.push({
      id: `e-root-${catId}`,
      source: "root",
      target: catId,
      className: "react-flow__edge-path-slow",
      style: {
        stroke: "#6b7280",
        strokeWidth: 1,
        strokeDasharray: "5, 5",
      },
    });

    // Test Cases for this Category
    catCases.forEach((tc) => {
      const rowY = currentY;

      // Test Case Title Node
      const titleId = tc.id;
      nodes.push({
        id: titleId,
        type: "caseTitle",
        position: { x: X_TITLE, y: rowY },
        data: { title: tc.title, priority: tc.priority, type: tc.type },
      });

      // Steps Node (前置条件和操作步骤)
      const stepId = `${tc.id}-step`;
      nodes.push({
        id: stepId,
        type: "steps",
        position: { x: X_STEPS, y: rowY },
        data: {
          precondition: tc.precondition || "无",
          steps: tc.steps,
        },
      });

      // Result Node
      const resId = `${tc.id}-res`;
      nodes.push({
        id: resId,
        type: "result",
        position: { x: X_RES, y: rowY },
        data: { content: tc.expectedResult },
      });

      // Create edges with enhanced visibility
      const edgeStyle = {
        stroke: "#3b82f6",
        strokeWidth: 1,
        strokeDasharray: "8, 4",
      };

      const categoryEdgeStyle = {
        stroke: "#6b7280",
        strokeWidth: 1,
        strokeDasharray: "8, 4",
      };

      const resultEdgeStyle = {
        stroke: "#22c55e",
        strokeWidth: 1,
        strokeDasharray: "8, 4",
      };

      // Category to Test Case Edge
      edges.push({
        id: `e-${catId}-${titleId}`,
        source: catId,
        target: titleId,
        style: categoryEdgeStyle,
      });

      // Test Case to Steps Edge
      edges.push({
        id: `e-${titleId}-${stepId}`,
        source: titleId,
        target: stepId,
        style: edgeStyle,
      });

      // Steps to Result Edge
      edges.push({
        id: `e-${stepId}-${resId}`,
        source: stepId,
        target: resId,
        style: resultEdgeStyle,
      });

      currentY += ROW_HEIGHT;
    });

    currentY += 80;
  });

  return { nodes, edges };
};

export function ResultsView({ testCases, onBack }: ResultsViewProps) {
  const { theme } = useTheme();

  const [viewMode, setViewMode] = useState<"table" | "mindmap">("table");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = {
    root: RootNode,
    category: CategoryNode,
    caseTitle: CaseTitleNode,
    steps: StepsNode,
    result: ResultNode,
  };

  useEffect(() => {
    const layout = calculateGraphLayout(testCases);

    setNodes(layout.nodes as any);

    setEdges(layout.edges as any);
  }, [testCases, setNodes, setEdges]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      testCases.map((tc) => ({
        ID: tc.id,
        标题: tc.title,
        模块: tc.type,
        优先级: tc.priority,
        前置条件: tc.precondition,
        操作步骤: tc.steps,
        预期结果: tc.expectedResult,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TestCases");
    XLSX.writeFile(wb, "SmartTest_Cases.xlsx");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-lg">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card backdrop-blur-sm flex-shrink-0 py-2">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            评审
          </Button>
          <div className="h-4 w-px" />
          <span className="text-xs text-muted-foreground mr-3">|</span>
          <Badge>共 {testCases.length} 条用例</Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center h-7 gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              表格视图
            </button>
            <button
              onClick={() => setViewMode("mindmap")}
              className={`flex items-center h-7 gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === "mindmap"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-4 w-4" />
              脑图视图
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4" />
            导出
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === "table" ? (
          <>
            {/* 固定表头 */}
            <div className="flex-shrink-0 bg-card/50">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] min-w-[80px]">
                        ID
                      </TableHead>
                      <TableHead className="min-w-[150px]">用例标题</TableHead>
                      <TableHead className="min-w-[100px]">类型</TableHead>
                      <TableHead className="min-w-[150px]">前置条件</TableHead>
                      <TableHead className="min-w-[200px]">测试步骤</TableHead>
                      <TableHead className="min-w-[150px]">预期结果</TableHead>
                      <TableHead className="w-[80px] min-w-[80px]">
                        优先级
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>
            </div>

            {/* 可滚动的表格内容 */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="min-w-[800px] mr-2.5">
                  <Table>
                    <TableBody>
                      {testCases.map((tc) => (
                        <TableRow key={tc.id}>
                          <TableCell className="font-mono text-sm">
                            {tc.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {tc.title}
                          </TableCell>
                          <TableCell>
                            <Badge>{tc.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tc.precondition}
                          </TableCell>
                          <TableCell className="text-sm whitespace-pre-line">
                            {tc.steps.map((s) => `${s}`).join("\n")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tc.expectedResult}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tc.priority === "P0"
                                  ? "destructive"
                                  : tc.priority === "P1"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {tc.priority === "P0"
                                ? "高"
                                : tc.priority === "P1"
                                  ? "中"
                                  : "低"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              colorMode={theme}
              minZoom={0.1}
              maxZoom={4}
              fitView
              fitViewOptions={{
                padding: 0.2,
                maxZoom: 1.2,
                minZoom: 0.5,
              }}
              defaultEdgeOptions={{
                animated: true,
              }}
            >
              <Background gap={12} />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}
