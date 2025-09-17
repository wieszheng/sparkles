import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  description: string;
  testCount: number;
  lastModified: string;
}

interface Directory {
  id: string;
  name: string;
  path: string;
  children: Directory[];
  testCaseCount: number;
  isExpanded?: boolean;
}

interface ProjectSelectorProps {
  selectedProject: Project | null;
  selectedDirectory: Directory | null;
  onProjectSelect: (project: Project | null) => void;
  onDirectorySelect: (directory: Directory) => void;
}

export function ProjectSelector({
  selectedProject,
  selectedDirectory,
  onProjectSelect,
  onDirectorySelect,
}: ProjectSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [hoveredDir, setHoveredDir] = useState<string | null>(null);
  const [editingDir, setEditingDir] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const projects: Project[] = [
    {
      id: "1",
      name: "电商移动端测试",
      description: "移动端电商应用的UI自动化测试项目",
      testCount: 45,
      lastModified: "2小时前",
    },
    {
      id: "2",
      name: "后台管理系统",
      description: "管理后台的功能测试和回归测试",
      testCount: 32,
      lastModified: "1天前",
    },
    {
      id: "3",
      name: "API接口测试",
      description: "核心业务API的接口自动化测试",
      testCount: 28,
      lastModified: "3天前",
    },
  ];

  const directoryTree: Directory[] = selectedProject
    ? [
        {
          id: "root",
          name: selectedProject.name,
          path: "/",
          testCaseCount: 45,
          children: [
            {
              id: "login",
              name: "登录模块",
              path: "/login",
              testCaseCount: 8,
              children: [
                {
                  id: "login-basic",
                  name: "基础登录",
                  path: "/login/basic",
                  testCaseCount: 5,
                  children: [],
                },
                {
                  id: "login-social",
                  name: "第三方登录",
                  path: "/login/social",
                  testCaseCount: 3,
                  children: [],
                },
              ],
            },
            {
              id: "product",
              name: "商品模块",
              path: "/product",
              testCaseCount: 15,
              children: [
                {
                  id: "product-search",
                  name: "商品搜索",
                  path: "/product/search",
                  testCaseCount: 6,
                  children: [],
                },
                {
                  id: "product-detail",
                  name: "商品详情",
                  path: "/product/detail",
                  testCaseCount: 9,
                  children: [],
                },
              ],
            },
            {
              id: "cart",
              name: "购物车模块",
              path: "/cart",
              testCaseCount: 12,
              children: [],
            },
            {
              id: "order",
              name: "订单模块",
              path: "/order",
              testCaseCount: 10,
              children: [],
            },
          ],
        },
      ]
    : [];

  const toggleDirectory = (dirId: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirId)) {
      newExpanded.delete(dirId);
    } else {
      newExpanded.add(dirId);
    }
    setExpandedDirs(newExpanded);
  };

  const handleAddRootDirectory = () => {
    if (newDirectoryName.trim()) {
      // Add root directory logic here
      setNewDirectoryName("");
      setIsDialogOpen(false);
    }
  };

  const handleAddSubDirectory = (parentDir: Directory) => {
    // Add subdirectory logic here
    console.log("Adding subdirectory to:", parentDir.name);
  };
  const handleEditDirectory = (dir: Directory) => {
    setEditingDir(dir.id);
    setEditingName(dir.name);
  };

  const handleSaveEdit = () => {
    if (editingName.trim()) {
      // Save edit logic here
      console.log("Saving edit:", editingName);
      setEditingDir(null);
      setEditingName("");
    }
  };

  const handleDeleteDirectory = (dir: Directory) => {
    // Delete directory logic here
    console.log("Deleting directory:", dir.name);
  };
  const renderDirectory = (dir: Directory, level = 0) => {
    const isExpanded = expandedDirs.has(dir.id);
    const hasChildren = dir.children.length > 0;
    const isSelected = selectedDirectory?.id === dir.id;
    const isHovered = hoveredDir === dir.id;
    const isEditing = editingDir === dir.id;
    console.log("rendering directory:", isHovered);
    return (
      <div key={dir.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all group ${
            isSelected ? "bg-primary/10 " : "hover:bg-muted"
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => !isEditing && onDirectorySelect(dir)}
          onMouseEnter={() => setHoveredDir(dir.id)}
          onMouseLeave={() => setHoveredDir(null)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(dir.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          {!hasChildren && <div className="w-4" />}

          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}

          {isEditing ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") {
                  setEditingDir(null);
                  setEditingName("");
                }
              }}
              onBlur={handleSaveEdit}
              className="flex-1 h-6 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm font-medium truncate">
              {dir.name}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddSubDirectory(dir)}>
                <Plus className="h-4 w-4 mr-2" />
                添加子目录
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditDirectory(dir)}>
                <Edit3 className="h-4 w-4 mr-2" />
                编辑名称
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteDirectory(dir)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除目录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {dir.children.map((child) => renderDirectory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="p-2 mt-2 ml-2">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select
                value={selectedProject?.id || ""}
                onValueChange={(value) => {
                  const project = projects.find((p) => p.id === value);
                  onProjectSelect(project || null);
                }}
              >
                <SelectTrigger className="flex-1 bg-transparent">
                  <SelectValue placeholder="选择项目..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="font-medium">{project.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!selectedProject}
                        className="px-3 bg-transparent"
                        onClick={() => {
                          if (selectedProject) {
                            setIsDialogOpen(true);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>新建根目录</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新建</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="请输入目录名称"
                      value={newDirectoryName}
                      onChange={(e) => setNewDirectoryName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddRootDirectory()
                      }
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleAddRootDirectory}
                        disabled={!newDirectoryName.trim()}
                      >
                        确定
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {selectedProject ? (
              <div className="space-y-1">
                {directoryTree.map((dir) => renderDirectory(dir))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">请先选择一个项目</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
