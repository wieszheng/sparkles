import { useEffect, useRef, useState } from "react";
import {
  Monitor,
  RotateCcw,
  Settings,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ScreenMirror({ selectedDevice }: { selectedDevice: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    name: "未连接",
    resolution: "0x0",
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imageData, setImageData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (selectedDevice !== "") {
      setIsConnected(true);
      setDeviceInfo({
        name: selectedDevice,
        resolution: "1080x1920",
      });
    } else {
      setIsConnected(false);
      setDeviceInfo({ name: "未连接", resolution: "0x0" });
    }
  }, [selectedDevice]);

  // Convert image file to base64 and draw on canvas
  const handleImageUpload = () => {
    window.api.screencap("MJE0224A24014212").then((base64Data) => {
      console.log("Received base64 data");
      setImageData(base64Data);
      drawImageOnCanvas(base64Data);
    });
  };

  const drawImageOnCanvas = (base64Data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();

    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling to fit canvas while maintaining aspect ratio
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = img.width / img.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = canvas.width * (zoomLevel / 100);
        drawHeight = (canvas.width / imgAspect) * (zoomLevel / 100);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas
        drawWidth = canvas.height * imgAspect * (zoomLevel / 100);
        drawHeight = canvas.height * (zoomLevel / 100);
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };
    img.src = "data:image/png;base64," + base64Data;
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    if (imageData) {
      drawImageOnCanvas(imageData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-full"
    >
      <div className="absolute inset-0 bg-card rounded-lg overflow-hidden">
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full object-contain"
            // style={{ background: isConnected ? "#000" : "#f5f5f5" }}
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Monitor className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">请先连接设备</p>
                <p className="text-sm mt-2">
                  点击右上角&ldquo;连接设备&ldquo;按钮开始
                </p>
              </div>
            </div>
          )}
          {isConnected && !imageData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <p className="text-lg">请选择图片进行显示</p>
                <p className="text-sm mt-2">支持 JPG、PNG 等常见格式</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-4 left-4 z-10 group">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg">
          {/* Toolbar Header - Always Visible */}
          <div className="p-3 ">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">工具栏</span>
            </div>
          </div>

          {/* Toolbar Content - Shows on Hover */}
          <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300">
            <div className="p-3 space-y-3">
              {/* Zoom Controls */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  缩放控制
                </label>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleZoomChange(Math.max(50, zoomLevel - 25))
                          }
                          disabled={!imageData}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>缩小</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs font-medium w-12 text-center">
                      {zoomLevel}%
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleZoomChange(Math.min(200, zoomLevel + 25))
                          }
                          disabled={!imageData}
                          className="h-8 w-8 p-0"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>放大</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleZoomChange(100)}
                        disabled={!imageData}
                        className="w-full h-8"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        <span className="text-xs">重置缩放</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>重置为100%缩放</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">操作</label>
                <div className="grid grid-cols-2 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleImageUpload}
                          disabled={!isConnected}
                          className="h-8"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>选择图片</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext("2d");
                              ctx?.clearRect(0, 0, canvas.width, canvas.height);
                              setImageData(null);
                            }
                          }}
                          disabled={!imageData}
                          className="h-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>清除画布</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 group">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg">
          {/* Info Header - Always Visible */}
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium">{deviceInfo.name}</span>
            </div>
          </div>

          {/* Info Content - Shows on Hover */}
          <div className="max-h-0 overflow-hidden group-hover:max-h-96 transition-all duration-300">
            <div className="p-3 space-y-3">
              {/* Device Details */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  设备信息
                </label>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>分辨率:</span>
                    <span className="font-medium">{deviceInfo.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span
                      className={`font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}
                    >
                      {isConnected ? "已连接" : "未连接"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Info */}
              {imageData && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    图像信息
                  </label>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>格式:</span>
                      <span className="font-medium">Base64</span>
                    </div>
                    <div className="flex justify-between">
                      <span>大小:</span>
                      <span className="font-medium">
                        {Math.round(imageData.length / 1024)}KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>缩放:</span>
                      <span className="font-medium">{zoomLevel}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Info */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">性能</label>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>帧率:</span>
                    <span className="font-medium">
                      {isConnected ? "60 FPS" : "0 FPS"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>延迟:</span>
                    <span className="font-medium">
                      {isConnected ? "< 50ms" : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      {/*<input*/}
      {/*  ref={fileInputRef}*/}
      {/*  type="file"*/}
      {/*  accept="image/*"*/}
      {/*  */}
      {/*  className="hidden"*/}
      {/*/>*/}
    </motion.div>
  );
}
