import { useAuth } from "@/context/AuthContext";

/**
 * Hook to check if current user has admin permissions
 */
export const useAdminAuth = () => {
  const { user, loading } = useAuth();

  const isAdmin = user?.role === "admin";
  const hasAdminAccess = isAdmin && user?.status === "ACTIVE";

  return {
    isAdmin,
    hasAdminAccess,
    user,
    loading,
  };
};

/**
 * Hook to check if current user has manager or admin permissions
 */
export const useManagerAuth = () => {
  const { user, loading } = useAuth();

  const isManager = user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const hasManagerAccess = (isManager || isAdmin) && user?.status === "ACTIVE";

  return {
    isManager,
    isAdmin,
    hasManagerAccess,
    user,
    loading,
  };
};

/**
 * Hook to get user role information and permissions
 */
export const useUserRole = () => {
  const { user, loading } = useAuth();

  const getUserRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Quản lý";
      case "leader":
        return "Trưởng nhóm";
      case "member":
        return "Thành viên";
      default:
        return "Chưa xác định";
    }
  };

  const getUserStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "PENDING":
        return "Chờ duyệt";
      case "REJECTED":
        return "Đã từ chối";
      default:
        return "Chưa xác định";
    }
  };

  const permissions = {
    canViewAdminPanel: user?.role === "admin",
    canViewManagerPanel: ["admin", "manager"].includes(user?.role),
    canManageUsers: user?.role === "admin",
    canApprovePendingUsers: user?.role === "admin",
    canViewAllTasks: ["admin", "manager", "leader"].includes(user?.role),
    canCreateTasks: ["admin", "manager", "leader"].includes(user?.role),
    canAssignTasks: ["admin", "manager", "leader"].includes(user?.role),
    canViewReports: ["admin", "manager"].includes(user?.role),
    canManageWorkflows: ["admin", "manager"].includes(user?.role),
  };

  return {
    user,
    loading,
    role: user?.role,
    status: user?.status,
    roleLabel: getUserRoleLabel(user?.role),
    statusLabel: getUserStatusLabel(user?.status),
    permissions,
    isActive: user?.status === "ACTIVE",
    isPending: user?.status === "PENDING",
    isRejected: user?.status === "REJECTED",
  };
};

export default {
  useAdminAuth,
  useManagerAuth,
  useUserRole,
};
