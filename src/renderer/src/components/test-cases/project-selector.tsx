import { useEffect, useState } from "react";
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
  Loader2,
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
import { Api } from "@/apis";
import type { Directory, Project } from "@/components/TestCase";
import { toast } from "sonner";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedDirectory: Directory | null;
  onProjectSelect: (project: Project) => void;
  onDirectorySelect: (directory: Directory) => void;
}

export function ProjectSelector({
  projects,
  selectedProject,
  selectedDirectory,
  onProjectSelect,
  onDirectorySelect,
}: ProjectSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubDirDialogOpen, setIsSubDirDialogOpen] = useState(false);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [newSubDirectoryName, setNewSubDirectoryName] = useState("");
  const [parentDirectory, setParentDirectory] = useState<Directory | null>(
    null,
  );
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [editingDir, setEditingDir] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [directoryTree, setDirectoryTree] = useState<Directory[]>([]);
  const [isLoadingDirs, setIsLoadingDirs] = useState(false);

  const getTestCaseDirs = async () => {
    if (!selectedProject) return;

    setIsLoadingDirs(true);
    try {
      const response = await window.api.callApi("POSt", Api.getTestCaseDirs, {
        project_id: selectedProject?.id,
      });
      console.log(response);
      const dirs = response.data.dir_tree || [];
      setDirectoryTree(dirs);

      // 默认展开一级目录
      const firstLevelDirs = new Set<string>();
      dirs.forEach((dir: Directory) => {
        if (dir.children && dir.children.length > 0) {
          firstLevelDirs.add(dir.id);
        }
      });
      setExpandedDirs(firstLevelDirs);
    } catch (error) {
      console.error("获取目录树失败:", error);
      setDirectoryTree([]);
    } finally {
      setIsLoadingDirs(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      getTestCaseDirs();
    } else {
      setDirectoryTree([]);
      setExpandedDirs(new Set());
    }
  }, [selectedProject]);

  const toggleDirectory = (dirId: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirId)) {
      newExpanded.delete(dirId);
    } else {
      newExpanded.add(dirId);
    }
    setExpandedDirs(newExpanded);
  };

  const handleAddRootDirectory = async () => {
    if (newDirectoryName.trim()) {
      try {
        await window.api.callApi("POST", Api.addTestCaseDir, {
          project_id: selectedProject?.id,
          name: newDirectoryName,
        });

        // 刷新目录树
        await getTestCaseDirs();

        setNewDirectoryName("");
        setIsDialogOpen(false);
      } catch (error) {
        console.error("添加根目录失败:", error);
      }
    }
  };

  const handleAddSubDirectory = (parentDir: Directory) => {
    setParentDirectory(parentDir);
    setNewSubDirectoryName("");
    setIsSubDirDialogOpen(true);
  };

  const handleConfirmAddSubDirectory = async () => {
    if (newSubDirectoryName.trim() && parentDirectory) {
      const data = await window.api.callApi("POST", Api.addTestCaseDir, {
        project_id: selectedProject?.id,
        name: newSubDirectoryName,
        parent_id: parentDirectory.id,
      });
      if (data.success) {
        toast.success(`添加“${newSubDirectoryName}”成功`);
        // 刷新目录树
        await getTestCaseDirs();
      } else {
        toast.error(data.message);
      }

      // 确保父目录展开以显示新添加的子目录
      const newExpanded = new Set(expandedDirs);
      newExpanded.add(parentDirectory.id);
      setExpandedDirs(newExpanded);

      setNewSubDirectoryName("");
      setIsSubDirDialogOpen(false);
      setParentDirectory(null);
    }
  };
  const handleEditDirectory = (dir: Directory) => {
    setEditingDir(dir.id);
    setEditingName(dir.name);
  };

  const handleSaveEdit = async () => {
    if (editingName.trim()) {
      // Save edit logic here
      console.log("Saving edit:", editingName);
      const data = await window.api.callApi(
        "PUT",
        `${Api.updateTestCaseDir}/${editingDir}`,
        {
          name: editingName,
        },
      );
      if (data.success) {
        await getTestCaseDirs();
        toast.success("更新成功");

        // 确保父目录展开以显示新添加的子目录
        const newExpanded = new Set(expandedDirs);
        if (selectedDirectory) {
          newExpanded.add(selectedDirectory.project_id);
        }
        setExpandedDirs(newExpanded);
      } else {
        toast.error(data.message);
      }

      setEditingDir(null);
      setEditingName("");
    }
  };

  const handleDeleteDirectory = async (dir: Directory) => {
    // Delete directory logic here
    console.log("Deleting directory:", dir.name);
    const data = await window.api.callApi(
      "DELETE",
      `${Api.deleteTestCaseDir}/${dir.id}`,
    );
    if (data.success) {
      toast.success("删除成功");
      await getTestCaseDirs();
    } else {
      toast.error(data.message);
    }
  };
  const renderDirectory = (dir: Directory, level = 0) => {
    const isExpanded = expandedDirs.has(dir.id);
    const hasChildren = dir.children?.length > 0;
    const isSelected = selectedDirectory?.id === dir.id;
    const isEditing = editingDir === dir.id;

    return (
      <div key={dir.id}>
        <div
          className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer transition-all group ${
            isSelected ? "bg-primary/20" : "hover:bg-muted"
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => !isEditing && onDirectorySelect(dir)}
        >
          {hasChildren && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleDirectory(dir.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
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
                <Plus className="h-4 w-4" />
                添加子目录
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditDirectory(dir)}>
                <Edit3 className="h-4 w-4" />
                编辑名称
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteDirectory(dir)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
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
        <div className="p-1 mt-3 ml-2 mb-2">
          <div className="space-y-3">
            <div className="flex gap-1">
              <Select
                value={selectedProject?.id || ""}
                onValueChange={(value) => {
                  const project = projects.find((p) => p.id === value);
                  onProjectSelect(project as Project);
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
                <DialogContent className="bg-card">
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
                        size="sm"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button
                        size="sm"
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

        {/* 子目录添加对话框 */}
        <Dialog open={isSubDirDialogOpen} onOpenChange={setIsSubDirDialogOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>
                添加子目录到 &#34;{parentDirectory?.name}&#34;
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="请输入子目录名称"
                value={newSubDirectoryName}
                onChange={(e) => setNewSubDirectoryName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleConfirmAddSubDirectory()
                }
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubDirDialogOpen(false);
                    setParentDirectory(null);
                    setNewSubDirectoryName("");
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAddSubDirectory}
                  disabled={!newSubDirectoryName.trim()}
                >
                  确定
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div
          className="flex-1 overflow-y-auto"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <div className="ml-2.5 mr-2.5">
            {selectedProject ? (
              <>
                {isLoadingDirs ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50 text-primary" />
                    <p className="text-sm mb-2">加载目录中...</p>
                  </div>
                ) : directoryTree.length > 0 ? (
                  <div className="space-y-1">
                    {directoryTree.map((dir) => renderDirectory(dir))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary" />
                    <p className="text-sm mb-2">暂无目录</p>
                    <p className="text-xs opacity-70">
                      点击上方 + 按钮创建新目录
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary" />
                <p className="text-sm">请先选择一个项目</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
