import { Box } from '@mui/material';
import { CATEGORY_TINTS } from '../utils/format';
import { monoFont } from '../theme';

// Coloured placeholder until products have photos. Shows the image if one is set.
export default function ProductImage({ product, label = true, sx, children }) {
  return (
    <Box
      sx={{
        bgcolor: CATEGORY_TINTS[product.category] || '#EEEEEA',
        backgroundImage: product.image ? `url(${product.image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1.5,
        ...sx,
      }}
    >
      {children || <span />}
      {label && !product.image && (
        <Box component="span" sx={{ fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', color: '#3D3D45' }}>
          {product.category.toUpperCase()}
        </Box>
      )}
    </Box>
  );
}
