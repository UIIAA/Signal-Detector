import React, { useState } from 'react';
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
  AlertTitle,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Close,
  SwapHoriz,
  CheckCircle,
  Lightbulb
} from '@mui/icons-material';

/**
 * OpportunityCostAlert.js
 *
 * Componente que exibe alertas de custo de oportunidade para atividades de baixa eficiência.
 * Mostra alternativas de alta alavancagem e permite ao usuário aceitar ou dispensar a sugestão.
 */
export default function OpportunityCostAlert({
  open,
  onClose,
  currentActivity,
  opportunityCost,
  alternatives = [],
  metrics = {},
  onAccept,
  onDismiss
}) {
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const handleAccept = () => {
    if (onAccept && selectedAlternative) {
      onAccept(selectedAlternative);
    }
    onClose();
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    setTimeout(() => {
      setDismissed(false);
      onClose();
    }, 300);
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 15) return '#10b981'; // green
    if (efficiency >= 10) return '#3b82f6'; // blue
    if (efficiency >= 5) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: dismissed ? 'grey.100' : 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ color: 'warning.main' }} />
          <Typography variant="h6" component="span">
            Custo de Oportunidade Detectado
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Alerta principal */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Esta atividade tem baixa eficiência</AlertTitle>
          {currentActivity && (
            <Typography variant="body2">
              <strong>{currentActivity.description}</strong> tem eficiência de{' '}
              <strong style={{ color: getEfficiencyColor(currentActivity.efficiency) }}>
                {currentActivity.efficiency?.toFixed(1)}
              </strong>
              {' '}pontos.
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Você poderia ganhar <strong>+{opportunityCost?.toFixed(1)} pontos de impacto</strong>{' '}
            focando em alternativas de alta alavancagem.
          </Typography>
        </Alert>

        {/* Métricas */}
        {metrics && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Eficiência Atual
                </Typography>
                <Typography variant="h6" sx={{ color: getEfficiencyColor(metrics.currentEfficiency) }}>
                  {metrics.currentEfficiency?.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Melhor Alternativa
                </Typography>
                <Typography variant="h6" sx={{ color: getEfficiencyColor(metrics.bestAlternativeEfficiency) }}>
                  {metrics.bestAlternativeEfficiency?.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Gap de Eficiência
                </Typography>
                <Typography variant="h6" color="error">
                  +{metrics.efficiencyGap?.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Alternativas sugeridas */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Alternativas de Alta Alavancagem
        </Typography>

        {alternatives.map((alternative, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{
              mb: 2,
              cursor: 'pointer',
              border: selectedAlternative === alternative ? 2 : 1,
              borderColor: selectedAlternative === alternative ? 'primary.main' : 'divider',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: 'action.hover'
              }
            }}
            onClick={() => setSelectedAlternative(alternative)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {alternative.title}
                </Typography>
                <Chip
                  label={`${alternative.efficiency} pts`}
                  size="small"
                  sx={{
                    bgcolor: getEfficiencyColor(alternative.efficiency),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {alternative.reasoning}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Impacto: ${alternative.impact}/10`}
                  size="small"
                  variant="outlined"
                  color={alternative.impact >= 7 ? 'success' : 'default'}
                />
                <Chip
                  label={`Esforço: ${alternative.effort}/10`}
                  size="small"
                  variant="outlined"
                  color={alternative.effort <= 3 ? 'success' : 'default'}
                />
                <Chip
                  label={`${alternative.duration}min`}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {selectedAlternative === alternative && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <CheckCircle fontSize="small" />
                  <Typography variant="caption">
                    Alternativa selecionada
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            💡 <strong>Dica:</strong> Atividades Q1 (Alto Impacto + Baixo Esforço) são as que mais
            contribuem para seus objetivos. Priorize-as sempre que possível.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleDismiss} color="inherit">
          Continuar mesmo assim
        </Button>
        <Button
          onClick={handleAccept}
          variant="contained"
          startIcon={<SwapHoriz />}
          disabled={!selectedAlternative}
        >
          Substituir atividade
        </Button>
      </DialogActions>
    </Dialog>
  );
}