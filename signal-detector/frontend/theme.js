import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#C4291F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1D1D1F',
      light: '#48484A',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D1D1F',
      secondary: '#86868B',
    },
    signal: {
      main: '#34C759',
      light: '#5ED67A',
      dark: '#248A3D',
      contrastText: '#FFFFFF',
    },
    noise: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#C4291F',
      contrastText: '#FFFFFF',
    },
    neutral: {
      main: '#86868B',
      light: '#AEAEB2',
      dark: '#6E6E73',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#34C759',
      light: '#5ED67A',
      dark: '#248A3D',
    },
    warning: {
      main: '#86868B',
      light: '#AEAEB2',
      dark: '#6E6E73',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6961',
      dark: '#C4291F',
    },
    info: {
      main: '#1D1D1F',
      light: '#48484A',
      dark: '#000000',
    },
    grey: {
      50: '#F5F5F7',
      100: '#E8E8ED',
      200: '#D2D2D7',
      300: '#AEAEB2',
      400: '#86868B',
      500: '#6E6E73',
      600: '#48484A',
      700: '#3A3A3C',
      800: '#2C2C2E',
      900: '#1D1D1F',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: '#1D1D1F',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#1D1D1F',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#1D1D1F',
    },
    h4: {
      fontSize: '1.375rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#1D1D1F',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#1D1D1F',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#1D1D1F',
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
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: '#1D1D1F',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
          },
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
          backgroundColor: '#E8E8ED',
        },
      },
    },
  },
});

export default theme;
