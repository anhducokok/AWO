import axiosInstance from '../utils/axiosInstance';

export const adminService = {
  // Get all pending user approvals
  getPendingApprovals: async () => {
    try {
      const response = await axiosInstance.get('/admin/pending-approvals');
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error in getPendingApprovals:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy danh sách chờ duyệt',
        error: error
      };
    }
  },

  // Approve a user
  approveUser: async (userId, approvalData = {}) => {
    try {
      const response = await axiosInstance.post(`/admin/approve-user/${userId}`, approvalData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Phê duyệt người dùng thành công'
      };
    } catch (error) {
      console.error('Error in approveUser:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể phê duyệt người dùng',
        error: error
      };
    }
  },

  // Reject a user
  rejectUser: async (userId, rejectionData = {}) => {
    try {
      const response = await axiosInstance.post(`/admin/reject-user/${userId}`, rejectionData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Từ chối người dùng thành công'
      };
    } catch (error) {
      console.error('Error in rejectUser:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể từ chối người dùng',
        error: error
      };
    }
  },

  // Get user details for review
  getUserDetails: async (userId) => {
    try {
      const response = await axiosInstance.get(`/admin/user-details/${userId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error in getUserDetails:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thông tin chi tiết người dùng',
        error: error
      };
    }
  },

  // Get admin dashboard stats
  getAdminStats: async () => {
    try {
      const response = await axiosInstance.get('/admin/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error in getAdminStats:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thống kê admin',
        error: error
      };
    }
  },

  // Get all users for admin management
  getAllUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/users', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy danh sách người dùng',
        error: error
      };
    }
  },

  // Update user role and permissions
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}/role`, roleData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Cập nhật vai trò người dùng thành công'
      };
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể cập nhật vai trò người dùng',
        error: error
      };
    }
  },

  // Deactivate/reactivate user account
  toggleUserStatus: async (userId, status) => {
    try {
      const response = await axiosInstance.patch(`/admin/users/${userId}/status`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || `${status === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`
      };
    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản',
        error: error
      };
    }
  },

  // Send notification to user
  sendNotification: async (userId, notificationData) => {
    try {
      const response = await axiosInstance.post(`/admin/send-notification/${userId}`, notificationData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Gửi thông báo thành công'
      };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể gửi thông báo',
        error: error
      };
    }
  },

  // Bulk approve users
  bulkApproveUsers: async (userIds, approvalData = {}) => {
    try {
      const response = await axiosInstance.post('/admin/bulk-approve', { userIds, ...approvalData });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || `Phê duyệt ${userIds.length} người dùng thành công`
      };
    } catch (error) {
      console.error('Error in bulkApproveUsers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể phê duyệt hàng loạt',
        error: error
      };
    }
  },

  // Bulk reject users
  bulkRejectUsers: async (userIds, rejectionData = {}) => {
    try {
      const response = await axiosInstance.post('/admin/bulk-reject', { userIds, ...rejectionData });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || `Từ chối ${userIds.length} người dùng thành công`
      };
    } catch (error) {
      console.error('Error in bulkRejectUsers:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể từ chối hàng loạt',
        error: error
      };
    }
  }
};

export default adminService;