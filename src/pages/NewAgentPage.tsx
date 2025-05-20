
import { NewAgentForm } from "@/components/NewAgentForm";

const NewAgentPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <NewAgentForm />
      </main>
    </div>
  );
};

export default NewAgentPage;
