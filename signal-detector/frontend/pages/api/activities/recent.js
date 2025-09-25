import { query, getDb } from '../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 10, offset = 0 } = req.query;

  try {
    const { dbType } = await getDb();

    const groupConcat = dbType === 'postgres' ? 'STRING_AGG(g.id::text, ",")' : 'GROUP_CONCAT(g.id)';
    const groupConcatTitles = dbType === 'postgres' ? 'STRING_AGG(g.title, ",")' : 'GROUP_CONCAT(g.title)';

    const activitiesQuery = `
      SELECT
        a.id,
        a.description,
        a.classification,
        a.signal_score,
        a.created_at,
        a.duration_minutes,
        ${groupConcat} as goal_ids,
        ${groupConcatTitles} as goal_titles,
        COUNT(g.id) as goals_count
      FROM activities a
      LEFT JOIN activity_goals ag ON a.id = ag.activity_id
      LEFT JOIN goals g ON ag.goal_id = g.id
      WHERE a.user_id = 'default-user'
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows: activities } = await query(activitiesQuery, [parseInt(limit), parseInt(offset)]);

    const formattedActivities = activities.map(row => ({
      id: row.id,
      description: row.description,
      classification: row.classification,
      score: row.signal_score,
      createdAt: row.created_at,
      duration: row.duration_minutes,
      connectedGoals: row.goal_ids ? row.goal_ids.split(',').map((id, index) => ({
        id,
        title: row.goal_titles.split(',')[index]
      })) : [],
      goalsCount: row.goals_count || 0
    }));

    const { rows: totalResult } = await query('SELECT COUNT(*) as count FROM activities WHERE user_id = $1', ['default-user']);
    const total = totalResult[0].count;

    res.json({
      activities: formattedActivities,
      total,
      page: Math.floor(offset / limit) + 1,
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Error fetching recent activities' });
  }
}
