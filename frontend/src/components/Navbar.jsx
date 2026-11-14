import { useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, Box, Button, Divider, IconButton, InputBase, Menu, MenuItem, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Style for Shop / My orders / Cart. NavLink adds the "active" class on the current page.
const navLinkSx = {
  px: 1.5,
  py: 1.25,
  fontSize: 15,
  fontWeight: 500,
  color: '#3D3D45',
  '&.active': { bgcolor: '#EEEEEA', color: colors.ink, fontWeight: 600 },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [menuAnchor, setMenuAnchor] = useState(null); // the element the account menu opens under

  // Searching sends you to the shop page with ?search=... in the URL
  const handleSearch = (e) => {
    e.preventDefault();
    const text = search.trim();
    navigate(text ? `/?search=${encodeURIComponent(text)}` : '/');
  };

  const handleLogout = () => {
    setMenuAnchor(null);
    logout();
    navigate('/');
  };

  return (
    <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: `1px solid ${colors.border}` }}>
      <Box
        sx={{
          maxWidth: 1240,
          mx: 'auto',
          px: 3,
          py: 1.75,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '14px 28px',
        }}
      >
        <Logo />

        <Box
          component="form"
          role="search"
          onSubmit={handleSearch}
          sx={{
            flex: '1 1 300px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: 44,
            pl: 1.5,
            pr: 0.75,
            bgcolor: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 2,
          }}
        >
          <SearchIcon sx={{ color: colors.muted, fontSize: 20 }} />
          <InputBase
            type="search"
            placeholder="Search products, brands…"
            inputProps={{ 'aria-label': 'Search products' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: 15 }}
          />
          <Button type="submit" variant="contained" size="small" sx={{ height: 34, px: 1.75, borderRadius: 1.5 }}>
            Search
          </Button>
        </Box>

        <Box component="nav" aria-label="Main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Button component={NavLink} to="/" end sx={navLinkSx}>
            Shop
          </Button>
          <Button component={NavLink} to="/orders" sx={navLinkSx}>
            My orders
          </Button>
          <Button component={NavLink} to="/cart" startIcon={<ShoppingCartOutlinedIcon />} sx={navLinkSx}>
            Cart
          </Button>

          {user ? (
            <>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label={`Account: ${user.name}`} sx={{ ml: 0.75, p: 0 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: colors.primary, fontSize: 15, fontWeight: 600 }}>
                  {user.name[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography fontWeight={600}>{user.name}</Typography>
                  <Typography fontSize={13} color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem component={Link} to="/orders" onClick={() => setMenuAnchor(null)}>
                  My orders
                </MenuItem>
                <MenuItem onClick={handleLogout}>Log out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} to="/login" variant="contained" sx={{ ml: 0.75 }}>
              Log in
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
