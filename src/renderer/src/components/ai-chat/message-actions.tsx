import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Share,
  Bookmark,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface MessageActionsProps {
  content: string;
  messageId;
  isAssistant?: boolean;
  onRegenerate?: () => void;
}

export function MessageActions({
  content,
  messageId,
  isAssistant = false,
  onRegenerate,
}: MessageActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("消息已复制到剪贴板");
    } catch (error) {
      toast.error("复制失败", error || "");
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
    toast.success(isLiked ? "取消点赞" : "已点赞");
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
    toast.success(isDisliked ? "取消点踩" : "已点踩");
  };

  const handleShare = () => {
    // Implement share functionality
    toast.success("分享功能开发中", messageId);
  };

  const handleBookmark = () => {
    // Implement bookmark functionality
    toast.success("收藏功能开发中", messageId);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0"
      >
        <Copy className="h-3 w-3" />
      </Button>

      {isAssistant && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`h-7 w-7 p-0 ${isLiked ? "text-green-600" : ""}`}
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            className={`h-7 w-7 p-0 ${isDisliked ? "text-red-600" : ""}`}
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>

          {onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-7 w-7 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            分享消息
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBookmark}>
            <Bookmark className="h-4 w-4 mr-2" />
            收藏消息
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
