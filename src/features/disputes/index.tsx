import { useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useDisputeFilters } from "./hooks/useDisputeFilters";
import { useDisputeList } from "./hooks/useDisputeList";
import { JudgesIntro } from "./components/JudgesIntro";
import { DisputeFilters } from "./components/DisputeFilters";
import { DisputeTable } from "./components/DisputeTable";
import { LoadingScreen } from "./components/LoadingScreen";
import { CreateDisputeModal } from "./components/CreateDisputeModal/Index";

export default function Disputes() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useDisputeList resets currentPage automatically when filters change
  // (loadDisputes has all filter values as dependencies). The onPageReset
  // callback in useDisputeFilters is therefore a no-op here.
  const { filters, actions } = useDisputeFilters(() => undefined);

  const {
    disputes,
    loading,
    currentPage,
    pageSize,
    totalDisputes,
    fetchError,
    isRefetching,
    handleRefetch,
    handlePageChange,
    handlePageSizeChange,
    reload,
  } = useDisputeList(filters);

  const totalPages = Math.ceil(totalDisputes / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalDisputes);

  if (loading && currentPage === 1) return <LoadingScreen />;

  return (
    <div className="relative space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Header row */}
        <div className="col-span-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl text-white">Disputes</h1>
            <Button
              variant="neon"
              className="neon-hover"
              onClick={() => setIsModalOpen(true)}
            >
              <Scale className="mr-2 h-4 w-4" />
              Raise New Dispute
            </Button>
          </div>
          <JudgesIntro />
        </div>

        {/* Filters + Table */}
        <section className="col-span-5 mt-10 space-y-4">
          <DisputeFilters
            searchQuery={filters.searchQuery}
            onSearchChange={actions.setSearchQuery}
            status={filters.status}
            onStatusChange={actions.setStatus}
            dateRange={filters.dateRange}
            onDateRangeChange={actions.setDateRange}
            sortOrder={filters.sortOrder}
            onToggleSort={actions.toggleSortOrder}
            onRefetch={handleRefetch}
            isRefetching={isRefetching}
          />

          <DisputeTable
            disputes={disputes}
            loading={loading}
            fetchError={fetchError}
            totalDisputes={totalDisputes}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            isRefetching={isRefetching}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRefetch={handleRefetch}
          />
        </section>
      </div>

      {/* Modal */}
      <CreateDisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDisputeCreated={reload}
      />
    </div>
  );
}
