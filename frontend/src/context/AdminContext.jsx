import React, { createContext, useContext, useReducer, useEffect } from "react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

// Initial state
const initialState = {
  // Pending approvals
  pendingUsers: [],
  pendingUsersLoading: false,
  pendingUsersError: null,

  // Admin stats
  stats: {
    pendingApprovals: 0,
    totalUsers: 0,
    activeUsers: 0,
    managerRequests: 0,
    leaderRequests: 0,
    memberRequests: 0,
  },
  statsLoading: false,
  statsError: null,

  // All users (for management)
  allUsers: [],
  allUsersLoading: false,
  allUsersError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  },

  // UI state
  selectedUser: null,
  bulkSelectedUsers: [],

  // Filters
  filters: {
    search: "",
    role: "all",
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

// Action types
const ACTIONS = {
  // Pending users
  SET_PENDING_USERS: "SET_PENDING_USERS",
  SET_PENDING_USERS_LOADING: "SET_PENDING_USERS_LOADING",
  SET_PENDING_USERS_ERROR: "SET_PENDING_USERS_ERROR",
  REMOVE_PENDING_USER: "REMOVE_PENDING_USER",

  // Stats
  SET_STATS: "SET_STATS",
  SET_STATS_LOADING: "SET_STATS_LOADING",
  SET_STATS_ERROR: "SET_STATS_ERROR",

  // All users
  SET_ALL_USERS: "SET_ALL_USERS",
  SET_ALL_USERS_LOADING: "SET_ALL_USERS_LOADING",
  SET_ALL_USERS_ERROR: "SET_ALL_USERS_ERROR",
  SET_PAGINATION: "SET_PAGINATION",

  // UI state
  SET_SELECTED_USER: "SET_SELECTED_USER",
  SET_BULK_SELECTED_USERS: "SET_BULK_SELECTED_USERS",
  TOGGLE_BULK_USER_SELECTION: "TOGGLE_BULK_USER_SELECTION",
  CLEAR_BULK_SELECTION: "CLEAR_BULK_SELECTION",

  // Filters
  SET_FILTERS: "SET_FILTERS",
  UPDATE_FILTER: "UPDATE_FILTER",
  RESET_FILTERS: "RESET_FILTERS",
};

// Reducer
const adminReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_PENDING_USERS:
      return { ...state, pendingUsers: action.payload };
    case ACTIONS.SET_PENDING_USERS_LOADING:
      return { ...state, pendingUsersLoading: action.payload };
    case ACTIONS.SET_PENDING_USERS_ERROR:
      return { ...state, pendingUsersError: action.payload };
    case ACTIONS.REMOVE_PENDING_USER:
      return {
        ...state,
        pendingUsers: state.pendingUsers.filter(
          (user) => user.id !== action.payload,
        ),
      };

    case ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    case ACTIONS.SET_STATS_LOADING:
      return { ...state, statsLoading: action.payload };
    case ACTIONS.SET_STATS_ERROR:
      return { ...state, statsError: action.payload };

    case ACTIONS.SET_ALL_USERS:
      return { ...state, allUsers: action.payload };
    case ACTIONS.SET_ALL_USERS_LOADING:
      return { ...state, allUsersLoading: action.payload };
    case ACTIONS.SET_ALL_USERS_ERROR:
      return { ...state, allUsersError: action.payload };
    case ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case ACTIONS.SET_SELECTED_USER:
      return { ...state, selectedUser: action.payload };
    case ACTIONS.SET_BULK_SELECTED_USERS:
      return { ...state, bulkSelectedUsers: action.payload };
    case ACTIONS.TOGGLE_BULK_USER_SELECTION:
      const userId = action.payload;
      const isSelected = state.bulkSelectedUsers.includes(userId);
      return {
        ...state,
        bulkSelectedUsers: isSelected
          ? state.bulkSelectedUsers.filter((id) => id !== userId)
          : [...state.bulkSelectedUsers, userId],
      };
    case ACTIONS.CLEAR_BULK_SELECTION:
      return { ...state, bulkSelectedUsers: [] };

    case ACTIONS.SET_FILTERS:
      return { ...state, filters: action.payload };
    case ACTIONS.UPDATE_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };
    case ACTIONS.RESET_FILTERS:
      return { ...state, filters: initialState.filters };

    default:
      return state;
  }
};

// Context
const AdminContext = createContext();

// Provider component
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Actions
  const actions = {
    // Pending users actions
    loadPendingUsers: async () => {
      dispatch({ type: ACTIONS.SET_PENDING_USERS_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_PENDING_USERS_ERROR, payload: null });

      try {
        const result = await adminService.getPendingApprovals();
        if (result.success) {
          dispatch({ type: ACTIONS.SET_PENDING_USERS, payload: result.data });
        } else {
          dispatch({
            type: ACTIONS.SET_PENDING_USERS_ERROR,
            payload: result.message,
          });
          toast.error(result.message);
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi tải danh sách chờ duyệt";
        dispatch({
          type: ACTIONS.SET_PENDING_USERS_ERROR,
          payload: errorMessage,
        });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: ACTIONS.SET_PENDING_USERS_LOADING, payload: false });
      }
    },

    approveUser: async (userId, approvalData = {}) => {
      try {
        const result = await adminService.approveUser(userId, approvalData);
        if (result.success) {
          dispatch({ type: ACTIONS.REMOVE_PENDING_USER, payload: userId });
          toast.success(result.message);
          // Refresh stats
          actions.loadStats();
          return { success: true };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi phê duyệt người dùng";
        toast.error(errorMessage);
        return { success: false, error };
      }
    },

    rejectUser: async (userId, rejectionData = {}) => {
      try {
        const result = await adminService.rejectUser(userId, rejectionData);
        if (result.success) {
          dispatch({ type: ACTIONS.REMOVE_PENDING_USER, payload: userId });
          toast.success(result.message);
          // Refresh stats
          actions.loadStats();
          return { success: true };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi từ chối người dùng";
        toast.error(errorMessage);
        return { success: false, error };
      }
    },

    // Stats actions
    loadStats: async () => {
      dispatch({ type: ACTIONS.SET_STATS_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_STATS_ERROR, payload: null });

      try {
        const result = await adminService.getAdminStats();
        if (result.success) {
          dispatch({ type: ACTIONS.SET_STATS, payload: result.data });
        } else {
          dispatch({ type: ACTIONS.SET_STATS_ERROR, payload: result.message });
          toast.error(result.message);
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi tải thống kê";
        dispatch({ type: ACTIONS.SET_STATS_ERROR, payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: ACTIONS.SET_STATS_LOADING, payload: false });
      }
    },

    // All users actions
    loadAllUsers: async (params = {}) => {
      dispatch({ type: ACTIONS.SET_ALL_USERS_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ALL_USERS_ERROR, payload: null });

      try {
        const result = await adminService.getAllUsers(params);
        if (result.success) {
          dispatch({ type: ACTIONS.SET_ALL_USERS, payload: result.data });
          if (result.pagination) {
            dispatch({
              type: ACTIONS.SET_PAGINATION,
              payload: result.pagination,
            });
          }
        } else {
          dispatch({
            type: ACTIONS.SET_ALL_USERS_ERROR,
            payload: result.message,
          });
          toast.error(result.message);
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi tải danh sách người dùng";
        dispatch({ type: ACTIONS.SET_ALL_USERS_ERROR, payload: errorMessage });
        toast.error(errorMessage);
      } finally {
        dispatch({ type: ACTIONS.SET_ALL_USERS_LOADING, payload: false });
      }
    },

    // Bulk actions
    bulkApproveUsers: async (userIds, approvalData = {}) => {
      try {
        const result = await adminService.bulkApproveUsers(
          userIds,
          approvalData,
        );
        if (result.success) {
          // Remove approved users from pending list
          userIds.forEach((userId) => {
            dispatch({ type: ACTIONS.REMOVE_PENDING_USER, payload: userId });
          });
          toast.success(result.message);
          actions.loadStats();
          dispatch({ type: ACTIONS.CLEAR_BULK_SELECTION });
          return { success: true };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi phê duyệt hàng loạt";
        toast.error(errorMessage);
        return { success: false, error };
      }
    },

    bulkRejectUsers: async (userIds, rejectionData = {}) => {
      try {
        const result = await adminService.bulkRejectUsers(
          userIds,
          rejectionData,
        );
        if (result.success) {
          // Remove rejected users from pending list
          userIds.forEach((userId) => {
            dispatch({ type: ACTIONS.REMOVE_PENDING_USER, payload: userId });
          });
          toast.success(result.message);
          actions.loadStats();
          dispatch({ type: ACTIONS.CLEAR_BULK_SELECTION });
          return { success: true };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        const errorMessage = "Có lỗi xảy ra khi từ chối hàng loạt";
        toast.error(errorMessage);
        return { success: false, error };
      }
    },

    // UI actions
    setSelectedUser: (user) => {
      dispatch({ type: ACTIONS.SET_SELECTED_USER, payload: user });
    },

    toggleBulkUserSelection: (userId) => {
      dispatch({ type: ACTIONS.TOGGLE_BULK_USER_SELECTION, payload: userId });
    },

    setBulkSelectedUsers: (userIds) => {
      dispatch({ type: ACTIONS.SET_BULK_SELECTED_USERS, payload: userIds });
    },

    clearBulkSelection: () => {
      dispatch({ type: ACTIONS.CLEAR_BULK_SELECTION });
    },

    // Filter actions
    updateFilter: (key, value) => {
      dispatch({ type: ACTIONS.UPDATE_FILTER, payload: { key, value } });
    },

    setFilters: (filters) => {
      dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
    },

    resetFilters: () => {
      dispatch({ type: ACTIONS.RESET_FILTERS });
    },
  };

  // Load initial data
  useEffect(() => {
    actions.loadPendingUsers();
    actions.loadStats();
  }, []);

  const value = {
    state,
    actions,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

// Hook to use admin context
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
};

export default AdminContext;
