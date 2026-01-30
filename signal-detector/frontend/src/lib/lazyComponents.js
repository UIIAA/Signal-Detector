import dynamic from 'next/dynamic';
import { CircularProgress, Box } from '@mui/material';

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

export const LazyLeverageMatrix = dynamic(
  () => import('../components/LeverageMatrix'),
  { loading: LoadingFallback, ssr: false }
);

export const LazyKanbanBoard = dynamic(
  () => import('../components/KanbanBoard'),
  { loading: LoadingFallback, ssr: false }
);

export const LazyTimeBlockScheduler = dynamic(
  () => import('../components/TimeBlockScheduler'),
  { loading: LoadingFallback, ssr: false }
);
