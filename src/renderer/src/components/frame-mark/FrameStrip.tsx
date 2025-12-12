import React, { useEffect, useRef, useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Film,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FrameStripProps {
  title: string;
  frames: Frame[];
  selectedFrameId: string | null;
  onFrameDoubleClick: (frame: Frame) => void;
  color: "blue" | "orange";
}

export const FrameStrip: React.FC<FrameStripProps> = ({
  title,
  frames,
  selectedFrameId,
  onFrameDoubleClick,
  color,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);
  const miniStripRef = useRef<HTMLDivElement>(null);
  const navigationBarRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [framePositions, setFramePositions] = useState<Map<string, number>>(
    new Map(),
  );

  // Ref map to track individual frame elements for auto-scrolling
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const borderColor =
    color === "blue" ? "border-blue-500" : "border-orange-500";

  // Update refs map when frames change
  useEffect(() => {
    const currentIds = new Set(frames.map((f) => f.id));
    for (const id of itemRefs.current.keys()) {
      if (!currentIds.has(id)) {
        itemRefs.current.delete(id);
      }
    }
  }, [frames]);

  // Update scroll position and dimensions
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollInfo = () => {
      setScrollPosition(container.scrollLeft);
      setScrollWidth(container.scrollWidth);
      setClientWidth(container.clientWidth);
    };

    updateScrollInfo();
    container.addEventListener("scroll", updateScrollInfo);
    const resizeObserver = new ResizeObserver(() => {
      updateScrollInfo();
      // Recalculate frame positions after resize
      setTimeout(() => {
        const positions = new Map<string, number>();
        frames.forEach((frame) => {
          const pos = getFramePosition(frame.id);
          if (pos !== null) {
            positions.set(frame.id, pos);
          }
        });
        setFramePositions(positions);
      }, 0);
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollInfo);
      resizeObserver.disconnect();
    };
  }, [frames]);

  // Recalculate frame positions when frames or scrollWidth changes
  useEffect(() => {
    if (scrollWidth === 0) return;

    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const positions = new Map<string, number>();
      frames.forEach((frame) => {
        const frameNode = itemRefs.current.get(frame.id);
        if (!frameNode || !container) return;

        const containerRect = container.getBoundingClientRect();
        const frameRect = frameNode.getBoundingClientRect();

        const relativeLeft =
          frameRect.left - containerRect.left + container.scrollLeft;
        const percentage = (relativeLeft / scrollWidth) * 100;
        const validPercentage = Math.max(0, Math.min(100, percentage));

        positions.set(frame.id, validPercentage);
      });
      setFramePositions(positions);
    }, 100);

    return () => clearTimeout(timer);
  }, [frames, scrollWidth, scrollPosition]);

  // Auto-scroll to selected frame in main list when it changes
  useEffect(() => {
    if (selectedFrameId && scrollContainerRef.current) {
      const selectedNode = itemRefs.current.get(selectedFrameId);
      if (selectedNode) {
        selectedNode.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedFrameId, frames]);

  // Auto-scroll main list to preview frame when preview opens
  useEffect(() => {
    if (!previewFrame || !scrollContainerRef.current) return;

    const timer = setTimeout(() => {
      const selectedNode = itemRefs.current.get(previewFrame.id);
      if (selectedNode && scrollContainerRef.current) {
        selectedNode.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [previewFrame]);

  // Auto-scroll mini-strip in preview
  useEffect(() => {
    if (!previewFrame || !miniStripRef.current) return;

    // Use setTimeout to ensure DOM is updated
    const timer = setTimeout(() => {
      const selectedNode = miniStripRef.current?.querySelector(
        `[data-frame-id="${previewFrame.id}"]`,
      );
      if (selectedNode && miniStripRef.current) {
        const container = miniStripRef.current;
        const nodeRect = selectedNode.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate scroll position to center the frame
        const scrollLeft =
          container.scrollLeft +
          (nodeRect.left - containerRect.left) -
          containerRect.width / 2 +
          nodeRect.width / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [previewFrame]);

  // Keyboard navigation for preview
  useEffect(() => {
    if (!previewFrame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Enter") {
        handleSelect();
      } else if (e.key === "Escape") {
        setPreviewFrame(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewFrame, frames]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 600;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const currentIndex = previewFrame
    ? frames.findIndex((f) => f.id === previewFrame.id)
    : -1;
  const isPreviewSelected = previewFrame && selectedFrameId === previewFrame.id;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex !== -1 && currentIndex < frames.length - 1) {
      setPreviewFrame(frames[currentIndex + 1]);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setPreviewFrame(frames[currentIndex - 1]);
    }
  };

  const handleSelect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewFrame) {
      onFrameDoubleClick(previewFrame);
    }
  };

  // Calculate frame position in navigation bar
  const getFramePosition = (frameId: string): number | null => {
    const frameNode = itemRefs.current.get(frameId);
    const container = scrollContainerRef.current;
    if (!frameNode || !container || scrollWidth === 0) return null;

    // Use getBoundingClientRect for more accurate position calculation
    const containerRect = container.getBoundingClientRect();
    const frameRect = frameNode.getBoundingClientRect();

    // Calculate relative position considering scroll position
    const relativeLeft =
      frameRect.left - containerRect.left + container.scrollLeft;

    // Calculate percentage position
    const percentage = (relativeLeft / scrollWidth) * 100;

    // Ensure percentage is within valid range
    return Math.max(0, Math.min(100, percentage));
  };

  // Handle navigation bar click
  const handleNavigationClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    const navBar = navigationBarRef.current;
    if (!container || !navBar) return;

    const navRect = navBar.getBoundingClientRect();
    const clickX = e.clientX - navRect.left;
    const percentage = clickX / navRect.width;
    const targetScroll = percentage * (scrollWidth - clientWidth);

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            {title}
            <span className="text-[10px] font-normal normal-case text-muted-foreground px-1.5 py-0.5">
              Total: {frames.length}
            </span>
          </h3>
          <span className="text-[10px] text-muted-foreground inline-block">
            双击以进行选择
          </span>
        </div>

        {/* Container for buttons and list */}
        <div className="flex-1 min-h-0 flex items-center gap-2">
          {/* Left Button - Always visible */}
          {frames.length > 0 && (
            <button
              onClick={() => scroll("left")}
              disabled={scrollPosition <= 10}
              className="shrink-0 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg hover:bg-background hover:shadow-xl transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              title="向左滚动"
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Frame List Card */}
          <div className="flex-1 relative overflow-hidden min-w-0 h-full">
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-x-auto px-2 py-1 scroll-smooth flex gap-2 items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {frames.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs sm:text-sm text-muted-foreground italic p-4">
                  <Film className="w-6 h-6 sm:w-8 sm:h-8 opacity-30 mb-2" />
                  <span>暂无可用的帧</span>
                </div>
              ) : (
                frames.map((frame) => {
                  const isSelected = selectedFrameId === frame.id;
                  const isCandidate =
                    color === "blue"
                      ? frame.is_first_candidate
                      : frame.is_last_candidate;
                  const candidateRing =
                    color === "blue"
                      ? "ring-cyan-500/80 border-cyan-500 border-dashed"
                      : "ring-amber-500/80 border-amber-500 border-dashed";

                  return (
                    <div
                      key={frame.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(frame.id, el);
                        else itemRefs.current.delete(frame.id);
                      }}
                      className={`relative group shrink-0 transition-all duration-200 select-none h-full py-1 ${
                        isSelected ? "z-10" : ""
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden border-2 shadow-sm bg-black/20 transition-all flex items-center justify-center rounded-sm h-full w-auto ${
                          isSelected
                            ? `${borderColor} ring-2 ring-offset-0 ${color === "blue" ? "ring-blue-500/50" : "ring-orange-500/50"}`
                            : isCandidate
                              ? `${candidateRing} ring-2 ring-offset-0`
                              : "border-transparent hover:border-primary/30"
                        }`}
                      >
                        <img
                          src={frame.url}
                          alt={`Time ${frame.timestamp}`}
                          className="h-full w-auto block max-w-none object-contain"
                          draggable={false}
                          onDoubleClick={() => onFrameDoubleClick(frame)}
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFrame(frame);
                            }}
                          >
                            <Maximize2 />
                          </Button>
                        </div>

                        {/* Time overlay */}
                        <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[10px] py-0.5 px-1 font-mono text-center backdrop-blur-[1px]">
                          {frame.timestamp.toFixed(2)}s
                        </div>

                        {/* Candidate Indicator */}
                        {isCandidate && (
                          <div
                            className={`absolute left-1 bottom-5 bg-white/95 text-[10px] font-medium px-1.5 py-0.5 rounded-sm shadow-sm z-20 flex items-center gap-1 ${
                              color === "blue"
                                ? "text-cyan-600"
                                : "text-amber-600"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3 h-3 ${
                                color === "blue"
                                  ? "text-cyan-600"
                                  : "text-amber-600"
                              }`}
                            />
                            <span>候选</span>
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-white rounded-full shadow-sm z-20 p-0.5">
                            <CheckCircle2
                              className={`w-4 h-4 ${color === "blue" ? "text-blue-600" : "text-orange-600"}`}
                              fill="white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Button - Always visible */}
          {frames.length > 0 && (
            <button
              onClick={() => scroll("right")}
              disabled={scrollPosition >= scrollWidth - clientWidth - 10}
              className="shrink-0 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg hover:bg-background hover:shadow-xl transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              title="向右滚动"
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Navigation Bar */}
        {frames.length > 0 && scrollWidth > clientWidth && (
          <div className="mt-2 flex items-center gap-2 shrink-0">
            {/* Spacer for left button - always show since button is always visible */}
            <div className="shrink-0 w-10" />

            {/* Navigation bar matching frame list width */}
            <div className="flex-1 relative">
              <div
                ref={navigationBarRef}
                onClick={handleNavigationClick}
                className="relative h-3 bg-secondary/50 rounded-full cursor-pointer overflow-hidden border border-border/50"
              >
                {/* Scroll indicator */}
                {scrollWidth > clientWidth && (
                  <div
                    className="absolute top-0 h-full bg-primary/20 rounded-full transition-all duration-150"
                    style={{
                      left: `${(scrollPosition / (scrollWidth - clientWidth)) * 100}%`,
                      width: `${(clientWidth / scrollWidth) * 100}%`,
                    }}
                  />
                )}

                {/* Candidate frame markers */}
                {frames.map((frame) => {
                  const isCandidate =
                    color === "blue"
                      ? frame.is_first_candidate
                      : frame.is_last_candidate;
                  if (!isCandidate) return null;

                  const position = framePositions.get(frame.id);
                  if (position === undefined || position === null) return null;

                  return (
                    <div
                      key={`candidate-${frame.id}`}
                      className="absolute top-0 w-0.5 h-full z-10"
                      style={{
                        left: `${position}%`,
                        backgroundColor:
                          color === "blue" ? "#06b6d4" : "#f59e0b",
                        boxShadow: `0 0 2px ${color === "blue" ? "#06b6d4" : "#f59e0b"}`,
                      }}
                      title={`候选帧: ${frame.timestamp.toFixed(2)}s`}
                    />
                  );
                })}

                {/* Selected frame marker */}
                {selectedFrameId &&
                  (() => {
                    const position = framePositions.get(selectedFrameId);
                    if (position === undefined || position === null)
                      return null;

                    return (
                      <div
                        className="absolute top-0 w-1.5 h-full z-20 rounded-full shadow-md"
                        style={{
                          left: `${position}%`,
                          backgroundColor:
                            color === "blue" ? "#3b82f6" : "#f97316",
                          transform: "translateX(-50%)",
                          boxShadow: `0 0 4px ${color === "blue" ? "#3b82f6" : "#f97316"}`,
                        }}
                        title={`选中帧`}
                      />
                    );
                  })()}
              </div>
            </div>

            {/* Spacer for right button - always show since button is always visible */}
            <div className="shrink-0 w-10" />
          </div>
        )}
      </div>

      {/* Transparent Lightbox Preview Modal */}
      <Dialog
        open={!!previewFrame}
        onOpenChange={(open) => !open && setPreviewFrame(null)}
      >
        {/* Removed background, border, and shadow. Kept size and layout logic. */}
        <DialogContent className="!max-w-[90vw] !w-[90vw] !h-[90vh] !p-0 bg-transparent border-none shadow-none flex flex-col outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Main Content Area */}
          <div className="flex-1 relative flex items-center justify-center w-full h-full pb-45">
            {/* Clickable Background for Close (invisible) */}
            <div
              className="absolute inset-0 z-0"
              onClick={() => setPreviewFrame(null)}
            />

            {/* Image */}
            {previewFrame && (
              <img
                src={previewFrame.url}
                alt={`Frame ${previewFrame.timestamp}`}
                className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain rounded-sm"
                draggable={false}
              />
            )}

            {/* Always Visible Left Navigation Button */}
            <div className="absolute inset-y-0 left-0 w-24 z-20 flex items-center justify-center pointer-events-none">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-white/10 hover:scale-103 active:scale-95 transition-all backdrop-blur-md ${currentIndex === 0 ? "opacity-0 cursor-default" : "opacity-100 cursor-pointer"}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>

            {/* Always Visible Right Navigation Button */}
            <div className="absolute inset-y-0 right-0 w-24 z-20 flex items-center justify-center pointer-events-none">
              <button
                onClick={handleNext}
                disabled={currentIndex === frames.length - 1}
                className={`pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-white/10 hover:scale-103 active:scale-95 transition-all backdrop-blur-md  ${currentIndex === frames.length - 1 ? "opacity-0 cursor-default" : "opacity-100 cursor-pointer"}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Floating HUD Bottom Panel - Integrated inside modal */}
          <div className="absolute bottom-1 left-0 right-0 z-[60] flex justify-center pointer-events-none">
            <div className="w-full max-w-4xl bg-black/30 backdrop-blur-xl rounded-xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-3">
              {/* Mini Filmstrip */}
              <div
                className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 px-1"
                ref={miniStripRef}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {frames.map((f) => {
                  const isCandidate =
                    color === "blue"
                      ? f.is_first_candidate
                      : f.is_last_candidate;
                  return (
                    <div
                      key={f.id}
                      data-frame-id={f.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFrame(f);
                      }}
                      className={`relative shrink-0 h-12 w-auto aspect-video rounded-sm overflow-hidden border ${
                        f.id === previewFrame?.id
                          ? "border-white ring-2 ring-white/20  opacity-100 z-10"
                          : isCandidate
                            ? `${color === "blue" ? "border-cyan-500" : "border-amber-500"} border-dashed opacity-70 hover:opacity-100`
                            : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={f.url}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        alt={f.url}
                      />
                      {/* Small dot for selected frames context */}
                      {selectedFrameId === f.id && (
                        <div
                          className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${color === "blue" ? "bg-blue-500" : "bg-orange-500"}`}
                        />
                      )}
                      {/* Tiny badge for candidate frames */}
                      {color === "blue" && f.is_first_candidate && (
                        <div className="absolute bottom-0.5 left-0.5 px-1 py-[1px] rounded-sm text-[9px] font-semibold bg-white/90 text-cyan-600 shadow border border-dashed border-cyan-500">
                          候选
                        </div>
                      )}
                      {color === "orange" && f.is_last_candidate && (
                        <div className="absolute bottom-0.5 left-0.5 px-1 py-[1px] rounded-sm text-[9px] font-semibold bg-white/90 text-amber-600 shadow border border-dashed border-amber-500">
                          候选
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-6 text-white">
                  <div className="flex flex-col">
                    <span className="text-xs tracking-wider uppercase flex items-center gap-1">
                      <Film className="w-3 h-3" /> 时间戳
                    </span>
                    <span className="text-sm font-medium">
                      {previewFrame?.timestamp.toFixed(3)}
                      <span className="text-sm text-white/50 ml-1">s</span>
                    </span>
                  </div>

                  <div className="h-8 w-px bg-white/10"></div>

                  <div className="text-sm font-mono">
                    帧 <span>{currentIndex + 1}</span> / {frames.length}
                  </div>
                </div>

                <Button size="sm" onClick={handleSelect}>
                  {isPreviewSelected ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已选中</span>
                    </div>
                  ) : (
                    <span>确认选择</span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
