import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Notice from './components/Notice';
import ProtectedRoute from './components/ProtectedRoute';
import ShopLayout from './components/ShopLayout';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import NotFound from './pages/NotFound';
import OrderSuccess from './pages/OrderSuccess';
import ProductDetails from './pages/ProductDetails';
import Register from './pages/Register';

// Admin code is only downloaded when an admin opens it, so customers get a smaller bundle
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));

const pageLoader = (
  <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
    <CircularProgress color="inherit" />
  </Box>
);

// URL → page
export default function App() {
  return (
    <>
      <Routes>
        {/* Pages with the navbar */}
        <Route element={<ShopLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* Need a login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:id/success" element={<OrderSuccess />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Full-screen pages without the navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin: own layout with a sidebar, admins only */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={pageLoader}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Route>
      </Routes>

      {/* Messages like "You've been logged out", shown on top of whichever page is open */}
      <Notice />
    </>
  );
}
