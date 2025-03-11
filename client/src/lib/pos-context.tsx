import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { CartItem } from "@shared/schema";

interface POSContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotals: () => { subtotal: string; tax: string; total: string };
  activeModule: string;
  setActiveModule: (module: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeModule, setActiveModule] = useState("sales");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Add item to cart or update quantity if it exists
  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.productId === item.productId
      );

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.productId === item.productId
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      }

      return [...prevCart, item];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  // Update item quantity in cart
  const updateCartItemQuantity = (productId: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate cart totals
  const getCartTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const taxRate = 0.1; // 10% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    };
  };

  // Create context value
  const contextValue = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      getCartTotals,
      activeModule,
      setActiveModule,
      paymentMethod,
      setPaymentMethod,
    }),
    [cart, activeModule, paymentMethod]
  );

  return (
    <POSContext.Provider value={contextValue}>{children}</POSContext.Provider>
  );
}

export function usePos() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePos must be used within a PosProvider");
  }
  return context;
}
