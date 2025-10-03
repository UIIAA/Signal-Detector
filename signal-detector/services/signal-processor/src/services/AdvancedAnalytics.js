
const GenerativeAI = require("./GenerativeAI");

class AdvancedAnalytics {
  constructor() {
    this.generativeAI = new GenerativeAI();
  }

  async generateInsights(activities) {
    if (!activities || activities.length === 0) {
      return {};
    }

    const prompt = `
      Analise as seguintes atividades de um usuário e gere insights e recomendações de produtividade.
      Atividades: ${JSON.stringify(activities, null, 2)}

      Gere o seguinte JSON:
      {
        "bestProductiveHours": "(string)",
        "worstProductiveHours": "(string)",
        "energyPatterns": "(string)",
        "recommendations": [
          "(string)",
          "(string)"
        ],
        "predictions": "(string)"
      }
    `;

    try {
      const result = await this.generativeAI.generate(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error("Error generating insights with AI:", error);
      return {
        bestProductiveHours: "",
        worstProductiveHours: "",
        energyPatterns: "",
        recommendations: [],
        predictions: "",
      };
    }
  }
}

module.exports = AdvancedAnalytics;
