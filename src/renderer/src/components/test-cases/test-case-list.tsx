import { useState } from "react";
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

interface TestCase {
  id: string;
  name: string;
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
  selectedDirectory: any;
  selectedProject: any;
}

export function TestCaseList({
  selectedDirectory,
  selectedProject,
}: EnhancedTestCaseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock test cases data
  const allTestCases: TestCase[] = [
    {
      id: "1",
      name: "用户登录功能测试",
      description: "验证用户使用正确的用户名和密码能够成功登录",
      creator: "张三",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      status: "active",
      priority: "high",
      tags: ["登录", "认证"],
      executionCount: 25,
      lastResult: "passed",
    },
    {
      id: "2",
      name: "商品搜索功能测试",
      description: "验证商品搜索功能的准确性和性能",
      creator: "李四",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-18",
      status: "active",
      priority: "medium",
      tags: ["搜索", "商品"],
      executionCount: 18,
      lastResult: "failed",
    },
    {
      id: "3",
      name: "购物车添加商品测试",
      description: "验证用户能够成功将商品添加到购物车",
      creator: "王五",
      createdAt: "2024-01-17",
      updatedAt: "2024-01-19",
      status: "draft",
      priority: "medium",
      tags: ["购物车", "商品"],
      executionCount: 12,
      lastResult: "pending",
    },
    {
      id: "4",
      name: "订单提交流程测试",
      description: "验证完整的订单提交和支付流程",
      creator: "赵六",
      createdAt: "2024-01-18",
      updatedAt: "2024-01-21",
      status: "active",
      priority: "critical",
      tags: ["订单", "支付"],
      executionCount: 8,
      lastResult: "passed",
    },
    {
      id: "5",
      name: "用户注册功能测试",
      description: "验证新用户注册流程的完整性",
      creator: "孙七",
      createdAt: "2024-01-19",
      updatedAt: "2024-01-22",
      status: "disabled",
      priority: "high",
      tags: ["注册", "用户"],
      executionCount: 15,
      lastResult: "skipped",
    },
    {
      id: "6",
      name: "用户注册功能测试",
      description: "验证新用户注册流程的完整性",
      creator: "孙七",
      createdAt: "2024-01-19",
      updatedAt: "2024-01-22",
      status: "disabled",
      priority: "high",
      tags: ["注册", "用户"],
      executionCount: 15,
      lastResult: "skipped",
    },
    {
      id: "7",
      name: "用户注册功能测试",
      description: "验证新用户注册流程的完整性",
      creator: "孙七",
      createdAt: "2024-01-19",
      updatedAt: "2024-01-22",
      status: "disabled",
      priority: "high",
      tags: ["注册", "用户"],
      executionCount: 15,
      lastResult: "skipped",
    },
  ];

  // Filter test cases based on search and filters
  const filteredTestCases = allTestCases.filter((testCase) => {
    const matchesSearch =
      testCase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testCase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testCase.creator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || testCase.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || testCase.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTestCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTestCases = filteredTestCases.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
      <Badge variant={variants[status as keyof typeof variants] as any}>
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

  if (!selectedProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>请先选择项目和目录</p>
        </div>
      </div>
    );
  }

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
            {paginatedTestCases.map((testCase) => (
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" />
                        执行
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          显示 {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredTestCases.length)} 条，
          共 {filteredTestCases.length} 条
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
