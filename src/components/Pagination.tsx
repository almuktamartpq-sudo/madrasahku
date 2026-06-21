import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * (pageSize ?? 0) + 1;
  const end = Math.min(currentPage * (pageSize ?? 0), totalItems ?? 0);

  // Generate page numbers to show
  const getPages = () => {
    const pages: (number | "...")[] = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-emerald-100">
      {totalItems != null && pageSize != null ? (
        <p className="text-xs text-emerald-600">
          {start}–{end} dari {totalItems}
        </p>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 w-8 p-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 text-xs text-emerald-400">…</span>
          ) : (
            <Button
              key={i}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 p-0 text-xs ${
                p === currentPage
                  ? "bg-emerald-700 text-white hover:bg-emerald-800"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 w-8 p-0 border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
