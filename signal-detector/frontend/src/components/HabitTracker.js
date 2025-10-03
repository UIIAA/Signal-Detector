import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Grid,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  LocalFireDepartment,
  TrendingUp,
  Add
} from '@mui/icons-material';

/**
 * HabitTracker.js
 *
 * Visualização de grid de hábitos com check-ins diários e streak tracking.
 * Mostra últimos 7 dias e estatísticas de consistência.
 */
export default function HabitTracker({ habits = [], onCheckIn, onAddHabit }) {
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const days = getLast7Days();

  const getStreakColor = (streak) => {
    if (streak >= 30) return '#10b981'; // green
    if (streak >= 14) return '#3b82f6'; // blue
    if (streak >= 7) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Rastreador de Hábitos
          </Typography>
          {onAddHabit && (
            <Button
              size="small"
              startIcon={<Add />}
              onClick={onAddHabit}
            >
              Novo Hábito
            </Button>
          )}
        </Box>

        {habits.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Nenhum hábito configurado. Crie seu primeiro hábito!
          </Typography>
        ) : (
          <Box>
            {/* Header com dias */}
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={3}>
                <Typography variant="caption" fontWeight="bold">Hábito</Typography>
              </Grid>
              {days.map((day, index) => (
                <Grid item xs={1.3} key={index}>
                  <Tooltip title={day.toLocaleDateString('pt-BR')}>
                    <Typography variant="caption" textAlign="center" display="block">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3)}
                    </Typography>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            {/* Hábitos */}
            {habits.map((habit) => (
              <Card key={habit.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Grid container spacing={1} alignItems="center">
                    {/* Título e streak */}
                    <Grid item xs={3}>
                      <Typography variant="body2" fontWeight="bold">
                        {habit.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <LocalFireDepartment
                          sx={{
                            fontSize: 16,
                            color: getStreakColor(habit.current_streak)
                          }}
                        />
                        <Typography variant="caption">
                          {habit.current_streak} dias
                        </Typography>
                        {habit.longest_streak > habit.current_streak && (
                          <Typography variant="caption" color="text.secondary">
                            (recorde: {habit.longest_streak})
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Check-ins dos últimos 7 dias */}
                    {days.map((day, index) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const checkin = habit.checkins?.find(c => c.checkin_date === dateStr);
                      const isToday = dateStr === new Date().toISOString().split('T')[0];
                      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                      return (
                        <Grid item xs={1.3} key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => onCheckIn && onCheckIn(habit.id, dateStr, !checkin?.completed)}
                              disabled={!isToday && !isPast}
                              sx={{
                                color: checkin?.completed ? 'success.main' : 'text.disabled'
                              }}
                            >
                              {checkin?.completed ? (
                                <CheckCircle />
                              ) : (
                                <RadioButtonUnchecked />
                              )}
                            </IconButton>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Progresso semanal */}
                  {habit.success_rate !== undefined && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">Taxa de Sucesso</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {habit.success_rate.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={habit.success_rate}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: habit.success_rate >= 80 ? 'success.main' : habit.success_rate >= 60 ? 'warning.main' : 'error.main'
                          }
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Estatísticas gerais */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                📊 Resumo Geral
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`${habits.length} hábitos ativos`}
                  size="small"
                  color="primary"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`Taxa média: ${(
                    habits.reduce((sum, h) => sum + (h.success_rate || 0), 0) / habits.length
                  ).toFixed(0)}%`}
                  size="small"
                  color="success"
                />
                <Chip
                  icon={<LocalFireDepartment />}
                  label={`Maior streak: ${Math.max(...habits.map(h => h.longest_streak || 0))} dias`}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}