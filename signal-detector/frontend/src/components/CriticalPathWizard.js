import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  Edit,
  Check,
  TrendingUp
} from '@mui/icons-material';

/**
 * CriticalPathWizard.js
 *
 * Wizard para criar rota crítica de um objetivo usando IA.
 * Guia o usuário por 3 etapas: contexto, sugestões da IA, revisão.
 */
export default function CriticalPathWizard({
  open,
  onClose,
  goal,
  onSave
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dados do wizard
  const [userContext, setUserContext] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const steps = ['Contexto', 'Sugestões IA', 'Revisão'];

  useEffect(() => {
    if (open) {
      // Reset ao abrir
      setActiveStep(0);
      setUserContext('');
      setSuggestions([]);
      setSelectedActivities([]);
      setError(null);
    }
  }, [open]);

  // Buscar sugestões da IA
  const fetchAISuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/goals/critical-path-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: goal.userId,
          goalId: goal.id,
          userContext
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar sugestões');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setSelectedActivities(data.suggestions?.map(s => s.id) || []);
      setActiveStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Salvar rota crítica
  const handleSave = async () => {
    setLoading(true);

    const selectedSuggestions = suggestions.filter(s =>
      selectedActivities.includes(s.id)
    );

    try {
      const response = await fetch(`/api/goals/ideal-path?goalId=${goal.id}&userId=${goal.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: goal.title,
          goalDescription: goal.description,
          goalType: goal.goal_type,
          userContext,
          activities: selectedSuggestions
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar rota crítica');
      }

      const data = await response.json();
      if (onSave) {
        onSave(data.idealPath);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleNext = () => {
    if (activeStep === 0) {
      fetchAISuggestions();
    } else if (activeStep === 1) {
      setActiveStep(2);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getLeverageColor = (score) => {
    if (score >= 30) return '#34C759';
    if (score >= 20) return '#1D1D1F';
    if (score >= 10) return '#86868B';
    return '#FF3B30';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Criar Rota Crítica: {goal?.title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Etapa 1: Contexto */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Forneça contexto adicional (opcional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quanto mais detalhes você fornecer, melhor a IA poderá sugerir atividades
              personalizadas de alta alavancagem.
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Exemplo: Tenho 6 meses até a avaliação de desempenho. Já tenho bom relacionamento com meu gestor direto, mas preciso de mais visibilidade com liderança sênior. Estou trabalhando em um projeto estratégico de migração de sistema..."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Card variant="outlined">
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  💡 <strong>Dica:</strong> Inclua informações sobre:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  <Typography component="li" variant="caption">Prazo ou deadline específico</Typography>
                  <Typography component="li" variant="caption">Recursos disponíveis (tempo, orçamento, pessoas)</Typography>
                  <Typography component="li" variant="caption">Restrições ou bloqueios conhecidos</Typography>
                  <Typography component="li" variant="caption">Progresso já feito ou skills existentes</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Etapa 2: Sugestões da IA */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Atividades de Alta Alavancagem Sugeridas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecione as atividades que você deseja incluir na sua rota crítica.
              Todas estão pré-selecionadas, mas você pode ajustar.
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              suggestions.map((activity, index) => (
                <Card
                  key={activity.id}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedActivities.includes(activity.id)
                      ? 'primary.main'
                      : 'divider',
                    opacity: selectedActivities.includes(activity.id) ? 1 : 0.6,
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => toggleActivity(activity.id)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={activity.order}
                          size="small"
                          sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
                        />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {activity.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${activity.leverage_score} alavancagem`}
                        size="small"
                        sx={{
                          bgcolor: getLeverageColor(activity.leverage_score),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {activity.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip label={`Impacto: ${activity.impact}/10`} size="small" variant="outlined" />
                      <Chip label={`Esforço: ${activity.effort}/10`} size="small" variant="outlined" />
                      <Chip label={`${activity.estimatedDuration}min`} size="small" variant="outlined" />
                      <Chip label={`Prazo: ${activity.deadline}`} size="small" variant="outlined" />
                    </Box>

                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        <strong>Por que é crítico:</strong> {activity.reasoning}
                      </Typography>
                    </Alert>

                    {selectedActivities.includes(activity.id) && (
                      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                        <Check fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">
                          Incluído na rota crítica
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        )}

        {/* Etapa 3: Revisão */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Confirmar Rota Crítica
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Você selecionou {selectedActivities.length} atividades. Revise e confirme.
            </Typography>

            <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📊 Resumo
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${selectedActivities.length} atividades`}
                    color="primary"
                  />
                  <Chip
                    label={`Impacto médio: ${(
                      suggestions
                        .filter(s => selectedActivities.includes(s.id))
                        .reduce((sum, a) => sum + a.impact, 0) / selectedActivities.length
                    ).toFixed(1)}/10`}
                    color="success"
                  />
                  <Chip
                    label={`Tempo total: ${
                      suggestions
                        .filter(s => selectedActivities.includes(s.id))
                        .reduce((sum, a) => sum + a.estimatedDuration, 0)
                    }min`}
                  />
                </Box>
              </CardContent>
            </Card>

            {suggestions
              .filter(s => selectedActivities.includes(s.id))
              .sort((a, b) => a.order - b.order)
              .map((activity, index) => (
                <Card key={activity.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={activity.order} size="small" color="primary" />
                      <Typography variant="body2" fontWeight="bold">
                        {activity.title}
                      </Typography>
                      <Chip
                        label={activity.deadline}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Voltar
          </Button>
        )}
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading || (activeStep === 1 && selectedActivities.length === 0)}
          startIcon={loading ? <CircularProgress size={20} /> : activeStep === 2 ? <Check /> : <TrendingUp />}
        >
          {activeStep === 2 ? 'Criar Rota Crítica' : 'Avançar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}