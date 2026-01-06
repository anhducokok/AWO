import analyticsRepository from '../repository/analytics.repository.js';

/**
 * Analytics Service - Business logic for analytics and manager dashboard
 */
class AnalyticsService {
  /**
   * Get manager dashboard overview
   */
  async getManagerDashboardOverview() {
    try {
      const overview = await analyticsRepository.getGlobalOverview();

      return {
        success: true,
        data: {
          metrics: {
            total_tasks: parseInt(overview.total_tasks) || 0,
            overdue_tasks: parseInt(overview.overdue_tasks) || 0,
            high_priority_tasks: parseInt(overview.high_priority_tasks) || 0,
            sla_at_risk: parseInt(overview.sla_at_risk) || 0,
          },
          task_breakdown: {
            unassigned: parseInt(overview.unassigned_tasks) || 0,
            in_progress: parseInt(overview.in_progress_tasks) || 0,
            in_review: parseInt(overview.in_review_tasks) || 0,
            completed: parseInt(overview.completed_tasks) || 0,
            blocked: parseInt(overview.blocked_tasks) || 0,
          },
          ai_stats: {
            total_suggestions: parseInt(overview.total_ai_suggestions) || 0,
            average_confidence: parseFloat(overview.avg_confidence) || 0,
            low_confidence_count: parseInt(overview.low_confidence_count) || 0,
          },
          team_stats: {
            active_users: parseInt(overview.active_users) || 0,
            inactive_users: parseInt(overview.inactive_users) || 0,
          }
        }
      };
    } catch (error) {
      console.error('Error fetching manager dashboard overview:', error);
      throw new Error('Failed to fetch dashboard overview');
    }
  }

  /**
   * Get AI-driven task queue
   */
  async getAITaskQueue(filters, page = 1, pageSize = 50) {
    try {
      const offset = (page - 1) * pageSize;
      const result = await analyticsRepository.getAITaskQueue(filters, pageSize, offset);

      return {
        success: true,
        data: {
          tasks: result.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            category: task.category,
            estimated_hours: parseFloat(task.estimated_hours) || 0,
            due_date: task.due_date,
            created_at: task.created_at,
            created_by: {
              name: task.created_by_name
            },
            ai: {
              confidence_score: parseFloat(task.confidence_score) || 0,
              reasoning: task.reasoning,
              suggested_assignee: task.suggested_assignee_id ? {
                id: task.suggested_assignee_id,
                name: task.suggested_assignee_name,
                avatar_url: task.suggested_assignee_avatar
              } : null,
              is_unsure: task.ai_unsure || false
            },
            current_assignee: task.current_assignee_id ? {
              id: task.current_assignee_id,
              name: task.current_assignee_name,
              avatar_url: task.current_assignee_avatar
            } : null,
            assigned_by: task.assigned_by_id ? {
              id: task.assigned_by_id,
              name: task.assigned_by_name
            } : null,
            risk_flag: task.risk_flag,
            flags: this._generateTaskFlags(task)
          })),
          pagination: {
            total: result.total,
            page: page,
            page_size: pageSize,
            total_pages: Math.ceil(result.total / pageSize)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching AI task queue:', error);
      throw new Error('Failed to fetch task queue');
    }
  }

  /**
   * Get manager-specific ticket detail
   */
  async getManagerTicketDetail(ticketId) {
    try {
      const ticket = await analyticsRepository.getManagerTicketDetail(ticketId);

      return {
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            category: ticket.category,
            estimated_hours: parseFloat(ticket.estimated_hours) || 0,
            actual_hours: parseFloat(ticket.actual_hours) || 0,
            due_date: ticket.due_date,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            created_by: {
              name: ticket.created_by_name,
              email: ticket.created_by_email
            }
          },
          ai_analysis: {
            confidence_score: parseFloat(ticket.confidence_score) || 0,
            reasoning: ticket.reasoning,
            raw_response: ticket.ai_raw_response,
            model_version: ticket.model_version,
            suggested_assignee: ticket.suggested_assignee_id ? {
              id: ticket.suggested_assignee_id,
              name: ticket.suggested_assignee_name,
              email: ticket.suggested_assignee_email,
              avatar_url: ticket.suggested_assignee_avatar,
              skills: ticket.suggested_assignee_skills
            } : null
          },
          assignment: {
            type: ticket.assignment_type,
            current_assignee: ticket.current_assignee_id ? {
              id: ticket.current_assignee_id,
              name: ticket.current_assignee_name,
              email: ticket.current_assignee_email,
              avatar_url: ticket.current_assignee_avatar
            } : null,
            assigned_by: ticket.assigned_by_id ? {
              id: ticket.assigned_by_id,
              name: ticket.assigned_by_name
            } : null,
            assigned_at: ticket.assigned_at,
            notes: ticket.assignment_notes
          }
        }
      };
    } catch (error) {
      console.error('Error fetching manager ticket detail:', error);
      throw new Error('Failed to fetch ticket detail');
    }
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(startDate, endDate) {
    try {
      const performance = await analyticsRepository.getTeamPerformance({ startDate, endDate });

      return {
        success: true,
        data: {
          total_completed: parseInt(performance.total_completed) || 0,
          avg_completion_time_hours: parseFloat(performance.avg_completion_time_hours) || 0,
          avg_estimated_hours: parseFloat(performance.avg_estimated_hours) || 0,
          avg_actual_hours: parseFloat(performance.avg_actual_hours) || 0,
          on_time_percentage: performance.total_completed > 0 
            ? (parseInt(performance.on_time_count) / parseInt(performance.total_completed)) * 100 
            : 0,
          user_performance: performance.user_performance || []
        }
      };
    } catch (error) {
      console.error('Error fetching team performance:', error);
      throw new Error('Failed to fetch team performance');
    }
  }

  /**
   * Generate task flags based on conditions
   * @private
   */
  _generateTaskFlags(task) {
    const flags = [];

    if (task.risk_flag === 'overdue') {
      flags.push({ type: 'danger', label: 'Overdue', icon: 'alert-circle' });
    }

    if (task.risk_flag === 'due_soon') {
      flags.push({ type: 'warning', label: 'Due Soon', icon: 'clock' });
    }

    if (task.risk_flag === 'blocked') {
      flags.push({ type: 'danger', label: 'Blocked', icon: 'x-circle' });
    }

    if (task.ai_unsure || task.risk_flag === 'low_confidence') {
      flags.push({ type: 'warning', label: 'AI Unsure', icon: 'help-circle' });
    }

    if (task.priority === 'urgent') {
      flags.push({ type: 'danger', label: 'Urgent', icon: 'zap' });
    } else if (task.priority === 'high') {
      flags.push({ type: 'warning', label: 'High Priority', icon: 'arrow-up' });
    }

    if (!task.current_assignee_id) {
      flags.push({ type: 'info', label: 'Unassigned', icon: 'user-x' });
    }

    return flags;
  }
}

export default new AnalyticsService();
