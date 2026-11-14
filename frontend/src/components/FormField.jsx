import { Box, TextField, Typography } from '@mui/material';

// A label above a text input, like in the mockup (MUI's default label floats inside the box).
// All other props go straight to TextField: name, type, value, onChange, error, helperText...
export default function FormField({ label, name, ...props }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Typography component="label" htmlFor={name} sx={{ fontSize: 14, fontWeight: 500 }}>
        {label}
      </Typography>
      <TextField id={name} name={name} fullWidth {...props} />
    </Box>
  );
}
