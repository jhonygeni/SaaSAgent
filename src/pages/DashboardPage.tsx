
import { Dashboard } from "@/components/Dashboard";
import { Header } from "@/components/Header";

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Dashboard />
      </main>
    </div>
  );
};

export default DashboardPage;
