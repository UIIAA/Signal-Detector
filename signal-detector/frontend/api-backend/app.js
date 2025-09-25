const express = require('express');
const multer = require('multer');
const fs = require('fs');
const SignalClassifier = require('./services/SignalClassifier');
const AdvancedAnalytics = require('./services/AdvancedAnalytics');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

console.log('Starting Signal Processor...');

const app = express();
const port = 4000;
const upload = multer({ dest: 'uploads/' });

console.log('Initializing Google Generative AI...');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('Creating SignalClassifier...');
const signalClassifier = new SignalClassifier();
console.log('Creating AdvancedAnalytics...');
const advancedAnalytics = new AdvancedAnalytics();

console.log('Setting up database connection...');
const dbPath = __dirname + '../../../shared/database/signal.db';
console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the signal database.');
  }
});

app.use(express.json());

// Add CORS middleware
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
    // Note: In a production environment, we would use a dedicated speech-to-text service
    // such as Google Cloud Speech-to-Text or similar for actual audio transcription.
    // For this prototype, we're using a placeholder.
    const transcription = "Transcription placeholder - In production, this would use Google Cloud Speech-to-Text or similar service";

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // For now, just return the transcription
    res.json({ transcription: transcription });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).send('Error transcribing audio.');
  }
});

app.post('/classify', async (req, res) => {
  const { description, duration, energyBefore, energyAfter, goalId, goalIds } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    // Create activity object
    const activity = {
      description,
      duration: parseInt(duration) || 0,
      energyBefore: parseInt(energyBefore) || 5,
      energyAfter: parseInt(energyAfter) || 5,
      goalId: goalId || null,
      goalIds: goalIds || (goalId ? [goalId] : []) // Support both single and multiple goals
    };

    // Get goal context - for now we'll use the first goal for classification
    // In the future, we can enhance this to consider multiple goals
    let goalContext = null;
    if (activity.goalIds.length > 0) {
      try {
        const goal = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM goals WHERE id = ?', [activity.goalIds[0]], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

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

    // First try rule-based classification
    const ruleResult = signalClassifier.classifyByRules(activity);

    let finalResult;

    // If confidence is low, use AI classification
    if (ruleResult.confidence < 0.8) {
      const aiResult = await signalClassifier.classifyWithAI(activity, goalContext);
      if (aiResult) {
        finalResult = {
          ...aiResult,
          classification: aiResult.score > 70 ? 'SINAL' : aiResult.score < 40 ? 'RUÍDO' : 'NEUTRO',
          confidence: Math.max(ruleResult.confidence, 0.8), // AI results have higher confidence
          method: goalContext ? 'ai_with_goal' : 'ai'
        };
      } else {
        finalResult = { ...ruleResult };
      }
    } else {
      // Even with high confidence from rules, if we have a goal context, let AI refine the classification
      if (goalContext) {
        const aiResult = await signalClassifier.classifyWithAI(activity, goalContext);
        if (aiResult) {
          finalResult = {
            ...aiResult,
            classification: aiResult.score > 70 ? 'SINAL' : aiResult.score < 40 ? 'RUÍDO' : 'NEUTRO',
            confidence: 0.9, // High confidence when we have goal context
            method: 'ai_with_goal'
          };
        } else {
          finalResult = { ...ruleResult };
        }
      } else {
        finalResult = { ...ruleResult };
      }
    }

    // Save to database
    const stmt = db.prepare(`INSERT INTO activities
      (user_id, description, duration_minutes, energy_before, energy_after, signal_score, classification, confidence_score, reasoning, classification_method, transcription, goal_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run(
      'default-user', // In a real app, this would come from auth
      activity.description,
      activity.duration,
      activity.energyBefore,
      activity.energyAfter,
      finalResult.score,
      finalResult.classification,
      finalResult.confidence,
      finalResult.reasoning,
      finalResult.method,
      '', // No transcription for text entries
      activity.goalIds.length > 0 ? activity.goalIds[0] : null // Use first goal for backward compatibility
    );
    
    stmt.finalize();
    
    // Save activity-goal relationships for multiple goals
    if (activity.goalIds.length > 0) {
      const activityId = require('crypto').randomBytes(16).toString('hex');
      
      // First, get the last inserted activity ID
      db.get("SELECT last_insert_rowid() as id", [], (err, row) => {
        if (!err && row) {
          const insertedActivityId = row.id;
          
          // Insert relationships for all goals
          const insertRelationship = (goalId, callback) => {
            const relStmt = db.prepare(`INSERT INTO activity_goals 
              (activity_id, goal_id) 
              VALUES (?, ?)`);
            relStmt.run(insertedActivityId.toString(), goalId, callback);
            relStmt.finalize();
          };
          
          // Insert all relationships
          activity.goalIds.forEach((goalId, index) => {
            insertRelationship(goalId, (err) => {
              if (err) {
                console.error('Error saving activity-goal relationship:', err);
              }
              // After the last relationship is saved, we can respond
              if (index === activity.goalIds.length - 1) {
                // We've already sent the response, so we just log if needed
              }
            });
          });
        }
      });
    }

    res.json(finalResult);
  } catch (error) {
    console.error('Error classifying activity:', error);
    res.status(500).send('Error classifying activity.');
  }
});

app.post('/insights', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  db.all('SELECT * FROM activities WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching activities' });
    }

    const insights = advancedAnalytics.generateInsights(rows);

    res.json({ insights });
  });
});

// New endpoint for suggesting related goals
app.post('/suggest-goals', async (req, res) => {
  const { activityDescription, selectedGoalIds, userId } = req.body;

  if (!activityDescription || !selectedGoalIds || !userId) {
    return res.status(400).json({ error: 'activityDescription, selectedGoalIds, and userId are required' });
  }

  try {
    // Get all user's goals
    const allGoals = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM goals WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Filter out already selected goals
    const unselectedGoals = allGoals.filter(goal => !selectedGoalIds.includes(goal.id));

    if (unselectedGoals.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Use AI to analyze which unselected goals might be related
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Com base na descrição de uma atividade e em objetivos já selecionados, identifique quais outros objetivos do usuário 
    também poderiam estar relacionados a essa atividade.

    ATIVIDADE: "${activityDescription}"

    OBJETIVOS JÁ SELECIONADOS:
    ${selectedGoalIds.map(id => {
      const goal = allGoals.find(g => g.id === id);
      return goal ? `- ${goal.title} (${goal.goal_type === 'short' ? 'Curto' : goal.goal_type === 'medium' ? 'Médio' : 'Longo'} Prazo)` : '';
    }).join('
')}

    OUTROS OBJETIVOS DISPONÍVEIS:
    ${unselectedGoals.map(goal => `- ${goal.id}: ${goal.title} (${goal.goal_type === 'short' ? 'Curto' : goal.goal_type === 'medium' ? 'Médio' : 'Longo'} Prazo)`).join('
')}

    INSTRUÇÕES:
    1. Analise a atividade e os objetivos já selecionados
    2. Identifique quais dos outros objetivos disponíveis também poderiam ser relevantes
    3. Considere similaridade temática, complementaridade e sinergia entre objetivos
    4. Retorne APENAS um array JSON com os IDs dos objetivos sugeridos
    5. Se não houver sugestões relevantes, retorne um array vazio

    Exemplo de resposta: ["id1", "id2", "id3"]

    Responda APENAS com o array JSON de IDs:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response to extract valid JSON
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    let suggestedGoalIds = [];
    try {
      suggestedGoalIds = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to selecting a few random unselected goals
      suggestedGoalIds = unselectedGoals.slice(0, 3).map(goal => goal.id);
    }

    // Get the full goal objects for the suggestions
    const suggestions = suggestedGoalIds
      .map(id => unselectedGoals.find(goal => goal.id === id))
      .filter(goal => goal !== undefined);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting goals:', error);
    // Fallback to random selection
    const allGoals = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM goals WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const unselectedGoals = allGoals.filter(goal => !selectedGoalIds.includes(goal.id));
    const suggestions = unselectedGoals.slice(0, 3);
    
    res.json({ suggestions });
  }
});

app.post('/analyze-goals', async (req, res) => {
  const { context, goals, timeframe, experience, challenges } = req.body;

  if (!context || !goals || !timeframe || !experience || !challenges) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Como um especialista em definição de objetivos e produtividade, analise o perfil abaixo e forneça sugestões SMART personalizadas:

CONTEXTO PESSOAL:
${context}

OBJETIVOS DESEJADOS:
${goals}

PRAZO ESPERADO:
${timeframe}

NÍVEL DE EXPERIÊNCIA:
${experience}

DESAFIOS PREVISTOS:
${challenges}

Por favor, forneça:

1. ANÁLISE do perfil e viabilidade dos objetivos
2. CRONOGRAMA sugerido realista
3. OBJETIVOS DE CURTO PRAZO (0-3 meses) - 3 objetivos específicos e acionáveis
4. OBJETIVOS DE MÉDIO PRAZO (3-12 meses) - 3 objetivos que construam sobre os de curto prazo
5. OBJETIVOS DE LONGO PRAZO (1+ anos) - 3 objetivos visionários

Responda APENAS em formato JSON válido:
{
  "insights": "análise do perfil e viabilidade",
  "timeline": "cronograma sugerido",
  "shortTerm": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "mediumTerm": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "longTerm": ["objetivo 1", "objetivo 2", "objetivo 3"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove code block formatting if present
    text = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

    try {
      const aiSuggestions = JSON.parse(text);
      res.json(aiSuggestions);
    } catch (parseError) {
      // If JSON parsing fails, provide fallback response
      console.error('Error parsing AI response:', parseError);
      res.json({
        shortTerm: [
          "Definir cronograma detalhado das primeiras etapas",
          "Identificar recursos necessários imediatamente",
          "Estabelecer métricas de progresso semanais"
        ],
        mediumTerm: [
          "Desenvolver competências específicas necessárias",
          "Construir rede de contatos na área",
          "Implementar sistema de acompanhamento de progresso"
        ],
        longTerm: [
          "Estabelecer posição de referência no campo escolhido",
          "Criar estratégia de crescimento sustentável",
          "Desenvolver capacidade de mentoria para outros"
        ],
        insights: "Baseado no contexto fornecido, recomendo focar inicialmente em objetivos de curto prazo bem definidos que criem momentum para as metas maiores.",
        timeline: "Sugiro uma abordagem em fases: 3 meses para estabelecer bases, 12 meses para consolidar competências e 3+ anos para alcançar posição de destaque."
      });
    }
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    // Provide fallback response in case of API error
    res.json({
      shortTerm: [
        "Definir cronograma detalhado das primeiras etapas",
        "Identificar recursos necessários imediatamente",
        "Estabelecer métricas de progresso semanais"
      ],
      mediumTerm: [
        "Desenvolver competências específicas necessárias",
        "Construir rede de contatos na área",
        "Implementar sistema de acompanhamento de progresso"
      ],
      longTerm: [
        "Estabelecer posição de referência no campo escolhido",
        "Criar estratégia de crescimento sustentável",
        "Desenvolver capacidade de mentoria para outros"
      ],
      insights: "Baseado no contexto fornecido, recomendo focar inicialmente em objetivos de curto prazo bem definidos que criem momentum para as metas maiores.",
      timeline: "Sugiro uma abordagem em fases: 3 meses para estabelecer bases, 12 meses para consolidar competências e 3+ anos para alcançar posição de destaque."
    });
  }
});

// Goals CRUD endpoints
app.get('/goals/:userId', (req, res) => {
  const { userId } = req.params;

  db.all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching goals' });
    }

    // Group goals by type
    const goals = {
      short: rows.filter(goal => goal.goal_type === 'short'),
      medium: rows.filter(goal => goal.goal_type === 'medium'),
      long: rows.filter(goal => goal.goal_type === 'long')
    };

    res.json(goals);
  });
});

app.post('/goals', (req, res) => {
  const { userId, title, description, goalType, aiSuggested } = req.body;

  if (!userId || !title || !goalType) {
    return res.status(400).json({ error: 'userId, title and goalType are required' });
  }

  const stmt = db.prepare(`INSERT INTO goals
    (user_id, title, description, goal_type, ai_suggested)
    VALUES (?, ?, ?, ?, ?)`);

  const goalId = require('crypto').randomBytes(16).toString('hex');

  stmt.run(
    userId,
    title,
    description || '',
    goalType,
    aiSuggested || false,
    function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Error creating goal' });
      }

      // Return the created goal
      db.get('SELECT * FROM goals WHERE rowid = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Error fetching created goal' });
        }
        res.json(row);
      });
    }
  );

  stmt.finalize();
});

app.put('/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  const { title, description, goalType } = req.body;

  if (!title || !goalType) {
    return res.status(400).json({ error: 'title and goalType are required' });
  }

  const stmt = db.prepare(`UPDATE goals
    SET title = ?, description = ?, goal_type = ?
    WHERE id = ?`);

  stmt.run(title, description || '', goalType, goalId, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error updating goal' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal updated successfully' });
  });

  stmt.finalize();
});

app.delete('/goals/:goalId', (req, res) => {
  const { goalId } = req.params;

  const stmt = db.prepare('DELETE FROM goals WHERE id = ?');

  stmt.run(goalId, function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error deleting goal' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  });

  stmt.finalize();
});

// Get specific goal by ID (for activity linking)
app.get('/goal/:goalId', (req, res) => {
  const { goalId } = req.params;

  db.get('SELECT * FROM goals WHERE id = ?', [goalId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error fetching goal' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(row);
  });
});

// New endpoint to get most signaled objectives
app.post('/top-goals', (req, res) => {
  console.log('Top goals endpoint called');
  const { userId, timeframe } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Default to last 7 days if no timeframe specified
  const days = timeframe === 'month' ? 30 : timeframe === 'day' ? 1 : 7;
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  const query = `
    SELECT 
      g.id,
      g.title,
      g.goal_type,
      COUNT(a.id) as activity_count,
      AVG(CAST(a.signal_score AS FLOAT)) as avg_signal_score,
      SUM(CASE WHEN a.classification = 'SINAL' THEN 1 ELSE 0 END) as signal_count,
      SUM(CASE WHEN a.classification = 'RUÍDO' THEN 1 ELSE 0 END) as noise_count
    FROM goals g
    LEFT JOIN activity_goals ag ON g.id = ag.goal_id
    LEFT JOIN activities a ON ag.activity_id = a.id
    WHERE g.user_id = ? 
      AND (a.created_at IS NULL OR a.created_at >= ?)
    GROUP BY g.id, g.title, g.goal_type
    HAVING activity_count > 0
    ORDER BY signal_count DESC, avg_signal_score DESC
    LIMIT 10
  `;

  db.all(query, [userId, dateLimit.toISOString()], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Error fetching top goals: ' + err.message });
    }

    // Format the response
    const topGoals = rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.goal_type,
      typeName: row.goal_type === 'short' ? 'Curto Prazo' : 
                row.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo',
      activityCount: row.activity_count,
      avgSignalScore: row.avg_signal_score ? Math.round(row.avg_signal_score) : 0,
      signalCount: row.signal_count,
      noiseCount: row.noise_count,
      signalPercentage: row.activity_count > 0 ? 
        Math.round((row.signal_count / row.activity_count) * 100) : 0
    }));

    res.json({ topGoals });
  });
});

app.listen(port, () => {
  console.log(`Signal Processor listening at http://localhost:${port}`);
});