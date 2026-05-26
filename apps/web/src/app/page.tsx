import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { Waitlist } from "@/components/Waitlist";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { ProductVideoSection } from "@/components/ProductVideoSection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <BentoGrid />
        <ScenarioSimulator />
        <ProductVideoSection />
        <TrustSection />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
