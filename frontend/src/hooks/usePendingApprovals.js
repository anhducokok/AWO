import { useEffect, useMemo, useCallback } from "react";
import useAdminStore from "@/stores/adminStore";

export const usePendingApprovals = () => {
  // Use selectors to subscribe only to specific parts of the store
  const pendingUsers = useAdminStore((state) => state.pendingUsers);
  const isLoading = useAdminStore((state) => state.isLoading);
  const error = useAdminStore((state) => state.error);
  const filters = useAdminStore((state) => state.filters);
  const selectedUser = useAdminStore((state) => state.selectedUser);

  // Actions - these are stable references from Zustand
  const loadPendingUsers = useAdminStore((state) => state.loadPendingUsers);
  const approveUser = useAdminStore((state) => state.approveUser);
  const rejectUser = useAdminStore((state) => state.rejectUser);
  const updateFilter = useAdminStore((state) => state.updateFilter);
  const setSelectedUser = useAdminStore((state) => state.setSelectedUser);
  const clearSelections = useAdminStore((state) => state.clearSelections);
  const resetFilters = useAdminStore((state) => state.resetFilters);

  // Load data on mount - no dependency needed since loadPendingUsers is stable
  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  // Computed filtered users - now dependencies match what React Compiler expects
  const filteredUsers = useMemo(() => {
    let filtered = [...pendingUsers];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.department?.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    // Role filter
    if (filters.role !== "all") {
      filtered = filtered.filter((user) => user.requestedRole === filters.role);
    }

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === "newest") {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      } else if (filters.sortBy === "oldest") {
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      } else if (filters.sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return filtered;
  }, [pendingUsers, filters.search, filters.role, filters.sortBy]);

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

  // Stable action handlers
  const handleRefresh = useCallback(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const handleApprove = useCallback(
    async (userId) => {
      await approveUser(userId);
    },
    [approveUser],
  );

  const handleReject = useCallback(
    async (userId) => {
      await rejectUser(userId);
    },
    [rejectUser],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      updateFilter(key, value);
    },
    [updateFilter],
  );

  const handleViewDetails = useCallback(
    (user) => {
      setSelectedUser(user);
    },
    [setSelectedUser],
  );

  return {
    // State
    pendingUsers,
    filteredUsers,
    isLoading,
    error,
    stats: computedStats,
    filters,
    selectedUser,

    // Actions
    handleRefresh,
    handleApprove,
    handleReject,
    handleFilterChange,
    handleViewDetails,
    setSelectedUser,
    clearSelections,
    resetFilters,
  };
};

export default usePendingApprovals;
