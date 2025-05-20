
import { Register } from "@/components/Register";
import { Header } from "@/components/Header";

const RegisterPage = () => {
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
