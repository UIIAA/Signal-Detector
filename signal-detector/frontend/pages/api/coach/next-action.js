import { query } from '../../../../shared/database/db';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 1. Buscar contexto do usuário
    const userContext = await getUserContext(userId);

    // 2. Analisar com IA para sugerir próxima ação
    const recommendation = await generateNextActionRecommendation(userContext);

    res.json(recommendation);
  } catch (error) {
    console.error('Error generating next action:', error);
    res.status(500).json({ error: 'Error generating next action recommendation' });
  }
}

// Buscar contexto completo do usuário
async function getUserContext(userId) {
  try {
    // Objetivos ativos
    const { rows: goals } = await query(`
      SELECT
        id,
        title,
        description,
        goal_type,
        progress_percentage,
        ideal_path,
        framework_type,
        created_at
      FROM goals
      WHERE user_id = $1
      AND is_active = true
      AND progress_percentage < 100
      ORDER BY
        CASE
          WHEN progress_percentage < 25 THEN 1
          WHEN progress_percentage >= 75 THEN 3
          ELSE 2
        END,
        created_at DESC
      LIMIT 5
    `, [userId]);

    // Atividades recentes
    const { rows: recentActivities } = await query(`
      SELECT
        description,
        impact,
        effort,
        duration_minutes,
        signal_score,
        classification,
        created_at
      FROM activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    // Blocos agendados próximos
    const { rows: upcomingBlocks } = await query(`
      SELECT
        title,
        block_type,
        scheduled_date,
        start_time,
        goal_id
      FROM time_blocks
      WHERE user_id = $1
      AND scheduled_date >= CURRENT_DATE
      AND status = 'scheduled'
      ORDER BY scheduled_date, start_time
      LIMIT 5
    `, [userId]);

    // Estatísticas de eficiência recente
    const { rows: efficiencyStats } = await query(`
      SELECT
        AVG(impact) as avg_impact,
        AVG(effort) as avg_effort,
        COUNT(*) FILTER (WHERE classification = 'high-leverage') as high_leverage_count,
        COUNT(*) as total_count
      FROM activities
      WHERE user_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [userId]);

    return {
      goals,
      recentActivities,
      upcomingBlocks,
      efficiencyStats: efficiencyStats[0] || {},
      currentTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    throw error;
  }
}

// Gerar recomendação com IA
async function generateNextActionRecommendation(context) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildCoachPrompt(context);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const recommendation = JSON.parse(jsonMatch[0]);

    return {
      ...recommendation,
      context: {
        goalsAnalyzed: context.goals.length,
        activitiesAnalyzed: context.recentActivities.length,
        blocksScheduled: context.upcomingBlocks.length
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error with AI generation:', error);

    // Fallback: recomendação baseada em regras
    return generateRuleBasedRecommendation(context);
  }
}

// Construir prompt para o Coach IA
function buildCoachPrompt(context) {
  const now = new Date();
  const hour = now.getHours();
  const dayPeriod = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  let prompt = `Você é um Coach de Produtividade IA especializado em alta alavancagem e priorização estratégica.

CONTEXTO ATUAL:
- Hora: ${dayPeriod} (${hour}h)
- Data: ${now.toLocaleDateString('pt-BR')}

OBJETIVOS ATIVOS (${context.goals.length}):
`;

  context.goals.forEach((goal, i) => {
    prompt += `${i + 1}. "${goal.title}" (${goal.goal_type}, ${goal.progress_percentage}% completo)\n`;
    if (goal.ideal_path && goal.ideal_path.activities) {
      const nextActivity = goal.ideal_path.activities.find(a => a.status !== 'completed');
      if (nextActivity) {
        prompt += `   Próxima atividade crítica: "${nextActivity.title}"\n`;
      }
    }
  });

  prompt += `\nATIVIDADES RECENTES (últimas ${context.recentActivities.length}):
`;

  context.recentActivities.slice(0, 5).forEach((activity, i) => {
    prompt += `- "${activity.description}" (Impacto: ${activity.impact}, Esforço: ${activity.effort}, ${activity.duration_minutes}min)\n`;
  });

  prompt += `\nESTATÍSTICAS DA SEMANA:
- Impacto médio: ${context.efficiencyStats.avg_impact?.toFixed(1) || 'N/A'}/10
- ${context.efficiencyStats.high_leverage_count || 0} atividades de alta alavancagem de ${context.efficiencyStats.total_count || 0} totais
`;

  if (context.upcomingBlocks.length > 0) {
    prompt += `\nBLOCOS AGENDADOS PRÓXIMOS:
`;
    context.upcomingBlocks.forEach((block, i) => {
      prompt += `- ${block.scheduled_date.toLocaleDateString('pt-BR')} às ${block.start_time}: "${block.title}"\n`;
    });
  }

  prompt += `\nTAREFA:
Analise o contexto do usuário e recomende a MELHOR PRÓXIMA AÇÃO para agora, considerando:
1. Objetivos que precisam de atenção urgente
2. Atividades de alta alavancagem (alto impacto + baixo esforço)
3. Momento do dia (energia e foco disponível)
4. Progresso recente e momentum

REGRAS:
- Priorize ações Q1 (Alto Impacto + Baixo Esforço)
- Sugira algo concreto e acionável AGORA
- Tempo máximo: 90 minutos
- Justifique sua recomendação

Responda APENAS com JSON válido no formato:
{
  "action": "Título da ação recomendada (claro e acionável)",
  "description": "Descrição detalhada do que fazer",
  "goalId": "ID do objetivo relacionado (ou null)",
  "goalTitle": "Título do objetivo",
  "estimatedDuration": 60,
  "estimatedImpact": 9,
  "estimatedEffort": 3,
  "reasoning": "Por que esta é a melhor próxima ação agora (2-3 frases)",
  "urgencyLevel": "high|medium|low",
  "alternativeActions": [
    {
      "action": "Alternativa 1",
      "duration": 30,
      "impact": 7,
      "effort": 2
    }
  ]
}`;

  return prompt;
}

// Fallback: recomendação baseada em regras
function generateRuleBasedRecommendation(context) {
  const now = new Date();
  const hour = now.getHours();

  // Priorizar objetivo com menor progresso e atividade crítica pendente
  let recommendedGoal = null;
  let recommendedActivity = null;

  for (const goal of context.goals) {
    if (goal.ideal_path && goal.ideal_path.activities) {
      const nextActivity = goal.ideal_path.activities.find(a => a.status !== 'completed');
      if (nextActivity) {
        recommendedGoal = goal;
        recommendedActivity = nextActivity;
        break;
      }
    }
  }

  // Se não tem rota crítica, sugerir trabalho no objetivo com menor progresso
  if (!recommendedGoal && context.goals.length > 0) {
    recommendedGoal = context.goals[0];
  }

  const isMorning = hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;

  let action, description, estimatedDuration, estimatedImpact, estimatedEffort, reasoning;

  if (recommendedActivity) {
    action = recommendedActivity.title;
    description = recommendedActivity.description;
    estimatedDuration = recommendedActivity.estimatedDuration || 60;
    estimatedImpact = recommendedActivity.impact;
    estimatedEffort = recommendedActivity.effort;
    reasoning = `Esta é a próxima atividade crítica na rota ideal do objetivo "${recommendedGoal.title}". ${
      isMorning ? 'Período da manhã é ideal para atividades de alto impacto.' : ''
    }`;
  } else if (recommendedGoal) {
    action = `Avançar no objetivo: ${recommendedGoal.title}`;
    description = `Trabalhar em atividade de alta alavancagem para o objetivo "${recommendedGoal.title}"`;
    estimatedDuration = 60;
    estimatedImpact = 8;
    estimatedEffort = 4;
    reasoning = `Este objetivo está em ${recommendedGoal.progress_percentage}% de progresso e precisa de atenção.`;
  } else {
    action = 'Definir objetivo claro';
    description = 'Criar um objetivo específico e definir rota crítica';
    estimatedDuration = 30;
    estimatedImpact = 9;
    estimatedEffort = 2;
    reasoning = 'Antes de agir, é importante ter objetivos claros definidos.';
  }

  return {
    action,
    description,
    goalId: recommendedGoal?.id || null,
    goalTitle: recommendedGoal?.title || null,
    estimatedDuration,
    estimatedImpact,
    estimatedEffort,
    reasoning,
    urgencyLevel: recommendedGoal && recommendedGoal.progress_percentage < 25 ? 'high' : 'medium',
    alternativeActions: [],
    source: 'rule-based',
    context: {
      goalsAnalyzed: context.goals.length,
      activitiesAnalyzed: context.recentActivities.length,
      blocksScheduled: context.upcomingBlocks.length
    },
    generatedAt: new Date().toISOString()
  };
}