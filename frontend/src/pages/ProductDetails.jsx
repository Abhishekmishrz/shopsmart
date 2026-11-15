import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link, Snackbar, Typography } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import QuantityPicker from '../components/QuantityPicker';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import { colors, monoFont } from '../theme';

function StockStatus({ stock }) {
  const color = stock === 0 ? colors.error : stock <= 3 ? '#B54708' : colors.success;
  const label = stock === 0 ? 'Out of stock' : stock <= 3 ? `Only ${stock} left` : 'In stock';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 15 }}>
      <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
      <Box component="span" sx={{ color, fontWeight: 600 }}>
        {label}
      </Box>
      {stock > 3 && (
        <Box component="span" sx={{ color: 'text.secondary' }}>
          · {stock} units available
        </Box>
      )}
    </Box>
  );
}

// key={id}: clicking a related product gives a fresh page, so quantity and data reset by themselves
export default function ProductDetailsPage() {
  const { id } = useParams(); // the :id part of /product/:id
  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }) {
  const { addItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Load the product, then 4 others from the same category
  useEffect(() => {
    let ignore = false;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (ignore) return;
        setProduct(data.product);
        return api.get('/products', { params: { category: data.product.category, limit: 5 } });
      })
      .then((res) => {
        if (!ignore && res) setRelated(res.data.products.filter((p) => p._id !== id).slice(0, 4));
      })
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!product) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // Can't add more than what's left after what's already in the cart
  const inCart = items.find((item) => item._id === product._id)?.qty || 0;
  const canAdd = product.stock - inCart;

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setQty(1);
  };

  return (
    <>
      <Box component="nav" aria-label="Breadcrumb" sx={{ fontSize: 14, color: 'text.secondary', display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Link component={RouterLink} to="/" underline="hover">
          Shop
        </Link>
        <span aria-hidden>/</span>
        <Link component={RouterLink} to={`/?category=${product.category}`} underline="hover">
          {product.category}
        </Link>
        <span aria-hidden>/</span>
        <Box component="span" sx={{ color: 'text.primary' }}>
          {product.name}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'flex-start' }}>
        <ProductImage
          product={product}
          label={false}
          sx={{ flex: '1 1 420px', minWidth: 0, aspectRatio: '1 / 1', borderRadius: 3, justifyContent: 'flex-end', p: 2.5 }}
        >
          <Box component="span" sx={{ fontFamily: monoFont, fontSize: 12, letterSpacing: '0.08em', color: '#3D3D45' }}>
            PRODUCT IMAGE · {product.category.toUpperCase()}
          </Box>
        </ProductImage>

        <Box sx={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.primary, mb: 1 }}>{product.brand}</Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: 30, sm: 38 } }}>
              {product.name}
            </Typography>
          </div>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.75, flexWrap: 'wrap' }}>
            <Typography variant="mono" sx={{ fontSize: 30 }}>
              {formatPrice(product.price)}
            </Typography>
            <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Inclusive of all taxes</Typography>
          </Box>

          <StockStatus stock={product.stock} />

          {product.stock > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', color: 'text.secondary' }}>
                QUANTITY
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <QuantityPicker value={qty} max={Math.max(canAdd, 1)} onChange={setQty} />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartOutlinedIcon />}
                  disabled={canAdd < 1}
                  onClick={handleAdd}
                  sx={{ flex: '1 1 200px' }}
                >
                  {canAdd < 1 ? 'All in your cart' : 'Add to cart'}
                </Button>
              </Box>
              {inCart > 0 && (
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                  {inCart} in your cart ·{' '}
                  <Link component={RouterLink} to="/cart" underline="hover" fontWeight={600}>
                    View cart
                  </Link>
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ borderTop: `1px solid ${colors.border}`, pt: 2.5 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1.25 }}>
              Description
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.65, color: '#3D3D45' }}>{product.description}</Typography>
          </Box>

          {/* Rounded corners go on a wrapper, since tables ignore border-radius */}
          <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${colors.border}`, borderRadius: 2.5, overflow: 'hidden' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, '& tr:first-of-type > *': { borderTop: 0 } }}>
            <tbody>
              {[
                ['Category', product.category],
                ['Brand', product.brand],
                ['Product ID', <Box key="id" component="span" sx={{ fontFamily: monoFont, fontSize: 13 }}>{product._id}</Box>],
                ['Delivery', 'Free, cash on delivery'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <Box component="th" scope="row" sx={{ textAlign: 'left', fontWeight: 500, color: 'text.secondary', px: 2, py: 1.25, borderTop: '1px solid #EEEEEA', width: '40%' }}>
                    {label}
                  </Box>
                  <Box component="td" sx={{ px: 2, py: 1.25, borderTop: '1px solid #EEEEEA', wordBreak: 'break-all' }}>
                    {value}
                  </Box>
                </tr>
              ))}
            </tbody>
          </Box>
          </Box>
        </Box>
      </Box>

      {related.length > 0 && (
        <Box component="section" aria-labelledby="related" sx={{ mt: 7 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
            <Typography id="related" variant="h3" component="h2">
              More in {product.category}
            </Typography>
            <Link component={RouterLink} to={`/?category=${product.category}`} underline="none" fontWeight={600} fontSize={14}>
              See all →
            </Link>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </Box>
        </Box>
      )}

      <Snackbar
        open={added}
        autoHideDuration={3000}
        onClose={() => setAdded(false)}
        message="Added to cart"
        action={
          <Button color="secondary" size="small" component={RouterLink} to="/cart">
            View cart
          </Button>
        }
      />
    </>
  );
}
