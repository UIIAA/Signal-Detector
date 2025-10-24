import React, { useState, useEffect } from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { useAuth } from '../src/contexts/AuthContext';
import HabitTracker from '../src/components/HabitTracker';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

export default function Habits() {
  const { user, fetchWithAuth } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    habit_type: 'build',
    frequency: 'daily',
    target_days_per_week: 7,
    preferred_time_of_day: '',
    cue: '',
    reward: ''
  });

  useEffect(() => {
    loadHabits();
  }, [user?.id]);

  const loadHabits = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/habits`);
      if (response.ok) {
        const data = await response.json();
        const processedHabits = (data.habits || []).map(habit => ({
          ...habit,
          checkins: habit.checkins || [], // Garante que checkins seja um array
          checkinsMap: (habit.checkins || []).reduce((acc, checkin) => {
            acc[checkin.checkin_date] = checkin;
            return acc;
          }, {})
        }));
        setHabits(processedHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (habit = null) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({
        title: habit.title,
        description: habit.description || '',
        habit_type: habit.habit_type,
        frequency: habit.frequency,
        target_days_per_week: habit.target_days_per_week || 7,
        preferred_time_of_day: habit.preferred_time_of_day || '',
        cue: habit.cue || '',
        reward: habit.reward || ''
      });
    } else {
      setEditingHabit(null);
      setFormData({
        title: '',
        description: '',
        habit_type: 'build',
        frequency: 'daily',
        target_days_per_week: 7,
        preferred_time_of_day: '',
        cue: '',
        reward: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCheckIn = async (habitId, date, completed) => {
    // Optimistic UI update
    const originalHabits = habits;
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const newCheckinsMap = { ...h.checkinsMap, [date]: { checkin_date: date, completed } };
        return { ...h, checkinsMap: newCheckinsMap };
      }
      return h;
    });
    setHabits(updatedHabits);

    try {
      const response = await fetchWithAuth('/api/habits/checkin', {
        method: 'POST',
        body: JSON.stringify({ habitId, date, completed })
      });

      if (!response.ok) throw new Error('Failed to update check-in');

      // Optionally, reload habits from server to get updated streaks and success rates
      await loadHabits();

    } catch (error) {
      console.error('Error checking in habit:', error);
      // Rollback on error
      setHabits(originalHabits);
      alert('Não foi possível atualizar o hábito. Tente novamente.');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHabit(null);
  };

  const handleSaveHabit = async () => {
    try {
      const url = '/api/habits';
      const method = editingHabit ? 'PUT' : 'POST';
      const body = editingHabit
        ? { ...formData, habitId: editingHabit.id, userId: user.id }
        : { ...formData, userId: user.id };

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadHabits();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Tem certeza que deseja excluir este hábito?')) return;

    try {
      const response = await fetchWithAuth(`/api/habits`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId })
      });

      if (response.ok) {
        await loadHabits();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const getHabitTypeColor = (type) => {
    switch (type) {
      case 'build': return '#10b981';
      case 'break': return '#ef4444';
      case 'maintain': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const getHabitTypeLabel = (type) => {
    switch (type) {
      case 'build': return 'Construir';
      case 'break': return 'Quebrar';
      case 'maintain': return 'Manter';
      default: return type;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>Meus Hábitos</Typography>
          <LinearProgress />
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Meus Hábitos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Construa hábitos consistentes para alcançar seus objetivos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              }
            }}
          >
            Novo Hábito
          </Button>
        </Box>

        {/* Habit Tracker Visual */}
        <Box sx={{ mb: 4 }}>
          <HabitTracker habits={habits} onCheckIn={handleCheckIn} onAddHabit={() => handleOpenDialog()} />
        </Box>

        {/* Lista de Hábitos */}
        <Grid container spacing={3}>
          {habits.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                Você ainda não tem hábitos cadastrados. Clique em "Novo Hábito" para começar!
              </Alert>
            </Grid>
          ) : (
            habits.map((habit) => (
              <Grid item xs={12} md={6} key={habit.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {habit.title}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip
                            label={getHabitTypeLabel(habit.habit_type)}
                            size="small"
                            sx={{
                              backgroundColor: getHabitTypeColor(habit.habit_type),
                              color: 'white'
                            }}
                          />
                          <Chip
                            label={habit.frequency === 'daily' ? 'Diário' : habit.frequency}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenDialog(habit)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteHabit(habit.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {habit.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {habit.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Streak Atual
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FireIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {habit.current_streak || 0}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Melhor Streak
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {habit.longest_streak || 0}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Taxa de Sucesso
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {Math.round(habit.success_rate || 0)}%
                        </Typography>
                      </Box>
                    </Box>

                    {habit.cue && (
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        <strong>Gatilho:</strong> {habit.cue}
                      </Typography>
                    )}
                    {habit.reward && (
                      <Typography variant="caption" display="block">
                        <strong>Recompensa:</strong> {habit.reward}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Dialog para Criar/Editar Hábito */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Título do Hábito"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Meditar 10 minutos, Ler 20 páginas"
              />

              <TextField
                fullWidth
                label="Descrição (opcional)"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <FormControl fullWidth>
                <InputLabel>Tipo de Hábito</InputLabel>
                <Select
                  value={formData.habit_type}
                  label="Tipo de Hábito"
                  onChange={(e) => setFormData({ ...formData, habit_type: e.target.value })}
                >
                  <MenuItem value="build">Construir (novo hábito positivo)</MenuItem>
                  <MenuItem value="break">Quebrar (eliminar hábito negativo)</MenuItem>
                  <MenuItem value="maintain">Manter (hábito existente)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Frequência</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frequência"
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                >
                  <MenuItem value="daily">Diário</MenuItem>
                  <MenuItem value="weekly">Semanal</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Meta de dias por semana"
                value={formData.target_days_per_week}
                onChange={(e) => setFormData({ ...formData, target_days_per_week: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 7 }}
              />

              <TextField
                fullWidth
                label="Horário preferido (opcional)"
                value={formData.preferred_time_of_day}
                onChange={(e) => setFormData({ ...formData, preferred_time_of_day: e.target.value })}
                placeholder="Ex: Manhã, Após o café, 18h"
              />

              <TextField
                fullWidth
                label="Gatilho/Cue (opcional)"
                value={formData.cue}
                onChange={(e) => setFormData({ ...formData, cue: e.target.value })}
                placeholder="O que vai disparar este hábito?"
              />

              <TextField
                fullWidth
                label="Recompensa (opcional)"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                placeholder="Qual a recompensa ao completar?"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              onClick={handleSaveHabit}
              variant="contained"
              disabled={!formData.title}
            >
              {editingHabit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ProtectedRoute>
  );
}
