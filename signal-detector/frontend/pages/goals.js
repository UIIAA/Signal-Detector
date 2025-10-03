import React, { useState, useEffect } from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  GpsFixed as TargetIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { LoadingButton, GoalAnalysisLoading, ErrorDisplay } from '../src/components/LoadingStates';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CriticalPathWizard from '../src/components/CriticalPathWizard';
import IdealPathTimeline from '../src/components/IdealPathTimeline';
import ProgressComparisonChart from '../src/components/ProgressComparisonChart';

// --- Framework Manager Component ---
const FrameworkManager = ({ goal }) => {
  const [items, setItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState('');

  const fetchItems = async () => {
    if (goal.id) {
      const res = await fetch(`/api/goals/${goal.id}/framework-items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, [goal.id]);

  const handleAddItem = async (itemType) => {
    if (!newItemTitle) return;
    await fetch(`/api/goals/${goal.id}/framework-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newItemTitle, item_type: itemType })
    });
    setNewItemTitle('');
    fetchItems(); // Refresh list
  };

  const handleChooseFramework = async (framework) => {
    // This POST will trigger the backend to set the framework type on the goal
    await fetch(`/api/goals/${goal.id}/framework-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Primeiro item para ${framework}`, item_type: framework === 'okr' ? 'key_result' : 'habit' })
    });
    fetchItems();
    // Reload the entire page to reflect the goal's framework_type change
    // This is a temporary solution for simplicity.
    window.location.reload();
  };

  const renderFrameworkUI = () => {
    switch (goal.framework_type) {
      case 'okr':
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Key Results</Typography>
            <List dense>
              {items.map(item => <ListItem key={item.id}><ListItemText primary={item.title} /></ListItem>)}
            </List>
            <Box sx={{ display: 'flex', mt: 2 }}>
              <TextField size="small" fullWidth label="Novo Key Result" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} />
              <Button sx={{ ml: 1 }} variant="contained" onClick={() => handleAddItem('key_result')}>Add</Button>
            </Box>
          </Box>
        );
      // Add cases for other frameworks here

      case 'none':
      default:
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography sx={{ mb: 2 }}>Nenhum framework aplicado. Escolha um para começar:</Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={() => handleChooseFramework('okr')}>Adotar OKR</Button>
              <Button variant="outlined" disabled>Hábitos Atômicos (em breve)</Button>
              <Button variant="outlined" disabled>Matriz de Eisenhower (em breve)</Button>
            </Stack>
          </Box>
        );
    }
  };

  return <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>{renderFrameworkUI()}</Box>;
};


export default function Goals() {
  const [goals, setGoals] = useState({
    short: [],
    medium: [],
    long: []
  });

  const [newGoal, setNewGoal] = useState({
    text: '',
    type: 'short'
  });

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiAssistantStep, setAiAssistantStep] = useState(0);
  const [aiAssistantData, setAiAssistantData] = useState({
    context: '',
    goals: '',
    timeframe: '',
    experience: '',
    challenges: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [criticalPathWizardOpen, setCriticalPathWizardOpen] = useState(false);
  const [selectedGoalForPath, setSelectedGoalForPath] = useState(null);
  const [goalIdealPaths, setGoalIdealPaths] = useState({});

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoadingGoals(true);
      const { goalsApi } = await import('../src/services/goalsApi');
      const goalsData = await goalsApi.getGoals();

      // Converter dados da API para formato do frontend
      const convertedGoals = {
        short: goalsData.short.map(goal => ({
          id: goal.id,
          text: goal.title,
          createdAt: new Date(goal.created_at),
          aiSuggested: goal.ai_suggested === 1
        })),
        medium: goalsData.medium.map(goal => ({
          id: goal.id,
          text: goal.title,
          createdAt: new Date(goal.created_at),
          aiSuggested: goal.ai_suggested === 1
        })),
        long: goalsData.long.map(goal => ({
          id: goal.id,
          text: goal.title,
          createdAt: new Date(goal.created_at),
          aiSuggested: goal.ai_suggested === 1
        }))
      };

      setGoals(convertedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      // Fallback: inicializar com estrutura vazia
      setGoals({
        short: [],
        medium: [],
        long: []
      });
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleAddGoal = async () => {
    if (newGoal.text.trim()) {
      try {
        const { goalsApi } = await import('../src/services/goalsApi');
        const createdGoal = await goalsApi.createGoal({
          text: newGoal.text.trim(),
          type: newGoal.type,
          aiSuggested: false
        });

        // Update local state
        setGoals(prev => ({
          ...prev,
          [newGoal.type]: [...prev[newGoal.type], {
            id: createdGoal.id,
            text: createdGoal.title,
            createdAt: new Date(createdGoal.created_at),
            aiSuggested: createdGoal.ai_suggested
          }]
        }));

        setNewGoal({ text: '', type: 'short' });
      } catch (error) {
        console.error('Error adding goal:', error);
        // Fallback to local state only
        setGoals(prev => ({
          ...prev,
          [newGoal.type]: [...prev[newGoal.type], {
            id: Date.now(),
            text: newGoal.text.trim(),
            createdAt: new Date()
          }]
        }));
        setNewGoal({ text: '', type: 'short' });
      }
    }
  };

  const handleDeleteGoal = async (type, goalId) => {
    try {
      const { goalsApi } = await import('../src/services/goalsApi');
      await goalsApi.deleteGoal(goalId);

      // Update local state
      setGoals(prev => ({
        ...prev,
        [type]: prev[type].filter(goal => goal.id !== goalId)
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      // Still remove from local state even if API fails
      setGoals(prev => ({
        ...prev,
        [type]: prev[type].filter(goal => goal.id !== goalId)
      }));
    }
  };

  const handleOpenCriticalPathWizard = (goal) => {
    const user = JSON.parse(localStorage.getItem('signalRuidoUser') || '{}');
    setSelectedGoalForPath({
      ...goal,
      userId: user.id
    });
    setCriticalPathWizardOpen(true);
  };

  const handleSaveCriticalPath = async (idealPath) => {
    if (selectedGoalForPath) {
      setGoalIdealPaths(prev => ({
        ...prev,
        [selectedGoalForPath.id]: idealPath
      }));
    }
  };

  const handleAiAssistantNext = () => {
    if (aiAssistantStep < 4) {
      setAiAssistantStep(prev => prev + 1);
    } else {
      generateAiSuggestions();
    }
  };

  const generateAiSuggestions = async () => {
    setLoadingSuggestions(true);
    setLoadingProgress(0);
    setLoadingMessage('Analisando seu perfil...');

    try {
      // Fase 1: Analisando perfil
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingProgress(25);
      setLoadingMessage('Processando objetivos...');

      // Fase 2: Processando objetivos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoadingProgress(50);
      setLoadingMessage('Consultando IA especializada...');

      // Fase 3: Chamada real para API
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoadingProgress(75);
      setLoadingMessage('Gerando recomendações personalizadas...');

      const response = await fetch('/api/analyze-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: aiAssistantData.context,
          goals: aiAssistantData.goals,
          timeframe: aiAssistantData.timeframe,
          experience: aiAssistantData.experience,
          challenges: aiAssistantData.challenges
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Fase final: Finalizando
        setLoadingProgress(100);
        setLoadingMessage('Finalizando sugestões...');
        await new Promise(resolve => setTimeout(resolve, 500));

        setAiSuggestions(data);
      } else {
        setAiSuggestions({
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
      setAiSuggestions({
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
    } finally {
      setLoadingSuggestions(false);
      setLoadingProgress(0);
      setLoadingMessage('');
    }
  };

  const addSuggestedGoal = async (goalText, type) => {
    try {
      const { goalsApi } = await import('../src/services/goalsApi');
      const createdGoal = await goalsApi.createGoal({
        text: goalText,
        type: type,
        aiSuggested: true
      });

      // Update local state
      setGoals(prev => ({
        ...prev,
        [type]: [...prev[type], {
          id: createdGoal.id,
          text: createdGoal.title,
          createdAt: new Date(createdGoal.created_at),
          aiSuggested: createdGoal.ai_suggested
        }]
      }));
    } catch (error) {
      console.error('Error adding suggested goal:', error);
      // Fallback to local state only
      setGoals(prev => ({
        ...prev,
        [type]: [...prev[type], {
          id: Date.now(),
          text: goalText,
          createdAt: new Date(),
          aiSuggested: true
        }]
      }));
    }
  };

  const resetAiAssistant = () => {
    setAiAssistantStep(0);
    setAiAssistantData({
      context: '',
      goals: '',
      timeframe: '',
      experience: '',
      challenges: ''
    });
    setAiSuggestions(null);
    setAiAssistantOpen(false);
  };

  const getTypeConfig = (type) => {
    const configs = {
      short: {
        title: 'Objetivos de Curto Prazo',
        subtitle: '0-3 meses',
        color: '#10b981',
        icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
        description: 'Metas que você pode alcançar nos próximos 3 meses'
      },
      medium: {
        title: 'Objetivos de Médio Prazo',
        subtitle: '3-12 meses',
        color: '#f59e0b',
        icon: <CalendarTodayIcon sx={{ fontSize: 28 }} />,
        description: 'Objetivos que requerem planejamento e constância ao longo do ano'
      },
      long: {
        title: 'Objetivos de Longo Prazo',
        subtitle: '1+ anos',
        color: '#a855f7',
        icon: <DateRangeIcon sx={{ fontSize: 28 }} />,
        description: 'Visões de futuro e grandes aspirações que guiam suas decisões'
      }
    };
    return configs[type];
  };

  const assistantSteps = [
    'Contexto Pessoal',
    'Objetivos Desejados',
    'Prazo Esperado',
    'Experiência Atual',
    'Desafios Esperados'
  ];

  return (
    <ProtectedRoute>
      <div>
        <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Defina Seus Objetivos
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
          >
            Estabeleça metas claras para orientar suas atividades.
            Objetivos bem definidos ajudam a identificar sinais de progresso.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TargetIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Adicionar Manualmente
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Descreva seu objetivo"
                    multiline
                    rows={3}
                    value={newGoal.text}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Ex: Aprender React Native, Aumentar vendas em 20%, Abrir minha empresa..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'background.default'
                      }
                    }}
                  />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Prazo para alcançar
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {['short', 'medium', 'long'].map((type) => {
                        const config = getTypeConfig(type);
                        return (
                          <Chip
                            key={type}
                            label={config.subtitle}
                            onClick={() => setNewGoal(prev => ({ ...prev, type }))}
                            variant={newGoal.type === type ? 'filled' : 'outlined'}
                            sx={{
                              backgroundColor: newGoal.type === type ? config.color : 'transparent',
                              borderColor: config.color,
                              color: newGoal.type === type ? 'white' : config.color,
                              '&:hover': {
                                backgroundColor: newGoal.type === type ? config.color : `${config.color}20`
                              }
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddGoal}
                    disabled={!newGoal.text.trim()}
                    startIcon={<AddIcon />}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                      }
                    }}
                  >
                    Adicionar Objetivo
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ backgroundColor: 'background.paper', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PsychologyIcon sx={{ fontSize: 32, color: '#10b981', mr: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Assistente IA
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                  Deixe nossa IA ajudar você a definir objetivos realistas e alcançáveis baseados no seu perfil, experiência e contexto pessoal.
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', mb: 1 }}>
                      ✨ O que a IA pode fazer:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • Analisar viabilidade dos seus objetivos<br/>
                      • Sugerir prazos realistas<br/>
                      • Identificar etapas intermediárias<br/>
                      • Recomendar recursos necessários
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setAiAssistantOpen(true)}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{
                      py: 1.5,
                      borderColor: '#10b981',
                      color: '#10b981',
                      '&:hover': {
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: '#10b981'
                      }
                    }}
                  >
                    Usar Assistente IA
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {['short', 'medium', 'long'].map((type) => {
            const config = getTypeConfig(type);
            const typeGoals = goals[type];

            return (
              <Grid size={{ xs: 12, md: 4 }} key={type}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: 'background.paper',
                    borderTop: `4px solid ${config.color}`
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: `${config.color}20`,
                          color: config.color,
                          mr: 2
                        }}
                      >
                        {config.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {config.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {config.subtitle}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {config.description}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {typeGoals.length > 0 ? (
                      <Box>
                        {typeGoals.map((goal) => (
                           <Accordion key={goal.id} sx={{ backgroundImage: 'none', boxShadow: 'none', '&:before': { display: 'none' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ flex: 1, minWidth: 0 }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  {goal.aiSuggested ? (
                                    <AutoAwesomeIcon sx={{ fontSize: 16, color: config.color, mr: 1 }} />
                                  ) : (
                                    <FlagIcon sx={{ fontSize: 16, color: config.color, mr: 1 }} />
                                  )}
                                  <ListItemText primary={goal.text} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                                </Box>
                              </AccordionSummary>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleOpenCriticalPathWizard({ ...goal, goal_type: type, title: goal.text }); }}
                                sx={{ ml: 0.5 }}
                                title="Criar rota crítica"
                              >
                                <RouteIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); handleDeleteGoal(type, goal.id); }}
                                sx={{ ml: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <AccordionDetails>
                              <FrameworkManager goal={goal} />
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    ) : (
                      <Alert
                        severity="info"
                        variant="outlined"
                        sx={{
                          backgroundColor: 'transparent',
                          borderColor: `${config.color}40`,
                          color: 'text.secondary'
                        }}
                      >
                        Nenhum objetivo definido ainda.
                        <br />
                        <Typography variant="caption">
                          Adicione objetivos para esta categoria acima.
                        </Typography>
                      </Alert>
                    )}

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Chip
                        label={`${typeGoals.length} objetivo${typeGoals.length !== 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: config.color,
                          color: config.color
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Alert
            severity="success"
            variant="outlined"
            sx={{
              backgroundColor: 'transparent',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              💡 <strong>Dica:</strong> Use estes objetivos para avaliar se suas atividades são sinais (te aproximam dos objetivos) ou ruídos (te afastam ou não contribuem).
            </Typography>
          </Alert>
        </Box>

        {/* Dialog do Assistente IA */}
        <Dialog
          open={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PsychologyIcon sx={{ fontSize: 28, color: '#10b981', mr: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Assistente IA para Objetivos
              </Typography>
            </Box>
            <IconButton onClick={() => setAiAssistantOpen(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            {!aiSuggestions ? (
              <Box sx={{ mt: 2 }}>
                <Stepper activeStep={aiAssistantStep} orientation="vertical">
                  <Step>
                    <StepLabel>Contexto Pessoal</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Conte um pouco sobre você, sua profissão, interesses e situação atual.
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ex: Sou desenvolvedor há 3 anos, trabalho em uma startup de e-commerce, quero expandir minhas habilidades..."
                        value={aiAssistantData.context}
                        onChange={(e) => setAiAssistantData(prev => ({ ...prev, context: e.target.value }))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default'
                          }
                        }}
                      />
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Objetivos Desejados</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Descreva o que você gostaria de alcançar ou onde quer chegar.
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ex: Quero me tornar tech lead, abrir meu próprio negócio, mudar de carreira para data science..."
                        value={aiAssistantData.goals}
                        onChange={(e) => setAiAssistantData(prev => ({ ...prev, goals: e.target.value }))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default'
                          }
                        }}
                      />
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Prazo Esperado</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Em quanto tempo você gostaria de alcançar seus objetivos?
                      </Typography>
                      <FormControl>
                        <RadioGroup
                          value={aiAssistantData.timeframe}
                          onChange={(e) => setAiAssistantData(prev => ({ ...prev, timeframe: e.target.value }))}
                        >
                          <FormControlLabel value="urgent" control={<Radio />} label="Menos de 6 meses (urgente)" />
                          <FormControlLabel value="short" control={<Radio />} label="6 meses a 1 ano" />
                          <FormControlLabel value="medium" control={<Radio />} label="1 a 3 anos" />
                          <FormControlLabel value="long" control={<Radio />} label="Mais de 3 anos (longo prazo)" />
                        </RadioGroup>
                      </FormControl>
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Experiência Atual</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Qual seu nível de experiência na área dos seus objetivos?
                      </Typography>
                      <FormControl>
                        <RadioGroup
                          value={aiAssistantData.experience}
                          onChange={(e) => setAiAssistantData(prev => ({ ...prev, experience: e.target.value }))}
                        >
                          <FormControlLabel value="beginner" control={<Radio />} label="Iniciante - Pouco ou nenhuma experiência" />
                          <FormControlLabel value="intermediate" control={<Radio />} label="Intermediário - Alguma experiência" />
                          <FormControlLabel value="advanced" control={<Radio />} label="Avançado - Muita experiência" />
                          <FormControlLabel value="expert" control={<Radio />} label="Especialista - Muito experiente" />
                        </RadioGroup>
                      </FormControl>
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Desafios Esperados</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Quais obstáculos ou limitações você prevê?
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ex: Tempo limitado, orçamento restrito, falta de conhecimento técnico, concorrência no mercado..."
                        value={aiAssistantData.challenges}
                        onChange={(e) => setAiAssistantData(prev => ({ ...prev, challenges: e.target.value }))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.default'
                          }
                        }}
                      />
                    </StepContent>
                  </Step>
                </Stepper>

                {loadingSuggestions && (
                  <GoalAnalysisLoading phase={Math.ceil(loadingProgress / 25)} />
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                  🎯 Sugestões Personalizadas
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Análise:</strong> {aiSuggestions.insights}
                  </Typography>
                </Alert>

                <Alert severity="success" sx={{ mb: 4 }}>
                  <Typography variant="body2">
                    <strong>Cronograma Sugerido:</strong> {aiSuggestions.timeline}
                  </Typography>
                </Alert>

                <Stack spacing={4}>
                  {[
                    { type: 'short', title: 'Curto Prazo (0-3 meses)', goals: aiSuggestions.shortTerm, color: '#10b981' },
                    { type: 'medium', title: 'Médio Prazo (3-12 meses)', goals: aiSuggestions.mediumTerm, color: '#f59e0b' },
                    { type: 'long', title: 'Longo Prazo (1+ anos)', goals: aiSuggestions.longTerm, color: '#a855f7' }
                  ].map(({ type, title, goals, color }) => (
                    <Paper key={type} sx={{ p: 3, backgroundColor: 'background.default' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color }}>
                        {title}
                      </Typography>
                      <List dense>
                        {goals.map((goal, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={goal}
                              sx={{
                                '& .MuiTypography-root': {
                                  fontSize: '0.875rem'
                                }
                              }}
                            />
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => addSuggestedGoal(goal, type)}
                              sx={{ ml: 2, color }}
                            >
                              Adicionar
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            {!aiSuggestions ? (
              <>
                <Button onClick={() => setAiAssistantOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAiAssistantNext}
                  variant="contained"
                  disabled={loadingSuggestions || (
                    aiAssistantStep === 0 && !aiAssistantData.context ||
                    aiAssistantStep === 1 && !aiAssistantData.goals ||
                    aiAssistantStep === 2 && !aiAssistantData.timeframe ||
                    aiAssistantStep === 3 && !aiAssistantData.experience ||
                    aiAssistantStep === 4 && !aiAssistantData.challenges
                  )}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    }
                  }}
                >
                  {aiAssistantStep === 4 ? 'Gerar Sugestões' : 'Próximo'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={resetAiAssistant}>
                  Nova Análise
                </Button>
                <Button
                  onClick={() => setAiAssistantOpen(false)}
                  variant="contained"
                >
                  Concluir
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Critical Path Wizard */}
        <CriticalPathWizard
          open={criticalPathWizardOpen}
          onClose={() => setCriticalPathWizardOpen(false)}
          goal={selectedGoalForPath}
          onSave={handleSaveCriticalPath}
        />
      </Container>
    </div>
    </ProtectedRoute>
  );
}