import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="relative min-h-[calc(100vh-4rem)] pt-24 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple-soft/40 via-brand-cream to-brand-ocean-soft/30" />
        <div className="oc-container-wide relative flex min-h-[70vh] items-center justify-center">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
