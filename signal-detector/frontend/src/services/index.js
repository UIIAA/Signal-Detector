/**
 * Services Index
 * Exporta todos os serviços (Service Layer)
 * Ponto de entrada único para abstrações de API e lógica de negócio
 */

export { KanbanService } from './KanbanService';
export { GoalService } from './GoalService';
export { default as SignalClassifier } from './SignalClassifier';

// Para compatibilidade com código existente
export { default as api } from './api';
export { default as goalsApi } from './goalsApi';
export { default as EfficiencyCalculator } from './EfficiencyCalculator';
