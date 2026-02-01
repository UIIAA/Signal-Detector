import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Tooltip,
  LinearProgress,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Snackbar,
  CircularProgress,
  Fab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle,
  Schedule,
  PlayArrow,
  LocalFireDepartment,
  FilterList,
  TrendingUp,
  TrendingDown,
  Add,
  Edit,
  Delete,
  AutoAwesome,
  Refresh,
  Upload
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { createKanbanService } from '../services/KanbanService';
import ImportTasksDialog from './kanban/ImportTasksDialog';

const PROJECTS = ['DEFENZ', 'CONNECT', 'GRAFONO', 'PEC', 'PESSOAL'];
const CATEGORIES = ['Vendas', 'Marketing', 'Produto', 'Estrutura', 'Admin', 'Pipeline', 'Zoho', 'Projeto', 'Decisao', 'Compromisso', 'Geral'];

const emptyTask = {
  titulo: '',
  descricao: '',
  projeto: 'PESSOAL',
  categoria: 'Geral',
  status: 'todo',
  prioridade: 'media',
  gera_receita: false,
  urgente: false,
  importante: false,
  impacto: 5,
  esforco: 5,
  data_prevista: ''
};

const KanbanBoard = () => {
  const { user, fetchWithAuth } = useAuth();
  const theme = useTheme();

  // Initialize KanbanService with fetchWithAuth
  const kanbanService = useMemo(() => createKanbanService(fetchWithAuth), [fetchWithAuth]);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, progress: 0, done: 0, sinal: 0, ruido: 0, receita: 0 });
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterReceita, setFilterReceita] = useState(false);
  const [filterSignal, setFilterSignal] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState(emptyTask);
  const [saving, setSaving] = useState(false);
  const [classifying, setClassifying] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const columns = [
    { id: 'todo', title: 'A Fazer', icon: Schedule, color: 'text.secondary' },
    { id: 'progress', title: 'Em Progresso', icon: PlayArrow, color: 'info.main' },
    { id: 'done', title: 'Concluido', icon: CheckCircle, color: 'signal.main' },
  ];

  // Carregar tarefas
  const loadTasks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await kanbanService.getTasks();
      setTasks(data.tasks || []);
      setStats(data.stats || { total: 0, todo: 0, progress: 0, done: 0, sinal: 0, ruido: 0, receita: 0 });
    } catch (error) {
      console.error('Error loading tasks:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar tarefas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, kanbanService]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    if (filterProject !== 'all' && task.projeto !== filterProject) return false;
    if (filterPriority !== 'all' && task.prioridade !== filterPriority) return false;
    if (filterReceita && !task.gera_receita) return false;
    if (filterSignal === 'sinal' && task.classificacao !== 'SINAL') return false;
    if (filterSignal === 'ruido' && task.classificacao !== 'RUIDO') return false;
    return true;
  });

  // Drag & Drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      try {
        await kanbanService.updateTask(draggedTask.id, { status: newStatus });
        setTasks(prev => prev.map(t =>
          t.id === draggedTask.id ? { ...t, status: newStatus } : t
        ));
        setSnackbar({ open: true, message: 'Status atualizado!', severity: 'success' });
      } catch (error) {
        console.error('Error updating status:', error);
        setSnackbar({ open: true, message: 'Erro ao atualizar status', severity: 'error' });
      }
    }
    setDraggedTask(null);
  };

  const getColumnTasks = (status) => filteredTasks.filter(t => t.status === status);

  // CRUD Operations
  const openCreateDialog = () => {
    setEditingTask(null);
    setFormData(emptyTask);
    setDialogOpen(true);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setFormData({
      titulo: task.titulo || '',
      descricao: task.descricao || '',
      projeto: task.projeto || 'PESSOAL',
      categoria: task.categoria || 'Geral',
      status: task.status || 'todo',
      prioridade: task.prioridade || 'media',
      gera_receita: task.gera_receita || false,
      urgente: task.urgente || false,
      importante: task.importante || false,
      impacto: task.impacto || 5,
      esforco: task.esforco || 5,
      data_prevista: task.data_prevista ? task.data_prevista.split('T')[0] : ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      setSnackbar({ open: true, message: 'Titulo e obrigatorio', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      let data;
      if (editingTask) {
        data = await kanbanService.updateTask(editingTask.id, formData);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data.task : t));
      } else {
        data = await kanbanService.createTask(formData);
        setTasks(prev => [data.task, ...prev]);
      }
      setDialogOpen(false);
      setSnackbar({ open: true, message: editingTask ? 'Tarefa atualizada!' : 'Tarefa criada!', severity: 'success' });
      loadTasks(); // Recarrega para atualizar stats
    } catch (error) {
      console.error('Error saving task:', error);
      setSnackbar({ open: true, message: 'Erro ao salvar tarefa', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      await kanbanService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setSnackbar({ open: true, message: 'Tarefa excluida!', severity: 'success' });
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({ open: true, message: 'Erro ao excluir tarefa', severity: 'error' });
    }
  };

  const handleClassifyWithAI = async (taskId) => {
    setClassifying(taskId);
    try {
      const data = await kanbanService.classifyTask(taskId, true);
      setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      setSnackbar({ open: true, message: `Classificado: ${data.classification.label}`, severity: 'success' });
    } catch (error) {
      console.error('Error classifying:', error);
      setSnackbar({ open: true, message: 'Erro ao classificar', severity: 'error' });
    } finally {
      setClassifying(null);
    }
  };

  const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  const projectColors = theme.palette.projects;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Kanban - Classificacao SINAL/RUIDO
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Projeto "Eu Mesmo" - Foque no que realmente importa
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadTasks}>
            Atualizar
          </Button>
          <Button variant="outlined" startIcon={<Upload />} onClick={() => setImportDialogOpen(true)}>
            Importar
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
            Nova Tarefa
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary">Total</Typography>
            <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'signal.main' }} />
              <Typography variant="body2" color="text.secondary">Concluidas</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold" color="signal.main">{stats.done}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'signal.main' }} />
              <TrendingUp sx={{ color: 'signal.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">SINAL</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold" color="signal.main">{stats.sinal}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'ruido.main' }} />
              <TrendingDown sx={{ color: 'ruido.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">RUIDO</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold" color="ruido.main">{stats.ruido}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'accent.main' }} />
              <LocalFireDepartment sx={{ color: 'accent.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">Receita</Typography>
            </Stack>
            <Typography variant="h4" fontWeight="bold" color="accent.main">{stats.receita}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">Progresso</Typography>
          <Typography variant="body2" fontWeight="bold">{progress.toFixed(0)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: 'signal.main' } }}
        />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <FilterList color="action" />
          <Typography variant="body2" color="text.secondary" fontWeight="medium">Filtros:</Typography>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Projeto</InputLabel>
            <Select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} label="Projeto">
              <MenuItem value="all">Todos</MenuItem>
              {PROJECTS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} label="Prioridade">
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="alta">Alta</MenuItem>
              <MenuItem value="media">Media</MenuItem>
              <MenuItem value="baixa">Baixa</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Classificacao</InputLabel>
            <Select value={filterSignal} onChange={(e) => setFilterSignal(e.target.value)} label="Classificacao">
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="sinal">So SINAL</MenuItem>
              <MenuItem value="ruido">So RUIDO</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={filterReceita} onChange={(e) => setFilterReceita(e.target.checked)} />}
            label={
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <LocalFireDepartment sx={{ color: filterReceita ? 'accent.main' : 'inherit', fontSize: 18 }} />
                <Typography variant="body2">So Receita</Typography>
              </Stack>
            }
          />
        </Stack>
      </Paper>

      {/* Alert for SINAL tasks */}
      {stats.sinal > 0 && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<TrendingUp />}>
          <strong>{stats.sinal} tarefas SINAL</strong> identificadas! Foque nelas para maximo impacto.
        </Alert>
      )}

      {/* Kanban Board */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
        {columns.map(column => {
          const columnTasks = getColumnTasks(column.id);
          const Icon = column.icon;

          return (
            <Paper
              key={column.id}
              sx={{
                p: 2,
                bgcolor: 'gray.50',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                minHeight: 400
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Icon sx={{ color: column.color }} />
                <Typography variant="h6" fontWeight="bold">{column.title}</Typography>
                <Chip label={columnTasks.length} size="small" sx={{ ml: 'auto', bgcolor: column.color, color: 'white' }} />
              </Box>

              <Stack spacing={1.5}>
                {columnTasks.map(task => {
                  const colors = projectColors[task.projeto] || projectColors.PESSOAL;

                  return (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      sx={{
                        cursor: 'move',
                        borderLeft: `2px solid ${colors.main}`,
                        borderRadius: 2,
                        boxShadow: 1,
                        '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.06)' },
                        transition: 'box-shadow 0.2s'
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Chip
                            label={task.projeto}
                            size="small"
                            sx={{ bgcolor: colors.main, color: 'white', fontSize: '0.7rem', height: 22 }}
                          />
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {task.gera_receita && (
                              <Tooltip title="Gera Receita">
                                <LocalFireDepartment sx={{ color: 'accent.main', fontSize: 18 }} />
                              </Tooltip>
                            )}
                            <Tooltip title={`${task.classificacao} (Score: ${task.signal_score})`}>
                              <Chip
                                label={task.classificacao || 'NEUTRO'}
                                size="small"
                                sx={{
                                  bgcolor: task.classificacao === 'SINAL' ? 'signal.main' : task.classificacao === 'RUIDO' ? 'ruido.main' : 'neutral.main',
                                  color: 'white',
                                  fontSize: '0.65rem',
                                  height: 18,
                                  fontWeight: 'bold'
                                }}
                              />
                            </Tooltip>
                          </Stack>
                        </Box>

                        <Typography variant="body2" fontWeight="medium" sx={{ color: colors.text, mb: 1 }}>
                          {task.titulo}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {task.categoria}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Classificar com IA">
                              <IconButton size="small" onClick={() => handleClassifyWithAI(task.id)} disabled={classifying === task.id}>
                                {classifying === task.id ? <CircularProgress size={16} /> : <AutoAwesome sx={{ fontSize: 16 }} />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => openEditDialog(task)}>
                                <Edit sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" onClick={() => handleDelete(task.id)} color="error">
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography variant="body2">Nenhuma tarefa</Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
          <Typography variant="body2" color="text.secondary" fontWeight="medium">Legenda:</Typography>
          {Object.entries(projectColors).map(([name, colors]) => (
            <Stack key={name} direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: colors.main }} />
              <Typography variant="caption">{name}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Projeto</InputLabel>
                <Select value={formData.projeto} onChange={(e) => setFormData({ ...formData, projeto: e.target.value })} label="Projeto">
                  {PROJECTS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} label="Categoria">
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select value={formData.prioridade} onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })} label="Prioridade">
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baixa">Baixa</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Status">
                  <MenuItem value="todo">A Fazer</MenuItem>
                  <MenuItem value="progress">Em Progresso</MenuItem>
                  <MenuItem value="done">Concluido</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" gutterBottom>Impacto: {formData.impacto}</Typography>
                <Slider value={formData.impacto} onChange={(e, v) => setFormData({ ...formData, impacto: v })} min={1} max={10} marks />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" gutterBottom>Esforco: {formData.esforco}</Typography>
                <Slider value={formData.esforco} onChange={(e, v) => setFormData({ ...formData, esforco: v })} min={1} max={10} marks />
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={<Switch checked={formData.gera_receita} onChange={(e) => setFormData({ ...formData, gera_receita: e.target.checked })} />}
                label="Gera Receita"
              />
              <FormControlLabel
                control={<Switch checked={formData.urgente} onChange={(e) => setFormData({ ...formData, urgente: e.target.checked })} />}
                label="Urgente"
              />
              <FormControlLabel
                control={<Switch checked={formData.importante} onChange={(e) => setFormData({ ...formData, importante: e.target.checked })} />}
                label="Importante"
              />
            </Stack>
            <TextField
              label="Data Prevista"
              type="date"
              value={formData.data_prevista}
              onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingTask ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={openCreateDialog}>
        <Add />
      </Fab>

      {/* Import Dialog */}
      <ImportTasksDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={(count) => {
          setSnackbar({ open: true, message: `${count} tarefa${count !== 1 ? 's' : ''} importada${count !== 1 ? 's' : ''}!`, severity: 'success' });
          loadTasks();
        }}
        fetchWithAuth={fetchWithAuth}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default React.memo(KanbanBoard);
