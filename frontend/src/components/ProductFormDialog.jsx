import { useState } from 'react';
import { Alert, Box, Button, Dialog, IconButton, MenuItem, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../api/axios';
import FormField from './FormField';
import ProductImage from './ProductImage';
import { CATEGORY_TINTS } from '../utils/format';
import { colors, monoFont } from '../theme';

const CATEGORIES = Object.keys(CATEGORY_TINTS);
const EMPTY = { name: '', description: '', price: '', stock: '', category: 'Footwear', brand: '', image: '' };

// Same rules as the Product model
const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!(Number(form.price) >= 1)) errors.price = 'Price must be greater than 0';
  if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) errors.stock = 'Stock must be 0 or more';
  if (!form.brand.trim()) errors.brand = 'Brand is required';
  if (form.image && !/^https?:\/\//.test(form.image)) errors.image = 'Must start with http:// or https://';
  return errors;
};

// One dialog for both Add and Edit. product = null means "Add".
// The parent re-creates it (key) each time it opens, so the form starts fresh.
export default function ProductFormDialog({ open, product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product, price: String(product.price), stock: String(product.stock) } : EMPTY));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      brand: form.brand.trim(),
      image: form.image.trim(),
    };

    setSaving(true);
    setServerError('');
    try {
      const { data } = isEdit ? await api.put(`/products/${product._id}`, body) : await api.post('/products', body);
      onSaved(data.product, isEdit);
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <FormField
      label={label}
      name={name}
      value={form[name]}
      onChange={handleChange}
      error={Boolean(errors[name])}
      helperText={errors[name]}
      {...props}
    />
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth aria-labelledby="product-dialog-title">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 3, py: 2.5, borderBottom: `1px solid ${colors.border}` }}>
        <div>
          <Typography id="product-dialog-title" variant="h3" component="h2">
            {isEdit ? 'Edit product' : 'Add product'}
          </Typography>
          {isEdit && (
            <Typography sx={{ fontFamily: monoFont, fontSize: 12, color: 'text.secondary', mt: 0.5 }}>ID {product._id}</Typography>
          )}
        </div>
        <IconButton aria-label="Close" onClick={onClose} disabled={saving}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit}>
        {serverError && (
          <Alert severity="error" sx={{ mx: 3, mt: 3 }}>
            {serverError}
          </Alert>
        )}

        <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>Image</Typography>
            {/* Live preview: updates as the URL or category changes */}
            <ProductImage product={form} sx={{ aspectRatio: '1 / 1' }} />
            {field('image', 'Image URL', { type: 'url', placeholder: 'https://… (optional)' })}
          </Box>

          <Box sx={{ flex: '999 1 360px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ gridColumn: '1 / -1' }}>{field('name', 'Name')}</Box>
            <Box sx={{ gridColumn: '1 / -1' }}>{field('description', 'Description', { multiline: true, minRows: 3 })}</Box>
            {field('price', 'Price (₹)', { type: 'number', slotProps: { htmlInput: { min: 1 } } })}
            {field('stock', 'Stock', { type: 'number', slotProps: { htmlInput: { min: 0, step: 1 } } })}
            {field('category', 'Category', {
              select: true,
              children: CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              )),
            })}
            {field('brand', 'Brand')}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.25, px: 3, py: 2, borderTop: `1px solid ${colors.border}` }}>
          <Button variant="outlined" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
