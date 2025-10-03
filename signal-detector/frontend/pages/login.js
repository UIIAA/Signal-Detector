import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContext';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Link,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!formData.email) {
          throw new Error('Email é obrigatório');
        }
        await login(formData.email, formData.name);
      } else {
        if (!formData.email || !formData.name) {
          throw new Error('Email e nome são obrigatórios');
        }
        await register(formData.email, formData.name);
      }

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ email: '', name: '', password: '' });
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login('demo@signalruido.com', 'Usuário Demo');
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <PsychologyIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Sinal vs Ruído
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Identifique o que realmente importa
        </Typography>
      </Box>

      <Card sx={{ backgroundColor: 'background.paper' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            {mode === 'login'
              ? 'Entre com seu email para acessar seus objetivos'
              : 'Crie sua conta para começar a organizar seus objetivos'
            }
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default'
                  }
                }}
              />

              {mode === 'register' && (
                <TextField
                  fullWidth
                  label="Nome"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.default'
                    }
                  }}
                />
              )}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : (mode === 'login' ? <LoginIcon /> : <PersonAddIcon />)}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)'
                  }
                }}
              >
                {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ou
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleDemoLogin}
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: '#10b981',
              color: '#10b981',
              '&:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: '#10b981'
              }
            }}
          >
            Usar Conta Demo
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              {' '}
              <Link
                component="button"
                type="button"
                onClick={switchMode}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </Link>
            </Typography>
          </Box>

          <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              <strong>Sobre a autenticação:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Os dados são salvos localmente no seu dispositivo<br/>
              • Não coletamos senhas nem dados pessoais<br/>
              • Sua privacidade é totalmente preservada
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}