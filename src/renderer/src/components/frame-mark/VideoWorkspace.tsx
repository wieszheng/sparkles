import { FrameStrip } from "./FrameStrip";
import { Timer, ArrowRight, Loader2, FileVideo } from "lucide-react";

interface VideoWorkspaceProps {
  videoDetail: VideoDetail | null;
  onUpdateFrames: (
    startFrameId: string | null,
    endFrameId: string | null,
  ) => void;
}

export function VideoWorkspace({
  videoDetail,
  onUpdateFrames,
}: VideoWorkspaceProps) {
  console.log("videoDetail", videoDetail);
  const allFrames = videoDetail?.frames || [];

  const resolveStartFrame = () => {
    // 1. Manual selection
    if (videoDetail?.selected_start_frame_id) {
      return allFrames.find(
        (f) => f.id === videoDetail.selected_start_frame_id,
      );
    }
    // 2. Echo from API (frame_type='first') - 优先使用frame_type
    const backendFirst = allFrames.find((f) => f.frame_type === "first");
    if (backendFirst) return backendFirst;

    return undefined;
  };

  const resolveEndFrame = () => {
    if (videoDetail?.selected_end_frame_id) {
      return allFrames.find((f) => f.id === videoDetail.selected_end_frame_id);
    }
    // Echo from API (frame_type='last') - 优先使用frame_type
    const backendLast = allFrames.find((f) => f.frame_type === "last");
    if (backendLast) return backendLast;

    return undefined;
  };

  const startFrame = resolveStartFrame();
  const endFrame = resolveEndFrame();

  // Early returns after hooks
  if (!videoDetail) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 h-full">
        <div className="text-center space-y-4 max-w-sm w-full flex flex-col items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileVideo className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-medium text-foreground">
              未选择视频
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              从侧边栏中选择一段视频，开始分析帧延迟情况。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use summary for basic info if detail is loading
  const name = videoDetail?.filename || "Unknown";
  const duration = videoDetail?.duration || 0;
  const status = videoDetail?.status;

  if (status === "failed") {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <div className="max-w-md text-center space-y-4 w-full flex flex-col items-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
            <FileVideo className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <p className="font-medium text-destructive text-lg sm:text-xl">
            视频处理失败
          </p>
          {videoDetail?.error_message && (
            <div className="text-sm bg-destructive/5 text-destructive/80 p-3 rounded border border-destructive/20 font-mono w-full max-w-md">
              {videoDetail.error_message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!videoDetail && (status === "completed" || status === "reviewed")) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center text-muted-foreground h-full">
        <div className="text-center flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
          <p className="text-sm sm:text-base text-muted-foreground">
            正在加载视频详情...
          </p>
        </div>
      </div>
    );
  }

  // Show all frames for candidates to allow re-selection, even if some are already marked.
  // The 'echo' logic (highlighting the saved selection) is handled by startFrame/endFrame resolution above.
  const startCandidates = allFrames;
  const endCandidates = allFrames;

  // Pass the resolved IDs to the strip so they are highlighted
  const effectiveStartId = startFrame?.id || null;
  const effectiveEndId = endFrame?.id || null;

  const netDuration =
    startFrame && endFrame ? endFrame.timestamp - startFrame.timestamp : "--";

  const handleStartSelect = (frame: Frame) => {
    if (videoDetail) {
      onUpdateFrames(frame.id, null);
    }
  };

  const handleEndSelect = (frame: Frame) => {
    if (videoDetail) {
      onUpdateFrames(null, frame.id);
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
              {startFrame ? `${startFrame.timestamp}ms` : "--"}
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
                    Frame at {startFrame.timestamp}ms
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
              {endFrame ? `${endFrame.timestamp}ms` : "--"}
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
                    Frame at {endFrame.timestamp}ms
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
              {netDuration}ms
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
