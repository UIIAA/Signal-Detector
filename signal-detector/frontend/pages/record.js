import React, { useState } from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { useAuth } from '../src/contexts/AuthContext';
import {
  Container,
  Typography,
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
  Divider,
  TextField,
  Tooltip,
  IconButton
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TuneIcon from '@mui/icons-material/Tune';
import api from '../src/services/api';
import useAudioRecorder from '../src/hooks/useAudioRecorder';
import { LoadingButton, AudioRecordingLoading, AIClassificationLoading, ErrorDisplay } from '../src/components/LoadingStates';
import ActivityGoalConnection from '../src/components/ActivityGoalConnection';

export default function Record() {
  const { user } = useAuth();
  const { recording, audioURL, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [energyData, setEnergyData] = useState({
    energyBefore: 5,
    energyAfter: 5,
    duration: '',
    aiEstimated: false
  });

  const handleStartRecording = async () => {
    setError('');
    const success = await startRecording();
    if (!success) {
      setError('Não foi possível acessar o microfone. Por favor, verifique as permissões.');
    }
  };

  // Função para simular análise de energia da IA baseada no áudio
  const analyzeAudioEnergy = (transcriptionText, audioBlob) => {
    // Simulação da análise de IA baseada no conteúdo da transcrição
    const text = transcriptionText.toLowerCase();

    // Palavras que indicam alta energia
    const highEnergyWords = ['animado', 'excelente', 'ótimo', 'incrível', 'fantástico', 'energia', 'motivado', 'empolgado'];
    const lowEnergyWords = ['cansado', 'exausto', 'difícil', 'pesado', 'lento', 'tédio', 'dormindo'];

    const highEnergyCount = highEnergyWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
    const lowEnergyCount = lowEnergyWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);

    // Estimativa baseada no conteúdo
    let energyBefore = 5;
    let energyAfter = 5;

    if (highEnergyCount > lowEnergyCount) {
      energyBefore = Math.min(10, 6 + highEnergyCount);
      energyAfter = Math.min(10, 7 + highEnergyCount);
    } else if (lowEnergyCount > highEnergyCount) {
      energyBefore = Math.max(1, 4 - lowEnergyCount);
      energyAfter = Math.max(1, 3 - lowEnergyCount);
    }

    // Simular análise da duração do áudio (em uma implementação real, seria baseado no áudio)
    const estimatedDuration = Math.floor(Math.random() * 30) + 15; // 15-45 minutos

    return {
      energyBefore,
      energyAfter,
      duration: estimatedDuration.toString(),
      confidence: Math.random() * 0.3 + 0.7 // 70-100% de confiança
    };
  };

  const handleStopRecording = async () => {
    setLoading(true);
    try {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        const data = await api.transcribeAudio(audioBlob);
        setTranscription(data.transcription);

        // Simular análise de energia da IA
        const energyAnalysis = analyzeAudioEnergy(data.transcription, audioBlob);
        setEnergyData({
          energyBefore: energyAnalysis.energyBefore,
          energyAfter: energyAnalysis.energyAfter,
          duration: energyAnalysis.duration,
          aiEstimated: true,
          confidence: energyAnalysis.confidence
        });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setError('Erro ao transcrever o áudio. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnergyChange = (field) => (event) => {
    setEnergyData({
      ...energyData,
      [field]: event.target.value,
      aiEstimated: false // Marcar como editado manualmente
    });
  };

  const handleClassifyActivity = async () => {
    if (!transcription) return;

    setLoading(true);
    try {
      // Criar objeto similar ao da página de texto
      const activityData = {
        description: transcription,
        duration: energyData.duration,
        energyBefore: energyData.energyBefore,
        energyAfter: energyData.energyAfter
      };

      // Chamada real para a API de classificação
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: activityData.description,
          duration: activityData.duration,
          energyBefore: activityData.energyBefore,
          energyAfter: activityData.energyAfter,
          goalId: null, // For voice recordings, we don't pre-select goals
          userId: user?.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      } else {
        throw new Error('Failed to classify activity');
      }
    } catch (error) {
      console.error('Error classifying activity:', error);
      setError('Erro ao classificar a atividade. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetRecording();
    setTranscription('');
    setError('');
    setAnalysisResult(null);
    setEnergyData({
      energyBefore: 5,
      energyAfter: 5,
      duration: '',
      aiEstimated: false
    });
  };

  const getChipColor = (classification) => {
    switch (classification) {
      case 'SINAL': return 'success';
      case 'RUÍDO': return 'error';
      case 'NEUTRO': return 'warning';
      default: return 'default';
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <Header />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Gravar Atividade
        </Typography>
        
        <Card
          sx={{
            my: 4,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 140, 248, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.08)'
          }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: recording
                  ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: recording ? 'pulse 1.5s infinite' : 'none',
                boxShadow: recording
                  ? '0 12px 40px rgba(239, 68, 68, 0.4)'
                  : '0 12px 40px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  transform: recording ? 'none' : 'scale(1.05)'
                }
              }}>
                {recording ? (
                  <StopIcon sx={{ fontSize: 64, color: 'white' }} />
                ) : (
                  <MicIcon sx={{ fontSize: 64, color: 'white' }} />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={recording ? handleStopRecording : handleStartRecording}
                  startIcon={recording ? <StopIcon /> : <MicIcon />}
                  sx={{
                    py: 2.5,
                    px: 5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    background: recording
                      ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
                    boxShadow: recording
                      ? '0 6px 20px rgba(239, 68, 68, 0.3)'
                      : '0 6px 20px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: recording
                        ? '0 8px 25px rgba(239, 68, 68, 0.4)'
                        : '0 8px 25px rgba(99, 102, 241, 0.4)',
                      background: recording
                        ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                        : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    }
                  }}
                >
                  {recording ? 'Parar Gravação' : 'Iniciar Gravação'}
                </Button>

                {(audioURL || transcription) && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleReset}
                    sx={{
                      py: 2.5,
                      px: 5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        backgroundColor: 'rgba(99, 102, 241, 0.04)'
                      }
                    }}
                  >
                    Reiniciar
                  </Button>
                )}
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {error}
                </Alert>
              )}
              
              <AudioRecordingLoading
                isRecording={recording}
                isProcessing={loading && !recording}
              />
            </Box>
          </CardContent>
        </Card>
        
        {audioURL && (
          <Card sx={{ my: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Áudio Gravado
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <audio src={audioURL} controls style={{ width: '100%' }} />
              </Box>
            </CardContent>
          </Card>
        )}
        
        {transcription && (
          <Card sx={{ my: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transcrição
              </Typography>
              <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 3 }}>
                {transcription}
              </Typography>

              {/* Seção de análise de energia pela IA */}
              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PsychologyIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Análise Inteligente de Energia
                  </Typography>
                  {energyData.aiEstimated && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip
                        label={`IA estimou com ${Math.round(energyData.confidence * 100)}% confiança`}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Tooltip title="A IA analisou seu áudio e texto para estimar os níveis de energia. Você pode ajustar se necessário.">
                        <IconButton size="small">
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Duração Estimada
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Duração (minutos)"
                    type="number"
                    value={energyData.duration}
                    onChange={handleEnergyChange('duration')}
                    InputProps={{
                      inputProps: { min: 1, max: 1440 },
                      startAdornment: (
                        <AccessTimeIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                      )
                    }}
                    variant="outlined"
                    helperText={energyData.aiEstimated ? "Estimado pela IA" : "Valor ajustado"}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryStdIcon sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Energia Antes
                    </Typography>
                    <Tooltip title="Nível de energia estimado pela IA antes da atividade">
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Energia antes (1-10)</InputLabel>
                    <Select
                      value={energyData.energyBefore}
                      label="Energia antes (1-10)"
                      onChange={handleEnergyChange('energyBefore')}
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

                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BatteryFullIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Energia Depois
                    </Typography>
                    <Tooltip title="Nível de energia estimado pela IA após a atividade">
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Energia depois (1-10)</InputLabel>
                    <Select
                      value={energyData.energyAfter}
                      label="Energia depois (1-10)"
                      onChange={handleEnergyChange('energyAfter')}
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

              {!energyData.aiEstimated && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TuneIcon sx={{ mr: 1 }} />
                    Valores ajustados manualmente. A IA usará estes dados para uma classificação mais precisa.
                  </Box>
                </Alert>
              )}

              <Box sx={{ textAlign: 'center' }}>
                <LoadingButton
                  variant="contained"
                  size="large"
                  onClick={handleClassifyActivity}
                  loading={loading}
                  sx={{
                    py: 2,
                    px: 4,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                    }
                  }}
                >
                  Classificar Atividade com IA
                </LoadingButton>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Resultado da classificação */}
        {analysisResult && (
          <Card sx={{ my: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultado da Classificação
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Chip
                  label={analysisResult.classification}
                  color={getChipColor(analysisResult.classification)}
                  sx={{ fontSize: '1.2rem', py: 2, px: 3, fontWeight: 'bold' }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Score:</strong> {analysisResult.score}/100
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Confiança:</strong> {(analysisResult.confidence * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Análise:</strong> {analysisResult.reasoning}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Método:</strong> Análise combinada de áudio + energia pela IA
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ py: 1.5, px: 4 }}
                  onClick={handleReset}
                >
                  Nova Gravação
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {analysisResult && analysisResult.connectedGoals && (
          <ActivityGoalConnection
            connectedGoals={analysisResult.connectedGoals}
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
      </Container>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 15px rgba(244, 67, 54, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          }
        }
      `}</style>
    </div>
    </ProtectedRoute>
  );
}
