import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  Menu,
  Play,
  Power,
  Square,
  Image as ImageIcon,
  Download,
  Trash2,
  Check,
  X,
  Layers,
  Eye,
  GripVertical,
  ArrowUpDown,
  Copy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

interface ScreenshotItem {
  id: string;
  url: string;
  timestamp: Date;
  deviceName: string;
}

interface StitchConfig {
  direction: "horizontal" | "vertical";
  spacing: number;
  backgroundColor: string;
}

export function Toolbar({ selectedDevice }: { selectedDevice: string }) {
  const { theme } = useTheme();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  // 截图相关状态
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [selectedScreenshots, setSelectedScreenshots] = useState<Set<string>>(
    new Set(),
  );
  const [isStitching, setIsStitching] = useState(false);
  const [stitchOrder, setStitchOrder] = useState<string[]>([]);
  const [stitchConfig, setStitchConfig] = useState<StitchConfig>({
    direction: "horizontal",
    spacing: 90,
    backgroundColor: "#ffffff",
  });
  const [stitchedImage, setStitchedImage] = useState<string | null>(null);
  const [showStitchPreview, setShowStitchPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSinglePreview, setShowSinglePreview] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const setLoading = (commandId: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [commandId]: loading }));
  };

  const handleScreenshot = async () => {
    if (!selectedDevice) {
      toast.error("请选择设备");
      return;
    }
    setLoading("screenshot", true);
    try {
      const result = await window.api.screencap(selectedDevice, false);
      console.log("result", result);
      // 直接使用API返回的base64图片数据
      if (result) {
        const newScreenshot: ScreenshotItem = {
          id: `screenshot-${Date.now()}`,
          url: `data:image/png;base64,${result}`,
          timestamp: new Date(),
          deviceName: selectedDevice,
        };

        // 新截图插入到列表前面，确保最新的截图在最前面
        // 使用排序确保时间戳倒序，最新的在前
        setScreenshots((prev) => {
          const newList = [newScreenshot, ...prev];
          return newList.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
          );
        });
        toast.success("截图成功");
      } else {
        toast.error("截图数据获取失败");
      }
    } catch (error) {
      toast.error("截图失败", error || "");
    } finally {
      setLoading("screenshot", false);
    }
  };

  const handleStartRecording = async () => {
    if (!selectedDevice) {
      toast.error("请选择设备");
      return;
    }
    if (isRecording) {
      toast.error("请先停止录制");
      return;
    }
    setLoading("recording", true);
    try {
      setIsRecording(true);
      await window.api.hdcCommand("start-screen-recording", selectedDevice);

      setRecordingTime(0);
    } catch (error) {
      toast.error("开始录制失败", error || "");
    } finally {
      setLoading("recording", false);
    }
  };

  const handleStopRecording = async () => {
    setLoading("recording", true);
    try {
      setIsRecording(false);
      setRecordingTime(0);

      await window.api.hdcCommand("stop-screen-recording", selectedDevice);
      toast.success("录制已停止并导出");
    } catch (error) {
      toast.error("停止录制失败", error || "");
    } finally {
      setLoading("recording", false);
    }
  };

  const handleBack = async () => {
    setLoading("back", true);
    try {
      console.log("Back command executed");
      await window.api.hdcCommand("go-back", selectedDevice);
      toast.success("返回操作完成");
    } catch (error) {
      toast.error("返回操作失败", error || "");
    } finally {
      setLoading("back", false);
    }
  };

  const handleHome = async () => {
    setLoading("home", true);
    try {
      console.log("Navigate to home");
      await window.api.hdcCommand("go-home", selectedDevice);
      toast.success("已返回主页");
    } catch (error) {
      toast.error("返回主页失败", error || "");
    } finally {
      setLoading("home", false);
    }
  };

  const handleMenu = async () => {
    setLoading("menu", true);
    try {
      console.log("Open menu");
      toast.success("菜单已打开");
    } catch (error) {
      toast.error("打开菜单失败", error || "");
    } finally {
      setLoading("menu", false);
    }
  };

  const handlePower = async () => {
    setLoading("power", true);
    try {
      console.log("Power control");
      toast.success("电源操作完成");
    } catch (error) {
      toast.error("电源操作失败", error || "");
    } finally {
      setLoading("power", false);
    }
  };

  const nextCommand = () => {
    setDirection(1);
    setCurrentCommandIndex((prev) => (prev + 1) % commandCards.length);
  };

  const prevCommand = () => {
    setDirection(-1);
    setCurrentCommandIndex(
      (prev) => (prev - 1 + commandCards.length) % commandCards.length,
    );
  };

  // 截图选择相关函数
  const toggleScreenshotSelection = (id: string) => {
    setSelectedScreenshots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllScreenshots = () => {
    if (
      selectedScreenshots.size === screenshots.length &&
      screenshots.length > 0
    ) {
      setSelectedScreenshots(new Set());
    } else {
      setSelectedScreenshots(new Set(screenshots.map((s) => s.id)));
    }
  };

  const deleteScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
    setSelectedScreenshots((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success("截图已删除");
  };

  const copyScreenshot = async (screenshot: ScreenshotItem) => {
    try {
      // 从data URL中提取base64数据
      const base64Data = screenshot.url.split(",")[1];

      // 将base64转换为二进制数据
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 创建Blob对象
      const blob = new Blob([bytes], { type: "image/png" });

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      toast.success("已复制");
    } catch (error) {
      console.error("复制失败:", error);
      // 如果方法1失败，尝试方法2：创建一个临时的canvas
      try {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(async (blob) => {
              if (blob) {
                await navigator.clipboard.write([
                  new ClipboardItem({
                    "image/png": blob,
                  }),
                ]);
                toast.success("截图已复制到剪贴板");
              }
            }, "image/png");
          }
        };
        img.src = screenshot.url;
      } catch (fallbackError) {
        console.error("备用方法也失败:", fallbackError);
        toast.error("复制失败，请重试");
      }
    }
  };

  const clearAllScreenshots = () => {
    if (confirm("确定要删除所有截图吗？")) {
      setScreenshots([]);
      setSelectedScreenshots(new Set());
      toast.success("所有截图已删除");
    }
  };

  // 图片拼接函数
  const stitchImages = async () => {
    if (selectedScreenshots.size === 0) {
      toast.error("请至少选择一张截图");
      return;
    }

    setIsStitching(true);
    try {
      // 按照stitchOrder排序，如果stitchOrder为空则使用原始顺序
      const selectedIds =
        stitchOrder.length > 0 ? stitchOrder : Array.from(selectedScreenshots);
      const selectedImages = selectedIds
        .map((id) => screenshots.find((s) => s.id === id))
        .filter((screenshot): screenshot is ScreenshotItem =>
          Boolean(screenshot),
        );

      // 创建canvas进行图片拼接
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建canvas上下文");

      const images = await Promise.all(
        selectedImages.map(async (screenshot) => {
          const img = new Image();
          img.src = screenshot.url;
          await new Promise((resolve) => (img.onload = resolve));
          return img;
        }),
      );

      // 计算画布尺寸
      if (stitchConfig.direction === "horizontal") {
        canvas.width = images.reduce(
          (sum, img) => sum + img.width + stitchConfig.spacing,
          -stitchConfig.spacing,
        );
        canvas.height = Math.max(...images.map((img) => img.height));
      } else {
        canvas.width = Math.max(...images.map((img) => img.width));
        canvas.height = images.reduce(
          (sum, img) => sum + img.height + stitchConfig.spacing,
          -stitchConfig.spacing,
        );
      }

      // 设置背景色
      ctx.fillStyle = stitchConfig.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制图片
      let offsetX = 0;
      let offsetY = 0;

      images.forEach((img, index) => {
        if (stitchConfig.direction === "horizontal") {
          ctx.drawImage(img, offsetX, 0);
          offsetX +=
            img.width + (index < images.length - 1 ? stitchConfig.spacing : 0);
        } else {
          ctx.drawImage(img, 0, offsetY);
          offsetY +=
            img.height + (index < images.length - 1 ? stitchConfig.spacing : 0);
        }
      });

      // 转换为base64
      const dataUrl = canvas.toDataURL("image/png");
      setStitchedImage(dataUrl);
      setShowStitchPreview(true);
      toast.success("图片拼接成功");
    } catch (error) {
      toast.error("图片拼接失败：" + (error as Error).message);
    } finally {
      setIsStitching(false);
    }
  };

  const downloadStitchedImage = () => {
    if (!stitchedImage) return;

    const link = document.createElement("a");
    link.download = `stitched-${Date.now()}.png`;
    link.href = stitchedImage;
    link.click();
    toast.success("拼接图片已下载");
  };

  // 单图预览函数
  const showSingleImagePreview = (screenshot: ScreenshotItem) => {
    setPreviewImage(screenshot.url);
    setShowSinglePreview(true);
  };

  const downloadSingleImage = () => {
    if (!previewImage) return;

    const link = document.createElement("a");
    link.download = `screenshot-${Date.now()}.png`;
    link.href = previewImage;
    link.click();
    toast.success("截图已下载");
  };

  const commandCards = [
    {
      id: "screenshot",
      title: "立即截图",
      description: "捕获当前屏幕画面",
      icon: Camera,
      action: handleScreenshot,
      type: "primary" as const,
    },
    {
      id: "recording",
      title: isRecording ? "停止录制" : "开始录制",
      description: isRecording
        ? `录制中 ${formatTime(recordingTime)}`
        : "开始屏幕录制",
      icon: isRecording ? Square : Play,
      action: isRecording ? handleStopRecording : handleStartRecording,
      type: isRecording ? ("destructive" as const) : ("primary" as const),
    },
    {
      id: "back",
      title: "返回",
      description: "返回上一页面",
      icon: ArrowLeft,
      action: handleBack,
      type: "secondary" as const,
    },
    {
      id: "home",
      title: "主页",
      description: "返回主页面",
      icon: Home,
      action: handleHome,
      type: "secondary" as const,
    },
    {
      id: "menu",
      title: "菜单",
      description: "打开系统菜单",
      icon: Menu,
      action: handleMenu,
      type: "secondary" as const,
    },
    {
      id: "power",
      title: "电源",
      description: "设备电源控制",
      icon: Power,
      action: handlePower,
      type: "secondary" as const,
    },
  ];

  const currentCard = commandCards[currentCommandIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // 渲染截图历史列表
  const renderScreenshotHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.2 }}
      className="h-[calc(100vh-428px)] flex flex-col space-y-4"
    >
      {/* 截图列表头部和工具栏合并一行 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* 左侧：标题、全选、统计信息 */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold ml-1">
            {screenshots.length > 0 && "全选"}
          </h3>
          {screenshots.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedScreenshots.size === screenshots.length &&
                  screenshots.length > 0
                }
                onCheckedChange={selectAllScreenshots}
              />
              <Badge variant="secondary">{screenshots.length}</Badge>
              {selectedScreenshots.size > 0 && (
                <Badge variant="default">
                  已选择 {selectedScreenshots.size} 张
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* 中间：拼接工具栏 */}
        {screenshots.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">方向:</label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${stitchConfig.direction === "vertical" ? "font-medium" : "text-muted-foreground"}`}
                >
                  纵向
                </span>
                <Switch
                  checked={stitchConfig.direction === "horizontal"}
                  onCheckedChange={(checked) =>
                    setStitchConfig((prev) => ({
                      ...prev,
                      direction: checked ? "horizontal" : "vertical",
                    }))
                  }
                />
                <span
                  className={`text-sm ${stitchConfig.direction === "horizontal" ? "font-medium" : "text-muted-foreground"}`}
                >
                  横向
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">间距:</label>
              <input
                type="number"
                min="1"
                max="500"
                value={stitchConfig.spacing}
                onChange={(e) =>
                  setStitchConfig((prev) => ({
                    ...prev,
                    spacing: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-16 px-2 py-1 text-sm border rounded"
              />
            </div>
          </div>
        )}

        {/* 右侧：控制按钮 */}
        <div className="flex items-center gap-1">
          {screenshots.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllScreenshots}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {selectedScreenshots.size > 1 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4" />
                  排序
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-100" align="end">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    拼接顺序（拖拽调整）
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {Array.from(selectedScreenshots).map((id, index) => {
                      const screenshot = screenshots.find((s) => s.id === id);
                      if (!screenshot) return null;
                      return (
                        <div
                          key={id}
                          className="flex-shrink-0 w-22 h-24 bg-muted/50 rounded-lg border relative group cursor-move"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "text/plain",
                              index.toString(),
                            );
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "border-primary",
                              "bg-primary/10",
                            );
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10",
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-primary",
                              "bg-primary/10",
                            );
                            const dragIndex = parseInt(
                              e.dataTransfer.getData("text/plain"),
                            );
                            const selectedIds = Array.from(selectedScreenshots);
                            if (dragIndex !== index) {
                              const [movedItem] = selectedIds.splice(
                                dragIndex,
                                1,
                              );
                              selectedIds.splice(index, 0, movedItem);
                              setSelectedScreenshots(new Set(selectedIds));
                              setStitchOrder(selectedIds);
                            }
                          }}
                        >
                          <img
                            src={screenshot.url}
                            alt="截图"
                            className="w-full h-full object-contain p-1 rounded"
                          />
                          <div className="absolute top-1 left-1 bg-primary rounded text-primary-foreground text-xs w-4 h-4 flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div className="absolute top-1 right-1">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {screenshots.length > 0 && (
            <Button
              size="sm"
              onClick={stitchImages}
              disabled={selectedScreenshots.size === 0 || isStitching}
            >
              {isStitching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  合成
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 截图横向列表 */}
      {screenshots.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-auto pb-2">
            <div className="flex gap-3 min-w-max p-1">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={screenshot.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative cursor-pointer rounded-sm transition-all flex-shrink-0 group ${
                    selectedScreenshots.has(screenshot.id)
                      ? "ring-2 ring-primary shadow-sm scale-101"
                      : "ring-1 ring-border hover:ring-primary/50"
                  }`}
                  onClick={() => toggleScreenshotSelection(screenshot.id)}
                >
                  <div className="w-36 bg-muted/50 relative overflow-hidden">
                    <img
                      src={screenshot.url}
                      alt="截图"
                      className="w-full h-full object-contain p-1 rounded-lg"
                    />
                    {selectedScreenshots.has(screenshot.id) && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-md">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    {/* 预览按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        showSingleImagePreview(screenshot);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 h-6 w-6 p-2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScreenshot(screenshot.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    {/* 复制按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-10 left-2 h-6 w-6 p-2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyScreenshot(screenshot);
                      }}
                    >
                      <Copy className="h-2.5 w-2.5 text-foreground" />
                    </Button>
                  </div>
                  {/* <div className="p-2 bg-background/80 backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground/70 text-center">
                      {new Date(screenshot.timestamp).toLocaleTimeString()}
                    </p>
                  </div> */}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {screenshots.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无截图</p>
          <p className="text-xs mt-1">点击上方截图按钮开始</p>
        </motion.div>
      )}
    </motion.div>
  );

  // 渲染单图预览
  const renderSinglePreview = () => {
    if (!showSinglePreview || !previewImage) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowSinglePreview(false)}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="rounded-lg w-full max-w-full h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            setShowSinglePreview(false);
          }}
        >
          <div className="p-3 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold ml-1">单图</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSinglePreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={previewImage}
                alt="截图预览"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
          <div className="p-3 flex-shrink-0">
            <div className="flex justify-center">
              <Button onClick={downloadSingleImage} size="sm">
                <Download className="h-4 w-4" />
                下载截图
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // 渲染拼接预览
  const renderStitchPreview = () => {
    if (!showStitchPreview || !stitchedImage) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowStitchPreview(false)}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="rounded-lg w-full max-w-full h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            setShowStitchPreview(false);
          }}
        >
          <div className="p-3 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold ml-1">预览</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStitchPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={stitchedImage}
                alt="拼接图片"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
          <div className="p-3 flex-shrink-0">
            <div className="flex justify-center">
              <Button onClick={downloadStitchedImage} size="sm">
                <Download className="h-4 w-4" />
                下载
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 命令卡片区域 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-[280px] overflow-hidden">
          {/* Navigation Arrows */}
          <motion.div
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevCommand}
                className={`h-10 w-10 rounded-full border-0 shadow-lg ${
                  theme === "light"
                    ? "bg-white/90 hover:bg-white"
                    : "bg-white/10 hover:bg-white/10"
                }`}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextCommand}
                className={`h-10 w-10 rounded-full border-0 shadow-lg ${
                  theme === "light"
                    ? "bg-white/90 hover:bg-white"
                    : "bg-white/10 hover:bg-white/10"
                }`}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>

          {/* Three Cards Layout */}
          <motion.div
            className="flex items-center justify-center px-16 py-8"
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 50) {
                prevCommand();
              } else if (info.offset.x < -50) {
                nextCommand();
              }
            }}
          >
            <div className="flex items-center space-x-4 w-full max-w-4xl">
              {/* Left Card (Previous) */}
              <motion.div
                className="flex-1 cursor-pointer"
                onClick={prevCommand}
                initial={{ x: -100, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 0.6, scale: 0.75 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.1,
                }}
                whileHover={{
                  scale: 0.8,
                  opacity: 0.8,
                  filter: "blur(0px)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.7 }}
                key={`prev-${currentCommandIndex}`}
              >
                <motion.div
                  className={`bg-card flex flex-col items-center p-4 border rounded-xl ${
                    theme === "light" ? "bg-gray-50/80" : "bg-white/5"
                  }`}
                  style={{ filter: "blur(2px)" }}
                  whileHover={{ filter: "blur(0px)" }}
                >
                  <div className="relative">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        theme === "light" ? "bg-gray-100" : "bg-white/10"
                      }`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {(() => {
                        const prevIndex =
                          (currentCommandIndex - 1 + commandCards.length) %
                          commandCards.length;
                        const PrevIcon = commandCards[prevIndex].icon;
                        return (
                          <PrevIcon className="h-6 w-6 text-muted-foreground" />
                        );
                      })()}
                    </motion.div>
                  </div>
                  <motion.h3
                    className="text-sm font-medium text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {
                      commandCards[
                        (currentCommandIndex - 1 + commandCards.length) %
                          commandCards.length
                      ].title
                    }
                  </motion.h3>
                  <motion.p
                    className="text-xs text-muted-foreground/70 text-center mt-1 line-clamp-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {
                      commandCards[
                        (currentCommandIndex - 1 + commandCards.length) %
                          commandCards.length
                      ].description
                    }
                  </motion.p>
                </motion.div>
              </motion.div>

              {/* Center Card (Current) */}
              <AnimatePresence mode="wait">
                <motion.div
                  className="flex-1"
                  key={currentCommandIndex}
                  initial={{
                    scale: 0.8,
                    opacity: 0,
                    x: direction > 0 ? 100 : -100,
                  }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{
                    scale: 0.8,
                    opacity: 0,
                    x: direction > 0 ? -100 : 100,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                    duration: 0.6,
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    className="bg-card flex flex-col items-center p-4 rounded-xl shadow-sm"
                    whileHover={{
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      borderColor: "hsl(var(--primary))",
                    }}
                  >
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                          theme === "light" ? "bg-primary/10" : "bg-primary/20"
                        }`}
                      >
                        <currentCard.icon className="h-8 w-8 text-primary" />
                      </div>
                      {isRecording && currentCard.id === "recording" && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>

                    <motion.h3
                      className="text-lx font-semibold"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {currentCard.title}
                    </motion.h3>
                    <motion.p
                      className="text-muted-foreground text-sm text-center mb-3 max-w-xs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {currentCard.description}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={currentCard.action}
                        disabled={loadingStates[currentCard.id]}
                        // variant={
                        //   currentCard.type === "destructive"
                        //     ? "destructive"
                        //     : currentCard.type === "primary"
                        //       ? "default"
                        //       : "secondary"
                        // }
                        className="px-8 py-2 min-w-[100px]"
                        size="sm"
                      >
                        {loadingStates[currentCard.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            执行中
                          </>
                        ) : (
                          "执行指令"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Right Card (Next) */}
              <motion.div
                className="flex-1 cursor-pointer"
                onClick={nextCommand}
                initial={{ x: 100, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 0.6, scale: 0.75 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: 0.1,
                }}
                whileHover={{
                  scale: 0.8,
                  opacity: 0.8,
                  filter: "blur(0px)",
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.7 }}
                key={`next-${currentCommandIndex}`}
              >
                <motion.div
                  className={`bg-card flex flex-col items-center p-4 border rounded-xl ${
                    theme === "light" ? "bg-gray-50/80" : "bg-white/5"
                  }`}
                  style={{ filter: "blur(2px)" }}
                  whileHover={{ filter: "blur(0px)" }}
                >
                  <div className="relative">
                    <motion.div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        theme === "light" ? "bg-gray-100" : "bg-white/10"
                      }`}
                      whileHover={{ rotate: -360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {(() => {
                        const nextIndex =
                          (currentCommandIndex + 1) % commandCards.length;
                        const NextIcon = commandCards[nextIndex].icon;
                        return (
                          <NextIcon className="h-6 w-6 text-muted-foreground" />
                        );
                      })()}
                    </motion.div>
                  </div>
                  <motion.h3
                    className="text-sm font-medium text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {
                      commandCards[
                        (currentCommandIndex + 1) % commandCards.length
                      ].title
                    }
                  </motion.h3>
                  <motion.p
                    className="text-xs text-muted-foreground/70 text-center mt-1 line-clamp-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {
                      commandCards[
                        (currentCommandIndex + 1) % commandCards.length
                      ].description
                    }
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Indicators */}
          <motion.div
            className="flex justify-center space-x-2 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {commandCards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > currentCommandIndex ? 1 : -1);
                  setCurrentCommandIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentCommandIndex
                    ? theme === "light"
                      ? "bg-primary w-6"
                      : "bg-primary w-6"
                    : theme === "light"
                      ? "bg-neutral-300 hover:bg-neutral-400 w-2"
                      : "bg-white/30 hover:bg-white/50 w-2"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  width: index === currentCommandIndex ? 24 : 8,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* 截图历史列表 */}
      {renderScreenshotHistory()}

      {/* 单图预览 */}
      {renderSinglePreview()}

      {/* 拼接预览 */}
      {renderStitchPreview()}
    </div>
  );
}
