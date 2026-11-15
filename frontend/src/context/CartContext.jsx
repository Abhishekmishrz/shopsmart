import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

// Read the saved cart once, when the app starts
const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch {
    return []; // broken data in storage: start with an empty cart
  }
};

// Never more than what's in stock, never less than 1
const clampQty = (qty, stock) => Math.max(1, Math.min(qty, stock));

// The cart lives in the browser (no login needed to fill it).
// Each item: { _id, name, brand, category, price, stock, image, qty }
export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  // Save to localStorage every time the cart changes, so a refresh keeps it
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item._id === product._id);
      if (existing) {
        // Already in the cart: increase the quantity instead of adding a second line
        return current.map((item) =>
          item._id === product._id ? { ...item, qty: clampQty(item.qty + qty, product.stock) } : item
        );
      }
      const { _id, name, brand, category, price, stock, image } = product;
      return [...current, { _id, name, brand, category, price, stock, image, qty: clampQty(qty, stock) }];
    });
  };

  const updateQty = (id, qty) =>
    setItems((current) => current.map((item) => (item._id === id ? { ...item, qty: clampQty(qty, item.stock) } : item)));

  const removeItem = (id) => setItems((current) => current.filter((item) => item._id !== id));

  const clearCart = () => setItems([]);

  // Replace saved product details with fresh ones from the API (price or stock may have changed)
  const syncItems = (freshProducts) =>
    setItems((current) =>
      current.flatMap((item) => {
        const fresh = freshProducts.find((p) => p._id === item._id);
        if (!fresh || fresh.stock === 0) return []; // deleted or sold out: drop it
        return [{ ...item, name: fresh.name, price: fresh.price, stock: fresh.stock, image: fresh.image, qty: clampQty(item.qty, fresh.stock) }];
      })
    );

  // Derived values: calculated from items, not stored separately
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext value={{ items, count, subtotal, addItem, updateQty, removeItem, clearCart, syncItems }}>
      {children}
    </CartContext>
  );
}

// The hook lives next to its provider on purpose, so skip the fast-refresh rule here
// eslint-disable-next-line react/only-export-components
export const useCart = () => useContext(CartContext);
