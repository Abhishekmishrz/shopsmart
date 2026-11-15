import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../api/axios';
import StatusChip from '../components/StatusChip';
import { formatDate, formatPrice, orderNumber, plural } from '../utils/format';
import { colors } from '../theme';

const TABS = ['All', 'Placed', 'Shipped', 'Delivered', 'Cancelled'];
const STEPS = ['Placed', 'Shipped', 'Delivered'];

// Three bars that fill up as the order moves along
function OrderProgress({ order }) {
  const reached = STEPS.indexOf(order.status); // -1 when cancelled
  return (
    <Box component="ol" aria-label="Order progress" sx={{ listStyle: 'none', m: 0, px: 2.5, pb: 2.5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
      {STEPS.map((step, i) => (
        <Box component="li" key={step} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: i <= reached ? colors.primary : colors.border }} />
          <Typography sx={{ fontSize: 14, fontWeight: i <= reached ? 600 : 400, color: i <= reached ? 'text.primary' : 'text.secondary' }}>
            {step}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function OrderCard({ order, expanded, onToggle, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  const cancel = async () => {
    if (!window.confirm('Cancel this order? The items will go back in stock.')) return;
    setCancelling(true);
    setError('');
    try {
      await onCancel(order._id);
    } catch (err) {
      setError(err.message);
    }
    setCancelling(false);
  };

  return (
    <Box component="article" sx={{ bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5, mb: 1.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, p: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="mono" sx={{ fontSize: 15 }}>
            {orderNumber(order._id)}
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Placed {formatDate(order.createdAt)} · {plural(itemCount, 'item')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StatusChip status={order.status} />
          <Typography variant="mono" sx={{ fontSize: 17 }}>
            {formatPrice(order.totalAmount)}
          </Typography>
          <IconButton
            aria-label={expanded ? 'Hide order details' : 'Show order details'}
            aria-expanded={expanded}
            onClick={onToggle}
            sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        {order.status !== 'Cancelled' && <OrderProgress order={order} />}
        {error && (
          <Alert severity="error" sx={{ mx: 2.5, mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, px: 2.5, pb: 2.5 }}>
          {order.items.map((item) => (
            <Box key={item.product} component="span" sx={{ fontSize: 14, bgcolor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.25, py: 0.75 }}>
              {item.name} × {item.qty}
            </Box>
          ))}
          {order.status === 'Placed' && (
            <Button color="error" variant="outlined" size="small" loading={cancelling} onClick={cancel} sx={{ ml: 'auto' }}>
              Cancel order
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .get('/orders/my')
      .then(({ data }) => {
        setOrders(data.orders);
        setExpandedId(data.orders[0]?._id); // open the newest order
      })
      .catch((err) => setError(err.message));
  }, []);

  // Cancel on the server, then swap in the updated order from the response
  const cancelOrder = async (id) => {
    const { data } = await api.put(`/orders/${id}/cancel`);
    setOrders((current) => current.map((o) => (o._id === id ? data.order : o)));
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!orders) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  const shown = tab === 'All' ? orders : orders.filter((o) => o.status === tab);

  return (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Typography variant="h1" sx={{ fontSize: 34, letterSpacing: '-0.02em', mb: 0.75 }}>
        My orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {plural(orders.length, 'order')}
      </Typography>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #C9C9C2', borderRadius: 2.5 }}>
          <Typography variant="h4" component="p" sx={{ mb: 2.5 }}>
            You haven't ordered anything yet
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">
            Start shopping
          </Button>
        </Box>
      ) : (
        <>
          <Box role="tablist" aria-label="Filter by status" sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
            {TABS.map((name) => (
              <Button
                key={name}
                role="tab"
                aria-selected={tab === name}
                variant={tab === name ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setTab(name)}
                sx={{ height: 36, px: 2 }}
              >
                {name}
              </Button>
            ))}
          </Box>

          {shown.length === 0 && <Typography color="text.secondary">No {tab.toLowerCase()} orders.</Typography>}

          {shown.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              expanded={expandedId === order._id}
              onToggle={() => setExpandedId(expandedId === order._id ? null : order._id)}
              onCancel={cancelOrder}
            />
          ))}
        </>
      )}
    </Box>
  );
}
