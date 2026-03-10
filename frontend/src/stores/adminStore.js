import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

const useAdminStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // State
        pendingUsers: [],
        isLoading: false,
        error: null,

        // Stats
        stats: {
          total: 0,
          managerRequests: 0,
          leaderRequests: 0,
          memberRequests: 0,
        },
        statsLoading: false,

        // Filters
        filters: {
          search: "",
          role: "all",
          sortBy: "newest",
        },

        // UI State
        selectedUser: null,
        bulkSelectedUsers: [],

        // Actions
        setPendingUsers: (users) =>
          set((state) => {
            state.pendingUsers = users;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        updateFilter: (key, value) =>
          set((state) => {
            state.filters[key] = value;
          }),

        resetFilters: () =>
          set((state) => {
            state.filters = {
              search: "",
              role: "all",
              sortBy: "newest",
            };
          }),

        setSelectedUser: (user) =>
          set((state) => {
            state.selectedUser = user;
          }),

        // Async Actions
        loadPendingUsers: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const result = await adminService.getPendingApprovals();

            if (result.success) {
              set((state) => {
                state.pendingUsers = result.data || [];
                state.isLoading = false;
                // Update stats
                const users = result.data || [];
                state.stats = {
                  total: users.length,
                  managerRequests: users.filter(
                    (u) => u.requestedRole === "manager",
                  ).length,
                  leaderRequests: users.filter(
                    (u) => u.requestedRole === "leader",
                  ).length,
                  memberRequests: users.filter(
                    (u) => u.requestedRole === "member",
                  ).length,
                };
              });
            } else {
              set((state) => {
                state.error = result.message;
                state.isLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = "Không thể tải danh sách chờ duyệt";
              state.isLoading = false;
            });
          }
        },

        approveUser: async (userId) => {
          try {
            const result = await adminService.approveUser(userId);

            if (result.success) {
              set((state) => {
                // Remove approved user from pending list
                state.pendingUsers = state.pendingUsers.filter(
                  (u) => u.id !== userId,
                );
                // Update stats
                const users = state.pendingUsers;
                state.stats.total = users.length;
                state.stats.managerRequests = users.filter(
                  (u) => u.requestedRole === "manager",
                ).length;
                state.stats.leaderRequests = users.filter(
                  (u) => u.requestedRole === "leader",
                ).length;
                state.stats.memberRequests = users.filter(
                  (u) => u.requestedRole === "member",
                ).length;
              });

              toast.success(result.message || "Phê duyệt thành công");
            } else {
              toast.error(result.message);
            }
          } catch (error) {
            toast.error("Có lỗi xảy ra khi phê duyệt");
          }
        },

        rejectUser: async (userId) => {
          try {
            const result = await adminService.rejectUser(userId);

            if (result.success) {
              set((state) => {
                // Remove rejected user from pending list
                state.pendingUsers = state.pendingUsers.filter(
                  (u) => u.id !== userId,
                );
                // Update stats
                const users = state.pendingUsers;
                state.stats.total = users.length;
                state.stats.managerRequests = users.filter(
                  (u) => u.requestedRole === "manager",
                ).length;
                state.stats.leaderRequests = users.filter(
                  (u) => u.requestedRole === "leader",
                ).length;
                state.stats.memberRequests = users.filter(
                  (u) => u.requestedRole === "member",
                ).length;
              });

              toast.success(result.message || "Từ chối thành công");
            } else {
              toast.error(result.message);
            }
          } catch (error) {
            toast.error("Có lỗi xảy ra khi từ chối");
          }
        },

        // Bulk operations
        toggleUserSelection: (userId) =>
          set((state) => {
            if (state.bulkSelectedUsers.includes(userId)) {
              state.bulkSelectedUsers = state.bulkSelectedUsers.filter(
                (id) => id !== userId,
              );
            } else {
              state.bulkSelectedUsers.push(userId);
            }
          }),

        clearSelections: () =>
          set((state) => {
            state.bulkSelectedUsers = [];
          }),

        selectAllUsers: () =>
          set((state) => {
            state.bulkSelectedUsers = state.pendingUsers.map((u) => u.id);
          }),
      })),
      {
        name: "admin-store",
      },
    ),
  ),
);

export default useAdminStore;
