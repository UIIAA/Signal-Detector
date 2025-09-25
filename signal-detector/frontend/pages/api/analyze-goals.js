import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, goals, timeframe, experience, challenges } = req.body;

  if (!context || !goals || !timeframe || !experience || !challenges) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Como um especialista em definição de objetivos e produtividade, analise o perfil abaixo e forneça sugestões SMART personalizadas:

CONTEXTO PESSOAL:
${context}

OBJETIVOS DESEJADOS:
${goals}

PRAZO ESPERADO:
${timeframe}

NÍVEL DE EXPERIÊNCIA:
${experience}

DESAFIOS PREVISTOS:
${challenges}

Por favor, forneça:

1. ANÁLISE do perfil e viabilidade dos objetivos
2. CRONOGRAMA sugerido realista
3. OBJETIVOS DE CURTO PRAZO (0-3 meses) - 3 objetivos específicos e acionáveis
4. OBJETIVOS DE MÉDIO PRAZO (3-12 meses) - 3 objetivos que construam sobre os de curto prazo
5. OBJETIVOS DE LONGO PRAZO (1+ anos) - 3 objetivos visionários

Responda APENAS em formato JSON válido:
{
  "insights": "análise do perfil e viabilidade",
  "timeline": "cronograma sugerido",
  "shortTerm": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "mediumTerm": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "longTerm": ["objetivo 1", "objetivo 2", "objetivo 3"]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Remove code block formatting if present
    text = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

    try {
      const aiSuggestions = JSON.parse(text);
      res.json(aiSuggestions);
    } catch (parseError) {
      // If JSON parsing fails, provide fallback response
      console.error('Error parsing AI response:', parseError);
      res.json({
        shortTerm: [
          "Definir cronograma detalhado das primeiras etapas",
          "Identificar recursos necessários imediatamente",
          "Estabelecer métricas de progresso semanais"
        ],
        mediumTerm: [
          "Desenvolver competências específicas necessárias",
          "Construir rede de contatos na área",
          "Implementar sistema de acompanhamento de progresso"
        ],
        longTerm: [
          "Estabelecer posição de referência no campo escolhido",
          "Criar estratégia de crescimento sustentável",
          "Desenvolver capacidade de mentoria para outros"
        ],
        insights: "Baseado no contexto fornecido, recomendo focar inicialmente em objetivos de curto prazo bem definidos que criem momentum para as metas maiores.",
        timeline: "Sugiro uma abordagem em fases: 3 meses para estabelecer bases, 12 meses para consolidar competências e 3+ anos para alcançar posição de destaque."
      });
    }
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    // Provide fallback response in case of API error
    res.json({
      shortTerm: [
        "Definir cronograma detalhado das primeiras etapas",
        "Identificar recursos necessários imediatamente",
        "Estabelecer métricas de progresso semanais"
      ],
      mediumTerm: [
        "Desenvolver competências específicas necessárias",
        "Construir rede de contatos na área",
        "Implementar sistema de acompanhamento de progresso"
      ],
      longTerm: [
        "Estabelecer posição de referência no campo escolhido",
        "Criar estratégia de crescimento sustentável",
        "Desenvolver capacidade de mentoria para outros"
      ],
      insights: "Baseado no contexto fornecido, recomendo focar inicialmente em objetivos de curto prazo bem definidos que criem momentum para as metas maiores.",
      timeline: "Sugiro uma abordagem em fases: 3 meses para estabelecer bases, 12 meses para consolidar competências e 3+ anos para alcançar posição de destaque."
    });
  }
}