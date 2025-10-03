import { EfficiencyCalculator } from '../EfficiencyCalculator';

describe('EfficiencyCalculator', () => {
  describe('calculateEfficiency', () => {
    test('calcula eficiência corretamente com valores padrão', () => {
      const activity = { impact: 8, duration_minutes: 60 };
      const result = EfficiencyCalculator.calculateEfficiency(activity);
      expect(result).toBe(16); // (8 * 2) / 1 hora
    });

    test('calcula eficiência com duração de 30 minutos', () => {
      const activity = { impact: 9, duration_minutes: 30 };
      const result = EfficiencyCalculator.calculateEfficiency(activity);
      expect(result).toBe(36); // (9 * 2) / 0.5 hora
    });

    test('calcula eficiência com duração de 2 horas', () => {
      const activity = { impact: 6, duration_minutes: 120 };
      const result = EfficiencyCalculator.calculateEfficiency(activity);
      expect(result).toBe(6); // (6 * 2) / 2 horas
    });

    test('arredonda para 2 casas decimais', () => {
      const activity = { impact: 7, duration_minutes: 45 };
      const result = EfficiencyCalculator.calculateEfficiency(activity);
      expect(result).toBe(18.67); // (7 * 2) / 0.75 hora
    });

    test('retorna 0 quando impact é 0', () => {
      const activity = { impact: 0, duration_minutes: 60 };
      const result = EfficiencyCalculator.calculateEfficiency(activity);
      expect(result).toBe(0);
    });
  });

  describe('classifyEfficiency', () => {
    test('classifica como excellent quando >= 15', () => {
      const result = EfficiencyCalculator.classifyEfficiency(18);
      expect(result.level).toBe('excellent');
      expect(result.color).toBe('#10b981');
      expect(result.label).toBe('Excelente');
    });

    test('classifica como good quando >= 10 e < 15', () => {
      const result = EfficiencyCalculator.classifyEfficiency(12);
      expect(result.level).toBe('good');
      expect(result.color).toBe('#3b82f6');
      expect(result.label).toBe('Boa');
    });

    test('classifica como moderate quando >= 5 e < 10', () => {
      const result = EfficiencyCalculator.classifyEfficiency(7);
      expect(result.level).toBe('moderate');
      expect(result.color).toBe('#f59e0b');
      expect(result.label).toBe('Moderada');
    });

    test('classifica como low quando < 5', () => {
      const result = EfficiencyCalculator.classifyEfficiency(3);
      expect(result.level).toBe('low');
      expect(result.color).toBe('#ef4444');
      expect(result.label).toBe('Baixa');
    });

    test('classifica exatamente 15 como excellent', () => {
      const result = EfficiencyCalculator.classifyEfficiency(15);
      expect(result.level).toBe('excellent');
    });
  });

  describe('calculateOpportunityCost', () => {
    test('calcula opportunity cost quando atividade atual tem eficiência baixa', () => {
      const currentActivity = {
        id: 'act1',
        description: 'Tarefa pouco eficiente',
        impact: 3,
        effort: 7,
        duration_minutes: 120
      };

      const topActivities = [
        { id: 'top1', impact: 9, effort: 2, duration_minutes: 60, description: 'Alta eficiência' },
        { id: 'top2', impact: 8, effort: 3, duration_minutes: 45, description: 'Boa eficiência' },
        { id: 'top3', impact: 7, effort: 4, duration_minutes: 60, description: 'Média eficiência' }
      ];

      const result = EfficiencyCalculator.calculateOpportunityCost(currentActivity, topActivities, 2);

      expect(result.hasOpportunityCost).toBe(true);
      expect(result.opportunityCost).toBeGreaterThan(0);
      expect(result.alternatives.length).toBe(2);
      expect(result.alternatives[0].efficiency).toBeGreaterThan(result.currentEfficiency);
    });

    test('não sugere alternativas quando atividade já é eficiente', () => {
      const currentActivity = {
        id: 'act1',
        description: 'Tarefa eficiente',
        impact: 9,
        effort: 2,
        duration_minutes: 60
      };

      const topActivities = [
        { id: 'top1', impact: 8, effort: 3, duration_minutes: 60, description: 'Média eficiência' }
      ];

      const result = EfficiencyCalculator.calculateOpportunityCost(currentActivity, topActivities);

      expect(result.hasOpportunityCost).toBe(false);
      expect(result.alternatives.length).toBe(0);
    });

    test('filtra atividades com eficiência menor que a atual', () => {
      const currentActivity = {
        id: 'act1',
        description: 'Média eficiência',
        impact: 4,
        effort: 5,
        duration_minutes: 60
      };

      const topActivities = [
        { id: 'top1', impact: 3, effort: 6, duration_minutes: 60, description: 'Baixa eficiência' },
        { id: 'top2', impact: 9, effort: 2, duration_minutes: 60, description: 'Alta eficiência' }
      ];

      const result = EfficiencyCalculator.calculateOpportunityCost(currentActivity, topActivities);

      // Current: (4*2)/1 = 8
      // Top2: (9*2)/1 = 18
      // 18 > 8 * 1.5 (12) → TRUE
      expect(result.alternatives.length).toBe(1);
      expect(result.alternatives[0].title).toBe('Alta eficiência');
    });

    test('respeita o limite de alternativas (maxAlternatives)', () => {
      const currentActivity = {
        id: 'act1',
        impact: 3,
        effort: 7,
        duration_minutes: 60
      };

      const topActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `top${i}`,
        impact: 9,
        effort: 2,
        duration_minutes: 60,
        description: `Atividade ${i}`
      }));

      const result = EfficiencyCalculator.calculateOpportunityCost(currentActivity, topActivities, 3);

      expect(result.alternatives.length).toBe(3);
    });
  });

  describe('createRanking', () => {
    test('cria ranking ordenado por eficiência', () => {
      const activities = [
        { id: 'act1', impact: 5, duration_minutes: 60 },
        { id: 'act2', impact: 9, duration_minutes: 60 },
        { id: 'act3', impact: 7, duration_minutes: 60 }
      ];

      const result = EfficiencyCalculator.createRanking(activities);

      expect(result[0].rank).toBe(1);
      expect(result[0].id).toBe('act2'); // Maior eficiência
      expect(result[1].rank).toBe(2);
      expect(result[1].id).toBe('act3');
      expect(result[2].rank).toBe(3);
      expect(result[2].id).toBe('act1'); // Menor eficiência
    });

    test('adiciona propriedade efficiency a cada atividade', () => {
      const activities = [
        { id: 'act1', impact: 8, duration_minutes: 60 }
      ];

      const result = EfficiencyCalculator.createRanking(activities);

      expect(result[0].efficiency).toBe(16);
    });

    test('respeita o limite de resultados', () => {
      const activities = Array.from({ length: 20 }, (_, i) => ({
        id: `act${i}`,
        impact: 8,
        duration_minutes: 60
      }));

      const result = EfficiencyCalculator.createRanking(activities, 5);

      expect(result.length).toBe(5);
    });

    test('retorna array vazio quando não há atividades', () => {
      const result = EfficiencyCalculator.createRanking([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateStats', () => {
    test('calcula estatísticas completas de um conjunto de atividades', () => {
      const activities = [
        { impact: 8, duration_minutes: 60 },  // eff: 16
        { impact: 9, duration_minutes: 60 },  // eff: 18
        { impact: 6, duration_minutes: 60 },  // eff: 12
        { impact: 3, duration_minutes: 60 },  // eff: 6
        { impact: 4, duration_minutes: 60 }   // eff: 8
      ];

      const result = EfficiencyCalculator.calculateStats(activities);

      expect(result.total).toBe(5);
      expect(result.average).toBe(12); // (16+18+12+6+8)/5
      expect(result.median).toBe(12); // valor do meio após ordenação [6,8,12,16,18]
      expect(result.highest).toBe(18);
      expect(result.lowest).toBe(6);
      expect(result.highEfficiencyCount).toBe(3); // >= 10: 12, 16, 18
      expect(result.lowEfficiencyCount).toBe(0); // < 5: nenhuma
    });

    test('calcula distribuição de eficiência', () => {
      const activities = [
        { impact: 9, duration_minutes: 30 },  // eff: 36 (excellent)
        { impact: 7, duration_minutes: 60 },  // eff: 14 (good)
        { impact: 4, duration_minutes: 60 },  // eff: 8 (moderate)
        { impact: 2, duration_minutes: 60 }   // eff: 4 (low)
      ];

      const result = EfficiencyCalculator.calculateStats(activities);

      expect(result.distribution.excellent).toBe(1);
      expect(result.distribution.good).toBe(1);
      expect(result.distribution.moderate).toBe(1);
      expect(result.distribution.low).toBe(1);
    });

    test('retorna stats vazias para array vazio', () => {
      const result = EfficiencyCalculator.calculateStats([]);

      expect(result.total).toBe(0);
      expect(result.average).toBe(0);
      expect(result.median).toBe(0);
      expect(result.highest).toBe(0);
      expect(result.lowest).toBe(0);
    });
  });
});