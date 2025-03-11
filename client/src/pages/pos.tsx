import { useState } from "react";
import Header from "@/components/pos/Header";
import SideNav from "@/components/pos/SideNav";
import ProductSection from "@/components/pos/ProductSection";
import CartSection from "@/components/pos/CartSection";
import ReceiptModal from "@/components/pos/ReceiptModal";
import PaymentModal from "@/components/pos/PaymentModal";
import { usePos } from "@/lib/pos-context";
import { useQuery } from "@tanstack/react-query";

export default function POS() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { activeModule } = usePos();
  
  // Fetch cashier info
  const { data: cashier } = useQuery({
    queryKey: ['/api/users/current'],
    queryFn: () => Promise.resolve({ username: "John Doe" }),
    staleTime: Infinity,
  });

  // Show payment modal
  const handleShowPayment = () => {
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handleCompletePayment = () => {
    setShowPaymentModal(false);
    setShowReceiptModal(true);
  };

  // Close receipt modal
  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header cashier={cashier?.username || "Loading..."} />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <SideNav activeModule={activeModule} />
        
        <ProductSection />
        
        <CartSection onCheckout={handleShowPayment} />
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal 
          onClose={() => setShowPaymentModal(false)} 
          onCompletePayment={handleCompletePayment} 
        />
      )}
      
      {showReceiptModal && (
        <ReceiptModal onClose={handleCloseReceipt} />
      )}
    </div>
  );
}
