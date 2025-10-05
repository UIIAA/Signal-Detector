import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

export default function RecommendedTemplates({ userId, limit = 5 }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [userId]);

  const loadTemplates = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/activities/templates');
      if (response.ok) {
        const data = await response.json();
        // Ordenar por leverage_score e pegar os top N
        const sortedTemplates = data.templates
          .sort((a, b) => parseFloat(b.leverage_score) - parseFloat(a.leverage_score))
          .slice(0, limit);
        setTemplates(sortedTemplates);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Career': '#3b82f6',
      'Learning': '#8b5cf6',
      'Health': '#10b981',
      'Relationships': '#ec4899',
      'Finance': '#f59e0b',
      'Personal Growth': '#06b6d4',
      'Side Project': '#6366f1'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUpIcon sx={{ color: '#10b981', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Templates de Alta Alavancagem
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Atividades comprovadamente eficientes para você começar
        </Typography>

        <List dense>
          {templates.map((template) => (
            <ListItem
              key={template.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                      {template.title}
                    </Typography>
                    <Chip
                      label={`${parseFloat(template.leverage_score).toFixed(1)}`}
                      size="small"
                      sx={{
                        ml: 1,
                        backgroundColor: '#10b98120',
                        color: '#10b981',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={template.category}
                        size="small"
                        sx={{
                          backgroundColor: `${getCategoryColor(template.category)}20`,
                          color: getCategoryColor(template.category),
                          fontSize: '0.65rem',
                          height: 18
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Impacto: {template.impact_estimate}/10 • Esforço: {template.effort_estimate}/10 • {template.duration_estimate}min
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <IconButton
                size="small"
                sx={{
                  ml: 1,
                  color: '#10b981',
                  '&:hover': { backgroundColor: '#10b98120' }
                }}
                title="Usar este template"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Total de {templates.length} templates recomendados
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
