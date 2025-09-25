import React, { useState, useEffect } from 'react';
import Header from '../src/components/Header';
import {
  Container, Typography, Box, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Button, TextField, Grid, IconButton, Chip, Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { goalsApi } from '../src/services/goalsApi';

// Mock API functions for now - replace with actual API calls
const getKeyActivities = async (goalId) => {
  const response = await fetch(`/api/goals/${goalId}/key-activities`);
  if (!response.ok) throw new Error('Failed to fetch key activities');
  return response.json();
};

const addKeyActivity = async (goalId, activity) => {
  const response = await fetch(`/api/goals/${goalId}/key-activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  });
  if (!response.ok) throw new Error('Failed to add key activity');
  return response.json();
};

const updateKeyActivityStatus = async (id, status) => {
  const response = await fetch(`/api/key-activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update key activity');
  return response.json();
};

const deleteKeyActivity = async (id) => {
  const response = await fetch(`/api/key-activities/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete key activity');
  return response.json();
};

export default function PlanPage() {
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [keyActivities, setKeyActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', impact: 5, effort: 5 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGoals = async () => {
      const goalsData = await goalsApi.getGoals();
      const allGoals = [...goalsData.short, ...goalsData.medium, ...goalsData.long];
      setGoals(allGoals);
      if (allGoals.length > 0) {
        setSelectedGoal(allGoals[0].id);
      }
    };
    loadGoals();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      setLoading(true);
      getKeyActivities(selectedGoal)
        .then(data => setKeyActivities(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedGoal]);

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.title) return;
    await addKeyActivity(selectedGoal, newActivity);
    setNewActivity({ title: '', description: '', impact: 5, effort: 5 });
    // Refresh list
    const data = await getKeyActivities(selectedGoal);
    setKeyActivities(data);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await updateKeyActivityStatus(id, newStatus);
    // Refresh list
    const data = await getKeyActivities(selectedGoal);
    setKeyActivities(data);
  };

  const handleDelete = async (id) => {
    await deleteKeyActivity(id);
    // Refresh list
    const data = await getKeyActivities(selectedGoal);
    setKeyActivities(data);
  };

  return (
    <div>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Plano de Ação: Atividades-Chave
        </Typography>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Selecione um Objetivo</InputLabel>
          <Select value={selectedGoal} label="Selecione um Objetivo" onChange={(e) => setSelectedGoal(e.target.value)}>
            {goals.map(goal => (
              <MenuItem key={goal.id} value={goal.id}>{goal.title}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Grid container spacing={4}>
          {/* Add new activity form */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Adicionar Nova Atividade-Chave</Typography>
                <Box component="form" onSubmit={handleAddActivity}>
                  <TextField
                    fullWidth
                    label="Título da Atividade"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Descrição (Opcional)"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    margin="normal"
                    multiline
                    rows={2}
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Impacto</InputLabel>
                    <Select value={newActivity.impact} label="Impacto" onChange={(e) => setNewActivity({ ...newActivity, impact: e.target.value })}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Esforço</InputLabel>
                    <Select value={newActivity.effort} label="Esforço" onChange={(e) => setNewActivity({ ...newActivity, effort: e.target.value })}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Button type="submit" variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{ mt: 2 }}>
                    Adicionar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Key activities list */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Lista de Atividades-Chave</Typography>
                {loading ? <Typography>Carregando...</Typography> : (
                  <Box>
                    {keyActivities.map(activity => (
                      <Card key={activity.id} sx={{ mb: 2, opacity: activity.status === 'completed' ? 0.6 : 1 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6" sx={{ textDecoration: activity.status === 'completed' ? 'line-through' : 'none' }}>
                                {activity.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">{activity.description}</Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip label={`Impacto: ${activity.impact}`} size="small" sx={{ mr: 1 }} />
                                <Chip label={`Esforço: ${activity.effort}`} size="small" />
                              </Box>
                            </Box>
                            <Box>
                              <Tooltip title={activity.status === 'pending' ? 'Marcar como Concluída' : 'Marcar como Pendente'}>
                                <IconButton onClick={() => handleToggleStatus(activity.id, activity.status)}>
                                  {activity.status === 'pending' ? <PendingIcon /> : <CheckCircleIcon color="success" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir Atividade">
                                <IconButton onClick={() => handleDelete(activity.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                    {keyActivities.length === 0 && <Typography>Nenhuma atividade-chave para este objetivo ainda.</Typography>}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
