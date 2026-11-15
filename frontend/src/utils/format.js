// ₹1,899 — Indian number format
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatPrice = (amount) => rupees.format(amount);

// "#SS-A1B2C3": a short, readable order number from the last 6 characters of the MongoDB id
export const orderNumber = (id) => `#SS-${id.slice(-6).toUpperCase()}`;

// "14 Nov 2026"
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// "1 item" / "3 items"
export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

// Products have no photos yet, so each category gets its own coloured tile
export const CATEGORY_TINTS = {
  Footwear: '#E6EBFF',
  Clothing: '#FFF1C7',
  Electronics: '#E3F1E8',
  Home: '#F3E7F1',
  Accessories: '#FBE6DC',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];
