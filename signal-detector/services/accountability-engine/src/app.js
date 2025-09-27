
const express = require('express');
const { query } = require('../../../shared/database/db');
const PatternAnalyzer = require('./services/PatternAnalyzer');
const PNLCoach = require('./services/PNLCoach');

const app = express();
const port = 5001;

const patternAnalyzer = new PatternAnalyzer();
const pnlCoach = new PNLCoach();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Accountability Engine!');
});

app.post('/analyze-patterns', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { rows } = await query('SELECT * FROM activities WHERE user_id = $1', [userId]);
    const patterns = patternAnalyzer.analyze(rows);

    for (const pattern of patterns) {
      await query(
        'INSERT INTO user_patterns (user_id, pattern_type, confidence_score, supporting_data) VALUES ($1, $2, $3, $4)',
        [userId, pattern.pattern_type, pattern.confidence_score, pattern.supporting_data]
      );
    }

    res.json({ patterns });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Error analyzing patterns' });
  }
});

app.post('/generate-coaching-session', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { rows: patterns } = await query('SELECT * FROM user_patterns WHERE user_id = $1 ORDER BY detected_at DESC LIMIT 5', [userId]);
    const coachingQuestion = pnlCoach.generateCoachingQuestion(patterns);

    await query(
      'INSERT INTO coaching_sessions (user_id, nlp_technique, coaching_question) VALUES ($1, $2, $3)',
      [userId, coachingQuestion.nlpTechnique, coachingQuestion.question]
    );

    res.json({ coachingQuestion });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Error generating coaching session' });
  }
});

app.listen(port, () => {
  console.log(`Accountability Engine listening at http://localhost:${port}`);
});
