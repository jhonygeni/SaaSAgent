import { Register } from "@/components/Register";
import { Header } from "@/components/Header";
import { useEffect } from "react";

const RegisterPage = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag_conversion_pageview) {
      (window as any).gtag_conversion_pageview();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Register />
      </main>
    </div>
  );
};

export default RegisterPage;
