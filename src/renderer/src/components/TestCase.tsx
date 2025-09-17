import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ProjectSelector } from "@/components/test-cases/project-selector";
import { TestCaseList } from "@/components/test-cases/test-case-list.tsx";
import { motion } from "framer-motion";

export function TestCases() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<any>(null);

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setSelectedDirectory(null);
  };

  const handleDirectorySelect = (directory: any) => {
    setSelectedDirectory(directory);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 bg-card rounded-xl"
    >
      <div className="h-[calc(100vh-113px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={22} minSize={20} maxSize={30}>
            <ProjectSelector
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
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </motion.div>
  );
}
