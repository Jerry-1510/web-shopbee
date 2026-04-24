import React, { createContext, useEffect, useState, useContext } from "react";
import type { Product } from "../types";
import { useAuth } from "./AuthContext";
import { productApi } from "../utils/api";

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType>(
  {} as CartContextType
);

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { token } = useAuth();
  type ServerCartItem = {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  };

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await productApi.getCart(token);
        const items = ((res.data?.items || []) as (ServerCartItem & { stock: number })[]).map(
          (i) => ({
            id: String(i.product),
            _id: String(i.product),
            name: i.name,
            price: i.price,
            originalPrice: i.price,
            discount: 0,
            image: i.image,
            rating: 0,
            sold: 0,
            category: "",
            isMall: false,
            stock: i.stock || 0,
            quantity: i.quantity,
          })
        );
        setCart(items);
      } catch {
        setCart([]);
      }
    };
    load();
  }, [token]);

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      const stock = product.stock ?? 0;
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + quantity, stock);
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantity, stock) }];
    });
    if (token) {
      productApi
        .addToCart({ productId: String(product.id), quantity }, token)
        .catch(() => {});
    }
  };

  const removeFromCart = (productId: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    if (token) {
      productApi.removeCartItem(String(productId), token).catch(() => {});
    }
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find((i) => i.id === productId);
    const stock = item?.stock ?? 0;
    const finalQty = Math.min(quantity, stock);

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: finalQty } : item
      )
    );
    if (token) {
      productApi
        .updateCartItem(String(productId), { quantity: finalQty }, token)
        .catch((err) => {
          const errMsg = err.response?.data?.message;
          if (errMsg) alert(errMsg);
        });
    }
  };

  const clearCart = () => {
    setCart([]);
    if (token) {
      productApi.clearCart(token).catch(() => {});
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};



