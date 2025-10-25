import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CanvasSelector } from "./canvas-selector";
import { Loader2 } from "lucide-react";

interface SelectionArea {
  id: string;
  x: number; // 原始图片上的坐标
  y: number; // 原始图片上的坐标
  width: number; // 原始图片上的宽度
  height: number; // 原始图片上的高度
  label?: string;
}
interface CanvasSelectorDialogProps {
  value?: string; // 保存的模板ID或key
  onChange: (templateId: string) => void; // 返回模板ID或key
  children: React.ReactNode;
  connectKey: string;
}

export function CanvasSelectorDialog({
  value,
  onChange,
  children,
  connectKey,
}: CanvasSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [loading, setLoading] = useState(false);
  // const { getScreenshot } = useBackendAPI();

  // 打开对话框时获取图片
  const handleOpenChange = async (open: boolean) => {
    console.log(value);
    setOpen(open);
    if (open) {
      setLoading(true);
      try {
        // 从后端获取最新截图
        const screenshot = await window.api.screencap(connectKey);
        if (screenshot) {
          setImageSrc(`data:image/png;base64,${screenshot}`);
        }
      } catch (error) {
        console.error("获取截图失败:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const [selectedAreas, setSelectedAreas] = useState<SelectionArea[]>([]);

  const handleSelectionChange = (selections: SelectionArea[]) => {
    setSelectedAreas(selections);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!imageSrc || selectedAreas.length === 0) return;

    setIsSaving(true);
    try {
      // 直接使用已有的imageSrc数据（已经是base64格式）
      const imageData = imageSrc.replace(/^data:image\/png;base64,/, "");

      // 调用后端API保存模板
      const templateId = await window.api.callApi("POST", "/api/saveTemplate", {
        imageData: imageData,
        selections: selectedAreas.map((s) => ({
          id: s.id,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          label: s.label,
        })),
      });

      // 返回模板ID给父组件
      onChange(templateId);
      setOpen(false);
    } catch (error) {
      console.error("保存模板失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl overflow-hidden flex flex-col bg-card">
        <DialogTitle>选择器</DialogTitle>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">正在获取屏幕截图...</p>
          </div>
        ) : (
          <CanvasSelector
            imageSrc={imageSrc}
            onSelectionChange={handleSelectionChange}
            allowMultipleSelections={false}
          />
        )}

        <div className="flex justify-end gap-2 ">
          <Button size="sm" onClick={() => setOpen(false)} variant="outline">
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selectedAreas.length === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "确认选择"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
