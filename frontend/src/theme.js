import { createTheme } from '@mui/material/styles';

// The colours from the UI mockup, in one place
export const colors = {
  bg: '#F7F7F5',
  surface: '#FFFFFF',
  ink: '#16161A',
  muted: '#5B5B66',
  border: '#E3E3DE',
  inputBorder: '#D4D4CE',
  primary: '#2445D6',
  accent: '#F2B705',
  error: '#B42318',
  success: '#1E6B42',
};

const headingFont = '"Space Grotesk", system-ui, sans-serif';
export const monoFont = '"JetBrains Mono", ui-monospace, monospace';

const theme = createTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.accent, contrastText: colors.ink },
    // Custom colour for the black buttons: <Button color="ink">
    ink: { main: colors.ink, contrastText: '#FFFFFF' },
    error: { main: colors.error },
    success: { main: colors.success },
    text: { primary: colors.ink, secondary: colors.muted },
    background: { default: colors.bg, paper: colors.surface },
    divider: colors.border,
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: { fontFamily: headingFont, fontWeight: 700, fontSize: '3rem', lineHeight: 1.05, letterSpacing: '-0.03em' },
    h2: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.02em' },
    h3: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em' },
    h4: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.01em' },
    h5: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontFamily: headingFont, fontWeight: 600, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 600 },
    // Our own variant for prices and order ids: <Typography variant="mono">
    mono: { fontFamily: monoFont, fontWeight: 500 },
  },

  components: {
    MuiTypography: {
      defaultProps: { variantMapping: { mono: 'span' } },
    },
    // Black, flat buttons everywhere unless a colour is given
    MuiButton: {
      defaultProps: { color: 'ink', disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
        sizeLarge: { height: 52, fontSize: '1rem' },
        outlined: { borderColor: colors.inputBorder, backgroundColor: colors.surface },
      },
    },
    // Flat cards with a 1px border instead of a shadow
    MuiCard: {
      defaultProps: { variant: 'outlined' },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: colors.border } },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { border: `1px solid ${colors.border}`, boxShadow: '0 8px 24px rgba(22, 22, 26, 0.08)' },
      },
    },
    // White inputs, 48px tall, with the mockup's border colour
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.inputBorder },
        },
        input: { padding: '13px 14px', fontSize: 15 },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
  },
});

export default theme;
