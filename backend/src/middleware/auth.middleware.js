import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization?.split(" ")[1];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(authHeader, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    // RBAC: only ACTIVE accounts can access protected routes
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is not active" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// Alias for authenticate - commonly used name
export const protect = authenticate;

// Admin-only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ quản trị viên mới có quyền truy cập",
    });
  }

  next();
};

// Manager or Admin middleware
export const managerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập",
    });
  }

  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Chỉ quản trị viên hoặc quản lý mới có quyền truy cập",
    });
  }

  next();
};
