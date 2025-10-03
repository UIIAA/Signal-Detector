import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Checkbox,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Flag,
  Edit,
  Delete,
  Add
} from '@mui/icons-material';

/**
 * IdealPathTimeline.js
 *
 * Timeline visual da rota crítica com atividades ordenadas.
 * Permite marcar atividades como concluídas e visualizar progresso.
 */
export default function IdealPathTimeline({
  idealPath,
  onActivityComplete,
  onEdit,
  onDelete,
  editable = false
}) {
  const [completedActivities, setCompletedActivities] = useState(
    idealPath?.activities?.filter(a => a.status === 'completed').map(a => a.id) || []
  );

  if (!idealPath || !idealPath.activities || idealPath.activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Nenhuma rota crítica definida. Use o wizard para criar uma.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleActivityToggle = (activityId) => {
    setCompletedActivities(prev => {
      const newCompleted = prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId];

      if (onActivityComplete) {
        const activity = idealPath.activities.find(a => a.id === activityId);
        onActivityComplete(activity, !prev.includes(activityId));
      }

      return newCompleted;
    });
  };

  const completionPercentage = (completedActivities.length / idealPath.activities.length) * 100;

  const getActivityStatus = (activity) => {
    const isCompleted = completedActivities.includes(activity.id);
    const deadline = new Date(activity.deadline);
    const today = new Date();
    const isOverdue = deadline < today && !isCompleted;

    return { isCompleted, isOverdue };
  };

  const getLeverageColor = (impact, effort) => {
    const score = (impact / effort) * 10;
    if (score >= 30) return '#10b981';
    if (score >= 20) return '#3b82f6';
    if (score >= 10) return '#f59e0b';
    return '#ef4444';
  };

  // Ordenar atividades por order
  const sortedActivities = [...idealPath.activities].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Rota Crítica - Timeline
          </Typography>
          {editable && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={onEdit}
              >
                Editar
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<Delete />}
                onClick={onDelete}
              >
                Remover
              </Button>
            </Box>
          )}
        </Box>

        {/* Barra de progresso geral */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progresso Geral
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completedActivities.length} / {idealPath.activities.length} concluídas
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: completionPercentage === 100 ? 'success.main' : 'primary.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {completionPercentage.toFixed(0)}% completo
          </Typography>
        </Box>

        {/* Timeline */}
        <Timeline position="right">
          {sortedActivities.map((activity, index) => {
            const { isCompleted, isOverdue } = getActivityStatus(activity);

            return (
              <TimelineItem key={activity.id}>
                <TimelineOppositeContent sx={{ flex: 0.3, py: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {activity.deadline}
                  </Typography>
                  {isOverdue && (
                    <Chip
                      label="Atrasado"
                      size="small"
                      color="error"
                      sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}
                    />
                  )}
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot
                    sx={{
                      bgcolor: isCompleted
                        ? 'success.main'
                        : isOverdue
                        ? 'error.main'
                        : 'primary.main',
                      p: 0
                    }}
                  >
                    <Checkbox
                      icon={<RadioButtonUnchecked />}
                      checkedIcon={<CheckCircle />}
                      checked={isCompleted}
                      onChange={() => handleActivityToggle(activity.id)}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': { color: 'white' }
                      }}
                    />
                  </TimelineDot>
                  {index < sortedActivities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ py: 2 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      bgcolor: isCompleted ? 'success.50' : 'transparent',
                      borderColor: isOverdue ? 'error.main' : 'divider',
                      opacity: isCompleted ? 0.7 : 1
                    }}
                  >
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={activity.order}
                            size="small"
                            sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}
                          />
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{ textDecoration: isCompleted ? 'line-through' : 'none' }}
                          >
                            {activity.title}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {activity.description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Impacto: ${activity.impact}/10`}
                          size="small"
                          variant="outlined"
                          color={activity.impact >= 7 ? 'success' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={`Esforço: ${activity.effort}/10`}
                          size="small"
                          variant="outlined"
                          color={activity.effort <= 3 ? 'success' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={`${activity.estimatedDuration}min`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Tooltip title={`Alavancagem: ${((activity.impact / activity.effort) * 10).toFixed(1)}`}>
                          <Chip
                            label={`${((activity.impact / activity.effort) * 10).toFixed(1)} alavancagem`}
                            size="small"
                            sx={{
                              bgcolor: getLeverageColor(activity.impact, activity.effort),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Tooltip>
                      </Box>

                      {activity.reasoning && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            {activity.reasoning}
                          </Typography>
                        </Alert>
                      )}

                      {isCompleted && activity.completedAt && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                          <Typography variant="caption" color="success.main">
                            Concluída em {new Date(activity.completedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}

          {/* Item final */}
          <TimelineItem>
            <TimelineOppositeContent sx={{ flex: 0.3 }} />
            <TimelineSeparator>
              <TimelineDot sx={{ bgcolor: completionPercentage === 100 ? 'success.main' : 'grey.400' }}>
                <Flag />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent sx={{ py: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {completionPercentage === 100 ? '🎉 Objetivo Alcançado!' : 'Meta Final'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completionPercentage === 100
                  ? 'Parabéns! Você completou sua rota crítica.'
                  : 'Continue focando nas atividades de alta alavancagem.'}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>

        {/* Metadados */}
        {idealPath.metadata && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {idealPath.metadata.ai_generated && '🤖 Gerado por IA • '}
              Confiança: {(idealPath.metadata.confidence_score * 100).toFixed(0)}%
              {idealPath.metadata.created_at &&
                ` • Criado em ${new Date(idealPath.metadata.created_at).toLocaleDateString()}`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}