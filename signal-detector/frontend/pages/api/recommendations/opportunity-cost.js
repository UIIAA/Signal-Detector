import { query } from '../../../../shared/database/db';
import EfficiencyCalculator from '../../../src/services/EfficiencyCalculator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, activityId } = req.body;

  if (!userId || !activityId) {
    return res.status(400).json({ error: 'userId and activityId are required' });
  }

  try {
    // Buscar atividade atual
    const { rows: currentActivityRows } = await query(`
      SELECT
        id,
        description,
        duration_minutes,
        impact,
        effort,
        signal_score,
        classification,
        goal_id
      FROM activities
      WHERE id = $1 AND user_id = $2
    `, [activityId, userId]);

    if (currentActivityRows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const currentActivity = currentActivityRows[0];

    // Verificar se deve alertar sobre custo de oportunidade
    if (!EfficiencyCalculator.shouldAlertOpportunityCost(currentActivity)) {
      return res.json({
        shouldAlert: false,
        message: 'Activity has acceptable efficiency',
        currentActivity: {
          ...currentActivity,
          efficiency: EfficiencyCalculator.calculateEfficiency(currentActivity)
        }
      });
    }

    // Buscar atividades de alta eficiência do usuário (últimos 3 meses)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { rows: topActivities } = await query(`
      SELECT
        id,
        description,
        duration_minutes,
        impact,
        effort,
        signal_score,
        classification,
        goal_id
      FROM activities
      WHERE user_id = $1
      AND created_at >= $2
      AND duration_minutes > 0
      AND impact >= 7
      ORDER BY signal_score DESC
      LIMIT 20
    `, [userId, threeMonthsAgo.toISOString()]);

    // Calcular custo de oportunidade
    const opportunityCostData = EfficiencyCalculator.calculateOpportunityCost(
      currentActivity,
      topActivities,
      3 // máximo de 3 alternativas
    );

    // Se não há custo de oportunidade significativo, não alertar
    if (!opportunityCostData.hasOpportunityCost) {
      return res.json({
        shouldAlert: false,
        message: 'No significant opportunity cost found',
        currentActivity: {
          ...currentActivity,
          efficiency: EfficiencyCalculator.calculateEfficiency(currentActivity)
        }
      });
    }

    // Salvar alerta no banco
    const alertId = await saveOpportunityCostAlert(
      userId,
      activityId,
      opportunityCostData
    );

    res.json({
      shouldAlert: true,
      alertId,
      currentActivity: {
        ...currentActivity,
        efficiency: EfficiencyCalculator.calculateEfficiency(currentActivity),
        classification: EfficiencyCalculator.classifyEfficiency(
          EfficiencyCalculator.calculateEfficiency(currentActivity)
        )
      },
      opportunityCost: opportunityCostData.opportunityCost,
      alternatives: opportunityCostData.alternatives,
      metrics: opportunityCostData.metrics,
      message: `Esta atividade tem baixa eficiência. Você poderia ganhar ${opportunityCostData.opportunityCost.toFixed(1)} pontos de impacto focando em alternativas de alta alavancagem.`
    });
  } catch (error) {
    console.error('Error calculating opportunity cost:', error);
    res.status(500).json({ error: 'Error calculating opportunity cost' });
  }
}

// Função auxiliar: salvar alerta de custo de oportunidade
async function saveOpportunityCostAlert(userId, activityId, opportunityCostData) {
  try {
    const { rows } = await query(`
      INSERT INTO opportunity_cost_alerts (
        user_id,
        activity_id,
        opportunity_cost,
        alternative_suggestions,
        user_action
      )
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `, [
      userId,
      activityId,
      opportunityCostData.opportunityCost,
      JSON.stringify(opportunityCostData.alternatives)
    ]);

    return rows[0].id;
  } catch (error) {
    console.error('Error saving opportunity cost alert:', error);
    return null;
  }
}