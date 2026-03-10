import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export const useAdminData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalUsers: 0,
    activeUsers: 0,
    managerRequests: 0,
    leaderRequests: 0,
    memberRequests: 0,
  });

  // Load admin stats
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getAdminStats();
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Không thể tải thống kê admin");
      console.error("Error loading admin stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve user
  const approveUser = useCallback(
    async (userId, approvalData = {}) => {
      try {
        const result = await adminService.approveUser(userId, approvalData);
        if (result.success) {
          toast.success(result.message || "Phê duyệt người dùng thành công");
          // Refresh stats
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message || "Không thể phê duyệt người dùng");
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error approving user:", error);
        toast.error("Có lỗi xảy ra khi phê duyệt người dùng");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  // Reject user
  const rejectUser = useCallback(
    async (userId, rejectionData = {}) => {
      try {
        const result = await adminService.rejectUser(userId, rejectionData);
        if (result.success) {
          toast.success(result.message || "Từ chối người dùng thành công");
          // Refresh stats
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message || "Không thể từ chối người dùng");
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error rejecting user:", error);
        toast.error("Có lỗi xảy ra khi từ chối người dùng");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  // Bulk operations
  const bulkApproveUsers = useCallback(
    async (userIds, approvalData = {}) => {
      try {
        const result = await adminService.bulkApproveUsers(
          userIds,
          approvalData,
        );
        if (result.success) {
          toast.success(result.message);
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error bulk approving users:", error);
        toast.error("Có lỗi xảy ra khi phê duyệt hàng loạt");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  const bulkRejectUsers = useCallback(
    async (userIds, rejectionData = {}) => {
      try {
        const result = await adminService.bulkRejectUsers(
          userIds,
          rejectionData,
        );
        if (result.success) {
          toast.success(result.message);
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error bulk rejecting users:", error);
        toast.error("Có lỗi xảy ra khi từ chối hàng loạt");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  // Update user role
  const updateUserRole = useCallback(
    async (userId, roleData) => {
      try {
        const result = await adminService.updateUserRole(userId, roleData);
        if (result.success) {
          toast.success(result.message);
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        toast.error("Có lỗi xảy ra khi cập nhật vai trò");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  // Toggle user status
  const toggleUserStatus = useCallback(
    async (userId, status) => {
      try {
        const result = await adminService.toggleUserStatus(userId, status);
        if (result.success) {
          toast.success(result.message);
          loadStats();
          return { success: true, data: result.data };
        } else {
          toast.error(result.message);
          return { success: false, message: result.message };
        }
      } catch (error) {
        console.error("Error toggling user status:", error);
        toast.error("Có lỗi xảy ra khi thay đổi trạng thái tài khoản");
        return { success: false, error };
      }
    },
    [loadStats],
  );

  // Send notification
  const sendNotification = useCallback(async (userId, notificationData) => {
    try {
      const result = await adminService.sendNotification(
        userId,
        notificationData,
      );
      if (result.success) {
        toast.success(result.message);
        return { success: true, data: result.data };
      } else {
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Có lỗi xảy ra khi gửi thông báo");
      return { success: false, error };
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    loading,
    error,
    stats,
    loadStats,
    approveUser,
    rejectUser,
    bulkApproveUsers,
    bulkRejectUsers,
    updateUserRole,
    toggleUserStatus,
    sendNotification,
  };
};

export default useAdminData;
