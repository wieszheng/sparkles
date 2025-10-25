import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 最多显示的页码数量

    if (totalPages <= maxVisible) {
      // 页数少时显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 页数多时使用智能显示
      pages.push(1);

      // 计算显示范围
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // 调整范围以显示足够的页码
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      if (startPage > 2) pages.push("...");
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        title="首页"
        className={cn(
          "rounded-lg p-1.5 transition-colors",
          currentPage === 1
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100",
        )}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={cn(
          "rounded-lg p-1.5 transition-colors",
          currentPage === 1
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === "number" && onPageChange(page)}
          disabled={page === "..."}
          className={cn(
            "h-7 min-w-7 rounded-full text-xs font-medium transition-colors",
            page === "..."
              ? "cursor-default text-gray-400"
              : page === currentPage
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-100",
          )}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={cn(
          "rounded-lg p-1.5 transition-colors",
          currentPage === totalPages
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="末页"
        className={cn(
          "rounded-lg p-1.5 transition-colors",
          currentPage === totalPages
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100",
        )}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
