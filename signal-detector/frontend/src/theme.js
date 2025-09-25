import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa', // blue-400 do modelo Gemini
      light: '#93c5fd',
      dark: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a855f7', // purple-500 do modelo Gemini
      light: '#c084fc',
      dark: '#9333ea',
      contrastText: '#ffffff',
    },
    background: {
      default: '#111827', // gray-900 do modelo Gemini
      paper: '#1f2937', // gray-800 do modelo Gemini
    },
    text: {
      primary: '#ffffff', // Texto branco para tema escuro
      secondary: '#9ca3af', // gray-400 do modelo Gemini
    },
    signal: {
      main: '#10b981', // green-500 para sinais
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    noise: {
      main: '#ef4444', // red-500 para ruídos
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    neutral: {
      main: '#f59e0b', // yellow-500 para neutro
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // green-500
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // yellow-500
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#60a5fa', // blue-400
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    // Cores do modelo Gemini
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
    '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
    '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
    '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
    '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
    '0px 6px 20px rgba(99, 102, 241, 0.15)',
    '0px 8px 25px rgba(99, 102, 241, 0.2)',
    '0px 12px 30px rgba(99, 102, 241, 0.25)',
    '0px 20px 40px rgba(0, 0, 0, 0.1)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 30px 60px rgba(0, 0, 0, 0.2)',
    '0px 5px 15px rgba(0, 0, 0, 0.08)',
    '0px 10px 25px rgba(0, 0, 0, 0.1)',
    '0px 15px 35px rgba(0, 0, 0, 0.12)',
    '0px 20px 45px rgba(0, 0, 0, 0.15)',
    '0px 25px 55px rgba(0, 0, 0, 0.18)',
    '0px 30px 65px rgba(0, 0, 0, 0.2)',
    '0px 35px 75px rgba(0, 0, 0, 0.22)',
    '0px 40px 85px rgba(0, 0, 0, 0.25)',
    '0px 45px 95px rgba(0, 0, 0, 0.28)',
    '0px 50px 105px rgba(0, 0, 0, 0.3)',
    '0px 55px 115px rgba(0, 0, 0, 0.32)',
    '0px 60px 125px rgba(0, 0, 0, 0.35)',
    '0px 65px 135px rgba(0, 0, 0, 0.38)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(99, 102, 241, 0.35)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
        bar: {
          background: 'linear-gradient(90deg, #6366f1 0%, #8b8cf8 100%)',
        },
      },
    },
  },
});

export default theme;