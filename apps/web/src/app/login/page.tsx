import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-brand-surface pt-24 pb-16">
        <div className="oc-container-wide flex min-h-[70vh] items-center justify-center">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
