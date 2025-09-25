import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function Header() {
  const router = useRouter();

  const isActive = (pathname) => router.pathname === pathname;

  return (
    <AppBar
      position="static"
      sx={{
        mb: 4,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b8cf8 100%)',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 1,
            p: 1,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <TrendingUpIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'white'
            }}
          >
            Signal Detector
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            component={Link}
            href="/"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/goals"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/goals') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Objetivos
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/record"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/record') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Áudio
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/text-entry"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/text-entry') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Texto
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/dashboard"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Dashboard
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}