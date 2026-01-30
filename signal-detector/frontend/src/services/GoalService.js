/**
 * GoalService
 * Abstração centralizada para operações de Goals
 * Encapsula toda a lógica de API para goals/objetivos
 */

const API_BASE_URL = '/api/goals';

const getUserFromStorage = () => {
  try {
    const user = typeof window !== 'undefined'
      ? localStorage.getItem('signalRuidoUser')
      : null;
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export class GoalService {
  /**
   * Busca todos os objetivos do usuário
   * @param {string} userId - ID do usuário (opcional, usa localStorage se não fornecido)
   * @returns {Promise<Array>} Array de objetivos
   */
  static async getGoals(userId = null) {
    const user = getUserFromStorage();
    const actualUserId = userId || (user ? user.id : 'production-user');

    if (!actualUserId) {
      throw new Error('User ID is required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${actualUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUserId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  /**
   * Cria um novo objetivo
   * @param {Object} goalData - Dados do objetivo
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Object>} Objetivo criado
   */
  static async createGoal(goalData, userId = null) {
    const user = getUserFromStorage();
    const actualUserId = userId || (user ? user.id : 'production-user');

    if (!actualUserId) {
      throw new Error('User ID is required');
    }

    if (!goalData.title && !goalData.text) {
      throw new Error('Goal title is required');
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUserId
        },
        body: JSON.stringify({
          userId: actualUserId,
          title: goalData.text || goalData.title,
          description: goalData.description || '',
          goalType: goalData.type || 'general',
          aiSuggested: goalData.aiSuggested || false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Atualiza um objetivo existente
   * @param {string} goalId - ID do objetivo
   * @param {Object} goalData - Dados a atualizar
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Object>} Objetivo atualizado
   */
  static async updateGoal(goalId, goalData, userId = null) {
    const user = getUserFromStorage();
    const actualUserId = userId || (user ? user.id : 'production-user');

    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUserId
        },
        body: JSON.stringify({
          title: goalData.text || goalData.title,
          description: goalData.description || '',
          goalType: goalData.type || 'general'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  /**
   * Deleta um objetivo
   * @param {string} goalId - ID do objetivo
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Object>} Confirmação de deleção
   */
  static async deleteGoal(goalId, userId = null) {
    const user = getUserFromStorage();
    const actualUserId = userId || (user ? user.id : 'production-user');

    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUserId
        },
        body: JSON.stringify({ goalId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  /**
   * Busca um objetivo específico por ID
   * @param {string} goalId - ID do objetivo
   * @param {string} userId - ID do usuário (opcional)
   * @returns {Promise<Object>} Objetivo encontrado
   */
  static async getGoal(goalId, userId = null) {
    const user = getUserFromStorage();
    const actualUserId = userId || (user ? user.id : 'production-user');

    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${goalId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': actualUserId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw error;
    }
  }

  /**
   * Busca progresso de um objetivo
   * @param {string} goalId - ID do objetivo
   * @returns {Promise<Object>} Dados de progresso
   */
  static async getGoalProgress(goalId) {
    if (!goalId) {
      throw new Error('Goal ID is required');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${goalId}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goal progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      throw error;
    }
  }
}
