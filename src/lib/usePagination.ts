import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize: number = 12) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 if current page exceeds total
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    // Use setTimeout to avoid setState during render
    setTimeout(() => setCurrentPage(safePage), 0);
  }

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    paginatedItems,
    currentPage: safePage,
    totalPages,
    setCurrentPage,
    totalItems: items.length,
    pageSize,
  };
}
