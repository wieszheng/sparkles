import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
  CheckCircle2,
} from "lucide-react";

interface FrameListOptimizedProps {
  frames: Frame[];
  selectedFrame: number | null;
  onFrameSelect: (index: number) => void;
  frameType: "first" | "last";
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (direction: "left" | "right") => void;
  onNavigationClick: (
    e: React.MouseEvent<HTMLDivElement>,
    ref: React.RefObject<HTMLDivElement | null>,
    totalFrames?: number,
  ) => void;
  isLoading?: boolean;
}

// 图片懒加载组件
// eslint-disable-next-line react/display-name
const LazyImage = memo(
  ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className: string;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={imgRef} className={className}>
        {isVisible && (
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
          />
        )}
        {!isLoaded && isVisible && (
          <div className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  },
);

// 虚拟化帧列表 - 只渲染可见区域的帧
const VirtualizedFrameList: React.FC<FrameListOptimizedProps> = ({
  frames,
  selectedFrame,
  onFrameSelect,
  frameType,

  isLoading = false,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 放大查看状态
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [currentZoomFrame, setCurrentZoomFrame] = useState<Frame | null>(null);
  const [currentZoomIndex, setCurrentZoomIndex] = useState<number>(0);

  // 内部滚动处理函数
  const handleScroll = useCallback((direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        containerRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  }, []);

  // 内部导航条点击处理函数
  const handleNavigationBarClick = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      ref: React.RefObject<HTMLDivElement | null>,
      totalFrames?: number,
    ) => {
      console.log(totalFrames);
      if (ref.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width)); // 限制在0-1范围内
        const { scrollWidth, clientWidth } = ref.current;
        const maxScroll = scrollWidth - clientWidth;
        const targetScroll = maxScroll * percentage;
        ref.current.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    },
    [],
  );

  // 计算可见帧范围
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const itemWidth = 120; // 使用固定值作为参考宽度，实际宽度由CSS控制

    const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - 2);
    const end = Math.min(
      frames.length,
      start + Math.ceil(containerWidth / itemWidth) + 4,
    );

    setVisibleRange({ start, end });
  }, [frames.length]);

  // 自动滚动到选中帧
  const scrollToSelectedFrame = useCallback(() => {
    if (selectedFrame === null || !containerRef.current) return;

    const container = containerRef.current;
    const itemWidth = 120; // 使用固定值作为参考宽度，实际宽度由CSS控制
    const containerWidth = container.clientWidth;

    // 计算选中帧的位置
    const targetScrollLeft =
      selectedFrame * itemWidth - containerWidth / 2 + itemWidth / 2;

    // 限制滚动范围
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const clampedScrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, targetScrollLeft),
    );

    container.scrollTo({ left: clampedScrollLeft, behavior: "smooth" });
  }, [selectedFrame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateVisibleRange();

    const handleScroll = () => {
      updateVisibleRange();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateVisibleRange]);

  // 当选中帧变化时，自动滚动到该帧
  useEffect(() => {
    if (selectedFrame !== null) {
      scrollToSelectedFrame();
    }
  }, [selectedFrame, scrollToSelectedFrame]);

  // 放大查看处理函数
  const handleZoomIn = useCallback((frame: Frame, index: number) => {
    setCurrentZoomFrame(frame);
    setCurrentZoomIndex(index);
    setIsZoomOpen(true);
  }, []);

  // 放大查看中切换帧
  const handleZoomNavigation = useCallback(
    (direction: "prev" | "next") => {
      if (!currentZoomFrame) return;

      const newIndex =
        direction === "prev" ? currentZoomIndex - 1 : currentZoomIndex + 1;

      // 边界检查
      if (newIndex >= 0 && newIndex < frames.length) {
        const frame = frames[newIndex];
        setCurrentZoomFrame(frame);
        setCurrentZoomIndex(newIndex);
      }
    },
    [currentZoomFrame, currentZoomIndex, frames],
  );

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomOpen) return;

      switch (e.key) {
        case "Escape":
          setIsZoomOpen(false);
          break;
        case "ArrowLeft":
          handleZoomNavigation("prev");
          break;
        case "ArrowRight":
          handleZoomNavigation("next");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isZoomOpen, handleZoomNavigation]);

  // 渲染可见帧
  const renderVisibleFrames = () => {
    const visibleFrames = frames.slice(visibleRange.start, visibleRange.end);

    return visibleFrames.map((frame, index) => {
      const globalIndex = visibleRange.start + index;

      return (
        <div
          key={frame.id}
          className="cursor-pointer transition-all flex-shrink-0 h-full group relative w-32"
          onClick={() => onFrameSelect(globalIndex)}
        >
          <div
            className={`relative h-full bg-muted/30 rounded overflow-hidden transition-all duration-200 ${
              selectedFrame === globalIndex
                ? "ring-2 ring-primary"
                : "hover:ring-1 hover:ring-primary/50"
            }`}
          >
            <LazyImage
              src={frame.url}
              alt={`帧 ${frame.frame_index}`}
              className="h-full w-auto object-contain"
            />

            {/* 底部信息蒙层 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-3 pb-1 px-2 pointer-events-none">
              <p className="text-xs font-medium text-white text-center">
                帧 {frame.frame_index}
              </p>
              <p className="text-xs text-white/90 text-center">
                {frame.timestamp.toFixed(2)}ms
              </p>
            </div>

            {/* Hover 放大镜效果 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div
                className="p-3 bg-white/10 rounded-full backdrop-blur-sm cursor-zoom-in pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn(frame, globalIndex);
                }}
              >
                <ZoomIn className="h-8 w-8" />
              </div>
            </div>

            {/* 当前选中标记 */}
            {selectedFrame === globalIndex && (
              <Badge className="absolute top-0.5 right-0.5 text-xs pointer-events-none">
                {frameType === "first" ? "首帧" : "尾帧"}
              </Badge>
            )}
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 flex-1 min-h-0">
          <Button
            variant="outline"
            size="icon"
            disabled
            className="flex-shrink-0 rounded-full opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 h-full flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center text-muted-foreground">
              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-sm">加载帧数据中...</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled
            className="flex-shrink-0 rounded-full opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* 导航条 - 禁用状态 */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-shrink-0" style={{ width: "35px" }} />
          <div className="flex-1">
            <div className="relative h-2 bg-muted/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex-shrink-0" style={{ width: "35px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 flex-1 min-h-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleScroll("left")}
          className="hover:bg-accent flex-shrink-0 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div
          ref={containerRef}
          className="flex-1 h-full overflow-x-auto overflow-y-hidden hide-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div
            className="flex gap-2 p-4 h-full"
            style={{
              width: `${frames.length * 120}px`, // 总宽度（使用固定值计算，实际由CSS控制）
              minWidth: "100%",
            }}
          >
            {/* 左侧占位 */}
            <div
              style={{ width: `${visibleRange.start * 120}px`, minWidth: 0 }}
            />

            {/* 渲染可见帧 */}
            {renderVisibleFrames()}

            {/* 右侧占位 */}
            <div
              style={{
                width: `${Math.max(0, (frames.length - visibleRange.end) * 120)}px`,
                minWidth: 0,
              }}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleScroll("right")}
          className="hover:bg-accent flex-shrink-0 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 导航条 */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-shrink-0" style={{ width: "35px" }} />
        <div className="flex-1">
          <div
            className="relative h-2 bg-muted overflow-hidden cursor-pointer transition-all"
            onClick={(e) =>
              handleNavigationBarClick(e, containerRef, frames.length)
            }
          >
            {selectedFrame !== null && (
              <div
                className="absolute top-2 -translate-y-1/2 w-2 h-3 bg-primary rounded-full border-1 border-background shadow-md transition-all duration-300"
                style={{
                  left:
                    frames.length > 1
                      ? `${(selectedFrame / (frames.length - 1)) * 100}%`
                      : "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>
        </div>
        <div className="flex-shrink-0" style={{ width: "35px" }} />
      </div>

      {/* 放大查看模态框 */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-card border-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>帧 {currentZoomFrame?.frame_index ?? 0}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full min-h-0">
            {/* 图片显示区域 - 包含左右导航按钮 */}
            <div className="flex-1 flex items-center justify-center bg-muted/10 relative min-h-0">
              {/* 左侧导航按钮 */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleZoomNavigation("prev")}
                  disabled={currentZoomIndex <= 0}
                  className="rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <LeftIcon className="h-6 w-6" />
                </Button>
              </div>

              {/* 图片显示 */}
              <div className="flex-1 flex items-center justify-center h-full max-h-full overflow-hidden">
                {currentZoomFrame && (
                  <img
                    src={currentZoomFrame.url}
                    alt={`帧 ${currentZoomFrame.frame_index}`}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: "calc(90vh - 180px)" }}
                  />
                )}
              </div>

              {/* 右侧导航按钮 */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleZoomNavigation("next")}
                  disabled={currentZoomIndex >= frames.length - 1}
                  className="rounded-full h-12 w-12 bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <RightIcon className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  onFrameSelect(currentZoomIndex);
                  setIsZoomOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {frameType === "first" ? "设为首帧" : "设为尾帧"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { VirtualizedFrameList as FrameListOptimized };
