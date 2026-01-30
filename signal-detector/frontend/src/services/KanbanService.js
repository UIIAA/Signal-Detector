/**
 * KanbanService
 * Abstração centralizada para operações de Kanban
 * Encapsula toda a lógica de API e cálculos de classificação
 */

import { calculateSignalScore, generateReasoning } from '../lib/signalCalculator';

const API_BASE_URL = '/api/kanban';

export class KanbanService {
  /**
   * Constructor
   * @param {Function} fetchFn - Custom fetch function (e.g., fetchWithAuth from AuthContext)
   */
  constructor(fetchFn = fetch) {
    this.fetchFn = fetchFn;
  }

  /**
   * Busca todas as tarefas do usuário com filtros opcionais
   * @param {Object} filters - Filtros opcionais { status, projeto, classificacao, gera_receita }
   * @returns {Promise<Object>} { tasks, stats }
   */
  async getTasks(filters = {}) {
    try {
      const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      const url = queryParams.toString()
        ? `${API_BASE_URL}?${queryParams}`
        : API_BASE_URL;

      const response = await this.fetchFn(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova tarefa
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Object>} { task }
   */
  async createTask(taskData) {
    if (!taskData.titulo) {
      throw new Error('Task title is required');
    }

    try {
      const response = await this.fetchFn(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma tarefa existente
   * @param {string} taskId - ID da tarefa
   * @param {Object} updates - Campos a atualizar
   * @returns {Promise<Object>} { task }
   */
  async updateTask(taskId, updates) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    try {
      const response = await this.fetchFn(`${API_BASE_URL}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Deleta (soft delete) uma tarefa
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Object>} { deleted, id }
   */
  async deleteTask(taskId) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    try {
      const response = await this.fetchFn(`${API_BASE_URL}/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Classifica uma tarefa usando IA (ou regras como fallback)
   * @param {string} taskId - ID da tarefa
   * @param {boolean} useAI - Usar IA para classificação avançada
   * @returns {Promise<Object>} { task, classification }
   */
  async classifyTask(taskId, useAI = false) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    try {
      const response = await this.fetchFn(`${API_BASE_URL}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, useAI })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to classify task');
      }

      return await response.json();
    } catch (error) {
      console.error('Error classifying task:', error);
      throw error;
    }
  }

  /**
   * Calcula score SINAL/RUÍDO para uma tarefa (lógica local)
   * Mesmo cálculo usado no backend para consistência
   * @param {Object} task - Dados da tarefa
   * @returns {Object} { signal_score, classificacao }
   */
  calculateSignalScore(task) {
    return calculateSignalScore(task);
  }

  /**
   * Helper para gerar reasoning explicativo
   * @param {Object} task - Dados da tarefa
   * @param {Object} classification - Resultado da classificação
   * @returns {string} Texto explicativo
   */
  generateReasoning(task, classification) {
    return generateReasoning(task, classification);
  }
}

/**
 * Factory function to create a KanbanService instance
 * @param {Function} fetchFn - Custom fetch function (e.g., fetchWithAuth from AuthContext)
 * @returns {KanbanService} New KanbanService instance
 */
export const createKanbanService = (fetchFn) => {
  return new KanbanService(fetchFn);
};
