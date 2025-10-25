import { Clock, Film, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

interface Video {
  id: string;
  filename: string;
  status: VideoStatus;
  duration: number;
  fps: number;
  totalFrames: number;
}

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelect: () => void;
}

export default function VideoCard({
  video,
  isSelected,
  onSelect,
}: VideoCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return {
          text: "已完成",
          className:
            "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
        };
      case "PROCESSING":
        return {
          text: "处理中",
          className:
            "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700",
          icon: <Film className="h-3.5 w-3.5" />,
        };
      case "PENDING":
        return {
          text: "待处理",
          className:
            "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-300 dark:border-slate-600",
          icon: <Clock className="h-3.5 w-3.5" />,
        };
      default:
        return { text: "", className: "", icon: null };
    }
  };

  const statusBadge = getStatusBadge(video.status);
  const minutes = Math.floor(video.duration / 60);
  const seconds = video.duration % 60;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-lg border transition-all duration-200 p-3",
        isSelected
          ? "border-primary  dark:bg-purple-900/20  shadow-md"
          : "border-gray-200  bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Video Info */}
        <div className="flex-1 min-w-0">
          {/* Video Name */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {video.filename}
          </h3>

          {/* Duration and Total Frames */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
              <span className="ml-2 text-gray-500 dark:text-slate-500">•</span>
              <span className="ml-2">{video.totalFrames} 图片</span>
            </div>
          </div>
        </div>

        {/* Right: Status and Frame Rate */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap",
              statusBadge.className,
            )}
          >
            {statusBadge.icon}
            <span>{statusBadge.text}</span>
          </div>

          {/* Frame Rate */}
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-slate-400">
            <Film className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{video.fps} fps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
