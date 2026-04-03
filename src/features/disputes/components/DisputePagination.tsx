import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface Props {
  currentPage: number;
  totalPages: number;
  totalDisputes: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
}

export const DisputePagination = ({
  currentPage,
  totalPages,
  totalDisputes,
  startItem,
  endItem,
  onPageChange,
}: Props) => {
  if (totalDisputes === 0) return null;

  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    },
  );

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-5">
      <div className="text-sm whitespace-nowrap text-cyan-300">
        Showing {startItem} to {endItem} of {totalDisputes} disputes
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="order-1 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="xs:flex order-3 hidden items-center gap-1 sm:order-2">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "neon" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`${
                currentPage === pageNum
                  ? "neon-hover"
                  : "border-white/15 text-cyan-200 hover:bg-cyan-500/10"
              } h-8 min-w-[2rem] px-2 text-xs sm:h-9 sm:min-w-[2.5rem] sm:px-3 sm:text-sm`}
            >
              {pageNum}
            </Button>
          ))}
        </div>

        {/* Mobile page indicator */}
        <div className="xs:hidden order-2 text-sm text-cyan-300 sm:order-3">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="order-4 border-white/15 text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50 sm:order-4"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
