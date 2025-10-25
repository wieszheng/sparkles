import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Play,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Api } from "@/apis";
import type { Directory, Project } from "@/components/TestCase.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { toast } from "sonner";

interface TestCase {
  id: string;
  name: string;
  content: object;
  description: string;
  creator: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "active" | "disabled" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  executionCount: number;
  lastResult: "passed" | "failed" | "skipped" | "pending";
}

interface EnhancedTestCaseListProps {
  selectedDirectory: Directory | null;
  selectedProject: Project | null;
  onLoadTestCaseWorkflow?: (testCase: TestCase) => void;
}

export function TestCaseList({
  selectedDirectory,
  selectedProject,
  onLoadTestCaseWorkflow,
}: EnhancedTestCaseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTestCases, setTotalTestCases] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  // 防抖搜索
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 获取测试用例数据
  const getTestCases = useCallback(async () => {
    if (!selectedProject || !selectedDirectory) {
      setTestCases([]);
      setTotalTestCases(0);
      return;
    }

    try {
      setLoading(true);

      const params = {
        current: currentPage,
        pageSize: itemsPerPage,
        project_id: selectedProject.id,
        directory_id: selectedDirectory.id,
        // 将搜索和过滤参数传递给后端
        ...(debouncedSearchTerm && { name: debouncedSearchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
      };

      const response = await window.api.callApi(
        "POST",
        Api.getTestCases,
        params,
      );

      if (response?.data) {
        setTestCases(response.data.items || []);
        setTotalTestCases(response.data.total || 0);
      } else {
        setTestCases([]);
        setTotalTestCases(0);
      }
    } catch (err) {
      console.error("获取测试用例失败:", err);
      setTestCases([]);
      setTotalTestCases(0);
    } finally {
      setLoading(false);
    }
  }, [
    selectedDirectory,
    selectedProject,
    currentPage,
    debouncedSearchTerm,
    statusFilter,
    priorityFilter,
  ]);

  // 当依赖项变化时获取数据
  useEffect(() => {
    getTestCases();
  }, [getTestCases]);

  // 当搜索或过滤条件变化时，重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, priorityFilter]);

  // 计算分页信息
  const totalPages = useMemo(() => {
    return Math.ceil(totalTestCases / itemsPerPage);
  }, [totalTestCases, itemsPerPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalTestCases);
  }, [startIndex, itemsPerPage, totalTestCases]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      disabled: "destructive",
      archived: "outline",
    };
    const labels = {
      active: "活跃",
      draft: "草稿",
      disabled: "禁用",
      archived: "归档",
    };
    return (
      <Badge
        variant={
          variants[status as keyof typeof variants] as
            | "default"
            | "secondary"
            | "destructive"
            | "outline"
        }
      >
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    const labels = {
      low: "低",
      medium: "中",
      high: "高",
      critical: "紧急",
    };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getResultBadge = (result: string) => {
    const variants = {
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      skipped: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
    };
    const labels = {
      passed: "通过",
      failed: "失败",
      skipped: "跳过",
      pending: "待执行",
    };
    return (
      <Badge className={variants[result as keyof typeof variants]}>
        {labels[result as keyof typeof labels]}
      </Badge>
    );
  };

  // 执行测试用例（本地执行）
  const handleExecuteTestCase = async (testCase: TestCase) => {
    try {
      console.log("开始执行测试用例:", testCase.name);

      // 显示执行开始提示
      toast.success(`开始执行测试用例: ${testCase.name}`);

      // 检查是否有选中的设备
      if (!selectedProject?.id) {
        toast.error("请先选择项目");
        return;
      }

      // 使用新的执行引擎执行测试用例
      const response = await window.api.executeTestCase(
        testCase,
        selectedProject.id,
      );

      if (response?.success) {
        const result = response.data;
        console.log("测试用例执行结果:", result);

        // 更新测试用例状态
        const updatedTestCase: TestCase = {
          ...testCase,
          executionCount: result.executionCount,
          lastResult:
            result.status === "passed"
              ? "passed"
              : ("failed" as "passed" | "failed" | "skipped" | "pending"),
        };

        // 更新本地状态
        setTestCases((prev) =>
          prev.map((tc) => (tc.id === testCase.id ? updatedTestCase : tc)),
        );

        // 显示执行结果
        if (result.status === "passed") {
          toast.success(
            `测试用例执行成功: ${testCase.name} (耗时: ${result.duration}ms)`,
          );
        } else {
          toast.error(`测试用例执行失败: ${testCase.name} - ${result.error}`);
        }

        // 记录执行日志
        console.log("执行详情:", {
          testCaseId: result.testCaseId,
          testCaseName: result.testCaseName,
          success: result.success,
          duration: result.duration,
          executionCount: result.executionCount,
          status: result.status,
          error: result.error,
        });
      } else {
        toast.error(`测试用例执行失败: ${response?.error || "未知错误"}`);
        console.error("测试用例执行失败:", response?.error);
      }
    } catch (error) {
      console.error("执行测试用例时发生错误:", error);
      toast.error(
        `执行测试用例时发生错误: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  };

  // 加载测试用例工作流到自动化页面
  const handleLoadTestCaseWorkflow = async (testCase: TestCase) => {
    try {
      console.log("加载测试用例工作流:", testCase.name);

      // 获取测试用例详情
      const response = await window.api.callApi(
        "GET",
        `${Api.getTestCase}/${testCase.id}`,
      );
      if (
        response?.data &&
        response.data.content &&
        Object.keys(response.data.content).length > 0
      ) {
        // 调用父组件的加载工作流函数
        console.log("加载工作流:", testCase.content);
        if (onLoadTestCaseWorkflow) {
          onLoadTestCaseWorkflow(response.data.content);
          toast.success(`已加载测试用例工作流: ${testCase.name}`);
        }
      } else {
        toast.error("测试用例没有关联的工作流");
      }
    } catch (error) {
      toast.error(
        `加载工作流失败: ${error instanceof Error ? error.message : "未知错误"}`,
      );
    }
  };

  const handleDeleteTestCase = (testcase: TestCase) => {
    setTestCaseToDelete(testcase);
    setDeleteDialogOpen(true);
  };
  return (
    <div className="h-full flex flex-col ">
      <div className="p-2 space-y-4 ml-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {" "}
              {selectedDirectory ? `${selectedDirectory.name} ` : "所有用例"}
            </h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用例名称、描述或创建人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="disabled">禁用</SelectItem>
              <SelectItem value="archived">归档</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有优先级</SelectItem>
              <SelectItem value="critical">紧急</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用例名称</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>最后结果</TableHead>
              <TableHead>执行次数</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedProject || !selectedDirectory ? (
              <TableRow className="hover:bg-transparen">
                <TableCell colSpan={8} className="text-center py-18">
                  <div className="text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />

                    <p>
                      {!selectedProject
                        ? "请先选择项目"
                        : !selectedDirectory
                          ? "请选择目录"
                          : "请先选择项目和目录"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-18">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2">加载中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : testCases.length === 0 ? (
              <TableRow className="hover:bg-transparen">
                <TableCell colSpan={8} className="text-center py-18">
                  <div className="text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无测试用例数据</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              testCases.map((testCase) => (
                <TableRow
                  key={testCase.id}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell>
                    <div className="font-medium">{testCase.name}</div>
                  </TableCell>
                  <TableCell>{testCase.creator}</TableCell>
                  <TableCell>{testCase.createdAt}</TableCell>
                  <TableCell>{getStatusBadge(testCase.status)}</TableCell>
                  <TableCell>{getPriorityBadge(testCase.priority)}</TableCell>
                  <TableCell>{getResultBadge(testCase.lastResult)}</TableCell>
                  <TableCell>{testCase.executionCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleExecuteTestCase(testCase)}
                        >
                          <Play className="h-4 w-4" />
                          执行
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleLoadTestCaseWorkflow(testCase)}
                        >
                          <Edit className="h-4 w-4" />
                          加载工作流
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteTestCase(testCase)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalTestCases > 0 && (
        <div className="p-4 flex items-center justify-between border-t">
          <div className="text-sm text-muted-foreground">
            显示 {startIndex + 1}-{endIndex} 条，共 {totalTestCases} 条
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>

            <div className="flex items-center gap-1">
              {totalPages <= 7 ? (
                // 如果总页数小于等于7，显示所有页码
                Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      disabled={loading}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ),
                )
              ) : (
                // 如果总页数大于7，显示省略号
                <>
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        1
                      </Button>
                      {currentPage > 4 && <span className="px-2">...</span>}
                    </>
                  )}

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    if (page >= 1 && page <= totalPages) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          disabled={loading}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    }
                    return null;
                  })}

                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2">...</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || loading}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>删除用例</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用例 &#34;{testCaseToDelete?.name}&#34;
              吗？此操作将永久删除用例，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const res = await window.api.callApi(
                  "DELETE",
                  `${Api.deleteTestCase}/${testCaseToDelete?.id}`,
                );
                if (res.success) {
                  toast.success("删除成功");
                } else toast.error(res.message);
                setDeleteDialogOpen(false);
                setTestCaseToDelete(null);
                await getTestCases();
              }}
              className="h-8"
            >
              <Trash2 className="h-4 w-4" />
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
