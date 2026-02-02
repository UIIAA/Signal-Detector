import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HomeIcon from '@mui/icons-material/Home';
import FlagIcon from '@mui/icons-material/Flag';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RouteIcon from '@mui/icons-material/Route';
import RepeatIcon from '@mui/icons-material/Repeat';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { AccountCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Home', href: '/', icon: <HomeIcon /> },
  { label: 'Objetivos', href: '/goals', icon: <FlagIcon /> },
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Rota Critica', href: '/critical-path', icon: <RouteIcon /> },
  { label: 'Habitos', href: '/habits', icon: <RepeatIcon /> },
  { label: 'Kanban', href: '/kanban', icon: <ViewKanbanIcon /> },
];

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (pathname) => router.pathname === pathname;

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    router.push('/login');
  };

  return (
    <>
      <AppBar position="sticky" sx={{ mb: 0 }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 24, color: '#FF3B30', mr: 1 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#1D1D1F',
                fontSize: '1.1rem',
              }}
            >
              Signal Detector
            </Typography>
          </Box>

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  color: isActive(item.href) ? '#FF3B30' : '#1D1D1F',
                  fontWeight: isActive(item.href) ? 600 : 400,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  borderBottom: isActive(item.href) ? '2px solid #FF3B30' : '2px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 59, 48, 0.06)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Desktop User */}
          {user && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#86868B' }}>
                {user.name}
              </Typography>
              <IconButton size="small" onClick={handleLogout} sx={{ color: '#86868B' }}>
                <Logout fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Mobile Hamburger */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'flex-end' }}>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#1D1D1F' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 20, color: '#FF3B30', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1D1D1F' }}>
              Signal Detector
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#86868B' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {user && (
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountCircle sx={{ fontSize: 32, color: '#86868B' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1D1D1F' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#86868B' }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider />

        <List sx={{ px: 1, py: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                selected={isActive(item.href)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 59, 48, 0.08)',
                    color: '#FF3B30',
                    '& .MuiListItemIcon-root': {
                      color: '#FF3B30',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 59, 48, 0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive(item.href) ? '#FF3B30' : '#86868B' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive(item.href) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{
              color: '#FF3B30',
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: 'rgba(255, 59, 48, 0.06)',
              },
            }}
          >
            Sair
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
