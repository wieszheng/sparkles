import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  QrCode,
  Palette,
  Film,
  Upload,
  Download,
  RefreshCw,
  Loader2,
  X,
  Sparkles,
  Images,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type QRCodeType = "normal" | "art" | "dynamic";
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

interface QRCodeResult {
  imageUrl: string; // API返回的图片URL，同时用于预览和下载
  version: number;
  errorLevel: ErrorCorrectionLevel;
  type: QRCodeType;
  objectName?: string;
  fileSize?: number;
}

interface PresetImage {
  id: string;
  name: string;
  url: string;
  type: "png" | "gif";
  category: string;
}

const errorLevelDescriptions: Record<ErrorCorrectionLevel, string> = {
  L: "约7%的数据恢复能力",
  M: "约15%的数据恢复能力",
  Q: "约25%的数据恢复能力",
  H: "约30%的数据恢复能力",
};

// 预设图片列表 - PNG格式用于艺术二维码
const presetPngImages: PresetImage[] = [
  {
    id: "png-1",
    name: "小鸟",
    url: "http://82.157.176.120:9000/snicker/2024/11/22/1a97c7fd-a653-459f-a0c7-791c47502a7b.jpg",
    type: "png",
    category: "小鸟",
  },
  {
    id: "png-2",
    name: "渐变紫",
    url: "http://82.157.176.120:9000/snicker/2024/11/22/IMG_1028.PNG",
    type: "png",
    category: "渐变",
  },
  {
    id: "png-3",
    name: "渐变橙",
    url: "http://82.157.176.120:9000/snicker/2024/11/22/1a97c7fd-a653-459f-a0c7-791c47502a7b.jpg",
    type: "png",
    category: "渐变",
  },
  {
    id: "png-4",
    name: "星空",
    url: "http://82.157.176.120:9000/snicker/2024/11/22/1a97c7fd-a653-459f-a0c7-791c47502a7b.jpg",
    type: "png",
    category: "自然",
  },
];

// 预设图片列表 - GIF格式用于动态二维码
const presetGifImages: PresetImage[] = [
  {
    id: "gif-1",
    name: "dog",
    url: "http://82.157.176.120:9000/snicker/2024/dog.gif",
    type: "gif",
    category: "小狗",
  },
  {
    id: "gif-2",
    name: "dog1",
    url: "http://82.157.176.120:9000/snicker/2024/dog1.gif",
    type: "gif",
    category: "小狗",
  },
  {
    id: "gif-3",
    name: "doro",
    url: "http://82.157.176.120:9000/snicker/2024/doro.gif",
    type: "gif",
    category: "Doro",
  },
  {
    id: "gif-4",
    name: "a",
    url: "http://82.157.176.120:9000/snicker/2024/a.gif",
    type: "gif",
    category: "Doro",
  },
  {
    id: "gif-5",
    name: "b",
    url: "http://82.157.176.120:9000/snicker/2024/b.gif",
    type: "gif",
    category: "Doro",
  },
  {
    id: "gif-6",
    name: "dog3",
    url: "http://82.157.176.120:9000/snicker/2024/ka.gif",
    type: "gif",
    category: "小狗",
  },
  {
    id: "gif-6",
    name: "c",
    url: "http://82.157.176.120:9000/snicker/2024/c.gif",
    type: "gif",
    category: "彩虹小白马",
  },
];

export function QRCode() {
  // 通用状态
  const [activeTab, setActiveTab] = useState<QRCodeType>("art");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(10);
  const [errorLevel, setErrorLevel] = useState<ErrorCorrectionLevel>("H");

  // 艺术/动态二维码额外状态
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [colorize, setColorize] = useState(false);
  const [contrast, setContrast] = useState(1.0);
  const [brightness, setBrightness] = useState(1.0);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<QRCodeResult | null>(null);

  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const handleSelectPreset = (preset: PresetImage) => {
    setSelectedPresetId(preset.id);
    setImagePreview(preset.url);
    setUploadedImage(null);
    setPresetPopoverOpen(false);
  };

  const handleImageUpload = async () => {
    try {
      const options = {
        title: activeTab === "dynamic" ? "选择GIF文件" : "选择图片文件",
        filters: [
          {
            name: activeTab === "dynamic" ? "GIF Files" : "Image Files",
            extensions:
              activeTab === "dynamic" ? ["gif"] : ["png", "jpg", "jpeg", "bmp"],
          },
        ],
        properties: ["openFile" as const],
      };

      const result = await window.api.openFileDialog(options);

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return; // 用户取消了选择
      }

      const filePath = result.filePaths[0];

      // 使用Electron的API读取文件内容
      const fileResult = await window.api.readFile(filePath);

      if (!fileResult.success || !fileResult.data) {
        toast.error("文件读取失败，请重试");
        return;
      }

      // 将数字数组转换为Blob
      const buffer = new Uint8Array(fileResult.data);
      const blob = new Blob([buffer], { type: fileResult.mimeType });

      // 获取文件名
      const fileName = fileResult.fileName || "";

      // 创建File对象
      const file = new File([blob], fileName, { type: fileResult.mimeType });

      // 验证文件格式
      const validFormats =
        activeTab === "dynamic"
          ? ["image/gif"]
          : ["image/png", "image/jpeg", "image/bmp"];

      if (!validFormats.includes(file.type)) {
        toast(
          activeTab === "dynamic"
            ? "请上传 GIF 格式的图片"
            : "请上传 PNG、JPG 或 BMP 格式的图片",
        );
        return;
      }

      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("文件选择失败:", error);
      toast.error("文件选择失败，请重试");
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("二维码内容不能为空");
      return;
    }

    if (
      (activeTab === "art" || activeTab === "dynamic") &&
      !uploadedImage &&
      !imagePreview
    ) {
      toast.error(
        activeTab === "dynamic" ? "请上传 GIF 图片" : "请上传背景图片",
      );
      return;
    }

    setIsGenerating(true);

    try {
      const apiUrl = "http://82.157.176.120:8000/api/v1";
      let response: Response;

      // 如果使用预设图片，需要将 URL 转换为 File 对象
      let imageFile = uploadedImage;
      if (
        !uploadedImage &&
        imagePreview &&
        (activeTab === "art" || activeTab === "dynamic")
      ) {
        try {
          const imageResponse = await fetch(imagePreview);
          const imageBlob = await imageResponse.blob();
          const fileName =
            activeTab === "dynamic" ? "preset.gif" : "preset.png";
          imageFile = new File([imageBlob], fileName, {
            type: activeTab === "dynamic" ? "image/gif" : "image/png",
          });
        } catch {
          toast.error("预设图片加载失败，请重新选择");
          setIsGenerating(false);
          return;
        }
      }

      if (activeTab === "normal") {
        // 普通二维码生成
        response = await fetch(`${apiUrl}/simple`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            words: content,
            version,
            level: errorLevel,
            contrast,
            brightness,
          }),
        });
      } else if (activeTab === "art") {
        // 艺术二维码生成
        const formData = new FormData();
        formData.append("words", content);
        formData.append("picture", imageFile!);
        formData.append("version", version.toString());
        formData.append("level", errorLevel);
        formData.append("colorized", colorize.toString());
        formData.append("contrast", contrast.toString());
        formData.append("brightness", brightness.toString());

        response = await fetch(`${apiUrl}/artistic`, {
          method: "POST",
          body: formData,
        });
      } else {
        // 动态二维码生成
        const formData = new FormData();
        formData.append("words", content);
        formData.append("gif_file", imageFile!);
        formData.append("version", version.toString());
        formData.append("level", errorLevel);
        formData.append("colorized", colorize.toString());
        formData.append("contrast", contrast.toString());
        formData.append("brightness", brightness.toString());

        response = await fetch(`${apiUrl}/animated`, {
          method: "POST",
          body: formData,
        });
      }

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          setResult({
            imageUrl: responseData.url, // 直接使用API返回的URL
            version: responseData.version || version,
            errorLevel:
              (responseData.level as ErrorCorrectionLevel) || errorLevel,
            type: activeTab,
            objectName: responseData.object_name,
            fileSize: responseData.file_size,
          });

          toast.success("二维码已成功生成");
        } else {
          toast.error(responseData.message || "二维码生成失败");
        }
      } else {
        const error = await response.json();
        toast.error(error.message || error.detail || "二维码生成失败");
      }
    } catch (error) {
      console.error("生成二维码时出错:", error);
      toast.error("连接服务器失败，请检查后端服务是否启动");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setVersion(10);
    setErrorLevel("H");
    setUploadedImage(null);
    setImagePreview(null);
    setColorize(false);
    setContrast(1.0);
    setBrightness(1.0);
    setResult(null);
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      // 根据二维码类型确定文件扩展名和默认文件名
      const isGif = result.type === "dynamic";
      const fileExtension = isGif ? "gif" : "png";

      // 使用API返回的objectName作为默认文件名，如果没有则使用默认格式
      const defaultFileName = result.objectName
        ? result.objectName.endsWith(`.${fileExtension}`)
          ? result.objectName
          : `${result.objectName}.${fileExtension}`
        : `qrcode-${result.type}-${Date.now()}.${fileExtension}`;

      const options = {
        title: "保存二维码",
        defaultPath: defaultFileName,
        filters: [
          {
            name: isGif ? "GIF Files" : "PNG Files",
            extensions: [fileExtension],
          },
        ],
      };

      const saveResult = await window.api.showSaveDialog(options);
      if (saveResult.canceled || !saveResult.filePath) {
        return; // 用户取消了保存
      }

      // 获取图片数据
      const imageResponse = await fetch(result.imageUrl);
      const blob = await imageResponse.blob();

      // 转换为ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // 使用Electron的API保存文件
      await window.api.saveFile(
        saveResult.filePath,
        Array.from(new Uint8Array(arrayBuffer)),
      );

      toast.success("二维码保存成功");
    } catch (error) {
      console.error("保存失败:", error);
      toast.error(`保存失败，请重试：${error}`);
    }
  };

  const isFormValid =
    content.trim() && (activeTab === "normal" || uploadedImage || imagePreview);

  // 渲染通用表单字段
  const renderCommonFields = () => (
    <div className="space-y-4">
      {/* 输入内容 */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium">
          输入内容 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="content"
          placeholder="请输入URL或文本内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-9 bg-card/50 border-border/50"
        />
        {content && content.startsWith("http") && (
          <p className="text-xs text-muted-foreground">检测到URL格式</p>
        )}
      </div>

      {/* 二维码版本和纠错级别 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 二维码版本 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">版本</Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {version}
            </span>
          </div>
          <Slider
            value={[version]}
            onValueChange={(v) => setVersion(v[0])}
            min={1}
            max={40}
            step={1}
            className="py-2"
          />
        </div>

        {/* 纠错级别 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">纠错级别</Label>
          <RadioGroup
            value={errorLevel}
            onValueChange={(v) => setErrorLevel(v as ErrorCorrectionLevel)}
            className="grid grid-cols-4 gap-1"
          >
            {(["L", "M", "Q", "H"] as ErrorCorrectionLevel[]).map((level) => (
              <div key={level} className="flex items-center space-x-1">
                <RadioGroupItem
                  value={level}
                  id={`level-${level}`}
                  className="scale-88"
                />
                <Label
                  htmlFor={`level-${level}`}
                  className="text-xs cursor-pointer"
                >
                  {level}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        版本越高，可存储的数据量越大 | {errorLevelDescriptions[errorLevel]}
      </p>
    </div>
  );

  // 渲染艺术/动态二维码额外字段
  const renderAdvancedFields = () => (
    <div className="space-y-4">
      {/* 图片上传 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            上传图片 <span className="text-destructive">*</span>
          </Label>
          <Popover open={presetPopoverOpen} onOpenChange={setPresetPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Images className="h-3.5 w-3.5" />
                选择素材
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {activeTab === "dynamic" ? "GIF动图素材" : "PNG静态素材"}
                  </p>
                </div>

                {/* 按分类分组展示 */}
                {(() => {
                  const images =
                    activeTab === "dynamic" ? presetGifImages : presetPngImages;
                  const categories = [
                    ...new Set(images.map((img) => img.category)),
                  ];
                  return (
                    <div className="space-y-2 max-h-64 overflow-y-auto px-2">
                      {categories.map((category) => (
                        <div key={category} className="space-y-1.5">
                          <p className="text-xs text-muted-foreground font-medium">
                            {category}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {images
                              .filter((img) => img.category === category)
                              .map((preset) => (
                                <div
                                  key={preset.id}
                                  className={`
                                    relative cursor-pointer rounded-md overflow-hidden transition-all
                                    w-12 h-12 flex-shrink-0
                                    ring-1 ring-border/50 hover:ring-primary/50 hover:shadow-sm
                                    ${selectedPresetId === preset.id ? "ring-2 ring-primary shadow-md" : ""}
                                  `}
                                  onClick={() => handleSelectPreset(preset)}
                                  title={preset.name}
                                >
                                  <img
                                    src={preset.url || "/placeholder.svg"}
                                    alt={preset.name}
                                    className="w-full h-full object-cover"
                                  />
                                  {selectedPresetId === preset.id && (
                                    <div className="absolute top-0.5 right-0.5 bg-primary rounded-full p-0.5">
                                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-3 transition-colors
            ${imagePreview ? "border-primary/50 " : "border-border hover:border-primary/30"}
          `}
        >
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="预览"
                className="max-h-30 mx-auto rounded object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full text-destructive-foreground hover:bg-destructive/90"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {uploadedImage?.name}
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col  items-center justify-center py-4 cursor-pointer"
              onClick={handleImageUpload}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">点击选择图片</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === "dynamic"
                  ? "支持 GIF 格式"
                  : "支持 PNG、JPG、BMP 格式"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 彩色化 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="colorize"
          checked={colorize}
          onCheckedChange={(checked) => setColorize(checked as boolean)}
        />
        <Label htmlFor="colorize" className="text-sm cursor-pointer">
          彩色化
        </Label>
      </div>

      {/* 对比度和亮度 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 对比度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">对比度</Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {contrast.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[contrast]}
            onValueChange={(v) => setContrast(v[0])}
            min={0.1}
            max={3.0}
            step={0.1}
            className="py-2"
          />
        </div>

        {/* 亮度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">亮度</Label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {brightness.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(v) => setBrightness(v[0])}
            min={0.1}
            max={3.0}
            step={0.1}
            className="py-2"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex gap-3 p-1.5 bg-card rounded-lg">
      {/* 左侧 - 内容配置区 */}
      <div className="flex-1 flex flex-col bg-card backdrop-blur-sm">
        {/* 左侧头部 */}
        <div className="flex-shrink-0 px-4 py-2">
          <p className="text-xs text-muted-foreground mt-1">
            快来尝试创建普通、艺术或动态二维码
          </p>
        </div>

        {/* 左侧内容 */}
        <div className="flex-1 overflow-auto px-3.5">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as QRCodeType);
              clearImage();
              setResult(null);
            }}
          >
            <TabsList className="w-2/3 mb-1 bg-muted/50">
              <TabsTrigger
                value="normal"
                className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <QrCode className="h-3.5 w-3.5" />
                普通
              </TabsTrigger>
              <TabsTrigger
                value="art"
                className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Palette className="h-3.5 w-3.5" />
                艺术
              </TabsTrigger>
              <TabsTrigger
                value="dynamic"
                className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Film className="h-3.5 w-3.5" />
                动态
              </TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="space-y-4 mt-0">
              {renderCommonFields()}
            </TabsContent>

            <TabsContent value="art" className="space-y-4 mt-0">
              {renderCommonFields()}
              {renderAdvancedFields()}
            </TabsContent>

            <TabsContent value="dynamic" className="space-y-4 mt-0">
              {renderCommonFields()}
              {renderAdvancedFields()}
            </TabsContent>
          </Tabs>
        </div>

        {/* 底部固定操作按钮 */}
        <div className="flex-shrink-0 px-4 py-3">
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isGenerating}
            >
              <RefreshCw className="h-4 w-4" />
              重置
            </Button>
            <Button
              size="sm"
              disabled={!isFormValid || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  生成二维码
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧 - 预览区 */}
      <div className="w-[360px] flex flex-col">
        {/* 右侧头部 */}
        {/*<div className="flex-shrink-0 px-5 py-4 border-b border-border/50 bg-card/50">*/}
        {/*  <h2 className="text-base font-semibold flex items-center gap-2">*/}
        {/*    <ImageIcon className="h-5 w-5 text-primary" />*/}
        {/*    预览结果*/}
        {/*  </h2>*/}
        {/*  <p className="text-xs text-muted-foreground mt-1">*/}
        {/*    实时查看生成的二维码*/}
        {/*  </p>*/}
        {/*</div>*/}

        {/* 右侧内容 */}
        <div className="flex-1 overflow-auto p-5 flex flex-col">
          {result ? (
            <div className="flex-1 flex flex-col">
              {/* 二维码预览 */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white p-1 rounded-xl shadow-lg">
                  <img
                    src={result.imageUrl || "/placeholder.svg"}
                    alt="生成的二维码"
                    className="w-60 h-60 object-contain"
                  />
                </div>
              </div>

              {/* 参数信息 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg text-center border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">类型</p>
                  <p className="text-sm font-medium">
                    {result.type === "normal"
                      ? "普通"
                      : result.type === "art"
                        ? "艺术"
                        : "动态"}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg text-center border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">版本</p>
                  <p className="text-sm font-medium">{result.version}</p>
                </div>
              </div>

              {/* 第二行信息 */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg text-center border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">纠错级别</p>
                  <p className="text-sm font-medium">{result.errorLevel}</p>
                </div>
                {result.fileSize && (
                  <div className="bg-muted/30 p-3 rounded-lg text-center border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">
                      文件大小
                    </p>
                    <p className="text-sm font-medium">
                      {result.fileSize < 1024
                        ? `${result.fileSize} B`
                        : result.fileSize < 1024 * 1024
                          ? `${(result.fileSize / 1024).toFixed(1)} KB`
                          : `${(result.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  </div>
                )}
              </div>

              {/* 下载按钮 */}
              <Button size="sm" className="mt-4" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                下载二维码
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 rounded-2xl bg-muted/30 border-2 border-dashed border-border/50 flex items-center justify-center mb-4">
                <QrCode className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">
                暂无二维码
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
                请在左侧配置内容和参数后，点击生成按钮
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
