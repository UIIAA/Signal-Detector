import { query } from '../../../shared/database/db';
const AdvancedAnalytics = require('../../api-backend/services/AdvancedAnalytics');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, goalIds } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    let activityQuery = 'SELECT * FROM activities WHERE user_id = $1';
    let activityParams = [userId];
    let keyActivityQuery = 'SELECT ka.*, a.goal_id FROM key_activities ka JOIN activities a ON ka.activity_id = a.id WHERE a.goal_id IN (SELECT id FROM goals WHERE user_id = $1)';
    let keyActivityParams = [userId];

    if (goalIds && goalIds.length > 0) {
      const placeholders = goalIds.map((_, i) => `$${i + 2}`).join(',');
      activityQuery = `
        SELECT a.* FROM activities a
        INNER JOIN activity_goals ag ON a.id = ag.activity_id
        WHERE a.user_id = $1 AND ag.goal_id IN (${placeholders})
        GROUP BY a.id
      `;
      activityParams = [userId, ...goalIds];

      const keyActivityPlaceholders = goalIds.map((_, i) => `$${i + 1}`).join(',');
      keyActivityQuery = `SELECT ka.*, a.goal_id FROM key_activities ka JOIN activities a ON ka.activity_id = a.id WHERE a.goal_id IN (${keyActivityPlaceholders})`;
      keyActivityParams = goalIds;
    }

    const [activitiesResult, keyActivitiesResult] = await Promise.all([
      query(activityQuery, activityParams),
      query(keyActivityQuery, keyActivityParams)
    ]);

    const activities = activitiesResult.rows;
    const keyActivities = keyActivitiesResult.rows;

    const advancedAnalytics = new AdvancedAnalytics();
    const insights = advancedAnalytics.generateInsights(activities, keyActivities);

    if (goalIds && goalIds.length > 0) {
      insights.filteredByGoals = true;
      insights.selectedGoalCount = goalIds.length;
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Error generating insights' });
  }
}