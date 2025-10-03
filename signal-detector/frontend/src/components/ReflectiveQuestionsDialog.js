import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  IconButton
} from '@mui/material';
import {
  Close,
  Psychology,
  NavigateNext,
  NavigateBefore,
  Check
} from '@mui/icons-material';

/**
 * ReflectiveQuestionsDialog.js
 *
 * Dialog guiado com perguntas reflexivas para ajudar o usuário
 * a personalizar objetivos baseados em templates.
 */
export default function ReflectiveQuestionsDialog({
  open,
  onClose,
  questions = [],
  goalTemplate,
  onComplete
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleNext = () => {
    if (activeStep < questions.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleComplete = () => {
    if (onComplete) {
      // Processar respostas e enviar para callback
      const formattedAnswers = questions.map((q, index) => ({
        question: q.question,
        answer: answers[index] || '',
        purpose: q.purpose
      }));

      onComplete({
        template: goalTemplate,
        reflections: formattedAnswers
      });
    }
    onClose();
    // Reset
    setActiveStep(0);
    setAnswers({});
  };

  const currentQuestion = questions[activeStep];
  const isLastStep = activeStep === questions.length - 1;

  if (questions.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Personalize Seu Objetivo
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {questions.map((q, index) => (
            <Step key={index}>
              <StepLabel>Questão {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Informações do template */}
        {goalTemplate && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Template:</strong> {goalTemplate.title}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Responda estas perguntas para adaptar o objetivo ao seu contexto específico.
            </Typography>
          </Alert>
        )}

        {/* Questão atual */}
        {currentQuestion && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {currentQuestion.question}
            </Typography>

            {currentQuestion.purpose && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  <strong>Por que perguntamos isso:</strong> {currentQuestion.purpose}
                </Typography>
              </Alert>
            )}

            {currentQuestion.type === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Digite sua resposta..."
                value={answers[activeStep] || ''}
                onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
                sx={{ mt: 2 }}
              />
            )}

            {currentQuestion.type === 'date' && (
              <TextField
                fullWidth
                type="date"
                value={answers[activeStep] || ''}
                onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
                sx={{ mt: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            )}

            {currentQuestion.type === 'number' && (
              <TextField
                fullWidth
                type="number"
                placeholder="Digite um número..."
                value={answers[activeStep] || ''}
                onChange={(e) => handleAnswerChange(activeStep, e.target.value)}
                sx={{ mt: 2 }}
              />
            )}

            {/* Dica adicional */}
            {currentQuestion.hint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                💡 Dica: {currentQuestion.hint}
              </Typography>
            )}
          </Box>
        )}

        {/* Progresso */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Questão {activeStep + 1} de {questions.length}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<NavigateBefore />}
        >
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          endIcon={isLastStep ? <Check /> : <NavigateNext />}
        >
          {isLastStep ? 'Concluir' : 'Próxima'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}