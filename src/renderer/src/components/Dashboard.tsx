import { motion } from "framer-motion";
import {
  Battery,
  Cloud,
  CloudRain,
  Cpu,
  Globe,
  HardDrive,
  Monitor,
  Quote,
  Sun,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card.tsx";
interface QuoteData {
  text: string;
  author: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "rain";
}
interface DeviceInfo {
  browser: string;
  os: string;
  screenResolution: string;
  deviceType: string;
  cpuCores: number;
  memory: string;
  networkType: string;
  networkStatus: string;
  batteryLevel: string;
  batteryCharging: string;
}
const quotes: QuoteData[] = [
  {
    text: "生活不是等待暴风雨过去，而是学会在雨中跳舞。",
    author: "维维安·格林",
  },
  {
    text: "成功不是终点，失败也不是终结，唯有勇气才是永恒。",
    author: "温斯顿·丘吉尔",
  },
  { text: "你今天的努力，是幸运的伏笔。", author: "佚名" },
  { text: "不要让昨天占据今天太多的时间。", author: "威尔·罗杰斯" },
  { text: "相信自己，你比想象中更强大。", author: "佚名" },
];

export function Dashboard() {
  const [quote, setQuote] = useState<QuoteData>(quotes[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const [weather, setWeather] = useState<WeatherData>({
    temp: 24,
    condition: "晴朗",
    icon: "sun",
  });

  useEffect(() => {
    const conditions = [
      { temp: 24, condition: "晴朗", icon: "sun" as const },
      { temp: 18, condition: "多云", icon: "cloud" as const },
      { temp: 16, condition: "小雨", icon: "rain" as const },
    ];

    const interval = setInterval(() => {
      const randomWeather =
        conditions[Math.floor(Math.random() * conditions.length)];
      setWeather(randomWeather);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const WeatherIcon =
    weather.icon === "sun" ? Sun : weather.icon === "cloud" ? Cloud : CloudRain;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
        setIsAnimating(false);
      }, 300);
    }, 15000);

    return () => clearInterval(interval);
  }, []);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    browser: "加载中...",
    os: "加载中...",
    screenResolution: "加载中...",
    deviceType: "加载中...",
    cpuCores: 0,
    memory: "加载中...",
    networkType: "加载中...",
    networkStatus: "加载中...",
    batteryLevel: "不支持",
    batteryCharging: "不支持",
  });

  useEffect(() => {
    const getDeviceInfo = async () => {
      // Browser and OS
      const userAgent = navigator.userAgent;
      let browser = "未知浏览器";
      let os = "未知系统";

      // Detect Browser
      if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
        browser = "Chrome";
      } else if (
        userAgent.includes("Safari") &&
        !userAgent.includes("Chrome")
      ) {
        browser = "Safari";
      } else if (userAgent.includes("Firefox")) {
        browser = "Firefox";
      } else if (userAgent.includes("Edg")) {
        browser = "Edge";
      }

      // Detect OS
      if (userAgent.includes("Win")) {
        os = "Windows";
      } else if (userAgent.includes("Mac")) {
        os = "macOS";
      } else if (userAgent.includes("Linux")) {
        os = "Linux";
      } else if (userAgent.includes("Android")) {
        os = "Android";
      } else if (userAgent.includes("iOS")) {
        os = "iOS";
      }

      // Screen Resolution
      const screenResolution = `${window.screen.width} × ${window.screen.height}`;

      // Device Type
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent)
        ? "移动设备"
        : "桌面设备";

      // CPU Cores
      const cpuCores = navigator.hardwareConcurrency || 0;

      // Memory (if available)
      const memory = (navigator as any).deviceMemory
        ? `${(navigator as any).deviceMemory} GB`
        : "不支持";

      // Network Information
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      const networkType = connection?.effectiveType || "未知";
      const networkStatus = navigator.onLine ? "在线" : "离线";

      // Battery Information
      let batteryLevel = "不支持";
      let batteryCharging = "不支持";

      if ("getBattery" in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          batteryLevel = `${Math.round(battery.level * 100)}%`;
          batteryCharging = battery.charging ? "充电中" : "未充电";
        } catch (error) {
          console.log("Battery API not supported");
        }
      }

      setDeviceInfo({
        browser,
        os,
        screenResolution,
        deviceType,
        cpuCores,
        memory,
        networkType,
        networkStatus,
        batteryLevel,
        batteryCharging,
      });
    };

    getDeviceInfo();

    // Update network status
    const handleOnline = () => {
      setDeviceInfo((prev) => ({ ...prev, networkStatus: "在线" }));
    };
    const handleOffline = () => {
      setDeviceInfo((prev) => ({ ...prev, networkStatus: "离线" }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const infoItems = [
    {
      icon: Globe,
      label: "浏览器",
      value: deviceInfo.browser,
      color: "text-primary",
    },
    {
      icon: Monitor,
      label: "操作系统",
      value: deviceInfo.os,
      color: "text-chart-3",
    },
    {
      icon: Monitor,
      label: "屏幕分辨率",
      value: deviceInfo.screenResolution,
      color: "text-chart-4",
    },
    {
      icon: Monitor,
      label: "设备类型",
      value: deviceInfo.deviceType,
      color: "text-chart-5",
    },
    {
      icon: Cpu,
      label: "CPU核心",
      value: `${deviceInfo.cpuCores} 核`,
      color: "text-primary",
    },
    {
      icon: HardDrive,
      label: "内存",
      value: deviceInfo.memory,
      color: "text-chart-1",
    },
    {
      icon: Wifi,
      label: "网络类型",
      value: deviceInfo.networkType.toUpperCase(),
      color: "text-chart-4",
    },
    {
      icon: Wifi,
      label: "网络状态",
      value: deviceInfo.networkStatus,
      color:
        deviceInfo.networkStatus === "在线" ? "text-green-500" : "text-red-500",
    },
    {
      icon: Battery,
      label: "电池电量",
      value: deviceInfo.batteryLevel,
      color: "text-chart-5",
    },
    {
      icon: Battery,
      label: "充电状态",
      value: deviceInfo.batteryCharging,
      color:
        deviceInfo.batteryCharging === "充电中"
          ? "text-green-500"
          : "text-primary",
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-5"
    >
      <section>
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 flex items-start gap-2">
              <Quote className="w-5 h-5 mt-1.5" />
              <div
                className={`space-y-2 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
              >
                <blockquote className="font-bold leading-relaxed text-balance">
                  {quote.text}
                </blockquote>
                <p className="text-xs text-white/80">— {quote.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-glow">
                    {weather.temp}
                  </span>
                  <span className="text-1xl text-white/80">°C</span>
                </div>
                <p className="text-base text-white/80 mt-1">
                  {weather.condition}
                </p>
              </div>
              <WeatherIcon className="w-11 h-11 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
      <Card className="glass-effect border-border/50 p-3">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {infoItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 ${item.color} flex-shrink-0`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
