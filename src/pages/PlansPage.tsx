
import { PricingPlans } from "@/components/PricingPlans";
import { Header } from "@/components/Header";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PlansPage = () => {
  const { checkSubscriptionStatus } = useUser();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check for checkout success or cancellation
  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout_success');
    const checkoutCancelled = searchParams.get('checkout_cancelled');
    
    if (checkoutSuccess) {
      toast({
        title: "Pagamento processado com sucesso",
        description: "Sua assinatura foi ativada. Aproveite seu novo plano!",
      });
    } else if (checkoutCancelled) {
      toast({
        title: "Checkout cancelado",
        description: "O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.",
      });
    }
    
    // Check subscription status on page load
    checkSubscriptionStatus();
  }, [searchParams, checkSubscriptionStatus, toast]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <PricingPlans />
      </main>
    </div>
  );
};

export default PlansPage;
