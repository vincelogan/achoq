import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrendChart from "@/components/TrendChart";
import Demographics from "@/components/Demographics";
import HowItWorks from "@/components/HowItWorks";
import Methodology from "@/components/Methodology";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-[#0047FF] selection:text-white">
      <Header />
      <main className="flex-1">
        <Hero />
        <TrendChart />
        <HowItWorks />
        <Demographics />
        <Methodology />
        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
