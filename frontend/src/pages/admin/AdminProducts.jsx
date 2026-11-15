import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import api from '../../api/axios';
import ProductFormDialog from '../../components/ProductFormDialog';
import ProductImage from '../../components/ProductImage';
import useDebounce from '../../hooks/useDebounce';
import { CATEGORY_TINTS, formatPrice } from '../../utils/format';
import { colors } from '../../theme';
import { tableSx } from './adminStyles';

const PAGE_SIZE = 10;

function StockCell({ stock }) {
  if (stock > 3) return <Typography variant="mono">{stock}</Typography>;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: colors.error, bgcolor: '#FDE7E5', fontSize: 13, fontWeight: 600, px: 1, py: 0.25, borderRadius: 1 }}>
      <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
      {stock === 0 ? 'Out of stock' : `${stock} · Low`}
    </Box>
  );
}

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null); // { products, total, pages }
  const [lowCount, setLowCount] = useState(0);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // bump to load the list again after a change
  const [editing, setEditing] = useState(null); // null = closed, {} = add, { product } = edit
  const [deleting, setDeleting] = useState(null); // product waiting for delete confirmation
  const [toast, setToast] = useState('');

  const debouncedSearch = useDebounce(search.trim());

  // Load the table whenever a filter, the page, or reloadKey changes
  useEffect(() => {
    let ignore = false;
    const params = { search: debouncedSearch, category, stock, page, limit: PAGE_SIZE, sort: 'name' };
    Promise.all([api.get('/products', { params }), api.get('/products', { params: { stock: 'low', limit: 1 } })])
      .then(([list, low]) => {
        if (ignore) return;
        setResult(list.data);
        setLowCount(low.data.total);
        setError('');
      })
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [debouncedSearch, category, stock, page, reloadKey]);

  // Changing a filter goes back to page 1
  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleSaved = (product, isEdit) => {
    setEditing(null);
    setToast(isEdit ? `Saved “${product.name}”` : `Added “${product.name}”`);
    setReloadKey((k) => k + 1);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/products/${deleting._id}`);
      setToast(`Deleted “${deleting.name}”`);
      // Deleting the last row on a page: step back a page
      if (result.products.length === 1 && page > 1) setPage(page - 1);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
    setDeleting(null);
  };

  const first = result ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = result ? first + result.products.length - 1 : 0;

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
        <div>
          <Typography variant="h1" sx={{ fontSize: 30, letterSpacing: '-0.02em' }}>
            Products
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {result ? `${result.total} products` : '…'}
            {lowCount > 0 && ` · ${lowCount} low on stock`}
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})} sx={{ height: 44 }}>
          Add product
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
        <TextField
          size="small"
          type="search"
          placeholder="Search by name or brand"
          value={search}
          onChange={changeFilter(setSearch)}
          sx={{ flex: '1 1 260px' }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            htmlInput: { 'aria-label': 'Search products' },
          }}
        />
        <TextField select size="small" value={category} onChange={changeFilter(setCategory)} sx={{ minWidth: 180 }} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': 'Category' } }}>
          <MenuItem value="">All categories</MenuItem>
          {Object.keys(CATEGORY_TINTS).map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" value={stock} onChange={changeFilter(setStock)} sx={{ minWidth: 160 }} slotProps={{ select: { displayEmpty: true }, htmlInput: { 'aria-label': 'Stock' } }}>
          <MenuItem value="">Any stock</MenuItem>
          <MenuItem value="low">Low stock</MenuItem>
          <MenuItem value="out">Out of stock</MenuItem>
        </TextField>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={tableSx}>
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <Box component="th" scope="col" sx={{ textAlign: 'right !important' }}>
                Price
              </Box>
              <th scope="col">Stock</th>
              <Box component="th" scope="col" sx={{ textAlign: 'right !important' }}>
                Actions
              </Box>
            </tr>
          </thead>
          <tbody>
            {result?.products.map((product) => (
              <tr key={product._id}>
                <td>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ProductImage product={product} label={false} sx={{ width: 40, height: 40, flex: 'none', borderRadius: 1.5, p: 0 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Box>
                      <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {product.brand}
                      </Box>
                    </Box>
                  </Box>
                </td>
                <td>{product.category}</td>
                <Box component="td" sx={{ textAlign: 'right' }}>
                  <Typography variant="mono">{formatPrice(product.price)}</Typography>
                </Box>
                <td>
                  <StockCell stock={product.stock} />
                </td>
                <Box component="td" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <IconButton aria-label={`Edit ${product.name}`} onClick={() => setEditing({ product })}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label={`Delete ${product.name}`} onClick={() => setDeleting(product)} sx={{ color: colors.error }}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </tr>
            ))}
            {result?.products.length === 0 && (
              <tr>
                <Box component="td" colSpan={5} sx={{ textAlign: 'center', py: '40px !important', color: 'text.secondary' }}>
                  No products match these filters.
                </Box>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {result?.total > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: 'text.secondary' }}>
          <span>
            Showing {first}–{last} of {result.total}
          </span>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outlined" size="small" disabled={page >= result.pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </Box>
        </Box>
      )}

      {editing && (
        <ProductFormDialog
          key={editing.product?._id || 'new'}
          open
          product={editing.product}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete this product?</DialogTitle>
        <DialogContent>
          <Typography>
            “{deleting?.name}” will be removed from the shop. Past orders keep their own copy of its name and price.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </>
  );
}
