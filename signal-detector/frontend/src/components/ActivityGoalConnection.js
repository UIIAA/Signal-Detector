import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Flag,
  OpenInNew,
  Add
} from '@mui/icons-material';

const ActivityGoalConnection = ({ connectedGoals = [], onNavigateToGoal, onUpdateProgress }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'short': return 'primary';
      case 'medium': return 'secondary';
      case 'long': return 'default';
      default: return 'default';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'warning';
    return 'primary';
  };

  if (!connectedGoals || connectedGoals.length === 0) {
    return (
      <Card sx={{ mt: 3, borderLeft: 4, borderColor: 'grey.300' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Flag sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum Objetivo Conectado
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Esta atividade não foi automaticamente conectada a objetivos específicos.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3, borderLeft: 4, borderColor: 'success.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6" color="success.main">
            Objetivos Impactados
          </Typography>
          <Chip
            label={connectedGoals.length}
            size="small"
            color="success"
            sx={{ ml: 1 }}
          />
        </Box>

        <Grid container spacing={2}>
          {connectedGoals.map((goal) => (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: getProgressColor(goal.currentProgress) + '.light',
                  backgroundColor: getProgressColor(goal.currentProgress) + '.light',
                  '&:hover': {
                    backgroundColor: getProgressColor(goal.currentProgress) + '.main',
                    '& .goal-text': { color: 'white' }
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => onNavigateToGoal && onNavigateToGoal(goal.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={goal.typeName}
                        color={getTypeColor(goal.type)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        +{goal.progressContribution}% progresso
                      </Typography>
                    </Box>

                    <Typography
                      variant="body1"
                      className="goal-text"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {goal.title}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Progresso atual: {goal.currentProgress || 0}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Tooltip title="Ver objetivo">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToGoal && onNavigateToGoal(goal.id);
                        }}
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {onUpdateProgress && (
                      <Tooltip title="Atualizar progresso">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateProgress(goal.id, goal.currentProgress + goal.progressContribution);
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Atividades classificadas como SINAL são automaticamente conectadas aos seus objetivos mais relevantes.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityGoalConnection;