// services/signal-processor/src/services/SignalClassifier.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class SignalClassifier {

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  advancesGoals(activity) {
    if (!activity || !activity.description) return false;
    return activity.description.toLowerCase().includes('goal');
  }

  isHighImpact(activity) {
    if (!activity || !activity.description) return false;
    return activity.description.toLowerCase().includes('impact');
  }

  isKnownDistraction(activity) {
    if (!activity || !activity.description) return false;
    const knownDistractions = ['social media', 'youtube', 'netflix', 'instagram', 'facebook', 'twitter'];
    return knownDistractions.some(distraction => activity.description.toLowerCase().includes(distraction));
  }
  
  // LAYER 1: Regras baseadas em primeiros princípios
  classifyByRules(activity) {
    let score = 50; // Neutro
    let reasoning = [];

    // REGRA 1: Avança objetivos específicos? (+30)
    if (this.advancesGoals(activity)) {
      score += 30;
      reasoning.push("Avança objetivos específicos");
    }

    // REGRA 2: Energia crescente? (+20) 
    if (activity.energyAfter > activity.energyBefore) {
      score += 20;
      reasoning.push("Aumentou energia");
    }

    // REGRA 3: Alto impacto, baixo tempo? (+20)
    if (activity.duration < 60 && this.isHighImpact(activity)) {
      score += 20;
      reasoning.push("Alto leverage");
    }

    // REGRA 4: Atividades de ruído conhecidas (-40)
    if (this.isKnownDistraction(activity)) {
      score -= 40;
      reasoning.push("Distração identificada");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      classification: score > 70 ? 'SINAL' : score < 40 ? 'RUÍDO' : 'NEUTRO',
      confidence: reasoning.length > 2 ? 0.8 : 0.5,
      reasoning: reasoning.join('; '),
      method: 'rules'
    };
  }

  // LAYER 2: Gemini para casos duvidosos
  async classifyWithAI(activity, goalContext = null) {
    let goalInfo = '';
    if (goalContext) {
      goalInfo = `
    OBJETIVO RELACIONADO: "${goalContext.text}" (${goalContext.typeName})
    ANÁLISE: Avalie se a atividade contribui diretamente para este objetivo específico.`;
    }

    const prompt = `
    Classifique como SINAL (avança objetivos) ou RUÍDO (distração):

    Atividade: "${activity.description}"
    Duração: ${activity.duration}min
    Energia: ${activity.energyBefore} → ${activity.energyAfter}${goalInfo}

    CRITÉRIOS:
    - SINAL (70-100): Contribui diretamente para objetivos ou crescimento pessoal/profissional
    - NEUTRO (40-69): Necessário mas não produtivo (manutenção, tarefas administrativas)
    - RUÍDO (0-39): Distração, procrastinação ou atividade contraproducente

    ${goalContext ? 'IMPORTANTE: Se há objetivo relacionado, priorize se a atividade contribui para esse objetivo específico.' : ''}

    Responda JSON: {"score": 0-100, "reasoning": "explicação breve focando na relação com objetivos"}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Clean up the response to extract valid JSON
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return null;
    }
  }
}

module.exports = SignalClassifier;
