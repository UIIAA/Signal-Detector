import { query } from '../../../shared/database/db';
const SignalClassifier = require('../../api-backend/services/SignalClassifier');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, duration, energyBefore, energyAfter, goalId, impact, effort } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const activity = {
      description,
      duration: parseInt(duration) || 0,
      energyBefore: parseInt(energyBefore) || 5,
      energyAfter: parseInt(energyAfter) || 5,
      goalId: goalId || null,
      impact: parseInt(impact) || 5,
      effort: parseInt(effort) || 5
    };

    const signalClassifier = new SignalClassifier();

    let goalContext = null;
    if (activity.goalId) {
      try {
        const { rows } = await query('SELECT * FROM goals WHERE id = $1', [activity.goalId]);
        const goal = rows[0];

        if (goal) {
          goalContext = {
            id: goal.id,
            text: goal.title,
            typeName: goal.goal_type === 'short' ? 'Curto Prazo' :
                     goal.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo'
          };
        }
      } catch (error) {
        console.error('Error fetching goal:', error);
      }
    }

    const ruleResult = signalClassifier.classifyByRules(activity);
    let finalResult;

    if (ruleResult.confidence < 0.8) {
      const aiResult = await signalClassifier.classifyWithAI(activity, goalContext);
      if (aiResult) {
        finalResult = {
          ...aiResult,
          classification: aiResult.score > 70 ? 'SINAL' : aiResult.score < 40 ? 'RUÍDO' : 'NEUTRO',
          confidence: Math.max(ruleResult.confidence, 0.8),
          method: goalContext ? 'ai_with_goal' : 'ai'
        };
      } else {
        finalResult = { ...ruleResult };
      }
    } else {
      if (goalContext) {
        const aiResult = await signalClassifier.classifyWithAI(activity, goalContext);
        if (aiResult) {
          finalResult = {
            ...aiResult,
            classification: aiResult.score > 70 ? 'SINAL' : aiResult.score < 40 ? 'RUÍDO' : 'NEUTRO',
            confidence: 0.9,
            method: 'ai_with_goal'
          };
        } else {
          finalResult = { ...ruleResult };
        }
      } else {
        finalResult = { ...ruleResult };
      }
    }

    await query(`INSERT INTO activities
      (user_id, description, duration_minutes, energy_before, energy_after, signal_score, classification, confidence_score, reasoning, classification_method, transcription, goal_id, impact, effort)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        'default-user',
        activity.description,
        activity.duration,
        activity.energyBefore,
        activity.energyAfter,
        finalResult.score,
        finalResult.classification,
        finalResult.confidence,
        finalResult.reasoning,
        finalResult.method,
        '',
        activity.goalId,
        activity.impact,
        activity.effort
      ]
    );

    let connectedGoals = [];
    if (finalResult.classification === 'SINAL' && finalResult.score > 60) {
      try {
        const { rows } = await query(`
            SELECT g.id, g.title, g.goal_type, g.progress_percentage
            FROM goals g
            WHERE g.user_id = 'default-user'
            AND g.is_completed = 0
            ORDER BY
              CASE WHEN g.id = $1 THEN 0 ELSE 1 END,
              g.progress_percentage ASC
            LIMIT 3
          `, [activity.goalId]);
        connectedGoals = rows.map((goal, index) => ({
          id: goal.id,
          title: goal.title,
          type: goal.goal_type,
          typeName: goal.goal_type === 'short' ? 'Curto Prazo' :
                   goal.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo',
          currentProgress: goal.progress_percentage,
          impactScore: goal.id === activity.goalId ? 90 : Math.max(60 - (index * 15), 40),
          progressContribution: goal.id === activity.goalId ? 15 : Math.max(10 - (index * 3), 3)
        }));
      } catch (error) {
        console.error('Error fetching connected goals:', error);
      }
    }

    res.json({
      ...finalResult,
      connectedGoals
    });
  } catch (error) {
    console.error('Error classifying activity:', error);
    res.status(500).json({ error: 'Error classifying activity' });
  }
}