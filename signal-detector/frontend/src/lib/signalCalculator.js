/**
 * Signal Calculator - Shared utility for SINAL/RUÍDO classification
 *
 * Centralizes the signal scoring logic used across both client-side and server-side code.
 * This ensures consistent classification of tasks throughout the application.
 *
 * Works in both environments:
 * - Server-side: API routes (pages/api/kanban/*.js)
 * - Client-side: Services and components (src/services/*, src/components/*)
 */

/**
 * Calcula score SINAL/RUÍDO para uma tarefa
 *
 * Pontuação baseada em:
 * - Receita potencial: +40 pontos
 * - Prioridade alta: +30 pontos
 * - Prioridade média: +15 pontos
 * - Urgente E importante: +20 pontos
 * - Importante: +10 pontos
 * - Alta alavancagem (impacto/esforço > 1.5): +10 pontos
 * - Baixa alavancagem (impacto/esforço < 0.5): -10 pontos
 *
 * @param {Object} task - Dados da tarefa
 * @param {boolean} task.gera_receita - Se a tarefa gera receita
 * @param {string} task.prioridade - Prioridade: 'alta', 'media', 'baixa'
 * @param {boolean} task.urgente - Se é urgente
 * @param {boolean} task.importante - Se é importante
 * @param {number} task.impacto - Impacto (1-10)
 * @param {number} task.esforco - Esforço (1-10)
 * @returns {Object} { signal_score: number, classificacao: string }
 */
export function calculateSignalScore(task) {
  let score = 0;

  if (task.gera_receita) score += 40;
  if (task.prioridade === 'alta') score += 30;
  else if (task.prioridade === 'media') score += 15;
  if (task.urgente && task.importante) score += 20;
  else if (task.importante) score += 10;

  const impact = task.impacto || 5;
  const effort = Math.max(task.esforco || 5, 1);
  const leverage = impact / effort;

  if (leverage > 1.5) score += 10;
  else if (leverage < 0.5) score -= 10;

  score = Math.min(100, Math.max(0, score));

  return {
    signal_score: score,
    classificacao: score >= 60 ? 'SINAL' : score >= 30 ? 'NEUTRO' : 'RUÍDO'
  };
}

/**
 * Gera texto explicativo do raciocínio da classificação
 *
 * @param {Object} task - Dados da tarefa
 * @param {Object} classification - Resultado da classificação com { signal_score, classificacao }
 * @returns {string} Texto explicativo formatado
 */
export function generateReasoning(task, classification) {
  const reasons = [];

  if (task.gera_receita) {
    reasons.push('Gera receita direta (+40)');
  }

  if (task.prioridade === 'alta') {
    reasons.push('Prioridade alta (+30)');
  } else if (task.prioridade === 'media') {
    reasons.push('Prioridade média (+15)');
  }

  if (task.urgente && task.importante) {
    reasons.push('Urgente e importante (+20)');
  } else if (task.importante) {
    reasons.push('Importante (+10)');
  }

  const leverage = (task.impacto || 5) / Math.max(task.esforco || 5, 1);
  if (leverage > 1.5) {
    reasons.push(`Alta alavancagem: impacto ${task.impacto}/esforço ${task.esforco} (+10)`);
  } else if (leverage < 0.5) {
    reasons.push(`Baixa alavancagem: impacto ${task.impacto}/esforço ${task.esforco} (-10)`);
  }

  return `${classification.classificacao} (Score: ${classification.signal_score}): ${reasons.join('; ')}`;
}
