import { query } from '../../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getTemplates(req, res);
  } else if (req.method === 'POST') {
    return useTemplate(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET: Buscar templates
async function getTemplates(req, res) {
  const { category, minLeverage = 10, limit = 20, search } = req.query;

  try {
    let templateQuery = `
      SELECT
        id,
        title,
        description,
        category,
        impact_estimate,
        effort_estimate,
        duration_estimate,
        leverage_score,
        tags,
        use_count,
        success_rate
      FROM activity_templates
      WHERE is_active = true
      AND leverage_score >= $1
    `;

    const queryParams = [parseFloat(minLeverage)];
    let paramIndex = 2;

    if (category && category !== 'all') {
      templateQuery += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      templateQuery += ` AND (
        title ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        $${paramIndex + 1} = ANY(tags)
      )`;
      queryParams.push(`%${search}%`, search);
      paramIndex += 2;
    }

    templateQuery += ` ORDER BY leverage_score DESC, use_count DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));

    const { rows: templates } = await query(templateQuery, queryParams);

    // Agrupar por categoria
    const groupedByCategory = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {});

    res.json({
      templates,
      groupedByCategory,
      total: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Error fetching templates' });
  }
}

// POST: Usar template (registrar uso)
async function useTemplate(req, res) {
  const { userId, templateId, customizations, activityId } = req.body;

  if (!userId || !templateId) {
    return res.status(400).json({ error: 'userId and templateId are required' });
  }

  try {
    // Incrementar contador de uso
    await query(`
      UPDATE activity_templates
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
        activity_id,
        customizations,
        outcome
      )
      VALUES ($1, $2, 'activity', $3, $4, 'in_progress')
    `, [userId, templateId, activityId || null, JSON.stringify(customizations || {})]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error using template:', error);
    res.status(500).json({ error: 'Error using template' });
  }
}