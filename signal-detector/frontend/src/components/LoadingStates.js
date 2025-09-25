import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Skeleton,
  Button
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Componente de loading padrão para botões
export const LoadingButton = ({ loading, children, startIcon, ...props }) => (
  <Button
    {...props}
    disabled={loading || props.disabled}
    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
  >
    {loading ? 'Processando...' : children}
  </Button>
);

// Loading state para classificação IA
export const AIClassificationLoading = ({ message = "Analisando atividade com IA..." }) => (
  <Card sx={{ mt: 3, backgroundColor: 'background.paper' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PsychologyIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6">{message}</Typography>
      </Box>
      <LinearProgress sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Nossa IA está avaliando sua atividade com base em seus objetivos...
      </Typography>
    </CardContent>
  </Card>
);

// Loading state para análise de objetivos
export const GoalAnalysisLoading = ({ phase = 1 }) => {
  const phases = [
    { icon: PsychologyIcon, text: "Analisando seu perfil..." },
    { icon: TrendingUpIcon, text: "Gerando cronograma personalizado..." },
    { icon: AutoAwesomeIcon, text: "Criando objetivos SMART..." },
    { icon: AutoAwesomeIcon, text: "Finalizando sugestões..." }
  ];

  const currentPhase = phases[phase - 1] || phases[0];
  const Icon = currentPhase.icon;

  return (
    <Card sx={{ mt: 3, backgroundColor: 'background.paper' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">Assistente IA Trabalhando</Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={(phase / 4) * 100}
          sx={{ mb: 2, height: 6, borderRadius: 3 }}
        />

        <Typography variant="body1" sx={{ mb: 1 }}>
          {currentPhase.text}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Fase {phase} de 4 - Esta análise personalizada pode levar alguns segundos
        </Typography>
      </CardContent>
    </Card>
  );
};

// Loading skeleton para dashboards
export const DashboardLoading = () => (
  <Box>
    {/* Header skeleton */}
    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 4 }} />

    {/* Cards skeleton */}
    <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
      {[1, 2, 3].map((i) => (
        <Card key={i} sx={{ flex: 1 }}>
          <CardContent>
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="60%" height={40} />
          </CardContent>
        </Card>
      ))}
    </Box>

    {/* Chart skeleton */}
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={200} />
      </CardContent>
    </Card>
  </Box>
);

// Loading genérico com mensagem customizável
export const CustomLoading = ({
  message = "Carregando...",
  subtitle = null,
  showProgress = false,
  progress = 0
}) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <CircularProgress sx={{ mb: 2 }} />
    <Typography variant="h6" gutterBottom>
      {message}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
    {showProgress && (
      <Box sx={{ mt: 2, width: '100%' }}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
    )}
  </Box>
);

// Loading state para gravação de áudio
export const AudioRecordingLoading = ({ isRecording = false, isProcessing = false }) => {
  if (isRecording) {
    return (
      <Card sx={{ mt: 2, backgroundColor: 'error.light', color: 'error.contrastText' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'error.main',
                animation: 'pulse 1s infinite',
                mr: 2
              }}
            />
            <Typography variant="h6">Gravando...</Typography>
          </Box>
          <Typography variant="body2">
            Fale sobre sua atividade. Clique em parar quando terminar.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AutoAwesomeIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">Processando Áudio</Typography>
          </Box>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Transcrevendo e analisando sua gravação...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return null;
};

// Componente de erro padronizado
export const ErrorDisplay = ({
  error,
  onRetry = null,
  title = "Ops! Algo deu errado"
}) => (
  <Card sx={{ mt: 2, borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
    <CardContent>
      <Typography variant="h6" color="error" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error || "Ocorreu um erro inesperado. Tente novamente."}
      </Typography>
      {onRetry && (
        <Button variant="outlined" color="error" onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </CardContent>
  </Card>
);