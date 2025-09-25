import React, { useEffect, useState } from 'react';
import Header from '../src/components/Header';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SignalIcon from '@mui/icons-material/Timeline';
import NoiseIcon from '@mui/icons-material/VolumeOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FlagIcon from '@mui/icons-material/Flag';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import WeekdayIcon from '@mui/icons-material/DateRange';
import MonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../src/services/api';
import { goalsApi } from '../src/services/goalsApi';
import RecentActivities from '../src/components/RecentActivities';
import ProgressTracker from '../src/components/ProgressTracker';
import LeverageMatrix from '../src/components/LeverageMatrix';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [goals, setGoals] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState(null);
  const [topGoals, setTopGoals] = useState([]);
  const [timeframe, setTimeframe] = useState('week');
  const [recentActivities, setRecentActivities] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  // Initial data load - only once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load only static data that doesn't change with filters
        const [goalsResult, activitiesResult] = await Promise.allSettled([
          goalsApi.getGoals(),
          fetch('/api/activities/recent?limit=50') // Increased limit for Leverage Matrix
            .then(response => response.ok ? response.json() : Promise.reject('Activities API failed'))
        ]);

        // Process goals data
        if (goalsResult.status === 'fulfilled') {
          const goalsData = goalsResult.value;
          const allGoals = [
            ...goalsData.short.map(g => ({
              ...g,
              goal_type: 'short',
              text: g.title,
              type: 'short',
              typeName: 'Curto Prazo'
            })),
            ...goalsData.medium.map(g => ({
              ...g,
              goal_type: 'medium',
              text: g.title,
              type: 'medium',
              typeName: 'Médio Prazo'
            })),
            ...goalsData.long.map(g => ({
              ...g,
              goal_type: 'long',
              text: g.title,
              type: 'long',
              typeName: 'Longo Prazo'
            }))
          ];
          setGoals(allGoals);
        } else {
          console.error('Error loading goals:', goalsResult.reason);
        }

        // Process recent activities data
        if (activitiesResult.status === 'fulfilled') {
          setRecentActivities(activitiesResult.value.activities);
        } else {
          console.error('Error fetching recent activities:', activitiesResult.reason);
        }

      } catch (error) {
        setError('Erro ao carregar os dados do dashboard');
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // No dependencies - only run once on mount

  // Separate effect for filtered data that can change without full reload
  useEffect(() => {
    const loadFilteredData = async () => {
      if (goals.length === 0) return; // Wait for goals to load first

      try {
        setAnalyticsLoading(true); // Show subtle loading for analytics only
        const [analyticsResult, topGoalsResult] = await Promise.allSettled([
          fetch('/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'default-user',
              goalIds: selectedGoals.map(goal => goal.id)
            }),
          }).then(response => response.ok ? response.json() : Promise.reject('Analytics API failed')),

          api.getTopGoals('default-user', timeframe)
        ]);

        // Process analytics data
        if (analyticsResult.status === 'fulfilled') {
          setFilteredAnalytics(analyticsResult.value.insights);
        } else {
          console.error('Error fetching analytics:', analyticsResult.reason);
          setFilteredAnalytics({
            totalActivities: 0,
            signalActivities: 0,
            noiseActivities: 0,
            neutralActivities: 0,
            averageScore: 0
          });
        }

        // Process top goals data
        if (topGoalsResult.status === 'fulfilled') {
          setTopGoals(topGoalsResult.value.topGoals);
        } else {
          console.error('Error fetching top goals:', topGoalsResult.reason);
        }

      } catch (error) {
        console.error('Error loading filtered data:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadFilteredData();
  }, [selectedGoals, timeframe, goals]); // Depends on filters and goals

  const handleGoalChange = (event, newValue) => {
    setSelectedGoals(newValue);
  };

  const handleTimeframeChange = (event, newTimeframe) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'signal': return '#10b981';
      case 'noise': return '#ef4444';
      case 'neutral': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  };

  const handleUpdateProgress = async (goalId, newProgress) => {
    setProgressLoading(true);
    try {
      const response = await fetch('/api/goals/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          progressPercentage: newProgress,
          updateReason: 'manual'
        })
      });

      if (response.ok) {
        // Refresh goals data
        const goalsData = await goalsApi.getGoals();
        const allGoals = [
          ...goalsData.short.map(g => ({ ...g, goal_type: 'short' })),
          ...goalsData.medium.map(g => ({ ...g, goal_type: 'medium' })),
          ...goalsData.long.map(g => ({ ...g, goal_type: 'long' }))
        ];
        setGoals(allGoals);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleMarkComplete = async (goalId) => {
    await handleUpdateProgress(goalId, 100);
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
      <div>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <LinearProgress />
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </div>
    );
  }

  if (!filteredAnalytics) {
    return (
      <div>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Alert severity="info">Nenhum dado disponível no momento.</Alert>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header com métricas principais */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                Dashboard de Produtividade
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Acompanhe seus sinais, ruídos e otimize sua produtividade
              </Typography>
            </Box>
            <Box sx={{ minWidth: 300 }}>
              <Autocomplete
                multiple
                options={goals}
                getOptionLabel={(option) => option.text}
                value={selectedGoals}
                onChange={handleGoalChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filtrar por objetivos"
                    placeholder="Selecione objetivos"
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Chip
                      label={option.typeName}
                      size="small"
                      sx={{
                        mr: 1,
                        fontSize: '0.7rem',
                        color: getGoalTypeColor(option.type),
                        borderColor: getGoalTypeColor(option.type)
                      }}
                      variant="outlined"
                    />
                    <ListItemText primary={option.text} />
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.text}
                      {...getTagProps({ index })}
                      sx={{
                        backgroundColor: `${getGoalTypeColor(option.type)}20`,
                        color: getGoalTypeColor(option.type),
                        '.MuiChip-deleteIcon': {
                          color: getGoalTypeColor(option.type)
                        }
                      }}
                    />
                  ))
                }
              />
            </Box>
          </Box>

          {/* Cards de métricas principais */}
          <Grid container spacing={3} sx={{ mb: 4, position: 'relative' }}>
            {analyticsLoading && (
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2
              }}>
                <LinearProgress sx={{ width: '200px' }} />
              </Box>
            )}
            <Grid xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {filteredAnalytics?.productivityScore || 0}%
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Score de Produtividade
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      +{filteredAnalytics?.weeklyGrowth || 0}% esta semana
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', color: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {filteredAnalytics?.signalActivities || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Sinais Detectados
                      </Typography>
                    </Box>
                    <SignalIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {Math.round(((filteredAnalytics?.signalActivities || 0) / (filteredAnalytics?.totalActivities || 1)) * 100)}% do total
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)', color: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {filteredAnalytics?.noiseActivities || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Ruídos Identificados
                      </Typography>
                    </Box>
                    <NoiseIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {Math.round(((filteredAnalytics?.noiseActivities || 0) / (filteredAnalytics?.totalActivities || 1)) * 100)}% do total
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', color: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {filteredAnalytics?.insights?.streak || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Dias Consecutivos
                      </Typography>
                    </Box>
                    <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Meta: {filteredAnalytics?.insights?.todayGoal || 50}% hoje
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Layout principal - Gráficos e Kanban */}
        <Grid container spacing={4}>
          {/* Gráficos - Lado esquerdo */}
          <Grid xs={12} lg={8}>
            {/* Gráfico de produtividade semanal */}
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Produtividade da Semana
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredAnalytics?.weeklyProductivity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="productivity"
                      stroke="#6366f1"
                      fill="url(#colorProductivity)"
                      strokeWidth={3}
                    />
                    <defs>
                      <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Real vs Ideal Progress Chart */}
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Progresso Real vs. Ideal
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={filteredAnalytics?.progressComparison?.real || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impact" name="Progresso Real" stroke="#8884d8" />
                    <Line type="monotone" data={filteredAnalytics?.progressComparison?.ideal || []} dataKey="impact" name="Progresso Ideal" stroke="#82ca9d" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leverage Matrix */}
            <Box sx={{ mb: 4 }}>
              <LeverageMatrix activities={recentActivities} />
            </Box>

            {/* Objetivos mais sinalizados */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Objetivos Mais Sinalizados
                  </Typography>
                  <ToggleButtonGroup
                    value={timeframe}
                    exclusive
                    onChange={handleTimeframeChange}
                    size="small"
                    sx={{ height: 36 }}
                  >
                    <ToggleButton value="day" sx={{ px: 2 }}>
                      <TodayIcon sx={{ fontSize: 16, mr: 1 }} />
                      Hoje
                    </ToggleButton>
                    <ToggleButton value="week" sx={{ px: 2 }}>
                      <WeekdayIcon sx={{ fontSize: 16, mr: 1 }} />
                      Semana
                    </ToggleButton>
                    <ToggleButton value="month" sx={{ px: 2 }}>
                      <MonthIcon sx={{ fontSize: 16, mr: 1 }} />
                      Mês
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                {topGoals.length > 0 ? (
                  <List>
                    {topGoals.map((goal, index) => (
                      <ListItem key={goal.id} sx={{ px: 0, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ mr: 2, width: 24, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: index < 3 ? getGoalTypeColor(goal.type) : 'text.secondary' }}>
                              {index + 1}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Chip
                                label={goal.typeName}
                                size="small"
                                sx={{
                                  mr: 1,
                                  fontSize: '0.7rem',
                                  color: getGoalTypeColor(goal.type),
                                  borderColor: getGoalTypeColor(goal.type),
                                  height: 20
                                }}
                                variant="outlined"
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {goal.title}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#10b981', mr: 2 }}>
                                {goal.signalCount} sinais
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#ef4444', mr: 2 }}>
                                {goal.noiseCount} ruídos
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {goal.activityCount} atividades
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                              {goal.signalPercentage}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              eficiência
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Nenhum objetivo com atividades registradas no período selecionado.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar - Progress & Activities */}
          <Grid xs={12} lg={4}>
            {/* Progress Tracker */}
            <Box sx={{ mb: 4 }}>
              <ProgressTracker
                goals={goals}
                onUpdateProgress={handleUpdateProgress}
                onMarkComplete={handleMarkComplete}
                loading={progressLoading}
              />
            </Box>

            {/* Recent Activities */}
            <RecentActivities
              activities={recentActivities}
              loading={loading}
              title="Atividades Recentes"
            />

            {/* Recomendações */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recomendações IA
                </Typography>
                <Stack spacing={2}>
                  {(filteredAnalytics?.recommendations || []).map((rec, index) => (
                    <Paper
                      key={`${rec.id}-${index}`}
                      sx={{
                        p: 2,
                        border: `1px solid ${getPriorityColor(rec.priority)}40`,
                        borderRadius: 2,
                        backgroundColor: `${getPriorityColor(rec.priority)}08`
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        {rec.text}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={rec.priority}
                          size="small"
                          sx={{
                            backgroundColor: getPriorityColor(rec.priority),
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                        <Typography variant="caption" sx={{ color: getPriorityColor(rec.priority), fontWeight: 600 }}>
                          {rec.impact}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
