import workloadRepository from '../repository/workload.repository.js';

class WorkloadService {
  /**
   * Get team workload overview for manager dashboard
   */
  async getTeamWorkloadOverview() {
    try {
      const workload = await workloadRepository.getTeamWorkloadOverview();
      
      return {
        success: true,
        data: workload
      };
    } catch (error) {
      console.error('Error fetching team workload overview:', error);
      throw new Error('Failed to fetch team workload overview');
    }
  }

  /**
   * Get detailed user workload
   */
  async getUserWorkloadDetail(userId) {
    try {
      const workload = await workloadRepository.getUserWorkloadDetail(userId);
      
      return {
        success: true,
        data: workload
      };
    } catch (error) {
      console.error('Error fetching user workload detail:', error);
      throw new Error('Failed to fetch user workload detail');
    }
  }

  /**
   * Get workload balancing suggestions
   */
  async getWorkloadSuggestions() {
    try {
      const suggestions = await workloadRepository.getWorkloadSuggestions();
      
      return {
        success: true,
        data: { suggestions }
      };
    } catch (error) {
      console.error('Error fetching workload suggestions:', error);
      throw new Error('Failed to fetch workload suggestions');
    }
  }

  /**
   * Calculate workload impact of assignment
   */
  async calculateAssignmentImpact(userId, estimatedHours) {
    try {
      const impact = await workloadRepository.calculateWorkloadImpact(userId, estimatedHours);
      
      return {
        success: true,
        data: impact
      };
    } catch (error) {
      console.error('Error calculating workload impact:', error);
      throw new Error('Failed to calculate workload impact');
    }
  }

  /**
   * Calculate user workload (alias for getUserWorkloadDetail)
   * Used by /api/users/:id/workload endpoint
   */
  async calculateUserWorkload(userId) {
    return this.getUserWorkloadDetail(userId);
  }

  /**
   * Get team workload (for multiple users)
   * Used by /api/users/team/workload endpoint
   */
  async getTeamWorkload(userIds) {
    try {
      const workloadPromises = userIds.map(userId => 
        workloadRepository.getUserWorkloadDetail(userId)
      );
      
      const workloads = await Promise.all(workloadPromises);
      
      return {
        success: true,
        data: workloads
      };
    } catch (error) {
      console.error('Error fetching team workload:', error);
      throw new Error('Failed to fetch team workload');
    }
  }
}

export default new WorkloadService();
