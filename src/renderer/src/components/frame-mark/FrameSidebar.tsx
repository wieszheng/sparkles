import React, { useRef, useState } from "react";
import {
  Upload,
  FileVideo,
  Download,
  FolderOpen,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
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
  onDeleteTask: (taskId: string) => void;
  onUploadVideo: (file: File) => void;
  onSelectVideo: (videoId: string) => void;
  onExportData: () => void;
  isUploading?: boolean;
}

export const FrameSidebar: React.FC<SidebarProps> = ({
  tasks,
  activeTaskId,
  activeVideoId,
  activeTaskVideos,
  onSelectTask,
  onCreateTask,
  onDeleteTask,
  onUploadVideo,
  onSelectVideo,
  onExportData,
  isUploading,
}) => {
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
    <div className="w-80 h-full border-r border-border bg-card flex flex-col">
      {/* App Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          FrameTime
        </h1>
      </div>

      {/* Task Management Section */}
      <div className="p-4 border-b border-border space-y-4 bg-muted/20">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current Task
          </label>
          <Select value={activeTaskId} onValueChange={onSelectTask}>
            <SelectTrigger>
              <SelectValue
                placeholder={activeTask ? activeTask.name : "Select a task..."}
              />
            </SelectTrigger>
            <SelectContent>
              {tasks.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No tasks found
                </div>
              ) : (
                tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{task.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="w-full flex items-center gap-1"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center gap-1"
            onClick={onExportData}
            disabled={!activeTaskId}
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
        <div className="p-4 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Videos
          </h2>
          {activeTaskId && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-1" />
                )}
                {isUploading ? "Uploading..." : "Add Video"}
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
          ) : activeTaskVideos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center border-2 border-dashed border-border rounded-lg m-2 bg-muted/10">
              <Upload className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-sm">
                No videos yet.
                <br />
                Click 'Add Video' to start.
              </span>
            </div>
          ) : (
            activeTaskVideos.map((video) => (
              <div
                key={video.video_id}
                onClick={() => onSelectVideo(video.video_id)}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-all ${
                  activeVideoId === video.video_id
                    ? "bg-accent border-primary/20 shadow-sm"
                    : "bg-card border-transparent hover:bg-muted/50"
                }`}
              >
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {video.video_filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase ${
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
                        {video.last_frame_time !== null &&
                        video.first_frame_time !== null
                          ? (
                              video.last_frame_time - video.first_frame_time
                            ).toFixed(2)
                          : video.duration?.toFixed(2)}
                        s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete Task Footer */}
        {activeTaskId && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
              onClick={() => onDeleteTask(activeTaskId)}
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Current Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
