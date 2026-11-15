import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, MenuItem, Snackbar, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api/axios';
import StatusChip from '../../components/StatusChip';
import useDebounce from '../../hooks/useDebounce';
import { formatDate, formatPrice, orderNumber } from '../../utils/format';
import { colors, monoFont } from '../../theme';
import { tableSx } from './adminStyles';

const PAGE_SIZE = 20;
const TABS = ['All', 'Placed', 'Shipped', 'Delivered', 'Cancelled'];

// Same rules as the backend: where an order may go from each status
const NEXT_STATUS = {
  Placed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrders() {
  const { refreshPending } = useOutletContext(); // from AdminLayout: updates the sidebar badge
  const [tab, setTab] = useState('Placed'); // start on what needs attention
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null); // { orders, total, pages, counts }
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState('');

  const debouncedSearch = useDebounce(search.trim());

  useEffect(() => {
    let ignore = false;
    const params = { status: tab === 'All' ? '' : tab, search: debouncedSearch, page, limit: PAGE_SIZE };
    api
      .get('/orders', { params })
      .then(({ data }) => {
        if (ignore) return;
        setResult(data);
        setError('');
      })
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [tab, debouncedSearch, page, reloadKey]);

  const changeStatus = async (order, status) => {
    setSavingId(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status });
      setToast(`${orderNumber(order._id)} marked as ${status}`);
      refreshPending();
      setReloadKey((k) => k + 1); // reload: the order may leave this tab, and counts change
    } catch (err) {
      setError(err.message);
    }
    setSavingId(null);
  };

  const counts = result?.counts;

  return (
    <>
      <div>
        <Typography variant="h1" sx={{ fontSize: 30, letterSpacing: '-0.02em' }}>
          Orders
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {counts ? `${counts.Placed} ${counts.Placed === 1 ? 'order' : 'orders'} waiting to ship` : '…'}
        </Typography>
      </div>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1.5 }}>
        <Box role="tablist" aria-label="Filter by status" sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {TABS.map((name) => (
            <Button
              key={name}
              role="tab"
              aria-selected={tab === name}
              variant={tab === name ? 'contained' : 'outlined'}
              onClick={() => {
                setTab(name);
                setPage(1);
              }}
              sx={{ height: 40, px: 1.75, borderRadius: 5, gap: 0.75 }}
            >
              {name}
              {counts && (
                <Box component="span" sx={{ fontFamily: monoFont, color: tab === name ? colors.accent : 'text.secondary' }}>
                  {counts[name]}
                </Box>
              )}
            </Button>
          ))}
        </Box>
        <TextField
          size="small"
          type="search"
          placeholder="Order ID or customer"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ flex: '0 1 280px' }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search orders' },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={tableSx}>
        <table>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Date</th>
              <th scope="col">Items</th>
              <Box component="th" scope="col" sx={{ textAlign: 'right !important' }}>
                Total
              </Box>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {result?.orders.map((order) => {
              const options = [order.status, ...NEXT_STATUS[order.status]];
              const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
              return (
                <tr key={order._id}>
                  <td>
                    <Typography variant="mono">{orderNumber(order._id)}</Typography>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {order.shippingAddress.fullName}
                      </Box>
                      <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {order.shippingAddress.city} · {order.user?.email}
                      </Box>
                    </Box>
                  </td>
                  <Box component="td" sx={{ color: '#3D3D45', whiteSpace: 'nowrap' }}>
                    {formatDate(order.createdAt)}
                  </Box>
                  <td>
                    <Typography variant="mono">{itemCount}</Typography>
                  </td>
                  <Box component="td" sx={{ textAlign: 'right' }}>
                    <Typography variant="mono">{formatPrice(order.totalAmount)}</Typography>
                  </Box>
                  <td>
                    {/* Finished orders can't change, so show a chip instead of a dropdown */}
                    {options.length === 1 ? (
                      <StatusChip status={order.status} />
                    ) : (
                      <TextField
                        select
                        size="small"
                        value={order.status}
                        disabled={savingId === order._id}
                        onChange={(e) => changeStatus(order, e.target.value)}
                        sx={{ minWidth: 140 }}
                        slotProps={{ htmlInput: { 'aria-label': `Status of ${orderNumber(order._id)}` } }}
                      >
                        {options.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </td>
                </tr>
              );
            })}
            {result?.orders.length === 0 && (
              <tr>
                <Box component="td" colSpan={6} sx={{ textAlign: 'center', py: '40px !important', color: 'text.secondary' }}>
                  {debouncedSearch ? 'No orders match your search.' : `No ${tab === 'All' ? '' : tab.toLowerCase() + ' '}orders.`}
                </Box>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {result?.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
          <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outlined" size="small" disabled={page >= result.pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </Box>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </>
  );
}
