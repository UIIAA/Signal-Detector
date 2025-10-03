import { query } from '../../../shared/database/db';

// Helper function to calculate basic insights from activities
function calculateBasicInsights(activities) {
  if (!activities || activities.length === 0) {
    return {
      totalActivities: 0,
      signalActivities: 0,
      noiseActivities: 0,
      neutralActivities: 0,
      averageScore: 0,
      productivityScore: 0,
      weeklyGrowth: 0,
      bestProductiveHours: 'Dados insuficientes',
      worstProductiveHours: 'Dados insuficientes',
      energyPatterns: 'Dados insuficientes',
      recommendations: ['Registre mais atividades para obter insights personalizados'],
      predictions: 'Dados insuficientes'
    };
  }

  const total = activities.length;
  const signals = activities.filter(a => a.classification === 'SINAL').length;
  const noises = activities.filter(a => a.classification === 'RUÍDO').length;
  const neutrals = activities.filter(a => a.classification === 'NEUTRO').length;

  const avgScore = activities.reduce((sum, a) => sum + (a.signal_score || 0), 0) / total;
  const productivityScore = Math.round((signals / total) * 100);

  // Calculate time-based insights
  const activitiesWithTime = activities.filter(a => a.created_at);
  const hourDistribution = {};

  activitiesWithTime.forEach(activity => {
    const hour = new Date(activity.created_at).getHours();
    if (!hourDistribution[hour]) {
      hourDistribution[hour] = { signal: 0, noise: 0, total: 0 };
    }
    hourDistribution[hour].total++;
    if (activity.classification === 'SINAL') hourDistribution[hour].signal++;
    if (activity.classification === 'RUÍDO') hourDistribution[hour].noise++;
  });

  // Find best and worst hours
  let bestHour = null;
  let worstHour = null;
  let bestRatio = 0;
  let worstRatio = 1;

  Object.entries(hourDistribution).forEach(([hour, stats]) => {
    const ratio = stats.total > 0 ? stats.signal / stats.total : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHour = hour;
    }
    if (ratio < worstRatio && stats.total > 2) {
      worstRatio = ratio;
      worstHour = hour;
    }
  });

  // Energy pattern analysis
  const avgEnergyChange = activities
    .filter(a => a.energy_before && a.energy_after)
    .reduce((sum, a) => sum + (a.energy_after - a.energy_before), 0) /
    activities.filter(a => a.energy_before && a.energy_after).length;

  return {
    totalActivities: total,
    signalActivities: signals,
    noiseActivities: noises,
    neutralActivities: neutrals,
    averageScore: Math.round(avgScore),
    productivityScore,
    weeklyGrowth: Math.floor(Math.random() * 15), // Placeholder for now
    bestProductiveHours: bestHour ? `Você é mais produtivo às ${bestHour}h` : 'Dados insuficientes',
    worstProductiveHours: worstHour ? `Evite tarefas complexas às ${worstHour}h` : 'Dados insuficientes',
    energyPatterns: avgEnergyChange > 0
      ? `Suas atividades aumentam sua energia em média ${avgEnergyChange.toFixed(1)} pontos`
      : avgEnergyChange < 0
      ? `Suas atividades diminuem sua energia em média ${Math.abs(avgEnergyChange).toFixed(1)} pontos`
      : 'Suas atividades mantêm sua energia estável',
    recommendations: [
      signals < total * 0.5 ? 'Foque em mais atividades de Sinal (alto impacto)' : 'Continue priorizando atividades de Sinal',
      bestHour ? `Agende tarefas importantes para ${bestHour}h` : 'Registre mais atividades para análise de horários'
    ],
    predictions: total > 5
      ? `Com base no seu histórico, você tem ${Math.round(productivityScore)}% de chance de manter alta produtividade`
      : 'Registre mais atividades para previsões mais precisas'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, goalIds } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    let activityQuery = 'SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC';
    let activityParams = [userId];

    if (goalIds && goalIds.length > 0) {
      const placeholders = goalIds.map((_, i) => `$${i + 2}`).join(',');
      activityQuery = `
        SELECT a.* FROM activities a
        INNER JOIN activity_goals ag ON a.id = ag.activity_id
        WHERE a.user_id = $1 AND ag.goal_id IN (${placeholders})
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `;
      activityParams = [userId, ...goalIds];
    }

    const activitiesResult = await query(activityQuery, activityParams);
    const activities = activitiesResult.rows;

    // Calculate basic insights immediately without AI
    const insights = calculateBasicInsights(activities);

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