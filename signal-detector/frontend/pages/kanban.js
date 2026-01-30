import React from 'react';
import Head from 'next/head';
import Header from '../src/components/Header';
import ProtectedRoute from '../src/components/ProtectedRoute';
import KanbanBoard from '../src/components/KanbanBoard';
import { Container, Box } from '@mui/material';

export default function Kanban() {
  return (
    <ProtectedRoute>
      <Head>
        <title>Kanban | Signal Detector</title>
        <meta name="description" content="Gerencie suas tarefas com classificação SINAL/RUÍDO" />
      </Head>

      <Header />

      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: 2 }}>
        <Container maxWidth="xl">
          <KanbanBoard />
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
