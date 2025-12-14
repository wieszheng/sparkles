import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Film,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrameStripProps {
  title: string;
  frames: Frame[];
  selectedFrameId: string | null;
  onFrameDoubleClick: (frame: Frame) => void;
  color: "blue" | "orange";
  aspectRatio: number;
}

export function FrameStrip({
  title,
  frames,
  selectedFrameId,
  onFrameDoubleClick,
  color,
  aspectRatio,
}: FrameStripProps) {
  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});

  const GAP = 8;
  const itemFullWidth = itemWidth + GAP;

  // 计算每个帧项的宽度和总宽度
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { height } = containerRef.current.getBoundingClientRect();

      if (height > 0) {
        const calculatedWidth = height * aspectRatio;
        setItemWidth(calculatedWidth);
        setContainerHeight(height);
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [aspectRatio]);

  // 计算可见帧范围
  useEffect(() => {
    if (!scrollContainerRef.current || itemWidth === 0 || frames.length === 0) {
      return;
    }

    const updateVisibleRange = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const containerWidth = containerRect.width;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      // 计算可见范围的开始和结束索引
      const startIndex = Math.max(
        0,
        Math.floor((scrollLeft - GAP) / itemFullWidth),
      );
      const endIndex = Math.min(
        frames.length - 1,
        Math.ceil((scrollLeft + containerWidth + GAP) / itemFullWidth),
      );

      // 添加一些缓冲以便流畅滚动
      const buffer = 3;
      setVisibleRange({
        start: Math.max(0, startIndex - buffer),
        end: Math.min(frames.length - 1, endIndex + buffer),
      });

      setScrollLeft(scrollLeft);
      // 检查是否可以向右滚动（允许1px的误差）
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    updateVisibleRange();

    const container = scrollContainerRef.current;
    container.addEventListener("scroll", updateVisibleRange, { passive: true });
    window.addEventListener("resize", updateVisibleRange);

    return () => {
      container.removeEventListener("scroll", updateVisibleRange);
      window.removeEventListener("resize", updateVisibleRange);
    };
  }, [itemWidth, itemFullWidth, frames.length, GAP]);

  // 当选中帧变化时，立即滚动到该帧中心位置（不触发平滑滚动，避免加载中间帧）
  useEffect(() => {
    if (!selectedFrameId || !scrollContainerRef.current || itemWidth === 0) {
      return;
    }

    const idx = frames.findIndex((f) => f.id === selectedFrameId);
    if (idx === -1) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetScrollLeft = idx * itemFullWidth;
    const containerCenter = containerRect.width / 2;
    const targetCenterScroll =
      targetScrollLeft - containerCenter + itemWidth / 2;

    // 立即定位到目标位置（不使用平滑滚动，避免触发中间帧的加载）
    const finalScrollLeft = Math.max(0, targetCenterScroll);
    container.scrollLeft = finalScrollLeft;
    
    // 立即更新状态，确保可见范围立即更新
    setScrollLeft(finalScrollLeft);
    
    // 立即计算并更新可见范围，只渲染目标位置附近的帧
    const containerWidth = containerRect.width;
    const startIndex = Math.max(
      0,
      Math.floor((finalScrollLeft - GAP) / itemFullWidth),
    );
    const endIndex = Math.min(
      frames.length - 1,
      Math.ceil((finalScrollLeft + containerWidth + GAP) / itemFullWidth),
    );
    const buffer = 3;
    setVisibleRange({
      start: Math.max(0, startIndex - buffer),
      end: Math.min(frames.length - 1, endIndex + buffer),
    });
  }, [selectedFrameId, frames, itemWidth, itemFullWidth, GAP]);

  // 清理不再存在的帧的加载状态
  useEffect(() => {
    const frameIds = new Set(frames.map((f) => f.id));
    setImageLoadingStates((prev) => {
      const updated = { ...prev };
      // 只保留当前frames中存在的帧的加载状态
      Object.keys(updated).forEach((id) => {
        if (!frameIds.has(id)) {
          delete updated[id];
        }
      });
      return updated;
    });
  }, [frames]);

  // 计算总宽度
  const totalWidth = useMemo(() => {
    if (frames.length === 0 || itemWidth === 0) return 0;
    return frames.length * itemFullWidth + GAP;
  }, [frames.length, itemWidth, itemFullWidth, GAP]);

  // 滚动到指定索引（立即定位，避免触发中间帧加载）
  const scrollToIndex = (
    index: number,
    align: "center" | "start" = "center",
  ) => {
    if (!scrollContainerRef.current || itemWidth === 0) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const targetScrollLeft = index * itemFullWidth;

    let finalScrollLeft: number;
    if (align === "center") {
      const containerCenter = containerRect.width / 2;
      finalScrollLeft = targetScrollLeft - containerCenter + itemWidth / 2;
    } else {
      finalScrollLeft = targetScrollLeft;
    }

    // 立即定位到目标位置（不使用平滑滚动，避免触发中间帧的加载）
    const scrollPosition = Math.max(0, finalScrollLeft);
    container.scrollLeft = scrollPosition;
    
    // 立即更新状态，确保可见范围立即更新
    setScrollLeft(scrollPosition);
    
    // 立即计算并更新可见范围，只渲染目标位置附近的帧
    const containerWidth = containerRect.width;
    const startIndex = Math.max(
      0,
      Math.floor((scrollPosition - GAP) / itemFullWidth),
    );
    const endIndex = Math.min(
      frames.length - 1,
      Math.ceil((scrollPosition + containerWidth + GAP) / itemFullWidth),
    );
    const buffer = 3;
    setVisibleRange({
      start: Math.max(0, startIndex - buffer),
      end: Math.min(frames.length - 1, endIndex + buffer),
    });
  };

  const handleNextPage = () => {
    if (!scrollContainerRef.current || itemWidth === 0) return;
    const container = scrollContainerRef.current;
    const containerWidth = container.getBoundingClientRect().width;
    container.scrollBy({
      left: containerWidth * 0.8,
      behavior: "smooth",
    });
  };

  const handlePrevPage = () => {
    if (!scrollContainerRef.current || itemWidth === 0) return;
    const container = scrollContainerRef.current;
    const containerWidth = container.getBoundingClientRect().width;
    container.scrollBy({
      left: -containerWidth * 0.8,
      behavior: "smooth",
    });
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

  const Timeline = () => {
    const timelineRef = useRef<HTMLDivElement>(null);

    if (frames.length === 0 || itemWidth === 0) {
      return (
        <div className="h-6 w-full px-12 flex items-center select-none">
          <div className="relative w-full h-4 flex items-center" />
        </div>
      );
    }

    const getPositionPercent = (index: number) => {
      if (frames.length === 1) return 50;
      return (index / (frames.length - 1)) * 100;
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || frames.length === 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));

      const targetIndex = Math.floor(percentage * (frames.length - 1));
      scrollToIndex(targetIndex, "center");
    };

    // 计算视口范围在时间轴上的位置
    const viewportStartPercent = (() => {
      if (!scrollContainerRef.current || itemWidth === 0) return 0;
      const startIndex = Math.max(
        0,
        Math.floor((scrollLeft - GAP) / itemFullWidth),
      );
      return getPositionPercent(startIndex);
    })();

    const viewportEndPercent = (() => {
      if (!scrollContainerRef.current || itemWidth === 0) return 100;
      const container = scrollContainerRef.current;
      const containerWidth = container.getBoundingClientRect().width;
      const endIndex = Math.min(
        frames.length - 1,
        Math.floor((scrollLeft + containerWidth + GAP) / itemFullWidth),
      );
      return getPositionPercent(endIndex);
    })();

    const viewportWidthPercent = viewportEndPercent - viewportStartPercent;

    return (
      <div className="h-6 w-full px-10 flex items-center select-none">
        <div
          ref={timelineRef}
          className="relative w-full h-4 flex items-center cursor-pointer group py-1"
          onClick={handleTimelineClick}
        >
          {/* 背景轨道 */}
          <div className="absolute left-0 right-0 h-2.5 bg-secondary rounded-sm overflow-hidden">
            <div className="h-full bg-border/50 w-full"></div>
          </div>

          {/* 视口范围指示器 */}
          {frames.length > 0 && (
            <div
              className={`absolute h-2.5 rounded-sm pointer-events-none transition-all duration-300 top-1/2 -translate-y-1/2 shadow-sm opacity-60 ${
                color === "blue" ? "bg-blue-500" : "bg-orange-500"
              }`}
              style={{
                left: `${viewportStartPercent}%`,
                width: `${Math.max(2, viewportWidthPercent)}%`,
              }}
            />
          )}

          {/* 候选帧标记 */}
          <div className="absolute inset-0 pointer-events-none">
            {frames.map((frame, index) => {
              const isCandidate =
                color === "blue"
                  ? frame.is_first_candidate
                  : frame.is_last_candidate;
              if (!isCandidate) return null;
              return (
                <div
                  key={`candidate-${frame.id}`}
                  className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-2 z-10 rounded-sm ${
                    color === "blue" ? "bg-blue-400" : "bg-orange-400"
                  }`}
                  style={{
                    left: `${getPositionPercent(index)}%`,
                    transform: "translateX(-50%)",
                  }}
                  title={`候选帧: ${frame.timestamp.toFixed(2)}s`}
                />
              );
            })}

            {/* 选中帧标记 */}
            {selectedFrameId &&
              (() => {
                const selectedIndex = frames.findIndex(
                  (f) => f.id === selectedFrameId,
                );
                if (selectedIndex === -1) return null;
                return (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2.5 z-20 rounded-sm border border-white transition-all duration-300 ${
                      color === "blue" ? "bg-blue-600" : "bg-orange-600"
                    }`}
                    style={{
                      left: `${getPositionPercent(selectedIndex)}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                );
              })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0 px-1">
          <h3
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${color === "blue" ? "text-blue-600" : "text-orange-600"}`}
          >
            {title}
            <span className="text-[10px] font-normal normal-case text-muted-foreground px-1 py-0.5">
              Total: {frames.length}
            </span>
          </h3>
          <span className="text-[10px] text-muted-foreground inline-block">
            双击以进行选择
          </span>
        </div>

        <div
          className="flex-1 min-h-0 flex items-center gap-2"
          ref={containerRef}
        >
          {frames.length > 0 && (
            <button
              onClick={handlePrevPage}
              disabled={scrollLeft <= 0}
              className="shrink-0 w-8 h-8 rounded-full  backdrop-blur-sm border border-border shadow-lg transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              title="向左滚动"
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <div className="flex-1 relative overflow-hidden min-w-0 h-full">
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-x-auto overflow-y-hidden hide-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {frames.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs sm:text-sm text-muted-foreground italic p-4">
                  <Film className="w-6 h-6 sm:w-8 sm:h-8 opacity-30 mb-2" />
                  <span>暂无可用的帧</span>
                </div>
              ) : (
                <div
                  className="relative flex items-center"
                  style={{
                    width: `${totalWidth}px`,
                    height: "100%",
                  }}
                >
                  {/* 创建所有帧的占位div */}
                  {frames.map((_, index) => {
                    const frame = frames[index];
                    const isVisible =
                      index >= visibleRange.start && index <= visibleRange.end;
                    const isSelected = selectedFrameId === frame.id;
                    const isCandidate =
                      color === "blue"
                        ? frame.is_first_candidate
                        : frame.is_last_candidate;

                    return (
                      <div
                        key={frame.id}
                        className="absolute top-0 flex items-center justify-center"
                        style={{
                          left: `${index * itemFullWidth + GAP}px`,
                          width: `${itemWidth}px`,
                          height: "100%",
                        }}
                      >
                        {isVisible ? (
                          <div
                            className="h-full relative group/item shrink-0 py-1"
                            style={{
                              width: `${itemWidth}px`,
                              aspectRatio: aspectRatio,
                            }}
                          >
                            <div
                              className={`relative overflow-hidden border-2 shadow-sm bg-black/20 transition-all flex items-center justify-center rounded-sm h-full w-full ${
                                isSelected
                                  ? `ring-2 ring-offset-0 ${
                                      color === "blue"
                                        ? "ring-blue-500"
                                        : "ring-orange-500"
                                    }`
                                  : isCandidate
                                    ? `${
                                        color === "blue"
                                          ? "border-cyan-500 border-dashed"
                                          : "border-amber-500 border-dashed"
                                      }`
                                    : "border-transparent hover:border-primary"
                              }`}
                            >
                              {/* Loading状态 */}
                              {!imageLoadingStates[frame.id] && (
                                <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center">
                                  <div
                                    className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                                      color === "blue"
                                        ? "border-blue-500/30 border-t-blue-500"
                                        : "border-orange-500/30 border-t-orange-500"
                                    }`}
                                  />
                                </div>
                              )}

                              <img
                                src={frame.url}
                                alt={`Time ${frame.timestamp}`}
                                className={`h-full w-auto block max-w-none rounded-sm object-contain transition-opacity duration-300 ${
                                  imageLoadingStates[frame.id]
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                                draggable={false}
                                onDoubleClick={() => onFrameDoubleClick(frame)}
                                onLoad={() => {
                                  setImageLoadingStates((prev) => ({
                                    ...prev,
                                    [frame.id]: true,
                                  }));
                                }}
                                onError={() => {
                                  setImageLoadingStates((prev) => ({
                                    ...prev,
                                    [frame.id]: true, // 即使加载失败也设置为true以隐藏loading
                                  }));
                                }}
                              />

                              <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-5 w-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFrame(frame);
                                  }}
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Time overlay */}
                              <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[10px] py-0.5 px-1 font-mono text-center backdrop-blur-[1px]">
                                {frame.timestamp}ms
                              </div>

                              {/* Candidate Indicator */}
                              {isCandidate && (
                                <div
                                  className={`absolute left-1 bottom-5 bg-white/95 text-[10px] px-1.5 py-0.5 rounded-sm z-20 flex items-center gap-1 ${
                                    color === "blue"
                                      ? "text-cyan-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>候选</span>
                                </div>
                              )}

                              {/* Selected Indicator */}
                              {isSelected && (
                                <div className="absolute top-1 left-1 bg-white rounded-full shadow-sm z-20 p-0.5">
                                  <CheckCircle2
                                    className={`w-4 h-4 ${
                                      color === "blue"
                                        ? "text-blue-600"
                                        : "text-orange-600"
                                    }`}
                                    fill="white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          // 占位div，保持布局
                          <div
                            className="shrink-0"
                            style={{
                              width: `${itemWidth}px`,
                              height: `${containerHeight || 100}px`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Button */}
          {frames.length > 0 && (
            <button
              onClick={handleNextPage}
              disabled={!canScrollRight}
              className="ml-1 shrink-0 w-8 h-8 rounded-full  backdrop-blur-sm border border-border shadow-lg transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              title="向右滚动"
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-110" />
            </button>
          )}
        </div>

        <Timeline />
      </div>

      {previewFrame && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200 bg-black/20 backdrop-blur-lg">
          <div
            className="absolute inset-0"
            onClick={() => setPreviewFrame(null)}
          />

          <div
            className="relative flex flex-col items-center justify-center"
            onClick={() => setPreviewFrame(null)}
          >
            <div className="flex-1 flex items-center gap-12">
              <button
                onClick={handlePreviewPrev}
                disabled={previewIndex === 0}
                className="ml-1 shrink-0 w-10 h-10 rounded-full   border border-border shadow-lg transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              >
                <ChevronLeft className="w-8 h-8 drop-shadow-md" />
              </button>
              <img
                src={previewFrame.url}
                alt={`Frame ${previewFrame.timestamp}`}
                className="items-center justify-center object-contain rounded-lg w-[35vh]"
                draggable={false}
              />

              <button
                onClick={handlePreviewNext}
                disabled={previewIndex === frames.length - 1}
                className="ml-1 shrink-0 w-10 h-10 rounded-full   border border-border shadow-lg transition-all duration-200 flex items-center justify-center text-foreground/70 hover:text-foreground group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90"
              >
                <ChevronRight className="w-8 h-8 drop-shadow-md" />
              </button>
            </div>

            <div className="pointer-events-auto mt-6 w-full flex justify-center">
              <div className="backdrop-blur-xl border border-white/10 rounded-[22px] py-2 px-6 shadow-2xl flex items-center justify-between gap-8 text-white">
                <div className="flex flex-col">
                  <span className="text-xs tracking-wider uppercase flex items-center gap-1 ">
                    <Film className="w-4 h-4" /> 时间戳
                  </span>
                  <span className="text-sm font-medium  mt-0.5">
                    {previewFrame.timestamp}
                    <span className="text-sm text-white/50 ml-1">ms</span>
                  </span>
                </div>

                <div className="h-8 w-px bg-white/10"></div>

                <div className="text-sm font-mono ">
                  <span className="font-bold">{previewIndex + 1}</span>{" "}
                  <span>/</span> {frames.length}
                </div>

                <div className="h-8 w-px bg-white/10"></div>

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
        </div>
      )}
    </>
  );
}
