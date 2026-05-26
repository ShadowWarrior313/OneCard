import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";

export default function SimulatorPage() {
  return (
    <>
      <Header />
      <main className="min-w-0 overflow-x-hidden pt-16">
        <ScenarioSimulator />
      </main>
      <Footer />
    </>
  );
}
