import handler from '../goals/ideal-path';
import { query } from '../../../../shared/database/db';

jest.mock('../../../../shared/database/db');
jest.mock('@google/generative-ai');

const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('/api/goals/ideal-path', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('GET /api/goals/ideal-path', () => {
    test('retorna rota ideal de um objetivo', async () => {
      req.query = { goalId: 'goal123' };

      const mockGoal = {
        id: 'goal123',
        ideal_path: {
          activities: [
            { id: 'act1', title: 'Atividade 1', status: 'pending' },
            { id: 'act2', title: 'Atividade 2', status: 'completed' }
          ]
        }
      };

      query.mockResolvedValue({ rows: [mockGoal] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        goalId: 'goal123',
        idealPath: mockGoal.ideal_path
      });
    });

    test('retorna erro 400 quando goalId não é fornecido', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'goalId is required' });
    });

    test('retorna erro 404 quando objetivo não existe', async () => {
      req.query = { goalId: 'nonexistent' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Goal not found' });
    });
  });

  describe('POST /api/goals/ideal-path (geração com IA)', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    test('gera rota ideal com IA com sucesso', async () => {
      req.body = {
        goalId: 'goal123',
        userId: 'user123'
      };

      const mockGoal = {
        id: 'goal123',
        title: 'Aprender React',
        description: 'Dominar React para desenvolvimento web',
        goal_type: 'medium'
      };

      const mockAIResponse = {
        activities: [
          {
            id: expect.any(String),
            title: 'Completar tutorial oficial',
            description: 'Seguir o tutorial do site oficial',
            impact: 9,
            effort: 4,
            estimatedDuration: 480,
            order: 1
          },
          {
            id: expect.any(String),
            title: 'Construir projeto prático',
            description: 'Criar um projeto real',
            impact: 10,
            effort: 6,
            estimatedDuration: 1200,
            order: 2
          }
        ],
        milestones: [
          { title: 'Completar fundamentos', targetDate: expect.any(String) }
        ]
      };

      query
        .mockResolvedValueOnce({ rows: [mockGoal] }) // Buscar objetivo
        .mockResolvedValueOnce({ rows: [] }) // Buscar atividades recentes
        .mockResolvedValueOnce({ rows: [{ id: 'goal123' }] }); // Update

      // Mock Gemini AI
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockAIResponse)
          }
        })
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          goalId: 'goal123',
          idealPath: expect.objectContaining({
            activities: expect.any(Array),
            milestones: expect.any(Array)
          })
        })
      );
    });

    test('usa fallback baseado em regras quando IA falha', async () => {
      req.body = {
        goalId: 'goal123',
        userId: 'user123'
      };

      const mockGoal = {
        id: 'goal123',
        title: 'Objetivo Teste',
        goal_type: 'short'
      };

      query
        .mockResolvedValueOnce({ rows: [mockGoal] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'goal123' }] });

      // Mock IA falhando
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.idealPath.activities.length).toBeGreaterThan(0);
      expect(response.source).toBe('fallback');
    });

    test('retorna erro 400 quando goalId ou userId não são fornecidos', async () => {
      req.body = { goalId: 'goal123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'goalId and userId are required' });
    });
  });

  describe('PUT /api/goals/ideal-path (atualizar progresso)', () => {
    beforeEach(() => {
      req.method = 'PUT';
    });

    test('marca atividade como completa', async () => {
      req.body = {
        goalId: 'goal123',
        activityId: 'act1',
        status: 'completed'
      };

      const mockGoal = {
        ideal_path: {
          activities: [
            { id: 'act1', title: 'Atividade 1', status: 'pending' },
            { id: 'act2', title: 'Atividade 2', status: 'pending' }
          ]
        }
      };

      query
        .mockResolvedValueOnce({ rows: [mockGoal] })
        .mockResolvedValueOnce({ rows: [{ id: 'goal123' }] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updateCall = query.mock.calls[1];
      const updatedPath = updateCall[1][0];
      expect(JSON.parse(updatedPath).activities[0].status).toBe('completed');
    });

    test('retorna erro 400 quando parâmetros obrigatórios faltam', async () => {
      req.body = { goalId: 'goal123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retorna erro 404 quando atividade não existe no ideal path', async () => {
      req.body = {
        goalId: 'goal123',
        activityId: 'nonexistent',
        status: 'completed'
      };

      const mockGoal = {
        ideal_path: {
          activities: [
            { id: 'act1', title: 'Atividade 1', status: 'pending' }
          ]
        }
      };

      query.mockResolvedValueOnce({ rows: [mockGoal] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Activity not found in ideal path' });
    });
  });

  describe('DELETE /api/goals/ideal-path', () => {
    beforeEach(() => {
      req.method = 'DELETE';
    });

    test('remove rota ideal com sucesso', async () => {
      req.query = { goalId: 'goal123' };

      query.mockResolvedValue({ rows: [{ id: 'goal123' }] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ideal_path = NULL'),
        expect.arrayContaining(['goal123'])
      );
    });

    test('retorna erro 400 quando goalId não é fornecido', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Método não permitido', () => {
    test('retorna erro 405 para método PATCH', async () => {
      req.method = 'PATCH';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });
});