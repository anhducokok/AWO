import {register} from "../service/auth.service.js"
import workloadService from "../service/workload.service.js";
import User from "../models/users.model.js";

/**
 * Manager/Admin tạo user mới
 * POST /api/users/create
 */
export const createUserByManagerController = async (req, res) => {
    const { name, email, password, role, skills, capacityHoursPerWeek, avatarUrl } = req.body;

    // Chỉ cho phép tạo member hoặc leader
    const ALLOWED_ROLES = ['member', 'leader'];

    try {
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'name, email và password là bắt buộc'
            });
        }

        if (role && !ALLOWED_ROLES.includes(role)) {
            return res.status(403).json({
                success: false,
                message: `Manager chỉ được tạo user với role: ${ALLOWED_ROLES.join(', ')}`
            });
        }

        // Admin-created users are immediately ACTIVE — no approval needed
        const result = await register({ name, email, password, role: role || 'member', status: 'ACTIVE' });

        // Cập nhật thêm các trường mở rộng nếu có
        if (skills || capacityHoursPerWeek !== undefined || avatarUrl) {
            await User.findByIdAndUpdate(result.user._id, {
                ...(skills && { skills }),
                ...(capacityHoursPerWeek !== undefined && { capacityHoursPerWeek }),
                ...(avatarUrl && { avatarUrl }),
            });
        }

        res.status(201).json({
            success: true,
            message: 'Tạo user thành công',
            data: result.user
        });
    } catch (error) {
        const isDuplicate = error.message?.toLowerCase().includes('email');
        res.status(isDuplicate ? 409 : 400).json({
            success: false,
            message: error.message
        });
    }
};

export const registerController = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Self-registration: role defaults to member, status defaults to PENDING
        const result = await register({ name, email, password });
        res.status(201).json({
            success: true,
            message: 'Registration successful. Your account is pending admin approval.',
            data: result.user
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

/**
 * Get all users
 * GET /api/users
 */
export const getAllUsersController = async (req, res) => {
    try {
        const users = await User.find(
            { isDeleted: false },
            { password: 0, refreshToken: 0 }
        ).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get users",
            error: error.message
        });
    }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserByIdController = async (req, res) => {
    const { id } = req.params;
    
    try {
        const user = await User.findById(id, { password: 0, refreshToken: 0 });
        
        if (!user || user.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get user",
            error: error.message
        });
    }
};

/**
 * Get user workload metrics
 * GET /api/users/:id/workload
 */
export const getWorkloadController = async (req, res) => {
    const { id: userId } = req.params;
    
    try {
        const workload = await workloadService.calculateUserWorkload(userId);
        res.status(200).json({
            message: "Workload calculated successfully",
            data: workload
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to calculate workload",
            error: error.message
        });
    }
};

/**
 * Get team workload overview
 * POST /api/users/team/workload
 * Body: { teamMemberIds: [...] }
 */
export const getTeamWorkloadController = async (req, res) => {
    const { teamMemberIds } = req.body;
    
    if (!Array.isArray(teamMemberIds) || teamMemberIds.length === 0) {
        return res.status(400).json({
            message: "teamMemberIds must be a non-empty array"
        });
    }
    
    try {
        const teamWorkload = await workloadService.getTeamWorkload(teamMemberIds);
        res.status(200).json({
            message: "Team workload calculated successfully",
            data: teamWorkload
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to calculate team workload",
            error: error.message
        });
    }
};

// ─── RBAC: Admin user-approval management ────────────────────────────────────

/**
 * List all PENDING registrations
 * GET /api/users/admin/pending
 */
export const getPendingUsersController = async (req, res) => {
    try {
        const users = await User.find(
            { status: 'PENDING', isDeleted: false },
            { password: 0, refreshToken: 0 }
        ).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Approve a user registration
 * PATCH /api/users/admin/:id/approve
 */
export const approveUserController = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { status: 'ACTIVE' },
            { new: true, projection: { password: 0, refreshToken: 0 } }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User approved', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Reject a user registration
 * PATCH /api/users/admin/:id/reject
 */
export const rejectUserController = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { status: 'REJECTED' },
            { new: true, projection: { password: 0, refreshToken: 0 } }
        );
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User rejected', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};