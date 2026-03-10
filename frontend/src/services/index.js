/**
 * Service exports for AWO application
 */

export { default as authService } from './auth.service';
export { default as adminService } from './admin.service';
export { default as userService } from './user.service';
export { default as taskService } from './task.service';
export { default as ticketService } from './ticket.service';
export { default as ingestService } from './ingest.service';
export { default as managerService } from './manager.service';
export { default as socketService } from './socket.service';
 * Services Index
 * Export tất cả các services để dễ dàng import
 */

export { authService } from './auth.service';
export { userService } from './user.service';

// Export default object chứa tất cả services
import { authService } from './auth.service';
import { userService } from './user.service';

export default {
    auth: authService,
    user: userService
};
