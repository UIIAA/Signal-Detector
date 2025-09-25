import React from 'react';
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  OpenInNew,
  TrendingUp,
  TrendingDown,
  Remove,
  AccessTime
} from '@mui/icons-material';

const RecentActivities = ({
  activities = [],
  onActivityClick,
  loading = false,
  title = "Atividades Recentes"
}) => {
  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'SINAL': return 'success';
      case 'RUÍDO': return 'error';
      case 'NEUTRO': return 'warning';
      default: return 'default';
    }
  };

  const getClassificationIcon = (classification) => {
    switch (classification) {
      case 'SINAL': return <TrendingUp fontSize="small" />;
      case 'RUÍDO': return <TrendingDown fontSize="small" />;
      case 'NEUTRO': return <Remove fontSize="small" />;
      default: return <Remove fontSize="small" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Carregando atividades...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nenhuma atividade registrada ainda. Comece adicionando suas primeiras atividades!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {title}
          </Typography>
          <Chip
            label={`${activities.length} atividades`}
            size="small"
            color="primary"
          />
        </Box>

        <List sx={{ p: 0 }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem
                sx={{
                  px: 0,
                  py: 1.5,
                  cursor: onActivityClick ? 'pointer' : 'default',
                  '&:hover': onActivityClick ? {
                    backgroundColor: 'action.hover',
                    borderRadius: 1
                  } : {}
                }}
                onClick={() => onActivityClick && onActivityClick(activity.id)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          mr: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {activity.description}
                      </Typography>
                      {onActivityClick && (
                        <Tooltip title="Ver detalhes">
                          <IconButton size="small" sx={{ ml: 1 }}>
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        <Chip
                          label={`${activity.classification} (${activity.score}/100)`}
                          color={getClassificationColor(activity.classification)}
                          size="small"
                          icon={getClassificationIcon(activity.classification)}
                        />

                        {activity.duration && (
                          <Chip
                            label={`${activity.duration}min`}
                            size="small"
                            variant="outlined"
                            icon={<AccessTime fontSize="small" />}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          {activity.connectedGoals && activity.connectedGoals.length > 0 ? (
                            <Typography variant="caption" color="success.main">
                              🎯 {activity.connectedGoals.length} objetivo(s) impactado(s)
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sem objetivos conectados
                            </Typography>
                          )}
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(activity.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {activities.length >= 10 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando as {activities.length} atividades mais recentes
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivities;