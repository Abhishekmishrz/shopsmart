import { useState } from 'react';
import { Box, Button, Checkbox, TextField, Typography } from '@mui/material';
import { colors, monoFont } from '../theme';

const legendSx = { fontFamily: monoFont, fontSize: 11, letterSpacing: '0.08em', color: 'text.secondary', mb: 1.25, p: 0 };

// The sidebar keeps its own "draft" until Apply is pressed, so the list doesn't reload on every click.
// `initial` comes from the URL; the parent re-creates this panel when the URL changes.
export default function FilterPanel({ categories, initial, onApply, onClear }) {
  const [draft, setDraft] = useState(initial);

  const toggleCategory = (name) => {
    const selected = draft.categories.includes(name)
      ? draft.categories.filter((c) => c !== name)
      : [...draft.categories, name];
    setDraft({ ...draft, categories: selected });
  };

  return (
    <Box
      component="aside"
      aria-label="Filters"
      sx={{
        flex: '1 1 220px',
        maxWidth: { md: 260 },
        bgcolor: 'background.paper',
        border: `1px solid ${colors.border}`,
        borderRadius: 2.5,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Filters
        </Typography>
        <Button color="primary" size="small" onClick={onClear} sx={{ minWidth: 0, px: 0 }}>
          Clear all
        </Button>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography component="legend" sx={legendSx}>
          CATEGORY
        </Typography>
        {categories.map((category) => (
          <Box component="label" key={category.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', fontSize: 15 }}>
            <Checkbox
              size="small"
              checked={draft.categories.includes(category.name)}
              onChange={() => toggleCategory(category.name)}
              sx={{ ml: -1, p: 0.75 }}
            />
            <Box component="span" sx={{ flex: 1 }}>
              {category.name}
            </Box>
            <Typography variant="mono" sx={{ fontSize: 12, color: 'text.secondary' }}>
              {category.count}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
        <Typography component="legend" sx={legendSx}>
          PRICE (₹)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            ['minPrice', 'Min'],
            ['maxPrice', 'Max'],
          ].map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              type="number"
              size="small"
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              slotProps={{ htmlInput: { min: 0 }, inputLabel: { shrink: true } }}
            />
          ))}
        </Box>
      </Box>

      <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', fontSize: 15 }}>
        <Checkbox
          size="small"
          checked={draft.inStock}
          onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
          sx={{ ml: -1, p: 0.75 }}
        />
        In stock only
      </Box>

      <Button variant="contained" onClick={() => onApply(draft)} sx={{ height: 44 }}>
        Apply filters
      </Button>
    </Box>
  );
}
