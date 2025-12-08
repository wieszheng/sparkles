import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, files: FileList) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [taskName, setTaskName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && selectedFiles && selectedFiles.length > 0) {
      onCreate(taskName, selectedFiles);
      setTaskName("");
      setSelectedFiles(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md w-[90vw] glass-effect border-border/50 shadow-2xl mx-4">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </motion.div>
                <DialogTitle className="text-lg sm:text-xl">创建新的分析任务</DialogTitle>
              </motion.div>
              <DialogDescription className="text-sm">
                创建任务并上传视频，开始分析应用延迟性能
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="task-name" className="text-sm font-medium">
                  任务名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-name"
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="例如：Android应用冷启动测试"
                  autoFocus
                  required
                  className="border-border/50 h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">上传视频</Label>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all",
                    selectedFiles
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-border/50 hover:border-primary/50 hover:bg-primary/5",
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />

                  {selectedFiles ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center text-emerald-700"
                    >
                      <FileVideo className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm">
                        已选择 {selectedFiles.length} 个文件
                      </p>
                      <p className="text-xs opacity-75 mt-1">点击重新选择</p>
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="font-medium text-sm">
                        点击选择视频文件
                      </p>
                      <p className="text-xs opacity-60 mt-1">支持 MP4, MOV, WebM</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </form>

            <DialogFooter className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                取消
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!taskName.trim() || !selectedFiles}
                  onClick={handleSubmit}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">创建任务</span>
                  <span className="sm:hidden">创建</span>
                </Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
