import handler from '../coach/next-action';
import { query } from '../../../../shared/database/db';

jest.mock('../../../../shared/database/db');
jest.mock('@google/generative-ai');

const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('/api/coach/next-action', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('POST /api/coach/next-action', () => {
    test('gera recomendação com IA com sucesso', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Aprender React',
          description: 'Dominar React',
          goal_type: 'medium',
          progress_percentage: 30,
          ideal_path: {
            activities: [
              { id: 'act1', title: 'Tutorial', status: 'pending' }
            ]
          }
        }
      ];

      const mockActivities = [
        {
          description: 'Estudar docs',
          impact: 8,
          effort: 3,
          duration_minutes: 90,
          signal_score: 0.73,
          classification: 'high-leverage',
          created_at: new Date()
        }
      ];

      const mockBlocks = [];

      const mockStats = {
        avg_impact: 7.5,
        avg_effort: 4.2,
        high_leverage_count: 5,
        total_count: 10
      };

      const mockAIRecommendation = {
        action: 'Completar tutorial oficial do React',
        description: 'Seguir o tutorial passo a passo do site oficial',
        goalId: 'goal1',
        goalTitle: 'Aprender React',
        estimatedDuration: 120,
        estimatedImpact: 9,
        estimatedEffort: 3,
        reasoning: 'Esta é a próxima atividade crítica no seu objetivo de aprender React. Período da manhã é ideal para foco.',
        urgencyLevel: 'high',
        alternativeActions: [
          {
            action: 'Assistir vídeo-aulas',
            duration: 60,
            impact: 7,
            effort: 2
          }
        ]
      };

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: mockActivities })
        .mockResolvedValueOnce({ rows: mockBlocks })
        .mockResolvedValueOnce({ rows: [mockStats] });

      // Mock Gemini AI
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockAIRecommendation)
          }
        })
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Completar tutorial oficial do React',
          estimatedImpact: 9,
          estimatedEffort: 3,
          reasoning: expect.any(String),
          context: expect.objectContaining({
            goalsAnalyzed: 1,
            activitiesAnalyzed: 1,
            blocksScheduled: 0
          }),
          generatedAt: expect.any(String)
        })
      );
    });

    test('usa fallback baseado em regras quando IA falha', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Objetivo Teste',
          goal_type: 'short',
          progress_percentage: 10,
          ideal_path: {
            activities: [
              {
                id: 'act1',
                title: 'Atividade Crítica',
                description: 'Atividade importante',
                status: 'pending',
                impact: 9,
                effort: 3,
                estimatedDuration: 90
              }
            ]
          }
        }
      ];

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ avg_impact: 7, avg_effort: 4 }] });

      // Mock IA falhando
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'Atividade Crítica',
          description: 'Atividade importante',
          goalId: 'goal1',
          source: 'rule-based',
          estimatedImpact: 9,
          estimatedEffort: 3
        })
      );
    });

    test('prioriza objetivo com menor progresso quando não há rota crítica', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Objetivo 1',
          goal_type: 'medium',
          progress_percentage: 50
        },
        {
          id: 'goal2',
          title: 'Objetivo 2',
          goal_type: 'short',
          progress_percentage: 10 // Menor progresso
        }
      ];

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.goalId).toBe('goal1'); // Primeiro na lista ordenada
      expect(response.action).toContain('Objetivo 1');
    });

    test('sugere criar objetivo quando não há objetivos ativos', async () => {
      req.body = { userId: 'user123' };

      query
        .mockResolvedValueOnce({ rows: [] }) // Sem objetivos
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.action).toContain('Definir objetivo claro');
      expect(response.estimatedImpact).toBe(9); // Alta importância
    });

    test('adapta recomendação ao período do dia', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Teste',
          progress_percentage: 20,
          ideal_path: {
            activities: [
              {
                id: 'act1',
                title: 'Atividade',
                status: 'pending',
                impact: 8,
                effort: 4
              }
            ]
          }
        }
      ];

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.reasoning).toBeTruthy();
      // Verifica se reasoning menciona período do dia (se for manhã)
      const hour = new Date().getHours();
      if (hour < 12) {
        expect(response.reasoning).toContain('manhã');
      }
    });

    test('constrói prompt completo com contexto do usuário', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Aprender TypeScript',
          description: 'Dominar TypeScript',
          goal_type: 'medium',
          progress_percentage: 25,
          ideal_path: {
            activities: [
              { id: 'act1', title: 'Ler documentação', status: 'pending' }
            ]
          }
        }
      ];

      const mockActivities = [
        {
          description: 'Estudar types',
          impact: 8,
          effort: 3,
          duration_minutes: 90
        }
      ];

      const mockBlocks = [
        {
          title: 'Foco',
          block_type: 'focus',
          scheduled_date: new Date('2025-01-10'),
          start_time: '09:00:00',
          goal_id: 'goal1'
        }
      ];

      const mockStats = {
        avg_impact: 7.5,
        avg_effort: 4.0,
        high_leverage_count: 8,
        total_count: 15
      };

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: mockActivities })
        .mockResolvedValueOnce({ rows: mockBlocks })
        .mockResolvedValueOnce({ rows: [mockStats] });

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              action: 'Test',
              description: 'Test',
              estimatedDuration: 60,
              estimatedImpact: 8,
              estimatedEffort: 3,
              reasoning: 'Test',
              urgencyLevel: 'medium'
            })
          }
        })
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      // Verificar que generateContent foi chamado com prompt completo
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Você é um Coach de Produtividade IA')
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('OBJETIVOS ATIVOS (1)')
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('ATIVIDADES RECENTES')
      );

      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('ESTATÍSTICAS DA SEMANA')
      );
    });

    test('define urgencyLevel como high quando progresso < 25%', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = [
        {
          id: 'goal1',
          title: 'Objetivo Urgente',
          progress_percentage: 15, // < 25%
          ideal_path: {
            activities: [
              {
                id: 'act1',
                title: 'Atividade',
                status: 'pending',
                impact: 9,
                effort: 3
              }
            ]
          }
        }
      ];

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.urgencyLevel).toBe('high');
    });

    test('retorna erro 400 quando userId não é fornecido', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'userId is required' });
    });

    test('retorna erro 405 para método GET', async () => {
      req.method = 'GET';
      req.body = { userId: 'user123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    test('trata erro de banco de dados', async () => {
      req.body = { userId: 'user123' };

      query.mockRejectedValue(new Error('Database error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error generating next action recommendation'
      });
    });

    test('limita objetivos analisados a 5', async () => {
      req.body = { userId: 'user123' };

      const mockGoals = Array.from({ length: 10 }, (_, i) => ({
        id: `goal${i}`,
        title: `Objetivo ${i}`,
        progress_percentage: 50
      }));

      query
        .mockResolvedValueOnce({ rows: mockGoals })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('AI Error'))
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      // Verificar que query foi chamada com LIMIT 5
      expect(query.mock.calls[0][0]).toContain('LIMIT 5');
    });

    test('inclui contexto completo na resposta', async () => {
      req.body = { userId: 'user123' };

      query
        .mockResolvedValueOnce({ rows: [{ id: 'goal1', title: 'Goal' }] })
        .mockResolvedValueOnce({ rows: [{ description: 'Act1' }, { description: 'Act2' }] })
        .mockResolvedValueOnce({ rows: [{ title: 'Block1' }] })
        .mockResolvedValueOnce({ rows: [{}] });

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              action: 'Test',
              description: 'Test',
              estimatedDuration: 60,
              estimatedImpact: 8,
              estimatedEffort: 3,
              reasoning: 'Test',
              urgencyLevel: 'medium'
            })
          }
        })
      };

      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => mockModel
      }));

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.context).toEqual({
        goalsAnalyzed: 1,
        activitiesAnalyzed: 2,
        blocksScheduled: 1
      });
      expect(response.generatedAt).toBeTruthy();
    });
  });
});