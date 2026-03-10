import User from "../models/users.model.js";
import { sendEmail } from "../utils/email.js";
import bcrypt from "bcryptjs";

/**
 * Get all pending user approvals
 * GET /api/admin/pending-approvals
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      status: "PENDING",
    })
      .select("-password -refreshToken -resetPasswordToken")
      .sort({ createdAt: -1 }); // Newest first

    // Format data for frontend
    const formattedUsers = pendingUsers.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "Chưa cung cấp",
      requestedRole: user.role,
      department: user.department || "Chưa xác định",
      reason: user.joinReason || "Không có lý do cụ thể",
      experience: user.experience || "Không có thông tin kinh nghiệm",
      submittedAt: user.createdAt,
      status: user.status.toLowerCase(),
      skills: user.skills || [],
      capacityHoursPerWeek: user.capacityHoursPerWeek,
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách chờ duyệt thành công",
      data: formattedUsers,
      count: formattedUsers.length,
    });
  } catch (error) {
    console.error("Error in getPendingApprovals:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách chờ duyệt",
      error: error.message,
    });
  }
};

/**
 * Approve a user
 * POST /api/admin/approve-user/:userId
 */
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { assignedRole, welcomeMessage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Người dùng này đã được xử lý trước đó",
      });
    }

    // Update user status
    user.status = "ACTIVE";
    user.isActive = true;

    // Update role if provided
    if (
      assignedRole &&
      ["member", "leader", "manager"].includes(assignedRole)
    ) {
      user.role = assignedRole;
    }

    await user.save();

    // Send welcome email
    try {
      const emailSubject = "Tài khoản của bạn đã được phê duyệt";
      const emailBody = `
                <h2>Chào mừng ${user.name}!</h2>
                <p>Tài khoản của bạn đã được phê duyệt và bạn có thể bắt đầu sử dụng hệ thống.</p>
                <p><strong>Vai trò được cấp:</strong> ${getRoleLabel(user.role)}</p>
                ${welcomeMessage ? `<p><strong>Lời chào từ quản trị viên:</strong> ${welcomeMessage}</p>` : ""}
                <p>Vui lòng đăng nhập để bắt đầu sử dụng hệ thống.</p>
                <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
            `;

      await sendEmail(user.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Phê duyệt người dùng thành công",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error in approveUser:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phê duyệt người dùng",
      error: error.message,
    });
  }
};

/**
 * Reject a user
 * POST /api/admin/reject-user/:userId
 */
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    if (user.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Người dùng này đã được xử lý trước đó",
      });
    }

    // Update user status
    user.status = "REJECTED";
    user.isActive = false;
    user.rejectionReason = rejectionReason;
    user.rejectedAt = new Date();

    await user.save();

    // Send rejection email
    try {
      const emailSubject = "Thông báo về đơn đăng ký của bạn";
      const emailBody = `
                <h2>Xin chào ${user.name},</h2>
                <p>Cảm ơn bạn đã quan tâm đến hệ thống của chúng tôi.</p>
                <p>Chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn chưa được phê duyệt vào thời điểm này.</p>
                ${rejectionReason ? `<p><strong>Lý do:</strong> ${rejectionReason}</p>` : ""}
                <p>Bạn có thể đăng ký lại sau hoặc liên hệ với chúng tôi để biết thêm chi tiết.</p>
                <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
            `;

      await sendEmail(user.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Don't fail the rejection if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Từ chối người dùng thành công",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error in rejectUser:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi từ chối người dùng",
      error: error.message,
    });
  }
};

/**
 * Get user details for review
 * GET /api/admin/user-details/:userId
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-password -refreshToken -resetPasswordToken",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Format data for frontend
    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "Chưa cung cấp",
      requestedRole: user.role,
      department: user.department || "Chưa xác định",
      reason: user.joinReason || "Không có lý do cụ thể",
      experience: user.experience || "Không có thông tin kinh nghiệm",
      submittedAt: user.createdAt,
      status: user.status.toLowerCase(),
      skills: user.skills || [],
      capacityHoursPerWeek: user.capacityHoursPerWeek,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: userDetails,
    });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin người dùng",
      error: error.message,
    });
  }
};

/**
 * Get admin dashboard stats
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    const [
      pendingCount,
      totalUsers,
      activeUsers,
      managerRequests,
      leaderRequests,
      memberRequests,
    ] = await Promise.all([
      User.countDocuments({ status: "PENDING" }),
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ status: "ACTIVE", isActive: true }),
      User.countDocuments({ status: "PENDING", role: "manager" }),
      User.countDocuments({ status: "PENDING", role: "leader" }),
      User.countDocuments({ status: "PENDING", role: "member" }),
    ]);

    const stats = {
      pendingApprovals: pendingCount,
      totalUsers,
      activeUsers,
      managerRequests,
      leaderRequests,
      memberRequests,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê admin thành công",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getAdminStats:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê admin",
      error: error.message,
    });
  }
};

/**
 * Bulk approve users
 * POST /api/admin/bulk-approve
 */
export const bulkApproveUsers = async (req, res) => {
  try {
    const { userIds, assignedRole, welcomeMessage } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách user IDs không hợp lệ",
      });
    }

    // Update all users at once
    const updateResult = await User.updateMany(
      {
        _id: { $in: userIds },
        status: "PENDING",
      },
      {
        status: "ACTIVE",
        isActive: true,
        ...(assignedRole &&
          ["member", "leader", "manager"].includes(assignedRole) && {
            role: assignedRole,
          }),
      },
    );

    // Get updated users for email notifications
    const updatedUsers = await User.find({
      _id: { $in: userIds },
      status: "ACTIVE",
    }).select("name email role");

    // Send welcome emails (async, don't wait)
    updatedUsers.forEach(async (user) => {
      try {
        const emailSubject = "Tài khoản của bạn đã được phê duyệt";
        const emailBody = `
                    <h2>Chào mừng ${user.name}!</h2>
                    <p>Tài khoản của bạn đã được phê duyệt và bạn có thể bắt đầu sử dụng hệ thống.</p>
                    <p><strong>Vai trò được cấp:</strong> ${getRoleLabel(user.role)}</p>
                    ${welcomeMessage ? `<p><strong>Lời chào từ quản trị viên:</strong> ${welcomeMessage}</p>` : ""}
                    <p>Vui lòng đăng nhập để bắt đầu sử dụng hệ thống.</p>
                    <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
                `;

        await sendEmail(user.email, emailSubject, emailBody);
      } catch (emailError) {
        console.error("Error sending bulk approval email:", emailError);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Phê duyệt thành công ${updateResult.modifiedCount} người dùng`,
      data: {
        approvedCount: updateResult.modifiedCount,
        totalRequested: userIds.length,
      },
    });
  } catch (error) {
    console.error("Error in bulkApproveUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phê duyệt hàng loạt",
      error: error.message,
    });
  }
};

/**
 * Bulk reject users
 * POST /api/admin/bulk-reject
 */
export const bulkRejectUsers = async (req, res) => {
  try {
    const { userIds, rejectionReason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách user IDs không hợp lệ",
      });
    }

    // Update all users at once
    const updateResult = await User.updateMany(
      {
        _id: { $in: userIds },
        status: "PENDING",
      },
      {
        status: "REJECTED",
        isActive: false,
        rejectionReason: rejectionReason,
        rejectedAt: new Date(),
      },
    );

    // Get updated users for email notifications
    const updatedUsers = await User.find({
      _id: { $in: userIds },
      status: "REJECTED",
    }).select("name email");

    // Send rejection emails (async, don't wait)
    updatedUsers.forEach(async (user) => {
      try {
        const emailSubject = "Thông báo về đơn đăng ký của bạn";
        const emailBody = `
                    <h2>Xin chào ${user.name},</h2>
                    <p>Cảm ơn bạn đã quan tâm đến hệ thống của chúng tôi.</p>
                    <p>Chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn chưa được phê duyệt vào thời điểm này.</p>
                    ${rejectionReason ? `<p><strong>Lý do:</strong> ${rejectionReason}</p>` : ""}
                    <p>Bạn có thể đăng ký lại sau hoặc liên hệ với chúng tôi để biết thêm chi tiết.</p>
                    <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
                `;

        await sendEmail(user.email, emailSubject, emailBody);
      } catch (emailError) {
        console.error("Error sending bulk rejection email:", emailError);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Từ chối thành công ${updateResult.modifiedCount} người dùng`,
      data: {
        rejectedCount: updateResult.modifiedCount,
        totalRequested: userIds.length,
      },
    });
  } catch (error) {
    console.error("Error in bulkRejectUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi từ chối hàng loạt",
      error: error.message,
    });
  }
};

/**
 * Get all users for admin management
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = { isDeleted: { $ne: true } };

    if (status && ["PENDING", "ACTIVE", "REJECTED"].includes(status)) {
      query.status = status;
    }

    if (role && ["admin", "member", "manager", "leader"].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken -resetPasswordToken")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người dùng",
      error: error.message,
    });
  }
};

// Helper function to get role label in Vietnamese
const getRoleLabel = (role) => {
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
      return role;
  }
};

export default {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getUserDetails,
  getAdminStats,
  bulkApproveUsers,
  bulkRejectUsers,
  getAllUsers,
};
