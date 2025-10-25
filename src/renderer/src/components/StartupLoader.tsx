import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export default function StartupLoader() {
  const [loadingText, setLoadingText] = useState("正在启动测试平台...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const texts = [
      "正在启动测试平台...",
      "初始化测试环境...",
      "加载项目配置...",
      "连接测试设备...",
      "准备就绪...",
    ];

    let textIndex = 0;
    const textInterval = setInterval(() => {
      if (textIndex < texts.length - 1) {
        textIndex++;
        setLoadingText(texts[textIndex]);
      }
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(textInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Sparkles 测试平台
          </h2>
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(Math.min(progress, 100))}% 完成
          </p>
        </div>
      </div>
    </div>
  );
}
