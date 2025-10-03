import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { goalId, progressPercentage, updateReason = 'manual', activityId, userId } = req.body;

  if (!goalId || progressPercentage === undefined || !userId) {
    return res.status(400).json({ error: 'goalId, progressPercentage, and userId are required' });
  }

  if (progressPercentage < 0 || progressPercentage > 100) {
    return res.status(400).json({ error: 'progressPercentage must be between 0 and 100' });
  }

  try {
    const { rowCount } = await query(
      `
        UPDATE goals
        SET progress_percentage = $1,
            last_activity_at = CURRENT_TIMESTAMP,
            is_completed = CASE WHEN $2 >= 100 THEN 1 ELSE 0 END,
            completed_at = CASE WHEN $3 >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = $4 AND user_id = $5
      `,
      [progressPercentage, progressPercentage, progressPercentage, goalId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({
      goalId,
      progressPercentage,
      isCompleted: progressPercentage >= 100,
      updateReason,
      activityId
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ error: 'Error updating goal progress' });
  }
}