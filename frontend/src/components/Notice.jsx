import { Alert, Snackbar } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Short success message at the bottom of the screen, e.g. "You've been logged out".
// Lives in App, outside the pages, so it still shows after moving to another page.
export default function Notice() {
  const { notice, closeNotice } = useAuth();

  return (
    <Snackbar
      open={notice.open}
      autoHideDuration={3000}
      onClose={(_, reason) => reason !== 'clickaway' && closeNotice()} // a click elsewhere shouldn't hide it at once
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" variant="filled" onClose={closeNotice} sx={{ alignItems: 'center' }}>
        {notice.message}
      </Alert>
    </Snackbar>
  );
}
