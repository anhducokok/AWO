import React, { useState } from "react";
import { Users, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import usePendingApprovals from "@/hooks/usePendingApprovals";
import {
  StatsCards,
  FilterBar,
  UserList,
  UserDetailsModal,
} from "@/components/admin";

const PendingApprovals = () => {
  const {
    filteredUsers,
    isLoading,
    error,
    stats,
    filters,
    selectedUser,
    handleRefresh,
    handleApprove,
    handleReject,
    handleFilterChange,
    handleViewDetails,
    setSelectedUser,
  } = usePendingApprovals();

  const [showModal, setShowModal] = useState(false);

  const handleViewDetailsWithModal = (user) => {
    handleViewDetails(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-red-600">{error}</p>
            <Button onClick={handleRefresh} className="mt-4" variant="outline">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Danh sách chờ phê duyệt
            </h1>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Quản lý các yêu cầu tham gia hệ thống chưa được phê duyệt
          </p>
          {error && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={isLoading} />

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Users List */}
      <UserList
        users={filteredUsers}
        loading={isLoading}
        onViewDetails={handleViewDetailsWithModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Modal */}
      {showModal && (
        <UserDetailsModal
          user={selectedUser}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default PendingApprovals;
