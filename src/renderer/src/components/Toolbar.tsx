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
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

export function Toolbar({ selectedDevice }: { selectedDevice: string }) {
  const { theme } = useTheme();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

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
      await window.api.hdcCommand("screencap", selectedDevice, true);
      toast.success("截图成功");
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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
