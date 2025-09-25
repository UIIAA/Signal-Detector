// services/accountability-engine/src/services/PNLCoach.js

class PNLCoach {

  identifyDominantPattern(userPatterns) {
    if (!userPatterns || userPatterns.length === 0) return 'procrastination';
    // For now, just return the first pattern
    return userPatterns[0].pattern_type;
  }

  predictOutcome(nlpTechnique) {
    const outcomes = {
      modal_operator_challenge: 'User will identify the artificial limitation.',
      generalization_challenge: 'User will find exceptions to the generalization.',
      outcome_specification: 'User will clarify their desired outcome.',
      deletion_challenge: 'User will identify the missing information.',
      open_inquiry: 'User will provide more context.'
    }
    return outcomes[nlpTechnique] || outcomes['open_inquiry'];
  }

  personalizeTemplate(templates, userPatterns) {
    if (!templates || templates.length === 0) return '';
    // For now, just return the first template
    let template = templates[0];

    if(userPatterns && userPatterns.length > 0) {
        const pattern = userPatterns[0];
        template = template.replace('{goal}', 'seu objetivo');
        template = template.replace('{action}', 'agir');
        template = template.replace('{pattern}', pattern.pattern_type || 'esse padrão');
        template = template.replace('{area}', 'essa área');
        template = template.replace('{behavior}', 'esse comportamento');
    }
    
    return template;
  }
  
  generateCoachingQuestion(userPatterns) {
    // Detecta padrão dominante
    const dominantPattern = this.identifyDominantPattern(userPatterns);
    
    // Seleciona técnica PNL
    const nlpTechnique = this.selectNLPTechnique(dominantPattern);
    
    // Gera pergunta personalizada
    const question = this.craftQuestion(nlpTechnique, userPatterns);
    
    return {
      nlpTechnique,
      question,
      expectedOutcome: this.predictOutcome(nlpTechnique)
    };
  }

  selectNLPTechnique(pattern) {
    const techniqueMap = {
      'procrastination': 'modal_operator_challenge', // "não posso" → "o que aconteceria se..."
      'perfectionism': 'generalization_challenge',   // "sempre" → "sempre mesmo?"
      'scattered_focus': 'outcome_specification',    // "qual exatamente o resultado?"
      'self_sabotage': 'deletion_challenge'          // "o que você está omitindo?"
    };
    
    return techniqueMap[pattern] || 'open_inquiry';
  }

  craftQuestion(technique, userPatterns) {
    const templates = {
      modal_operator_challenge: [
        "O que especificamente te impede de {goal}?",
        "O que aconteceria se você realmente {action}?",
        "Quem disse que você deve {pattern}?"
      ],
      generalization_challenge: [
        "Sempre procrastina em {area}? Alguma exceção?",
        "Nunca consegue {behavior}? Houve algum período que funcionou?"
      ],
      outcome_specification: [
        "Qual especificamente seria o resultado ideal?",
        "Como você saberia que alcançou sucesso?"
      ]
    };

    // Personalizar com dados do usuário
    return this.personalizeTemplate(templates[technique], userPatterns);
  }
}
