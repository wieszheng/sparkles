import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, StopCircle, WifiOff, Wifi } from "lucide-react";
import { motion } from "framer-motion";

export function ScreenMirror({ selectedDevice }: { selectedDevice: string }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameRate, setFrameRate] = useState(0);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "streaming"
  >("disconnected");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const lastFrameTime = useRef(0);
  const previousDeviceRef = useRef<string | null>(null);

  // 初始化屏幕镜像
  useEffect(() => {
    const handleScreenCast = (
      _,
      _type: string,
      key: string,
      image: Uint8Array,
    ) => {
      if (key === selectedDevice) {
        // 更新连接状态
        if (connectionStatus !== "streaming") {
          setConnectionStatus("streaming");
        }
        // 计算帧率
        const now = Date.now();
        if (lastFrameTime.current) {
          const delta = now - lastFrameTime.current;
          setFrameRate(Math.round(1000 / delta));
        }
        lastFrameTime.current = now;
        // 将Uint8Array转换为base64字符串
        const binaryString = Array.from(image)
          .map((byte) => String.fromCharCode(byte))
          .join("");
        const base64Image = btoa(binaryString);
        frameQueue.current.push(base64Image);
        processFrameQueue();
      }
    };

    window.api.onScreencast(handleScreenCast);

    return () => {
      window.api.offScreencast(handleScreenCast);
      stopStreaming();
    };
  }, [selectedDevice]);

  // 监听设备切换，自动处理镜像逻辑
  useEffect(() => {
    const handleDeviceSwitch = async () => {
      const previousDevice = previousDeviceRef.current;
      const currentDevice = selectedDevice;

      // 更新设备引用
      previousDeviceRef.current = currentDevice;

      if (currentDevice) {
        setConnectionStatus("connected");

        // 如果设备发生变化且之前正在镜像，自动开始新设备的镜像
        if (previousDevice !== currentDevice && isStreaming) {
          try {
            setConnectionStatus("connecting");

            // 停止旧设备的镜像（如果存在）
            if (previousDevice) {
              await window.api.stopCaptureScreen(previousDevice);
            }

            // 开始新设备的镜像
            await window.api.startCaptureScreen(currentDevice, 0.7);
            setIsStreaming(true);
            frameQueue.current = [];
            setFrameRate(0);
          } catch (error) {
            console.error("设备切换时启动镜像失败:", error);
            setIsStreaming(false);
            setConnectionStatus("connected");
          }
        }
      } else {
        setConnectionStatus("disconnected");
        // 设备断开时清除画布内容
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d", { alpha: true });
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 重置画布尺寸以清除所有内容
            canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
            canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
          }
        }

        // 设备断开时停止镜像
        if (isStreaming) {
          setIsStreaming(false);
        }
      }
    };

    handleDeviceSwitch();
  }, [selectedDevice, isStreaming]);

  // 处理帧队列
  const processFrameQueue = () => {
    if (isProcessing.current || !canvasRef.current) return;

    isProcessing.current = true;
    while (frameQueue.current.length > 0) {
      const frame = frameQueue.current.shift();
      if (frame) {
        drawFrame(frame);
      }
    }
    isProcessing.current = false;
  };

  // 绘制帧到画布
  const drawFrame = (frameData: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取设备像素比（DPI）
    const devicePixelRatio = window.devicePixelRatio || 1;
    // 获取画布的实际显示尺寸
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // 设置画布内部尺寸为显示尺寸乘以设备像素比
    if (
      canvas.width !== displayWidth * devicePixelRatio ||
      canvas.height !== displayHeight * devicePixelRatio
    ) {
      canvas.width = displayWidth * devicePixelRatio;
      canvas.height = displayHeight * devicePixelRatio;
    }
    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 更新屏幕尺寸信息
      setScreenSize({ width: img.width, height: img.height });

      // 清除整个画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 计算缩放比例，保持宽高比并确保整数像素
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height,
      );

      // 使用整数像素尺寸避免模糊
      const scaledWidth = Math.floor(img.width * scale);
      const scaledHeight = Math.floor(img.height * scale);

      // 居中显示图像，使用整数坐标
      const offsetX = Math.floor((canvas.width - scaledWidth) / 2);
      const offsetY = Math.floor((canvas.height - scaledHeight) / 2);
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    };
    img.src = `data:image/png;base64,${frameData}`;
  };

  // 开始屏幕镜像
  const startStreaming = async () => {
    // 检查设备是否存在
    if (!selectedDevice) {
      console.warn("无法启动镜像：未选择设备");
      return;
    }

    try {
      setConnectionStatus("connecting");
      await window.api.startCaptureScreen(selectedDevice, 0.7);
      setIsStreaming(true);
      frameQueue.current = [];
      setFrameRate(0);
    } catch (error) {
      console.error("启动屏幕镜像失败:", error);
      setConnectionStatus("connected");
    }
  };

  // 停止屏幕镜像
  const stopStreaming = async () => {
    // 检查设备是否存在
    if (!selectedDevice) {
      console.warn("无法停止镜像：未选择设备");
      setIsStreaming(false);
      setConnectionStatus("disconnected");
      return;
    }

    try {
      await window.api.stopCaptureScreen(selectedDevice);
      setIsStreaming(false);
      setConnectionStatus("connected");
      // 清除画布内容
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { alpha: true });
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 重置画布尺寸以清除所有内容
          canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
          canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
        }
      }
    } catch (error) {
      console.error("停止屏幕镜像失败:", error);
    }
  };
  // 获取状态指示器配置
  const getStatusConfig = () => {
    // 如果没有选择设备，直接返回未连接状态
    if (!selectedDevice) {
      return { color: "bg-gray-500", icon: WifiOff, text: "设备未连接" };
    }

    switch (connectionStatus) {
      case "disconnected":
        return { color: "bg-gray-500", icon: WifiOff, text: "设备未连接" };
      case "connected":
        return { color: "bg-blue-500", icon: Wifi, text: "设备已连接" };
      case "connecting":
        return { color: "bg-yellow-500", icon: Wifi, text: "正在连接..." };
      case "streaming":
        return { color: "bg-green-500", icon: Wifi, text: "实时传输中" };
      default:
        return { color: "bg-gray-500", icon: WifiOff, text: "未知状态" };
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-full"
    >
      <div className="absolute inset-0 bg-card rounded-lg">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full object-contain p-2"
        />

        {!selectedDevice && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <WifiOff className="w-10 h-10 mx-auto opacity-50 mb-2" />
              <p className="text-xl font-semibold">设备未连接</p>
              <p className="text-sm font-semibold">请先选择并连接设备</p>
            </div>
          </div>
        )}

        {selectedDevice && !isStreaming && connectionStatus === "connected" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="w-10 h-10 mx-auto opacity-50 mb-2" />
              <p className="text-xl font-semibold">镜像未开启</p>
              <p className="text-sm font-semibold">点击播放按钮开始屏幕镜像</p>
            </div>
          </div>
        )}

        {selectedDevice && connectionStatus === "disconnected" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <WifiOff className="w-10 h-10 mx-auto opacity-50 mb-2" />
              <p className="text-xl font-semibold">设备已断开</p>
              <p className="text-sm font-semibold">请重新连接设备</p>
            </div>
          </div>
        )}
      </div>
      <div className="absolute top-2 right-2 z-10 bg-card/95 backdrop-blur-sm w-36 rounded-lg p-1 border">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 ml-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusConfig().color} animate-pulse`}
            />
            <span className="text-xs font-medium">
              {getStatusConfig().text}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={isStreaming ? stopStreaming : startStreaming}
            disabled={!selectedDevice || connectionStatus === "connecting"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {connectionStatus === "connecting" ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isStreaming ? (
              <StopCircle className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        {isStreaming && (
          <div className="mt-2 ml-2 mb-1 text-xs text-muted-foreground">
            <div>
              状态: <span className="text-green-500">实时传输中</span>
            </div>
            <div>帧率: ~{frameRate} FPS</div>
            {screenSize.width > 0 && screenSize.height > 0 && (
              <div>
                尺寸: {screenSize.width}×{screenSize.height}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
