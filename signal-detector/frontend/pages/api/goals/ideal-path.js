import { query } from '../../../../shared/database/db';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  const { goalId, userId } = req.query;

  if (!goalId || !userId) {
    return res.status(400).json({ error: 'goalId and userId are required' });
  }

  if (req.method === 'GET') {
    // Recuperar rota ideal existente
    try {
      const { rows } = await query(`
        SELECT
          id,
          title,
          description,
          goal_type,
          ideal_path,
          ideal_path_created_at,
          ideal_path_updated_at,
          progress_percentage,
          target_value,
          current_value
        FROM goals
        WHERE id = $1 AND user_id = $2
      `, [goalId, userId]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      const goal = rows[0];

      // Se não tem rota ideal, retornar null
      if (!goal.ideal_path) {
        return res.json({
          goal,
          hasIdealPath: false,
          idealPath: null,
          deviation: null
        });
      }

      // Calcular desvio da rota ideal
      const deviation = calculateDeviation(goal);

      res.json({
        goal,
        hasIdealPath: true,
        idealPath: goal.ideal_path,
        deviation
      });
    } catch (error) {
      console.error('Error fetching ideal path:', error);
      res.status(500).json({ error: 'Error fetching ideal path' });
    }

  } else if (req.method === 'POST') {
    // Criar rota ideal (com ajuda da IA)
    try {
      const { goalTitle, goalDescription, goalType, userContext } = req.body;

      // Gerar sugestões de atividades com IA
      const activities = await generateIdealPathWithAI(goalTitle, goalDescription, goalType, userContext);

      // Gerar milestones automáticos
      const milestones = generateMilestones(activities, goalType);

      const idealPath = {
        activities,
        milestones,
        metadata: {
          ai_generated: true,
          confidence_score: 0.85,
          created_at: new Date().toISOString(),
          based_on_templates: []
        }
      };

      // Salvar no banco
      await query(`
        UPDATE goals
        SET
          ideal_path = $1,
          ideal_path_created_at = CURRENT_TIMESTAMP,
          ideal_path_updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
      `, [JSON.stringify(idealPath), goalId, userId]);

      res.json({
        success: true,
        idealPath
      });
    } catch (error) {
      console.error('Error creating ideal path:', error);
      res.status(500).json({ error: 'Error creating ideal path' });
    }

  } else if (req.method === 'PUT') {
    // Atualizar rota ideal
    try {
      const { idealPath } = req.body;

      await query(`
        UPDATE goals
        SET
          ideal_path = $1,
          ideal_path_updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
      `, [JSON.stringify(idealPath), goalId, userId]);

      res.json({
        success: true,
        idealPath
      });
    } catch (error) {
      console.error('Error updating ideal path:', error);
      res.status(500).json({ error: 'Error updating ideal path' });
    }

  } else if (req.method === 'DELETE') {
    // Remover rota ideal
    try {
      await query(`
        UPDATE goals
        SET
          ideal_path = NULL,
          ideal_path_created_at = NULL,
          ideal_path_updated_at = NULL
        WHERE id = $1 AND user_id = $2
      `, [goalId, userId]);

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting ideal path:', error);
      res.status(500).json({ error: 'Error deleting ideal path' });
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Função auxiliar: gerar rota ideal com IA
async function generateIdealPathWithAI(goalTitle, goalDescription, goalType, userContext) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Você é um especialista em produtividade e planejamento estratégico.

Objetivo do usuário: "${goalTitle}"
Descrição: "${goalDescription || 'Não fornecida'}"
Tipo de objetivo: ${goalType === 'short' ? 'Curto prazo (até 3 meses)' : goalType === 'medium' ? 'Médio prazo (3-12 meses)' : 'Longo prazo (1+ anos)'}

Crie uma "rota crítica" de 3-5 atividades de alta alavancagem para alcançar este objetivo.

Para cada atividade, forneça:
- title: Título claro e acionável
- description: Descrição detalhada (1-2 frases)
- impact: Impacto no objetivo (1-10)
- effort: Esforço necessário (1-10)
- estimatedDuration: Duração estimada em minutos
- deadline: Prazo sugerido (formato YYYY-MM-DD)
- order: Ordem de execução (1, 2, 3...)

Responda APENAS com JSON válido no formato:
[
  {
    "title": "...",
    "description": "...",
    "impact": 9,
    "effort": 3,
    "estimatedDuration": 120,
    "deadline": "2025-11-15",
    "order": 1
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('IA não retornou JSON válido');
    }

    const activities = JSON.parse(jsonMatch[0]);

    // Adicionar IDs e status
    return activities.map((activity, index) => ({
      id: `activity-${Date.now()}-${index}`,
      ...activity,
      status: 'pending',
      completedAt: null
    }));

  } catch (error) {
    console.error('Error generating with AI:', error);

    // Fallback: atividades genéricas
    return generateFallbackActivities(goalTitle, goalType);
  }
}

// Fallback se IA falhar
function generateFallbackActivities(goalTitle, goalType) {
  const baseDeadline = new Date();
  baseDeadline.setDate(baseDeadline.getDate() + 14);

  return [
    {
      id: `activity-${Date.now()}-1`,
      title: `Definir plano de ação detalhado para "${goalTitle}"`,
      description: 'Criar um plano estruturado com etapas claras e mensuráveis',
      impact: 8,
      effort: 3,
      estimatedDuration: 90,
      deadline: baseDeadline.toISOString().split('T')[0],
      order: 1,
      status: 'pending'
    },
    {
      id: `activity-${Date.now()}-2`,
      title: 'Identificar recursos e ferramentas necessárias',
      description: 'Listar tudo que será necessário para executar o plano',
      impact: 7,
      effort: 2,
      estimatedDuration: 60,
      deadline: new Date(baseDeadline.setDate(baseDeadline.getDate() + 7)).toISOString().split('T')[0],
      order: 2,
      status: 'pending'
    },
    {
      id: `activity-${Date.now()}-3`,
      title: 'Executar primeira ação de alto impacto',
      description: 'Completar a atividade mais importante identificada',
      impact: 9,
      effort: 6,
      estimatedDuration: 180,
      deadline: new Date(baseDeadline.setDate(baseDeadline.getDate() + 7)).toISOString().split('T')[0],
      order: 3,
      status: 'pending'
    }
  ];
}

// Gerar milestones automáticos
function generateMilestones(activities, goalType) {
  const milestones = [];
  const activityCount = activities.length;

  activities.forEach((activity, index) => {
    const percentage = Math.round(((index + 1) / activityCount) * 100);
    milestones.push({
      percentage,
      date: activity.deadline,
      description: `${activity.title} concluída`,
      activityId: activity.id
    });
  });

  return milestones;
}

// Calcular desvio da rota ideal
function calculateDeviation(goal) {
  if (!goal.ideal_path || !goal.ideal_path.milestones) {
    return null;
  }

  const now = new Date();
  const currentProgress = goal.progress_percentage || 0;

  // Encontrar milestone mais próximo da data atual
  const nextMilestone = goal.ideal_path.milestones.find(m => new Date(m.date) >= now);

  if (!nextMilestone) {
    return {
      status: 'completed',
      message: 'Rota concluída ou prazo expirado',
      deviationPercentage: 0
    };
  }

  const expectedProgress = nextMilestone.percentage;
  const deviation = currentProgress - expectedProgress;

  return {
    status: deviation >= 0 ? 'ahead' : 'behind',
    message: deviation >= 0
      ? `Você está ${Math.abs(deviation)}% adiantado`
      : `Você está ${Math.abs(deviation)}% atrasado`,
    deviationPercentage: deviation,
    currentProgress,
    expectedProgress,
    nextMilestone
  };
}