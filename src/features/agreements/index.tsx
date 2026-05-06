// src/pages/Agreements.tsx
import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { useAgreementList } from "./hooks/useAgreementList";
import { AgreementFilters } from "./components/AgreementFilters";
import { AgreementTable } from "./components/AgreementTable";
import { CreateAgreementModal } from "./components/CreateAgreementModal/index";
import { AgreementsPageLoadingScreen } from "./components/AgreementsPageLoadingScreen";

export default function Agreements() {
  const { isAuthenticated, user, isAuthInitialized } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    agreements,
    loading,
    currentPage,
    error,
    pageSize,
    totalAgreements,
    tableFilter,
    setTableFilter,
    searchQuery,
    setSearchQuery,
    sortOrder,
    toggleSortOrder,
    handlePageChange,
    handlePageSizeChange,
    loadAgreements,
    isFetching,
  } = useAgreementList();

  if (loading && agreements.length === 0) {
    return <AgreementsPageLoadingScreen />;
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl text-white">Agreements</h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="neon"
              className="neon-hover"
            >
              <FileText className="mr-2 h-4 w-4" />
              Create Agreement
            </Button>

            <div className="hidden sm:flex">
              {isAuthenticated && isAuthInitialized ? (
                <div className="flex items-center gap-2 text-sm text-cyan-300">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span>
                    {user?.telegram?.username
                      ? `Authenticated as @${user.telegram.username}`
                      : "Please connect Telegram account"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-300">
                  <div className="h-2 w-2 rounded-full bg-orange-400" />
                  <span>Not authenticated</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <AgreementFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tableFilter={tableFilter}
            onFilterChange={setTableFilter}
            sortOrder={sortOrder}
            onToggleSort={toggleSortOrder}
            loading={isFetching}
            onRefetch={loadAgreements}
          />

          {/* Table */}
          <AgreementTable
            agreements={agreements}
            loading={isFetching}
            error={error}
            totalAgreements={totalAgreements}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {/* Modal */}
      <CreateAgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAgreements}
      />
    </div>
  );
}
