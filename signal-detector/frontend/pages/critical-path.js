import React, { useState, useEffect } from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { useAuth } from '../src/contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider
} from '@mui/material';
import {
  AutoAwesome,
  Route,
  TrendingUp,
  Info
} from '@mui/icons-material';
import CriticalPathWizard from '../src/components/CriticalPathWizard';
import IdealPathTimeline from '../src/components/IdealPathTimeline';
import ProgressComparisonChart from '../src/components/ProgressComparisonChart';
import { goalsApi } from '../src/services/goalsApi';

export default function CriticalPath() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [idealPath, setIdealPath] = useState(null);
  const [deviation, setDeviation] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      loadIdealPath(selectedGoal.id);
    }
  }, [selectedGoal]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const goalsData = await goalsApi.getGoals();

      const allGoals = [
        ...goalsData.short.map(g => ({ ...g, goal_type: 'short', typeName: 'Curto Prazo' })),
        ...goalsData.medium.map(g => ({ ...g, goal_type: 'medium', typeName: 'Médio Prazo' })),
        ...goalsData.long.map(g => ({ ...g, goal_type: 'long', typeName: 'Longo Prazo' }))
      ];

      setGoals(allGoals);

      // Auto-select first goal with ideal path, or first goal
      const goalWithPath = allGoals.find(g => g.ideal_path);
      setSelectedGoal(goalWithPath || allGoals[0]);
    } catch (err) {
      setError('Erro ao carregar objetivos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadIdealPath = async (goalId) => {
    try {
      const response = await fetch(`/api/goals/ideal-path?goalId=${goalId}&userId=${user?.id}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar rota ideal');
      }

      const data = await response.json();

      if (data.hasIdealPath) {
        setIdealPath(data.idealPath);
        setDeviation(data.deviation);
      } else {
        setIdealPath(null);
        setDeviation(null);
      }
    } catch (err) {
      console.error('Error loading ideal path:', err);
      setIdealPath(null);
      setDeviation(null);
    }
  };

  const handleGoalChange = (event) => {
    const goalId = event.target.value;
    const goal = goals.find(g => g.id === goalId);
    setSelectedGoal(goal);
  };

  const handleCreatePath = () => {
    setWizardOpen(true);
  };

  const handleSavePath = async (newIdealPath) => {
    setIdealPath(newIdealPath);
    await loadIdealPath(selectedGoal.id);
  };

  const handleDeletePath = async () => {
    if (!selectedGoal) return;

    if (confirm('Tem certeza que deseja remover esta rota crítica?')) {
      try {
        const response = await fetch(
          `/api/goals/ideal-path?goalId=${selectedGoal.id}&userId=${user?.id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setIdealPath(null);
          setDeviation(null);
          alert('Rota crítica removida com sucesso');
        }
      } catch (err) {
        console.error('Error deleting ideal path:', err);
        alert('Erro ao remover rota crítica');
      }
    }
  };

  const handleActivityComplete = async (activity, isCompleted) => {
    // Update activity status in backend
    try {
      await fetch(`/api/goals/ideal-path?goalId=${selectedGoal.id}&userId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idealPath: {
            ...idealPath,
            activities: idealPath.activities.map(a =>
              a.id === activity.id
                ? { ...a, status: isCompleted ? 'completed' : 'pending', completedAt: isCompleted ? new Date().toISOString() : null }
                : a
            )
          }
        })
      });

      // Reload
      await loadIdealPath(selectedGoal.id);
    } catch (err) {
      console.error('Error updating activity status:', err);
    }
  };

  const getGoalTypeColor = (type) => {
    switch (type) {
      case 'short': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'long': return '#a855f7';
      default: return '#60a5fa';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div>
          <Header />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div>
          <Header />
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div>
        <Header />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                  <Route sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Rota Crítica
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Planeje e acompanhe o caminho de alta alavancagem para seus objetivos
                </Typography>
              </Box>
            </Box>

            {/* Goal Selector */}
            {goals.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 300 }}>
                  <InputLabel>Objetivo</InputLabel>
                  <Select
                    value={selectedGoal?.id || ''}
                    label="Objetivo"
                    onChange={handleGoalChange}
                  >
                    {goals.map(goal => (
                      <MenuItem key={goal.id} value={goal.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={goal.typeName}
                            size="small"
                            sx={{ bgcolor: getGoalTypeColor(goal.goal_type), color: 'white' }}
                          />
                          {goal.title}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {!idealPath && (
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={handleCreatePath}
                  >
                    Criar Rota Crítica com IA
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {/* Content */}
          {goals.length === 0 ? (
            <Alert severity="info">
              Você ainda não tem objetivos definidos. Crie objetivos primeiro na página de Objetivos.
            </Alert>
          ) : !selectedGoal ? (
            <Alert severity="info">
              Selecione um objetivo acima para visualizar ou criar sua rota crítica.
            </Alert>
          ) : !idealPath ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Route sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Nenhuma Rota Crítica Definida
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Use o Wizard de IA para criar uma rota de alta alavancagem para este objetivo
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoAwesome />}
                  onClick={handleCreatePath}
                >
                  Criar Rota Crítica com IA
                </Button>

                <Alert severity="info" sx={{ mt: 4, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Info sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    O que é uma Rota Crítica?
                  </Typography>
                  <Typography variant="body2">
                    Uma rota crítica é o caminho de 3-5 atividades de <strong>alta alavancagem</strong> que
                    maximizam o progresso em direção ao seu objetivo. A IA analisa seu histórico e sugere
                    atividades Q1 (alto impacto + baixo esforço) baseadas em princípios de produtividade.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {/* Progress Chart */}
              <Grid item xs={12} lg={6}>
                <ProgressComparisonChart
                  goal={selectedGoal}
                  idealPath={idealPath}
                  deviation={deviation}
                />
              </Grid>

              {/* Timeline */}
              <Grid item xs={12} lg={6}>
                <IdealPathTimeline
                  idealPath={idealPath}
                  onActivityComplete={handleActivityComplete}
                  onEdit={() => setWizardOpen(true)}
                  onDelete={handleDeletePath}
                  editable={true}
                />
              </Grid>

              {/* Insights */}
              {deviation && deviation.status === 'behind' && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Ação Recomendada
                      </Typography>
                      <Typography variant="body2">
                        Você está {Math.abs(deviation.deviationPercentage).toFixed(0)}% atrasado.
                        Foque na próxima atividade crítica: <strong>{deviation.nextMilestone?.description}</strong>
                      </Typography>
                    </Box>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Wizard Dialog */}
          <CriticalPathWizard
            open={wizardOpen}
            onClose={() => setWizardOpen(false)}
            goal={selectedGoal ? { ...selectedGoal, userId: user?.id } : null}
            onSave={handleSavePath}
          />
        </Container>
      </div>
    </ProtectedRoute>
  );
}