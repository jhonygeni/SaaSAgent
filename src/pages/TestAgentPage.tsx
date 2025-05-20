
import { AgentChat } from "@/components/AgentChat";
import { Header } from "@/components/Header";

const TestAgentPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <AgentChat />
      </main>
    </div>
  );
};

export default TestAgentPage;
