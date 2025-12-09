import React, { useRef, useState } from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

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

  const borderColor =
    color === "blue" ? "border-blue-500" : "border-orange-500";

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 600;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            {title}
            <span className="text-[10px] font-normal normal-case text-muted-foreground/70 bg-secondary/50 px-1.5 py-0.5 rounded">
              Total: {frames.length} frames
            </span>
          </h3>
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline-block">
            Double-click image to select
          </span>
        </div>

        <div className="flex-1 min-h-0 relative group/strip bg-black/5 rounded-md border border-border/50 overflow-hidden">
          {/* Left Button - Overlay */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0 bottom-0 z-20 h-full w-10 rounded-r-md rounded-l-none bg-background/50 backdrop-blur-[2px] hover:bg-background/80 border-r border-border/20 text-muted-foreground hover:text-foreground transition-all disabled:opacity-0"
            onClick={() => scroll("left")}
            disabled={frames.length === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* List */}
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-x-auto scrollbar-thin px-12 py-1 scroll-smooth flex gap-2 items-center"
          >
            {frames.length === 0 ? (
              <div className="w-full flex items-center justify-center text-xs text-muted-foreground italic h-full">
                No frames available
              </div>
            ) : (
              frames.map((frame) => {
                const isSelected = selectedFrameId === frame.id;

                return (
                  <div
                    key={frame.id}
                    className={`relative group shrink-0 transition-all duration-200 select-none h-full py-1 ${
                      isSelected ? "z-10" : ""
                    }`}
                  >
                    <div
                      className={`relative overflow-hidden border shadow-sm bg-black transition-all flex items-center justify-center rounded-sm h-full w-auto ${
                        isSelected
                          ? `${borderColor} ring-2 ring-offset-0 ${color === "blue" ? "ring-blue-500/50" : "ring-orange-500/50"}`
                          : "border-transparent hover:border-primary/30"
                      }`}
                    >
                      {/* Image - Height fills container, width auto adapts. Uses 'url' from API instead of 'imageUrl' */}
                      <img
                        src={frame.url}
                        alt={`Time ${frame.timestamp}`}
                        className="h-full w-auto block max-w-none object-contain bg-black/20"
                        draggable={false}
                        onDoubleClick={() => onFrameDoubleClick(frame)}
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6 rounded shadow-sm opacity-90 hover:opacity-100"
                          title="Preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFrame(frame);
                          }}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Time overlay */}
                      <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[10px] py-0.5 px-1 font-mono text-center backdrop-blur-[1px]">
                        {frame.timestamp.toFixed(2)}s
                      </div>

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

          {/* Right Button - Overlay */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 bottom-0 z-20 h-full w-10 rounded-l-md rounded-r-none bg-background/50 backdrop-blur-[2px] hover:bg-background/80 border-l border-border/20 text-muted-foreground hover:text-foreground transition-all disabled:opacity-0"
            onClick={() => scroll("right")}
            disabled={frames.length === 0}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFrame}
        onOpenChange={(open) => !open && setPreviewFrame(null)}
      >
        <DialogContent className="max-w-[95vw] w-fit p-0 overflow-hidden bg-black/95 border-none shadow-2xl">
          <DialogClose
            onClick={() => setPreviewFrame(null)}
            className="text-white/70 hover:text-white z-50 bg-black/20 rounded-full p-1 m-2"
          />
          {previewFrame && (
            <div className="relative flex flex-col items-center justify-center h-[85vh] w-full p-2">
              <img
                src={previewFrame.url}
                alt={`Frame at ${previewFrame.timestamp}s`}
                className="flex-1 w-auto h-auto max-w-full max-h-full object-contain"
              />
              <div className="mt-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-mono backdrop-blur-md border border-white/10">
                Timestamp: {previewFrame.timestamp.toFixed(3)}s
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
