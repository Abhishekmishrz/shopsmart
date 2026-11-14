import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Link, Typography } from '@mui/material';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// 0-4: one point each for length 6+, length 10+, a number, a symbol or capital
const passwordScore = (password) =>
  [password.length >= 6, password.length >= 10, /\d/.test(password), /[^a-z0-9]/.test(password)].filter(Boolean)
    .length;

const scoreColor = (score) => (score <= 1 ? colors.error : score === 2 ? colors.accent : colors.success);

// Same rules as the backend, checked here first so the user gets instant feedback
const validate = ({ name, email, password, confirm }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name';
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address';
  if (password.length < 6) errors.password = 'At least 6 characters';
  if (confirm !== password) errors.confirm = "Passwords don't match";
  return errors;
};

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined }); // clear that field's error while typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError('');
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email, form.password);
    } catch (err) {
      setServerError(err.message); // e.g. "This email is already registered"
      setSubmitting(false);
    }
  };

  const score = passwordScore(form.password);

  return (
    <AuthLayout>
      <div>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Create account
        </Typography>
        <Typography color="text.secondary">
          Already have one?{' '}
          <Link component={RouterLink} to="/login" state={location.state} underline="none" fontWeight={600}>
            Log in
          </Link>
        </Typography>
      </div>

      {serverError && <Alert severity="error">{serverError}</Alert>}

      {/* noValidate: use our messages instead of the browser's popups */}
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={Boolean(errors.name)}
          helperText={errors.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={Boolean(errors.email)}
          helperText={errors.email}
        />
        <Box>
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password || 'At least 6 characters'}
          />
          {form.password && (
            <Box aria-hidden sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
              {[1, 2, 3, 4].map((step) => (
                <Box
                  key={step}
                  sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: step <= score ? scoreColor(score) : colors.border }}
                />
              ))}
            </Box>
          )}
        </Box>
        <FormField
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={Boolean(errors.confirm)}
          helperText={errors.confirm}
        />
        <Button type="submit" variant="contained" size="large" loading={submitting} sx={{ mt: 0.5 }}>
          Create account
        </Button>
      </Box>

      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        Your password is stored as a secure hash. We never see it.
      </Typography>
    </AuthLayout>
  );
}
