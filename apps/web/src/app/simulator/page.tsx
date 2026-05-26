import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";

export default function SimulatorPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <ScenarioSimulator />
      </main>
      <Footer />
    </>
  );
}
