import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import ProductImage from './ProductImage';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';

// Low stock warning on the tile: "Only 2 left" or "Sold out"
function StockBadge({ stock }) {
  if (stock > 3) return null;
  return (
    <Box sx={{ alignSelf: 'flex-end', bgcolor: '#FFFFFF', color: colors.error, fontSize: 12, fontWeight: 600, px: 1, py: 0.5, borderRadius: 1 }}>
      {stock === 0 ? 'Sold out' : `Only ${stock} left`}
    </Box>
  );
}

export default function ProductCard({ product }) {
  return (
    <Card sx={{ borderRadius: 2.5, height: '100%' }}>
      <CardActionArea
        component={Link}
        to={`/product/${product._id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <ProductImage product={product} sx={{ aspectRatio: '4 / 3', borderRadius: 0 }}>
          <StockBadge stock={product.stock} />
        </ProductImage>
        <Box sx={{ px: 2, pt: 1.75, pb: 2, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{product.brand}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.35, flex: 1 }}>{product.name}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.25 }}>
            <Typography variant="mono" sx={{ fontSize: 16 }}>
              {formatPrice(product.price)}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>View →</Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
