const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : '/api';

const DEFAULT_USER_ID = 'default-user';

export const goalsApi = {
  async getGoals(userId = DEFAULT_USER_ID) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  async createGoal(goalData, userId = DEFAULT_USER_ID) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: goalData.text || goalData.title,
          description: goalData.description || '',
          goalType: goalData.type,
          aiSuggested: goalData.aiSuggested || false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  async updateGoal(goalId, goalData) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: goalData.text || goalData.title,
          description: goalData.description || '',
          goalType: goalData.type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  async deleteGoal(goalId) {
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  async getGoal(goalId) {
    try {
      const response = await fetch(`${API_BASE_URL}/goal/${goalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goal');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw error;
    }
  }
};

export default goalsApi;