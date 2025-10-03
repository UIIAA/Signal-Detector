import { query } from '../../../../shared/database/db';
import EfficiencyCalculator from '../../../src/services/EfficiencyCalculator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, goalId, limit = 10, minImpact = 7 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Filtro opcional por objetivo
    const goalFilter = goalId ? 'AND goal_id = $2' : '';
    const queryParams = goalId ? [userId, goalId] : [userId];

    // Buscar atividades de alta eficiência
    const { rows: activities } = await query(`
      SELECT
        id,
        description,
        duration_minutes,
        impact,
        effort,
        signal_score,
        classification,
        goal_id,
        created_at
      FROM activities
      WHERE user_id = $1
      ${goalFilter}
      AND duration_minutes > 0
      AND impact >= ${parseInt(minImpact)}
      ORDER BY created_at DESC
      LIMIT 100
    `, queryParams);

    // Calcular eficiência e criar ranking
    const ranking = EfficiencyCalculator.createRanking(activities, parseInt(limit));

    // Agrupar por padrões de atividade
    const patterns = identifyActivityPatterns(ranking);

    // Calcular insights
    const insights = generateInsights(ranking, patterns);

    res.json({
      topActivities: ranking,
      patterns,
      insights,
      total: activities.length,
      averageEfficiency: ranking.length > 0
        ? (ranking.reduce((sum, a) => sum + a.efficiency, 0) / ranking.length).toFixed(2)
        : 0
    });
  } catch (error) {
    console.error('Error fetching top efficient activities:', error);
    res.status(500).json({ error: 'Error fetching top efficient activities' });
  }
}

// Identificar padrões em atividades de alta eficiência
function identifyActivityPatterns(activities) {
  const patterns = {
    highImpactLowEffort: [],
    quickWins: [],
    strategicMoves: [],
    repeatable: []
  };

  activities.forEach(activity => {
    // Q1: Alto impacto + Baixo esforço
    if (activity.impact >= 7 && activity.effort <= 3) {
      patterns.highImpactLowEffort.push({
        id: activity.id,
        description: activity.description,
        impact: activity.impact,
        effort: activity.effort,
        efficiency: activity.efficiency
      });
    }

    // Quick Wins: Duração curta + Boa eficiência
    if (activity.duration_minutes <= 30 && activity.efficiency >= 10) {
      patterns.quickWins.push({
        id: activity.id,
        description: activity.description,
        duration: activity.duration_minutes,
        efficiency: activity.efficiency
      });
    }

    // Strategic Moves: Altíssimo impacto (9-10)
    if (activity.impact >= 9) {
      patterns.strategicMoves.push({
        id: activity.id,
        description: activity.description,
        impact: activity.impact,
        efficiency: activity.efficiency
      });
    }

    // Analisar se é repetível (baseado em keywords)
    const repeatableKeywords = [
      'reunião', 'meeting', 'call', 'café', 'coffee',
      'feedback', 'revisão', 'review', 'estudo', 'study'
    ];

    const isRepeatable = repeatableKeywords.some(keyword =>
      activity.description.toLowerCase().includes(keyword)
    );

    if (isRepeatable && activity.efficiency >= 10) {
      patterns.repeatable.push({
        id: activity.id,
        description: activity.description,
        efficiency: activity.efficiency,
        suggestion: 'Considere agendar regularmente'
      });
    }
  });

  return patterns;
}

// Gerar insights baseados nos padrões
function generateInsights(activities, patterns) {
  const insights = [];

  if (patterns.highImpactLowEffort.length >= 3) {
    insights.push({
      type: 'opportunity',
      title: 'Você tem atividades Q1 comprovadas',
      description: `${patterns.highImpactLowEffort.length} atividades de alto impacto e baixo esforço identificadas. Priorize essas sempre!`,
      priority: 'high',
      actionable: true
    });
  }

  if (patterns.quickWins.length >= 5) {
    insights.push({
      type: 'strategy',
      title: 'Quick Wins funcionam para você',
      description: `Você tem ${patterns.quickWins.length} atividades rápidas (<30min) com alta eficiência. Use-as para manter momentum.`,
      priority: 'medium',
      actionable: true
    });
  }

  if (patterns.strategicMoves.length >= 2) {
    const avgEfficiency = (
      patterns.strategicMoves.reduce((sum, a) => sum + a.efficiency, 0) /
      patterns.strategicMoves.length
    ).toFixed(1);

    insights.push({
      type: 'impact',
      title: 'Atividades estratégicas de alto impacto',
      description: `${patterns.strategicMoves.length} atividades com impacto 9-10 e eficiência média de ${avgEfficiency}. Continue priorizando essas!`,
      priority: 'high',
      actionable: false
    });
  }

  if (patterns.repeatable.length >= 3) {
    insights.push({
      type: 'habit',
      title: 'Atividades repetíveis de alta eficiência',
      description: `${patterns.repeatable.length} atividades eficientes que podem virar rotina. Considere agendar recorrência.`,
      priority: 'medium',
      actionable: true,
      suggestions: patterns.repeatable.slice(0, 3).map(a => a.description)
    });
  }

  // Insight sobre consistência
  const efficiencyScores = activities.map(a => a.efficiency);
  const avgEfficiency = efficiencyScores.reduce((sum, e) => sum + e, 0) / efficiencyScores.length;
  const variance = efficiencyScores.reduce((sum, e) => sum + Math.pow(e - avgEfficiency, 2), 0) / efficiencyScores.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 3 && avgEfficiency >= 12) {
    insights.push({
      type: 'performance',
      title: 'Consistência excepcional',
      description: `Suas atividades de alta eficiência são consistentes (desvio: ${stdDev.toFixed(1)}). Continue assim!`,
      priority: 'low',
      actionable: false
    });
  }

  return insights;
}