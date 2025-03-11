import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { X, Trash2, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePos } from "@/lib/pos-context";
import { CartItem } from "@shared/schema";

interface CartSectionProps {
  onCheckout: () => void;
}

export default function CartSection({ onCheckout }: CartSectionProps) {
  const { toast } = useToast();
  const { cart, removeFromCart, updateCartItemQuantity, clearCart } = usePos();
  const [saleId] = useState(() => Math.floor(1000 + Math.random() * 9000)); // Random 4-digit sale ID
  
  // Calculate cart totals
  const { subtotal, tax, total } = useMemo(() => {
    const subtotalValue = cart.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const taxRate = 0.1; // 10% tax
    const taxValue = subtotalValue * taxRate;
    const totalValue = subtotalValue + taxValue;
    
    return {
      subtotal: subtotalValue.toFixed(2),
      tax: taxValue.toFixed(2),
      total: totalValue.toFixed(2)
    };
  }, [cart]);
  
  // Handle quantity change
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.productId);
      return;
    }
    
    updateCartItemQuantity(item.productId, newQuantity);
  };
  
  // Handle clear cart with confirmation
  const handleClearCart = () => {
    if (cart.length === 0) return;
    
    // In a real app, you might want a confirmation dialog here
    clearCart();
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart."
    });
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }
    
    onCheckout();
  };

  return (
    <div className="w-full lg:w-1/3 bg-neutral-bg border-l flex flex-col">
      {/* Cart Header */}
      <div className="bg-white p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">Current Sale</h2>
        <div className="mt-1 flex justify-between">
          <span className="text-sm text-gray-500">Sale #{saleId}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-sm text-primary hover:text-primary-foreground hover:bg-primary p-0 h-auto"
          >
            <Trash2 className="h-5 w-5 inline mr-1" />
            Clear Cart
          </Button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ShoppingBagIcon className="h-12 w-12 mb-2 text-gray-400" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add items from the product listing</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="bg-white p-3 rounded-lg shadow-sm flex">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                  <button 
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-1 flex justify-between items-center">
                  <div className="flex items-center border rounded-md">
                    <button 
                      className="px-2 py-1 text-gray-600 hover:text-gray-800"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="px-2 py-1 text-sm">{item.quantity}</span>
                    <button 
                      className="px-2 py-1 text-gray-600 hover:text-gray-800"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-medium text-primary">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      <div className="bg-white border-t p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">${subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax (10%)</span>
            <span className="font-medium">${tax}</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t">
            <span className="font-medium">Total</span>
            <span className="font-bold text-primary">${total}</span>
          </div>
        </div>

        {/* Checkout Actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="text-primary border-primary hover:bg-primary hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Hold
          </Button>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleCheckout}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Pay
          </Button>
        </div>

        {/* Payment Methods */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { name: "Cash", icon: BanknotesIcon },
            { name: "Card", icon: CreditCardIcon },
            { name: "Mobile", icon: ShieldCheckIcon },
            { name: "Credit", icon: CalendarIcon }
          ].map((method) => (
            <Button 
              key={method.name} 
              variant="outline" 
              size="sm" 
              className="h-auto py-2 flex flex-col items-center justify-center text-xs"
            >
              <method.icon className="h-6 w-6 mb-1" />
              {method.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Icons for payment methods and empty cart
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function BanknotesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
