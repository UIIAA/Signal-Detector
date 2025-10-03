import React from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Chip, Stack } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PsychologyIcon from '@mui/icons-material/Psychology';

export default function Home() {
  return (
    <ProtectedRoute>
      <div>
        <Header />
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', my: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Rastreador de Sinal vs. Ruído
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            paragraph
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: '1.1rem'
            }}
          >
            Diferencie o que importa do que apenas distrai. Foque no progresso real.
            Use IA para classificar suas atividades e otimizar sua produtividade.
          </Typography>
        </Box>
        
        {/* Seções principais seguindo o padrão do Modelo Gemini */}
        <Box sx={{ my: 8, space: 6 }}>

          {/* 1. Definir Objetivos */}
          <Card sx={{ mb: 6, backgroundColor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#60a5fa',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700
                  }}
                >
                  1
                </Box>
                Defina Seus Objetivos Principais
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, ml: 7 }}>
                Estabeleça metas claras de curto, médio e longo prazo. Objetivos bem definidos ajudam a identificar sinais de progresso real.
              </Typography>
              <Box sx={{ ml: 7 }}>
                <Button
                  variant="contained"
                  href="/goals"
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                    }
                  }}
                >
                  Definir Objetivos
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 2. Registrar Atividades */}
          <Card sx={{ mb: 6, backgroundColor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#a855f7',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700
                  }}
                >
                  2
                </Box>
                Registre Suas Atividades
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, ml: 7 }}>
                Documente suas atividades usando voz ou texto. Nossa IA analisa e classifica automaticamente como sinais ou ruídos.
              </Typography>

              <Grid container spacing={3} sx={{ ml: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: 'background.default', border: '1px solid #374151' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <MicIcon sx={{ fontSize: 24, color: '#10b981', mr: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Por Voz
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Grave suas atividades e deixe a IA transcrever e analisar automaticamente os níveis de energia.
                      </Typography>
                      <Button
                        variant="outlined"
                        href="/record"
                        sx={{
                          borderColor: '#10b981',
                          color: '#10b981',
                          '&:hover': {
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderColor: '#10b981'
                          }
                        }}
                      >
                        Gravar Áudio
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ backgroundColor: 'background.default', border: '1px solid #374151' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TextSnippetIcon sx={{ fontSize: 24, color: '#f59e0b', mr: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Por Texto
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Digite suas atividades e forneça informações de contexto para uma classificação mais precisa.
                      </Typography>
                      <Button
                        variant="outlined"
                        href="/text-entry"
                        sx={{
                          borderColor: '#f59e0b',
                          color: '#f59e0b',
                          '&:hover': {
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderColor: '#f59e0b'
                          }
                        }}
                      >
                        Registrar Texto
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 3. Analisar Progresso */}
          <Card sx={{ mb: 6, backgroundColor: 'background.paper' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700
                  }}
                >
                  3
                </Box>
                Analise Seu Progresso
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, ml: 7 }}>
                Visualize métricas de produtividade, gráficos de progresso e receba insights personalizados da IA.
              </Typography>
              <Box sx={{ ml: 7 }}>
                <Button
                  variant="contained"
                  href="/dashboard"
                  size="large"
                  startIcon={<InsightsIcon />}
                  sx={{
                    backgroundColor: '#f59e0b',
                    '&:hover': {
                      backgroundColor: '#d97706'
                    }
                  }}
                >
                  Ver Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>

        </Box>
        
        <Box sx={{
          my: 8,
          py: 6,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 140, 248, 0.05) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(99, 102, 241, 0.08)'
        }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}
          >
            Como funciona?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: 6,
              maxWidth: '500px',
              mx: 'auto'
            }}
          >
            Processo simples e inteligente em 3 etapas para transformar sua produtividade
          </Typography>

          <Grid container spacing={6} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    1
                  </Typography>
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Registre
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Use o recurso de voz ou digite manualmente para registrar suas atividades diárias de forma rápida e intuitiva.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    2
                  </Typography>
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Classifique
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Nossa IA avançada classifica automaticamente suas atividades como Sinais produtivos ou Ruídos desnecessários.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    3
                  </Typography>
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Otimize
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Receba insights personalizados e estratégias inteligentes para maximizar sua produtividade e alcançar seus objetivos.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Footer inspirado no Modelo Gemini */}
        <Box sx={{ textAlign: 'center', mt: 10, mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Construído para focar no que realmente importa.
          </Typography>
        </Box>
      </Container>
    </div>
    </ProtectedRoute>
  );
}
