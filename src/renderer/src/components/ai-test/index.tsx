import { useEffect, useState } from "react";

import {
  analyzeRequirements,
  generateTestCases,
} from "@/services/zhipuai-service";
import { InputSection } from "./input-section";
import { TestPointsReview } from "./test-points-review";
import { ResultsView } from "./results-view";
import { Bot, Sparkles } from "lucide-react";
import { AppStep } from "./types";

interface AIGenerateTestCaseProps {
  onStepChange: (step: AppStep) => void;
}
export function AiTest({ onStepChange }: AIGenerateTestCaseProps) {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);

  const [inputText, setInputText] = useState("");
  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState("glm-4-air");
  const [summary, setSummary] = useState("");
  const [testPoints, setTestPoints] = useState<TestPoint[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);
  // Handlers
  const handleAnalyze = async () => {
    try {
      setStep(AppStep.ANALYSIS);
      const result = await analyzeRequirements(inputText, inputFiles);
      setSummary(result.summary);
      setTestPoints(result.testPoints);
      setStep(AppStep.REVIEW);
    } catch (e) {
      console.error(e);

      setStep(AppStep.INPUT);
    }
  };

  const handleGenerate = async () => {
    try {
      setStep(AppStep.GENERATING);

      const result = await generateTestCases(summary, testPoints);
      setTestCases(result.testCases);
      setStep(AppStep.RESULTS);
    } catch (e) {
      console.error(e);

      setStep(AppStep.REVIEW);
    }
  };

  // const handleUpdateTestCase = (updatedCase: TestCase) => {
  //   setTestCases((prev) =>
  //     prev.map((tc) => (tc.id === updatedCase.id ? updatedCase : tc)),
  //   );
  // };

  const reset = () => {
    setStep(AppStep.INPUT);
    setSummary("");
    setTestPoints([]);
    setTestCases([]);
    setInputText("");
    setInputFiles([]);
  };

  // 扫描动画组件
  const ScanningLoader = ({
    title,
    subtitle,
    icon: Icon,
  }: {
    title: string;
    subtitle: string;
    icon: any;
  }) => (
    <div className="flex flex-col items-center justify-center h-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative w-40 h-54 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col p-6 gap-4">
          <div className="w-1/3 h-2 bg-muted rounded-md"></div>
          <div className="w-full h-2 bg-muted/50 rounded-sm"></div>
          <div className="w-full h-2 bg-muted/50 rounded-sm"></div>
          <div className="w-5/6 h-2 bg-muted/50 rounded-sm"></div>

          <div className="mt-auto flex gap-2">
            <div className="w-8 h-8 rounded-full bg-muted/30"></div>
            <div className="flex-1 space-y-2">
              <div className="w-full h-2 bg-muted/50 rounded-sm"></div>
              <div className="w-2/3 h-2 bg-muted/50 rounded-sm"></div>
            </div>
          </div>

          <div className="absolute left-0 right-0 h-1 bg-primary/80 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-scan-up z-20"></div>
          <div className="absolute left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent animate-scan-up z-10 -translate-y-full transform-gpu"></div>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Icon size={24} className="animate-pulse" />
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col h-full">
      {/* STATE: INPUT (Empty State Placeholder) */}
      {step === AppStep.INPUT && (
        <InputSection
          text={inputText}
          setText={setInputText}
          files={inputFiles}
          setFiles={setInputFiles}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onAnalyze={handleAnalyze}
          isAnalyzing={false}
          variant="expanded"
        />
      )}

      {/* STATE: ANALYSIS */}
      {step === AppStep.ANALYSIS && (
        <ScanningLoader
          title="AI 正在分析需求文档"
          subtitle="智谱 GLM-4 正在扫描文档并提取关键功能点..."
          icon={Bot}
        />
      )}

      {/* STATE: GENERATING */}
      {step === AppStep.GENERATING && (
        <ScanningLoader
          title="AI 正在构建测试用例"
          subtitle="智谱 GLM-4 正在分析测试点逻辑，生成详细步骤与预期结果..."
          icon={Sparkles}
        />
      )}

      {/* STATE: REVIEW */}
      {step === AppStep.REVIEW && (
        <TestPointsReview
          summary={summary}
          testPoints={testPoints}
          setTestPoints={setTestPoints}
          onGenerate={handleGenerate}
          onBack={() => setStep(AppStep.INPUT)}
          isGenerating={false}
        />
      )}

      {/* STATE: RESULTS */}
      {step === AppStep.RESULTS && (
        <ResultsView
          testCases={testCases}
          // onUpdateTestCase={handleUpdateTestCase}
          onBack={reset}
        />
      )}
    </div>
  );
}
