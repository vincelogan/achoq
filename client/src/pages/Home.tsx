import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedMarket from "@/components/FeaturedMarket";
import HowItWorks from "@/components/HowItWorks";
import WhyAchoQ from "@/components/WhyAchoQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-acid-green selection:text-black">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturedMarket />
        <HowItWorks />
        <WhyAchoQ />
      </main>
      <Footer />
    </div>
  );
}
