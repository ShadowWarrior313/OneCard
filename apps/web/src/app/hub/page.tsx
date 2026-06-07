import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Dashboard } from "@/hub/Dashboard";
import { HUB_UI_ENABLED } from "@/flags";

export default function HubPage() {
  // Feature-flagged OFF by default: with the flag off this route 404s, so it is
  // not a reachable public page and the site stays visually unchanged.
  if (!HUB_UI_ENABLED) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-surface pt-16">
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
