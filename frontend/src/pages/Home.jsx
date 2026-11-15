import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, MenuItem, Pagination, TextField, Typography } from '@mui/material';
import api from '../api/axios';
import FilterPanel from '../components/FilterPanel';
import ProductCard from '../components/ProductCard';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  ['newest', 'Newest first'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name: A to Z'],
];

// All filters live in the URL (/?category=Footwear&sort=price_asc&page=2),
// so refresh, the back button and shared links all keep them.
export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null); // { products, total, pages }
  const [error, setError] = useState('');

  const query = searchParams.toString(); // a plain string, safe to use as an effect dependency
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  // Category names and counts, loaded once
  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  // Products: load again whenever the URL query changes
  useEffect(() => {
    let ignore = false; // if the query changes before this answer arrives, drop the old answer
    api
      .get('/products', { params: { ...Object.fromEntries(new URLSearchParams(query)), limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (!ignore) {
          setResult(data);
          setError('');
        }
      })
      .catch((err) => !ignore && setError(err.message));
    return () => {
      ignore = true;
    };
  }, [query]);

  // Change some URL params; empty values are removed. Any filter change goes back to page 1.
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  };

  const applyFilters = (draft) =>
    updateParams({
      category: draft.categories.join(','),
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      inStock: draft.inStock ? 'true' : '',
    });

  const clearFilters = () => setSearchParams(search ? { search } : {});

  const changePage = (_, value) => {
    updateParams({ page: value > 1 ? String(value) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtersFromUrl = {
    categories: searchParams.get('category')?.split(',') || [],
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true',
  };

  const first = result ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = result ? first + result.products.length - 1 : 0;

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <div>
          <Typography variant="h1" sx={{ fontSize: 34, letterSpacing: '-0.02em' }}>
            {search ? `Results for “${search}”` : 'All products'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {result && (result.total ? `Showing ${first}–${last} of ${result.total} products` : 'No products found')}
          </Typography>
        </div>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
          sx={{ minWidth: 200 }}
        >
          {SORT_OPTIONS.map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3.5, alignItems: 'flex-start' }}>
        {/* key: when the URL changes (e.g. "Clear all"), start the panel fresh from the URL */}
        <FilterPanel
          key={query}
          categories={categories}
          initial={filtersFromUrl}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        <Box component="section" aria-label="Products" sx={{ flex: '999 1 560px', minWidth: 0 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {!result && !error && (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}>
              <CircularProgress color="inherit" />
            </Box>
          )}

          {result?.total === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #C9C9C2', borderRadius: 2.5 }}>
              <Typography variant="h4" component="p" sx={{ mb: 1 }}>
                Nothing matches these filters
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                Try a different search or remove a filter.
              </Typography>
              <Button variant="outlined" onClick={() => setSearchParams({})}>
                Show all products
              </Button>
            </Box>
          )}

          {result?.total > 0 && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
                {result.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </Box>
              {result.pages > 1 && (
                <Pagination
                  count={result.pages}
                  page={page}
                  onChange={changePage}
                  shape="rounded"
                  variant="outlined"
                  sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
}
