
import { WhatsAppConnection } from "@/components/WhatsAppConnection";
import { Header } from "@/components/Header";

const ConnectPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <WhatsAppConnection />
      </main>
    </div>
  );
};

export default ConnectPage;
