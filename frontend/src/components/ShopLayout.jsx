import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Every shop page gets the navbar on top. <Outlet /> is where the current page renders.
export default function ShopLayout() {
  return (
    <>
      <Navbar />
      <Box component="main" sx={{ maxWidth: 1240, mx: 'auto', px: 3, py: 4 }}>
        <Outlet />
      </Box>
    </>
  );
}
