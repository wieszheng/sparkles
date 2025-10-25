import { useEffect, useState, useCallback, memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  ZoomIn,
  FolderOpen,
  Loader2,
  Save,
  Film,
  CheckCircle2,
  FileVideo,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Api } from "@/apis";
import { toast } from "sonner";
import { ProgressBar } from "@/components/ProgressBar.tsx";

import Pagination from "@/components/video/pagination.tsx";

type VideoStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

interface Frame {
  id: number;
  frame_index: number;
  timestamp: number;
  object_name: string;
}

interface VideoItem {
  id: string;
  filename: string;
  status?: VideoStatus;
  progress?: number;
  totalFrames?: number;
  duration: number | null;
  fps: number;
}

interface Task {
  id: string;
  name: string;
}

export function FrameAnalyzer({ selectedProject }: { selectedProject: any }) {
  const [selectedTask, setSelectedTask] = useState<string>("1");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [selectedFirstFrame, setSelectedFirstFrame] = useState<number | null>(
    0,
  );

  const [selectedLastFrame, setSelectedLastFrame] = useState<number | null>(0);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [tackName, setTackName] = useState("");
  const [path, setPath] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameCache, setFrameCache] = useState<Record<string, Frame[]>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [isTaskListLoading, setIsTaskListLoading] = useState(false);
  const [isVideoListLoading, setIsVideoListLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(videos.length / itemsPerPage);

  const handleSelectFirst = useCallback(
    (f: Frame) => setSelectedFirstFrame(f),
    [],
  );
  const handleSelectLast = useCallback(
    (f: Frame) => setSelectedLastFrame(f),
    [],
  );

  const getTaskList = async () => {
    setIsTaskListLoading(true);
    try {
      console.log(selectedProject);
      const resp = await window.api.callApi("GET", Api.getTask);
      setTasks(resp.data.tasks);
      setSelectedTask(resp.data.tasks[0]?.id || "");
    } catch (error) {
      console.error("获取任务列表失败:", error);
      toast.error("获取任务列表失败");
    } finally {
      setIsTaskListLoading(false);
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
      setVideos(resp.data.videos);
      // 切换任务时清理当前帧与选择，避免跨任务误用缓存
      setSelectedVideo(null);
      setFrames([]);
      setSelectedFirstFrame(null);
      setSelectedLastFrame(null);
    } catch (error) {
      console.error("获取视频列表失败:", error);
      toast.error("获取视频列表失败");
    } finally {
      setIsVideoListLoading(false);
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
  const [firstFrameScrollProgress, setFirstFrameScrollProgress] = useState(0);
  const [lastFrameScrollProgress, setLastFrameScrollProgress] = useState(0);

  const handleImageClick = (
    e: React.MouseEvent,
    imageUrl: string,
    time: string,
  ) => {
    if (e.button === 2 || e.type === "contextmenu") {
      e.preventDefault();
      // setLightboxImage({ url: imageUrl, time });
    }
  };

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
  ) => {
    if (ref.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const { scrollWidth, clientWidth } = ref.current;
      const maxScroll = scrollWidth - clientWidth;
      const targetScroll = maxScroll * percentage;
      ref.current.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = (
      ref: React.RefObject<HTMLDivElement>,
      setProgress: (val: number) => void,
    ) => {
      if (ref.current) {
        const { scrollLeft, scrollWidth, clientWidth } = ref.current;
        const maxScroll = scrollWidth - clientWidth;
        const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
        setProgress(progress);
      }
    };

    const firstRef = firstFrameScrollRef.current;
    const lastRef = lastFrameScrollRef.current;

    const firstScrollHandler = () =>
      handleScroll(firstFrameScrollRef, setFirstFrameScrollProgress);
    const lastScrollHandler = () =>
      handleScroll(lastFrameScrollRef, setLastFrameScrollProgress);

    firstRef?.addEventListener("scroll", firstScrollHandler);
    lastRef?.addEventListener("scroll", lastScrollHandler);

    return () => {
      firstRef?.removeEventListener("scroll", firstScrollHandler);
      lastRef?.removeEventListener("scroll", lastScrollHandler);
    };
  }, []);

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
                      onClick={async () => {
                        setSelectedVideo(video);
                        const cacheKey = `${selectedTask}:${video.id}`;
                        const cached = frameCache[cacheKey];
                        if (cached && cached.length) {
                          setFrames(cached);
                        } else {
                          const resp = await window.api.callApi(
                            "GET",
                            `${Api.videoFrames}?video_id=${video.id}`,
                          );
                          setFrames(resp.data.frames);
                          setFrameCache((prev) => ({
                            ...prev,
                            [cacheKey]: resp.data.frames,
                          }));
                        }
                        setSelectedFirstFrame(null);
                        setSelectedLastFrame(null);
                      }}
                      disabled={video.status !== "DONE"}
                      className={`w-full rounded-lg border p-3 text-left relative ${
                        selectedVideo?.id === video.id
                          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                          : "border-sidebar-border bg-sidebar hover:bg-sidebar-accent text-sidebar-foreground"
                      } ${video.status !== "DONE" ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="absolute top-2 right-2">
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
                            <span>{video.fps}</span>
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
          <div className="flex h-full flex-col mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-6 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">首帧:</span>
                  <span className="font-mono font-semibold text-foreground w-20">
                    {/*{selectedFirstFrame?.timestamp || "--:--:--"}*/}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">尾帧:</span>
                  <span className="font-mono font-semibold text-foreground w-20">
                    {/*{selectedLastFrame?.timestamp || "--:--:--"}*/}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">耗时:</span>
                  {/*<span className="font-mono text-lg text-lime-600 w-22">*/}
                  {/*  {selectedFirstFrame?.timestamp &&*/}
                  {/*  selectedLastFrame?.timestamp*/}
                  {/*    ? Math.floor(*/}
                  {/*        selectedLastFrame?.timestamp -*/}
                  {/*          selectedFirstFrame?.timestamp,*/}
                  {/*      ) + "ms"*/}
                  {/*    : "--:--:--"}*/}
                  {/*</span>*/}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden px-6 py-4">
              <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 flex flex-col gap-2 min-h-0">
                    <div className="flex items-center gap-2 flex-1 min-h-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          scrollFrames(firstFrameScrollRef, "left")
                        }
                        className="flex-shrink-0 h-8 w-8 hover:bg-accent transition-colors rounded-full"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <div className="flex-1 relative min-h-0 overflow-hidden">
                        <div
                          ref={firstFrameScrollRef}
                          className="overflow-x-auto overflow-y-hidden h-full scrollbar-hide"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          <div className="flex gap-3 min-w-min h-full p-2">
                            {frames.map((frame, index) => (
                              <div
                                key={`first-frame-${index}`}
                                className="flex-shrink-0 flex flex-col gap-2 h-full"
                              >
                                <div
                                  onClick={() => setSelectedFirstFrame(index)}
                                  onContextMenu={(e) =>
                                    handleImageClick(
                                      e,
                                      frame.object_name,
                                      `${frame.timestamp.toFixed(2)}s`,
                                    )
                                  }
                                  className={`max-w-[7rem] rounded-lg overflow-hidden cursor-pointer transition-all flex items-center justify-center relative bg-muted ${
                                    selectedFirstFrame === index
                                      ? "ring-2 ring-red-500 ring-offset-background"
                                      : "hover:ring-2 hover:ring-red-500 ring-offset-background"
                                  }`}
                                >
                                  <img
                                    src={frame.object_name}
                                    alt={`Frame at ${frame.timestamp.toFixed(2)}s`}
                                    className="w-full h-full object-contain"
                                  />
                                  {selectedFirstFrame === index && (
                                    <div className="absolute top-1 right-1 bg-red-600 rounded-full p-1">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground text-center font-medium mb-2">
                                  {frame.timestamp.toFixed(2)}ms
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          scrollFrames(firstFrameScrollRef, "right")
                        }
                        className="flex-shrink-0 h-8 w-8 hover:bg-accent transition-colors rounded-full"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                    <div
                      className="relative h-3 bg-muted rounded-lg overflow-hidden cursor-pointer transition-all"
                      onClick={(e) =>
                        handleNavigationBarClick(
                          e,
                          firstFrameScrollRef,
                          selectedVideo?.totalFrames,
                        )
                      }
                    >
                      {selectedFirstFrame !== null && (
                        <div
                          className="absolute top-2 -translate-y-1/2 w-2 h-3 bg-primary rounded-full border-1 border-background shadow-md transition-all duration-300"
                          style={{
                            left: `${(selectedFirstFrame / (frames.length - 1)) * 100}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 mb-2">
                  <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div
                      ref={lastFrameScrollRef}
                      className="overflow-x-auto overflow-y-hidden h-full scrollbar-hide"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <div className="flex gap-3 p-2 min-w-min h-full">
                        {frames.map((frame, index) => (
                          <div
                            key={`last-frame-${index}`}
                            className="flex-shrink-0 flex flex-col h-full"
                          >
                            <div
                              onClick={() => setSelectedLastFrame(index)}
                              onContextMenu={(e) =>
                                handleImageClick(
                                  e,
                                  frame.object_name,
                                  `${frame.timestamp.toFixed(2)}s`,
                                )
                              }
                              className={`max-w-[10rem] rounded-lg overflow-hidden cursor-pointer transition-all flex items-center justify-center relative bg-muted ${
                                selectedLastFrame === index
                                  ? "ring-2 ring-red-500 ring-offset-background"
                                  : "hover:ring-2 hover:ring-red-500 ring-offset-background"
                              }`}
                            >
                              <img
                                src={frame.object_name || "/placeholder.svg"}
                                alt={`Frame at ${frame.timestamp.toFixed(2)}s`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "/placeholder.svg?height=400&width=300";
                                }}
                              />
                              {selectedLastFrame === index && (
                                <div className="absolute top-1 right-1 bg-purple-600 rounded-full p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-slate-400 text-center font-medium">
                              {frame.timestamp.toFixed(2)}s
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div
                    className="relative h-2.5 bg-muted overflow-hidden cursor-pointer transition-all"
                    onClick={(e) =>
                      handleNavigationBarClick(
                        e,
                        lastFrameScrollRef,
                        selectedVideo?.totalFrames,
                      )
                    }
                  >
                    {selectedLastFrame !== null && (
                      <div
                        className="absolute top-2 -translate-y-1/2 w-2 h-3 bg-primary rounded-full border-1 border-background shadow-md transition-all duration-300"
                        style={{
                          left: `${(selectedLastFrame / (frames.length - 1)) * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
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
