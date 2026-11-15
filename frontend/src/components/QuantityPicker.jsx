import { Box, IconButton } from '@mui/material';
import { colors, monoFont } from '../theme';

// − 2 + control. The parent owns the number; this only reports changes.
export default function QuantityPicker({ value, max, onChange, size = 'large' }) {
  const height = size === 'large' ? 52 : 40;
  const buttonSx = { width: height - 4, height: height - 2, borderRadius: 2, fontSize: 20, color: colors.ink };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height,
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <IconButton aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} sx={buttonSx}>
        −
      </IconButton>
      <Box component="span" aria-live="polite" sx={{ width: 36, textAlign: 'center', fontFamily: monoFont, fontSize: 15 }}>
        {value}
      </Box>
      <IconButton aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} sx={buttonSx}>
        +
      </IconButton>
    </Box>
  );
}
