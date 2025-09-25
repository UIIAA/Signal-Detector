class AdvancedAnalytics {
  generateInsights(activities, keyActivities = []) {
    if (!activities || activities.length === 0) {
      return this.getEmptyStateInsights();
    }

    const signalActivities = activities.filter(a => a.classification === 'SINAL');
    const noiseActivities = activities.filter(a => a.classification === 'RUÍDO');
    const neutralActivities = activities.filter(a => a.classification === 'NEUTRO');

    return {
      totalActivities: activities.length,
      signalActivities: signalActivities.length,
      noiseActivities: noiseActivities.length,
      neutralActivities: neutralActivities.length,
      averageProductivity: signalActivities.length > 0 ?
        Math.round((signalActivities.reduce((sum, a) => sum + a.signal_score, 0) / signalActivities.length)) : 0,
      weeklyProductivity: this.generateWeeklyData(activities),
      progressComparison: this.generateProgressComparison(activities, keyActivities),
      recentActivities: activities.slice(0, 8).map(a => ({
        id: a.id,
        title: a.description,
        type: a.classification.toLowerCase(),
        score: a.signal_score,
        time: this.formatTimeAgo(a.created_at)
      })),
      bestProductiveHours: this.getBestProductiveHours(activities),
      worstProductiveHours: this.getWorstProductiveHours(activities),
      energyPatterns: this.getEnergyPatterns(activities),
      recommendations: this.getRecommendations(activities),
      predictions: this.getPredictions(activities),
    };
  }

  generateProgressComparison(activities, keyActivities) {
    const idealData = keyActivities.filter(ka => ka.status === 'completed');
    const realData = activities;

    const allDates = [...new Set([
      ...idealData.map(d => new Date(d.created_at).toISOString().split('T')[0]),
      ...realData.map(d => new Date(d.created_at).toISOString().split('T')[0])
    ])].sort();

    if (allDates.length === 0) {
      return { ideal: [], real: [] };
    }

    let cumulativeIdeal = 0;
    let cumulativeReal = 0;
    const idealProgress = [];
    const realProgress = [];

    const dailyIdeal = idealData.reduce((acc, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + curr.impact;
      return acc;
    }, {});

    const dailyReal = realData.reduce((acc, curr) => {
      const date = new Date(curr.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + curr.impact;
      return acc;
    }, {});

    for (const date of allDates) {
      cumulativeIdeal += dailyIdeal[date] || 0;
      cumulativeReal += dailyReal[date] || 0;
      idealProgress.push({ date, impact: cumulativeIdeal });
      realProgress.push({ date, impact: cumulativeReal });
    }

    return { ideal: idealProgress, real: realProgress };
  }

  getBestProductiveHours(activities) {
    if (activities.length === 0) return "Registre mais atividades para identificar seus horários mais produtivos";

    const signalActivities = activities.filter(a => a.classification === 'SINAL');
    if (signalActivities.length === 0) return "Registre atividades de SINAL para identificar padrões produtivos";

    // Analisar horários das atividades de sinal
    const hourlyStats = {};
    signalActivities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, totalScore: 0 };
      }
      hourlyStats[hour].count++;
      hourlyStats[hour].totalScore += activity.signal_score;
    });

    // Encontrar o horário com melhor média
    let bestHour = null;
    let bestScore = 0;
    Object.keys(hourlyStats).forEach(hour => {
      const avgScore = hourlyStats[hour].totalScore / hourlyStats[hour].count;
      if (avgScore > bestScore && hourlyStats[hour].count >= 2) {
        bestScore = avgScore;
        bestHour = hour;
      }
    });

    if (bestHour) {
      return `Você é mais produtivo às ${bestHour}h (média: ${Math.round(bestScore)} pontos)`;
    }

    return "Continue registrando para identificar seus horários de pico";
  }

  getWorstProductiveHours(activities) {
    if (activities.length === 0) return "Registre mais atividades para identificar padrões";

    const noiseActivities = activities.filter(a => a.classification === 'RUÍDO');
    if (noiseActivities.length === 0) return "Ótimo! Não há atividades de ruído registradas";

    // Analisar horários das atividades de ruído
    const hourlyNoise = {};
    noiseActivities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      hourlyNoise[hour] = (hourlyNoise[hour] || 0) + 1;
    });

    // Encontrar o horário com mais ruído
    let worstHour = null;
    let maxNoise = 0;
    Object.keys(hourlyNoise).forEach(hour => {
      if (hourlyNoise[hour] > maxNoise) {
        maxNoise = hourlyNoise[hour];
        worstHour = hour;
      }
    });

    if (worstHour && maxNoise >= 2) {
      return `Evite distrações às ${worstHour}h (${maxNoise} atividades de ruído)`;
    }

    return "Continue monitorando para identificar horários problemáticos";
  }

  getEnergyPatterns(activities) {
    if (activities.length === 0) return "Registre mais atividades para identificar padrões de energia";

    // Buscar por padrões em palavras-chave
    const patterns = {
      'exercício': [],
      'estudo': [],
      'código': [],
      'reunião': [],
      'social': []
    };

    activities.forEach(activity => {
      const desc = activity.description.toLowerCase();
      if (desc.includes('exercício') || desc.includes('academia') || desc.includes('corrida')) {
        patterns.exercício.push(activity.signal_score);
      }
      if (desc.includes('estud') || desc.includes('ler') || desc.includes('documentação')) {
        patterns.estudo.push(activity.signal_score);
      }
      if (desc.includes('código') || desc.includes('programa') || desc.includes('develop')) {
        patterns.código.push(activity.signal_score);
      }
      if (desc.includes('reunião') || desc.includes('meeting')) {
        patterns.reunião.push(activity.signal_score);
      }
      if (desc.includes('social') || desc.includes('youtube') || desc.includes('instagram')) {
        patterns.social.push(activity.signal_score);
      }
    });

    // Encontrar o padrão mais significativo
    let bestPattern = null;
    let bestAverage = 0;
    Object.keys(patterns).forEach(pattern => {
      if (patterns[pattern].length >= 2) {
        const avg = patterns[pattern].reduce((sum, score) => sum + score, 0) / patterns[pattern].length;
        if (avg > bestAverage) {
          bestAverage = avg;
          bestPattern = pattern;
        }
      }
    });

    if (bestPattern) {
      return `Atividades de ${bestPattern} têm média de ${Math.round(bestAverage)} pontos`;
    }

    return "Continue registrando para identificar padrões de atividades";
  }

  getRecommendations(activities) {
    const recommendations = [];

    if (activities.length === 0) {
      return [
        { id: 'rec-1', text: "Comece registrando suas primeiras atividades", priority: "high", impact: "+50 pontos iniciais" },
        { id: 'rec-2', text: "Defina objetivos claros na página de Objetivos", priority: "medium", impact: "Base para análise" },
        { id: 'rec-3', text: "Use gravação de voz para registro rápido", priority: "low", impact: "Facilita uso" }
      ];
    }

    const signalActivities = activities.filter(a => a.classification === 'SINAL');
    const noiseActivities = activities.filter(a => a.classification === 'RUÍDO');
    const neutralActivities = activities.filter(a => a.classification === 'NEUTRO');

    // Análise de proporções
    const totalActivities = activities.length;
    const signalRatio = signalActivities.length / totalActivities;
    const noiseRatio = noiseActivities.length / totalActivities;

    // Recomendação baseada na proporção de sinais
    if (signalRatio < 0.5) {
      recommendations.push({
        id: `rec-signal-${Date.now()}`,
        text: "Foque mais em atividades produtivas - apenas " + Math.round(signalRatio * 100) + "% são sinais",
        priority: "high",
        impact: "+" + Math.round((0.5 - signalRatio) * 100) + "% produtividade"
      });
    }

    // Recomendação baseada em ruído
    if (noiseRatio > 0.2) {
      const commonNoise = this.getMostCommonNoise(noiseActivities);
      recommendations.push({
        id: `rec-noise-${Date.now()}`,
        text: commonNoise ? `Reduza: ${commonNoise}` : "Minimize atividades de ruído",
        priority: "high",
        impact: "-" + Math.round(noiseRatio * 100) + "% ruído"
      });
    }

    // Recomendação baseada em horários
    const bestHour = this.getBestHourForRecommendation(signalActivities);
    if (bestHour !== null) {
      recommendations.push({
        id: `rec-hour-${Date.now()}`,
        text: `Agende tarefas importantes às ${bestHour}h`,
        priority: "medium",
        impact: "+15-20 pontos"
      });
    }

    // Recomendação baseada em atividades de alto score
    const highScoreActivities = signalActivities.filter(a => a.signal_score >= 85);
    if (highScoreActivities.length > 0) {
      const topActivity = this.getMostCommonActivity(highScoreActivities);
      if (topActivity) {
        recommendations.push({
          id: `rec-activity-${Date.now()}`,
          text: `Faça mais: ${topActivity}`,
          priority: "medium",
          impact: "+25 pontos médios"
        });
      }
    }

    // Recomendação para atividades neutras
    if (neutralActivities.length > signalActivities.length * 0.3) {
      recommendations.push({
        id: `rec-neutral-${Date.now()}`,
        text: "Converta atividades neutras em sinais definindo objetivos claros",
        priority: "low",
        impact: "+" + Math.round(neutralActivities.length * 10) + " pontos potenciais"
      });
    }

    // Se não há recomendações específicas, dar dicas gerais
    if (recommendations.length === 0) {
      recommendations.push({
        id: `rec-balance-${Date.now()}`,
        text: "Mantenha o ótimo trabalho! Seu padrão está equilibrado",
        priority: "low",
        impact: "Consistência"
      });
    }

    return recommendations.slice(0, 4); // Máximo 4 recomendações
  }

  getMostCommonNoise(noiseActivities) {
    if (noiseActivities.length === 0) return null;

    const keywords = {};
    noiseActivities.forEach(activity => {
      const words = activity.description.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    let maxCount = 0;
    let commonWord = null;
    Object.keys(keywords).forEach(word => {
      if (keywords[word] > maxCount) {
        maxCount = keywords[word];
        commonWord = word;
      }
    });

    return commonWord;
  }

  getMostCommonActivity(activities) {
    if (activities.length === 0) return null;

    const patterns = [
      { keywords: ['código', 'program', 'develop'], name: 'programação' },
      { keywords: ['estud', 'ler', 'documentação'], name: 'estudo' },
      { keywords: ['exercício', 'academia'], name: 'exercício' },
      { keywords: ['planej', 'arquitetura'], name: 'planejamento' },
      { keywords: ['revis', 'refator'], name: 'revisão de código' }
    ];

    for (const pattern of patterns) {
      const count = activities.filter(activity =>
        pattern.keywords.some(keyword =>
          activity.description.toLowerCase().includes(keyword)
        )
      ).length;

      if (count >= 2) {
        return pattern.name;
      }
    }

    return null;
  }

  getBestHourForRecommendation(signalActivities) {
    if (signalActivities.length < 3) return null;

    const hourlyStats = {};
    signalActivities.forEach(activity => {
      const hour = new Date(activity.created_at).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, totalScore: 0 };
      }
      hourlyStats[hour].count++;
      hourlyStats[hour].totalScore += activity.signal_score;
    });

    let bestHour = null;
    let bestScore = 0;
    Object.keys(hourlyStats).forEach(hour => {
      const avgScore = hourlyStats[hour].totalScore / hourlyStats[hour].count;
      if (avgScore > bestScore && hourlyStats[hour].count >= 2) {
        bestScore = avgScore;
        bestHour = hour;
      }
    });

    return bestHour;
  }

  getPredictions(activities) {
    if (activities.length < 5) {
      return "Registre mais atividades para previsões personalizadas";
    }

    const now = new Date();
    const currentHour = now.getHours();

    // Analisar padrão dos últimos dias
    const recentActivities = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      const daysDiff = (now - activityDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Últimos 7 dias
    });

    const afternoonActivities = recentActivities.filter(activity => {
      const hour = new Date(activity.created_at).getHours();
      return hour >= 13 && hour <= 17;
    });

    const eveningActivities = recentActivities.filter(activity => {
      const hour = new Date(activity.created_at).getHours();
      return hour >= 18 && hour <= 22;
    });

    // Baseado no horário atual
    if (currentHour >= 8 && currentHour <= 12) {
      const morningSignalRatio = recentActivities.filter(a => {
        const hour = new Date(a.created_at).getHours();
        return hour >= 8 && hour <= 12 && a.classification === 'SINAL';
      }).length / Math.max(1, recentActivities.filter(a => {
        const hour = new Date(a.created_at).getHours();
        return hour >= 8 && hour <= 12;
      }).length);

      if (morningSignalRatio > 0.7) {
        return "Aproveite a manhã! Você tem " + Math.round(morningSignalRatio * 100) + "% de sucesso matinal";
      } else {
        return "Foque em tarefas simples pela manhã para criar momentum";
      }
    }

    if (currentHour >= 13 && currentHour <= 17) {
      if (afternoonActivities.length > 0) {
        const afternoonSignals = afternoonActivities.filter(a => a.classification === 'SINAL').length;
        const afternoonRatio = afternoonSignals / afternoonActivities.length;

        if (afternoonRatio < 0.4) {
          return Math.round((1 - afternoonRatio) * 100) + "% chance de distração à tarde - mantenha foco";
        } else {
          return "Tarde produtiva esperada baseada no seu histórico";
        }
      }
    }

    if (currentHour >= 18) {
      if (eveningActivities.length > 0) {
        const eveningNoise = eveningActivities.filter(a => a.classification === 'RUÍDO').length;
        if (eveningNoise > eveningActivities.length * 0.5) {
          return "Noite típica de relaxamento - considere atividades leves";
        } else {
          return "Boa energia noturna - aproveite para projetos pessoais";
        }
      }
    }

    return "Continue registrando para previsões mais precisas";
  }

  getEmptyStateInsights() {
    return {
      totalActivities: 0,
      signalActivities: 0,
      noiseActivities: 0,
      neutralActivities: 0,
      averageProductivity: 0,
      weeklyProductivity: [
        { day: 'Seg', productivity: 0 },
        { day: 'Ter', productivity: 0 },
        { day: 'Qua', productivity: 0 },
        { day: 'Qui', productivity: 0 },
        { day: 'Sex', productivity: 0 },
        { day: 'Sáb', productivity: 0 },
        { day: 'Dom', productivity: 0 }
      ],
      recentActivities: [],
      bestProductiveHours: "Registre atividades para descobrir seus horários mais produtivos",
      worstProductiveHours: "Identifique padrões registrando suas atividades",
      energyPatterns: "Analise como diferentes atividades afetam sua energia",
      recommendations: [
        "Comece registrando suas primeiras atividades",
        "Defina objetivos claros na página de Objetivos",
        "Use gravação de voz para registro rápido"
      ],
      predictions: "Com mais dados, forneceremos previsões personalizadas"
    };
  }

  generateWeeklyData(activities) {
    const today = new Date();
    const weekData = [];
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayActivities = activities.filter(a => {
        const activityDate = new Date(a.created_at);
        return activityDate.toDateString() === date.toDateString();
      });

      const signalActivities = dayActivities.filter(a => a.classification === 'SINAL');
      const productivity = signalActivities.length > 0 ?
        Math.round(signalActivities.reduce((sum, a) => sum + a.signal_score, 0) / signalActivities.length) : 0;

      weekData.push({
        day: days[date.getDay()],
        productivity
      });
    }

    return weekData;
  }

  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }
}

module.exports = AdvancedAnalytics;
