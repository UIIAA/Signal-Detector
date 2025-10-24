import { query } from '../../../shared/database/db';
const SignalClassifier = require('../../src/services/SignalClassifier');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description, duration, energyBefore, energyAfter, goalId, impact, effort, userId } = req.body;

  console.log('Classify API called with:', { description, duration, energyBefore, energyAfter, goalId, impact, effort, userId });

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
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
      (id, user_id, description, duration_minutes, energy_before, energy_after, signal_score, classification, confidence_score, reasoning, classification_method, transcription, goal_id, impact, effort)
      VALUES (encode(gen_random_bytes(16), 'hex'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId,
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
            SELECT g.id, g.title, g.goal_type, g.current_value, g.target_value
            FROM goals g
            WHERE g.user_id = $1
            AND g.is_active = true
            ORDER BY
              CASE WHEN g.id = $2 THEN 0 ELSE 1 END,
              g.current_value / GREATEST(g.target_value, 1) ASC
            LIMIT 3
          `, [userId, activity.goalId]);
        connectedGoals = rows.map((goal, index) => ({
          id: goal.id,
          title: goal.title,
          type: goal.goal_type,
          typeName: goal.goal_type === 'short' ? 'Curto Prazo' :
                   goal.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo',
          currentProgress: goal.target_value > 0 ? (goal.current_value / goal.target_value * 100) : 0,
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
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      error: 'Error classifying activity',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}