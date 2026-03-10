import express from "express";
import {
  getPendingApprovals,
  approveUser,
  rejectUser,
  getUserDetails,
  getAdminStats,
  bulkApproveUsers,
  bulkRejectUsers,
  getAllUsers,
} from "../controllers/admin.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Pending approvals management
router.get("/pending-approvals", getPendingApprovals);
router.post("/approve-user/:userId", approveUser);
router.post("/reject-user/:userId", rejectUser);
router.get("/user-details/:userId", getUserDetails);

// Bulk operations
router.post("/bulk-approve", bulkApproveUsers);
router.post("/bulk-reject", bulkRejectUsers);

// Admin dashboard stats
router.get("/stats", getAdminStats);

// User management
router.get("/users", getAllUsers);

export default router;
