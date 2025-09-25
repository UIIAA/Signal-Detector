import React, { useState } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Edit,
  Flag,
  TrendingUp,
  Celebration
} from '@mui/icons-material';

const ProgressUpdateDialog = ({ open, goal, onClose, onUpdate, loading }) => {
  const [progress, setProgress] = useState(goal?.progress_percentage || 0);

  const handleUpdate = () => {
    onUpdate(goal.id, progress);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Atualizar Progresso - {goal?.title}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progresso atual: {goal?.progress_percentage || 0}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Novo progresso: {progress}%
          </Typography>
        </Box>

        <Slider
          value={progress}
          onChange={(_, value) => setProgress(value)}
          valueLabelDisplay="on"
          min={0}
          max={100}
          step={5}
          marks={[
            { value: 0, label: '0%' },
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 75, label: '75%' },
            { value: 100, label: '100%' }
          ]}
          sx={{ mb: 2 }}
        />

        {progress >= 100 && (
          <Alert severity="success" icon={<Celebration />}>
            Parabéns! Você está prestes a concluir este objetivo! 🎉
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProgressTracker = ({
  goals = [],
  onUpdateProgress,
  onMarkComplete,
  loading = false
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'success';
    if (progress >= 70) return 'warning';
    return 'primary';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'short': return <Flag sx={{ fontSize: 16 }} />;
      case 'medium': return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'long': return <Flag sx={{ fontSize: 16 }} />;
      default: return <Flag sx={{ fontSize: 16 }} />;
    }
  };

  const handleOpenUpdateDialog = (goal) => {
    setSelectedGoal(goal);
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedGoal(null);
  };

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progresso dos Objetivos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nenhum objetivo ativo encontrado. Crie alguns objetivos para começar a acompanhar seu progresso!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Progresso dos Objetivos
          </Typography>
          <Chip
            label={`${goals.filter(g => g.is_completed).length}/${goals.length} concluídos`}
            color="primary"
            size="small"
          />
        </Box>

        {goals.map((goal) => {
          const isNearCompletion = goal.progress_percentage >= 90;
          const isCompleted = goal.is_completed;
          const progressColor = getProgressColor(goal.progress_percentage);

          return (
            <Box key={goal.id} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  {getTypeIcon(goal.goal_type)}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      ml: 1,
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      color: isCompleted ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {goal.title}
                  </Typography>
                  {isCompleted && (
                    <Chip
                      label="Concluído"
                      color="success"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1, minWidth: '40px' }}
                  >
                    {goal.progress_percentage}%
                  </Typography>

                  {!isCompleted && (
                    <>
                      {isNearCompletion && (
                        <Tooltip title="Marcar como concluído">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onMarkComplete && onMarkComplete(goal.id)}
                            disabled={loading}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Atualizar progresso">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUpdateDialog(goal)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={goal.progress_percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: `${progressColor}.main`,
                    borderRadius: 4
                  }
                }}
              />

              {goal.goal_type && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {goal.goal_type === 'short' ? 'Curto Prazo' :
                   goal.goal_type === 'medium' ? 'Médio Prazo' : 'Longo Prazo'}
                </Typography>
              )}
            </Box>
          );
        })}

        <ProgressUpdateDialog
          open={updateDialogOpen}
          goal={selectedGoal}
          onClose={handleCloseUpdateDialog}
          onUpdate={onUpdateProgress}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;