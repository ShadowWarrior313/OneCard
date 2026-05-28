import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginFormFallback() {
  return (
    <div
      className="h-[420px] w-full max-w-md animate-pulse rounded-2xl bg-white/60 ring-1 ring-zinc-200/80"
      aria-hidden
    />
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-brand-surface pt-24 pb-16">
        <div className="oc-container-wide flex min-h-[70vh] items-center justify-center">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
