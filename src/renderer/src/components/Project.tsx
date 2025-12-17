import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Settings,
  Trash2,
  Eye,
  Users,
  TestTube,
  Clock,
  Sparkles,
  Save,
  Video,
} from "lucide-react";

import { motion } from "framer-motion";
import { Api } from "@/apis";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-500";
    case "running":
      return "bg-green-500";
    case "completed":
      return "bg-gray-500";
    case "paused":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "活跃";
    case "running":
      return "运行中";
    case "completed":
      return "已完成";
    case "paused":
      return "已暂停";
    default:
      return "未知";
  }
};

export function Project({ action }: { action: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [projectSettings, setProjectSettings] = useState({
    name: "",
    description: "",
    members: "",
    tag: "",
  });

  const getProjectAll = async () => {
    setIsLoading(true);
    const res = await window.api.callApi("GET", Api.Project);
    setProjects(res);
    console.log("获取项目列表", res);
    setIsLoading(false);
  };

  useEffect(() => {
    getProjectAll();
  }, [action]);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleOpenSettings = (project: Project) => {
    setSelectedProject(project);
    setProjectSettings({
      name: project.name,
      description: project.description,
      members: project.members?.join(", ") || "",
      tag: project.tag?.join(", ") || "",
    });
    setSettingsDialogOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      setIsDeleting(true);
      try {
        const res = await window.api.callApi(
          "DELETE",
          `${Api.Project}/${projectToDelete.id}`,
        );
        if (res) {
          toast.success("项目删除成功");
        }
      } catch (error) {
        toast.error("删除项目失败", error || "");
      } finally {
        setIsDeleting(false);
        setProjectToDelete(null);
        setDeleteDialogOpen(false);
        await getProjectAll();
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      const data = await window.api.callApi(
        "PUT",
        `${Api.Project}/${selectedProject.id}`,
        {
          name: projectSettings.name,
          description: projectSettings.description,
          members: projectSettings.members,
          tag: projectSettings.tag,
        },
      );
      if (data) {
        toast.success("项目设置保存成功");
      } else {
        toast.error(data.message);
      }
      await getProjectAll();
    } catch (error) {
      toast.error("保存设置失败", error || "");
    } finally {
      setIsSaving(false);
      setSettingsDialogOpen(false);
      setSelectedProject(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-5"
    >
      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          筛选
        </Button>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部项目</TabsTrigger>
            <TabsTrigger value="active">活跃项目</TabsTrigger>
            <TabsTrigger value="running">运行中</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-1">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-[150px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="h-4 w-[180px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-1">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="relative overflow-hidden h-full"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {project.name}
                            {project.name && (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {project.description}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="h-4 w-4" />
                              运行测试
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenSettings(project)}
                            >
                              <Settings className="h-4 w-4" />
                              设置
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructiv"
                              onClick={() => handleDeleteProject(project)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(project.status)}
                        </Badge>
                        {project.tag &&
                          project.tag.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          <TestTube className="h-4 w-4 text-muted-foreground" />
                          <span>{project.total_tasks} 任务</span>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          <Video className="h-4 w-4 " />
                          <span>{project.total_videos} 视频</span>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{project.members?.length} 成员</span>
                        </motion.div>
                      </div>

                      {/* Team and Last Run */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>创建时间: {project.created_at}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle>项目设置</DialogTitle>
            <DialogDescription>配置项目的基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">项目名称</Label>
                  <Input
                    id="settings-name"
                    value={projectSettings.name}
                    onChange={(e) =>
                      setProjectSettings({
                        ...projectSettings,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-team">团队成员</Label>
                  <Input
                    id="settings-team"
                    value={projectSettings.members}
                    onChange={(e) =>
                      setProjectSettings({
                        ...projectSettings,
                        members: e.target.value,
                      })
                    }
                    placeholder="张三, 李四, 王五"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-description">项目描述</Label>
                <Textarea
                  id="settings-description"
                  value={projectSettings.description}
                  onChange={(e) =>
                    setProjectSettings({
                      ...projectSettings,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="输入项目描述（可选）"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-tags">标签</Label>
                <Input
                  id="settings-tags"
                  value={projectSettings.tag}
                  onChange={(e) =>
                    setProjectSettings({
                      ...projectSettings,
                      tag: e.target.value,
                    })
                  }
                  placeholder="UI测试, 回归测试, 性能测试"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveSettings} size="sm" disabled={isSaving}>
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock className="h-4 w-4" />
                </motion.div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>删除项目</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除项目 &#34;{projectToDelete?.name}&#34;
              吗？此操作将永久删除项目及其所有测试用例和报告，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="h-8"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Clock className="h-4 w-4" />
                </motion.div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "删除中..." : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
