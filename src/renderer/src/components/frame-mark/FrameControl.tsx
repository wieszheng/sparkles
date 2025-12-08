import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  MonitorPlay,
  Film,
  Loader2,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  Square,
  StopCircle,
  Clock,
} from "lucide-react";

import { formatTime, calculateDurationMs, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FrameControlProps {
  video: VideoItem;
  onUpdateVideo: (updatedVideo: VideoItem) => void;
}

interface ExtractedFrame {
  timestamp: number;
  url: string;
}

// Internal Image Viewer Component for Zoom/Pan
const ImageViewer: React.FC<{ src: string; onClose: () => void }> = ({
  src,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed  flex flex-col border border-border/50"
    >
      <div className="flex justify-between items-center px-4 py-3 bg-card/80 border-b border-border/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.min(s + 0.5, 5))}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
            >
              <ZoomIn className="w-4 h-4 mr-2" /> 放大
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScale((s) => Math.max(s - 0.5, 0.5))}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
            >
              <ZoomOut className="w-4 h-4 mr-2" /> 缩小
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
            >
              <Square className="w-4 h-4 mr-2" /> 重置
            </Button>
          </div>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.img
          src={src}
          draggable={false}
          className="max-w-none shadow-2xl rounded-lg border border-border/50"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
          }}
          alt="放大预览"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="px-4 py-2 text-center text-muted-foreground text-xs bg-card/80 border-t border-border/50 backdrop-blur-sm">
        滚轮缩放 • 拖拽平移
      </div>
    </motion.div>
  );
};

export const FrameControl: React.FC<FrameControlProps> = ({
  video,
  onUpdateVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopExtractionRef = useRef(false);

  const [duration, setDuration] = useState(0);

  // Extraction Config
  const [extractHeadSeconds, setExtractHeadSeconds] = useState(5);
  const [extractTailSeconds, setExtractTailSeconds] = useState(5);

  // Frame Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  const [startCandidateFrames, setStartCandidateFrames] = useState<
    ExtractedFrame[]
  >([]);
  const [endCandidateFrames, setEndCandidateFrames] = useState<
    ExtractedFrame[]
  >([]);

  // Zoom Viewer State
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // --- Frame Extraction Logic ---

  const captureFrameAtTime = async (time: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve("");

      const onSeeked = () => {
        videoRef.current?.removeEventListener("seeked", onSeeked);
        const canvas = document.createElement("canvas");

        // Use a reasonable resolution for thumbnails
        const scale = 0.5;
        canvas.width = videoRef.current!.videoWidth * scale;
        canvas.height = videoRef.current!.videoHeight * scale;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
          // 0.7 quality JPEG
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve("");
        }
      };

      videoRef.current.addEventListener("seeked", onSeeked);
      videoRef.current.currentTime = time;
    });
  };

  const stopExtraction = () => {
    stopExtractionRef.current = true;
  };

  const extractCandidateFrames = async () => {
    if (!videoRef.current) return;

    setIsExtracting(true);
    setExtractionProgress(0);
    setStartCandidateFrames([]);
    setEndCandidateFrames([]);
    stopExtractionRef.current = false;

    // Original state
    const originalTime = videoRef.current.currentTime;
    const originalVolume = videoRef.current.volume;
    videoRef.current.volume = 0; // Mute

    const fps = video.fps;
    const interval = 1 / fps;

    const startList: ExtractedFrame[] = [];
    const endList: ExtractedFrame[] = [];

    try {
      // 1. Extract Head (Start Candidates)
      let time = 0;
      const headEndTime = Math.min(extractHeadSeconds, duration);

      const headSteps = Math.ceil(headEndTime / interval);
      const tailStartTime = Math.max(0, duration - extractTailSeconds);
      const tailSteps = Math.ceil((duration - tailStartTime) / interval);
      const totalSteps = headSteps + tailSteps;
      let currentStep = 0;

      // START LOOP
      while (time < headEndTime) {
        if (stopExtractionRef.current) break;
        const url = await captureFrameAtTime(time);
        if (url) startList.push({ timestamp: time, url });

        time += interval;
        currentStep++;
        setExtractionProgress(Math.round((currentStep / totalSteps) * 100));

        if (currentStep % 5 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      setStartCandidateFrames([...startList]);

      // 2. Extract Tail (End Candidates)
      time = tailStartTime;

      // END LOOP
      while (time <= duration) {
        if (stopExtractionRef.current) break;
        const url = await captureFrameAtTime(time);
        if (url) endList.push({ timestamp: time, url });

        time += interval;
        currentStep++;
        setExtractionProgress(Math.round((currentStep / totalSteps) * 100));

        if (currentStep % 5 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      setEndCandidateFrames([...endList]);
    } catch (e) {
      console.error("Extraction failed", e);
      alert("Failed to extract frames. Check console.");
    } finally {
      videoRef.current.currentTime = originalTime;
      videoRef.current.volume = originalVolume;
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };

  const markFrame = (frame: ExtractedFrame, type: "start" | "end") => {
    const updatedVideo = { ...video };

    if (type === "start") {
      updatedVideo.startFrame = {
        timestamp: frame.timestamp,
        thumbnailUrl: frame.url,
      };
      if (
        updatedVideo.endFrame &&
        updatedVideo.endFrame.timestamp < frame.timestamp
      ) {
        updatedVideo.endFrame = null;
      }
    } else {
      if (
        updatedVideo.startFrame &&
        frame.timestamp < updatedVideo.startFrame.timestamp
      ) {
        alert("End frame cannot be before Start frame");
        return;
      }
      updatedVideo.endFrame = {
        timestamp: frame.timestamp,
        thumbnailUrl: frame.url,
      };
    }

    onUpdateVideo(updatedVideo);
  };

  const clearMarker = (type: "start" | "end") => {
    const updated = { ...video };
    if (type === "start") updated.startFrame = null;
    else updated.endFrame = null;
    onUpdateVideo(updated);
  };

  const analysisDuration =
    video.startFrame && video.endFrame
      ? calculateDurationMs(
          video.startFrame.timestamp,
          video.endFrame.timestamp,
        )
      : 0;

  // Loading State
  if (!video.url) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center p-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <AnimatePresence>
        {viewerImage && (
          <ImageViewer src={viewerImage} onClose={() => setViewerImage(null)} />
        )}
      </AnimatePresence>

      {/* Hidden Logic Video */}
      <video
        ref={videoRef}
        src={video.url}
        className="absolute opacity-0 pointer-events-none -z-10 w-px h-px"
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Top Bar */}
      <div className="bg-card px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-border/50 flex justify-between items-center shadow-sm shrink-0 z-20 flex-wrap gap-2">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          <h2
            className="font-semibold text-sm text-foreground flex items-center gap-1 truncate"
            title={video.name || ""}
          >
            <Film className="w-4 h-4 text-primary " />
            <span className="truncate">{video.name}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTime(duration)} • {video.fps} FPS
          </p>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="flex items-center border border-border rounded-md p-1 bg-muted/30">
            <Button
              variant={video.fps === 30 ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 text-xs px-1.5 sm:px-3"
              onClick={() => onUpdateVideo({ ...video, fps: 30 })}
            >
              <span className="hidden sm:inline">30 FPS</span>
              <span className="sm:hidden">30</span>
            </Button>
            <Button
              variant={video.fps === 60 ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 text-xs px-1.5 sm:px-3"
              onClick={() => onUpdateVideo({ ...video, fps: 60 })}
            >
              <span className="hidden sm:inline">60 FPS</span>
              <span className="sm:hidden">60</span>
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Main Dashboard Area */}
        <div className="flex-1 bg-muted/20 p-2 sm:p-4 md:p-8 flex flex-col items-center overflow-y-auto">
          <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch justify-center">
            {/* Start Frame Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex flex-col min-w-0"
            >
              <Card className="flex-1 flex flex-col h-64 sm:h-72 glass-effect border-border/30 transition-all hover:shadow-xl hover:border-primary/30">
                <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-b border-border/30 flex justify-between items-center bg-card/50 rounded-t-xl">
                  <span className="font-bold text-primary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm uppercase tracking-wide">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> 起始帧
                  </span>
                  {video.startFrame && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearMarker("start")}
                        className="h-5 sm:h-6 px-1.5 sm:px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <span className="hidden sm:inline">清除</span>
                        <span className="sm:hidden">×</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 relative bg-muted/30 flex items-center justify-center group overflow-hidden">
                  {video.startFrame ? (
                    <>
                      <motion.img
                        src={video.startFrame.thumbnailUrl}
                        className="w-full h-full object-contain"
                        alt="起始帧"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() =>
                              setViewerImage(video.startFrame!.thumbnailUrl)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-all shadow-lg bg-background/80 backdrop-blur-sm"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground p-6 flex flex-col items-center">
                      <motion.div
                        className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3"
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <MapPin className="w-6 h-6 text-muted-foreground/50" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">
                        未设置起始帧
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        双击下方帧图片设置
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-t border-border/30 bg-card/50 rounded-b-xl text-center">
                  <span
                    className={cn(
                      "font-mono text-lg sm:text-xl font-bold tracking-tight transition-colors",
                      video.startFrame
                        ? "text-primary"
                        : "text-muted-foreground/40",
                    )}
                  >
                    {video.startFrame
                      ? formatTime(video.startFrame.timestamp)
                      : "--:--.---"}
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Duration Centerpiece */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center shrink-0 py-3 lg:py-4 px-2 lg:px-3"
            >
              <div className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                耗时
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-mono font-bold text-foreground tabular-nums tracking-tight">
                {analysisDuration}
                <span className="text-sm sm:text-base lg:text-xl xl:text-2xl text-muted-foreground ml-1 sm:ml-2 font-sans font-normal">
                  ms
                </span>
              </div>
              <motion.div
                className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-8 sm:w-10 lg:w-12 h-px bg-border"></div>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <div className="w-8 sm:w-10 lg:w-12 h-px bg-border"></div>
              </motion.div>
            </motion.div>

            {/* End Frame Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex flex-col min-w-0"
            >
              <Card className="flex-1 flex flex-col h-64 sm:h-72 glass-effect border-border/30 transition-all hover:shadow-xl hover:border-emerald-500/30">
                <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-b border-border/30 flex justify-between items-center bg-card/50 rounded-t-xl">
                  <span className="font-bold text-emerald-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm uppercase tracking-wide">
                    <MonitorPlay className="w-3 h-3 sm:w-4 sm:h-4" /> 结束帧
                  </span>
                  {video.endFrame && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearMarker("end")}
                        className="h-5 sm:h-6 px-1.5 sm:px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                      >
                        <span className="hidden sm:inline">清除</span>
                        <span className="sm:hidden">×</span>
                      </Button>
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 relative bg-muted/30 flex items-center justify-center group overflow-hidden">
                  {video.endFrame ? (
                    <>
                      <motion.img
                        src={video.endFrame.thumbnailUrl}
                        className="w-full h-full object-contain"
                        alt="结束帧"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() =>
                              setViewerImage(video.endFrame!.thumbnailUrl)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-all shadow-lg bg-background/80 backdrop-blur-sm"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground p-6 flex flex-col items-center">
                      <motion.div
                        className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3"
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <MonitorPlay className="w-6 h-6 text-muted-foreground/50" />
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">
                        未设置结束帧
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        双击下方帧图片设置
                      </p>
                    </div>
                  )}
                </div>
                <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 border-t border-border/30 bg-card/50 rounded-b-xl text-center">
                  <span
                    className={cn(
                      "font-mono text-lg sm:text-xl font-bold tracking-tight transition-colors",
                      video.endFrame
                        ? "text-emerald-600"
                        : "text-muted-foreground/40",
                    )}
                  >
                    {video.endFrame
                      ? formatTime(video.endFrame.timestamp)
                      : "--:--.---"}
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Controls Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-2xl mt-6 lg:mt-8 bg-card rounded-full border border-border/50 p-2 pl-3 sm:pl-4 lg:pl-6 shadow-lg flex items-center justify-between gap-2 sm:gap-4 glass-effect"
          >
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
                  开头
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={extractHeadSeconds}
                    onChange={(e) =>
                      setExtractHeadSeconds(Number(e.target.value))
                    }
                    className="w-12 sm:w-14 lg:w-16 h-7 sm:h-8 text-center pr-5 sm:pr-6 bg-muted/30 border-border/50 text-xs sm:text-sm"
                  />
                  <span className="absolute right-1.5 sm:right-2.5 text-xs text-muted-foreground pointer-events-none">
                    s
                  </span>
                </div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border/50"></div>
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">
                  结尾
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={extractTailSeconds}
                    onChange={(e) =>
                      setExtractTailSeconds(Number(e.target.value))
                    }
                    className="w-12 sm:w-14 lg:w-16 h-7 sm:h-8 text-center pr-5 sm:pr-6 bg-muted/30 border-border/50 text-xs sm:text-sm"
                  />
                  <span className="absolute right-1.5 sm:right-2.5 text-xs text-muted-foreground pointer-events-none">
                    s
                  </span>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isExtracting ? (
                <Button
                  variant="destructive"
                  onClick={stopExtraction}
                  className="rounded-full"
                >
                  <StopCircle className="w-4 h-4 mr-2" /> 停止
                </Button>
              ) : (
                <Button
                  onClick={extractCandidateFrames}
                  className="rounded-full shadow-md bg-primary hover:bg-primary/90"
                >
                  <Film className="w-4 h-4 mr-2" />
                  提取帧
                </Button>
              )}
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {isExtracting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-md mt-4"
              >
                <div className="flex justify-between text-xs text-muted-foreground mb-1 font-medium">
                  <span>正在处理视频...</span>
                  <span>{extractionProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${extractionProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Frame Lists */}
        <div className="h-4/6 shrink-0 border-t border-border/50 bg-card flex flex-col z-10 shadow-lg">
          {/* Start Candidates */}
          <div className="flex-1 flex flex-col border-b border-border/30 min-h-0">
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/5 border-b border-primary/20 flex justify-between items-center shrink-0 flex-wrap gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-wide flex items-center gap-1 sm:gap-2">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{" "}
                <span className="hidden xs:inline">起始帧候选</span>
                <span className="xs:hidden">起始候选</span>
                <Badge
                  variant="secondary"
                  className="text-[9px] h-3.5 sm:h-4 px-1 bg-background border-primary/30 text-primary"
                >
                  {startCandidateFrames.length}
                </Badge>
              </span>
              <span className="text-[9px] sm:text-[10px] text-primary/70 flex items-center gap-1">
                双击设置为 <span className="font-bold">起始帧</span>
              </span>
            </div>
            <div className="flex-1 overflow-x-auto p-2 flex items-center gap-2 bg-muted/20">
              {startCandidateFrames.length > 0 ? (
                startCandidateFrames.map((frame, idx) => (
                  <motion.div
                    key={`start-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="h-full aspect-video flex-shrink-0 relative group cursor-pointer rounded-lg overflow-hidden border border-border/50 bg-background shadow-md hover:shadow-lg hover:border-primary/30"
                    onDoubleClick={() => markFrame(frame, "start")}
                    title="双击标记为起始帧"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={frame.url}
                      className="h-full w-full object-contain pointer-events-none"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] text-foreground px-1.5 py-0.5 rounded font-mono z-10 border border-border/50">
                      {formatTime(frame.timestamp)}
                    </div>
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors border-2 border-transparent group-hover:border-primary/40 pointer-events-none rounded-lg"></div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md bg-background/80 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage(frame.url);
                        }}
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs gap-2">
                  <Film className="w-4 h-4 opacity-50" /> 暂无提取的帧
                </div>
              )}
            </div>
          </div>

          {/* End Candidates */}
          <div className="flex-1 flex flex-col min-h-0 bg-emerald-500/5">
            <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex justify-between items-center shrink-0 flex-wrap gap-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1 sm:gap-2">
                <MonitorPlay className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{" "}
                <span className="hidden xs:inline">结束帧候选</span>
                <span className="xs:hidden">结束候选</span>
                <Badge
                  variant="secondary"
                  className="text-[9px] h-3.5 sm:h-4 px-1 bg-background border-emerald-300 text-emerald-600"
                >
                  {endCandidateFrames.length}
                </Badge>
              </span>
              <span className="text-[9px] sm:text-[10px] text-emerald-600/70 flex items-center gap-1">
                双击设置为 <span className="font-bold">结束帧</span>
              </span>
            </div>
            <div className="flex-1 overflow-x-auto p-2 flex items-center gap-2 bg-muted/20">
              {endCandidateFrames.length > 0 ? (
                endCandidateFrames.map((frame, idx) => (
                  <motion.div
                    key={`end-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="h-full aspect-video flex-shrink-0 relative group cursor-pointer rounded-lg overflow-hidden border border-border/50 bg-background shadow-md hover:shadow-lg hover:border-emerald-400/50"
                    onDoubleClick={() => markFrame(frame, "end")}
                    title="双击标记为结束帧"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={frame.url}
                      className="h-full w-full object-contain pointer-events-none"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] text-foreground px-1.5 py-0.5 rounded font-mono z-10 border border-border/50">
                      {formatTime(frame.timestamp)}
                    </div>
                    <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors border-2 border-transparent group-hover:border-emerald-400/50 pointer-events-none rounded-lg"></div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md bg-background/80 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage(frame.url);
                        }}
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs gap-2">
                  <Film className="w-4 h-4 opacity-50" /> 暂无提取的帧
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
