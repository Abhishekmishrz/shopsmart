import { Route, Routes } from 'react-router-dom';
import ShopLayout from './components/ShopLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// URL → page
export default function App() {
  return (
    <Routes>
      {/* Pages with the navbar */}
      <Route element={<ShopLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Full-screen pages without the navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
