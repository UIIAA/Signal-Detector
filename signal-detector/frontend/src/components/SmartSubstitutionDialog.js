import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@mui/material';
import {
  Close,
  SwapHoriz,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  CompareArrows
} from '@mui/icons-material';

/**
 * SmartSubstitutionDialog.js
 *
 * Dialog que sugere substituições inteligentes de atividades de baixa eficiência
 * por templates ou atividades comprovadamente mais eficientes.
 */
export default function SmartSubstitutionDialog({
  open,
  onClose,
  activityDescription,
  impact,
  effort,
  duration,
  category,
  userId,
  onSubstitute
}) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [currentEfficiency, setCurrentEfficiency] = useState(0);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && activityDescription) {
      fetchAlternatives();
    }
  }, [open, activityDescription]);

  const fetchAlternatives = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations/suggest-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activityDescription,
          impact,
          effort,
          duration,
          category
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar alternativas');
      }

      const data = await response.json();

      if (!data.shouldSubstitute) {
        setError('Esta atividade já tem boa eficiência. Nenhuma substituição necessária.');
        setAlternatives([]);
      } else {
        setAlternatives(data.alternatives || []);
        setCurrentEfficiency(data.currentEfficiency);
        if (data.alternatives && data.alternatives.length > 0) {
          setSelectedAlternative(data.alternatives[0]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubstitute = () => {
    if (onSubstitute && selectedAlternative) {
      onSubstitute(selectedAlternative);
    }
    onClose();
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 15) return '#10b981';
    if (efficiency >= 10) return '#3b82f6';
    if (efficiency >= 5) return '#f59e0b';
    return '#ef4444';
  };

  const getSourceBadge = (source) => {
    if (source === 'template') {
      return <Chip label="Template verificado" size="small" color="primary" sx={{ ml: 1 }} />;
    }
    return <Chip label="Seu histórico" size="small" color="success" sx={{ ml: 1 }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareArrows sx={{ color: 'primary.main' }} />
          <Typography variant="h6">
            Substituição Inteligente
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity={alternatives.length === 0 ? 'success' : 'error'}>
            {error}
          </Alert>
        ) : alternatives.length === 0 ? (
          <Alert severity="info">
            Não foram encontradas alternativas melhores. Continue com sua atividade atual!
          </Alert>
        ) : (
          <>
            {/* Atividade atual */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'error.50', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="overline" color="error.main" fontWeight="bold">
                  Atividade Atual
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 0.5 }}>
                  {activityDescription}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  <Chip label={`Impacto: ${impact}/10`} size="small" variant="outlined" />
                  <Chip label={`Esforço: ${effort}/10`} size="small" variant="outlined" />
                  <Chip label={`${duration}min`} size="small" variant="outlined" />
                  <Chip
                    label={`Eficiência: ${currentEfficiency.toFixed(1)}`}
                    size="small"
                    sx={{
                      bgcolor: getEfficiencyColor(currentEfficiency),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <SwapHoriz sx={{ color: 'text.secondary' }} />
            </Divider>

            {/* Alternativas */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              <Lightbulb sx={{ fontSize: 20, verticalAlign: 'middle', mr: 0.5, color: 'warning.main' }} />
              Alternativas de Alta Alavancagem
            </Typography>

            <RadioGroup
              value={selectedAlternative?.title || ''}
              onChange={(e) => {
                const alt = alternatives.find(a => a.title === e.target.value);
                setSelectedAlternative(alt);
              }}
            >
              {alternatives.map((alternative, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: selectedAlternative?.title === alternative.title ? 'success.main' : 'divider',
                    bgcolor: selectedAlternative?.title === alternative.title ? 'success.50' : 'transparent',
                    '&:hover': {
                      borderColor: 'success.light',
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedAlternative(alternative)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <FormControlLabel
                          value={alternative.title}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {alternative.title}
                                {getSourceBadge(alternative.source)}
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 0 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Chip
                          label={`${alternative.efficiency.toFixed(1)} pts`}
                          size="small"
                          sx={{
                            bgcolor: getEfficiencyColor(alternative.efficiency),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                        <Chip
                          icon={<TrendingUp />}
                          label={`+${alternative.improvementPotential.toFixed(1)}`}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    </Box>

                    {alternative.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, ml: 4 }}>
                        {alternative.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 4 }}>
                      <Chip label={`Impacto: ${alternative.impact}/10`} size="small" variant="outlined" color="success" />
                      <Chip label={`Esforço: ${alternative.effort}/10`} size="small" variant="outlined" color="success" />
                      <Chip label={`${alternative.duration}min`} size="small" variant="outlined" />
                      {alternative.useCount && (
                        <Chip
                          label={`${alternative.useCount} usos`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>

                    <Alert severity="info" sx={{ mt: 1.5, ml: 4 }}>
                      <Typography variant="caption">
                        <strong>Por quê?</strong> {alternative.reasoning}
                      </Typography>
                    </Alert>

                    {selectedAlternative?.title === alternative.title && (
                      <Box sx={{ mt: 1.5, ml: 4, display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                        <CheckCircle fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">
                          Alternativa selecionada
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Importante:</strong> Essas sugestões são baseadas em dados. Avalie se fazem sentido
                para o seu contexto específico antes de substituir.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Manter atividade atual
        </Button>
        <Button
          onClick={handleSubstitute}
          variant="contained"
          color="success"
          startIcon={<SwapHoriz />}
          disabled={!selectedAlternative || loading}
        >
          Substituir por esta atividade
        </Button>
      </DialogActions>
    </Dialog>
  );
}