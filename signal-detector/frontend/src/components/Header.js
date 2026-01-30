import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const isActive = (pathname) => router.pathname === pathname;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    router.push('/login');
  };

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
          <Button
            color="inherit"
            component={Link}
            href="/critical-path"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/critical-path') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Rota Crítica
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/habits"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/habits') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Hábitos
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/kanban"
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: isActive('/kanban') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            Kanban
          </Button>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} />
                Sair
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}