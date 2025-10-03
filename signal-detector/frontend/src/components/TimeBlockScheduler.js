import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  Close
} from '@mui/icons-material';

/**
 * TimeBlockScheduler.js
 *
 * Componente de agendamento de blocos de tempo com visualização de calendário semanal.
 * Suporta criação, edição e acompanhamento de blocos.
 */
export default function TimeBlockScheduler({ userId, selectedDate = new Date() }) {
  const [blocks, setBlocks] = useState([]);
  const [blocksByDate, setBlocksByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    blockType: 'focus',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    plannedImpact: 8,
    plannedEffort: 3
  });

  useEffect(() => {
    if (userId) {
      fetchBlocks();
    }
  }, [userId, selectedDate]);

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar semana atual
      const startDate = getWeekStart(selectedDate);
      const endDate = getWeekEnd(selectedDate);

      const response = await fetch(
        `/api/schedule?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar agenda');
      }

      const data = await response.json();
      setBlocks(data.blocks || []);
      setBlocksByDate(data.blocksByDate || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async () => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          alert(`Conflito detectado: ${data.conflicts.map(c => c.title).join(', ')}`);
        }
        throw new Error('Erro ao criar bloco');
      }

      await fetchBlocks();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteBlock = async (blockId) => {
    try {
      await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId,
          userId,
          status: 'completed'
        })
      });

      await fetchBlocks();
    } catch (err) {
      console.error('Error completing block:', err);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!confirm('Remover este bloco?')) return;

    try {
      await fetch(`/api/schedule?blockId=${blockId}&userId=${userId}`, {
        method: 'DELETE'
      });

      await fetchBlocks();
    } catch (err) {
      console.error('Error deleting block:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      blockType: 'focus',
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:30',
      plannedImpact: 8,
      plannedEffort: 3
    });
    setEditingBlock(null);
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const getWeekEnd = (date) => {
    const d = new Date(getWeekStart(date));
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  };

  const getWeekDays = () => {
    const start = new Date(getWeekStart(selectedDate));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getBlockTypeColor = (type) => {
    const colors = {
      'focus': 'primary',
      'deep-work': 'secondary',
      'meeting': 'warning',
      'break': 'success',
      'learning': 'info',
      'admin': 'default'
    };
    return colors[type] || 'default';
  };

  const getBlockTypeLabel = (type) => {
    const labels = {
      'focus': 'Foco',
      'deep-work': 'Deep Work',
      'meeting': 'Reunião',
      'break': 'Pausa',
      'learning': 'Aprendizado',
      'admin': 'Administrativo',
      'personal': 'Pessoal'
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            <Schedule sx={{ verticalAlign: 'middle', mr: 1 }} />
            Agenda Semanal
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
          >
            Novo Bloco
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Visualização de calendário */}
        <Grid container spacing={1}>
          {getWeekDays().map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayBlocks = blocksByDate[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <Grid item xs={12} md={1.71} key={dateStr}>
                <Box
                  sx={{
                    border: 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    p: 1,
                    bgcolor: isToday ? 'primary.50' : 'background.paper',
                    minHeight: 300
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 1, textAlign: 'center' }}
                  >
                    {day.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {dayBlocks.map((block) => (
                      <Card
                        key={block.id}
                        variant="outlined"
                        sx={{
                          p: 0.5,
                          bgcolor: block.status === 'completed' ? 'success.50' : 'background.paper',
                          borderColor: getBlockTypeColor(block.block_type),
                          borderWidth: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 2
                          }
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold" display="block">
                          {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                          {block.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.3, mt: 0.3 }}>
                          <Chip
                            label={getBlockTypeLabel(block.block_type)}
                            size="small"
                            color={getBlockTypeColor(block.block_type)}
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                          {block.status === 'completed' && (
                            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.3, mt: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteBlock(block.id)}
                            sx={{ p: 0.3 }}
                            disabled={block.status === 'completed'}
                          >
                            <CheckCircle sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBlock(block.id)}
                            sx={{ p: 0.3 }}
                          >
                            <Delete sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* Dialog de criação/edição */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingBlock ? 'Editar Bloco' : 'Novo Bloco de Tempo'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Título"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <FormControl fullWidth>
                <InputLabel>Tipo de Bloco</InputLabel>
                <Select
                  value={formData.blockType}
                  label="Tipo de Bloco"
                  onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
                >
                  <MenuItem value="focus">Foco</MenuItem>
                  <MenuItem value="deep-work">Deep Work</MenuItem>
                  <MenuItem value="meeting">Reunião</MenuItem>
                  <MenuItem value="break">Pausa</MenuItem>
                  <MenuItem value="learning">Aprendizado</MenuItem>
                  <MenuItem value="admin">Administrativo</MenuItem>
                  <MenuItem value="personal">Pessoal</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Data"
                type="date"
                fullWidth
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Início"
                  type="time"
                  fullWidth
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fim"
                  type="time"
                  fullWidth
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Impacto Estimado"
                  type="number"
                  fullWidth
                  value={formData.plannedImpact}
                  onChange={(e) => setFormData({ ...formData, plannedImpact: parseInt(e.target.value) })}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
                <TextField
                  label="Esforço Estimado"
                  type="number"
                  fullWidth
                  value={formData.plannedEffort}
                  onChange={(e) => setFormData({ ...formData, plannedEffort: parseInt(e.target.value) })}
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBlock} variant="contained">
              {editingBlock ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}