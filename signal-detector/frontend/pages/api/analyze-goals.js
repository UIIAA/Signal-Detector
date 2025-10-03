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
    // Try with the newest model first, fallback to older model if overloaded
    let model;
    let modelName = "gemini-2.5-flash";

    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch (modelError) {
      console.log('Falling back to gemini-2.0-flash');
      modelName = "gemini-2.0-flash";
      model = genAI.getGenerativeModel({ model: modelName });
    }

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

    // Try with retry logic for overloaded models
    let result;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit retry loop
      } catch (apiError) {
        attempts++;
        console.log(`Attempt ${attempts} failed:`, apiError.message);

        if (apiError.message.includes('overloaded') && attempts < maxAttempts) {
          // Try with older model
          console.log('Retrying with gemini-2.0-flash...');
          model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          modelName = "gemini-2.0-flash";
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        } else {
          throw apiError; // Re-throw if not overloaded or max attempts reached
        }
      }
    }

    const response = await result.response;
    let text = response.text();

    // Remove code block formatting if present
    text = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

    try {
      const aiSuggestions = JSON.parse(text);
      res.json(aiSuggestions);
    } catch (parseError) {
      // If JSON parsing fails, provide personalized fallback response
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', text);

      // Use the same personalized fallback logic
      const generatePersonalizedFallback = () => {
        const contextLower = context.toLowerCase();
        const goalsLower = goals.toLowerCase();

        let shortTerm = [];
        let mediumTerm = [];
        let longTerm = [];

        // Analyze context and goals to provide better suggestions
        if (contextLower.includes('desenvolv') || contextLower.includes('programm') || contextLower.includes('tech')) {
          shortTerm = [
            "Estudar tecnologias específicas relacionadas aos seus objetivos",
            "Criar primeiro projeto prático aplicando novos conhecimentos",
            "Estabelecer rotina diária de estudos de 1-2 horas"
          ];
          mediumTerm = [
            "Desenvolver portfólio com 3-5 projetos completos",
            "Participar de comunidades e eventos da área",
            "Aplicar conhecimentos em projeto real ou trabalho"
          ];
          longTerm = [
            "Tornar-se referência na tecnologia escolhida",
            "Contribuir para projetos open source relevantes",
            "Mentorear outros desenvolvedores iniciantes"
          ];
        } else if (contextLower.includes('negóc') || contextLower.includes('empreend') || contextLower.includes('empresa')) {
          shortTerm = [
            "Validar ideia de negócio com pesquisa de mercado",
            "Desenvolver MVP (produto mínimo viável)",
            "Definir modelo de negócio e estratégia inicial"
          ];
          mediumTerm = [
            "Conseguir primeiros clientes e validar produto",
            "Estabelecer processos operacionais essenciais",
            "Formar equipe inicial se necessário"
          ];
          longTerm = [
            "Escalar negócio para mercados maiores",
            "Desenvolver novas linhas de produto/serviço",
            "Estabelecer marca reconhecida no mercado"
          ];
        } else {
          // Generic but still contextual fallback
          const goal = goalsLower.slice(0, 50);
          shortTerm = [
            `Definir plano detalhado para: ${goal}`,
            "Identificar recursos e conhecimentos necessários",
            "Estabelecer marcos de progresso mensais"
          ];
          mediumTerm = [
            "Desenvolver competências específicas identificadas",
            "Construir rede de contatos relevante",
            "Implementar e ajustar estratégia conforme progresso"
          ];
          longTerm = [
            "Alcançar posição de destaque na área escolhida",
            "Expandir influência e impacto dos seus objetivos",
            "Ajudar outros a alcançarem objetivos similares"
          ];
        }

        return {
          shortTerm,
          mediumTerm,
          longTerm,
          insights: `Com base no seu contexto (${context.slice(0, 100)}...) e objetivos (${goals.slice(0, 100)}...), recomendo uma abordagem gradual focando primeiro em estabelecer bases sólidas.`,
          timeline: timeframe === 'urgent'
            ? "Dado o prazo urgente, focar em resultados rápidos nos próximos 3-6 meses."
            : timeframe === 'short'
            ? "Cronograma de 6-12 meses permite desenvolvimento consistente."
            : "Abordagem de longo prazo permite construir fundações sólidas."
        };
      };

      res.json(generatePersonalizedFallback());
    }
  } catch (error) {
    console.error('Error generating goal suggestions:', error);

    // Create a more personalized fallback based on user input
    const generatePersonalizedFallback = () => {
      const contextLower = context.toLowerCase();
      const goalsLower = goals.toLowerCase();

      let shortTerm = [];
      let mediumTerm = [];
      let longTerm = [];

      // Analyze context and goals to provide better suggestions
      if (contextLower.includes('desenvolv') || contextLower.includes('programm') || contextLower.includes('tech')) {
        shortTerm = [
          "Estudar tecnologias específicas relacionadas aos seus objetivos",
          "Criar primeiro projeto prático aplicando novos conhecimentos",
          "Estabelecer rotina diária de estudos de 1-2 horas"
        ];
        mediumTerm = [
          "Desenvolver portfólio com 3-5 projetos completos",
          "Participar de comunidades e eventos da área",
          "Aplicar conhecimentos em projeto real ou trabalho"
        ];
        longTerm = [
          "Tornar-se referência na tecnologia escolhida",
          "Contribuir para projetos open source relevantes",
          "Mentorear outros desenvolvedores iniciantes"
        ];
      } else if (contextLower.includes('negóc') || contextLower.includes('empreend') || contextLower.includes('empresa')) {
        shortTerm = [
          "Validar ideia de negócio com pesquisa de mercado",
          "Desenvolver MVP (produto mínimo viável)",
          "Definir modelo de negócio e estratégia inicial"
        ];
        mediumTerm = [
          "Conseguir primeiros clientes e validar produto",
          "Estabelecer processos operacionais essenciais",
          "Formar equipe inicial se necessário"
        ];
        longTerm = [
          "Escalar negócio para mercados maiores",
          "Desenvolver novas linhas de produto/serviço",
          "Estabelecer marca reconhecida no mercado"
        ];
      } else {
        // Generic but still contextual fallback
        const goal = goalsLower.slice(0, 50);
        shortTerm = [
          `Definir plano detalhado para: ${goal}`,
          "Identificar recursos e conhecimentos necessários",
          "Estabelecer marcos de progresso mensais"
        ];
        mediumTerm = [
          "Desenvolver competências específicas identificadas",
          "Construir rede de contatos relevante",
          "Implementar e ajustar estratégia conforme progresso"
        ];
        longTerm = [
          "Alcançar posição de destaque na área escolhida",
          "Expandir influência e impacto dos seus objetivos",
          "Ajudar outros a alcançarem objetivos similares"
        ];
      }

      return {
        shortTerm,
        mediumTerm,
        longTerm,
        insights: `Com base no seu contexto (${context.slice(0, 100)}...) e objetivos (${goals.slice(0, 100)}...), recomendo uma abordagem gradual focando primeiro em estabelecer bases sólidas.`,
        timeline: timeframe === 'urgent'
          ? "Dado o prazo urgente, focar em resultados rápidos nos próximos 3-6 meses."
          : timeframe === 'short'
          ? "Cronograma de 6-12 meses permite desenvolvimento consistente."
          : "Abordagem de longo prazo permite construir fundações sólidas."
      };
    };

    res.json(generatePersonalizedFallback());
  }
}