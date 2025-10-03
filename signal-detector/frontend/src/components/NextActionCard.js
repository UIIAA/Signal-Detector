import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Schedule,
  Refresh,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Lightbulb
} from '@mui/icons-material';

/**
 * NextActionCard.js
 *
 * Card do Coach IA que analisa contexto do usuário e recomenda
 * a melhor próxima ação baseada em objetivos, atividades recentes e momento do dia.
 */
export default function NextActionCard({ userId, onStartAction }) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchRecommendation();
    }
  }, [userId]);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coach/next-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar recomendação');
      }

      const data = await response.json();
      setRecommendation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAction = () => {
    if (onStartAction && recommendation) {
      onStartAction({
        title: recommendation.action,
        description: recommendation.description,
        goalId: recommendation.goalId,
        estimatedDuration: recommendation.estimatedDuration,
        estimatedImpact: recommendation.estimatedImpact,
        estimatedEffort: recommendation.estimatedEffort
      });
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getEfficiencyScore = () => {
    if (!recommendation) return 0;
    const { estimatedImpact, estimatedEffort, estimatedDuration } = recommendation;
    const hours = estimatedDuration / 60;
    return ((estimatedImpact * 2) / hours).toFixed(1);
  };

  return (
    <Card sx={{ bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Coach IA: Próxima Ação
            </Typography>
          </Box>
          <IconButton onClick={fetchRecommendation} disabled={loading} size="small">
            <Refresh />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !recommendation ? (
          <Alert severity="info">
            Clique em atualizar para receber uma recomendação personalizada.
          </Alert>
        ) : (
          <>
            {/* Ação Recomendada */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {recommendation.action}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                {recommendation.description}
              </Typography>

              {/* Chips de métricas */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={<Schedule />}
                  label={`${recommendation.estimatedDuration}min`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<TrendingUp />}
                  label={`Impacto: ${recommendation.estimatedImpact}/10`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`Esforço: ${recommendation.estimatedEffort}/10`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Eficiência: ${getEfficiencyScore()}`}
                  size="small"
                  sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
                />
                <Chip
                  label={recommendation.urgencyLevel === 'high' ? 'Urgente' : recommendation.urgencyLevel === 'medium' ? 'Médio' : 'Baixo'}
                  size="small"
                  color={getUrgencyColor(recommendation.urgencyLevel)}
                />
              </Box>

              {/* Objetivo relacionado */}
              {recommendation.goalTitle && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Objetivo:</strong> {recommendation.goalTitle}
                  </Typography>
                </Alert>
              )}

              {/* Reasoning */}
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <Lightbulb sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Por que agora?
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {recommendation.reasoning}
                </Typography>
              </Box>

              {/* Botão de ação */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PlayArrow />}
                onClick={handleStartAction}
                sx={{ mb: 1 }}
              >
                Começar Agora
              </Button>
            </Box>

            {/* Alternativas (expandível) */}
            {recommendation.alternativeActions && recommendation.alternativeActions.length > 0 && (
              <>
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{ mb: 1 }}
                >
                  {expanded ? 'Ocultar' : 'Ver'} alternativas ({recommendation.alternativeActions.length})
                </Button>

                <Collapse in={expanded}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Outras Opções
                  </Typography>
                  <List dense>
                    {recommendation.alternativeActions.map((alt, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText
                          primary={alt.action}
                          secondary={
                            <Box component="span">
                              {alt.duration}min • Impacto: {alt.impact}/10 • Esforço: {alt.effort}/10
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {/* Metadados */}
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                {recommendation.source === 'rule-based' && '🤖 Gerado por regras • '}
                Analisados: {recommendation.context?.goalsAnalyzed || 0} objetivos, {recommendation.context?.activitiesAnalyzed || 0} atividades
                {recommendation.generatedAt && (
                  <> • {new Date(recommendation.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}