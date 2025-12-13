import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Film,
  Maximize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrameStripProps {
  title: string;
  frames: Frame[];
  selectedFrameId: string | null;
  markedOtherId?: string | null;
  onFrameDoubleClick: (frame: Frame) => void;
  color: "blue" | "orange";
  aspectRatio: number; // Video Aspect Ratio (width / height)
}

export const FrameStrip: React.FC<FrameStripProps> = ({
  title,
  frames,
  selectedFrameId,
  markedOtherId,
  onFrameDoubleClick,
  color,
  aspectRatio,
}) => {
  // --- Viewport / Pagination Logic ---
  const [startIndex, setStartIndex] = useState(0);
  const [viewportCount, setViewportCount] = useState(12); // Increased default
  const containerRef = useRef<HTMLDivElement>(null);

  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);

  // Dynamic Viewport Calculation based on actual container size and aspect ratio
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateViewport = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      // Calculate item width based on container height (since items are h-full) and ratio
      if (height > 0 && width > 0) {
        // Padding/Gap approximations (2px gap * n)
        const GAP = 8;
        const itemWidth = height * aspectRatio;

        // Calculate how many fit
        const fitCount = Math.floor(width / (itemWidth + GAP));

        // Increase buffer by 4-5 frames as requested to ensure fullness and smooth navigation
        const buffer = 5;

        setViewportCount(Math.max(4, fitCount + buffer));
      }
    };

    calculateViewport(); // Initial

    const observer = new ResizeObserver(calculateViewport);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [aspectRatio]);

  // Jump to selected frame initially
  useEffect(() => {
    if (selectedFrameId) {
      const idx = frames.findIndex((f) => f.id === selectedFrameId);
      if (idx !== -1) {
        // Center the selected frame in viewport
        const newStart = Math.max(
          0,
          Math.min(
            idx - Math.floor(viewportCount / 2),
            frames.length - viewportCount,
          ),
        );
        setStartIndex(newStart);
      }
    }
  }, [selectedFrameId, frames.length, viewportCount]);

  // Derived visible frames (Performance Optimization)
  const visibleFrames = useMemo(() => {
    return frames.slice(startIndex, startIndex + viewportCount);
  }, [frames, startIndex, viewportCount]);

  const handleNextPage = () => {
    setStartIndex((prev) =>
      Math.min(prev + 1, Math.max(0, frames.length - viewportCount)),
    );
  };

  const handlePrevPage = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  // --- Preview Navigation Logic ---
  const previewIndex = previewFrame
    ? frames.findIndex((f) => f.id === previewFrame.id)
    : -1;
  const isPreviewSelected = previewFrame && selectedFrameId === previewFrame.id;

  const handlePreviewNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewIndex !== -1 && previewIndex < frames.length - 1) {
      setPreviewFrame(frames[previewIndex + 1]);
    }
  };

  const handlePreviewPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewIndex > 0) {
      setPreviewFrame(frames[previewIndex - 1]);
    }
  };

  const handleSelect = () => {
    if (previewFrame) {
      onFrameDoubleClick(previewFrame);
    }
  };

  // Keyboard support for preview
  useEffect(() => {
    if (!previewFrame) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handlePreviewNext();
      if (e.key === "ArrowLeft") handlePreviewPrev();
      if (e.key === "Enter") handleSelect();
      if (e.key === "Escape") setPreviewFrame(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFrame]);

  // --- Custom Timeline Component ---
  const Timeline = () => {
    const timelineRef = useRef<HTMLDivElement>(null);

    // Identify indices for specific markers only
    const selectedIndex = frames.findIndex((f) => f.id === selectedFrameId);
    const otherIndex = markedOtherId
      ? frames.findIndex((f) => f.id === markedOtherId)
      : -1;
    const maxIndex = Math.max(1, frames.length - 1);

    const getPositionPercent = (index: number) => {
      return (index / maxIndex) * 100;
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || frames.length === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));

      const targetIndex = Math.floor(percentage * (frames.length - 1));
      const newStart = Math.max(
        0,
        Math.min(
          targetIndex - Math.floor(viewportCount / 2),
          frames.length - viewportCount,
        ),
      );
      setStartIndex(newStart);
    };

    // Updated padding to px-10 to match w-10 buttons
    return (
      <div className="h-8 w-full px-10 flex items-center select-none">
        <div
          ref={timelineRef}
          className="relative w-full h-4 flex items-center cursor-pointer group py-1"
          onClick={handleTimelineClick}
        >
          {/* Track Line */}
          <div className="absolute left-0 right-0 h-1 bg-secondary rounded-full overflow-hidden group-hover:h-1.5 transition-all">
            <div className="h-full bg-border/50 w-full"></div>
          </div>

          {/* Specific Frame Markers (Optimized: No map over all frames) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Other Marker (from opposite strip) */}
            {otherIndex !== -1 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 z-10 bg-neutral-400 rounded-full shadow-sm"
                style={{
                  left: `${getPositionPercent(otherIndex)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {/* Selected Marker */}
            {selectedIndex !== -1 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 z-20 rounded-full shadow-sm border border-white transition-all duration-300 ${color === "blue" ? "bg-blue-600" : "bg-orange-600"}`}
                style={{
                  left: `${getPositionPercent(selectedIndex)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>

          {/* Current Viewport Indicator - Single Handle */}
          {frames.length > 0 && (
            <div
              className={`absolute h-4 w-1.5 rounded-full pointer-events-none transition-all duration-300 top-1/2 -translate-y-1/2 shadow-sm ${color === "blue" ? "bg-blue-500" : "bg-orange-500"}`}
              style={{
                left: `${getPositionPercent(startIndex)}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background rounded-lg overflow-hidden border border-border/50 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border/50 shrink-0">
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${color === "blue" ? "text-blue-700" : "text-orange-700"}`}
          >
            {title}
            <span className="text-[10px] font-normal normal-case text-muted-foreground bg-background/50 border border-border/50 px-1.5 py-0 rounded-sm">
              {frames.length} frames
            </span>
          </h3>
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-block">
            Double-click to select
          </span>
        </div>

        {/* Main Visible Area (Horizontal Strip) */}
        <div className="flex-1 min-h-0 flex items-stretch relative bg-black/5">
          {/* Left Button */}
          <Button
            variant="ghost"
            className="h-full w-10 rounded-none border-r border-border/50 hover:bg-white hover:text-foreground text-muted-foreground z-10 px-0 shrink-0"
            onClick={handlePrevPage}
            disabled={startIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Images Container */}
          <div className="flex-1 overflow-hidden relative" ref={containerRef}>
            <div className="absolute inset-0 flex items-center justify-start p-2 gap-2">
              {frames.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground italic">
                  No frames available
                </div>
              ) : (
                visibleFrames.map((frame) => {
                  const isSelected = selectedFrameId === frame.id;
                  const isOther = markedOtherId === frame.id;

                  return (
                    <div
                      key={frame.id}
                      className="h-full relative group/item shrink-0"
                      style={{ aspectRatio: aspectRatio }}
                    >
                      <div
                        className={`w-full h-full relative overflow-hidden border shadow-sm bg-black rounded-md transition-all ${
                          isSelected
                            ? `ring-2 ring-offset-1 ${color === "blue" ? "ring-blue-500 border-blue-600" : "ring-orange-500 border-orange-600"}`
                            : isOther
                              ? "opacity-50 grayscale border-dashed border-2"
                              : "border-transparent hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={frame.url}
                          alt={`Time ${frame.timestamp}`}
                          className="w-full h-full object-contain bg-black/5"
                          draggable={false}
                          loading="lazy"
                          onDoubleClick={() => onFrameDoubleClick(frame)}
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors pointer-events-none" />

                        {/* Zoom Button */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6 rounded shadow-sm opacity-90 hover:opacity-100 bg-white/90"
                            title="Zoom"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFrame(frame);
                            }}
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-black" />
                          </Button>
                        </div>

                        {/* Time overlay */}
                        <div className="absolute bottom-0 right-0 left-0 bg-black/70 text-white text-[9px] py-0.5 px-1 font-mono text-center backdrop-blur-[2px]">
                          {frame.timestamp?.toFixed(2)}s
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div
                            className={`absolute top-1 left-1 rounded-full shadow-sm z-20 p-0.5 bg-white`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${color === "blue" ? "text-blue-600" : "text-orange-600"}`}
                              fill="white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Spacer to ensure last item doesn't get cut off weirdly if list is short */}
              {visibleFrames.length < viewportCount && frames.length > 0 && (
                <div className="flex-1"></div>
              )}
            </div>
          </div>

          {/* Right Button */}
          <Button
            variant="ghost"
            className="h-full w-10 rounded-none border-l border-border/50 hover:bg-white hover:text-foreground text-muted-foreground z-10 px-0 shrink-0"
            onClick={handleNextPage}
            disabled={startIndex >= frames.length - viewportCount}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Custom Timeline Navigation */}
        <div className="bg-background border-t border-border/50 shrink-0">
          <Timeline />
        </div>
      </div>

      {/*
        --------------------------------------------------
        CUSTOM MODAL (NO PORTAL)
        --------------------------------------------------
      */}
      {previewFrame && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewFrame(null)}
          />

          {/* Close Button (Fixed to Viewport for easy access) */}
          <div className="absolute top-4 right-4 z-[100]">
            <button
              onClick={() => setPreviewFrame(null)}
              className="bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full p-2 transition-all border border-white/5"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/*
               Content Box
               Requirement: Width occupies 90vh (relative to screen height to act as a consistent window).
               Also max-width 90vw for mobile safety.
            */}
          <div
            className="relative flex flex-col items-center justify-center pointer-events-none p-4"
            style={{ width: "90vh", maxWidth: "90vw" }}
          >
            {/* 1. Image Wrapper (Width fills the 90vh container) */}
            <div className="relative w-full pointer-events-auto group shadow-2xl rounded-sm overflow-hidden bg-black ring-1 ring-white/10">
              {/*
                       Image:
                       - w-full to match the 90vh width requirement.
                       - max-h-[85vh] to prevent vertical overflow if video is portrait.
                   */}
              <img
                src={previewFrame.url}
                alt={`Frame ${previewFrame.timestamp}`}
                className="w-full h-auto object-contain select-none block"
                style={{ maxHeight: "85vh" }}
                draggable={false}
              />

              {/* Left Nav Button - Tightly coupled to image sides (inside) */}
              <button
                onClick={handlePreviewPrev}
                disabled={previewIndex === 0}
                className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/50 to-transparent flex items-center justify-start pl-2 transition-all outline-none ${previewIndex === 0 ? "opacity-0 cursor-default" : "opacity-0 group-hover:opacity-100 cursor-pointer hover:from-black/70"}`}
              >
                <ChevronLeft className="w-10 h-10 text-white/90 drop-shadow-md" />
              </button>

              {/* Right Nav Button - Tightly coupled to image sides (inside) */}
              <button
                onClick={handlePreviewNext}
                disabled={previewIndex === frames.length - 1}
                className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/50 to-transparent flex items-center justify-end pr-2 transition-all outline-none ${previewIndex === frames.length - 1 ? "opacity-0 cursor-default" : "opacity-0 group-hover:opacity-100 cursor-pointer hover:from-black/70"}`}
              >
                <ChevronRight className="w-10 h-10 text-white/90 drop-shadow-md" />
              </button>
            </div>

            {/* 2. Bottom HUD Panel - Floating below */}
            <div className="pointer-events-auto mt-6 w-full flex justify-center">
              <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full py-3 px-8 shadow-2xl flex items-center justify-between gap-8 min-w-[320px]">
                {/* Timestamp Info */}
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 font-bold tracking-wider uppercase flex items-center gap-1">
                    <Film className="w-3 h-3" /> Timestamp
                  </span>
                  <span className="font-mono text-xl font-medium tracking-tight text-white">
                    {previewFrame.timestamp?.toFixed(3)}
                    <span className="text-sm text-white/50 ml-1">s</span>
                  </span>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                {/* Frame Counter */}
                <div className="text-sm font-mono text-white/70">
                  Frame{" "}
                  <span className="text-white font-bold">
                    {previewIndex + 1}
                  </span>{" "}
                  <span className="text-white/30">/</span> {frames.length}
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                {/* Action Button */}
                <Button
                  onClick={handleSelect}
                  className={`px-6 font-semibold tracking-wide transition-all shadow-lg active:scale-95 border-none rounded-full ${
                    isPreviewSelected
                      ? "bg-green-500 hover:bg-green-600 text-black"
                      : color === "blue"
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-orange-600 hover:bg-orange-500 text-white"
                  }`}
                >
                  {isPreviewSelected ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selected</span>
                    </div>
                  ) : (
                    <span>Set as {title}</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
