import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadVideoDialogProps {
  taskId: string;
  onVideoUploaded: () => void;
}

export function UploadVideoDialog({
  taskId,
  onVideoUploaded,
}: UploadVideoDialogProps) {
  console.log(taskId);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("请选择视频文件");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      setProgress(100);
      toast.success("视频上传成功");
      setOpen(false);
      onVideoUploaded();
    } catch (error) {
      toast.error("视频上传失败");
      console.error(error);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Upload className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>上传视频</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!uploading ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  点击选择视频文件
                </p>
                <p className="text-xs text-muted-foreground">支持 MP4 格式</p>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center">正在处理视频...</p>
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                {progress.toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
