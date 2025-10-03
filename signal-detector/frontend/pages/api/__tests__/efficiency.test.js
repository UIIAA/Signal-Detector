// Mock do módulo de banco de dados ANTES de importar
jest.mock('../../../../shared/database/db');

const { query } = require('../../../../shared/database/db');

describe('/api/activities/efficiency', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('GET /api/activities/efficiency', () => {
    test('retorna ranking e estatísticas com sucesso', async () => {
      req.query = { userId: 'user123', timeframe: 'week', limit: '5' };

      const mockActivities = [
        { id: 'act1', description: 'Atividade 1', impact: 9, effort: 2, duration_minutes: 60, created_at: new Date() },
        { id: 'act2', description: 'Atividade 2', impact: 8, effort: 3, duration_minutes: 45, created_at: new Date() },
        { id: 'act3', description: 'Atividade 3', impact: 6, effort: 5, duration_minutes: 90, created_at: new Date() }
      ];

      query.mockResolvedValue({ rows: mockActivities });

      const handler = require('../activities/efficiency').default;
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ranking: expect.arrayContaining([
          expect.objectContaining({
            rank: expect.any(Number),
            efficiency_score: expect.any(Number)
          })
        ]),
        stats: expect.objectContaining({
          total: expect.any(Number),
          average: expect.any(Number),
          highest: expect.any(Number),
          lowest: expect.any(Number)
        })
      });
    });

    test('retorna erro 400 quando userId não é fornecido', async () => {
      req.query = { timeframe: 'week' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'userId is required' });
    });

    test('retorna erro 405 para método não permitido', async () => {
      req.method = 'POST';
      req.query = { userId: 'user123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    test('aplica filtro de timeframe corretamente', async () => {
      req.query = { userId: 'user123', timeframe: 'day', limit: '10' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('created_at >= CURRENT_DATE'),
        expect.arrayContaining(['user123'])
      );
    });

    test('aplica filtro de week corretamente', async () => {
      req.query = { userId: 'user123', timeframe: 'week' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '7 days'"),
        expect.arrayContaining(['user123'])
      );
    });

    test('aplica filtro de month corretamente', async () => {
      req.query = { userId: 'user123', timeframe: 'month' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("INTERVAL '30 days'"),
        expect.arrayContaining(['user123'])
      );
    });

    test('busca todas as atividades quando timeframe é "all"', async () => {
      req.query = { userId: 'user123', timeframe: 'all' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.not.stringContaining('INTERVAL'),
        expect.arrayContaining(['user123'])
      );
    });

    test('respeita o limite de resultados', async () => {
      req.query = { userId: 'user123', limit: '3' };

      const mockActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `act${i}`,
        impact: 8,
        duration_minutes: 60
      }));

      query.mockResolvedValue({ rows: mockActivities });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.ranking.length).toBeLessThanOrEqual(3);
    });

    test('retorna array vazio quando não há atividades', async () => {
      req.query = { userId: 'user123' };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ranking: [],
        stats: expect.objectContaining({
          total: 0,
          average: 0
        })
      });
    });

    test('trata erro de banco de dados', async () => {
      req.query = { userId: 'user123' };

      query.mockRejectedValue(new Error('Database connection failed'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching efficiency data' });
    });

    test('ordena ranking por eficiência (maior para menor)', async () => {
      req.query = { userId: 'user123' };

      const mockActivities = [
        { id: 'act1', impact: 5, duration_minutes: 60 },  // eff: 10
        { id: 'act2', impact: 9, duration_minutes: 60 },  // eff: 18
        { id: 'act3', impact: 7, duration_minutes: 60 }   // eff: 14
      ];

      query.mockResolvedValue({ rows: mockActivities });

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.ranking[0].id).toBe('act2'); // Maior eficiência
      expect(response.ranking[1].id).toBe('act3');
      expect(response.ranking[2].id).toBe('act1'); // Menor eficiência
    });
  });
});