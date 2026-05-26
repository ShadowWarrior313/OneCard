import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Waitlist } from "@/components/Waitlist";

export default function GetStartedPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
