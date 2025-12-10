import { useMemo } from "react";

import { FrameStrip } from "./FrameStrip";
import { Timer, ArrowRight, Loader2, FileVideo } from "lucide-react";

interface VideoWorkspaceProps {
  videoDetail: VideoDetail | null;
  videoSummary?: TaskVideoSummary;
  onUpdateFrames: (
    videoId: string,
    startFrameId: string | null,
    endFrameId: string | null,
  ) => void;
}

export function VideoWorkspace({
  videoDetail,
  videoSummary,
  onUpdateFrames,
}: VideoWorkspaceProps) {
  if (!videoDetail && !videoSummary) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileVideo className="w-8 h-8 opacity-50" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">未选择视频</h3>
            <p className="text-sm text-muted-foreground mt-1">
              从侧边栏中选择一段视频，开始分析帧延迟情况。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use summary for basic info if detail is loading
  const name =
    videoDetail?.filename || videoSummary?.video_filename || "Unknown";
  const duration = videoDetail?.duration || videoSummary?.duration || 0;
  const status = videoDetail?.status || videoSummary?.video_status;

  // Enhanced Loading UI
  if (status === "processing" || status === "uploading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full rounded-xl p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full"></div>
            <div className="relative bg-primary/10 p-5 rounded-full ring-1 ring-primary/20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              {status === "uploading" ? "Uploading Video" : "Processing Video"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {status === "uploading"
                ? "Uploading your video file to the server. Large files may take a moment."
                : "Analyzing frames, calculating timestamps, and preparing previews."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
            <FileVideo className="w-6 h-6" />
          </div>
          <p className="font-medium text-destructive">
            Error processing video file
          </p>
          {videoDetail?.error_message && (
            <div className="text-sm bg-destructive/5 text-destructive/80 p-3 rounded border border-destructive/20 font-mono">
              {videoDetail.error_message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!videoDetail && (status === "completed" || status === "reviewed")) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const allFrames = videoDetail?.frames || [];

  // Show all frames for candidates to allow re-selection, even if some are already marked.
  // The 'echo' logic (highlighting the saved selection) is handled by startFrame/endFrame resolution below.
  const startCandidates = allFrames;
  const endCandidates = allFrames;

  // Resolve Effective Selected Frames (Echo Logic)
  // 1. User's manual selection in this session (videoDetail.selected_..._id)
  // 2. API data indicating a frame is already marked 'first'/'last' (Echo from DB)
  // 3. Fallback to summary data if frames aren't loaded or fully synced

  const startFrame = useMemo(() => {
    // 1. Manual selection
    if (videoDetail?.selected_start_frame_id) {
      return allFrames.find(
        (f) => f.id === videoDetail.selected_start_frame_id,
      );
    }
    // 2. Echo from API (type='first')
    const backendFirst = allFrames.find((f) => f.type === "first");
    if (backendFirst) return backendFirst;

    // 3. Fallback to summary
    if (
      videoSummary?.first_frame_url &&
      videoSummary.first_frame_time !== null
    ) {
      return {
        id: "virtual-start",
        url: videoSummary.first_frame_url,
        timestamp: videoSummary.first_frame_time,
        type: "first",
      };
    }
    return undefined;
  }, [videoDetail, allFrames, videoSummary]);

  const endFrame = useMemo(() => {
    if (videoDetail?.selected_end_frame_id) {
      return allFrames.find((f) => f.id === videoDetail.selected_end_frame_id);
    }
    const backendLast = allFrames.find((f) => f.type === "last");
    if (backendLast) return backendLast;

    if (videoSummary?.last_frame_url && videoSummary.last_frame_time !== null) {
      return {
        id: "virtual-end",
        url: videoSummary.last_frame_url,
        timestamp: videoSummary.last_frame_time,
        type: "last",
      };
    }
    return undefined;
  }, [videoDetail, allFrames, videoSummary]);

  // Pass the resolved IDs to the strip so they are highlighted
  const effectiveStartId = startFrame?.id || null;
  const effectiveEndId = endFrame?.id || null;

  const netDuration =
    startFrame && endFrame
      ? (endFrame.timestamp - startFrame.timestamp).toFixed(3)
      : "--";

  const handleStartSelect = (frame: Frame) => {
    if (videoDetail) {
      onUpdateFrames(videoDetail.video_id, frame.id, null);
    }
  };

  const handleEndSelect = (frame: Frame) => {
    if (videoDetail) {
      onUpdateFrames(videoDetail.video_id, null, frame.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="min-w-0 ml-2">
          <h1
            className="text-sm font-bold text-foreground truncate"
            title={name}
          >
            {name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Duration: {duration.toFixed(2)}s Fps: {videoDetail?.fps}
          </p>
        </div>

        {/* Stats Card */}
        <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-lg border border-border/50 shrink-0">
          {/* Start Time Block */}
          <div className="text-center relative group cursor-help min-w-[70px]">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
              开始
            </p>
            <p className="font-mono font-medium text-blue-600 leading-none">
              {startFrame ? `${startFrame.timestamp.toFixed(3)}s` : "--"}
            </p>
            {startFrame && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 hidden group-hover:block z-50">
                <div className="bg-popover border border-border shadow-xl rounded-md p-1 w-48">
                  <img
                    src={startFrame.url}
                    alt="Start frame"
                    className="w-full h-auto rounded-sm"
                  />
                  <div className="text-[10px] text-center mt-1 text-muted-foreground">
                    Frame at {startFrame.timestamp.toFixed(3)}s
                  </div>
                </div>

                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-t border-l border-border transform rotate-45"></div>
              </div>
            )}
          </div>

          <ArrowRight className="text-muted-foreground/70 w-4 h-4" />

          {/* End Time Block */}
          <div className="text-center relative group cursor-help min-w-[70px]">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
              结束
            </p>
            <p className="font-mono font-medium text-orange-600 leading-none">
              {endFrame ? `${endFrame.timestamp.toFixed(3)}s` : "--"}
            </p>
            {endFrame && (
              <div className="absolute top-full right-0 mt-3 hidden group-hover:block z-50">
                <div className="bg-popover border border-border shadow-xl rounded-md p-1 w-48">
                  <img
                    src={endFrame.url}
                    alt="End frame"
                    className="w-full h-auto rounded-sm"
                  />
                  <div className="text-[10px] text-center mt-1 text-muted-foreground">
                    Frame at {endFrame.timestamp.toFixed(3)}s
                  </div>
                </div>

                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-popover border-t border-l border-border transform rotate-45"></div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-border/60 mx-1"></div>

          <div className="text-center min-w-[80px]">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center justify-center gap-1">
              <Timer className="w-3 h-3" /> 结果
            </p>
            <p
              className={`font-mono leading-none ${netDuration !== "--" ? "text-green-600" : "text-muted-foreground"}`}
            >
              {netDuration}s
            </p>
          </div>
        </div>
      </div>

      {/* Frame Lists Area - Occupy remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Start Frames */}
        <div className="flex-1 min-h-0 p-1 flex flex-col ">
          <FrameStrip
            title="开始帧选择"
            frames={startCandidates}
            selectedFrameId={effectiveStartId}
            onFrameDoubleClick={handleStartSelect}
            color="blue"
          />
        </div>

        {/* End Frames */}
        <div className="flex-1 min-h-0 p-1 flex flex-col ">
          <FrameStrip
            title="结束帧选择"
            frames={endCandidates}
            selectedFrameId={effectiveEndId}
            onFrameDoubleClick={handleEndSelect}
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}
