import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FrameSidebar } from "@/components/frame-mark/FrameSidebar";
import { FrameControl } from "@/components/frame-mark/FrameControl";
import { CreateTaskModal } from "@/components/frame-mark/CreateTaskModal";
import { generateId, calculateDurationMs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Video } from "lucide-react";

export function FrameMark() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived state
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const activeVideo = activeTask?.videos.find((v) => v.id === activeVideoId);

  // --- Task Management ---

  const handleCreateTask = (name: string, files: FileList) => {
    const newVideoItems: VideoItem[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      url: URL.createObjectURL(file),
      fps: 30,
      duration: 0,
      startFrame: null,
      endFrame: null,
    }));

    const newTask: Task = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      videos: newVideoItems,
    };

    setTasks((prev) => [...prev, newTask]);
    setActiveTaskId(newTask.id);
    if (newVideoItems.length > 0) {
      setActiveVideoId(newVideoItems[0].id);
    }
    setIsCreateModalOpen(false);
  };

  const handleAddVideosToTask = (files: FileList) => {
    if (!activeTaskId) return;

    const newVideoItems: VideoItem[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      url: URL.createObjectURL(file),
      fps: 30,
      duration: 0,
      startFrame: null,
      endFrame: null,
    }));

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === activeTaskId) {
          return { ...t, videos: [...t.videos, ...newVideoItems] };
        }
        return t;
      }),
    );

    // If no video was active, select the first new one
    if (!activeVideoId && newVideoItems.length > 0) {
      setActiveVideoId(newVideoItems[0].id);
    }
  };

  const handleUpdateVideo = useCallback((updatedVideo: VideoItem) => {
    setTasks((prev) =>
      prev.map((t) => {
        // Find the task containing this video
        if (t.videos.some((v) => v.id === updatedVideo.id)) {
          return {
            ...t,
            videos: t.videos.map((v) =>
              v.id === updatedVideo.id ? updatedVideo : v,
            ),
          };
        }
        return t;
      }),
    );
  }, []);

  const handleDeleteVideo = (videoId: string) => {
    if (!confirm("Remove this video from the task?")) return;

    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        videos: t.videos.filter((v) => v.id !== videoId),
      })),
    );

    if (activeVideoId === videoId) {
      setActiveVideoId(null);
    }
  };

  const handleExportTask = () => {
    if (!activeTask) return;

    const reportData = {
      taskName: activeTask.name,
      taskId: activeTask.id,
      exportDate: new Date().toISOString(),
      videos: activeTask.videos.map((v) => ({
        name: v.name,
        fps: v.fps,
        startTime: v.startFrame?.timestamp,
        endTime: v.endFrame?.timestamp,
        durationMs:
          v.startFrame && v.endFrame
            ? calculateDurationMs(v.startFrame.timestamp, v.endFrame.timestamp)
            : null,
      })),
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${activeTask.name.replace(/\s+/g, "_")}_report.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Render ---

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-full bg-card rounded-lg"
    >
      <FrameSidebar
        tasks={tasks}
        activeTaskId={activeTaskId}
        activeVideoId={activeVideoId}
        onSelectTask={(id) => {
          setActiveTaskId(id);
          // Auto select first video of that task
          const task = tasks.find((t) => t.id === id);
          if (task && task.videos.length > 0) {
            setActiveVideoId(task.videos[0].id);
          } else {
            setActiveVideoId(null);
          }
        }}
        onSelectVideo={setActiveVideoId}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onAddVideosToTask={handleAddVideosToTask}
        onDeleteVideo={handleDeleteVideo}
        onExportTask={handleExportTask}
      />

      <div className="flex-1 flex flex-col min-h-0 lg:min-h-auto order-2 lg:order-2">
        {activeVideo ? (
          <FrameControl
            key={activeVideo.id} // Important for resetting player state on video switch
            video={activeVideo}
            onUpdateVideo={handleUpdateVideo}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center p-4"
          >
            <Card className="border-border/50 p-4 sm:p-6 lg:p-8 max-w-md mx-auto text-center shadow-lg">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.05, 1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center shadow-lg"
              >
                <Video className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-foreground" />
              </motion.div>

              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                欢迎使用帧分析工具
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
                创建任务并导入视频，开始分析应用延迟性能。通过精确的帧级别分析，帮助您优化用户体验。
              </p>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-base sm:text-lg py-4 sm:py-6 shadow-md h-10 sm:h-12 lg:h-14"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  创建新任务
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
      />
    </motion.div>
  );
}
