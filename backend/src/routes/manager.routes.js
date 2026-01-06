import express from 'express';
import analyticsService from '../service/analytics.service.js';
import workloadService from '../service/workload.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/manager/dashboard/overview
 * @desc    Get global overview metrics for manager dashboard
 * @access  Private (Manager/Team Lead only)
 */
router.get('/dashboard/overview', authenticate, async (req, res) => {
  try {
    // Check if user has manager/team_lead role
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const result = await analyticsService.getManagerDashboardOverview();
    res.json(result);
  } catch (error) {
    console.error('Error in dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/workload/team
 * @desc    Get team workload overview with heatmap data
 * @access  Private (Manager/Team Lead only)
 */
router.get('/workload/team', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const result = await workloadService.getTeamWorkloadOverview();
    res.json(result);
  } catch (error) {
    console.error('Error in team workload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/workload/user/:userId
 * @desc    Get detailed workload for specific user
 * @access  Private (Manager/Team Lead only)
 */
router.get('/workload/user/:userId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const { userId } = req.params;
    const result = await workloadService.getUserWorkloadDetail(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in user workload detail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/workload/suggestions
 * @desc    Get workload balancing suggestions
 * @access  Private (Manager/Team Lead only)
 */
router.get('/workload/suggestions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const result = await workloadService.getWorkloadSuggestions();
    res.json(result);
  } catch (error) {
    console.error('Error in workload suggestions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/v1/manager/workload/impact
 * @desc    Calculate workload impact of assignment
 * @access  Private (Manager/Team Lead only)
 */
router.post('/workload/impact', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const { userId, estimatedHours } = req.body;

    if (!userId || !estimatedHours) {
      return res.status(400).json({
        success: false,
        message: 'userId and estimatedHours are required'
      });
    }

    const result = await workloadService.calculateAssignmentImpact(userId, estimatedHours);
    res.json(result);
  } catch (error) {
    console.error('Error calculating workload impact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/tasks/queue
 * @desc    Get AI-driven task queue with filters
 * @access  Private (Manager/Team Lead only)
 */
router.get('/tasks/queue', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const {
      status,
      priority,
      assignee,
      unassigned,
      page = 1,
      page_size = 50
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignee) filters.assignee = assignee;
    if (unassigned === 'true') filters.unassigned = true;

    const result = await analyticsService.getAITaskQueue(
      filters,
      parseInt(page),
      parseInt(page_size)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in AI task queue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/tickets/:ticketId
 * @desc    Get manager-specific ticket detail with AI reasoning
 * @access  Private (Manager/Team Lead only)
 */
router.get('/tickets/:ticketId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const { ticketId } = req.params;
    const result = await analyticsService.getManagerTicketDetail(ticketId);
    res.json(result);
  } catch (error) {
    console.error('Error in manager ticket detail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/v1/manager/analytics/performance
 * @desc    Get team performance metrics
 * @access  Private (Manager/Team Lead only)
 */
router.get('/analytics/performance', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'team_lead' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Team Lead role required.'
      });
    }

    const { start_date, end_date } = req.query;
    const result = await analyticsService.getTeamPerformance(start_date, end_date);
    res.json(result);
  } catch (error) {
    console.error('Error in team performance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

export default router;
