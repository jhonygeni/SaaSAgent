
import { PricingPlans } from "@/components/PricingPlans";
import { Header } from "@/components/Header";

const PlansPage = () => {
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
