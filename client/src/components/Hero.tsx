import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full border-b-2 border-black overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 opacity-10">
        <img 
          src="/images/hero-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container relative z-10 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 border-2 border-black bg-secondary px-4 py-1 mb-8 neo-shadow rotate-[-2deg]">
          <span className="font-mono text-sm font-bold uppercase">Eleições 2026: Mercado Aberto</span>
        </div>
        
        <h1 className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
          Onde o Brasil <br/>
          <span className="text-primary bg-black/5 px-2">Aposta no Futuro</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl font-mono text-muted-foreground mb-10 bg-white/80 p-2 border border-black/10 backdrop-blur-sm">
          Transforme sua intuição em ativos. Acompanhe as probabilidades reais das eleições de 2026 baseadas no mercado, não apenas em pesquisas.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button size="lg" className="h-14 px-8 text-lg font-mono font-bold border-2 border-black rounded-none bg-primary text-white hover:bg-primary/90 neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all">
            Ver Mercados Ativos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-mono font-bold border-2 border-black rounded-none bg-white hover:bg-accent hover:text-white neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all">
            Entrar na Lista de Espera
          </Button>
        </div>
      </div>
      
      {/* Ticker Tape */}
      <div className="w-full bg-black text-white py-3 border-y-2 border-black overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block">
          <span className="mx-4 font-mono font-bold text-lg">LULA 45%</span>
          <span className="mx-4 font-mono font-bold text-lg text-acid-green">▲ 2.1%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">TARCÍSIO 32%</span>
          <span className="mx-4 font-mono font-bold text-lg text-hot-pink">▼ 0.5%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">CAIADO 8%</span>
          <span className="mx-4 font-mono font-bold text-lg text-acid-green">▲ 0.2%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">ZEMA 5%</span>
          <span className="mx-4 font-mono font-bold text-lg text-gray-400">- 0.0%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">OUTROS 10%</span>
          <span className="mx-4 font-mono font-bold text-lg text-hot-pink">▼ 1.8%</span>
          <span className="mx-8 text-gray-500">|</span>
           <span className="mx-4 font-mono font-bold text-lg">LULA 45%</span>
          <span className="mx-4 font-mono font-bold text-lg text-acid-green">▲ 2.1%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">TARCÍSIO 32%</span>
          <span className="mx-4 font-mono font-bold text-lg text-hot-pink">▼ 0.5%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">CAIADO 8%</span>
          <span className="mx-4 font-mono font-bold text-lg text-acid-green">▲ 0.2%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">ZEMA 5%</span>
          <span className="mx-4 font-mono font-bold text-lg text-gray-400">- 0.0%</span>
          <span className="mx-8 text-gray-500">|</span>
          <span className="mx-4 font-mono font-bold text-lg">OUTROS 10%</span>
          <span className="mx-4 font-mono font-bold text-lg text-hot-pink">▼ 1.8%</span>
        </div>
      </div>
    </section>
  );
}
