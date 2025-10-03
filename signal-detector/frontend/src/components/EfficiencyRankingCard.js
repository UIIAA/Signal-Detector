import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Info,
  Refresh
} from '@mui/icons-material';

/**
 * EfficiencyRankingCard.js
 *
 * Card que exibe o ranking de atividades mais eficientes do usuário.
 * Mostra top 10 atividades com maior pontuação de eficiência.
 */
export default function EfficiencyRankingCard({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchEfficiencyRanking();
    }
  }, [userId, timeframe]);

  const fetchEfficiencyRanking = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/activities/efficiency?userId=${userId}&timeframe=${timeframe}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar ranking de eficiência');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 15) return '#10b981';
    if (efficiency >= 10) return '#3b82f6';
    if (efficiency >= 5) return '#f59e0b';
    return '#ef4444';
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: 'warning.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Top Atividades Eficientes
            </Typography>
            <Tooltip title="Eficiência = (Impacto × 2) / Tempo em horas">
              <IconButton size="small">
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={timeframe}
                label="Período"
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <MenuItem value="day">Hoje</MenuItem>
                <MenuItem value="week">Semana</MenuItem>
                <MenuItem value="month">Mês</MenuItem>
                <MenuItem value="all">Tudo</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={fetchEfficiencyRanking} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && data && (
          <>
            {/* Estatísticas gerais */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Média de Eficiência
                  </Typography>
                  <Typography variant="h6" sx={{ color: getEfficiencyColor(data.stats.average) }}>
                    {data.stats.average}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Alta Eficiência
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {data.stats.highEfficiencyCount}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Analisadas
                  </Typography>
                  <Typography variant="h6">
                    {data.total}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Ranking */}
            {data.ranking.length === 0 ? (
              <Alert severity="info">
                Nenhuma atividade encontrada neste período. Registre atividades com impacto e duração.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {data.ranking.map((activity) => (
                  <Card
                    key={activity.id}
                    variant="outlined"
                    sx={{
                      bgcolor: activity.rank <= 3 ? 'warning.50' : 'transparent',
                      borderColor: activity.rank === 1 ? 'warning.main' : 'divider',
                      borderWidth: activity.rank === 1 ? 2 : 1
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: activity.rank <= 3 ? '1.5rem' : '1rem',
                              minWidth: 40
                            }}
                          >
                            {getMedalEmoji(activity.rank)}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={activity.rank <= 3 ? 'bold' : 'normal'}
                            >
                              {activity.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={`Impacto: ${activity.impact}/10`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Chip
                                label={`Esforço: ${activity.effort}/10`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Chip
                                label={`${activity.duration_minutes}min`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                          <Chip
                            label={activity.efficiency.toFixed(1)}
                            sx={{
                              bgcolor: getEfficiencyColor(activity.efficiency),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: activity.rank <= 3 ? '1rem' : '0.85rem'
                            }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {activity.classification.label}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Insights */}
            {data.stats.distribution && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Distribuição de Eficiência
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Excelente (≥15): ${data.stats.distribution.excellent}`}
                    size="small"
                    sx={{ bgcolor: '#10b981', color: 'white' }}
                  />
                  <Chip
                    label={`Boa (10-15): ${data.stats.distribution.good}`}
                    size="small"
                    sx={{ bgcolor: '#3b82f6', color: 'white' }}
                  />
                  <Chip
                    label={`Moderada (5-10): ${data.stats.distribution.moderate}`}
                    size="small"
                    sx={{ bgcolor: '#f59e0b', color: 'white' }}
                  />
                  <Chip
                    label={`Baixa (<5): ${data.stats.distribution.low}`}
                    size="small"
                    sx={{ bgcolor: '#ef4444', color: 'white' }}
                  />
                </Box>

                {data.stats.distribution.excellent >= 5 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp />
                      <Typography variant="body2">
                        Excelente! Você tem {data.stats.distribution.excellent} atividades de
                        eficiência excepcional. Continue priorizando atividades Q1.
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {data.stats.distribution.low > data.stats.distribution.excellent && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingDown />
                      <Typography variant="body2">
                        Você tem mais atividades de baixa eficiência ({data.stats.distribution.low})
                        do que de alta eficiência ({data.stats.distribution.excellent}). Revise seu
                        foco e priorize impacto.
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}