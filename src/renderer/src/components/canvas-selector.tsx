import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

import {
  Trash2,
  Square,
  X,
  HelpCircle,
  MousePointer,
  Move,
  ZoomIn,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectionArea {
  id: string;
  x: number; // 原始图片上的坐标
  y: number; // 原始图片上的坐标
  width: number; // 原始图片上的宽度
  height: number; // 原始图片上的高度
  label?: string;
  matchScore?: number; // 模板匹配得分
  matchStatus?: "pending" | "matched" | "unmatched"; // 匹配状态
}

interface CanvasSelectorProps {
  imageSrc?: string;
  onSelectionChange?: (selections: SelectionArea[]) => void;
  allowMultipleSelections?: boolean; // 控制是否允许多框选区域
}

export function CanvasSelector({
  imageSrc,
  onSelectionChange,
  allowMultipleSelections = true, // 默认允许多框选区
}: CanvasSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selections, setSelections] = useState<SelectionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] =
    useState<SelectionArea | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // 渲染相关状态
  const [displayScale, setDisplayScale] = useState(1); // 显示比例（用于UI显示）
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 }); // 画布大小
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // 图片原始大小
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }); // 图片在画布上的偏移

  const [zoom, setZoom] = useState(1); // 缩放比例
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false); // 是否正在选择区域
  // 加载图片
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      // 禁用渐进式渲染
      img.crossOrigin = "Anonymous";
      img.decoding = "sync";

      // 先清空画布
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      img.onload = () => {
        // 确保图片完全解码
        if (img.decode) {
          img
            .decode()
            .then(() => {
              setImage(img);
              setImageSize({ width: img.width, height: img.height });
              setupCanvas(img);

              if (containerRef.current) {
                containerRef.current.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }
            })
            .catch(console.error);
        } else {
          setImage(img);
          setImageSize({ width: img.width, height: img.height });
          setupCanvas(img);

          if (containerRef.current) {
            containerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }
      };

      img.onerror = () => console.error("图片加载失败");
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // 添加非被动滚轮事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 处理滚轮事件的函数
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // 获取鼠标在画布上的位置
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // 计算鼠标在图片上的相对位置（0-1范围）
      const relativeX =
        (canvasX - imageOffset.x) / (image!.width * displayScale * zoom);
      const relativeY =
        (canvasY - imageOffset.y) / (image!.height * displayScale * zoom);

      // 计算缩放变化
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3);

      // 计算新的图片尺寸
      const newWidth = image!.width * displayScale * newZoom;
      const newHeight = image!.height * displayScale * newZoom;

      // 计算新的偏移，保持鼠标指向的点不变
      const newOffsetX = canvasX - relativeX * newWidth;
      const newOffsetY = canvasY - relativeY * newHeight;

      // 更新状态
      setZoom(newZoom);
      setImageOffset({ x: newOffsetX, y: newOffsetY });
    };

    // 添加非被动事件监听器
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // 清理函数
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [image, displayScale, zoom, imageOffset]);

  // 监听容器大小变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (image) {
        setupCanvas(image);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [image]);

  // 设置画布
  const setupCanvas = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // 获取容器尺寸
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 设置画布大小为容器大小
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // 计算图片在画布上的显示尺寸和位置
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height,
      );

      const displayWidth = img.width * scale * zoom;
      const displayHeight = img.height * scale * zoom;

      // 计算居中偏移
      const offsetX = (containerWidth - displayWidth) / 2;
      const offsetY = (containerHeight - displayHeight) / 2;

      // 直接使用计算出的值绘制画布，而不是依赖状态更新
      const ctx = canvas.getContext("2d");
      if (ctx && img) {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制图片
        ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);

        // 绘制选择区域（如果有）
        selections.forEach((selection) => {
          const canvasX = selection.x * scale + offsetX;
          const canvasY = selection.y * scale + offsetY;
          const canvasWidth = selection.width * scale;
          const canvasHeight = selection.height * scale;

          ctx.strokeStyle =
            selection.id === selectedAreaId ? "#3b82f6" : "#10b981";
          ctx.lineWidth = selection.id === selectedAreaId ? 3 : 2;
          ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

          ctx.fillStyle =
            selection.id === selectedAreaId
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(16, 185, 129, 0.1)";
          ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);

          if (selection.label) {
            ctx.fillStyle =
              selection.id === selectedAreaId ? "#3b82f6" : "#10b981";
            ctx.font = "12px Arial";
            ctx.fillText(selection.label, canvasX, canvasY - 5);
          }
        });

        // 绘制当前正在绘制的选择区域
        if (currentSelection) {
          const canvasX = currentSelection.x * scale + offsetX;
          const canvasY = currentSelection.y * scale + offsetY;
          const canvasWidth = currentSelection.width * scale;
          const canvasHeight = currentSelection.height * scale;

          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

          ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
          ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);

          ctx.setLineDash([]);
        }
      }

      // 更新状态
      setDisplayScale(scale);
      setCanvasSize({ width: containerWidth, height: containerHeight });
      setImageOffset({ x: offsetX, y: offsetY });
    },
    [selections, selectedAreaId, currentSelection, zoom],
  );

  // 绘制画布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 计算图片显示尺寸
    const displayWidth = image.width * displayScale * zoom;
    const displayHeight = image.height * displayScale * zoom;

    // 绘制图片
    ctx.drawImage(
      image,
      imageOffset.x,
      imageOffset.y,
      displayWidth,
      displayHeight,
    );

    // 绘制所有选择区域
    selections.forEach((selection) => {
      drawSelection(ctx, selection, selection.id === selectedAreaId);
    });

    // 绘制当前正在绘制的选择区域
    if (currentSelection) {
      drawSelection(ctx, currentSelection, true, true);
    }
  }, [
    image,
    selections,
    selectedAreaId,
    currentSelection,
    displayScale,
    imageOffset,
    zoom,
  ]);

  // 绘制选择区域
  const drawSelection = (
    ctx: CanvasRenderingContext2D,
    selection: SelectionArea,
    isSelected: boolean = false,
    isDrawing: boolean = false,
  ) => {
    // 将原始图片坐标转换为画布坐标
    const canvasX = selection.x * displayScale * zoom + imageOffset.x;
    const canvasY = selection.y * displayScale * zoom + imageOffset.y;
    const canvasWidth = selection.width * displayScale * zoom;
    const canvasHeight = selection.height * displayScale * zoom;

    // 根据匹配状态确定颜色
    let strokeColor = "#10b981"; // 默认绿色
    let fillColor = "rgba(16, 185, 129, 0.1)"; // 默认绿色半透明

    if (isDrawing) {
      strokeColor = "#ef4444"; // 绘制中为红色
      fillColor = "rgba(239, 68, 68, 0.1)"; // 红色半透明
    } else if (isSelected) {
      strokeColor = "#3b82f6"; // 选中为蓝色
      fillColor = "rgba(59, 130, 246, 0.1)"; // 蓝色半透明
    } else if (selection.matchStatus === "matched") {
      strokeColor = "#f59e0b"; // 匹配成功为橙色
      fillColor = "rgba(245, 158, 11, 0.2)"; // 橙色半透明
    } else if (selection.matchStatus === "unmatched") {
      strokeColor = "#6b7280"; // 匹配失败为灰色
      fillColor = "rgba(107, 114, 128, 0.1)"; // 灰色半透明
    }

    // 绘制矩形框
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.setLineDash(isDrawing ? [5, 5] : []);
    ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

    // 绘制半透明填充
    ctx.fillStyle = fillColor;
    ctx.fillRect(canvasX, canvasY, canvasWidth, canvasHeight);

    // 绘制标签和匹配分数
    ctx.font = "12px Arial";

    // 绘制标签
    if (selection.label) {
      ctx.fillStyle = strokeColor;
      ctx.fillText(selection.label, canvasX, canvasY - 5);
    }

    // 绘制匹配分数
    if (selection.matchScore !== undefined) {
      const scoreText = `匹配度: ${(selection.matchScore * 100).toFixed(0)}%`;
      ctx.fillStyle = strokeColor;
      ctx.fillText(scoreText, canvasX, canvasY + canvasHeight + 15);
    }

    // 重置线条样式
    ctx.setLineDash([]);
  };

  // 重新绘制画布
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // 将画布坐标转换为原始图片坐标
  const canvasToImageCoordinates = (canvasX: number, canvasY: number) => {
    // 计算相对于图片显示区域的坐标
    const relativeX = canvasX - imageOffset.x;
    const relativeY = canvasY - imageOffset.y;

    // 转换为原始图片坐标
    const imageX = relativeX / (displayScale * zoom);
    const imageY = relativeY / (displayScale * zoom);

    return { x: imageX, y: imageY };
  };

  // 获取鼠标在画布上的坐标（考虑画布缩放）
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // 计算画布的CSS尺寸与实际尺寸的比例
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // 应用比例调整，确保坐标准确
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasCoords = getCanvasCoordinates(e);

    // 检查点击是否在图片区域内
    const isInImageArea =
      canvasCoords.x >= imageOffset.x &&
      canvasCoords.y >= imageOffset.y &&
      canvasCoords.x <= imageOffset.x + image!.width * displayScale * zoom &&
      canvasCoords.y <= imageOffset.y + image!.height * displayScale * zoom;

    if (!isInImageArea) {
      return; // 点击在图片外部，忽略
    }

    // 转换为原始图片坐标
    const imageCoords = canvasToImageCoordinates(
      canvasCoords.x,
      canvasCoords.y,
    );

    // 首先检查是否点击了现有的选择区域（无论是否按下Shift键）
    const clickedSelection = selections.find(
      (selection) =>
        imageCoords.x >= selection.x &&
        imageCoords.x <= selection.x + selection.width &&
        imageCoords.y >= selection.y &&
        imageCoords.y <= selection.y + selection.height,
    );

    if (clickedSelection) {
      setSelectedAreaId(clickedSelection.id);
      return; // 已选中区域，不执行其他操作
    }

    // 根据按键状态决定行为
    if (e.altKey) {
      // 按住Shift键时进行选择区域操作
      setIsSelecting(true);
      setSelectedAreaId(null);
      setIsDrawing(true);
      setStartPoint(imageCoords); // 保存原始图片坐标的起点

      // 如果不允许多框选区，则清除之前的选区
      if (!allowMultipleSelections) {
        setSelections([]);
      }

      setCurrentSelection({
        id: Date.now().toString(),
        x: imageCoords.x,
        y: imageCoords.y,
        width: 0,
        height: 0,
      });
    } else {
      // 点击空白区域且未按Shift，取消选中状态
      setSelectedAreaId(null);

      // 默认行为是拖拽图片
      setIsPanning(true);
      setPanStart({ x: canvasCoords.x, y: canvasCoords.y });
    }
  };

  // 鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 处理拖拽图片
    if (isPanning) {
      const canvasCoords = getCanvasCoordinates(e);
      const dx = canvasCoords.x - panStart.x;
      const dy = canvasCoords.y - panStart.y;
      setImageOffset({
        x: imageOffset.x + dx,
        y: imageOffset.y + dy,
      });
      setPanStart({ x: canvasCoords.x, y: canvasCoords.y });
      return;
    }

    // 处理绘制选择区域
    if (isSelecting && isDrawing && currentSelection) {
      const canvasCoords = getCanvasCoordinates(e);
      const imageCoords = canvasToImageCoordinates(
        canvasCoords.x,
        canvasCoords.y,
      );

      // 计算宽度和高度（在原始图片坐标系中）
      const width = imageCoords.x - startPoint.x;
      const height = imageCoords.y - startPoint.y;

      // 更新当前选择区域（使用原始图片坐标）
      setCurrentSelection({
        ...currentSelection,
        x: width < 0 ? imageCoords.x : startPoint.x,
        y: height < 0 ? imageCoords.y : startPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    }
  };

  // 鼠标抬起事件
  const handleMouseUp = () => {
    // 处理拖拽结束
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // 处理选择区域结束
    if (isSelecting && isDrawing && currentSelection) {
      // 只有当选择区域有一定大小时才添加
      if (currentSelection.width > 5 && currentSelection.height > 5) {
        const newSelections = [...selections, currentSelection];
        setSelections(newSelections);
        // 自动选中新创建的选区
        setSelectedAreaId(currentSelection.id);
        onSelectionChange?.(newSelections);
      }

      setIsDrawing(false);
      setCurrentSelection(null);
    }

    // 重置选择模式
    setIsSelecting(false);
  };

  // 删除选中的区域
  const deleteSelectedArea = () => {
    if (!selectedAreaId) return;

    const newSelections = selections.filter((s) => s.id !== selectedAreaId);
    setSelections(newSelections);
    setSelectedAreaId(null);
    onSelectionChange?.(newSelections);
  };

  // 清空所有选择区域
  const clearAllSelections = () => {
    setSelections([]);
    setSelectedAreaId(null);
    onSelectionChange?.([]);
  };

  // 执行模板匹配
  const [, setIsMatching] = useState<boolean>(false);

  const performTemplateMatching = async () => {
    if (!imageSrc || selections.length === 0) return;

    setIsMatching(true);

    try {
      // 获取当前画布的图像数据
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 将画布转换为数据URL并去掉前缀
      const dataURL = canvas.toDataURL("image/png");
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

      // 直接调用后端API进行模板匹配
      const results = await window.api.callApi("POST", "/api/match", {
        imageData: base64Data,
        selections: selections.map((s) => ({
          id: s.id,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        })),
      });

      if (results && Array.isArray(results)) {
        // 更新选区的匹配状态
        const updatedSelections = selections.map((selection) => {
          const matchResult = results.find(
            (result) => result.id === selection.id,
          );
          if (matchResult) {
            return {
              ...selection,
              matchScore: matchResult.score,
              matchStatus: matchResult.status,
            };
          }
          return selection;
        });

        setSelections(updatedSelections);
        onSelectionChange?.(updatedSelections);

        // 自动高亮匹配成功的选区
        highlightMatchedSelections();
      }
    } catch (error) {
      console.error("模板匹配失败:", error);
    } finally {
      setIsMatching(false);
    }
  };

  // 高亮显示匹配的选区
  const highlightMatchedSelections = () => {
    const matchedSelections = selections.filter(
      (s) => s.matchStatus === "matched",
    );
    if (matchedSelections.length > 0) {
      // 自动选中第一个匹配的选区
      setSelectedAreaId(matchedSelections[0].id);
    }
  };

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        className="flex justify-center items-center h-full overflow-visible relative"
        style={{ height: "70vh" }}
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsPanning(false);
              setIsSelecting(false);
              setIsDrawing(false);
              setCurrentSelection(null);
            }}
            onDoubleClick={() => {
              // 双击重置图片位置和缩放
              setZoom(1);
              if (image && containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;
                const scale = Math.min(
                  containerWidth / image.width,
                  containerHeight / image.height,
                );
                const displayWidth = image.width * scale;
                const displayHeight = image.height * scale;
                const offsetX = (containerWidth - displayWidth) / 2;
                const offsetY = (containerHeight - displayHeight) / 2;
                setImageOffset({ x: offsetX, y: offsetY });
              }
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "65vh",
              width: canvasSize.width,
              height: canvasSize.height,
            }}
          />

          {/* 左上角操作提示按钮 */}
          <div className="absolute left-2 top-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-3">
                  <div className="text-sm font-medium mb-2">操作指南</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Move className="h-3 w-3" />
                      <span>直接拖拽 - 移动图片</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-3 w-3" />
                      <span>Shift+拖拽 - 选择区域</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ZoomIn className="h-3 w-3" />
                      <span>滚轮/按钮 - 缩放图片</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Square className="h-3 w-3" />
                      <span>双击 - 重置位置和缩放</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 左侧悬浮操作按钮 */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={deleteSelectedArea}
                    disabled={!selectedAreaId}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">删除选中区域</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={clearAllSelections}
                    disabled={selections.length === 0}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">清空全部区域</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 右侧悬浮操作按钮 */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
                  >
                    <span className="h-4 w-4">+</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">放大</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                  >
                    <span className="h-4 w-4">-</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">缩小</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={() => setZoom(1)}
                  >
                    <span className="h-4 w-4">1:1</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">重置缩放</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 模板匹配按钮 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-8 h-8 rounded-full shadow-md"
                    onClick={performTemplateMatching}
                    disabled={selections.length === 0}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">执行模板匹配</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            原始尺寸: {imageSize.width} × {imageSize.height} | 显示比例:{" "}
            {(displayScale * 100).toFixed(0)}% | 缩放: {(zoom * 100).toFixed(0)}
            % | 选区数: {selections.length}{" "}
            {selectedAreaId ? "| 已选中一个区域" : ""}
            {selections.filter((s) => s.matchStatus === "matched").length > 0 &&
              ` | 匹配成功: ${selections.filter((s) => s.matchStatus === "matched").length}`}
          </div>
        </div>
      </div>
    </div>
  );
}
