import useSWR from 'swr';
import { useAuth } from '../contexts/AuthContext';

/**
 * useApi.js
 *
 * Hooks de cache com SWR para otimizar performance de requisições de API.
 * FASE 3: PERFORMANCE - Deduplicação e reutilização de requisições
 *
 * IMPORTANTE: Instale SWR com: npm install swr
 */

const fetcher = (url, fetchWithAuth) =>
  fetchWithAuth(url).then(r => {
    if (!r.ok) throw new Error('API response error');
    return r.json();
  });

/**
 * Hook para recuperar goals do usuário
 * Deduplica requisições dentro de 60 segundos
 */
export function useGoals() {
  const { fetchWithAuth } = useAuth();
  return useSWR(
    '/api/goals',
    url => fetcher(url, fetchWithAuth),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      focusThrottleInterval: 300000 // 5 minutos
    }
  );
}

/**
 * Hook para recuperar tarefas Kanban com filtros opcionais
 * Deduplica requisições dentro de 30 segundos
 */
export function useKanbanTasks(filters = {}) {
  const { fetchWithAuth } = useAuth();
  const params = new URLSearchParams(filters).toString();
  const url = `/api/kanban${params ? `?${params}` : ''}`;

  return useSWR(
    url,
    u => fetcher(u, fetchWithAuth),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
      focusThrottleInterval: 300000 // 5 minutos
    }
  );
}

/**
 * Hook para recuperar atividades, opcionalmente filtradas por goal
 * Deduplica requisições dentro de 60 segundos
 */
export function useActivities(goalId = null) {
  const { fetchWithAuth } = useAuth();
  const url = goalId
    ? `/api/activities?goalId=${goalId}`
    : '/api/activities';

  return useSWR(
    url,
    u => fetcher(u, fetchWithAuth),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      focusThrottleInterval: 300000 // 5 minutos
    }
  );
}

/**
 * Hook para recuperar hábitos do usuário
 * Deduplica requisições dentro de 60 segundos
 */
export function useHabits() {
  const { fetchWithAuth } = useAuth();
  return useSWR(
    '/api/habits',
    url => fetcher(url, fetchWithAuth),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      focusThrottleInterval: 300000 // 5 minutos
    }
  );
}

/**
 * Hook customizado para requisições com configuração de deduplica
 */
export function useApiData(url, options = {}) {
  const { fetchWithAuth } = useAuth();
  const {
    dedupingInterval = 60000,
    focusThrottleInterval = 300000,
    revalidateOnFocus = false,
    ...swrOptions
  } = options;

  return useSWR(
    url,
    u => fetcher(u, fetchWithAuth),
    {
      revalidateOnFocus,
      dedupingInterval,
      focusThrottleInterval,
      ...swrOptions
    }
  );
}
