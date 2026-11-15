import { colors } from '../../theme';

// Shared look for the admin tables (products and orders)
export const tableSx = {
  bgcolor: 'background.paper',
  border: `1px solid ${colors.border}`,
  borderRadius: 2.5,
  overflowX: 'auto', // the table scrolls sideways on small screens, not the whole page
  '& table': { width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 },
  '& th': { textAlign: 'left', fontWeight: 500, color: 'text.secondary', bgcolor: '#FAFAF8', py: 1.5, px: 2 },
  '& td': { borderTop: '1px solid #EEEEEA', py: 1.5, px: 2 },
  '& th:first-of-type, & td:first-of-type': { pl: 2.5 },
  '& th:last-of-type, & td:last-of-type': { pr: 2.5 },
};
