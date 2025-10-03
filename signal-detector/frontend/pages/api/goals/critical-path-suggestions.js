import { query } from '../../../../shared/database/db';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, goalId } = req.body;

  if (!userId || !goalId) {
    return res.status(400).json({ error: 'userId and goalId are required' });
  }

  try {
    // Buscar informações do objetivo
    const { rows: goalRows } = await query(`
      SELECT
        id,
        title,
        description,
        goal_type,
        target_value,
        current_value,
        progress_percentage,
        created_at
      FROM goals
      WHERE id = $1 AND user_id = $2
    `, [goalId, userId]);

    if (goalRows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goalRows[0];

    // Buscar atividades anteriores do usuário relacionadas ao objetivo
    const { rows: relatedActivities } = await query(`
      SELECT
        description,
        duration_minutes,
        impact,
        effort,
        signal_score,
        classification
      FROM activities
      WHERE user_id = $1
      AND (goal_id = $2 OR impact >= 7)
      ORDER BY signal_score DESC
      LIMIT 20
    `, [userId, goalId]);

    // Buscar histórico geral do usuário para contexto
    const { rows: userStats } = await query(`
      SELECT
        COUNT(*) as total_activities,
        AVG(impact) as avg_impact,
        AVG(duration_minutes) as avg_duration,
        SUM(CASE WHEN classification = 'high-leverage' THEN 1 ELSE 0 END) as high_leverage_count
      FROM activities
      WHERE user_id = $1
    `, [userId]);

    // Gerar sugestões com IA
    const suggestions = await generateCriticalPathSuggestions(
      goal,
      relatedActivities,
      userStats[0]
    );

    res.json({
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        progress: goal.progress_percentage
      },
      suggestions,
      metadata: {
        basedOnActivities: relatedActivities.length,
        userContext: {
          totalActivities: parseInt(userStats[0].total_activities),
          avgImpact: parseFloat(userStats[0].avg_impact || 0).toFixed(1),
          highLeverageRate: userStats[0].total_activities > 0
            ? ((userStats[0].high_leverage_count / userStats[0].total_activities) * 100).toFixed(1)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error generating critical path suggestions:', error);
    res.status(500).json({ error: 'Error generating critical path suggestions' });
  }
}

// Função principal: gerar sugestões de rota crítica com IA
async function generateCriticalPathSuggestions(goal, relatedActivities, userStats) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Construir contexto do usuário
    const userContext = buildUserContext(relatedActivities, userStats);

    const prompt = `Você é um especialista em produtividade e planejamento estratégico baseado em princípios de alta alavancagem.

OBJETIVO DO USUÁRIO:
Título: "${goal.title}"
Descrição: "${goal.description || 'Não fornecida'}"
Tipo: ${goal.goal_type === 'short' ? 'Curto prazo (até 3 meses)' : goal.goal_type === 'medium' ? 'Médio prazo (3-12 meses)' : 'Longo prazo (1+ anos)'}
Progresso atual: ${goal.progress_percentage || 0}%

CONTEXTO DO USUÁRIO:
${userContext}

TAREFA:
Sugira 4-6 atividades de ROTA CRÍTICA para alcançar este objetivo, seguindo princípios de alta alavancagem:

1. Priorize atividades Q1 (Alto Impacto + Baixo Esforço)
2. Cada atividade deve ser específica, mensurável e acionável
3. Ordene por impacto e dependências lógicas
4. Inclua deadlines realistas baseados no tipo de objetivo
5. Evite atividades genéricas ou óbvias

PRINCÍPIOS DE ALAVANCAGEM:
- Foco no 20% que gera 80% dos resultados (Pareto)
- Atividades que desbloqueiam outras atividades
- Ações de alta visibilidade e impacto estratégico
- Construção de relacionamentos-chave
- Desenvolvimento de capacidades multiplicadoras

Para cada atividade, forneça:
- title: Título claro e acionável (max 60 caracteres)
- description: Descrição detalhada com contexto (2-3 frases)
- impact: Impacto no objetivo (1-10, priorize 7-10)
- effort: Esforço necessário (1-10, priorize 1-5)
- estimatedDuration: Duração estimada em minutos
- deadline: Prazo sugerido (formato YYYY-MM-DD)
- order: Ordem de execução (1, 2, 3...)
- reasoning: Por que esta atividade é crítica (1-2 frases)

Responda APENAS com JSON válido no formato:
[
  {
    "title": "...",
    "description": "...",
    "impact": 9,
    "effort": 3,
    "estimatedDuration": 60,
    "deadline": "2025-11-15",
    "order": 1,
    "reasoning": "..."
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Adicionar IDs e metadados
    return suggestions.map((activity, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      ...activity,
      leverage_score: calculateLeverageScore(activity.impact, activity.effort),
      confidence: 0.85,
      source: 'ai_generated'
    }));

  } catch (error) {
    console.error('Error with AI generation:', error);

    // Fallback: sugestões genéricas baseadas em melhores práticas
    return generateFallbackSuggestions(goal);
  }
}

// Construir contexto rico do usuário para a IA
function buildUserContext(relatedActivities, userStats) {
  let context = `Total de atividades registradas: ${userStats.total_activities}\n`;
  context += `Impacto médio das atividades: ${parseFloat(userStats.avg_impact || 0).toFixed(1)}/10\n`;
  context += `Duração média: ${Math.round(userStats.avg_duration || 0)} minutos\n`;

  if (relatedActivities.length > 0) {
    context += `\nAtividades de alta eficiência anteriores do usuário:\n`;
    relatedActivities.slice(0, 5).forEach((activity, i) => {
      context += `${i + 1}. "${activity.description}" (Impacto: ${activity.impact}, Esforço: ${activity.effort}, ${activity.duration_minutes}min)\n`;
    });
  }

  return context;
}

// Calcular score de alavancagem
function calculateLeverageScore(impact, effort) {
  // Fórmula: quanto maior o impacto e menor o esforço, maior a alavancagem
  return parseFloat(((impact / effort) * 10).toFixed(1));
}

// Fallback se IA falhar
function generateFallbackSuggestions(goal) {
  const baseDate = new Date();
  const deadlineOffset = goal.goal_type === 'short' ? 7 : goal.goal_type === 'medium' ? 14 : 30;

  return [
    {
      id: `fallback-${Date.now()}-1`,
      title: 'Identificar stakeholders-chave e alinhar expectativas',
      description: 'Marcar reunião com as pessoas que têm poder de decisão ou influência sobre este objetivo. Garantir alinhamento de expectativas e obter apoio explícito.',
      impact: 9,
      effort: 2,
      estimatedDuration: 45,
      deadline: new Date(baseDate.setDate(baseDate.getDate() + 3)).toISOString().split('T')[0],
      order: 1,
      reasoning: 'Alavancagem máxima: relacionamento com decisores pode abrir portas e remover bloqueios',
      leverage_score: 45,
      confidence: 0.7,
      source: 'fallback'
    },
    {
      id: `fallback-${Date.now()}-2`,
      title: 'Criar plano de ação com 3 marcos principais',
      description: 'Definir 3 marcos mensuráveis que indicam progresso significativo. Para cada marco, listar as 2-3 ações críticas necessárias.',
      impact: 8,
      effort: 3,
      estimatedDuration: 90,
      deadline: new Date(baseDate.setDate(baseDate.getDate() + 7)).toISOString().split('T')[0],
      order: 2,
      reasoning: 'Planejamento estratégico é multiplicador: orienta todas as ações futuras',
      leverage_score: 26.7,
      confidence: 0.7,
      source: 'fallback'
    },
    {
      id: `fallback-${Date.now()}-3`,
      title: 'Executar ação de maior visibilidade',
      description: 'Identificar e executar UMA ação que demonstre progresso visível e comprometimento com o objetivo para todos os stakeholders.',
      impact: 9,
      effort: 5,
      estimatedDuration: 120,
      deadline: new Date(baseDate.setDate(baseDate.getDate() + deadlineOffset)).toISOString().split('T')[0],
      order: 3,
      reasoning: 'Visibilidade gera momentum, apoio e credibilidade para continuar',
      leverage_score: 18,
      confidence: 0.7,
      source: 'fallback'
    },
    {
      id: `fallback-${Date.now()}-4`,
      title: 'Buscar mentoria ou referência externa',
      description: 'Conversar com alguém que já alcançou objetivo similar. Pedir conselhos específicos sobre erros a evitar e atalhos possíveis.',
      impact: 8,
      effort: 2,
      estimatedDuration: 60,
      deadline: new Date(baseDate.setDate(baseDate.getDate() + 10)).toISOString().split('T')[0],
      order: 4,
      reasoning: 'Aprender com experiência alheia evita meses de tentativa e erro',
      leverage_score: 40,
      confidence: 0.7,
      source: 'fallback'
    }
  ];
}