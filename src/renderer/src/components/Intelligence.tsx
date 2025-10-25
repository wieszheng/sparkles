import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Edit3,
  Sparkles,
  Trash2,
  Loader2,
  FlaskConical,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { zhipuaiChatService } from "@/services/zhipuai";
import { motion } from "framer-motion";

interface RequirementAnalysis {
  id: string;
  originalRequirement: string;
  summary: string;
  keyPoints: string[];
  testScenarios: string[];
  createdAt: string;
}

interface TestCase {
  id: string;
  title: string;
  scenario: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  priority: "P0" | "P1" | "P2" | "P3";
  type: "functional" | "ui" | "performance" | "security" | "compatibility";
}
export function Intelligence() {
  const [requirement, setRequirement] = useState("");
  const [currentAnalysis, setCurrentAnalysis] =
    useState<RequirementAnalysis | null>(null);
  const [currentTestCases, setCurrentTestCases] = useState<TestCase[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAnalyzeRequirement = async () => {
    if (!requirement.trim()) {
      toast.error("请先输入需求描述");
      return;
    }
    const analysisPrompt = `请分析以下软件需求，并按照指定格式输出：

      需求描述：
      ${requirement}
      
      请按照以下JSON格式输出分析结果：
      {
        "summary": "需求的简洁总结",
        "keyPoints": ["关键测试点1", "关键测试点2", "关键测试点3"],
        "testScenarios": ["测试场景1", "测试场景2", "测试场景3"]
      }
      
      要求：
      1. summary应该是对需求的简洁概括，不超过100字
      2. keyPoints应该包含3-8个关键的测试要点
      3. testScenarios应该包含3-10个具体的测试场景
      4. 输出必须是有效的JSON格式`;
    setIsAnalyzing(true);
    try {
      const content = await zhipuaiChatService.sendMessage(
        [{ role: "user", content: analysisPrompt }],
        undefined,
        true,
      );
      console.log(content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        const analysis: RequirementAnalysis = {
          id: `req-${Date.now()}`,
          originalRequirement: requirement,
          summary: parsed.summary || "需求分析",
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          testScenarios: Array.isArray(parsed.testScenarios)
            ? parsed.testScenarios
            : [],
          createdAt: new Date().toISOString(),
        };

        setCurrentAnalysis(analysis);
        toast.success("需求分析完成");
      } else {
        toast.error("AI返回内容解析失败，请重试");
      }
    } catch (err) {
      console.error(err);
      toast.error("分析过程中发生错误，请稍后重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateTestCases = async () => {
    if (!currentAnalysis) {
      toast.error("请先分析需求");
      return;
    }
    const generationPrompt = `基于以下需求分析结果，生成详细的测试用例：
      
      原始需求：${currentAnalysis.originalRequirement}
      
      需求总结：${currentAnalysis.summary}
      
      关键测试点：
      ${currentAnalysis.keyPoints.map((point) => `- ${point}`).join("\n")}
      
      测试场景：
      ${currentAnalysis.testScenarios.map((scenario) => `- ${scenario}`).join("\n")}
      
      请按照以下JSON格式生成测试用例：
      {
        "testCases": [
          {
            "title": "用例标题",
            "scenario": "测试场景描述",
            "preconditions": "前置步骤1\\n前置步骤2\\n前置步骤3",
            "steps": "测试步骤1\\n测试步骤2\\n测试步骤3", 
            "expectedResult": "预期的测试结果",
            "priority": "P0|P1|P2|P3",
            "type": "functional|ui|performance|security|compatibility"
          } 
        ]
      }
      注意事项：
      - 不要在步骤和前置条件前加上数字或任何序号。
      要求：
      1. 生成高质量的测试用例
      2. 每个测试用例必须包含清晰的标题
      3. 前置步骤和测试步骤必须用\\n分隔，每个步骤独立成行
      4. 前置步骤包括：环境准备、数据准备、权限设置等
      5. 测试步骤要详细具体，便于执行
      6. 覆盖所有关键测试点和测试场景
      7. 预期结果要明确可验证
      8. 用例强度说明：P0（最高优先级，核心功能）、P1（高优先级，重要功能）、P2（中优先级，常规功能）、P3（低优先级，边缘场景）
      9. 合理分配用例强度和测试类型
      10. 输出必须是有效的JSON格式`;
    setIsGenerating(true);
    try {
      const content = await zhipuaiChatService.sendMessage(
        [{ role: "user", content: generationPrompt }],
        undefined,
        true,
      );
      console.log(content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (Array.isArray(parsed.testCases)) {
          const testCases: TestCase[] = parsed.testCases.map(
            (tc, index: number) => ({
              id: `tc-${Date.now()}-${index}`,
              title: tc.title || "未命名测试用例",
              scenario: tc.scenario || "",
              preconditions: tc.preconditions || "",
              steps: tc.steps || "",
              expectedResult: tc.expectedResult || "",
              priority: ["P0", "P1", "P2", "P3"].includes(tc.priority)
                ? tc.priority
                : "P2",
              type: [
                "functional",
                "ui",
                "performance",
                "security",
                "compatibility",
              ].includes(tc.type)
                ? tc.type
                : "functional",
            }),
          );

          setCurrentTestCases(testCases);

          toast.success(`成功生成 ${testCases.length} 个测试用例`);
        } else {
          toast.error("AI返回内容不包含 testCases");
        }
      } else {
        toast.error("AI返回内容解析失败，请重试");
      }
    } catch (err) {
      console.error(err);
      toast.error("生成用例过程中发生错误，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const parseSteps = (steps: string): string[] => {
    return steps.split("\n").filter((step) => step.trim() !== "");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-5"
    >
      <div className="space-y-3">
        <div className="ml-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <Label>需求描述</Label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 px-0.5">
          <div className="md:col-span-4 space-y-2">
            <Textarea
              value={requirement}
              className="h-[120px]"
              onChange={(e) => setRequirement(e.target.value)}
              rows={5}
              placeholder="请详细描述您的功能需求，包括具体的业务场景、用户操作流程、预期结果等信息。例如：用户登录功能，包括用户名密码验证、记住登录状态、错误提示等..."
            />
          </div>
          <div className="space-y-2 mt-2">
            <Select disabled={true}>
              <SelectTrigger>
                <SelectValue placeholder="选择级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoke">smoke</SelectItem>
                <SelectItem value="regression">regression</SelectItem>
                <SelectItem value="full">full</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              size="sm"
              onClick={handleAnalyzeRequirement}
              disabled={isAnalyzing || isGenerating}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                "智能分析"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRequirement("")}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </Button>
          </div>
        </div>
      </div>
      <div>
        <div className="h-[calc(100vh-333px)] rounded-md overflow-hidden flex flex-col">
          <div className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              <Label>分析结果</Label>
            </div>
          </div>
          <div
            className="space-y-3 p-4 flex-1 overflow-auto"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {isAnalyzing ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ) : currentAnalysis ? (
              <>
                <div>
                  <span className="flex text-sm items-center gap-2 font-semibold mb-2">
                    需求总结
                  </span>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {currentAnalysis?.summary}
                  </p>
                </div>

                <div>
                  <span className="flex text-sm items-center gap-2 font-semibold mb-2">
                    关键测试点
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentAnalysis?.keyPoints.map((point, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="flex text-sm items-center gap-2 font-semibold mb-2">
                    测试场景
                  </span>
                  <ul className="space-y-1">
                    {currentAnalysis.testScenarios.map((scenario, index) => (
                      <li
                        key={index}
                        className="text-xs text-muted-foreground flex items-start gap-2 mt-1"
                      >
                        <span className="text-primary">•</span>
                        <span>{scenario}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {currentTestCases &&
                  currentTestCases.length > 0 &&
                  !isAnalyzing && (
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          测试用例 ({currentTestCases.length})
                        </span>
                        <Button variant="ghost">
                          <Download className="h-4 w-4" />
                          <span className="text-sm">导出</span>
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] ">编号</TableHead>
                            <TableHead className="w-[80px]">强度</TableHead>
                            <TableHead className="w-[100px]">类型</TableHead>
                            <TableHead>标题</TableHead>
                            <TableHead>前置条件</TableHead>
                            <TableHead>测试步骤</TableHead>
                            <TableHead>预期结果</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentTestCases.map((testCase, index) => (
                            <TableRow key={testCase.id}>
                              <TableCell className="font-mono text-xs text-primary">
                                TC-{String(index + 1).padStart(3, "0")}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex rounded-md px-1.5 py-0.5 text-xs ${
                                    testCase.priority === "P0"
                                      ? "border border-red-500/20 bg-red-500/10 text-red-400"
                                      : testCase.priority === "P1"
                                        ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                        : "border border-green-500/20 bg-green-500/10 text-green-400"
                                  }`}
                                >
                                  {testCase.priority}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                  {testCase.type === "functional"
                                    ? "功能"
                                    : testCase.type === "ui"
                                      ? "UI"
                                      : testCase.type === "performance"
                                        ? "性能"
                                        : testCase.type === "security"
                                          ? "安全"
                                          : "兼容性"}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div>
                                  <div
                                    className="font-medium text-foreground truncate"
                                    title={testCase.title}
                                  >
                                    {testCase.title}
                                  </div>
                                  <div
                                    className="mt-1 text-xs text-muted-foreground truncate"
                                    title={testCase.scenario}
                                  >
                                    {testCase.scenario}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="space-y-1">
                                  {testCase.preconditions.length > 0 && (
                                    <div className="mb-2">
                                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                        {parseSteps(testCase.preconditions).map(
                                          (condition, i) => (
                                            <li key={i}>• {condition}</li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <div className="space-y-1">
                                  <ol className="space-y-0.5 text-xs text-muted-foreground">
                                    {parseSteps(testCase.steps).map(
                                      (step, i) => (
                                        <li key={i}>
                                          <span className="font-medium text-primary">
                                            {i + 1}.
                                          </span>{" "}
                                          {step}
                                        </li>
                                      ),
                                    )}
                                  </ol>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div
                                  className="truncate text-xs"
                                  title={testCase.expectedResult}
                                >
                                  {testCase.expectedResult}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 p-4 text-muted-foreground">
                <div>
                  <FlaskConical className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <span className="text-sm font-semibold">
                    请先填写需求描述，并点击开始AI分析
                  </span>
                </div>
                <p className="text-xs">
                  提示：描述越详细，分析越准确。包含业务场景、操作流程和预期结果。
                </p>
              </div>
            )}
          </div>
          {currentAnalysis && !isAnalyzing && (
            <div className="p-4 flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={handleGenerateTestCases}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "确认分析结果并生成"
                )}
              </Button>
              <Button size="sm" variant="outline" disabled={true}>
                <Edit3 className="h-4 w-4" />
                编辑
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
