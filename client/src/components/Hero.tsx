import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, TrendingUp } from "lucide-react";

export default function Hero() {
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState<"left" | "right" | null>(null);
  
  // Mock data for initial state
  const [stats, setStats] = useState({
    left: 54,
    right: 46,
    total: 128392
  });

  const handleVote = (side: "left" | "right") => {
    setVote(side);
    setHasVoted(true);
    // In a real app, this would send data to backend
  };

  const shareText = `O ACHOQ mostra ${stats.left}% de expectativa para ESQUERDA em 2026. E você, o que acha?`;
  const shareUrl = "https://achoq.com.br"; // Placeholder

  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 bg-white overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-8 text-center">
          
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-black uppercase leading-[0.9]">
              O Brasil acha que <br className="hidden sm:inline" />
              <span className="text-gray-400">quem vence 2026?</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl font-medium">
              Veja a expectativa coletiva em tempo real.
            </p>
          </div>

          <div className="w-full max-w-4xl mt-8">
            <AnimatePresence mode="wait">
              {!hasVoted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full"
                >
                  <button 
                    onClick={() => handleVote("left")}
                    className="group relative h-32 md:h-48 w-full bg-[#D60000] hover:bg-[#B00000] transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center overflow-hidden"
                  >
                    <span className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter z-10">Esquerda</span>
                    <span className="text-white/80 text-sm md:text-base font-medium mt-2 z-10">(Campo Progressista)</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>

                  <button 
                    onClick={() => handleVote("right")}
                    className="group relative h-32 md:h-48 w-full bg-[#0047FF] hover:bg-[#0033CC] transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center overflow-hidden"
                  >
                    <span className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter z-10">Direita</span>
                    <span className="text-white/80 text-sm md:text-base font-medium mt-2 z-10">(Campo Conservador)</span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-6 md:p-12"
                >
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    <div className="text-center md:text-left w-full">
                      <div className="text-[#D60000] text-6xl md:text-8xl font-black tracking-tighter leading-none">{stats.left}%</div>
                      <div className="text-gray-500 font-bold uppercase tracking-wide mt-2">Esquerda</div>
                    </div>
                    
                    <div className="h-px w-full md:w-px md:h-32 bg-gray-200" />
                    
                    <div className="text-center md:text-right w-full">
                      <div className="text-[#0047FF] text-6xl md:text-8xl font-black tracking-tighter leading-none">{stats.right}%</div>
                      <div className="text-gray-500 font-bold uppercase tracking-wide mt-2">Direita</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-8 flex">
                    <div className="h-full bg-[#D60000]" style={{ width: `${stats.left}%` }} />
                    <div className="h-full bg-[#0047FF]" style={{ width: `${stats.right}%` }} />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Atualizado em tempo real • {stats.total.toLocaleString()} participações
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                      <Button 
                        className="flex-1 md:flex-none bg-black text-white hover:bg-gray-800 font-bold rounded-lg h-12 px-6"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`, '_blank')}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar Resultado
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
