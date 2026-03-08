import {loginController, registerController, refreshTokenController, logoutController} from '../controllers/auth.controller.js';
import {getWorkloadController, getTeamWorkloadController, getAllUsersController, getUserByIdController, createUserByManagerController, getPendingUsersController, approveUserController, rejectUserController} from '../controllers/users.controller.js';
import {authenticate, authorize} from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();


// Auth routes
router.get('/health', (req, res) => {
    res.status(200).send('Auth service is healthy');
});
router.post('/login', loginController);
router.post('/register', registerController);
router.post('/refresh-token', refreshTokenController);
router.post('/logout', logoutController);

// ─── RBAC: Admin approval routes ─────────────────────────────────────────────
router.get('/admin/pending', authenticate, authorize('admin'), getPendingUsersController);
router.patch('/admin/:id/approve', authenticate, authorize('admin'), approveUserController);
router.patch('/admin/:id/reject', authenticate, authorize('admin'), rejectUserController);

// User management routes (protected)
router.get('/', getAllUsersController);
router.post('/create', authenticate, authorize(['admin', 'manager']), createUserByManagerController);
router.get('/:id', authenticate, getUserByIdController);

// Workload routes (protected)
router.get('/:id/workload', authenticate, getWorkloadController);
router.post('/team/workload', authenticate, getTeamWorkloadController);

export default router;