import User from '../models/users.model.js';
import Ticket from '../models/tickets.model.js';

/**
 * Analytics Repository - Handles analytics and overview queries (MongoDB)
 */
class AnalyticsRepository {
  /**
   * Get global overview metrics for manager dashboard
   * @returns {Promise<Object>} Overview metrics
   */
  async getGlobalOverview() {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all tickets
      const allTickets = await Ticket.find({ isDeleted: false }).lean();
      
      // Calculate metrics
      const totalTasks = allTickets.length;
      const overdueTask = allTickets.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && !['done'].includes(t.status)
      ).length;
      
      const highPriorityTasks = allTickets.filter(t => 
        ['high', 'urgent'].includes(t.priority) && !['done'].includes(t.status)
      ).length;

      const slaAtRisk = allTickets.filter(t => {
        if (['done'].includes(t.status)) return false;
        
        // SLA at risk if: due within 24h, low AI confidence, or blocked
        const dueWithin24h = t.dueDate && 
          new Date(t.dueDate) < new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const lowConfidence = t.aiAnalysis?.processed && t.aiAnalysis.confidence < 0.7;
        const isBlocked = t.status === 'blocked';
        
        return dueWithin24h || lowConfidence || isBlocked;
      }).length;

      // Task breakdown
      const statusCounts = {};
      allTickets.forEach(t => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });

      // AI stats (last 7 days)
      const recentTicketsWithAI = allTickets.filter(t => 
        t.aiAnalysis?.processed && new Date(t.createdAt) > oneWeekAgo
      );
      
      const avgConfidence = recentTicketsWithAI.length > 0
        ? recentTicketsWithAI.reduce((sum, t) => sum + (t.aiAnalysis?.confidence || 0), 0) / recentTicketsWithAI.length
        : 0;
      
      const lowConfidenceCount = recentTicketsWithAI.filter(t => 
        t.aiAnalysis?.processed && t.aiAnalysis.confidence < 0.7
      ).length;

      // User stats
      const activeUsers = await User.countDocuments({ 
        isActive: true, 
        isDeleted: false,
        role: { $in: ['member', 'manager', 'admin'] }
      });
      
      const inactiveUsers = await User.countDocuments({ 
        isActive: false,
        role: { $in: ['member', 'manager', 'admin'] }
      });

      return {
        total_tasks: totalTasks,
        overdue_tasks: overdueTask,
        high_priority_tasks: highPriorityTasks,
        sla_at_risk: slaAtRisk,
        unassigned_tasks: statusCounts['open'] || 0,
        in_progress_tasks: statusCounts['in_progress'] || 0,
        in_review_tasks: statusCounts['review'] || 0,
        completed_tasks: statusCounts['done'] || 0,
        blocked_tasks: statusCounts['blocked'] || 0,
        total_ai_suggestions: recentTicketsWithAI.length,
        avg_confidence: avgConfidence,
        low_confidence_count: lowConfidenceCount,
        active_users: activeUsers,
        inactive_users: inactiveUsers
      };
    } catch (error) {
      console.error('Error in getGlobalOverview:', error);
      throw error;
    }
  }

  /**
   * Get AI-driven task queue with priority sorting and risk flags
   * @param {Object} filters - Filter options (status, priority, assignee)
   * @param {number} limit - Number of tasks to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} Task queue with AI metadata
   */
  async getAITaskQueue(filters = {}, limit = 50, offset = 0) {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Build filter
      const query = { isDeleted: false };
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (filters.assignee) query.assignedTo = filters.assignee;
      if (filters.unassigned) query.assignedTo = null;

      // Get count for pagination
      const total = await Ticket.countDocuments(query);

      // Get tickets with user info
      const tickets = await Ticket.find(query)
        .populate('assignedTo', 'name email avatarUrl')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      // Enrich with AI metadata and risk flags
      const tasks = tickets.map(t => {
        // Calculate risk flag
        let riskFlag = null;
        let sortPriority = 8;
        let aiUnsure = false;

        if (t.dueDate && new Date(t.dueDate) < now) {
          riskFlag = 'overdue';
          sortPriority = 1;
        } else if (t.priority === 'urgent') {
          sortPriority = 2;
        } else if (t.dueDate && new Date(t.dueDate) < tomorrow) {
          riskFlag = 'due_soon';
          sortPriority = 3;
        } else if (t.priority === 'high') {
          sortPriority = 4;
        } else if (t.status === 'blocked') {
          riskFlag = 'blocked';
          sortPriority = 5;
        } else if (t.aiAnalysis?.processed && t.aiAnalysis.confidence < 0.7) {
          riskFlag = 'low_confidence';
          aiUnsure = true;
          sortPriority = 6;
        } else if (t.priority === 'medium') {
          sortPriority = 7;
        }

        return {
          id: t._id,
          title: t.subject,
          description: t.description,
          priority: t.priority,
          status: t.status,
          category: t.category,
          estimated_hours: t.estimatedResolutionTime,
          due_date: t.dueDate,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
          reporter_name: t.reporter?.name,
          reporter_email: t.reporter?.email,
          confidence_score: t.aiAnalysis?.confidence,
          ai_category: t.aiAnalysis?.extractedCategory,
          ai_priority: t.aiAnalysis?.extractedPriority,
          current_assignee_id: t.assignedTo?._id,
          current_assignee_name: t.assignedTo?.name,
          current_assignee_avatar: t.assignedTo?.avatarUrl,
          ai_unsure: aiUnsure,
          risk_flag: riskFlag,
          sort_priority: sortPriority
        };
      });

      // Sort by priority
      tasks.sort((a, b) => {
        if (a.sort_priority !== b.sort_priority) {
          return a.sort_priority - b.sort_priority;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      return {
        tasks,
        total,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error in getAITaskQueue:', error);
      throw error;
    }
  }

  /**
   * Get detailed ticket info for manager view
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Detailed ticket information with AI reasoning
   */
  async getManagerTicketDetail(ticketId) {
    try {
      const ticket = await Ticket.findOne({ 
        _id: ticketId, 
        isDeleted: false 
      })
        .populate('assignedTo', 'name email avatarUrl skills')
        .populate('assignedBy', 'name email')
        .lean();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Determine assignment type
      const assignmentType = ticket.assignedBy ? 'manual' : 'ai';

      return {
        ...ticket,
        id: ticket._id,
        title: ticket.subject,
        reporter_name: ticket.reporter?.name,
        reporter_email: ticket.reporter?.email,
        confidence_score: ticket.aiAnalysis?.confidence,
        ai_category: ticket.aiAnalysis?.extractedCategory,
        ai_priority: ticket.aiAnalysis?.extractedPriority,
        ai_processed: ticket.aiAnalysis?.processed,
        ai_processed_at: ticket.aiAnalysis?.processedAt,
        current_assignee_id: ticket.assignedTo?._id,
        current_assignee_name: ticket.assignedTo?.name,
        current_assignee_email: ticket.assignedTo?.email,
        current_assignee_avatar: ticket.assignedTo?.avatarUrl,
        assigned_by_name: ticket.assignedBy?.name,
        assigned_by_email: ticket.assignedBy?.email,
        assignment_type: assignmentType
      };
    } catch (error) {
      console.error('Error in getManagerTicketDetail:', error);
      throw error;
    }
  }

  /**
   * Get team performance metrics
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Performance metrics
   */
  async getTeamPerformance(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      
      // Build date filter
      const dateFilter = { status: 'done', isDeleted: false };
      if (startDate) dateFilter.createdAt = { $gte: new Date(startDate) };
      if (endDate) {
        dateFilter.createdAt = dateFilter.createdAt || {};
        dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get completed tickets
      const completedTickets = await Ticket.find(dateFilter)
        .populate('assignedTo', 'name')
        .lean();

      if (completedTickets.length === 0) {
        return {
          total_completed: 0,
          avg_completion_time_hours: 0,
          avg_estimated_hours: 0,
          avg_actual_hours: 0,
          on_time_count: 0,
          over_time_count: 0,
          user_performance: []
        };
      }

      // Calculate metrics
      let totalCompletionTime = 0;
      let totalEstimated = 0;
      let totalActual = 0;
      let onTimeCount = 0;
      let overTimeCount = 0;
      const userStats = {};

      completedTickets.forEach(t => {
        // Completion time in hours
        const completionHours = (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
        totalCompletionTime += completionHours;

        const estimated = t.estimatedResolutionTime || 0;
        const actual = t.actualHours || completionHours;
        
        totalEstimated += estimated;
        totalActual += actual;

        if (actual <= estimated) onTimeCount++;
        else overTimeCount++;

        // User performance
        if (t.assignedTo) {
          const userId = t.assignedTo._id.toString();
          if (!userStats[userId]) {
            userStats[userId] = {
              user_id: userId,
              user_name: t.assignedTo.name,
              completed_count: 0
            };
          }
          userStats[userId].completed_count++;
        }
      });

      return {
        total_completed: completedTickets.length,
        avg_completion_time_hours: totalCompletionTime / completedTickets.length,
        avg_estimated_hours: totalEstimated / completedTickets.length,
        avg_actual_hours: totalActual / completedTickets.length,
        on_time_count: onTimeCount,
        over_time_count: overTimeCount,
        user_performance: Object.values(userStats)
      };
    } catch (error) {
      console.error('Error in getTeamPerformance:', error);
      throw error;
    }
  }
}

export default new AnalyticsRepository();
