import { query } from '../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, timeframe } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const days = timeframe === 'month' ? 30 : timeframe === 'day' ? 1 : 7;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const sql = `
      SELECT
        g.id,
        g.title,
        g.goal_type,
        COUNT(a.id) as activity_count,
        AVG(a.signal_score) as avg_signal_score,
        SUM(CASE WHEN a.classification = 'SINAL' THEN 1 ELSE 0 END) as signal_count,
        SUM(CASE WHEN a.classification = 'RUÍDO' THEN 1 ELSE 0 END) as noise_count
      FROM goals g
      LEFT JOIN activity_goals ag ON g.id = ag.goal_id
      LEFT JOIN activities a ON ag.activity_id = a.id
      WHERE g.user_id = $1
        AND a.created_at >= $2
      GROUP BY g.id, g.title, g.goal_type
      HAVING COUNT(a.id) > 0
      ORDER BY signal_count DESC, avg_signal_score DESC
      LIMIT 10
    `;

    const { rows } = await query(sql, [userId, dateLimit.toISOString()]);

    const topGoals = rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.goal_type,
      typeName: row.goal_type === 'short' ? 'Curto Prazo' :
                row.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo',
      activityCount: row.activity_count,
      avgSignalScore: Math.round(row.avg_signal_score || 0),
      signalCount: row.signal_count,
      noiseCount: row.noise_count,
      signalPercentage: row.activity_count > 0 ?
        Math.round((row.signal_count / row.activity_count) * 100) : 0
    }));

    res.json({ topGoals });
  } catch (error) {
    console.error('Error fetching top goals:', error);
    res.status(500).json({ error: 'Error fetching top goals' });
  }
}