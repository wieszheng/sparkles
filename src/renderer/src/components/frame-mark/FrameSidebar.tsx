import { useState } from "react";
import {
  Upload,
  FileVideo,
  Download,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
const VideoStart = {
  uploading: "数据上传中",
  extracting: "提取分析中",
  analyzing: "AI分析中",
  pending_review: "待人工审核",
  reviewed: "已审核",
  failed: "失败",
};

interface SidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  activeVideoId: string | null;
  activeTaskData: Task | null;
  onSelectTask: (taskId: string) => void;
  onCreateTask: (name: string) => void;
  onUploadVideo: (filePaths: string[]) => void;
  onSelectVideo: (videoId: string) => void;
  onExportData: () => void;
  isUploading?: boolean;
  isLoadingVideos?: boolean;
}

export function FrameSidebar({
  tasks,
  activeTaskId,
  activeVideoId,
  activeTaskData,
  onSelectTask,
  onCreateTask,
  onUploadVideo,
  onSelectVideo,
  onExportData,
  isUploading,
  isLoadingVideos,
}: SidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const handleCreateSubmit = () => {
    if (newTaskName.trim()) {
      onCreateTask(newTaskName.trim());
      setNewTaskName("");
      setIsDialogOpen(false);
    }
  };

  const handleFileChange = async () => {
    const directors = await window.api.openFileDialog({
      title: "选中视频",
      filters: [
        {
          name: "视频文件",
          extensions: ["mp4", "mov", "avi", "mkv"],
        },
        {
          name: "所有文件",
          extensions: ["*"],
        },
      ],
      properties: ["openFile", "multiSelections"],
      // properties: ["multiSelections"],
    });
    if (directors.canceled) {
      return;
    }
    onUploadVideo(directors.filePaths);
  };

  return (
    <div className="w-75 h-full bg-card flex flex-col rounded-l-lg">
      {/* Task Management Section */}
      <div className="p-2 space-y-4">
        <div className="space-y-2">
          <Select value={activeTaskId!} onValueChange={onSelectTask}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue
                placeholder={activeTaskData ? activeTaskData.name : "选择任务"}
              />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            创建
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportData}
            disabled={!activeTaskId}
          >
            <Download className="w-4 h-4" />
            导出
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogClose onClick={() => setIsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>新任务</DialogTitle>
            <DialogDescription>创建新的视频分析任务</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              任务名称
            </label>
            <Input
              id="name"
              className="mt-1"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="输入任务名称"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
            >
              取消
            </Button>
            <Button size="sm" onClick={handleCreateSubmit}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video List */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="p-2 pb-2 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-medium">视频列表</h2>
          {activeTaskId && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFileChange}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {isUploading ? "上传中..." : "上传视频"}
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {!activeTaskId ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <span className="text-sm">Select or create a task</span>
              </div>
            ) : isLoadingVideos ? (
              <div className="p-2 space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-lg border border-transparent bg-muted/30"
                  >
                    <div className="h-8 w-8 rounded bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-2 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTaskData?.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center border-2 border-dashed border-border rounded-lg m-2">
                <Upload className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-xs font-bold">
                  目前还没有视频
                  <br />
                  点击“添加视频”开始。
                </span>
              </div>
            ) : (
              activeTaskData?.videos.map((video) => (
                <div
                  key={video.video_id}
                  onClick={() => {
                    onSelectVideo(video.video_id);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all w-71 ${
                    activeVideoId === video.video_id
                      ? "bg-accent border-primary/20 shadow-sm"
                      : "bg-card border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <FileVideo className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium truncate"
                      title={video.video_filename}
                    >
                      {video.video_filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-lg uppercase ${
                          video.video_status === "reviewed"
                            ? "bg-green-100 text-green-700"
                            : video.video_status === "pending_review" ||
                                video.video_status === "uploading"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {VideoStart[
                          video.video_status as keyof typeof VideoStart
                        ] || video.video_status}
                      </span>
                      {video.video_status === "reviewed" && (
                        <span className="text-[10px] text-muted-foreground">
                          {video.duration_ms}
                          毫秒
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Task Status Section */}
      {activeTaskData && (
        <div className="p-2 space-y-2 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              任务状态
            </h3>
            <div className="flex items-center gap-2">
              {activeTaskData.statistics.total_videos > 0 && (
                <div className="flex items-center gap-1 min-w-[160px]">
                  <span className="text-[10px] text-muted-foreground">
                    进度
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[50px] max-w-[80px]">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(activeTaskData.statistics.completed_videos / activeTaskData.statistics.total_videos) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {Math.round(
                      (activeTaskData.statistics.completed_videos /
                        activeTaskData.statistics.total_videos) *
                        100,
                    )}
                    % （{activeTaskData.statistics.completed_videos}/
                    {activeTaskData.statistics.total_videos}）
                  </span>
                </div>
              )}
              {activeTaskData.status && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    activeTaskData.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : activeTaskData.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {activeTaskData.status === "completed"
                    ? "已完成"
                    : activeTaskData.status === "in_progress"
                      ? "进行中"
                      : "草稿"}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 flex gap-2">
            {/* 总视频数 */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-primary/10">
                <FileVideo className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">总数</div>
                <div className="text-sm font-semibold">
                  {activeTaskData.statistics.total_videos}
                </div>
              </div>
            </div>

            {/* 已完成 */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-green-500/10">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">已审核</div>
                <div className="text-sm font-semibold text-green-600">
                  {activeTaskData.statistics.completed_videos}
                </div>
              </div>
            </div>

            {/* 待审核 */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-amber-500/10">
                <Clock className="w-3 h-3 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">待审核</div>
                <div className="text-sm font-semibold text-amber-600">
                  {activeTaskData.statistics.pending_videos}
                </div>
              </div>
            </div>
            {/* 处理中 */}
            {/*{(taskStats.processing > 0 || taskStats.uploading > 0) && (*/}
            {/*  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">*/}
            {/*    <div className="p-1.5 rounded bg-blue-500/10">*/}
            {/*      <Activity className="w-3 h-3 text-blue-600 animate-pulse" />*/}
            {/*    </div>*/}
            {/*    <div className="flex-1 min-w-0">*/}
            {/*      <div className="text-xs text-muted-foreground">处理中</div>*/}
            {/*      <div className="text-sm font-semibold text-blue-600">*/}
            {/*        {taskStats.processing + taskStats.uploading}*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*)}*/}

            {/* 失败 */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
              <div className="p-1.5 rounded bg-red-500/10">
                <XCircle className="w-3 h-3 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">失败</div>
                <div className="text-sm font-semibold text-red-600">
                  {activeTaskData.statistics.failed_videos}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
