/**
 * API Response Formatter
 * Padroniza todas as respostas de API (sucesso e erro)
 * Garante consistência e facilita tratamento no frontend
 */

/**
 * Formata resposta de sucesso
 * @param {*} data - Dados a retornar
 * @param {string|null} message - Mensagem opcional
 * @returns {Object} Resposta formatada
 */
export const success = (data, message = null) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de erro
 * @param {string} message - Mensagem de erro
 * @param {number} code - Código HTTP (padrão 500)
 * @param {*} details - Detalhes adicionais (apenas em dev)
 * @returns {Object} Resposta de erro formatada
 */
export const error = (message, code = 500, details = null) => ({
  success: false,
  error: {
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && details && { details })
  },
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta paginada
 * @param {Array} data - Array de dados
 * @param {number} page - Número da página (começa em 1)
 * @param {number} limit - Itens por página
 * @param {number} total - Total de itens
 * @param {string|null} message - Mensagem opcional
 * @returns {Object} Resposta paginada formatada
 */
export const paginated = (data, page, limit, total, message = null) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  },
  message,
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de criação (201)
 * @param {*} data - Dados criados
 * @param {string|null} message - Mensagem opcional
 * @returns {Object} Resposta formatada
 */
export const created = (data, message = 'Created successfully') => ({
  success: true,
  data,
  message,
  statusCode: 201,
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta vazia (204)
 * @param {string|null} message - Mensagem opcional
 * @returns {Object} Resposta formatada
 */
export const noContent = (message = 'No content') => ({
  success: true,
  message,
  statusCode: 204,
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de validação
 * @param {Object} errors - Mapa de erros { campo: "mensagem" }
 * @param {string} message - Mensagem geral
 * @returns {Object} Resposta de validação formatada
 */
export const validation = (errors, message = 'Validation failed') => ({
  success: false,
  error: {
    message,
    code: 400,
    validation: errors
  },
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de erro não autorizado
 * @param {string} message - Mensagem opcional
 * @returns {Object} Resposta 401 formatada
 */
export const unauthorized = (message = 'Unauthorized') => ({
  success: false,
  error: {
    message,
    code: 401
  },
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de erro proibido
 * @param {string} message - Mensagem opcional
 * @returns {Object} Resposta 403 formatada
 */
export const forbidden = (message = 'Forbidden') => ({
  success: false,
  error: {
    message,
    code: 403
  },
  timestamp: new Date().toISOString()
});

/**
 * Formata resposta de recurso não encontrado
 * @param {string} message - Mensagem opcional
 * @returns {Object} Resposta 404 formatada
 */
export const notFound = (message = 'Not found') => ({
  success: false,
  error: {
    message,
    code: 404
  },
  timestamp: new Date().toISOString()
});

export default {
  success,
  error,
  paginated,
  created,
  noContent,
  validation,
  unauthorized,
  forbidden,
  notFound
};
