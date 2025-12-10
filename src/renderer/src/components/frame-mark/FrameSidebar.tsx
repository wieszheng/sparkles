import React, { useRef, useState } from "react";
import { Upload, FileVideo, Download, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  tasks: Task[];
  activeTaskId: string | null;
  activeVideoId: string | null;
  activeTaskVideos: TaskVideoSummary[];
  onSelectTask: (taskId: string) => void;
  onCreateTask: (name: string) => void;
  onUploadVideo: (file: File) => void;
  onSelectVideo: (videoId: string) => void;
  onExportData: () => void;
  isUploading?: boolean;
  isLoadingVideos?: boolean;
}

export function FrameSidebar({
  tasks,
  activeTaskId,
  activeVideoId,
  activeTaskVideos,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onCreateTask(newTaskName.trim());
      setNewTaskName("");
      setIsDialogOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadVideo(e.target.files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-75 h-full bg-card flex flex-col rounded-l-lg">
      {/* Task Management Section */}
      <div className="p-2 space-y-4">
        <div className="space-y-2">
          <label className="text-sm">当前任务</label>
          <Select value={activeTaskId!} onValueChange={onSelectTask}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue
                placeholder={activeTask ? activeTask.name : "Select a task..."}
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

        <div className="grid grid-cols-2 gap-2">
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

      {/* Create Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[425px] bg-card">
          <DialogClose onClick={() => setIsDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Task Name
              </label>
              <Input
                id="name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="e.g. Batch analysis 01"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-2 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            视频列表
          </h2>
          {activeTaskId && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {isUploading ? "上传中..." : "上传视频"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!activeTaskId ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <span className="text-sm">Select or create a task</span>
            </div>
          ) : isLoadingVideos ? (
            <div className="p-2 space-y-2">
              {activeTaskVideos.map((video) => (
                <div
                  key={video.video_id}
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
          ) : activeTaskVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center border-2 border-dashed border-border rounded-lg m-2">
              <Upload className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs font-bold">
                目前还没有视频
                <br />
                点击“添加视频”开始。
              </span>
            </div>
          ) : (
            activeTaskVideos.map((video) => (
              <div
                key={video.video_id}
                onClick={() => onSelectVideo(video.video_id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${
                  activeVideoId === video.video_id
                    ? "bg-accent border-primary/20 shadow-sm"
                    : "bg-card border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {video.video_filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-lg uppercase ${
                        video.video_status === "completed" ||
                        video.video_status === "reviewed"
                          ? "bg-green-100 text-green-700"
                          : video.video_status === "processing" ||
                              video.video_status === "uploading"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {video.video_status}
                    </span>
                    {(video.video_status === "completed" ||
                      video.video_status === "reviewed") && (
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
      </div>
    </div>
  );
}
