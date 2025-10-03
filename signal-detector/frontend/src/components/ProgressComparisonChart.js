import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Check } from '@mui/icons-material';

/**
 * ProgressComparisonChart.js
 *
 * Gráfico que compara o progresso real com a rota ideal (milestones).
 * Mostra se o usuário está adiantado, no prazo, ou atrasado.
 */
export default function ProgressComparisonChart({
  goal,
  idealPath,
  deviation
}) {
  if (!idealPath || !idealPath.milestones) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Nenhuma rota ideal definida. Crie uma rota crítica para acompanhar seu progresso.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = prepareChartData(goal, idealPath);

  const getDeviationStatus = () => {
    if (!deviation) return null;

    const { status, deviationPercentage } = deviation;

    if (status === 'completed') {
      return {
        icon: <Check />,
        color: 'success',
        label: 'Concluído',
        message: 'Parabéns! Você concluiu sua rota crítica.'
      };
    }

    if (status === 'ahead') {
      return {
        icon: <TrendingUp />,
        color: 'success',
        label: 'Adiantado',
        message: `Você está ${Math.abs(deviationPercentage).toFixed(0)}% adiantado em relação à rota ideal!`
      };
    }

    return {
      icon: <TrendingDown />,
      color: 'error',
      label: 'Atrasado',
      message: `Você está ${Math.abs(deviationPercentage).toFixed(0)}% atrasado. Priorize atividades críticas.`
    };
  };

  const deviationStatus = getDeviationStatus();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Progresso vs. Rota Ideal
          </Typography>
          {deviationStatus && (
            <Chip
              icon={deviationStatus.icon}
              label={deviationStatus.label}
              color={deviationStatus.color}
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>

        {deviationStatus && (
          <Alert severity={deviationStatus.color} sx={{ mb: 2 }}>
            {deviationStatus.message}
          </Alert>
        )}

        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              label={{ value: 'Progresso (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: 8
              }}
              formatter={(value, name) => [
                `${value}%`,
                name === 'ideal' ? 'Rota Ideal' : 'Progresso Real'
              ]}
            />
            <Legend />

            {/* Área entre as linhas (visualização de desvio) */}
            <Area
              type="monotone"
              dataKey="ideal"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="none"
            />

            {/* Linha da rota ideal */}
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Rota Ideal"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Linha do progresso real */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={3}
              name="Progresso Real"
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />

            {/* Linha de referência do momento atual */}
            <ReferenceLine
              x={new Date().toISOString().split('T')[0]}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Hoje', position: 'top', fill: '#ef4444' }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Milestones */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Milestones da Rota Crítica
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {idealPath.milestones.map((milestone, index) => {
              const isCompleted = (goal.progress_percentage || 0) >= milestone.percentage;
              const isCurrent = deviation?.nextMilestone?.percentage === milestone.percentage;

              return (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    bgcolor: isCompleted ? 'success.50' : isCurrent ? 'primary.50' : 'transparent',
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    borderWidth: isCurrent ? 2 : 1
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isCompleted && <Check sx={{ color: 'success.main' }} />}
                        <Typography variant="body2" fontWeight={isCurrent ? 'bold' : 'normal'}>
                          {milestone.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={`${milestone.percentage}%`}
                          size="small"
                          color={isCompleted ? 'success' : isCurrent ? 'primary' : 'default'}
                        />
                        <Chip
                          label={milestone.date}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Próxima ação recomendada */}
        {deviation?.nextMilestone && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Próximo milestone:</strong> {deviation.nextMilestone.description} até{' '}
              {deviation.nextMilestone.date}
              {' '}({deviation.nextMilestone.percentage}%)
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Preparar dados para o gráfico
function prepareChartData(goal, idealPath) {
  const data = [];
  const today = new Date();
  const currentProgress = goal.progress_percentage || 0;

  // Adicionar ponto inicial
  const startDate = new Date(goal.created_at || Date.now());
  data.push({
    date: startDate.toISOString().split('T')[0],
    ideal: 0,
    actual: 0
  });

  // Adicionar milestones da rota ideal
  idealPath.milestones.forEach(milestone => {
    const milestoneDate = new Date(milestone.date);

    data.push({
      date: milestone.date,
      ideal: milestone.percentage,
      actual: milestoneDate <= today ? currentProgress : null
    });
  });

  // Adicionar ponto de hoje se não estiver nos milestones
  const todayStr = today.toISOString().split('T')[0];
  if (!data.find(d => d.date === todayStr)) {
    // Interpolar progresso ideal para hoje
    const sortedMilestones = [...idealPath.milestones].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const nextMilestone = sortedMilestones.find(
      m => new Date(m.date) >= today
    );
    const prevMilestone = sortedMilestones
      .reverse()
      .find(m => new Date(m.date) <= today);

    let idealToday = 0;
    if (nextMilestone && prevMilestone) {
      // Interpolação linear
      const totalDays =
        (new Date(nextMilestone.date) - new Date(prevMilestone.date)) /
        (1000 * 60 * 60 * 24);
      const daysPassed =
        (today - new Date(prevMilestone.date)) / (1000 * 60 * 60 * 24);
      const progressDiff = nextMilestone.percentage - prevMilestone.percentage;

      idealToday =
        prevMilestone.percentage + (progressDiff * daysPassed) / totalDays;
    } else if (nextMilestone) {
      idealToday = 0;
    } else {
      idealToday = 100;
    }

    data.push({
      date: todayStr,
      ideal: Math.round(idealToday),
      actual: currentProgress
    });
  }

  // Ordenar por data
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}