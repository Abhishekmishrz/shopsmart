import { useState } from 'react';
import { Box, Button, Fab } from '@mui/material';
import { Outlet } from 'react-router-dom';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ChatWidget from './ChatWidget';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { colors, monoFont } from '../theme';

// Black strip under the navbar that points people to the assistant
function AnnouncementBar({ onOpen }) {
  return (
    <Box sx={{ bgcolor: colors.ink, color: '#FFFFFF' }}>
      <Box sx={{ maxWidth: 1240, mx: 'auto', px: 3, py: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', fontSize: 14 }}>
        <Box component="span" sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', bgcolor: colors.accent, color: colors.ink, px: 1, py: 0.375, borderRadius: 1, fontWeight: 500 }}>
          NEW
        </Box>
        <span>Don't scroll, ask. Try “running shoes under ₹2000” in the shopping assistant.</span>
        <Button onClick={onOpen} size="small" sx={{ color: colors.accent, p: 0, minWidth: 0, fontSize: 14 }}>
          Open assistant →
        </Button>
      </Box>
    </Box>
  );
}

// Every shop page gets the navbar on top and the AI assistant.
// <Outlet /> is where the current page renders.
export default function ShopLayout() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const openChat = () => setChatOpen(true);

  return (
    <>
      <Navbar />
      <AnnouncementBar onOpen={openChat} />
      <Box component="main" sx={{ maxWidth: 1240, mx: 'auto', px: 3, pt: 4, pb: 12 }}>
        <Outlet />
      </Box>

      {!chatOpen && (
        <Fab
          variant="extended"
          color="primary"
          onClick={openChat}
          sx={{ position: 'fixed', right: 24, bottom: 24, height: 52, px: 2.5, gap: 1.25, textTransform: 'none', fontSize: 15, fontWeight: 600, boxShadow: '0 6px 20px rgba(22, 22, 26, 0.18)' }}
        >
          <ChatBubbleOutlineRoundedIcon />
          Ask ShopSmart AI
        </Fab>
      )}

      {/* key: a different user (or logging out) starts a fresh conversation */}
      <ChatWidget key={user?._id || 'guest'} open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
