import handler from '../recommendations/opportunity-cost';
import { query } from '../../../../shared/database/db';

jest.mock('../../../../shared/database/db');

describe('/api/recommendations/opportunity-cost', () => {
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

  describe('POST /api/recommendations/opportunity-cost', () => {
    test('recomenda substituição quando atividade tem baixa eficiência', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade pouco eficiente',
          impact: 3,
          effort: 7,
          duration_minutes: 120
        }
      };

      const mockTemplates = [
        {
          id: 'temp1',
          title: 'Alta alavancagem 1',
          description: 'Template eficiente',
          impact_estimate: 9,
          effort_estimate: 2,
          duration_estimate: 60,
          leverage_score: 20
        },
        {
          id: 'temp2',
          title: 'Alta alavancagem 2',
          description: 'Outro template',
          impact_estimate: 8,
          effort_estimate: 3,
          duration_estimate: 45,
          leverage_score: 18
        }
      ];

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldSubstitute: true,
          currentEfficiency: expect.any(Number),
          alternatives: expect.arrayContaining([
            expect.objectContaining({
              title: expect.any(String),
              efficiency: expect.any(Number),
              improvementPotential: expect.any(Number),
              reasoning: expect.any(String)
            })
          ])
        })
      );
    });

    test('não recomenda substituição quando atividade já é eficiente', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade eficiente',
          impact: 9,
          effort: 2,
          duration_minutes: 60
        }
      };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldSubstitute: false,
          currentEfficiency: expect.any(Number),
          message: expect.stringContaining('já é eficiente')
        })
      );
    });

    test('calcula opportunity cost corretamente', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade média',
          impact: 5,
          effort: 5,
          duration_minutes: 60
        }
      };

      const mockTemplates = [
        {
          id: 'temp1',
          title: 'Template melhor',
          impact_estimate: 9,
          effort_estimate: 2,
          duration_estimate: 60,
          leverage_score: 20
        }
      ];

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];

      // Eficiência atual: (5 * 2) / 1 = 10
      expect(response.currentEfficiency).toBe(10);

      // Eficiência da alternativa: (9 * 2) / 1 = 18
      expect(response.alternatives[0].efficiency).toBe(18);

      // Opportunity cost: 18 - 10 = 8
      expect(response.alternatives[0].improvementPotential).toBe(8);
    });

    test('limita alternativas a 3', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade',
          impact: 3,
          effort: 7,
          duration_minutes: 60
        }
      };

      const mockTemplates = Array.from({ length: 10 }, (_, i) => ({
        id: `temp${i}`,
        title: `Template ${i}`,
        impact_estimate: 9,
        effort_estimate: 2,
        duration_estimate: 60,
        leverage_score: 20 - i
      }));

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.alternatives.length).toBeLessThanOrEqual(3);
    });

    test('ordena alternativas por eficiência (maior primeiro)', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade',
          impact: 3,
          effort: 7,
          duration_minutes: 60
        }
      };

      const mockTemplates = [
        {
          id: 'temp1',
          title: 'Médio',
          impact_estimate: 7,
          effort_estimate: 3,
          duration_estimate: 60,
          leverage_score: 15
        },
        {
          id: 'temp2',
          title: 'Alto',
          impact_estimate: 9,
          effort_estimate: 2,
          duration_estimate: 60,
          leverage_score: 20
        },
        {
          id: 'temp3',
          title: 'Baixo',
          impact_estimate: 6,
          effort_estimate: 4,
          duration_estimate: 60,
          leverage_score: 12
        }
      ];

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.alternatives[0].title).toBe('Alto');
      expect(response.alternatives[1].title).toBe('Médio');
    });

    test('inclui reasoning explicando por que substituir', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade',
          impact: 4,
          effort: 6,
          duration_minutes: 90
        }
      };

      const mockTemplates = [
        {
          id: 'temp1',
          title: 'Template',
          impact_estimate: 9,
          effort_estimate: 2,
          duration_estimate: 60,
          leverage_score: 20
        }
      ];

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.alternatives[0].reasoning).toContain('Alto impacto');
      expect(response.alternatives[0].reasoning).toContain('menor esforço');
    });

    test('filtra apenas templates com leverage_score >= 15', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          description: 'Atividade',
          impact: 3,
          effort: 7,
          duration_minutes: 60
        }
      };

      const mockTemplates = [
        { id: 'temp1', leverage_score: 10, impact_estimate: 7, effort_estimate: 3, duration_estimate: 60 },
        { id: 'temp2', leverage_score: 18, impact_estimate: 9, effort_estimate: 2, duration_estimate: 60 },
        { id: 'temp3', leverage_score: 5, impact_estimate: 5, effort_estimate: 5, duration_estimate: 60 }
      ];

      query.mockResolvedValue({ rows: mockTemplates });

      await handler(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('leverage_score >= 15'),
        expect.arrayContaining(['user123'])
      );
    });

    test('retorna erro 400 quando userId não é fornecido', async () => {
      req.body = {
        currentActivity: {
          impact: 5,
          duration_minutes: 60
        }
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'userId and currentActivity are required' });
    });

    test('retorna erro 400 quando currentActivity não é fornecida', async () => {
      req.body = {
        userId: 'user123'
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'userId and currentActivity are required' });
    });

    test('retorna erro 405 para método GET', async () => {
      req.method = 'GET';
      req.body = {
        userId: 'user123',
        currentActivity: { impact: 5, duration_minutes: 60 }
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    test('trata erro de banco de dados', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          impact: 5,
          duration_minutes: 60
        }
      };

      query.mockRejectedValue(new Error('Database error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error calculating opportunity cost' });
    });

    test('retorna mensagem informativa quando não há templates disponíveis', async () => {
      req.body = {
        userId: 'user123',
        currentActivity: {
          impact: 3,
          duration_minutes: 60
        }
      };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.shouldSubstitute).toBe(false);
      expect(response.message).toContain('Nenhuma alternativa');
    });
  });
});