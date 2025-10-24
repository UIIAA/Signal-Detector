import { query } from '../../../shared/database/db';  // Use the shared database abstraction
import EfficiencyCalculator from '../../../src/services/EfficiencyCalculator';
import { FilterSchema, validateWithSchema } from '../../../src/lib/validation';
import { apiLimiter } from '../../../src/lib/rateLimit';
import { withAuth } from '../../../src/lib/auth';

// Apply rate limiting for API endpoints
const applyRateLimit = async (req, res) => {
  await apiLimiter(req, res, () => {});
};

// Wrap the handler with authentication
export default withAuth(async function handler(req, res) {
  await applyRateLimit(req, res);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate query parameters
  const queryParams = {
    userId: req.query.userId,
    timeframe: req.query.timeframe || 'week',
    limit: req.query.limit || 10
  };

  const validation = validateWithSchema(FilterSchema.extend({
    userId: FilterSchema.shape.userId,
    timeframe: FilterSchema.shape.timeframe,
    limit: FilterSchema.shape.timeframe.optional().transform(val => parseInt(val) || 10)
  }), queryParams);

  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  const { userId, timeframe, limit } = validation.data;

  // Verify that the authenticated user is requesting their own data
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Forbidden: Access denied for this user' });
  }

  try {
    // Definir período baseado no timeframe
    let dateFilter = '';
    const sqlParams = [userId];
    let paramIndex = 2;

    switch (timeframe) {
      case 'day':
        dateFilter = `AND created_at >= CURRENT_DATE`;
        break;
      case 'week':
        dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'all':
        dateFilter = ``; // No date filter
        break;
    }

    // Buscar atividades do usuário
    const { rows: activities } = await query(`
      SELECT
        id,
        description,
        duration_minutes,
        impact,
        effort,
        signal_score,
        classification,
        created_at,
        goal_id
      FROM activities
      WHERE user_id = $1
      ${dateFilter}
      AND duration_minutes > 0
      AND impact > 0
      ORDER BY created_at DESC
    `, sqlParams);

    // Calcular eficiência e criar ranking
    const ranking = EfficiencyCalculator.createRanking(activities, parseInt(limit));

    // Calcular estatísticas
    const stats = EfficiencyCalculator.calculateStats(activities);

    // Salvar no histórico (async, não bloqueante)
    ranking.forEach(async (activity) => {
      try {
        await query(`
          INSERT INTO efficiency_history (user_id, activity_id, efficiency_score, rank_position)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (activity_id) DO NOTHING
        `, [userId, activity.id, activity.efficiency, activity.rank]);
      } catch (err) {
        console.error('Error saving efficiency history:', err);
      }
    });

    res.status(200).json({
      ranking,
      stats,
      timeframe,
      total: activities.length
    });
  } catch (error) {
    console.error('Error calculating efficiency:', error);
    res.status(500).json({ error: 'Error fetching efficiency data' });
  }
});