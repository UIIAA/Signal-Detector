import React from 'react';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { Container, Typography, Grid, Card, CardContent, Button, Box } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import InsightsIcon from '@mui/icons-material/Insights';
import TuneIcon from '@mui/icons-material/Tune';

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
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              color: '#1D1D1F',
              mb: 2
            }}
          >
            Rastreador de Sinal vs. Ruido
          </Typography>
          <Typography
            variant="h6"
            paragraph
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: '1.1rem',
              color: '#86868B'
            }}
          >
            Diferencie o que importa do que apenas distrai. Foque no progresso real.
            Use IA para classificar suas atividades e otimizar sua produtividade.
          </Typography>
        </Box>

        {/* Secoes principais */}
        <Box sx={{ my: 8 }}>

          {/* 1. Definir Objetivos */}
          <Card sx={{ mb: 4 }}>
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
                    backgroundColor: '#1D1D1F',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                >
                  1
                </Box>
                Defina Seus Objetivos Principais
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, ml: 7, color: '#86868B' }}>
                Estabeleca metas claras de curto, medio e longo prazo. Objetivos bem definidos ajudam a identificar sinais de progresso real.
              </Typography>
              <Box sx={{ ml: 7 }}>
                <Button
                  variant="contained"
                  href="/goals"
                  size="large"
                  sx={{ backgroundColor: '#FF3B30', '&:hover': { backgroundColor: '#C4291F' } }}
                >
                  Definir Objetivos
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 2. Analise Seu Progresso */}
          <Card sx={{ mb: 4 }}>
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
                    backgroundColor: '#1D1D1F',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                >
                  2
                </Box>
                Analise Seu Progresso
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, ml: 7, color: '#86868B' }}>
                Visualize metricas de produtividade, graficos de progresso e receba insights personalizados da IA.
              </Typography>
              <Box sx={{ ml: 7 }}>
                <Button
                  variant="contained"
                  href="/dashboard"
                  size="large"
                  startIcon={<InsightsIcon />}
                  sx={{ backgroundColor: '#FF3B30', '&:hover': { backgroundColor: '#C4291F' } }}
                >
                  Ver Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 3. Otimize */}
          <Card sx={{ mb: 4 }}>
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
                    backgroundColor: '#1D1D1F',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3,
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                >
                  3
                </Box>
                Otimize Sua Rotina
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, ml: 7, color: '#86868B' }}>
                Acompanhe habitos, defina rotas criticas e use o Kanban para organizar suas tarefas com classificacao de sinal e ruido.
              </Typography>
              <Box sx={{ ml: 7, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  href="/habits"
                  size="large"
                  sx={{ backgroundColor: '#FF3B30', '&:hover': { backgroundColor: '#C4291F' } }}
                >
                  Habitos
                </Button>
                <Button
                  variant="outlined"
                  href="/kanban"
                  size="large"
                  sx={{ borderColor: '#1D1D1F', color: '#1D1D1F' }}
                >
                  Kanban
                </Button>
              </Box>
            </CardContent>
          </Card>

        </Box>

        <Box sx={{
          my: 8,
          py: 6,
          backgroundColor: '#FFFFFF',
          borderRadius: 3,
          border: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              textAlign: 'center',
              fontWeight: 600,
              mb: 2,
              color: '#1D1D1F'
            }}
          >
            Como funciona?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#86868B',
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
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}>
                  <FlagIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#1D1D1F' }}>
                  Objetivos
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#86868B' }}>
                  Defina objetivos claros de curto, medio e longo prazo para orientar suas atividades diarias.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}>
                  <InsightsIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#1D1D1F' }}>
                  Analise
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#86868B' }}>
                  Nossa IA classifica suas atividades como Sinais produtivos ou Ruidos desnecessarios automaticamente.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#1D1D1F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}>
                  <TuneIcon sx={{ color: 'white', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#1D1D1F' }}>
                  Otimize
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#86868B' }}>
                  Receba insights personalizados e estrategias inteligentes para maximizar sua produtividade.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 10, mb: 4 }}>
          <Typography variant="body2" sx={{ color: '#86868B' }}>
            Construido para focar no que realmente importa.
          </Typography>
        </Box>
      </Container>
    </div>
    </ProtectedRoute>
  );
}
