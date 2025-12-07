import { useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ProjectSelector } from "@/components/test-cases/project-selector";
import { TestCaseList } from "@/components/test-cases/test-case-list";
import { motion } from "framer-motion";
import { Api } from "@/apis";

interface TestCasesProps {
  onLoadTestCaseWorkflow?: (testCase: object) => void;
}

export function TestCases({ onLoadTestCaseWorkflow }: TestCasesProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<Directory | null>(
    null,
  );
  const [projects, setProjects] = useState<Project[]>([]);

  // 获取项目列表
  const getProjectAll = async () => {
    try {
      const response = await window.api.callApi("POSt", Api.getProjectAll, {
        current: 1,
        pageSize: 100,
      });
      setProjects(response.data.items);
      // 如果有项目数据且当前没有选中项目，则默认选中第一个
      if (
        response.data.items &&
        response.data.items.length > 0 &&
        !selectedProject
      ) {
        setSelectedProject(response.data.items[0]);
      }
    } catch (error) {
      console.error("获取项目列表失败:", error);
    }
  };

  useEffect(() => {
    getProjectAll();
  }, []);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedDirectory(null);
  };

  const handleDirectorySelect = (directory: Directory) => {
    setSelectedDirectory(directory);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 bg-card rounded-lg"
    >
      <div className="h-[calc(100vh-120px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={22} minSize={22} maxSize={30}>
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject}
              selectedDirectory={selectedDirectory}
              onProjectSelect={handleProjectSelect}
              onDirectorySelect={handleDirectorySelect}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={78} minSize={55}>
            <TestCaseList
              selectedDirectory={selectedDirectory}
              selectedProject={selectedProject}
              onLoadTestCaseWorkflow={onLoadTestCaseWorkflow}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </motion.div>
  );
}
