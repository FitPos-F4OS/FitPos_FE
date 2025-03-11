import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { usePos } from "@/lib/pos-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface PaymentModalProps {
  onClose: () => void;
  onCompletePayment: () => void;
}

export default function PaymentModal({ onClose, onCompletePayment }: PaymentModalProps) {
  const { toast } = useToast();
  const { cart, getCartTotals, setPaymentMethod } = usePos();
  const { total } = getCartTotals();
  
  const [amountPaid, setAmountPaid] = useState(total);
  const [change, setChange] = useState("0.00");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  
  // Calculate change when amount paid changes
  useEffect(() => {
    const totalValue = parseFloat(total);
    const amountValue = parseFloat(amountPaid);
    
    if (isNaN(amountValue) || amountValue < totalValue) {
      setChange("0.00");
    } else {
      setChange((amountValue - totalValue).toFixed(2));
    }
  }, [amountPaid, total]);
  
  // Create receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/receipts", {
        items: cart,
        subtotal: getCartTotals().subtotal,
        tax: getCartTotals().tax,
        total,
        paymentMethod: selectedPaymentMethod,
      });
    },
    onSuccess: () => {
      // Invalidate products query to update inventory
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Set payment method for receipt
      setPaymentMethod(selectedPaymentMethod);
      
      // Show toast and close
      toast({
        title: "Payment successful",
        description: "Your payment has been processed successfully.",
      });
      
      // Show receipt
      onCompletePayment();
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: `An error occurred: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle payment completion
  const handleCompletePayment = () => {
    if (parseFloat(amountPaid) < parseFloat(total)) {
      toast({
        title: "Insufficient amount",
        description: "The amount paid is less than the total.",
        variant: "destructive",
      });
      return;
    }
    
    createReceiptMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      ></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">Payment</h3>
          <button 
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4">
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-primary">${total}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-700">
                Amount Received
              </label>
              <div className="mt-1">
                <Input
                  id="amount-paid"
                  name="amount-paid"
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label htmlFor="change" className="block text-sm font-medium text-gray-700">
                Change
              </label>
              <div className="mt-1">
                <Input
                  id="change"
                  name="change"
                  type="text"
                  value={change}
                  readOnly
                  className="bg-gray-100 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <Select 
                defaultValue={selectedPaymentMethod} 
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger id="payment-method" className="w-full mt-1">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Mobile Payment">Mobile Payment</SelectItem>
                  <SelectItem value="Store Credit">Store Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleCompletePayment}
            disabled={createReceiptMutation.isPending}
          >
            {createReceiptMutation.isPending ? "Processing..." : "Complete Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
