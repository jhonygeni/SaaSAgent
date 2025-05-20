
import { Dashboard } from "@/components/Dashboard";

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Dashboard />
      </main>
    </div>
  );
};

export default DashboardPage;
