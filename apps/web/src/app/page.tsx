import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-w-0 overflow-x-clip">
        <HeroSection />
        <InteractiveDemo />
        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
}
