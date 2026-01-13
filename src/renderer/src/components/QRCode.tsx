import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import QRCodeLib from "qrcode";
import { QrCode, Palette, Download, Copy, Upload, Type } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

// --- Types ---

type ErrorLevel = "L" | "M" | "Q" | "H";

const colorPresets = [
  { name: "经典黑白", dark: "#000000", light: "#FFFFFF" },
  { name: "科技蓝", dark: "#0066FF", light: "#E6F0FF" },
  { name: "活力橙", dark: "#FF6B35", light: "#FFF4E6" },
  { name: "清新绿", dark: "#00A86B", light: "#E6F7F1" },
  { name: "优雅紫", dark: "#6B4FBB", light: "#F3EFFF" },
  { name: "玫瑰红", dark: "#E63946", light: "#FFE5E8" },
  { name: "深海蓝", dark: "#1A5F7A", light: "#E1F5FE" },
  { name: "奢华金", dark: "#D4AF37", light: "#FFFBEB" },
];

export function QRCode() {
  // --- State ---
  const [content, setContent] = useState("https://example.com");

  // Settings
  const [errorLevelValue, setErrorLevelValue] = useState(3); // 0-3: L, M, Q, H
  const [margin, setMargin] = useState(2);
  const [size, setSize] = useState(1024); // High res internally

  // Style Settings
  const [qrColor, setQrColor] = useState("#000000");
  const [qrColorEnd, setQrColorEnd] = useState<string | null>(null);
  const [useGradient, setUseGradient] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [bgColor, setBgColor] = useState("#ffffff");

  // Logo Settings
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [logoPadding, setLogoPadding] = useState(true);

  // Output
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // --- Auto-Generation Logic ---
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContent(content), 500);
    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    handleGenerate();
  }, [
    debouncedContent,
    errorLevelValue,
    margin,
    size,
    qrColor,
    qrColorEnd,
    useGradient,
    gradientAngle,
    bgColor,
    logo,
    logoSize,
    logoPadding,
  ]);

  // --- Functions ---

  const generateClassicQR = async () => {
    try {
      // Generate base QR code with black color first
      const errorLevels: ErrorLevel[] = ["L", "M", "Q", "H"];
      const currentErrorLevel = errorLevels[errorLevelValue];
      const qrUrl = await QRCodeLib.toDataURL(content, {
        errorCorrectionLevel: currentErrorLevel,
        margin: margin,
        width: size,
        color: {
          dark: "#000000",
          light: bgColor,
        },
      });

      return new Promise<string>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        canvas.width = size;
        canvas.height = size;

        img.onload = () => {
          if (!ctx) return;

          // Draw QR code
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          // Create gradient if enabled
          if (useGradient && qrColorEnd) {
            // Create gradient
            const gradient = ctx.createLinearGradient(
              0, 0,
              size * Math.cos((gradientAngle * Math.PI) / 180),
              size * Math.sin((gradientAngle * Math.PI) / 180)
            );
            gradient.addColorStop(0, qrColor);
            gradient.addColorStop(1, qrColorEnd);

            // Create a temporary canvas for gradient
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) {
              reject(new Error("Failed to create canvas context"));
              return;
            }

            tempCanvas.width = size;
            tempCanvas.height = size;

            // Fill with gradient
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, size, size);

            // Get gradient data
            const gradientData = tempCtx.getImageData(0, 0, size, size);

            // Replace black pixels with gradient colors
            for (let i = 0; i < data.length; i += 4) {
              // Check if pixel is black (original QR code color)
              if (data[i] < 10 && data[i + 1] < 10 && data[i + 2] < 10) {
                data[i] = gradientData.data[i];       // R
                data[i + 1] = gradientData.data[i + 1]; // G
                data[i + 2] = gradientData.data[i + 2]; // B
              }
            }
          } else {
            // Use solid color
            const r = parseInt(qrColor.slice(1, 3), 16);
            const g = parseInt(qrColor.slice(3, 5), 16);
            const b = parseInt(qrColor.slice(5, 7), 16);

            for (let i = 0; i < data.length; i += 4) {
              // Check if pixel is black
              if (data[i] < 10 && data[i + 1] < 10 && data[i + 2] < 10) {
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);

          // Draw logo on top if exists
          if (logo) {
            const logoImg = new Image();
            logoImg.onload = () => {
              const logoW = (size * logoSize) / 100;
              const logoH =
                (logoSize * size * (logoImg.height / logoImg.width)) / 100;
              const x = (size - logoW) / 2;
              const y = (size - logoH) / 2;

              if (logoPadding) {
                const padding = size * 0.015;
                const rx = x - padding;
                const ry = y - padding;
                const rw = logoW + padding * 2;
                const rh = logoH + padding * 2;
                const radius = padding * 1.5;

                ctx.fillStyle = bgColor;
                ctx.beginPath();
                if (ctx.roundRect) {
                  ctx.roundRect(rx, ry, rw, rh, radius);
                } else {
                  ctx.moveTo(rx + radius, ry);
                  ctx.lineTo(rx + rw - radius, ry);
                  ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, radius);
                  ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, radius);
                  ctx.arcTo(rx, ry + rh, rx, ry, radius);
                  ctx.arcTo(rx, ry, rx + rw, ry, radius);
                }
                ctx.fill();
              }

              ctx.drawImage(logoImg, x, y, logoW, logoH);
              resolve(canvas.toDataURL("image/png"));
            };
            logoImg.onerror = (e) => reject(e);
            logoImg.crossOrigin = "anonymous";
            logoImg.src = logo;
          } else {
            resolve(canvas.toDataURL("image/png"));
          }
        };
        img.onerror = (e) => reject(e);
        img.src = qrUrl;
      });
    } catch (err) {
      console.error(err);
      throw new Error("生成二维码失败");
    }
  };

  const handleGenerate = async () => {
    if (!content) return;
    try {
      const url = await generateClassicQR();
      setGeneratedUrl(url);
    } catch (e) {
      console.error(e);
      toast.error("生成失败");
    }
  };

  const handleLogoUpload = async () => {
    const result = await window.api.openFileDialog({
      filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg"] }],
      properties: ["openFile"],
    });
    if (result.canceled || result.filePaths.length === 0) return;

    const path = result.filePaths[0];
    const fileData = await window.api.readFile(path);
    if (fileData.data) {
      const blob = new Blob([new Uint8Array(fileData.data)], {
        type: fileData.mimeType,
      });
      const url = URL.createObjectURL(blob);
      setLogo(url);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const options = {
        title: "保存二维码",
        defaultPath: `qr-${Date.now()}.png`,
        filters: [{ name: "PNG 图片", extensions: ["png"] }],
      };
      const saveDetails = await window.api.showSaveDialog(options);
      if (saveDetails.canceled || !saveDetails.filePath) return;

      const base64Data = generatedUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await window.api.saveFile(saveDetails.filePath, Array.from(bytes));
      toast.success("保存成功");
    } catch (e) {
      toast.error(`保存失败: ${e}`);
    }
  };

  // --- Render ---

  return (
    <div className="h-full flex flex-col">
      {/* Main Workspace */}
      <div className="flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full flex rounded-lg overflow-hidden p-1.5"
        >
          {/* Left Panel: Configuration */}
          <div className="w-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scroll">
              <div className="space-y-1">
                {/* Content Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    二维码内容
                  </Label>
                  <Textarea
                    placeholder="请输入链接或文本..."
                    className="min-h-[100px] resize-none border-border/60 focus:border-primary/50 bg-background/50 transition-all font-mono text-sm leading-relaxed"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground flex justify-end">
                    {content.length} 个字符
                  </p>
                </div>

                {/* Style Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    样式
                  </Label>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">
                      颜色预设
                    </Label>
                    <div className="grid grid-cols-7 gap-2">
                      {colorPresets.map((preset) => (
                        <div
                          key={preset.name}
                          onClick={() => {
                            setQrColor(preset.dark);
                            setBgColor(preset.light);
                          }}
                          className="group cursor-pointer flex flex-col items-center gap-2"
                          title={preset.name}
                        >
                          <div
                            className={cn(
                              "w-full aspect-square rounded-lg border border-border/50 overflow-hidden relative shadow-sm transition-all hover:scale-105 hover:shadow-md",
                              qrColor === preset.dark &&
                                bgColor === preset.light
                                ? "ring-2 ring-primary ring-offset-2"
                                : "",
                            )}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: preset.light }}
                            />
                            <div
                              className="absolute inset-[25%]"
                              style={{
                                backgroundColor: preset.dark,
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        前色与背景色
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">渐变</span>
                        <button
                          onClick={() => setUseGradient(!useGradient)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            useGradient ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                              useGradient ? "left-4.5" : "left-0.5"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {useGradient ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                起始色
                              </span>
                              <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-lg border border-border/50">
                                <input
                                  type="color"
                                  value={qrColor}
                                  onChange={(e) => setQrColor(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden ring-1 ring-border/20"
                                />
                                <span className="text-xs font-mono text-foreground/80">
                                  {qrColor}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                结束色
                              </span>
                              <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-lg border border-border/50">
                                <input
                                  type="color"
                                  value={qrColorEnd || qrColor}
                                  onChange={(e) => setQrColorEnd(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden ring-1 ring-border/20"
                                />
                                <span className="text-xs font-mono text-foreground/80">
                                  {qrColorEnd || qrColor}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                              渐变角度
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {gradientAngle}°
                            </span>
                          </div>
                          <Slider
                            value={[gradientAngle]}
                            min={0}
                            max={360}
                            step={15}
                            onValueChange={(v) => setGradientAngle(v[0])}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1.5 flex-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                前景色
                              </span>
                              <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-lg border border-border/50">
                                <input
                                  type="color"
                                  value={qrColor}
                                  onChange={(e) => setQrColor(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden ring-1 ring-border/20"
                                />
                                <span className="text-xs font-mono text-foreground/80">
                                  {qrColor}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                背景色
                              </span>
                              <div className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-lg border border-border/50">
                                <input
                                  type="color"
                                  value={bgColor}
                                  onChange={(e) => setBgColor(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden ring-1 ring-border/20"
                                />
                                <span className="text-xs font-mono text-foreground/80">
                                  {bgColor}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground flex justify-between">
                      <span>Logo</span>
                      {logo && (
                        <span
                          className="text-primary cursor-pointer hover:underline"
                          onClick={() => setLogo(null)}
                        >
                          移除
                        </span>
                      )}
                    </Label>

                    {!logo ? (
                      <div
                        onClick={handleLogoUpload}
                        className="h-20 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-muted/30 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary/70 mb-1" />
                        <span className="text-[10px] text-muted-foreground">
                          上传 Logo
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-center">
                        <div className="w-18 h-18 rounded-xl border border-border/50 p-2 flex items-center justify-center bg-muted/20 relative group overflow-hidden">
                          <img
                            src={logo}
                            className="max-w-full max-h-full object-contain"
                          />
                          <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={handleLogoUpload}
                          >
                            <span className="text-xs text-white font-medium">
                              更换
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                              尺寸
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {logoSize}%
                            </span>
                          </div>
                          <Slider
                            value={[logoSize]}
                            min={5}
                            max={40}
                            step={1}
                            onValueChange={(v) => setLogoSize(v[0])}
                          />
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="logo-padding"
                              checked={logoPadding}
                              onChange={(e) =>
                                setLogoPadding(e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary/50"
                            />
                            <label
                              htmlFor="logo-padding"
                              className="text-xs text-muted-foreground cursor-pointer select-none"
                            >
                              Logo 区域挖空
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 min-w-0 flex flex-col relative">
            {generatedUrl ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  {/* Preview Card */}
                  <motion.div layoutId="preview-card" className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-purple-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative bg-white p-4 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                      <img
                        src={generatedUrl}
                        className="w-[300px] h-[300px] object-contain rounded-sm"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Settings Panel */}
                <div className="p-5">
                  <div className="max-w-lg mx-auto space-y-4">
                    <Label className="text-sm font-semibold text-foreground/80">
                      设置
                    </Label>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs">容错率</Label>
                          <span className="text-[10px] text-muted-foreground">
                            {["L (7%)", "M (15%)", "Q (25%)", "H (30%)"][errorLevelValue]}
                          </span>
                        </div>
                        <Slider
                          value={[errorLevelValue]}
                          min={0}
                          max={3}
                          step={1}
                          onValueChange={(v) => setErrorLevelValue(v[0])}
                          className="py-1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs">边距</Label>
                          <span className="text-[10px] text-muted-foreground">{margin}px</span>
                        </div>
                        <Slider
                          value={[margin]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(v) => setMargin(v[0])}
                          className="py-1"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs">输出尺寸</Label>
                          <span className="text-[10px] text-muted-foreground">{size}px</span>
                        </div>
                        <Slider
                          value={[size]}
                          min={200}
                          max={2000}
                          step={100}
                          onValueChange={(v) => setSize(v[0])}
                          className="py-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-border/40">
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" /> 保存图片
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(content);
                        toast.success("内容已复制到剪贴板");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                <div className="p-6 rounded-full bg-muted/30">
                  <QrCode className="w-12 h-12" />
                </div>
                <p className="font-medium">输入内容自动生成...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
