import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Button, Drawer, IconButton, InputBase, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';
import StatusChip from './StatusChip';
import { formatPrice } from '../utils/format';
import { colors, monoFont } from '../theme';

const SUGGESTIONS = ['Gifts under ₹1,000', 'Compare earbuds and headphones', 'Where is my last order?'];

const bubbleSx = { maxWidth: '85%', px: 1.75, py: 1.5, fontSize: 15, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };
const cardSx = { display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5, p: 1.25 };

// "searchProducts · query: running shoes · maxPrice: 2000": shows which function the AI called
function ToolChip({ call }) {
  const args = Object.entries(call.args).map(([key, value]) => `${key}: ${value}`);
  return (
    <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: '#EEF1FF', color: '#1A33A6', fontFamily: monoFont, fontSize: 12 }}>
      <BoltRoundedIcon sx={{ fontSize: 14 }} />
      {[call.name, ...(args.length ? args : ['latest'])].join(' · ')}
    </Box>
  );
}

function ProductRow({ product, onNavigate }) {
  const { addItem, items } = useCart();
  const inCart = items.some((item) => item._id === product.id);
  // The API sends "id"; the cart and the rest of the app use "_id"
  const asCartProduct = { _id: product.id, name: product.name, brand: product.brand, category: product.category, price: product.price, stock: product.stock, image: product.image };

  return (
    <Box sx={cardSx}>
      <ProductImage product={product} label={false} sx={{ width: 56, height: 56, flex: 'none', p: 0 }} />
      <Box component={Link} to={`/product/${product.id}`} onClick={onNavigate} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25, color: 'text.primary', textDecoration: 'none' }}>
        <Box component="span" sx={{ fontWeight: 600, fontSize: 14 }}>
          {product.name}
        </Box>
        <Box component="span" sx={{ fontSize: 14 }}>
          <Typography variant="mono" sx={{ fontSize: 14 }}>
            {formatPrice(product.price)}
          </Typography>
          <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
            {' '}
            · {product.stock <= 3 ? `only ${product.stock} left` : 'in stock'}
          </Box>
        </Box>
      </Box>
      <Button
        variant={inCart ? 'outlined' : 'contained'}
        size="small"
        startIcon={inCart ? <CheckIcon /> : null}
        onClick={() => addItem(asCartProduct)}
        aria-label={`Add ${product.name} to cart`}
        sx={{ height: 40, flex: 'none' }}
      >
        {inCart ? 'Added' : 'Add'}
      </Button>
    </Box>
  );
}

function OrderRow({ order, onNavigate }) {
  return (
    <Box component={Link} to="/orders" onClick={onNavigate} sx={{ ...cardSx, justifyContent: 'space-between', px: 1.75, py: 1.5, color: 'text.primary', textDecoration: 'none' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography variant="mono" sx={{ fontSize: 14 }}>
          {order.orderNumber}
        </Typography>
        <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {formatPrice(order.total)}
        </Box>
      </Box>
      <StatusChip status={order.status} />
    </Box>
  );
}

// Three dots that pulse while we wait for the AI
function Typing() {
  return (
    <Box aria-label="Assistant is typing" sx={{ ...bubbleSx, alignSelf: 'flex-start', bgcolor: 'background.paper', border: '1px solid #EEEEEA', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: colors.muted,
            animation: 'chatDot 1.2s infinite',
            animationDelay: `${i * 0.15}s`,
            '@keyframes chatDot': { '0%, 80%, 100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
          }}
        />
      ))}
    </Box>
  );
}

function Message({ message, onNavigate }) {
  if (message.role === 'user') {
    return (
      <Box sx={{ ...bubbleSx, alignSelf: 'flex-end', bgcolor: colors.ink, color: '#FFFFFF', borderRadius: '14px 4px 14px 14px' }}>
        {message.content}
      </Box>
    );
  }
  return (
    <>
      {message.toolCalls?.map((call, i) => (
        <ToolChip key={i} call={call} />
      ))}
      <Box sx={{ alignSelf: 'flex-start', width: '92%', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box
          sx={{
            ...bubbleSx,
            maxWidth: '100%',
            alignSelf: 'flex-start',
            bgcolor: message.error ? '#FDE7E5' : 'background.paper',
            color: message.error ? '#8A1C12' : 'text.primary',
            border: `1px solid ${message.error ? '#F6CFCB' : '#EEEEEA'}`,
            borderRadius: '4px 14px 14px 14px',
          }}
        >
          {message.content}
        </Box>
        {message.products?.map((product) => (
          <ProductRow key={product.id} product={product} onNavigate={onNavigate} />
        ))}
        {message.orders?.map((order) => (
          <OrderRow key={order.orderNumber} order={order} onNavigate={onNavigate} />
        ))}
      </Box>
    </>
  );
}

export default function ChatWidget({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const welcome = {
    role: 'assistant',
    local: true, // shown in the chat, but never sent to the API
    content: user
      ? `Hi ${user.name.split(' ')[0]}! I can find products, compare prices and check your orders. What are you looking for?`
      : 'Hi! I can find products, compare prices and check your orders. Log in to start chatting.',
  };
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending) return;

    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      // The server keeps no chat history, so send the conversation each time (text only)
      const history = next.filter((m) => !m.local && !m.error).map(({ role, content }) => ({ role, content }));
      const { data } = await api.post('/chat', { messages: history });
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply, products: data.products, orders: data.orders, toolCalls: data.toolCalls },
      ]);
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', content: err.message, error: true }]);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      keepMounted // keep the conversation while the panel is closed
      slotProps={{
        transition: { onEntered: () => inputRef.current?.focus() },
        paper: {
          'aria-label': 'ShopSmart AI assistant',
          sx: {
            width: { xs: '100%', sm: 460 },
            height: { xs: '100%', sm: 'calc(100% - 48px)' },
            m: { sm: 3 },
            borderRadius: { sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box component="header" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2.5, pr: 2, py: 2, borderBottom: '1px solid #EEEEEA' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: colors.primary, color: '#FFFFFF', display: 'grid', placeItems: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
            ShopSmart AI
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Searches the live catalogue and your orders</Typography>
        </Box>
        <IconButton aria-label="Close assistant" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box role="log" aria-live="polite" sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#FAFAF8' }}>
        {messages.map((message, i) => (
          <Message key={i} message={message} onNavigate={onClose} />
        ))}
        {sending && <Typing />}
        <div ref={endRef} />
      </Box>

      <Box sx={{ px: 2, pt: 1.5, pb: 2, borderTop: '1px solid #EEEEEA', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {user ? (
          <>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((text) => (
                <Button key={text} variant="outlined" size="small" disabled={sending} onClick={() => send(text)} sx={{ height: 34, borderRadius: 4.25, fontWeight: 500 }}>
                  {text}
                </Button>
              ))}
            </Box>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center', border: `1px solid ${colors.inputBorder}`, borderRadius: 2.5, pl: 1.75, pr: 0.5, py: 0.5 }}>
              <InputBase
                inputRef={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products or orders…"
                slotProps={{ input: { 'aria-label': 'Message the assistant', maxLength: 1000 } }}
                sx={{ flex: 1, fontSize: 15, height: 44 }}
              />
              <IconButton
                type="submit"
                aria-label="Send"
                disabled={sending || !input.trim()}
                sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: colors.primary, color: '#FFFFFF', '&:hover': { bgcolor: '#1A33A6' }, '&.Mui-disabled': { bgcolor: '#C9D1F5', color: '#FFFFFF' } }}
              >
                <SendRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        ) : (
          <Button component={Link} to="/login" state={{ from: location.pathname + location.search }} onClick={onClose} variant="contained" size="large">
            Log in to chat
          </Button>
        )}
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Prices and stock come straight from the store. The AI can still make mistakes.
        </Typography>
      </Box>
    </Drawer>
  );
}
