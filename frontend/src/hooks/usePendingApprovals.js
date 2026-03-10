import { useEffect, useMemo } from "react";
import useAdminStore from "@/stores/adminStore";

export const usePendingApprovals = () => {
  const store = useAdminStore();

  // Load data on mount
  useEffect(() => {
    store.loadPendingUsers();
  }, [store.loadPendingUsers]);

  // Computed filtered users
  const filteredUsers = useMemo(() => {
    return store.getFilteredUsers();
  }, [
    store.pendingUsers,
    store.filters.search,
    store.filters.role,
    store.filters.sortBy,
  ]);

  // Computed stats from filtered data
  const computedStats = useMemo(() => {
    return {
      total: filteredUsers.length,
      managerRequests: filteredUsers.filter(
        (u) => u.requestedRole === "manager",
      ).length,
      leaderRequests: filteredUsers.filter((u) => u.requestedRole === "leader")
        .length,
      memberRequests: filteredUsers.filter((u) => u.requestedRole === "member")
        .length,
    };
  }, [filteredUsers]);

  // Actions
  const handleRefresh = () => {
    store.loadPendingUsers();
  };

  const handleApprove = async (userId) => {
    await store.approveUser(userId);
  };

  const handleReject = async (userId) => {
    await store.rejectUser(userId);
  };

  const handleFilterChange = (key, value) => {
    store.updateFilter(key, value);
  };

  const handleViewDetails = (user) => {
    store.setSelectedUser(user);
  };

  return {
    // State
    pendingUsers: store.pendingUsers,
    filteredUsers,
    isLoading: store.isLoading,
    error: store.error,
    stats: computedStats,
    filters: store.filters,
    selectedUser: store.selectedUser,

    // Actions
    handleRefresh,
    handleApprove,
    handleReject,
    handleFilterChange,
    handleViewDetails,
    setSelectedUser: store.setSelectedUser,
    clearSelections: store.clearSelections,
    resetFilters: store.resetFilters,
  };
};

export default usePendingApprovals;
