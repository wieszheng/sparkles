import { useMemo } from "react";

import { FrameStrip } from "./FrameStrip";
import { Timer, ArrowRight, Loader2 } from "lucide-react";

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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium">No Video Selected</h3>
          <p className="text-sm mt-1">
            Select a video from the sidebar or upload a new one.
          </p>
        </div>
      </div>
    );
  }

  // Use summary for basic info if detail is loading
  const name =
    videoDetail?.filename || videoSummary?.video_filename || "Unknown";
  const duration = videoDetail?.duration || videoSummary?.duration || 0;
  const status = videoDetail?.status || videoSummary?.video_status;

  if (status === "processing" || status === "uploading") {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium animate-pulse">Processing video...</p>
        <p className="text-xs text-muted-foreground/70 max-w-xs text-center">
          Status: {status.toUpperCase()}
          {videoDetail?.progress ? ` (${videoDetail.progress}%)` : ""}
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex-1 bg-background flex items-center justify-center text-destructive">
        <p className="font-medium">Error processing video file.</p>
        {videoDetail?.error_message && (
          <p className="text-sm mt-2">{videoDetail.error_message}</p>
        )}
      </div>
    );
  }

  // If we are here, we likely have videoDetail.frames populated.
  // If videoDetail is null but status is completed, it might be loading.
  if (!videoDetail && (status === "completed" || status === "reviewed")) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const allFrames = videoDetail?.frames || [];

  const startCandidates = useMemo(() => {
    const explicit = allFrames.filter((f) => f.frame_type === "first");
    return explicit.length > 0 ? explicit : allFrames;
  }, [allFrames]);

  const endCandidates = useMemo(() => {
    const explicit = allFrames.filter((f) => f.frame_type === "last");
    return explicit.length > 0 ? explicit : allFrames;
  }, [allFrames]);

  const startFrame =
    allFrames.find((f) => f.id === videoDetail?.selected_start_frame_id) ||
    (videoSummary?.first_frame_time !== null && videoSummary?.first_frame_url
      ? ({
          url: videoSummary.first_frame_url,
          timestamp: videoSummary.first_frame_time,
          id: "virtual-start",
        } as Frame)
      : undefined);

  const endFrame =
    allFrames.find((f) => f.id === videoDetail?.selected_end_frame_id) ||
    (videoSummary?.last_frame_time !== null && videoSummary?.last_frame_url
      ? ({
          url: videoSummary.last_frame_url,
          timestamp: videoSummary.last_frame_time,
          id: "virtual-end",
        } as Frame)
      : undefined);

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
      {/* Top Details Panel */}
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
            <p className="text-lg font-mono font-medium text-blue-600 leading-none">
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
                {/* Triangle arrow */}
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
            <p className="text-lg font-mono font-medium text-orange-600 leading-none">
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
                {/* Triangle arrow */}
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
              className={`text-xl font-mono font-bold leading-none ${netDuration !== "--" ? "text-green-600" : "text-muted-foreground"}`}
            >
              {netDuration}s
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col overflow-hidden">
        <FrameStrip
          title="首帧"
          frames={startCandidates}
          selectedFrameId={videoDetail?.selected_start_frame_id || null}
          onFrameDoubleClick={handleStartSelect}
          color="blue"
        />
      </div>

      {/* End Frames */}
      <div className="flex-1 min-h-0 p-2">
        <FrameStrip
          title="尾帧"
          frames={endCandidates}
          selectedFrameId={videoDetail?.selected_end_frame_id || null}
          onFrameDoubleClick={handleEndSelect}
          color="orange"
        />
      </div>
    </div>
  );
}
