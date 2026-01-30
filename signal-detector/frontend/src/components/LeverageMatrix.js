import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  ReferenceArea
} from 'recharts';
import { Card, CardContent, Typography, Box } from '@mui/material';

const LeverageMatrix = ({ activities }) => {
  // Prepare data for the chart
  const data = activities.map(activity => ({
    x: activity.effort || 5,
    y: activity.impact || 5,
    z: activity.duration_minutes || activity.duration || 60, // Bubble size represents duration
    name: activity.description,
    description: activity.description,
    impact: activity.impact || 5,
    effort: activity.effort || 5,
    duration: activity.duration_minutes || activity.duration || 0
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Matriz de Alavancagem (Impacto vs. Esforço)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Visualize suas atividades para identificar onde você está investindo seu tempo e energia.
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
            >
              {/* Quadrant Backgrounds */}
              <ReferenceArea x1={0} x2={5.5} y1={5.5} y2={10.5} fill="#10b981" fillOpacity={0.1} label={{ value: 'Alta Alavancagem', position: 'insideTopLeft', fill: '#059669', fontSize: 12 }} />
              <ReferenceArea x1={5.5} x2={10.5} y1={5.5} y2={10.5} fill="#3b82f6" fillOpacity={0.1} label={{ value: 'Projetos Estratégicos', position: 'insideTopRight', fill: '#2563eb', fontSize: 12 }} />
              <ReferenceArea x1={0} x2={5.5} y1={0} y2={5.5} fill="#f59e0b" fillOpacity={0.1} label={{ value: 'Distrações', position: 'insideBottomLeft', fill: '#d97706', fontSize: 12 }} />
              <ReferenceArea x1={5.5} x2={10.5} y1={0} y2={5.5} fill="#ef4444" fillOpacity={0.1} label={{ value: 'Drenos de Energia', position: 'insideBottomRight', fill: '#dc2626', fontSize: 12 }} />

              <CartesianGrid strokeDasharray="3 3" />
              
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Esforço" 
                domain={[0, 10.5]} 
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              >
                <Label value="Esforço percebido" offset={-25} position="insideBottom" />
              </XAxis>
              
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Impacto" 
                domain={[0, 10.5]} 
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              >
                <Label value="Impacto no Objetivo" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>

              <ZAxis type="number" dataKey="z" name="Duração (min)" range={[100, 1000]} />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 1000 }}
                allowEscapeViewBox={{ x: true, y: true }}
              />

              {/* Fallback: Default Tooltip for testing */}
              {/* <Tooltip cursor={{ strokeDasharray: '3 3' }} /> */}
              
              <Legend verticalAlign="top" height={36}/>

              <Scatter name="Atividades" data={data} fill="#6366f1" shape="circle" />

            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxWidth: '250px',
        fontSize: '14px',
        fontFamily: 'Roboto, Arial, sans-serif'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          {data.description || data.name || 'Atividade'}
        </div>
        <div style={{ marginBottom: '4px', color: '#555' }}>
          <strong>Impacto:</strong> {data.impact || data.y || 'N/A'}/10
        </div>
        <div style={{ marginBottom: '4px', color: '#555' }}>
          <strong>Esforço:</strong> {data.effort || data.x || 'N/A'}/10
        </div>
        <div style={{ color: '#555' }}>
          <strong>Duração:</strong> {data.duration || data.z || 0} min
        </div>
      </div>
    );
  }

  return null;
};

export default React.memo(LeverageMatrix);
