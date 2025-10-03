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
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close,
  WorkOutline,
  SchoolOutlined,
  FitnessCenterOutlined,
  FavoriteOutlined,
  AttachMoneyOutlined,
  SelfImprovementOutlined,
  CodeOutlined,
  StarOutline,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  TrendingUp
} from '@mui/icons-material';

const CATEGORY_ICONS = {
  career: <WorkOutline />,
  learning: <SchoolOutlined />,
  health: <FitnessCenterOutlined />,
  relationships: <FavoriteOutlined />,
  finance: <AttachMoneyOutlined />,
  'personal-growth': <SelfImprovementOutlined />,
  'side-project': <CodeOutlined />,
  general: <StarOutline />
};

const CATEGORY_LABELS = {
  career: 'Carreira',
  learning: 'Aprendizado',
  health: 'Saúde',
  relationships: 'Relacionamentos',
  finance: 'Finanças',
  'personal-growth': 'Crescimento Pessoal',
  'side-project': 'Projeto Pessoal',
  general: 'Geral'
};

/**
 * GoalTemplateSelector.js
 *
 * Componente para selecionar templates de objetivos pré-definidos.
 * Mostra atividades sugeridas, perguntas reflexivas e milestones.
 */
export default function GoalTemplateSelector({
  open,
  onClose,
  onSelect,
  userId
}) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/goals/templates?category=${selectedCategory}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    if (onSelect) {
      onSelect(template);
    }
    onClose();
  };

  const handleToggleExpand = (templateId) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  const getGoalTypeColor = (type) => {
    switch (type) {
      case 'short': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'long': return '#a855f7';
      default: return '#60a5fa';
    }
  };

  const getGoalTypeLabel = (type) => {
    switch (type) {
      case 'short': return 'Curto Prazo';
      case 'medium': return 'Médio Prazo';
      case 'long': return 'Longo Prazo';
      default: return 'Indefinido';
    }
  };

  const categories = ['all', 'career', 'learning', 'health', 'relationships', 'finance', 'personal-growth', 'side-project'];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: '80vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">
          <StarOutline sx={{ verticalAlign: 'middle', mr: 1 }} />
          Templates de Objetivos
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Todos" value="all" />
          {categories.slice(1).map(cat => (
            <Tab
              key={cat}
              label={CATEGORY_LABELS[cat]}
              value={cat}
              icon={CATEGORY_ICONS[cat]}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : templates.length === 0 ? (
          <Alert severity="info">
            Nenhum template encontrado nesta categoria.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {templates.map((template) => {
              const isExpanded = expandedTemplate === template.id;

              return (
                <Grid item xs={12} key={template.id}>
                  <Card variant="outlined" sx={{ '&:hover': { borderColor: 'primary.main' } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {CATEGORY_ICONS[template.category]}
                            <Typography variant="h6">
                              {template.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {template.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={getGoalTypeLabel(template.goal_type)}
                              size="small"
                              sx={{ bgcolor: getGoalTypeColor(template.goal_type), color: 'white' }}
                            />
                            <Chip
                              label={CATEGORY_LABELS[template.category]}
                              size="small"
                              variant="outlined"
                            />
                            {template.estimated_duration_weeks && (
                              <Chip
                                label={`~${template.estimated_duration_weeks} semanas`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {template.use_count > 0 && (
                              <Chip
                                label={`${template.use_count} usos`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {template.success_rate && (
                              <Chip
                                icon={<TrendingUp />}
                                label={`${template.success_rate}% sucesso`}
                                size="small"
                                color="success"
                              />
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSelectTemplate(template)}
                          sx={{ ml: 2 }}
                        >
                          Usar Template
                        </Button>
                      </Box>

                      {/* Expandable Details */}
                      <Button
                        size="small"
                        onClick={() => handleToggleExpand(template.id)}
                        endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                        sx={{ mt: 1 }}
                      >
                        {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </Button>

                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2, pl: 2, borderLeft: 3, borderColor: 'divider' }}>
                          {/* Suggested Activities */}
                          {template.activities && template.activities.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Atividades Sugeridas ({template.activities.length})
                              </Typography>
                              <List dense>
                                {template.activities.map((activity, index) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <CheckCircle sx={{ color: 'success.main' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={activity.title}
                                      secondary={
                                        <Box component="span">
                                          {activity.description}
                                          <Box component="span" sx={{ ml: 1 }}>
                                            <Chip
                                              label={`Alavancagem: ${activity.leverage_score}`}
                                              size="small"
                                              sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                                            />
                                          </Box>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}

                          {/* Reflective Questions */}
                          {template.reflective_questions && template.reflective_questions.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Perguntas Reflexivas
                              </Typography>
                              <Alert severity="info">
                                <List dense>
                                  {template.reflective_questions.map((q, index) => (
                                    <Typography key={index} variant="body2" component="li" sx={{ mb: 0.5 }}>
                                      {q.question}
                                    </Typography>
                                  ))}
                                </List>
                              </Alert>
                            </Box>
                          )}

                          {/* Milestones */}
                          {template.milestones && template.milestones.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Marcos Esperados
                              </Typography>
                              <List dense>
                                {template.milestones.map((milestone, index) => (
                                  <ListItem key={index}>
                                    <ListItemText
                                      primary={milestone.description}
                                      secondary={`Semana ${milestone.week || index + 1}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}