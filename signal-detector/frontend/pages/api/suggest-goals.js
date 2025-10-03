import { query } from '../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { activityDescription, selectedGoalIds, userId } = req.body;

  if (!activityDescription) {
    return res.status(400).json({ error: 'Activity description is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Buscar objetivos do usuário que não estão selecionados
    const excludeIds = selectedGoalIds && selectedGoalIds.length > 0
      ? selectedGoalIds.map((_, index) => `$${index + 2}`).join(', ')
      : '';

    const excludeClause = excludeIds
      ? `AND id NOT IN (${excludeIds})`
      : '';

    const queryParams = [userId];
    if (selectedGoalIds && selectedGoalIds.length > 0) {
      queryParams.push(...selectedGoalIds);
    }

    const { rows } = await query(`
      SELECT id, title, description, goal_type
      FROM goals
      WHERE user_id = $1
      AND is_active = true
      ${excludeClause}
      ORDER BY created_at DESC
      LIMIT 5
    `, queryParams);

    // Analisar compatibilidade com base em palavras-chave simples
    const suggestions = rows.map(goal => {
      const activityLower = activityDescription.toLowerCase();
      const titleLower = goal.title.toLowerCase();
      const descLower = (goal.description || '').toLowerCase();

      // Score básico baseado em similaridade de palavras
      let relevanceScore = 0;

      // Palavras-chave comuns para desenvolvimento/estudo
      const studyKeywords = ['estudar', 'aprender', 'curso', 'programar', 'desenvolver', 'projeto'];
      const workKeywords = ['trabalho', 'profissional', 'carreira', 'skill', 'habilidade'];
      const healthKeywords = ['exercício', 'saúde', 'correr', 'academia', 'fitness'];

      if (studyKeywords.some(keyword => activityLower.includes(keyword))) {
        if (studyKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword))) {
          relevanceScore += 30;
        }
      }

      if (workKeywords.some(keyword => activityLower.includes(keyword))) {
        if (workKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword))) {
          relevanceScore += 25;
        }
      }

      if (healthKeywords.some(keyword => activityLower.includes(keyword))) {
        if (healthKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword))) {
          relevanceScore += 35;
        }
      }

      // Score adicional para objetivos de curto prazo (mais urgentes)
      if (goal.goal_type === 'short') {
        relevanceScore += 10;
      }

      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        type: goal.goal_type,
        relevanceScore,
        reasoning: relevanceScore > 20
          ? `Esta atividade parece relacionada com o objetivo "${goal.title}"`
          : `Objetivo geral que pode se beneficiar desta atividade`
      };
    }).filter(suggestion => suggestion.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    res.json({
      suggestions,
      message: suggestions.length > 0
        ? `Encontramos ${suggestions.length} objetivo(s) que podem se relacionar com esta atividade`
        : 'Não encontramos objetivos relacionados, mas você pode associar manualmente'
    });

  } catch (error) {
    console.error('Error suggesting goals:', error);
    res.status(500).json({
      error: 'Error suggesting goals',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}