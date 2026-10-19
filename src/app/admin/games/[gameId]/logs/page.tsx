"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getDoc } from "firebase/firestore";
import { gameRef } from "@/lib/firebase/refs";
import { useItoGameLogs, useItoQuestions } from "@/lib/hooks/useItoGameLogs";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";

// Custom hooks
import { useLogFilters } from "./hooks/useLogFilters";
import { useLogActions } from "./hooks/useLogActions";

// Components
import { LogFilters } from "./components/LogFilters";
import { LogAnalytics } from "./components/LogAnalytics";
import { LogTable } from "./components/LogTable";
import { LogCards } from "./components/LogCards";

// Modal components
import { EditAnswerModal } from "./components/modals/EditAnswerModal";
import { DeleteConfirmModal } from "./components/modals/DeleteConfirmModal";
import { DeleteTestLogsModal } from "./components/modals/DeleteTestLogsModal";

export default function ItoGameLogsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;

  const [gameName, setGameName] = useState<string>("Game");

  // Auth check + auto-logout after 8 hours of inactivity
  const { user, loading } = useAdminAuth(async () => {
    // Fetch game name
    try {
      const gameSnap = await getDoc(gameRef(gameId));
      if (gameSnap.exists()) {
        setGameName(gameSnap.data().name || "Game");
      }
    } catch (error) {
      console.error("Error fetching game:", error);
    }
  });

  // Data
  const { logs, loading: logsLoading } = useItoGameLogs();
  const { questions, loading: questionsLoading } = useItoQuestions();

  // Custom hooks
  const filters = useLogFilters(logs);
  const actions = useLogActions(logs);

  // Pagination
  const [displayCount, setDisplayCount] = useState(20);
  const LOAD_MORE_COUNT = 20;

  // Calculate statistics
  const testLogsCount = logs.filter(log => log.isTest).length;
  const editedLogsCount = logs.filter(log => log.isEdited).length;

  if (loading || logsLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/admin/games/${gameId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {gameName} Logs
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <LogFilters
          selectedAgeRange={filters.selectedAgeRange}
          setSelectedAgeRange={filters.setSelectedAgeRange}
          selectedQuestion={filters.selectedQuestion}
          setSelectedQuestion={filters.setSelectedQuestion}
          minNumber={filters.minNumber}
          setMinNumber={filters.setMinNumber}
          maxNumber={filters.maxNumber}
          setMaxNumber={filters.setMaxNumber}
          selectedEditStatus={filters.selectedEditStatus}
          setSelectedEditStatus={filters.setSelectedEditStatus}
          selectedTestStatus={filters.selectedTestStatus}
          setSelectedTestStatus={filters.setSelectedTestStatus}
          startDate={filters.startDate}
          setStartDate={filters.setStartDate}
          endDate={filters.endDate}
          setEndDate={filters.setEndDate}
          questions={questions}
          totalLogs={logs.length}
          filteredCount={filters.filteredLogs.length}
          hasActiveFilters={filters.hasActiveFilters}
          onResetFilters={filters.resetFilters}
        />

        {/* Analytics Section */}
        <LogAnalytics
          totalLogs={logs.length}
          filteredLogs={filters.filteredLogs.length}
          testLogsCount={testLogsCount}
          editedLogsCount={editedLogsCount}
          displayCount={Math.min(displayCount, filters.filteredLogs.length)}
          onDeleteAllTestLogs={() => actions.setShowDeleteTestConfirm(true)}
        />

        {/* Logs Display */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              รายการ Logs
            </h2>
          </div>

          {/* Desktop Table View */}
          <LogTable
            logs={filters.filteredLogs.slice(0, displayCount)}
            questions={questions}
            sortField={filters.sortField}
            sortDirection={filters.sortDirection}
            onSort={filters.handleSort}
            onEdit={actions.openEditModal}
            onDelete={(logId, answer) => actions.setDeleteConfirm({ logId, answer })}
          />

          {/* Mobile Cards View */}
          <LogCards
            logs={filters.filteredLogs.slice(0, displayCount)}
            questions={questions}
            onEdit={actions.openEditModal}
            onDelete={(logId, answer) => actions.setDeleteConfirm({ logId, answer })}
          />

          {/* Load More Buttons */}
          {displayCount < filters.filteredLogs.length && (
            <div className="flex gap-2 mt-6 justify-center">
              <button
                onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                โหลดเพิ่มเติม ({LOAD_MORE_COUNT} รายการ)
              </button>
              <button
                onClick={() => setDisplayCount(filters.filteredLogs.length)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                โหลดทั้งหมด ({filters.filteredLogs.length} รายการ)
              </button>
            </div>
          )}

          {/* No Results */}
          {filters.filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
              <p className="mt-1 text-sm text-gray-500">ลองปรับเปลี่ยนตัวกรองเพื่อค้นหาข้อมูลอื่น</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditAnswerModal
        isOpen={!!actions.editingLog}
        currentAnswer={actions.editingLog?.currentAnswer || ""}
        editedAnswer={actions.editedAnswer}
        isUpdating={actions.isUpdating}
        onClose={actions.closeEditModal}
        onSubmit={actions.handleEditAnswer}
        onAnswerChange={actions.setEditedAnswer}
      />

      <DeleteConfirmModal
        isOpen={!!actions.deleteConfirm}
        answer={actions.deleteConfirm?.answer || ""}
        isDeleting={actions.isDeleting}
        onClose={() => actions.setDeleteConfirm(null)}
        onConfirm={() => actions.handleDeleteLogs([actions.deleteConfirm!.logId])}
      />

      <DeleteTestLogsModal
        isOpen={actions.showDeleteTestConfirm}
        testLogsCount={testLogsCount}
        isDeleting={actions.isDeletingTest}
        onClose={() => actions.setShowDeleteTestConfirm(false)}
        onConfirm={actions.handleDeleteAllTestLogs}
      />
    </div>
  );
}
