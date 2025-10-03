import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getGoalTemplates(req, res);
  } else if (req.method === 'POST') {
    return useGoalTemplate(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET: Buscar templates de objetivos
async function getGoalTemplates(req, res) {
  const { category, goalType, limit = 20 } = req.query;

  try {
    let templateQuery = `
      SELECT
        id,
        title,
        description,
        category,
        goal_type,
        suggested_activities,
        reflective_questions,
        milestones,
        estimated_duration_weeks,
        use_count,
        success_rate
      FROM goal_templates
      WHERE is_active = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      templateQuery += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (goalType && goalType !== 'all') {
      templateQuery += ` AND goal_type = $${paramIndex}`;
      queryParams.push(goalType);
      paramIndex++;
    }

    templateQuery += ` ORDER BY use_count DESC, success_rate DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));

    const { rows: goalTemplates } = await query(templateQuery, queryParams);

    // Para cada template, buscar as atividades sugeridas
    const templatesWithActivities = await Promise.all(
      goalTemplates.map(async (template) => {
        if (template.suggested_activities && template.suggested_activities.length > 0) {
          const activityIds = template.suggested_activities;

          const { rows: activities } = await query(`
            SELECT
              id,
              title,
              description,
              impact_estimate,
              effort_estimate,
              duration_estimate,
              leverage_score
            FROM activity_templates
            WHERE id = ANY($1)
            AND is_active = true
          `, [activityIds]);

          return {
            ...template,
            activities
          };
        }
        return {
          ...template,
          activities: []
        };
      })
    );

    res.json({
      templates: templatesWithActivities,
      total: templatesWithActivities.length
    });
  } catch (error) {
    console.error('Error fetching goal templates:', error);
    res.status(500).json({ error: 'Error fetching goal templates' });
  }
}

// POST: Usar template de objetivo
async function useGoalTemplate(req, res) {
  const { userId, templateId, goalId, customizations } = req.body;

  if (!userId || !templateId) {
    return res.status(400).json({ error: 'userId and templateId are required' });
  }

  try {
    // Incrementar contador de uso
    await query(`
      UPDATE goal_templates
      SET use_count = use_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [templateId]);

    // Registrar uso pelo usuário
    await query(`
      INSERT INTO user_template_usage (
        user_id,
        template_id,
        template_type,
        goal_id,
        customizations,
        outcome
      )
      VALUES ($1, $2, 'goal', $3, $4, 'in_progress')
    `, [userId, templateId, goalId || null, JSON.stringify(customizations || {})]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error using goal template:', error);
    res.status(500).json({ error: 'Error using goal template' });
  }
}