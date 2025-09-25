const express = require('express');
const multer = require('multer');
const fs = require('fs');
const SignalClassifier = require('./services/SignalClassifier');
const AdvancedAnalytics = require('./services/AdvancedAnalytics');
const { query } = require('../../../shared/database/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 4000;
const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const signalClassifier = new SignalClassifier();
const advancedAnalytics = new AdvancedAnalytics();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello from Signal Processor!');
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No audio file uploaded.');
  }

  try {
    const transcription = "Transcription placeholder - In production, this would use Google Cloud Speech-to-Text or similar service";
    fs.unlinkSync(req.file.path);
    res.json({ transcription: transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).send('Error transcribing audio.');
  }
});

app.post('/classify', async (req, res) => {
  const { description, duration, energyBefore, energyAfter, goalId } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const activity = {
      description,
      duration: parseInt(duration) || 0,
      energyBefore: parseInt(energyBefore) || 5,
      energyAfter: parseInt(energyAfter) || 5,
      goalId: goalId || null
    };

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
      (user_id, description, duration_minutes, energy_before, energy_after, signal_score, classification, confidence_score, reasoning, classification_method, transcription, goal_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
        activity.goalId
      ]
    );

    res.json(finalResult);
  } catch (error) {
    console.error('Error classifying activity:', error);
    res.status(500).send('Error classifying activity.');
  }
});

app.post('/insights', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { rows } = await query('SELECT * FROM activities WHERE user_id = $1', [userId]);
    const insights = advancedAnalytics.generateInsights(rows);
    res.json({ insights });
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error fetching activities' });
  }
});

app.post('/analyze-goals', async (req, res) => {
  const { context, goals, timeframe, experience, challenges } = req.body;

  if (!context || !goals || !timeframe || !experience || !challenges) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `...`; // Omitting the long prompt for brevity
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    const aiSuggestions = JSON.parse(text);
    res.json(aiSuggestions);
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    res.status(500).json({ error: 'Error generating goal suggestions' });
  }
});

app.get('/goals/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const goals = {
      short: rows.filter(goal => goal.goal_type === 'short'),
      medium: rows.filter(goal => goal.goal_type === 'medium'),
      long: rows.filter(goal => goal.goal_type === 'long')
    };
    res.json(goals);
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error fetching goals' });
  }
});

app.post('/goals', async (req, res) => {
  const { userId, title, description, goalType, aiSuggested } = req.body;

  if (!userId || !title || !goalType) {
    return res.status(400).json({ error: 'userId, title and goalType are required' });
  }

  const goalId = require('crypto').randomBytes(16).toString('hex');

  try {
    await query(
      'INSERT INTO goals (user_id, title, description, goal_type, ai_suggested) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, description || '', goalType, aiSuggested || false]
    );
    const { rows } = await query('SELECT * FROM goals WHERE id = $1', [goalId]);
    res.json(rows[0]);
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error creating goal' });
  }
});

app.put('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  const { title, description, goalType } = req.body;

  if (!title || !goalType) {
    return res.status(400).json({ error: 'title and goalType are required' });
  }

  try {
    const { rowCount } = await query(
      'UPDATE goals SET title = $1, description = $2, goal_type = $3 WHERE id = $4',
      [title, description || '', goalType, goalId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal updated successfully' });
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error updating goal' });
  }
});

app.delete('/goals/:goalId', async (req, res) => {
  const { goalId } = req.params;
  try {
    const { rowCount } = await query('DELETE FROM goals WHERE id = $1', [goalId]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error deleting goal' });
  }
});

app.get('/goal/:goalId', async (req, res) => {
  const { goalId } = req.params;
  try {
    const { rows } = await query('SELECT * FROM goals WHERE id = $1', [goalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(err.message);
    return res.status(500).json({ error: 'Error fetching goal' });
  }
});

app.listen(port, () => {
  console.log(`Signal Processor listening at http://localhost:${port}`);
});
