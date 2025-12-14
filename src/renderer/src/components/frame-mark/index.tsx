import { useState, useEffect } from "react";
import { FrameSidebar } from "@/components/frame-mark/FrameSidebar";
import { VideoWorkspace } from "@/components/frame-mark/VideoWorkspace";

import { Loader2 } from "lucide-react";
import { Api } from "@/apis";
import { toast } from "sonner";

export function FrameMark() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [activeTaskData, setActiveTaskData] = useState<Task | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [activeVideoDetail, setActiveVideoDetail] =
    useState<VideoDetail | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Load Tasks on Mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await window.api.callApi(
        "GET",
        `${Api.TaskList}?skip=0&limit=100`,
      );
      setTasks(data);
      if (data.length > 0 && !activeTaskId) {
        setActiveTaskId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  };

  useEffect(() => {
    if (!activeTaskId) {
      setActiveTaskData(null);
      return;
    }

    const fetchTaskDetail = async () => {
      setIsTaskLoading(true);
      setActiveTaskData(null);
      try {
        const detail = await window.api.callApi(
          "GET",
          `${Api.TaskDetail}/${activeTaskId}`,
        );
        console.log(detail);
        setActiveTaskData(detail);
      } catch (e) {
        console.error("Failed to load task detail", e);
      } finally {
        setIsTaskLoading(false);
      }
    };

    fetchTaskDetail();
  }, [activeTaskId]);

  useEffect(() => {
    if (!activeVideoId) {
      setActiveVideoDetail(null);
      return;
    }

    const fetchVideoDetail = async () => {
      try {
        const detail = await window.api.callApi(
          "GET",
          `${Api.getVideoStatus}/${activeVideoId}`,
        );
        setActiveVideoDetail(detail);
      } catch (e) {
        console.error("Failed to load video detail", e);
      }
    };

    fetchVideoDetail();
  }, [activeVideoId]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (
        activeVideoId &&
        activeVideoDetail &&
        ["uploading", "extracting"].includes(activeVideoDetail.status)
      ) {
        try {
          const updated = await window.api.callApi(
            "GET",
            `${Api.TaskDetail}/${activeTaskId}`,
          );
          setActiveVideoDetail(updated);

          // Also update the list view item if status changed
          if (activeTaskData && updated.status !== activeVideoDetail.status) {
            const updatedVideos = activeTaskData.videos.map((v) =>
              v.video_id === activeVideoId
                ? { ...v, video_status: updated.status }
                : v,
            );

            setActiveTaskData({ ...activeTaskData, videos: updatedVideos });
          }
        } catch (e) {
          console.log(e);
        }
      }

      // 2. Refresh task list if we have videos processing (to show status updates in sidebar)
      if (
        activeTaskData &&
        activeTaskData.videos.some((v) =>
          ["uploading", "extracting"].includes(v.video_status),
        )
      ) {
        try {
          const detail = await window.api.callApi(
            "GET",
            `${Api.TaskDetail}/${activeTaskId}`,
          );
          setActiveTaskData((prev) => {
            if (!prev) return detail;
            return detail;
          });
        } catch (e) {
          console.log(e);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeVideoId, activeVideoDetail, activeTaskData]);

  // Handlers

  const handleCreateTask = async (name: string) => {
    try {
      const newTask = await window.api.callApi("POST", Api.TaskCreate, {
        name,
        created_by: "Sparkles",
      });
      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(newTask.id);
      setActiveVideoId(null);
      toast.success("恭喜你，创建成功。");
    } catch (e) {
      console.log(e);
    }
  };

  const handleUploadVideo = async (filePaths: string[]) => {
    if (!activeTaskId) return;
    setIsLoading(true);

    try {
      // 1. Upload Video
      const res = await window.api.uploadFile({
        endpoint: "/api/v1/video/batch-upload",
        filePath: filePaths,
        additionalFields: {
          task_id: activeTaskId!,
        },
      });

      // 3. Refresh Task Data
      const updatedTask = await window.api.callApi(
        "GET",
        `${Api.TaskDetail}/${activeTaskId}`,
      );
      setActiveTaskData(updatedTask);

      // 4. Select the new video
      // setActiveVideoId(video_id);
      toast.success(res.message);
    } catch (e) {
      console.error(e);
      alert("Failed to upload video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVideoFrame = async (
    startFrameId: string | null,
    endFrameId: string | null,
  ) => {
    // Optimistic update locally
    if (activeVideoDetail) {
      setActiveVideoDetail({
        ...activeVideoDetail,
        selected_start_frame_id:
          startFrameId !== null
            ? startFrameId
            : activeVideoDetail.selected_start_frame_id,
        selected_end_frame_id:
          endFrameId !== null
            ? endFrameId
            : activeVideoDetail.selected_end_frame_id,
      });
    }

    // Find existing frames from frame_type or selected_*_frame_id
    const existingStartFrame = activeVideoDetail?.frames?.find(
      (f) => f.frame_type === "first",
    );
    const existingEndFrame = activeVideoDetail?.frames?.find(
      (f) => f.frame_type === "last",
    );

    const targetStart =
      startFrameId !== null
        ? startFrameId
        : activeVideoDetail?.selected_start_frame_id ||
          existingStartFrame?.id ||
          null;
    const targetEnd =
      endFrameId !== null
        ? endFrameId
        : activeVideoDetail?.selected_end_frame_id ||
          existingEndFrame?.id ||
          null;

    // Support updating only start frame or only end frame
    if (targetStart && targetEnd) {
      try {
        const res = await window.api.callApi(
          "PUT",
          `${Api.TaskVideoFrames}/${activeTaskId}/videos/${activeVideoId}/marking`,
          {
            first_frame_id: targetStart,
            last_frame_id: targetEnd,
          },
        );
        console.log("Marking submitted", res);

        // Show success toast
        if (res) {
          toast.success("已更新");
        }

        if (activeTaskData) {
          const task = await window.api.callApi(
            "GET",
            `${Api.TaskDetail}/${activeTaskData.id}`,
          );
          setActiveTaskData(task);
        }
      } catch (e) {
        console.error("Failed to submit marking", e);
        toast.error(`首尾帧更新失败: ${e}`);
      }
    } else {
      // If only one frame is selected, show a warning
      if (startFrameId !== null && !targetEnd) {
        toast.warning("请先选择尾帧");
      } else if (endFrameId !== null && !targetStart) {
        toast.warning("请先选择首帧");
      }
    }
  };

  const handleExportData = () => {
    if (!activeTaskData) return;

    // Client-side CSV generation based on Task Data
    const headers = [
      "Video Name",
      "Status",
      "Duration (s)",
      "First Frame (s)",
      "Last Frame (s)",
      "Net Duration (s)",
    ];
    const rows = activeTaskData.videos.map((v) => {
      const net =
        v.last_frame_time !== null && v.first_frame_time !== null
          ? (v.last_frame_time - v.first_frame_time).toFixed(3)
          : "";
      return [
        `"${v.video_filename}"`,
        v.video_status,
        v.duration_ms?.toFixed(2) || "",
        v.first_frame_time?.toFixed(3) || "",
        v.last_frame_time?.toFixed(3) || "",
        net,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeTaskData.name}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="flex h-full">
      <FrameSidebar
        tasks={tasks}
        activeTaskId={activeTaskId}
        activeVideoId={activeVideoId}
        activeTaskVideos={activeTaskData?.videos || []}
        onCreateTask={handleCreateTask}
        onSelectTask={(id) => {
          setActiveTaskId(id);
          setActiveVideoId(null);
        }}
        onUploadVideo={handleUploadVideo}
        onSelectVideo={setActiveVideoId}
        onExportData={handleExportData}
        isUploading={isLoading}
        isLoadingVideos={isTaskLoading}
      />

      <div className="flex-1 h-full overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-3">
              <Loader2 className="animate-spin" />
              <span>上传中...</span>
            </div>
          </div>
        )}
        <VideoWorkspace
          videoDetail={activeVideoDetail}
          onUpdateFrames={handleUpdateVideoFrame}
        />
      </div>
    </div>
  );
}
