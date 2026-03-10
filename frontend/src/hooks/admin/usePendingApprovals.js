import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

export const usePendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Load pending users
  const loadPendingUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await adminService.getPendingApprovals();
      if (result.success) {
        setPendingUsers(result.data);
      } else {
        // If API fails, use mock data for development
        console.warn("API failed, using mock data:", result.message);
        const mockData = [
          {
            id: 1,
            name: "Nguyễn Văn An",
            email: "nguyen.van.an@example.com",
            phone: "0123456789",
            requestedRole: "manager",
            department: "IT Development",
            reason:
              "Tôi muốn tham gia để hỗ trợ quản lý dự án và phát triển ứng dụng cho công ty.",
            submittedAt: "2024-03-08T10:30:00Z",
            status: "pending",
            experience: "5 năm kinh nghiệm quản lý dự án",
          },
          {
            id: 2,
            name: "Trần Thị Bình",
            email: "tran.thi.binh@example.com",
            phone: "0987654321",
            requestedRole: "member",
            department: "Marketing",
            reason:
              "Muốn tham gia team để học hỏi và đóng góp vào các dự án marketing digital.",
            submittedAt: "2024-03-07T14:15:00Z",
            status: "pending",
            experience: "3 năm kinh nghiệm marketing",
          },
          {
            id: 3,
            name: "Lê Hoàng Minh",
            email: "le.hoang.minh@example.com",
            phone: "0365987412",
            requestedRole: "member",
            department: "Design",
            reason:
              "Tôi có đam mê thiết kế UI/UX và muốn áp dụng kiến thức vào thực tế.",
            submittedAt: "2024-03-06T09:20:00Z",
            status: "pending",
            experience: "2 năm kinh nghiệm thiết kế",
          },
          {
            id: 4,
            name: "Phạm Thị Lan",
            email: "pham.thi.lan@example.com",
            phone: "0912345678",
            requestedRole: "leader",
            department: "Operations",
            reason:
              "Có kinh nghiệm lãnh đạo nhóm và muốn đóng góp vào việc tối ưu hóa quy trình.",
            submittedAt: "2024-03-05T16:45:00Z",
            status: "pending",
            experience: "7 năm kinh nghiệm vận hành",
          },
        ];
        setPendingUsers(mockData);
        setError("Dữ liệu demo - Kết nối với server để xem dữ liệu thực");
      }
    } catch (err) {
      console.error("Error loading pending users:", err);
      setError("Có lỗi xảy ra khi tải danh sách chờ duyệt");
      // Fallback to empty array if both API and mock fail
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter users based on search term, role, and sort
  useEffect(() => {
    let filtered = [...pendingUsers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Role filter
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.requestedRole === selectedRole);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      } else if (sortBy === "oldest") {
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole, sortBy, pendingUsers]);

  // Approve user
  const approveUser = useCallback(async (userId) => {
    try {
      const result = await adminService.approveUser(userId);
      if (result.success) {
        // Remove from pending list
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
        toast.success(result.message || "Phê duyệt người dùng thành công");
        return { success: true };
      } else {
        toast.error(result.message || "Không thể phê duyệt người dùng");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Có lỗi xảy ra khi phê duyệt người dùng");
      return { success: false, error };
    }
  }, []);

  // Reject user
  const rejectUser = useCallback(async (userId) => {
    try {
      const result = await adminService.rejectUser(userId);
      if (result.success) {
        // Remove from pending list
        setPendingUsers((prev) => prev.filter((user) => user.id !== userId));
        toast.success(result.message || "Từ chối người dùng thành công");
        return { success: true };
      } else {
        toast.error(result.message || "Không thể từ chối người dùng");
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Có lỗi xảy ra khi từ chối người dùng");
      return { success: false, error };
    }
  }, []);

  // Get user details
  const getUserDetails = useCallback(async (userId) => {
    try {
      const result = await adminService.getUserDetails(userId);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        toast.error(
          result.message || "Không thể lấy thông tin chi tiết người dùng",
        );
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error("Error getting user details:", error);
      toast.error("Có lỗi xảy ra khi lấy thông tin người dùng");
      return { success: false, error };
    }
  }, []);

  // Helper functions
  const getRoleColor = (role) => {
    switch (role) {
      case "manager":
        return "bg-purple-100 text-purple-800";
      case "leader":
        return "bg-orange-100 text-orange-800";
      case "member":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "manager":
        return "Quản lý";
      case "leader":
        return "Trưởng nhóm";
      case "member":
        return "Thành viên";
      default:
        return role;
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Stats computed from filtered data
  const stats = {
    total: filteredUsers.length,
    managerRequests: filteredUsers.filter((u) => u.requestedRole === "manager")
      .length,
    leaderRequests: filteredUsers.filter((u) => u.requestedRole === "leader")
      .length,
    memberRequests: filteredUsers.filter((u) => u.requestedRole === "member")
      .length,
  };

  // Load data on mount
  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  return {
    // Data
    pendingUsers,
    filteredUsers,
    loading,
    error,
    stats,

    // Filter states
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    sortBy,
    setSortBy,

    // Actions
    loadPendingUsers,
    approveUser,
    rejectUser,
    getUserDetails,

    // Helper functions
    getRoleColor,
    getRoleLabel,
    formatDate,
  };
};

export default usePendingApprovals;
