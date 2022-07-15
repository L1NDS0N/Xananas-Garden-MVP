import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  /** Subproduto selecionado (muda, enxerto, cor, etc.) — opcional, distingue itens do mesmo produto.
   *  O nome da variação já vem embutido em `name` (ex.: "Rosa do Deserto — Muda"). */
  variantId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {}, updateQuantity: () => {},
  clearCart: () => {}, total: 0, itemCount: 0,
});

export const useCart = () => useContext(CartContext);

const CART_KEY = 'xananas_public_cart';

// Same product but a different variant is a distinct line — key on both.
const sameLine = (a: { productId: string; variantId?: string }, b: { productId: string; variantId?: string }) =>
  a.productId === b.productId && (a.variantId || null) === (b.variantId || null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY);
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => sameLine(i, item));
      if (existing) {
        return prev.map(i => sameLine(i, item) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !sameLine(i, { productId, variantId })));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !sameLine(i, { productId, variantId })));
    } else {
      setItems(prev => prev.map(i => sameLine(i, { productId, variantId }) ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}
