
import { LandingPage } from "@/components/LandingPage";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <LandingPage />
      </main>
    </div>
  );
};

export default Index;
