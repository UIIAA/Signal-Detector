import handler from '../schedule/index';
import { query } from '../../../../shared/database/db';

jest.mock('../../../../shared/database/db');

describe('/api/schedule', () => {
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

  describe('GET /api/schedule', () => {
    test('retorna blocos da semana agrupados por data', async () => {
      req.query = {
        userId: 'user123',
        startDate: '2025-01-06',
        endDate: '2025-01-12'
      };

      const mockBlocks = [
        {
          id: 'block1',
          title: 'Foco',
          block_type: 'focus',
          scheduled_date: new Date('2025-01-06'),
          start_time: '09:00:00',
          end_time: '10:30:00',
          status: 'scheduled'
        },
        {
          id: 'block2',
          title: 'Reunião',
          block_type: 'meeting',
          scheduled_date: new Date('2025-01-06'),
          start_time: '14:00:00',
          end_time: '15:00:00',
          status: 'scheduled'
        },
        {
          id: 'block3',
          title: 'Deep Work',
          block_type: 'deep-work',
          scheduled_date: new Date('2025-01-07'),
          start_time: '08:00:00',
          end_time: '11:00:00',
          status: 'scheduled'
        }
      ];

      query.mockResolvedValue({ rows: mockBlocks });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];

      expect(response.blocks).toHaveLength(3);
      expect(response.blocksByDate).toHaveProperty('2025-01-06');
      expect(response.blocksByDate['2025-01-06']).toHaveLength(2);
      expect(response.blocksByDate['2025-01-07']).toHaveLength(1);
    });

    test('retorna erro 400 quando parâmetros obrigatórios faltam', async () => {
      req.query = { userId: 'user123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'userId, startDate and endDate are required'
      });
    });

    test('retorna array vazio quando não há blocos', async () => {
      req.query = {
        userId: 'user123',
        startDate: '2025-01-06',
        endDate: '2025-01-12'
      };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        blocks: [],
        blocksByDate: {}
      });
    });
  });

  describe('POST /api/schedule (criar bloco)', () => {
    beforeEach(() => {
      req.method = 'POST';
    });

    test('cria bloco com sucesso quando não há conflitos', async () => {
      req.body = {
        userId: 'user123',
        title: 'Novo Bloco',
        blockType: 'focus',
        scheduledDate: '2025-01-06',
        startTime: '09:00',
        endTime: '10:30',
        plannedImpact: 8,
        plannedEffort: 3
      };

      // Mock: não há conflitos
      query
        .mockResolvedValueOnce({ rows: [] }) // detectConflicts
        .mockResolvedValueOnce({ rows: [{ id: 'new-block' }] }); // insert

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          block: expect.objectContaining({ id: 'new-block' })
        })
      );
    });

    test('retorna erro 409 quando há conflito de horário', async () => {
      req.body = {
        userId: 'user123',
        title: 'Novo Bloco',
        blockType: 'focus',
        scheduledDate: '2025-01-06',
        startTime: '09:00',
        endTime: '10:30',
        plannedImpact: 8,
        plannedEffort: 3
      };

      const mockConflicts = [
        {
          id: 'conflict1',
          title: 'Bloco Existente',
          start_time: '09:30:00',
          end_time: '10:00:00'
        }
      ];

      query.mockResolvedValue({ rows: mockConflicts });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Schedule conflict detected',
          conflicts: mockConflicts
        })
      );
    });

    test('detecta conflito quando novo bloco começa durante bloco existente', async () => {
      req.body = {
        userId: 'user123',
        title: 'Novo',
        blockType: 'focus',
        scheduledDate: '2025-01-06',
        startTime: '09:30', // Durante bloco 09:00-10:30
        endTime: '11:00',
        plannedImpact: 8,
        plannedEffort: 3
      };

      const mockConflicts = [
        {
          id: 'existing',
          title: 'Existente',
          start_time: '09:00:00',
          end_time: '10:30:00'
        }
      ];

      query.mockResolvedValue({ rows: mockConflicts });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      // Verificar que query de conflitos foi chamada corretamente
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('start_time < $4 AND end_time > $3'),
        expect.arrayContaining(['user123', '2025-01-06', '09:30', '11:00'])
      );
    });

    test('detecta conflito quando novo bloco engloba bloco existente', async () => {
      req.body = {
        userId: 'user123',
        title: 'Novo',
        blockType: 'focus',
        scheduledDate: '2025-01-06',
        startTime: '08:00', // Antes
        endTime: '12:00',   // Depois (engloba 09:00-10:30)
        plannedImpact: 8,
        plannedEffort: 3
      };

      const mockConflicts = [
        {
          id: 'existing',
          title: 'Existente',
          start_time: '09:00:00',
          end_time: '10:30:00'
        }
      ];

      query.mockResolvedValue({ rows: mockConflicts });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('retorna erro 400 quando campos obrigatórios faltam', async () => {
      req.body = {
        userId: 'user123',
        title: 'Bloco'
        // Faltam outros campos
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('required')
      });
    });

    test('valida que endTime é posterior a startTime', async () => {
      req.body = {
        userId: 'user123',
        title: 'Bloco',
        blockType: 'focus',
        scheduledDate: '2025-01-06',
        startTime: '10:00',
        endTime: '09:00', // Antes do início!
        plannedImpact: 8,
        plannedEffort: 3
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'endTime must be after startTime'
      });
    });
  });

  describe('PUT /api/schedule (atualizar bloco)', () => {
    beforeEach(() => {
      req.method = 'PUT';
    });

    test('marca bloco como completo', async () => {
      req.body = {
        blockId: 'block123',
        userId: 'user123',
        status: 'completed'
      };

      query.mockResolvedValue({ rows: [{ id: 'block123', status: 'completed' }] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          block: expect.objectContaining({ status: 'completed' })
        })
      );

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE time_blocks SET status'),
        expect.arrayContaining(['completed', 'block123', 'user123'])
      );
    });

    test('atualiza múltiplos campos do bloco', async () => {
      req.body = {
        blockId: 'block123',
        userId: 'user123',
        title: 'Título Atualizado',
        description: 'Nova descrição',
        plannedImpact: 9
      };

      query.mockResolvedValue({ rows: [{ id: 'block123' }] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('retorna erro 400 quando blockId ou userId faltam', async () => {
      req.body = {
        blockId: 'block123'
        // userId faltando
      };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('verifica conflitos ao alterar horário do bloco', async () => {
      req.body = {
        blockId: 'block123',
        userId: 'user123',
        startTime: '10:00',
        endTime: '11:30'
      };

      const mockConflicts = [
        {
          id: 'other-block',
          title: 'Outro bloco',
          start_time: '10:30:00',
          end_time: '11:00:00'
        }
      ];

      query.mockResolvedValue({ rows: mockConflicts });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('DELETE /api/schedule', () => {
    beforeEach(() => {
      req.method = 'DELETE';
    });

    test('remove bloco com sucesso', async () => {
      req.query = {
        blockId: 'block123',
        userId: 'user123'
      };

      query.mockResolvedValue({ rows: [{ id: 'block123' }] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM time_blocks'),
        expect.arrayContaining(['block123', 'user123'])
      );
    });

    test('retorna erro 400 quando blockId ou userId faltam', async () => {
      req.query = { blockId: 'block123' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('retorna erro 404 quando bloco não existe', async () => {
      req.query = {
        blockId: 'nonexistent',
        userId: 'user123'
      };

      query.mockResolvedValue({ rows: [] });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Block not found' });
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

  describe('Tratamento de erros', () => {
    test('trata erro de banco de dados', async () => {
      req.query = {
        userId: 'user123',
        startDate: '2025-01-06',
        endDate: '2025-01-12'
      };

      query.mockRejectedValue(new Error('Database error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error processing schedule request'
      });
    });
  });
});