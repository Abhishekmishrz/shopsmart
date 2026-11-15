import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Box, ButtonBase, CircularProgress, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { colors, monoFont } from '../theme';

const linkSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  height: 44,
  px: 1.5,
  borderRadius: 2,
  color: '#C9C9D1',
  textDecoration: 'none',
  fontSize: 15,
  width: '100%',
  justifyContent: 'flex-start',
  '&:hover': { bgcolor: '#222228', color: '#FFFFFF' },
  '&.active': { bgcolor: '#2A2A30', color: '#FFFFFF', fontWeight: 600 },
};

// Dark sidebar + the current admin page on the right
export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(0); // orders waiting to ship

  // useCallback: the same function between renders, so pages can safely list it as an effect dependency
  const refreshPending = useCallback(() => {
    api
      .get('/orders', { params: { status: 'Placed', limit: 1 } })
      .then(({ data }) => setPending(data.total))
      .catch(() => {}); // only a badge: if it fails, the page itself still works
  }, []);

  useEffect(refreshPending, [refreshPending]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      <Box
        component="aside"
        sx={{
          flex: '1 1 240px',
          maxWidth: { md: 260 },
          bgcolor: colors.ink,
          color: '#FFFFFF',
          px: 1.75,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          // Desktop: the sidebar is exactly one screen tall and stays put while the page
          // scrolls, so "View store" and "Log out" are always visible at the bottom
          position: { md: 'sticky' },
          top: 0,
          height: { md: '100vh' },
          alignSelf: 'flex-start',
          overflowY: { md: 'auto' },
        }}
      >
        <Box component={Link} to="/admin" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', color: '#FFFFFF', px: 1 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: colors.accent, color: colors.ink, display: 'grid', placeItems: 'center', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: 17 }}>
            S
          </Box>
          <Typography variant="h3" component="span" sx={{ fontSize: 19 }}>
            ShopSmart{' '}
            <Box component="span" sx={{ fontFamily: monoFont, fontSize: 11, color: colors.accent, fontWeight: 500 }}>
              ADMIN
            </Box>
          </Typography>
        </Box>

        <Box component="nav" aria-label="Admin" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box component={NavLink} to="/admin/products" sx={linkSx}>
            <Inventory2OutlinedIcon fontSize="small" />
            Products
          </Box>
          <Box component={NavLink} to="/admin/orders" sx={linkSx}>
            <ReceiptLongOutlinedIcon fontSize="small" />
            Orders
            {pending > 0 && (
              <Box component="span" aria-label={`${pending} waiting`} sx={{ ml: 'auto', fontFamily: monoFont, fontSize: 12, bgcolor: colors.accent, color: colors.ink, px: 0.875, py: 0.25, borderRadius: 2.5 }}>
                {pending}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 'auto', borderTop: '1px solid #2E2E35', pt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box component={Link} to="/" sx={linkSx}>
            View store ↗
          </Box>
          <ButtonBase onClick={handleLogout} sx={linkSx}>
            Log out
          </ButtonBase>
        </Box>
      </Box>

      <Box component="main" sx={{ flex: '999 1 560px', minWidth: 0, p: { xs: 2.5, sm: 4 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Suspense here keeps the sidebar visible while the next admin page's code loads */}
        <Suspense fallback={<CircularProgress color="inherit" sx={{ m: 'auto' }} />}>
          {/* Pages read this with useOutletContext() to update the sidebar badge */}
          <Outlet context={{ refreshPending }} />
        </Suspense>
      </Box>
    </Box>
  );
}
