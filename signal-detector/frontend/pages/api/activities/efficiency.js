import { query } from '../../../../shared/database/db';
import EfficiencyCalculator from '../../../src/services/EfficiencyCalculator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, timeframe = 'week', limit = 10 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Definir período baseado no timeframe
    let dateFilter = '';
    const now = new Date();

    switch (timeframe) {
      case 'day':
        const today = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = `AND a.created_at >= '${today.toISOString()}'`;
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = `AND a.created_at >= '${weekAgo.toISOString()}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = `AND a.created_at >= '${monthAgo.toISOString()}'`;
        break;
      case 'all':
      default:
        dateFilter = '';
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
    `, [userId]);

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

    res.json({
      ranking,
      stats,
      timeframe,
      total: activities.length
    });
  } catch (error) {
    console.error('Error calculating efficiency:', error);
    res.status(500).json({ error: 'Error calculating efficiency' });
  }
}