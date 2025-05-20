
import { Login } from "@/components/Login";
import { Header } from "@/components/Header";

const LoginPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Login />
      </main>
    </div>
  );
};

export default LoginPage;
