
import { NewAgentForm } from "@/components/NewAgentForm";
import { Header } from "@/components/Header";

const NewAgentPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <NewAgentForm />
      </main>
    </div>
  );
};

export default NewAgentPage;
