/**
 * EfficiencyCalculator.js
 *
 * Serviço para calcular métricas de eficiência de atividades.
 * Fórmula principal: Pontos de Eficiência = (Impacto × 2) / Tempo em horas
 */

export class EfficiencyCalculator {
  /**
   * Calcula a pontuação de eficiência de uma atividade
   * @param {Object} activity - Objeto da atividade
   * @param {number} activity.impact - Impacto no objetivo (1-10)
   * @param {number} activity.duration_minutes - Duração em minutos
   * @returns {number} - Pontos de eficiência (0-∞)
   */
  static calculateEfficiency(activity) {
    const { impact, duration_minutes, duration } = activity;

    // Validação de dados
    if (!impact || (!duration_minutes && !duration)) {
      console.warn('EfficiencyCalculator: missing required fields', activity);
      return 0;
    }

    const durationValue = duration_minutes || duration || 0;

    // Evitar divisão por zero
    if (durationValue <= 0) {
      return 0;
    }

    const hours = durationValue / 60;
    const efficiency = (impact * 2) / hours;

    return Math.round(efficiency * 100) / 100; // Arredondar para 2 casas decimais
  }

  /**
   * Classifica a eficiência em categorias
   * @param {number} efficiencyScore - Score de eficiência
   * @returns {Object} - { level, label, color, description }
   */
  static classifyEfficiency(efficiencyScore) {
    if (efficiencyScore >= 15) {
      return {
        level: 'excellent',
        label: 'Excelente',
        color: '#10b981', // green-500
        description: 'Alta alavancagem - priorize atividades assim!'
      };
    } else if (efficiencyScore >= 10) {
      return {
        level: 'good',
        label: 'Boa',
        color: '#3b82f6', // blue-500
        description: 'Boa eficiência - atividade produtiva'
      };
    } else if (efficiencyScore >= 5) {
      return {
        level: 'moderate',
        label: 'Moderada',
        color: '#f59e0b', // amber-500
        description: 'Eficiência moderada - pode melhorar'
      };
    } else {
      return {
        level: 'low',
        label: 'Baixa',
        color: '#ef4444', // red-500
        description: 'Baixa eficiência - considere alternativas'
      };
    }
  }

  /**
   * Calcula o custo de oportunidade de uma atividade de baixa eficiência
   * @param {Object} currentActivity - Atividade atual
   * @param {Array} topActivities - Array das melhores atividades do usuário
   * @param {number} maxAlternatives - Número máximo de alternativas a retornar
   * @returns {Object} - { opportunityCost, alternatives[] }
   */
  static calculateOpportunityCost(currentActivity, topActivities = [], maxAlternatives = 3) {
    const currentEfficiency = this.calculateEfficiency(currentActivity);

    // Filtrar apenas atividades com eficiência significativamente maior
    const betterActivities = topActivities
      .map(activity => ({
        ...activity,
        efficiency: this.calculateEfficiency(activity)
      }))
      .filter(activity => activity.efficiency > currentEfficiency * 1.5) // 50% maior
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, maxAlternatives);

    if (betterActivities.length === 0) {
      return {
        opportunityCost: 0,
        currentEfficiency,
        alternatives: [],
        hasOpportunityCost: false
      };
    }

    // Calcular custo de oportunidade baseado na melhor alternativa
    const bestAlternative = betterActivities[0];
    const currentDurationHours = (currentActivity.duration_minutes || currentActivity.duration) / 60;

    // Quantas vezes a atividade mais eficiente poderia ser feita no mesmo tempo
    const alternativeCount = Math.floor(
      currentDurationHours / ((bestAlternative.duration_minutes || bestAlternative.duration) / 60)
    );

    // Impacto potencial perdido
    const potentialImpact = alternativeCount * bestAlternative.impact * 2;
    const actualImpact = currentActivity.impact * 2;
    const opportunityCost = Math.max(0, potentialImpact - actualImpact);

    return {
      opportunityCost: Math.round(opportunityCost * 100) / 100,
      currentEfficiency,
      alternatives: betterActivities.map(activity => ({
        title: activity.description || activity.title,
        impact: activity.impact,
        effort: activity.effort,
        duration: activity.duration_minutes || activity.duration,
        efficiency: activity.efficiency,
        reasoning: this.generateReasoning(activity, currentActivity)
      })),
      hasOpportunityCost: opportunityCost > 0,
      metrics: {
        currentEfficiency,
        bestAlternativeEfficiency: bestAlternative.efficiency,
        efficiencyGap: bestAlternative.efficiency - currentEfficiency,
        timeInvested: currentDurationHours,
        potentialImpact,
        actualImpact
      }
    };
  }

  /**
   * Gera justificativa para alternativa sugerida
   * @private
   */
  static generateReasoning(alternative, current) {
    const reasons = [];

    const efficiencyDiff = alternative.efficiency / this.calculateEfficiency(current);
    if (efficiencyDiff >= 2) {
      reasons.push(`${Math.round(efficiencyDiff)}x mais eficiente`);
    }

    if (alternative.impact > current.impact) {
      reasons.push('Maior impacto no objetivo');
    }

    if (alternative.effort < current.effort) {
      reasons.push('Menor esforço necessário');
    }

    const altDuration = (alternative.duration_minutes || alternative.duration) / 60;
    const currDuration = (current.duration_minutes || current.duration) / 60;
    if (altDuration < currDuration) {
      reasons.push('Menos tempo necessário');
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Atividade de alta alavancagem';
  }

  /**
   * Calcula estatísticas de eficiência para um conjunto de atividades
   * @param {Array} activities - Array de atividades
   * @returns {Object} - Estatísticas agregadas
   */
  static calculateStats(activities) {
    if (!activities || activities.length === 0) {
      return {
        total: 0,
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
        highEfficiencyCount: 0,
        lowEfficiencyCount: 0
      };
    }

    const efficiencies = activities
      .map(activity => this.calculateEfficiency(activity))
      .filter(eff => eff > 0)
      .sort((a, b) => a - b);

    if (efficiencies.length === 0) {
      return {
        total: activities.length,
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
        highEfficiencyCount: 0,
        lowEfficiencyCount: 0
      };
    }

    const average = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;
    const median = efficiencies[Math.floor(efficiencies.length / 2)];
    const highest = efficiencies[efficiencies.length - 1];
    const lowest = efficiencies[0];

    return {
      total: activities.length,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      highEfficiencyCount: efficiencies.filter(eff => eff >= 10).length,
      lowEfficiencyCount: efficiencies.filter(eff => eff < 5).length,
      distribution: {
        excellent: efficiencies.filter(eff => eff >= 15).length,
        good: efficiencies.filter(eff => eff >= 10 && eff < 15).length,
        moderate: efficiencies.filter(eff => eff >= 5 && eff < 10).length,
        low: efficiencies.filter(eff => eff < 5).length
      }
    };
  }

  /**
   * Cria ranking de atividades por eficiência
   * @param {Array} activities - Array de atividades
   * @param {number} limit - Limite de atividades no ranking
   * @returns {Array} - Array ordenado por eficiência
   */
  static createRanking(activities, limit = 10) {
    return activities
      .map(activity => ({
        ...activity,
        efficiency: this.calculateEfficiency(activity),
        classification: this.classifyEfficiency(this.calculateEfficiency(activity))
      }))
      .filter(activity => activity.efficiency > 0)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, limit)
      .map((activity, index) => ({
        ...activity,
        rank: index + 1
      }));
  }

  /**
   * Verifica se uma atividade deve gerar alerta de custo de oportunidade
   * @param {Object} activity - Atividade a verificar
   * @returns {boolean}
   */
  static shouldAlertOpportunityCost(activity) {
    const efficiency = this.calculateEfficiency(activity);
    const classification = this.classifyEfficiency(efficiency);

    // Alertar se:
    // 1. Eficiência baixa (< 5)
    // 2. Ou está no Q4 da matriz (baixo impacto + alto esforço)
    const isLowEfficiency = classification.level === 'low';
    const isQ4 = activity.impact < 5 && activity.effort > 5;

    return isLowEfficiency || isQ4;
  }
}

export default EfficiencyCalculator;