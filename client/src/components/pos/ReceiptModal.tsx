import { useState } from "react";
import { X, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePos } from "@/lib/pos-context";
import { format } from "date-fns";

interface ReceiptModalProps {
  onClose: () => void;
}

export default function ReceiptModal({ onClose }: ReceiptModalProps) {
  const { cart, getCartTotals, paymentMethod, clearCart } = usePos();
  const [receiptId] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [timestamp] = useState(new Date());
  
  const { subtotal, tax, total } = getCartTotals();
  
  // Format the date for the receipt
  const formattedDate = format(timestamp, "MM/dd/yyyy HH:mm");
  
  // Print receipt
  const handlePrintReceipt = () => {
    window.print();
  };
  
  // Email receipt
  const handleEmailReceipt = () => {
    // In a real app, this would open a dialog to enter email
    alert("Email receipt functionality would be implemented here");
  };
  
  // Close and reset
  const handleCloseReceipt = () => {
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={handleCloseReceipt}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">Receipt</h3>
          <button 
            className="text-gray-400 hover:text-gray-500"
            onClick={handleCloseReceipt}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 border-t border-b py-4">
          <div className="text-center mb-4">
            <h4 className="font-bold text-lg">FitPOS 헬스용품</h4>
            <p className="text-sm text-gray-500">서울시 강남구 헬스로 123</p>
            <p className="text-sm text-gray-500">Tel: (123) 456-7890</p>
            <p className="text-xs text-gray-500 mt-1">Receipt #{receiptId} - {formattedDate}</p>
          </div>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>${tax}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Payment Method: {paymentMethod || "Credit Card"}</p>
            <p className="mt-2">Thank you for your purchase!</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEmailReceipt}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Receipt
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handlePrintReceipt}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
