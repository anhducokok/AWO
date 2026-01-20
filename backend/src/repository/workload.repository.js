import User from '../models/users.model.js';
import Ticket from '../models/tickets.model.js';

/**
 * Workload Repository - Handles all workload-related database operations (MongoDB)
 */
class WorkloadRepository {
  /**
   * Get team workload overview
   * @returns {Promise<Array>} List of users with their workload metrics
   */
  async getTeamWorkloadOverview() {
    try {
      // Get all active users (members and managers)
      const users = await User.find({
        isActive: true,
        isDeleted: false,
        role: { $in: ['member', 'manager', 'admin'] }
      }).lean();

      // For each user, calculate their workload
      const workloadData = await Promise.all(users.map(async (user) => {
        // Get assigned tickets that are not done or blocked
        const tickets = await Ticket.find({
          assignedTo: user._id,
          isDeleted: false,
          status: { $nin: ['done', 'blocked'] }
        }).lean();

        // Calculate metrics
        let currentWorkloadHours = 0;
        let weightedPoints = 0;
        let overdueCount = 0;
        let highPriorityCount = 0;
        const now = new Date();

        tickets.forEach(ticket => {
          const estimatedHours = ticket.estimatedResolutionTime || 0;
          currentWorkloadHours += estimatedHours;

          // Calculate weighted points
          const priorityWeight = {
            urgent: 2.0,
            high: 1.5,
            medium: 1.0,
            low: 0.5
          };
          weightedPoints += estimatedHours * (priorityWeight[ticket.priority] || 1.0);

          // Count overdue
          if (ticket.dueDate && new Date(ticket.dueDate) < now) {
            overdueCount++;
          }

          // Count high priority
          if (ticket.priority === 'high' || ticket.priority === 'urgent') {
            highPriorityCount++;
          }
        });

        const capacityHours = user.capacityHoursPerWeek || 40;
        const utilization = capacityHours > 0 ? currentWorkloadHours / capacityHours : 0;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar_url: user.avatarUrl || null,
          capacity_hours_per_week: capacityHours,
          skills: user.skills || [],
          active_tasks: tickets.length,
          current_workload_hours: currentWorkloadHours,
          weighted_points: weightedPoints,
          overdue_count: overdueCount,
          high_priority_count: highPriorityCount,
          utilization: utilization,
          status: this._getWorkloadStatus(currentWorkloadHours, capacityHours)
        };
      }));

      // Sort by weighted points descending
      return workloadData.sort((a, b) => b.weighted_points - a.weighted_points);
    } catch (error) {
      console.error('Error in getTeamWorkloadOverview:', error);
      throw error;
    }
  }

  /**
   * Get detailed workload for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User workload details with tasks
   */
  async getUserWorkloadDetail(userId) {
    try {
      const user = await User.findOne({
        _id: userId,
        isActive: true,
        isDeleted: false
      }).lean();

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's tickets
      const tickets = await Ticket.find({
        assignedTo: userId,
        isDeleted: false,
        status: { $nin: ['done'] }
      })
      .sort({ priority: 1, dueDate: 1 })
      .lean();

      // Calculate workload
      let currentWorkload = 0;
      let overdueCount = 0;
      let highPriorityCount = 0;
      const now = new Date();

      const tasks = tickets.map(ticket => {
        const estimatedHours = ticket.estimatedResolutionTime || 0;
        currentWorkload += estimatedHours;

        if (ticket.dueDate && new Date(ticket.dueDate) < now) {
          overdueCount++;
        }

        if (ticket.priority === 'high' || ticket.priority === 'urgent') {
          highPriorityCount++;
        }

        return {
          id: ticket._id.toString(),
          title: ticket.subject,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          estimated_hours: estimatedHours,
          due_date: ticket.dueDate,
          created_at: ticket.createdAt,
          confidence_score: ticket.aiAnalysis?.confidence || null,
          ai_processed: ticket.aiAnalysis?.processed || false
        };
      });

      const capacityHours = user.capacityHoursPerWeek || 40;
      const utilization = capacityHours > 0 ? currentWorkload / capacityHours : 0;

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar_url: user.avatarUrl || null,
          capacity_hours_per_week: capacityHours,
          skills: user.skills || []
        },
        workload: {
          current_hours: currentWorkload,
          capacity_hours: capacityHours,
          utilization: utilization,
          status: this._getWorkloadStatus(currentWorkload, capacityHours),
          task_count: tasks.length,
          overdue_count: overdueCount,
          high_priority_count: highPriorityCount
        },
        tasks: tasks
      };
    } catch (error) {
      console.error('Error in getUserWorkloadDetail:', error);
      throw error;
    }
  }

  /**
   * Get workload balancing suggestions
   * @returns {Promise<Array>} List of suggestions for workload redistribution
   */
  async getWorkloadSuggestions() {
    try {
      // Get all users with their workload
      const teamWorkload = await this.getTeamWorkloadOverview();

      const suggestions = [];
      const overloadedUsers = teamWorkload.filter(u => u.utilization > 0.9);
      const underloadedUsers = teamWorkload.filter(u => u.utilization < 0.6);

      // For each overloaded user, suggest reassignments
      for (const overloadedUser of overloadedUsers) {
        const tickets = await Ticket.find({
          assignedTo: overloadedUser.id,
          isDeleted: false,
          status: { $in: ['open', 'assigned', 'in_progress'] }
        })
        .sort({ priority: -1, dueDate: 1 })
        .limit(3)
        .lean();

        for (const ticket of tickets) {
          const bestMatch = this._findBestMatchForTask(ticket, underloadedUsers, overloadedUser.skills);
          
          if (bestMatch) {
            const estimatedHours = ticket.estimatedResolutionTime || 0;
            suggestions.push({
              type: 'reassignment',
              reason: 'workload_balancing',
              from_user: {
                id: overloadedUser.id,
                name: overloadedUser.name,
                current_utilization: overloadedUser.utilization
              },
              to_user: {
                id: bestMatch.id,
                name: bestMatch.name,
                current_utilization: bestMatch.utilization
              },
              ticket: {
                id: ticket._id.toString(),
                title: ticket.subject,
                priority: ticket.priority,
                estimated_hours: estimatedHours
              },
              impact: {
                from_new_utilization: (overloadedUser.current_workload_hours - estimatedHours) / overloadedUser.capacity_hours_per_week,
                to_new_utilization: (bestMatch.current_workload_hours + estimatedHours) / bestMatch.capacity_hours_per_week
              }
            });
          }
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error in getWorkloadSuggestions:', error);
      throw error;
    }
  }

  /**
   * Calculate workload impact of assigning a ticket to a user
   * @param {string} userId - User ID
   * @param {number} estimatedHours - Estimated hours for the new ticket
   * @returns {Promise<Object>} Workload impact analysis
   */
  async calculateWorkloadImpact(userId, estimatedHours) {
    try {
      const user = await User.findById(userId).lean();
      
      if (!user) {
        throw new Error('User not found');
      }

      const tickets = await Ticket.find({
        assignedTo: userId,
        isDeleted: false,
        status: { $nin: ['done', 'blocked'] }
      }).lean();

      let currentWorkload = 0;
      tickets.forEach(ticket => {
        currentWorkload += ticket.estimatedResolutionTime || 0;
      });

      const capacityHours = user.capacityHoursPerWeek || 40;
      const currentUtilization = currentWorkload / capacityHours;
      const newWorkload = currentWorkload + parseFloat(estimatedHours);
      const newUtilization = newWorkload / capacityHours;

      return {
        user_id: user._id.toString(),
        user_name: user.name,
        current_workload: currentWorkload,
        new_workload: newWorkload,
        capacity: capacityHours,
        current_utilization: currentUtilization,
        new_utilization: newUtilization,
        utilization_change: newUtilization - currentUtilization,
        status_before: this._getWorkloadStatus(currentWorkload, capacityHours),
        status_after: this._getWorkloadStatus(newWorkload, capacityHours),
        warning: newUtilization > 0.9 ? 'User will be overloaded' : newUtilization > 0.75 ? 'User will be busy' : null
      };
    } catch (error) {
      console.error('Error in calculateWorkloadImpact:', error);
      throw error;
    }
  }

  /**
   * Get workload status based on utilization
   * @private
   */
  _getWorkloadStatus(currentHours, capacityHours) {
    if (capacityHours === 0) return 'unknown';
    const utilization = currentHours / capacityHours;
    
    if (utilization >= 0.9) return 'overload'; // Red
    if (utilization >= 0.75) return 'busy';     // Yellow
    return 'available';                          // Green
  }

  /**
   * Find best match for a task from available users
   * @private
   */
  _findBestMatchForTask(task, availableUsers, taskSkills) {
    if (availableUsers.length === 0) return null;

    // Simple skill matching - can be enhanced
    let bestScore = -1;
    let bestUser = null;

    for (const user of availableUsers) {
      let score = 0;
      
      // Skill match (if task category matches user skills)
      if (user.skills && taskSkills) {
        const userSkillsArray = Array.isArray(user.skills) ? user.skills : [];
        const taskSkillsArray = Array.isArray(taskSkills) ? taskSkills : [];
        const matchingSkills = userSkillsArray.filter(skill => 
          taskSkillsArray.some(ts => ts.toLowerCase().includes(skill.toLowerCase()))
        );
        score += matchingSkills.length * 10;
      }

      // Prefer less loaded users
      const utilization = user.current_workload / user.capacity_hours_per_week;
      score += (1 - utilization) * 5;

      if (score > bestScore) {
        bestScore = score;
        bestUser = user;
      }
    }

    return bestUser;
  }
}

export default new WorkloadRepository();
