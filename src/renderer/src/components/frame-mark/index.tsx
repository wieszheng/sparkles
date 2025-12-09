import { useState, useEffect } from "react";
import { FrameSidebar } from "@/components/frame-mark/FrameSidebar";
import { VideoWorkspace } from "@/components/frame-mark/VideoWorkspace";

import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function FrameMark() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // activeTaskData is the detailed task object (with video list)
  const [activeTaskData, setActiveTaskData] = useState<Task | null>(null);

  // activeVideoDetail is the full detail of the selected video (including frames)
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
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      console.error("Failed to load tasks", e);
    }
  };

  // Load Task Details when ID changes
  useEffect(() => {
    if (!activeTaskId) {
      setActiveTaskData(null);
      return;
    }

    const fetchTaskDetail = async () => {
      try {
        const detail = await api.getTaskDetail(activeTaskId);
        setActiveTaskData(detail);
      } catch (e) {
        console.error("Failed to load task detail", e);
      }
    };

    fetchTaskDetail();
  }, [activeTaskId]);

  // Load Video Details when ID changes
  useEffect(() => {
    if (!activeVideoId) {
      setActiveVideoDetail(null);
      return;
    }

    const fetchVideoDetail = async () => {
      try {
        const detail = await api.getVideoStatus(activeVideoId);
        setActiveVideoDetail(detail);
      } catch (e) {
        console.error("Failed to load video detail", e);
      }
    };

    fetchVideoDetail();
  }, [activeVideoId]);

  // POLLING: Check status of processing videos in the current task or current active video
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // 1. Refresh active video if it's processing
      if (
        activeVideoId &&
        activeVideoDetail &&
        ["uploading", "processing"].includes(activeVideoDetail.status)
      ) {
        try {
          const updated = await api.getVideoStatus(activeVideoId);
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
          ["uploading", "processing"].includes(v.video_status),
        )
      ) {
        try {
          const detail = await api.getTaskDetail(activeTaskData.id);
          // Only update status fields to avoid UI flickering/resetting
          setActiveTaskData((prev) => {
            if (!prev) return detail;
            return detail;
          });
        } catch (e) {
          console.log(e);
        }
      }
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [activeVideoId, activeVideoDetail, activeTaskData]);

  // Handlers

  const handleCreateTask = async (name: string) => {
    try {
      const newTask = await api.createTask({ name, created_by: "user" });
      setTasks((prev) => [newTask, ...prev]);
      setActiveTaskId(newTask.id);
      setActiveVideoId(null);
    } catch (e) {
      console.log(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
        setActiveVideoId(null);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleUploadVideo = async (file: File) => {
    if (!activeTaskId) return;
    setIsLoading(true);

    try {
      // 1. Upload Video
      const { video_id } = await api.uploadVideo(file);

      // 2. Add to Task
      await api.addVideosToTask(activeTaskId, [video_id]);

      // 3. Refresh Task Data
      const updatedTask = await api.getTaskDetail(activeTaskId);
      setActiveTaskData(updatedTask);

      // 4. Select the new video
      setActiveVideoId(video_id);
    } catch (e) {
      console.error(e);
      alert("Failed to upload video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVideoFrame = async (
    videoId: string,
    startFrameId: string | null,
    endFrameId: string | null,
  ) => {
    // Optimistic update locally
    if (activeVideoDetail) {
      setActiveVideoDetail({
        ...activeVideoDetail,
        selected_start_frame_id:
          startFrameId || activeVideoDetail.selected_start_frame_id,
        selected_end_frame_id:
          endFrameId || activeVideoDetail.selected_end_frame_id,
      });
    }

    // Call API if both are present (or just one if your API supports partial updates,
    // but the spec says "submit review" usually implies completion.
    // However, for better UX we might want to wait until both are selected or allow partials?
    // The spec requires both first_frame_id and last_frame_id.

    const targetStart =
      startFrameId || activeVideoDetail?.selected_start_frame_id;
    const targetEnd = endFrameId || activeVideoDetail?.selected_end_frame_id;

    if (targetStart && targetEnd) {
      try {
        const res = await api.submitFrameMarking(videoId, {
          first_frame_id: targetStart,
          last_frame_id: targetEnd,
          reviewer: "user",
        });

        if (activeTaskData) {
          const task = await api.getTaskDetail(activeTaskData.id);
          setActiveTaskData(task);
        }
      } catch (e) {
        console.error("Failed to submit marking", e);
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
        v.duration?.toFixed(2) || "",
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
        onDeleteTask={handleDeleteTask}
        onSelectTask={(id) => {
          setActiveTaskId(id);
          setActiveVideoId(null);
        }}
        onUploadVideo={handleUploadVideo}
        onSelectVideo={setActiveVideoId}
        onExportData={handleExportData}
        isUploading={isLoading}
      />

      <main className="flex-1 h-full overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-3">
              <Loader2 className="animate-spin" />
              <span>Uploading...</span>
            </div>
          </div>
        )}
        <VideoWorkspace
          videoDetail={activeVideoDetail}
          videoSummary={activeTaskData?.videos.find(
            (v) => v.video_id === activeVideoId,
          )}
          onUpdateFrames={handleUpdateVideoFrame}
        />
      </main>
    </div>
  );
}
