import React, { useState, useMemo, useEffect } from "react";
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
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Table as TableIcon,
  Network,
  Download,
  CheckCircle,
  ListOrdered,
  FileText,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { TestCase } from "./types";
import { cn } from "@/lib/utils.ts";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResultsViewProps {
  testCases: TestCase[];
  onUpdateTestCase: (updatedCase: TestCase) => void;
  onBack: () => void;
}

// --- Custom Nodes (Styled) ---

const CaseTitleNode = ({ data }: NodeProps) => {
  const priorityColors = {
    P0: 'bg-red-100 text-red-700 border-red-300',
    P1: 'bg-amber-100 text-amber-700 border-amber-300',
    P2: 'bg-blue-100 text-blue-700 border-blue-300'
  };
  
  const typedData = data as { title: string; priority: string; type: string };
  const priorityClass = priorityColors[typedData.priority as keyof typeof priorityColors] || priorityColors.P2;

  return (
    <div className="shadow-lg rounded-xl bg-card border-2 border-border w-[240px] overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
        style={{ left: -6 }}
      />
      <div className="p-3 border-b-2 border-border flex justify-between items-center bg-muted/50">
         <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border-2", priorityClass)}>
           {typedData.priority}
         </span>
         <span className="text-[10px] text-muted-foreground font-medium tracking-wide">{typedData.type}</span>
      </div>
      <div className="p-3 bg-card">
        <div className="text-xs font-semibold text-card-foreground leading-relaxed">{typedData.title}</div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-primary border-2 border-background rounded-full"
        style={{ right: -6 }}
      />
    </div>
  );
};

const DetailNode = ({ data }: NodeProps) => {
  const typedData = data as { type: string; label: string; content: string };
  
  let Icon = FileText;
  let headerColor = 'text-muted-foreground';
  let accentColor = 'bg-muted';

  if (typedData.type === 'precondition') {
    Icon = AlertCircle;
    headerColor = 'text-amber-600';
    accentColor = 'bg-amber-500';
  } else if (typedData.type === 'steps') {
    Icon = ListOrdered;
    headerColor = 'text-blue-600';
    accentColor = 'bg-blue-500';
  } else if (typedData.type === 'result') {
    Icon = CheckCircle;
    headerColor = 'text-green-600';
    accentColor = 'bg-green-500';
  }

  return (
    <div className="shadow-md rounded-xl bg-card border-2 border-border w-[280px] overflow-hidden hover:shadow-lg transition-shadow">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-muted-foreground border-2 border-background rounded-full"
        style={{ left: -6 }}
      />
      <div className="flex">
         <div className={`w-2 ${accentColor}`}></div>
         <div className="flex-1">
            <div className={`px-3 py-2 border-b-2 border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${headerColor} bg-muted/50`}>
              <Icon size={10} />
              {typedData.label}
            </div>
            <div className="p-3 text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar bg-card">
              {typedData.content}
            </div>
         </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-muted-foreground border-2 border-background rounded-full"
        style={{ right: -6 }}
      />
    </div>
  );
};

const calculateGraphLayout = (testCases: TestCase[]): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const X_ROOT = 50;
  const X_CAT = 350;
  const X_TITLE = 650;
  const X_PRE = 1000;
  const X_STEP = 1400;
  const X_RES = 1800;
  
  const ROW_HEIGHT = 280; 
  let currentY = 100;
  
  const categories = Array.from(new Set(testCases.map(tc => tc.type)));

  // Root Node
  const rootY = (testCases.length * ROW_HEIGHT) / 2 + 100;
  nodes.push({
    id: 'root',
    type: 'input',
    data: { label: '测试计划总览' },
    position: { x: X_ROOT, y: rootY },
      style: { 
        background: 'hsl(var(--primary))', 
        color: 'hsl(var(--primary-foreground))', 
        border: '2px solid hsl(var(--primary))', 
        borderRadius: '50px', 
        width: 160, 
        padding: '14px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
      },
  });

  // Category Nodes and Connections
  categories.forEach(cat => {
    const catCases = testCases.filter(tc => tc.type === cat);
    const catNodeY = currentY + (catCases.length * ROW_HEIGHT) / 2 - 40;
    const catId = `cat-${cat}`;
    
    // Category Node
    nodes.push({
      id: catId,
      data: { label: cat },
      position: { x: X_CAT, y: catNodeY },
      style: { 
        background: 'hsl(var(--card))', 
        border: '2px solid hsl(var(--border))', 
        borderRadius: '12px', 
        fontWeight: 'bold', 
        width: 180, 
        padding: '12px',
        textAlign: 'center',
        color: 'hsl(var(--card-foreground))',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      },
    });

      // Root to Category Edge
      edges.push({
        id: `e-root-${catId}`,
        source: 'root',
        target: catId,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 3, opacity: 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed }
      });

    // Test Cases for this Category
    catCases.forEach(tc => {
      const rowY = currentY; 
      
      // Test Case Title Node
      const titleId = tc.id;
      nodes.push({
        id: titleId,
        type: 'caseTitle',
        position: { x: X_TITLE, y: rowY },
        data: { title: tc.title, priority: tc.priority, type: tc.type }
      });

      // Precondition Node
      const preId = `${tc.id}-pre`;
      nodes.push({
        id: preId,
        type: 'detail',
        position: { x: X_PRE, y: rowY },
        data: { type: 'precondition', label: '前置条件', content: tc.precondition && tc.precondition !== '无' ? tc.precondition : '无' }
      });

      // Steps Node
      const stepId = `${tc.id}-step`;
      nodes.push({
        id: stepId,
        type: 'detail',
        position: { x: X_STEP, y: rowY },
        data: { type: 'steps', label: '操作步骤', content: tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') }
      });

      // Result Node
      const resId = `${tc.id}-res`;
      nodes.push({
        id: resId,
        type: 'detail',
        position: { x: X_RES, y: rowY },
        data: { type: 'result', label: '预期结果', content: tc.expectedResult }
      });

      // Create edges with enhanced visibility
      const edgeStyle = { 
        stroke: 'hsl(var(--primary))', 
        strokeWidth: 3,
        opacity: 1
      };

      const categoryEdgeStyle = {
        stroke: 'hsl(var(--muted-foreground))',
        strokeWidth: 3,
        opacity: 0.9
      };

      // Category to Test Case Edge
      edges.push({ 
        id: `e-${catId}-${titleId}`, 
        source: catId, 
        target: titleId, 
        style: categoryEdgeStyle,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--muted-foreground))' }
      });

      // Test Case to Precondition Edge
      edges.push({ 
        id: `e-${titleId}-${preId}`, 
        source: titleId, 
        target: preId, 
        style: edgeStyle, 
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
      });

      // Precondition to Steps Edge
      edges.push({ 
        id: `e-${preId}-${stepId}`, 
        source: preId, 
        target: stepId, 
        style: edgeStyle, 
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
      });

      // Steps to Result Edge
      edges.push({ 
        id: `e-${stepId}-${resId}`, 
        source: stepId, 
        target: resId, 
        style: edgeStyle, 
        markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
      });

      currentY += ROW_HEIGHT;
    });
    
    currentY += 80;
  });

  return { nodes, edges };
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  testCases,
  onUpdateTestCase,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "mindmap">("table");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      caseTitle: CaseTitleNode,
      detail: DetailNode,
    }),
    [],
  );

  useEffect(() => {
    const layout = calculateGraphLayout(testCases);
    console.log('Graph Layout:', {
      nodesCount: layout.nodes.length,
      edgesCount: layout.edges.length,
      edges: layout.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
    });
    setNodes(layout.nodes as any);
    setEdges(layout.edges as any);
  }, [testCases, setNodes, setEdges]);

  const handleStepsChange = (tc: TestCase, text: string) => {
    const steps = text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.replace(/^\d+\.\s*/, ""));
    onUpdateTestCase({ ...tc, steps });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      testCases.map((tc) => ({
        ID: tc.id,
        标题: tc.title,
        模块: tc.type,
        优先级: tc.priority,
        前置条件: tc.precondition,
        操作步骤: tc.steps.join("\n"),
        预期结果: tc.expectedResult,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TestCases");
    XLSX.writeFile(wb, "SmartTest_Cases.xlsx");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm border-b border-border flex-shrink-0 py-2">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            评审
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">|</span>
          <Badge variant="outline">共 {testCases.length} 条用例</Badge>
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

          <Button size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4" />
            导出
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-card/30">
        {viewMode === "table" ? (
          <div className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <div className="min-w-[1200px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background sticky top-0 z-10 shadow-sm">
                  <tr>
                    {[
                      "ID",
                      "优先级",
                      "类型",
                      "用例标题",
                      "前置条件",
                      "操作步骤",
                      "预期结果",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {testCases.map((tc) => (
                    <tr
                      key={tc.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs text-muted-foreground font-mono align-top w-20 pt-5">
                        {tc.id.slice(-4)}
                      </td>

                      <td className="px-6 py-4 align-top w-24">
                        <select
                          className={cn(
                            "h-8 text-[10px] font-bold",
                            tc.priority === "P0"
                              ? "text-red-600 bg-red-50 border-red-200"
                              : tc.priority === "P1"
                                ? "text-amber-600 bg-amber-50 border-amber-200"
                                : "text-blue-600 bg-blue-50 border-blue-200",
                          )}
                          value={tc.priority}
                          onChange={(e) =>
                            onUpdateTestCase({
                              ...tc,
                              priority: e.target.value as any,
                            })
                          }
                        >
                          <option value="P0">P0</option>
                          <option value="P1">P1</option>
                          <option value="P2">P2</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 align-top w-32">
                        <select
                          className="h-8 text-xs text-muted-foreground"
                          value={tc.type}
                          onChange={(e) =>
                            onUpdateTestCase({
                              ...tc,
                              type: e.target.value as any,
                            })
                          }
                        >
                          <option value="功能测试">功能测试</option>
                          <option value="UI测试">UI测试</option>
                          <option value="性能测试">性能测试</option>
                          <option value="安全测试">安全测试</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 align-top w-64">
                        <Textarea
                          className="text-sm font-medium border-none p-0 resize-none shadow-none focus-visible:ring-0 min-h-[50px]"
                          value={tc.title}
                          onChange={(e) =>
                            onUpdateTestCase({ ...tc, title: e.target.value })
                          }
                          rows={2}
                        />
                      </td>

                      <td className="px-6 py-4 align-top w-48">
                        <Textarea
                          className="text-xs text-muted-foreground border-none p-0 resize-none shadow-none focus-visible:ring-0 min-h-[60px]"
                          value={tc.precondition}
                          onChange={(e) =>
                            onUpdateTestCase({
                              ...tc,
                              precondition: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </td>

                      <td className="px-6 py-4 align-top">
                        <Textarea
                          className="text-xs text-muted-foreground border-none p-0 resize-none shadow-none focus-visible:ring-0 font-mono min-h-[80px]"
                          value={tc.steps
                            .map((s, i) => `${i + 1}. ${s}`)
                            .join("\n")}
                          onChange={(e) =>
                            handleStepsChange(tc, e.target.value)
                          }
                          rows={Math.max(3, tc.steps.length)}
                        />
                      </td>

                      <td className="px-6 py-4 align-top w-64">
                        <Textarea
                          className="text-xs text-muted-foreground border-none p-0 resize-none shadow-none focus-visible:ring-0 min-h-[60px]"
                          value={tc.expectedResult}
                          onChange={(e) =>
                            onUpdateTestCase({
                              ...tc,
                              expectedResult: e.target.value,
                            })
                          }
                          rows={3}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full w-full bg-background border border-border">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              defaultViewport={{ x: 0, y: 0, zoom: 0.3 }}
              style={{ background: 'hsl(var(--background))' }}
            >
              <Background color="hsl(var(--muted))" gap={20} size={1} />
              <Controls className="!bg-card !border-border !shadow-lg !rounded-lg" />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
};
