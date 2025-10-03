import React, { useState, useEffect } from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';
import { LoadingButton, AIClassificationLoading, ErrorDisplay } from '../src/components/LoadingStates';
import ActivityGoalConnection from '../src/components/ActivityGoalConnection';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  InputAdornment,
  Autocomplete,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import FlagIcon from '@mui/icons-material/Flag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function TextEntry() {
  const { user } = useAuth();
  const [activity, setActivity] = useState({
    description: '',
    duration: '',
    energyBefore: 5,
    energyAfter: 5,
    goalIds: [], // Changed from single goalId to array of goalIds
    impact: 5,
    effort: 5
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [goals, setGoals] = useState([]);
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { goalsApi } = await import('../src/services/goalsApi');
      const goalsData = await goalsApi.getGoals();
      const allGoals = [
        ...goalsData.short.map(g => ({
          id: g.id,
          text: g.title,
          type: 'short',
          typeName: 'Curto Prazo'
        })),
        ...goalsData.medium.map(g => ({
          id: g.id,
          text: g.title,
          type: 'medium',
          typeName: 'Médio Prazo'
        })),
        ...goalsData.long.map(g => ({
          id: g.id,
          text: g.title,
          type: 'long',
          typeName: 'Longo Prazo'
        }))
      ];
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      // Fallback to localStorage
      const storedGoals = localStorage.getItem('user_goals');
      if (storedGoals) {
        const goalsData = JSON.parse(storedGoals);
        const allGoals = [
          ...goalsData.short.map(g => ({...g, type: 'short', typeName: 'Curto Prazo'})),
          ...goalsData.medium.map(g => ({...g, type: 'medium', typeName: 'Médio Prazo'})),
          ...goalsData.long.map(g => ({...g, type: 'long', typeName: 'Longo Prazo'}))
        ];
        setGoals(allGoals);
      }
    }
  };

  const handleChange = (field) => (event) => {
    setActivity({
      ...activity,
      [field]: event.target.value
    });
  };

  // Handle multiple goal selection
  const handleGoalChange = (event, newValue) => {
    setActivity({
      ...activity,
      goalIds: newValue.map(goal => goal.id)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    
    if (!activity.description) {
      setError('Por favor, descreva sua atividade');
      return;
    }
    
    setLoading(true);
    
    try {
      // For now, we'll use the existing API but modify the activity object
      // In the future, we'll update the backend to handle multiple goals
      const activityForApi = {
        ...activity,
        goalId: activity.goalIds.length > 0 ? activity.goalIds[0] : null, // Use first goal for backward compatibility
        userId: user?.id
      };

      // Call the API to classify the activity
      const data = await api.classifyActivity(activityForApi);
      
      // If there are multiple goals and the result is SINAL, check for other related goals
      if (activity.goalIds.length > 1 && data.classification === 'SINAL') {
        // Here we would implement AI logic to suggest other related goals
        // For now, we'll just show a placeholder
      }
      
      setResult(data);
    } catch (err) {
      setError('Erro ao classificar a atividade. Por favor, tente novamente.');
      console.error('Error classifying activity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate AI goal suggestion
  const suggestRelatedGoals = async () => {
    if (activity.description && activity.goalIds.length > 0) {
      setLoading(true);
      try {
        // Call the new API endpoint for goal suggestions
        const data = await api.suggestRelatedGoals(
          activity.description, 
          activity.goalIds, 
          'default-user' // In a real app, this would come from auth
        );
        
        setSuggestedGoals(data.suggestions);
        setShowSuggestionDialog(true);
      } catch (error) {
        console.error('Error suggesting goals:', error);
        // Fallback to showing some goals
        const otherGoals = goals.filter(goal => !activity.goalIds.includes(goal.id));
        setSuggestedGoals(otherGoals.slice(0, 3));
        setShowSuggestionDialog(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const acceptSuggestedGoal = (goal) => {
    setActivity({
      ...activity,
      goalIds: [...activity.goalIds, goal.id]
    });
    setShowSuggestionDialog(false);
  };

  const getChipColor = (classification) => {
    switch (classification) {
      case 'SINAL': return 'success';
      case 'RUÍDO': return 'error';
      case 'NEUTRO': return 'warning';
      default: return 'default';
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

  return (
    <ProtectedRoute>
      <div>
        <Header />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 600 }}>
          Registrar Atividade por Texto
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Descreva sua atividade e registre informações adicionais para uma classificação mais precisa
        </Typography>

        <Card sx={{
          my: 4,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 140, 248, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.08)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                width: 'fit-content',
                mx: 'auto',
                mb: 2
              }}>
                <TextSnippetIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Classificação Inteligente de Atividades
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nossa IA analisa sua descrição e contexto para identificar se a atividade é um Sinal produtivo ou Ruído
              </Typography>
            </Box>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Descrição da Atividade"
                multiline
                rows={4}
                value={activity.description}
                onChange={handleChange('description')}
                placeholder="Ex: Trabalhei no relatório trimestral, Reunião de planejamento com a equipe..."
                variant="outlined"
                sx={{ mb: 3 }}
              />
              
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, mt: 4 }}>
                Informações Adicionais
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Estes dados ajudam nossa IA a entender melhor o contexto e impacto da sua atividade
              </Typography>

              <Grid container spacing={3}>
                <Grid size={12}>
                  <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                    <FlagIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Objetivos Relacionados
                    </Typography>
                    <Tooltip
                      title="Selecione um ou mais objetivos que esta atividade se relaciona. Isso ajuda a classificar se é um Sinal ou Ruído."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Autocomplete
                    multiple
                    options={goals}
                    getOptionLabel={(option) => option.text}
                    value={goals.filter(goal => activity.goalIds.includes(goal.id))}
                    onChange={handleGoalChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecione objetivos relacionados"
                        placeholder="Escolha um ou mais objetivos"
                      />
                    )}
                    renderOption={(props, option, { selected }) => {
                      const { key, ...otherProps } = props;
                      return (
                        <li key={key} {...otherProps}>
                          <Checkbox
                            style={{ marginRight: 8 }}
                            checked={selected}
                          />
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
                      );
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...otherProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option.text}
                            {...otherProps}
                            sx={{
                            backgroundColor: `${getGoalTypeColor(option.type)}20`,
                            color: getGoalTypeColor(option.type),
                            '.MuiChip-deleteIcon': {
                              color: getGoalTypeColor(option.type)
                            }
                          }}
                          />
                        );
                      })
                    }
                  />
                  
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <LoadingButton
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={suggestRelatedGoals}
                      loading={loading}
                      sx={{
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': {
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          borderColor: '#10b981'
                        }
                      }}
                    >
                      Pedir sugestões de IA
                    </LoadingButton>
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      A IA analisará todos os seus objetivos e correlacionará com esta atividade
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Impacto no Objetivo
                    </Typography>
                    <Tooltip
                      title="Qual o impacto estimado desta atividade para alcançar seu objetivo? 1 = muito baixo, 10 = máximo impacto."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Impacto (1-10)</InputLabel>
                    <Select
                      value={activity.impact}
                      label="Impacto (1-10)"
                      onChange={handleChange('impact')}
                    >
                      <MenuItem value={0}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AutoAwesomeIcon sx={{ fontSize: 16, color: '#10b981', mr: 1 }} />
                          <Typography>Não sei, verificar com IA</Typography>
                        </Box>
                      </MenuItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 1 }}>{num}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {num <= 3 ? '(Baixo)' : num <= 7 ? '(Médio)' : '(Alto)'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FitnessCenterIcon sx={{ fontSize: 20, color: 'info.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Esforço Necessário
                    </Typography>
                    <Tooltip
                      title="Qual o esforço necessário para esta atividade? 1 = muito baixo, 10 = esforço máximo."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Esforço (1-10)</InputLabel>
                    <Select
                      value={activity.effort}
                      label="Esforço (1-10)"
                      onChange={handleChange('effort')}
                    >
                      <MenuItem value={0}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AutoAwesomeIcon sx={{ fontSize: 16, color: '#10b981', mr: 1 }} />
                          <Typography>Não sei, verificar com IA</Typography>
                        </Box>
                      </MenuItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 1 }}>{num}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {num <= 3 ? '(Baixo)' : num <= 7 ? '(Médio)' : '(Alto)'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Tempo Gasto
                    </Typography>
                    <Tooltip
                      title="Quanto tempo você dedicou a esta atividade? Ajuda a calcular a eficiência e impacto."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Duração em minutos"
                      type="number"
                      value={activity.duration}
                      onChange={handleChange('duration')}
                      InputProps={{
                        inputProps: { min: 1, max: 1440 },
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon color="primary" />
                          </InputAdornment>
                        )
                      }}
                      placeholder="Ex: 30, 90, 120"
                      variant="outlined"
                      helperText="Entre 1 e 1440 minutos (24h)"
                    />
                    <Tooltip title="Deixar IA estimar o tempo baseado na atividade">
                      <IconButton
                        onClick={() => setActivity(prev => ({ ...prev, duration: 0 }))}
                        sx={{
                          mt: 0.5,
                          color: '#10b981',
                          '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.1)'
                          }
                        }}
                      >
                        <AutoAwesomeIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryStdIcon sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Energia Inicial
                    </Typography>
                    <Tooltip
                      title="Como estava seu nível de energia ANTES desta atividade? 1 = muito baixo, 10 = muito alto."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Energia antes (1-10)</InputLabel>
                    <Select
                      value={activity.energyBefore}
                      label="Energia antes (1-10)"
                      onChange={handleChange('energyBefore')}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 1 }}>{num}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {num <= 3 ? '(Baixo)' : num <= 7 ? '(Médio)' : '(Alto)'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryFullIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Energia Final
                    </Typography>
                    <Tooltip
                      title="Como ficou seu nível de energia DEPOIS desta atividade? Ajuda a identificar atividades que drenam ou energizam."
                      placement="top"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Energia depois (1-10)</InputLabel>
                    <Select
                      value={activity.energyAfter}
                      label="Energia depois (1-10)"
                      onChange={handleChange('energyAfter')}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 1 }}>{num}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {num <= 3 ? '(Baixo)' : num <= 7 ? '(Médio)' : '(Alto)'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {error && (
                <ErrorDisplay
                  error={error}
                  onRetry={() => {
                    setError('');
                    handleSubmit();
                  }}
                  title="Erro na Classificação"
                />
              )}
              
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<SendIcon />}
                  sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
                >
                  {loading ? 'Classificando...' : 'Classificar Atividade'}
                </Button>
              </Box>

              {loading && (
                <AIClassificationLoading message="Analisando atividade com IA..." />
              )}
            </Box>
          </CardContent>
        </Card>
        
        {result && (
          <Card sx={{ my: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultado da Classificação
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Chip 
                  label={result.classification} 
                  color={getChipColor(result.classification)} 
                  sx={{ fontSize: '1.2rem', py: 2, px: 3, fontWeight: 'bold' }}
                />
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body1">
                    <strong>Score:</strong> {result.score}/100
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body1">
                    <strong>Confiança:</strong> {(result.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1">
                    <strong>Raciocínio:</strong> {result.reasoning}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Método:</strong> Classificação realizada por {result.method === 'rules' ? 'regras' : 'inteligência artificial'}
                  </Typography>
                </Grid>
              </Grid>
              
              {activity.goalIds.length > 1 && result.classification === 'SINAL' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Dica:</strong> Esta atividade foi classificada como SINAL e está relacionada a {activity.goalIds.length} objetivos.
                    Isso indica que ela contribui significativamente para múltiplos objetivos.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {result && result.connectedGoals && (
          <ActivityGoalConnection
            connectedGoals={result.connectedGoals}
            onNavigateToGoal={(goalId) => window.location.href = `/goals?highlight=${goalId}`}
            onUpdateProgress={async (goalId, newProgress) => {
              try {
                const user = JSON.parse(localStorage.getItem('signalRuidoUser') || '{}');
                await fetch('/api/goals/progress', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    goalId,
                    progressPercentage: newProgress,
                    updateReason: 'activity',
                    userId: user.id
                  })
                });
              } catch (error) {
                console.error('Error updating progress:', error);
              }
            }}
          />
        )}

        {result && (
          <Card sx={{ my: 2 }}>
            <CardContent>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ py: 1.5, px: 4 }}
                  onClick={() => {
                    // Reset form for new entry
                    setActivity({
                      description: '',
                      duration: '',
                      energyBefore: 5,
                      energyAfter: 5,
                      goalIds: [],
                      impact: 5,
                      effort: 5
                    });
                    setResult(null);
                  }}
                >
                  Registrar Nova Atividade
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
      
      {/* Goal Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onClose={() => setShowSuggestionDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesomeIcon sx={{ color: '#10b981', mr: 1 }} />
            <Typography variant="h6">Sugestões de Objetivos Relacionados</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nossa IA identificou que esta atividade também pode contribuir para os seguintes objetivos:
          </Typography>
          
          {suggestedGoals.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {suggestedGoals.map((goal) => (
                <Box 
                  key={goal.id} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 1, 
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Chip
                      label={goal.typeName}
                      size="small"
                      sx={{
                        mr: 1,
                        fontSize: '0.7rem',
                        color: getGoalTypeColor(goal.type),
                        borderColor: getGoalTypeColor(goal.type)
                      }}
                      variant="outlined"
                    />
                    <Typography variant="body1">{goal.text}</Typography>
                  </Box>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => acceptSuggestedGoal(goal)}
                    sx={{ 
                      color: getGoalTypeColor(goal.type),
                      borderColor: getGoalTypeColor(goal.type)
                    }}
                  >
                    Adicionar
                  </Button>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
              Nenhuma sugestão adicional encontrada.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestionDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </div>
    </ProtectedRoute>
  );
}