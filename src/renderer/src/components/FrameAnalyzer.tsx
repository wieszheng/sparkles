import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  FolderOpen,
  Loader2,
  Save,
  Film,
  CheckCircle2,
  FileVideo,
  ChevronLeft,
  ChevronRight,
  Gauge,
  PlaySquare,
  Square,
  Timer,
} from "lucide-react";

import { Api } from "@/apis";
import { toast } from "sonner";
import { ProgressBar } from "@/components/ProgressBar.tsx";

import Pagination from "@/components/video/pagination.tsx";
// import { UploadVideoDialog } from "@/components/video/upload_video.tsx";
import { FrameListOptimized } from "@/components/video/FrameListOptimized";

type VideoStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

interface Frame {
  id: number;
  frame_index: number;
  timestamp: number;
  url: string;
}

interface VideoItem {
  id: string;
  filename: string;
  status?: VideoStatus;
  progress?: number;
  total_frames?: number;
  duration: number | null;
  total_duration?: number;
  fps: number;
  first_frame: number;
  last_frame: number;
  manual_confirm: boolean;
}

interface Task {
  id: string;
  name: string;
}

export function FrameAnalyzer({ selectedProject }: { selectedProject: any }) {
  const [selectedTask, setSelectedTask] = useState<string>("1");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [selectedFirstFrame, setSelectedFirstFrame] = useState<number | null>(
    null,
  );

  const [selectedLastFrame, setSelectedLastFrame] = useState<number | null>(
    null,
  );
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [tackName, setTackName] = useState("");
  const [path, setPath] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [isVideoListLoading, setIsVideoListLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(videos.length / itemsPerPage);

  const updateFrames = useCallback(
    async (firstFrame: number | null, lastFrame: number | null) => {
      if (!selectedVideo || firstFrame === null || lastFrame === null) return;

      // 确保首尾帧顺序正确
      if (firstFrame > lastFrame) return;

      try {
        const response = await window.api.callApi(
          "PUT",
          Api.updateVideoFrames,
          {
            video_id: selectedVideo.id,
            first_frame: firstFrame,
            last_frame: lastFrame,
          },
        );
        if (response && response.success) {
          setSelectedVideo((prev) =>
            prev
              ? {
                  ...prev,
                  first_frame: response.data.first_frame,
                  last_frame: response.data.last_frame,
                  total_duration: response.data.total_duration,
                }
              : null,
          );
        }
      } catch (error) {
        console.error("自动更新首尾帧失败:", error);
      }
    },
    [selectedVideo],
  );

  // 处理首帧选择
  const handleSelectFirst = useCallback(
    (index: number) => {
      setSelectedFirstFrame(index);
      if (selectedLastFrame !== null) {
        updateFrames(index, selectedLastFrame);
      }
    },
    [selectedLastFrame, updateFrames],
  );

  // 处理尾帧选择
  const handleSelectLast = useCallback(
    (index: number) => {
      setSelectedLastFrame(index);
      if (selectedFirstFrame !== null) {
        updateFrames(selectedFirstFrame, index);
      }
    },
    [selectedFirstFrame, updateFrames],
  );

  const getTaskList = async () => {
    try {
      const resp = await window.api.callApi("GET", Api.getTask);
      setTasks(resp.data.tasks);
      setSelectedTask(resp.data.tasks[0]?.id || "");
    } catch (error) {
      console.error("获取任务列表失败:", error);
      toast.error("获取任务列表失败");
    }
  };

  const getVideoList = async () => {
    if (!selectedTask) return;

    setIsVideoListLoading(true);
    try {
      const resp = await window.api.callApi(
        "GET",
        `${Api.videos}?task_id=${selectedTask}`,
      );
      const videoList = resp.data.videos;
      setVideos(videoList);
      // 切换任务时清理当前帧与选择，避免跨任务误用缓存
      setFrames([]);
      setSelectedFirstFrame(null);
      setSelectedLastFrame(null);
    } catch (error) {
      console.error("获取视频列表失败:", error);
      toast.error("获取视频列表失败");
      setVideos([]);
      setSelectedVideo(null);
      setFrames([]);
      setSelectedFirstFrame(null);
      setSelectedLastFrame(null);
    } finally {
      setIsVideoListLoading(false);
    }
  };

  const handleVideoSelect = async (video) => {
    setSelectedVideo(video);
    setIsFrameLoading(true);
    
    try {
      const resp = await window.api.callApi(
        "GET",
        `${Api.videoFrames}?video_id=${video.id}`,
      );
      if (resp && resp.data && resp.data.frames) {
        const frameData = resp.data.frames;
        setFrames(frameData);
        // 确保首尾帧索引在有效范围内
        const firstFrameIndex = Math.max(
          0,
          Math.min(frameData.length - 1, video.first_frame),
        );
        const lastFrameIndex = Math.max(
          0,
          Math.min(frameData.length - 1, video.last_frame),
        );
        setSelectedFirstFrame(firstFrameIndex);
        setSelectedLastFrame(lastFrameIndex);
      } else {
        console.error("获取帧数据失败: 返回数据格式不正确");
        toast.error("获取帧数据失败");
        setFrames([]);
        setSelectedFirstFrame(null);
        setSelectedLastFrame(null);
      }
    } catch (error) {
      console.error("获取帧数据异常:", error);
      toast.error("获取帧数据时发生错误");
      setFrames([]);
      setSelectedFirstFrame(null);
      setSelectedLastFrame(null);
    } finally {
      setIsFrameLoading(false);
    }
  };

  useEffect(() => {
    getTaskList();
  }, []);

  useEffect(() => {
    getVideoList();
  }, [selectedTask]);

  const firstFrameScrollRef = useRef<HTMLDivElement>(null);
  const lastFrameScrollRef = useRef<HTMLDivElement>(null);

  const scrollFrames = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right",
  ) => {
    if (ref.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        ref.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      ref.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  const handleNavigationBarClick = (
    e: React.MouseEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement>,
    totalFrames?: number,
  ) => {
    if (ref.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // 限制在0-1范围内
      const { scrollWidth, clientWidth } = ref.current;
      const maxScroll = scrollWidth - clientWidth;
      const targetScroll = maxScroll * percentage;
      ref.current.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] space-y-5 bg-card rounded-lg">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={24} minSize={23} maxSize={30}>
          <div className="flex h-full flex-col p-3">
            <div className="flex gap-1 mt-2">
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择任务" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost" //px-3
                onClick={() => setIsCreateTaskOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="flex items-center justify-between mb-1 flex-shrink-0 px-0.5">
                <h3 className="text-sm font-medium">视频列表</h3>
                {/*{selectedTask && (*/}
                {/*  <UploadVideoDialog*/}
                {/*    taskId={selectedTask}*/}
                {/*    // onVideoUploaded={handleVideoUploaded}*/}
                {/*  />*/}
                {/*)}*/}
              </div>
              {isVideoListLoading ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin text-primary" />
                  <p className="text-sm mb-2">加载中...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <FileVideo className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-1">暂无视频数据</p>
                  <p className="text-xs opacity-70">快点“+”创建分析任务吧。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleVideoSelect(video)}
                      disabled={video.status !== "DONE"}
                      className={`w-full rounded-lg border p-2 text-left relative ${
                        selectedVideo?.id === video.id
                          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                          : "border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground"
                      } ${video.status !== "DONE" ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="absolute top-0.5 right-1">
                        {video.status !== "DONE" ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-amber-500/90 text-white border-0"
                          >
                            <Loader2 className="h-3 w-3 animate-spin" />
                            解析中
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-green-500/90 text-white border-0"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            已完成
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p
                          className="font-medium text-sm text-card-foreground leading-tight line-clamp-1 pr-15"
                          title={video.filename}
                        >
                          {video.filename}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{video.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            <span>{video.total_frames}</span>
                          </div>
                        </div>

                        {video.status !== "DONE" && (
                          <div className="space-y-1">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <ProgressBar
                                value={video.progress}
                                shimmer={true}
                                gradient="from-rose-500 to-orange-500"
                                width="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-0.5 py-3">
              {videos.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={76}>
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-2 flex-shrink-0">
              <div className="flex flex-wrap justify-center gap-6 mt-2">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">视频时长</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {selectedVideo?.duration || 0}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-green-500/10 rounded">
                    <Gauge className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">视频帧率</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {selectedVideo?.fps || 0}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-purple-500/10 rounded">
                    <PlaySquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">首帧</p>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {selectedFirstFrame ?? 0}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-orange-500/10 rounded">
                    <Square className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">尾帧</p>
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {selectedLastFrame ?? 0}
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-pink-500/10 rounded">
                    <Timer className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">总耗时/Ms</p>
                    <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                      {selectedVideo?.total_duration || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden p-3 gap-4">
              {isFrameLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center h-full min-w-full">
                  <div className="text-center text-muted-foreground">
                    <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                    <p className="text-sm mb-1 font-medium">正在加载帧数据...</p>
                    <p className="text-xs opacity-70">
                      请稍候，正在获取视频帧信息
                    </p>
                  </div>
                </div>
              ) : frames.length > 0 ? (
                <>
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="flex-1 overflow-hidden min-h-0">
                      <FrameListOptimized
                        frames={frames}
                        selectedFrame={selectedFirstFrame}
                        onFrameSelect={handleSelectFirst}
                        frameType="first"
                        scrollRef={firstFrameScrollRef}
                        onScroll={(direction) => scrollFrames(firstFrameScrollRef, direction)}
                        onNavigationClick={handleNavigationBarClick}
                        isLoading={isFrameLoading}
                      />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0 ">
                    <div className="flex-1 overflow-hidden min-h-0">
                      <FrameListOptimized
                        frames={frames}
                        selectedFrame={selectedLastFrame}
                        onFrameSelect={handleSelectLast}
                        frameType="last"
                        scrollRef={lastFrameScrollRef}
                        onScroll={(direction) => scrollFrames(lastFrameScrollRef, direction)}
                        onNavigationClick={handleNavigationBarClick}
                        isLoading={isFrameLoading}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center h-full min-w-full">
                  <div className="text-center text-muted-foreground">
                    <Square className="h-12 w-12 mx-auto mb-1 opacity-50" />
                    <p className="text-sm mb-1">暂无帧数据</p>
                    <p className="text-xs opacity-70">
                      请从左侧选择一个视频进行分析
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>创建新任务</DialogTitle>
            <DialogDescription>
              输入任务名称并选择视频目录来创建新的分析任务
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">任务名称</Label>
              <Input
                id="task-name"
                placeholder="例如：视频编辑任务 001"
                onChange={(e) => setTackName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-directory">视频目录</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="选择视频文件夹路径"
                  readOnly
                  className="flex-1"
                  value={path}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    const result = await window.api.openFileDialog({
                      title: "选择目录",
                      properties: ["openDirectory"],
                    });
                    if (
                      result &&
                      !result.canceled &&
                      result.filePaths.length > 0
                    ) {
                      setPath(result.filePaths[0]);
                    }
                  }}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateTaskOpen(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              disabled={isCreatingTask || isUploadingVideos}
              onClick={async () => {
                if (!path) {
                  toast.error("请选择视频目录");
                  return;
                }

                setIsCreatingTask(true);

                try {
                  // 首先创建任务
                  const taskRes = await window.api.callApi(
                    "POST",
                    Api.createTask,
                    {
                      name: tackName,
                      videoPath: path,
                    },
                  );
                  console.log("创建任务返回:", taskRes);

                  if (taskRes.success) {
                    const taskId = taskRes.data.id || taskRes.data.task_id;

                    setIsUploadingVideos(true);

                    try {
                      // 获取目录中的MP4文件列表
                      const mp4Files = await window.api.getDirectoryFiles(
                        path,
                        ".mp4",
                      );

                      console.log("找到MP4文件:", mp4Files);

                      if (mp4Files.length === 0) {
                        toast.error("目录中没有找到MP4文件");
                        return;
                      }

                      // 对每个MP4文件单独调用上传接口
                      const uploadPromises = mp4Files.map(
                        async (filePath: string) => {
                          const uploadRes = await window.api.callApi(
                            "POST",
                            Api.uploadVideo,
                            {
                              task_id: taskId,
                              videoPath: filePath,
                            },
                            "form-data",
                          );
                          console.log("上传视频返回:", uploadRes);
                          return uploadRes;
                        },
                      );

                      // 等待所有上传完成
                      const uploadResults = await Promise.all(uploadPromises);
                      const successCount = uploadResults.filter(
                        (res) => res.success,
                      ).length;

                      if (successCount > 0) {
                        toast.success(
                          `任务创建成功，${successCount}/${mp4Files.length} 个视频上传完成`,
                        );
                      } else {
                        toast.error("所有视频上传失败");
                      }
                    } catch (error) {
                      console.error("上传视频失败:", error);
                      toast.error("上传视频时发生错误");
                    } finally {
                      setIsUploadingVideos(false);
                    }

                    // 刷新任务列表并选中新建的任务
                    await getTaskList();
                    setSelectedTask(taskId);
                  } else {
                    toast.error(taskRes.message);
                  }
                } catch (error) {
                  console.error("创建任务失败:", error);
                  toast.error("创建任务失败");
                } finally {
                  setIsCreatingTask(false);
                  setPath("");
                  setTackName("");
                  setIsCreateTaskOpen(false);
                }
              }}
            >
              {isCreatingTask || isUploadingVideos ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isUploadingVideos ? "上传中..." : "创建中..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  创建任务
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
