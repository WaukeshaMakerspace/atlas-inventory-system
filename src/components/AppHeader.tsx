'use client';

import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LabelIcon from '@mui/icons-material/Label';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleMenuClose();
    signOut();
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4 }}>
          <Image
            src="/logo.png"
            alt="WMI Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="h6" component="div">
            Atlas
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <Button
            color="inherit"
            component={Link}
            href="/"
            startIcon={<HomeIcon />}
            sx={{
              backgroundColor: pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Resources
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/locations"
            startIcon={<LocationOnIcon />}
            sx={{
              backgroundColor: pathname === '/locations' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Locations
          </Button>
          <Button
            color="inherit"
            component={Link}
            href="/tags"
            startIcon={<LabelIcon />}
            sx={{
              backgroundColor: pathname === '/tags' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            }}
          >
            Tags
          </Button>
        </Box>

        <Box>
          {session ? (
            <>
              <IconButton
                onClick={handleMenuOpen}
                color="inherit"
                sx={{ display: 'flex', gap: 1, borderRadius: 2, px: 1 }}
              >
                {session.user.image ? (
                  <Avatar src={session.user.image} alt={session.user.name || ''} sx={{ width: 32, height: 32 }} />
                ) : (
                  <AccountCircleIcon />
                )}
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {session.user.name}
                </Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => signIn('wildapricot')}
              startIcon={<LoginIcon />}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
