import { useRef, useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, Link, Typography } from '@mui/material';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { monoFont } from '../theme';

// Demo buttons only fill in the email. Passwords never go in frontend code,
// because everything in a VITE_ variable ends up in the public JavaScript.
const demoAccounts = [
  { label: 'Customer', email: import.meta.env.VITE_DEMO_CUSTOMER_EMAIL },
  { label: 'Admin', email: import.meta.env.VITE_DEMO_ADMIN_EMAIL },
].filter((account) => account.email);

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef(null);

  // Already logged in (or just logged in): back to where they came from,
  // otherwise admins go to the admin panel and customers to the shop
  if (user) return <Navigate to={location.state?.from || (user.role === 'admin' ? '/admin' : '/')} replace />;

  // One handler for both inputs: the input's name decides which field changes
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password); // sets user, so the <Navigate> above redirects
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: '' });
    passwordRef.current?.focus();
  };

  return (
    <AuthLayout>
      <div>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Log in
        </Typography>
        <Typography color="text.secondary">
          New here?{' '}
          <Link component={RouterLink} to="/register" state={location.state} underline="none" fontWeight={600}>
            Create an account
          </Link>
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
        />
        <FormField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          inputRef={passwordRef}
          value={form.password}
          onChange={handleChange}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button color="primary" size="small" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button type="submit" variant="contained" size="large" loading={submitting} sx={{ mt: 0.5 }}>
          Log in
        </Button>
      </Box>

      {demoAccounts.length > 0 && (
        <Box sx={{ border: '1px dashed #C9C9C2', borderRadius: 2.5, p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', color: 'text.secondary' }}>
            DEMO ACCOUNTS
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            {demoAccounts.map((account) => (
              <Button key={account.label} variant="outlined" onClick={() => fillDemo(account.email)} sx={{ flex: '1 1 140px', height: 44 }}>
                {account.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </AuthLayout>
  );
}
