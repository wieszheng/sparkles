import { useState } from "react";
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
  CheckCircle,
  Clock,
  Sparkles,
  Save,
} from "lucide-react";

import { motion } from "framer-motion";

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

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  progress: number;
  testCases: number;
  passRate: number;
  lastRun: string;
  team: string[];
  aiInsights: boolean;
  template?: string;
  tags?: string[];
}

export function Project() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "电商APP测试",
      description: "主要电商应用的UI自动化测试套件",
      status: "active",
      progress: 75,
      testCases: 156,
      passRate: 92,
      lastRun: "2小时前",
      team: ["张三", "李四", "王五"],
      aiInsights: true,
      template: "mobile",
      tags: ["UI测试", "回归测试"],
    },
    {
      id: 2,
      name: "支付系统测试",
      description: "支付流程关键路径测试",
      status: "running",
      progress: 45,
      testCases: 89,
      passRate: 88,
      lastRun: "正在运行",
      team: ["赵六", "钱七"],
      aiInsights: true,
      template: "api",
      tags: ["支付", "安全测试"],
    },
    {
      id: 3,
      name: "用户注册流程",
      description: "新用户注册和验证流程测试",
      status: "completed",
      progress: 100,
      testCases: 67,
      passRate: 95,
      lastRun: "1天前",
      team: ["孙八", "周九", "吴十"],
      aiInsights: false,
      template: "web",
      tags: ["用户流程"],
    },
    {
      id: 4,
      name: "移动端适配测试",
      description: "多设备兼容性测试项目",
      status: "paused",
      progress: 30,
      testCases: 234,
      passRate: 78,
      lastRun: "3天前",
      team: ["郑十一"],
      aiInsights: true,
      template: "mobile",
      tags: ["兼容性", "移动端"],
    },
  ]);

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [projectSettings, setProjectSettings] = useState({
    name: "",
    description: "",
    team: "",
    tags: "",
    aiInsights: false,
    notifications: true,
    autoRun: false,
    maxConcurrent: 5,
    timeout: 30,
  });

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
      team: project.team.join(", "),
      tags: project.tags?.join(", ") || "",
      aiInsights: project.aiInsights,
      notifications: true,
      autoRun: false,
      maxConcurrent: 5,
      timeout: 30,
    });
    setSettingsDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleSaveSettings = () => {
    if (!selectedProject) return;

    const updatedProjects = projects.map((p) =>
      p.id === selectedProject.id
        ? {
            ...p,
            name: projectSettings.name,
            description: projectSettings.description,
            team: projectSettings.team.split(",").map((t) => t.trim()),
            tags: projectSettings.tags.split(",").map((t) => t.trim()),
            aiInsights: projectSettings.aiInsights,
          }
        : p,
    );

    setProjects(updatedProjects);
    setSettingsDialogOpen(false);
    setSelectedProject(null);
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部项目</TabsTrigger>
          <TabsTrigger value="active">活跃项目</TabsTrigger>
          <TabsTrigger value="running">运行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {project.name}
                        {project.aiInsights && (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {project.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          className="text-destructive"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                    {project.tags &&
                      project.tags.map((tag, index) => (
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

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-muted-foreground" />
                      <span>{project.testCases} 用例</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{project.passRate}% 通过</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{project.team.length} 成员</span>
                    </div>
                  </div>

                  {/* Team and Last Run */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>最后运行: {project.lastRun}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
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
                    value={projectSettings.team}
                    onChange={(e) =>
                      setProjectSettings({
                        ...projectSettings,
                        team: e.target.value,
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
                  value={projectSettings.tags}
                  onChange={(e) =>
                    setProjectSettings({
                      ...projectSettings,
                      tags: e.target.value,
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
            <Button onClick={handleSaveSettings} size="sm">
              <Save className="h-4 w-4" />
              保存
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
            <AlertDialogAction onClick={confirmDeleteProject} className="h-8">
              <Trash2 className="h-4 w-4" />
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
