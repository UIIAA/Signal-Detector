/**
 * API: Parse Tasks from Text using Gemini AI
 * POST - Receives raw text and extracts structured tasks
 *
 * Used by the import feature when a .txt file contains
 * unstructured/free-form text that needs AI interpretation.
 */

import SignalClassifier from '../../../src/services/SignalClassifier';
import * as apiResponse from '../../../src/lib/apiResponse';

const signalClassifier = new SignalClassifier();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(apiResponse.error('Method not allowed', 405));
  }

  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) {
    return res.status(401).json(apiResponse.unauthorized('User ID required'));
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json(apiResponse.validation({ text: 'Texto e obrigatorio' }));
  }

  // Limit input size to prevent abuse
  const trimmedText = text.slice(0, 10000);

  const prompt = `
Analise o texto abaixo e extraia todas as tarefas/atividades mencionadas.
Para cada tarefa, identifique:
- titulo: nome curto e claro da tarefa (obrigatorio)
- descricao: detalhes adicionais se houver (opcional)
- projeto: se mencionado, um destes valores: DEFENZ, CONNECT, GRAFONO, PEC, PESSOAL (padrao: vazio)
- prioridade: alta, media ou baixa (padrao: media)

TEXTO:
"""
${trimmedText}
"""

Responda APENAS com JSON valido no formato:
{"tasks": [{"titulo": "...", "descricao": "...", "projeto": "...", "prioridade": "..."}]}

Se nenhuma tarefa for identificada, retorne {"tasks": []}.
Nao inclua explicacoes, apenas o JSON.
`;

  try {
    const activity = {
      description: prompt,
      duration: 0,
      energyBefore: 5,
      energyAfter: 5
    };

    const result = await signalClassifier.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON from response
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      return res.status(200).json(apiResponse.success({ tasks: [] }, 'No tasks extracted'));
    }

    const jsonString = responseText.substring(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    const tasks = (parsed.tasks || []).map(t => ({
      titulo: String(t.titulo || '').trim(),
      descricao: String(t.descricao || '').trim(),
      projeto: String(t.projeto || '').trim(),
      prioridade: String(t.prioridade || 'media').trim()
    })).filter(t => t.titulo.length > 0);

    return res.status(200).json(apiResponse.success({ tasks }, `${tasks.length} tarefas extraidas`));
  } catch (error) {
    console.error('Parse tasks API error:', error);
    return res.status(500).json(
      apiResponse.error(
        'Erro ao processar texto com IA',
        500,
        process.env.NODE_ENV === 'development' ? error.message : undefined
      )
    );
  }
}
