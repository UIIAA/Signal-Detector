import { query } from '../../../../shared/database/db';
import EfficiencyCalculator from '../../../src/services/EfficiencyCalculator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, activityDescription, impact, effort, duration, category } = req.body;

  if (!userId || !activityDescription) {
    return res.status(400).json({ error: 'userId and activityDescription are required' });
  }

  try {
    // Calcular eficiência da atividade atual
    const currentActivity = {
      description: activityDescription,
      impact: impact || 5,
      effort: effort || 5,
      duration_minutes: duration || 60
    };

    const currentEfficiency = EfficiencyCalculator.calculateEfficiency(currentActivity);

    // Se já é eficiente (>= 10), não sugerir alternativas
    if (currentEfficiency >= 10) {
      return res.json({
        shouldSubstitute: false,
        message: 'Atividade já tem boa eficiência',
        currentEfficiency,
        alternatives: []
      });
    }

    // Buscar templates de atividades de alta alavancagem na categoria
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
        use_count
      FROM activity_templates
      WHERE is_active = true
      AND leverage_score >= 15
    `;

    const queryParams = [];

    if (category) {
      templateQuery += ` AND category = $1`;
      queryParams.push(category);
    }

    templateQuery += ` ORDER BY leverage_score DESC, use_count DESC LIMIT 5`;

    const { rows: templates } = await query(templateQuery, queryParams);

    // Se não encontrou templates, buscar atividades eficientes do próprio usuário
    if (templates.length === 0) {
      const { rows: userActivities } = await query(`
        SELECT
          description,
          impact,
          effort,
          duration_minutes
        FROM activities
        WHERE user_id = $1
        AND impact >= 7
        AND duration_minutes > 0
        ORDER BY signal_score DESC
        LIMIT 5
      `, [userId]);

      const alternatives = userActivities.map(activity => {
        const efficiency = EfficiencyCalculator.calculateEfficiency(activity);
        return {
          title: activity.description,
          description: 'Baseado no seu histórico',
          impact: activity.impact,
          effort: activity.effort,
          duration: activity.duration_minutes,
          efficiency,
          source: 'user_history',
          reasoning: 'Você já fez isso antes com sucesso'
        };
      });

      return res.json({
        shouldSubstitute: true,
        currentEfficiency,
        alternatives,
        message: 'Sugestões baseadas no seu histórico'
      });
    }

    // Processar templates em alternativas
    const alternatives = templates.map(template => {
      const templateActivity = {
        impact: template.impact_estimate,
        effort: template.effort_estimate,
        duration_minutes: template.duration_estimate
      };

      const efficiency = EfficiencyCalculator.calculateEfficiency(templateActivity);
      const improvementPotential = efficiency - currentEfficiency;

      return {
        templateId: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        impact: template.impact_estimate,
        effort: template.effort_estimate,
        duration: template.duration_estimate,
        efficiency,
        leverageScore: parseFloat(template.leverage_score),
        tags: template.tags,
        useCount: template.use_count,
        improvementPotential,
        source: 'template',
        reasoning: generateReasoning(template, currentActivity, improvementPotential)
      };
    });

    // Ordenar por potencial de melhoria
    alternatives.sort((a, b) => b.improvementPotential - a.improvementPotential);

    // Salvar sugestão no banco (async, não bloqueante)
    if (alternatives.length > 0) {
      saveSmartSubstitution(userId, currentActivity, alternatives[0]);
    }

    res.json({
      shouldSubstitute: true,
      currentEfficiency,
      alternatives: alternatives.slice(0, 3), // Top 3
      message: `Você pode melhorar sua eficiência em até ${alternatives[0]?.improvementPotential?.toFixed(1)} pontos`
    });
  } catch (error) {
    console.error('Error suggesting alternatives:', error);
    res.status(500).json({ error: 'Error suggesting alternatives' });
  }
}

// Gerar justificativa para a alternativa
function generateReasoning(template, currentActivity, improvementPotential) {
  const reasons = [];

  if (improvementPotential >= 10) {
    reasons.push(`${improvementPotential.toFixed(0)}x mais eficiente`);
  }

  if (template.impact_estimate > currentActivity.impact) {
    reasons.push('Maior impacto no objetivo');
  }

  if (template.effort_estimate < currentActivity.effort) {
    reasons.push('Menor esforço necessário');
  }

  if (template.duration_estimate < currentActivity.duration_minutes) {
    reasons.push('Menos tempo necessário');
  }

  if (template.use_count > 10) {
    reasons.push(`Usado com sucesso por ${template.use_count} pessoas`);
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Atividade de alta alavancagem comprovada';
}

// Salvar substituição sugerida no banco
async function saveSmartSubstitution(userId, currentActivity, alternative) {
  try {
    await query(`
      INSERT INTO smart_substitutions (
        user_id,
        original_description,
        original_impact,
        original_effort,
        original_duration,
        suggested_template_id,
        suggested_activity,
        reasoning,
        improvement_potential,
        user_action
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
    `, [
      userId,
      currentActivity.description,
      currentActivity.impact,
      currentActivity.effort,
      currentActivity.duration_minutes,
      alternative.templateId || null,
      JSON.stringify(alternative),
      alternative.reasoning,
      alternative.improvementPotential
    ]);
  } catch (error) {
    console.error('Error saving smart substitution:', error);
  }
}