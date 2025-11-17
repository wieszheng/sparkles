import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Frame {
  id: number;
  frame_index: number;
  timestamp: number;
  url: string;
}

interface VirtualizedFrameListProps {
  frames: Frame[];
  selectedFrame: number | null;
  onFrameSelect: (index: number) => void;
  frameType: 'first' | 'last';
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (direction: 'left' | 'right') => void;
  onNavigationClick: (e: React.MouseEvent<HTMLDivElement>, totalFrames?: number) => void;
}

// 图片懒加载组件
const LazyImage = memo(({ src, alt, className }: { src: string; alt: string; className: string }) => {
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
      { threshold: 0.1 }
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
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
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
});

// 单个帧项组件
const FrameItem = memo(({ 
  frame, 
  index, 
  selectedFrame, 
  onFrameSelect, 
  frameType 
}: { 
  frame: Frame; 
  index: number; 
  selectedFrame: number | null; 
  onFrameSelect: (index: number) => void; 
  frameType: 'first' | 'last'; 
}) => {
  const handleClick = useCallback(() => {
    onFrameSelect(index);
  }, [index, onFrameSelect]);

  return (
    <div
      className="cursor-pointer transition-all flex-shrink-0 h-full group relative"
      onClick={handleClick}
    >
      <div
        className={`relative h-full bg-muted/30 rounded overflow-hidden transition-all duration-200 ${
          selectedFrame === index
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
          <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm cursor-zoom-in pointer-events-auto">
            <ZoomIn className="h-8 w-8" />
          </div>
        </div>

        {/* 当前选中标记 */}
        {selectedFrame === index && (
          <Badge className="absolute top-0.5 right-0.5 text-xs pointer-events-none">
            {frameType === 'first' ? '首帧' : '尾帧'}
          </Badge>
        )}
      </div>
    </div>
  );
});

// 虚拟化帧列表组件
export const VirtualizedFrameList: React.FC<VirtualizedFrameListProps> = ({
  frames,
  selectedFrame,
  onFrameSelect,
  frameType,
  scrollRef,
  onScroll,
  onNavigationClick,
}) => {
  const itemWidth = 120; // 每个帧项的宽度
  const containerWidth = 800; // 容器宽度

  // 虚拟化列表渲染
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const frame = frames[index];
    if (!frame) return null;

    return (
      <div style={style} className="flex-shrink-0">
        <FrameItem
          frame={frame}
          index={index}
          selectedFrame={selectedFrame}
          onFrameSelect={onFrameSelect}
          frameType={frameType}
        />
      </div>
    );
  }, [frames, selectedFrame, onFrameSelect, frameType]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 flex-1 min-h-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onScroll('left')}
          className="hover:bg-accent flex-shrink-0 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div
          ref={scrollRef}
          className="flex-1 h-full overflow-hidden"
        >
          {frames.length > 0 && (
            <List
              height={200} // 容器高度
              itemCount={frames.length}
              itemSize={itemWidth}
              layout="horizontal"
              width={containerWidth}
              className="hide-scrollbar"
            >
              {Row}
            </List>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onScroll('right')}
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
            onClick={(e) => onNavigationClick(e)}
          >
            {selectedFrame !== null && (
              <div
                className="absolute top-2 -translate-y-1/2 w-2 h-3 bg-primary rounded-full border-1 border-background shadow-md transition-all duration-300"
                style={{
                  left: frames.length > 1
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
    </div>
  );
};