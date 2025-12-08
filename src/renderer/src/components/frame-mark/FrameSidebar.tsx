import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  FileVideo,
  Trash2,
  Download,
  ChevronRight,
  Upload,
  FolderPlus,
  MonitorPlay,
  ChevronDown,
} from "lucide-react";
import { calculateDurationMs, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  activeVideoId: string | null;
  onSelectTask: (taskId: string) => void;
  onSelectVideo: (videoId: string) => void;
  onOpenCreateModal: () => void;
  onAddVideosToTask: (files: FileList) => void;
  onDeleteVideo: (videoId: string) => void;
  onExportTask: () => void;
}

export const FrameSidebar: React.FC<SidebarProps> = ({
  tasks,
  activeTaskId,
  activeVideoId,
  onSelectTask,
  onSelectVideo,
  onOpenCreateModal,
  onAddVideosToTask,
  onDeleteVideo,
  onExportTask,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddVideosToTask(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-1/4 flex flex-col shrink-0"
    >
      {/* Header Area */}
      <div className="p-2 border-b border-border/50">
        {/* Task Switcher */}
        <div className="mb-4">
          <label className="text-xs font-bold tracking-wider mb-2 block text-muted-foreground">
            当前任务
          </label>
          <div className="relative group">
            <select
              value={activeTaskId || ""}
              onChange={(e) => {
                if (e.target.value === "NEW") {
                  onOpenCreateModal();
                } else {
                  onSelectTask(e.target.value);
                }
              }}
              className="w-full appearance-none bg-background border border-border text-foreground text-xs sm:text-sm font-medium rounded-lg h-9 sm:h-10 pl-2 sm:pl-3 pr-8 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm cursor-pointer hover:bg-muted/50 transition-all"
            >
              <option value="" disabled>
                选择任务
              </option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="NEW" className="text-primary font-bold">
                + 创建新任务...
              </option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Task Actions */}
        {activeTask && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-1"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onExportTask}
              className="flex-1"
              title="导出当前任务数据"
            >
              <Download className="w-4 h-4" />
              导出
            </Button>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4" />
              添加视频
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="video/*"
              className="hidden"
              onChange={handleAddVideo}
            />
          </motion.div>
        )}
      </div>

      {/* Video List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!activeTask ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 px-2"
          >
            <Card className="glass-effect border-border/30 p-3 sm:p-4 lg:p-6 flex flex-col items-center shadow-sm">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4"
              >
                <FolderPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </motion.div>
              <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                未选择任务
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenCreateModal}
                className="text-primary hover:bg-primary/10 text-xs sm:text-sm h-8 sm:h-9"
              >
                创建您的第一个任务
              </Button>
            </Card>
          </motion.div>
        ) : activeTask.videos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 sm:py-8 lg:py-12"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <FileVideo className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              此任务中暂无视频
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:bg-primary/10 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              上传视频
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="px-2 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
              <span>视频列表 ({activeTask.videos.length})</span>
            </div>
            {activeTask.videos.map((video, index) => {
              const duration =
                video.startFrame && video.endFrame
                  ? calculateDurationMs(
                      video.startFrame.timestamp,
                      video.endFrame.timestamp,
                    )
                  : null;

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectVideo(video.id)}
                  className={cn(
                    "group relative p-2 sm:p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                    activeVideoId === video.id
                      ? "bg-primary/5 border-primary/30 shadow-sm ring-2 ring-primary/20"
                      : "bg-card border-border hover:border-primary/30 hover:bg-muted/30",
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className={cn(
                        "font-medium text-xs sm:text-sm truncate pr-4 sm:pr-6",
                        activeVideoId === video.id
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    >
                      {video.name}
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteVideo(video.id);
                      }}
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="移除视频"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 text-xs mt-1 sm:mt-2">
                    {duration !== null ? (
                      <Badge
                        variant="default"
                        className="font-mono px-1.5 sm:px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {duration}ms
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-muted-foreground border-border font-normal px-1.5 sm:px-2 py-0.5 text-xs"
                      >
                        未分析
                      </Badge>
                    )}

                    {duration === null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MonitorPlay className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">就绪</span>
                      </span>
                    )}

                    {activeVideoId === video.id && (
                      <motion.div
                        initial={{ x: -10 }}
                        animate={{ x: 0 }}
                        className="ml-auto"
                      >
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      <div className="p-2 sm:p-3 border-t border-border/50 bg-muted/20 text-xs text-center">
        <span className="text-muted-foreground">任务:</span>{" "}
        <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
          {activeTask?.name || "未选择"}
        </span>
      </div>
    </motion.div>
  );
};
