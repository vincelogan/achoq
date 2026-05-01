import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, TrendingUp, Info } from "lucide-react";

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

  const shareText = `O AchoQ mostra ${stats.left}% de expectativa para ESQUERDA em 2026. E você, o que acha?`;
  const shareUrl = "https://achoq.com.br"; // Placeholder

  return (
    <section className="relative w-full py-8 md:py-16 bg-gray-50/50">
      <div className="container px-4 md:px-6 max-w-4xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Quem você acha que vence 2026?
          </h1>
          <p className="text-gray-500 text-sm md:text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Plataforma de Expectativa Coletiva • {stats.total.toLocaleString()} participações
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Mercado Ativo</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-800 transition-colors">
              <Info className="w-4 h-4" />
              Regras
            </div>
          </div>

          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {!hasVoted ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between text-sm text-gray-500 mb-2 px-1">
                    <span>Registre sua opinião</span>
                    <span>Probabilidade atual</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleVote("left")}
                      className="group relative w-full bg-white border border-gray-200 hover:border-[#B91C1C] transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center hover:shadow-sm"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-lg font-bold text-gray-900 group-hover:text-[#B91C1C] transition-colors">Esquerda</span>
                        <span className="text-xs text-gray-500">Campo Progressista</span>
                      </div>
                      <div className="bg-gray-50 group-hover:bg-[#B91C1C]/10 text-gray-900 group-hover:text-[#B91C1C] px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm sm:text-lg transition-colors shrink-0">
                        {stats.left}%
                      </div>
                    </button>

                    <button 
                      onClick={() => handleVote("right")}
                      className="group relative w-full bg-white border border-gray-200 hover:border-[#002B5C] transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center hover:shadow-sm"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-lg font-bold text-gray-900 group-hover:text-[#002B5C] transition-colors">Direita</span>
                        <span className="text-xs text-gray-500">Campo Conservador</span>
                      </div>
                      <div className="bg-gray-50 group-hover:bg-[#002B5C]/10 text-gray-900 group-hover:text-[#002B5C] px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm sm:text-lg transition-colors shrink-0">
                        {stats.right}%
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Sua opinião:</span>
                    <span className={`font-bold uppercase text-sm px-3 py-1 rounded-md ${vote === 'left' ? 'bg-[#B91C1C]/10 text-[#B91C1C]' : 'bg-[#002B5C]/10 text-[#002B5C]'}`}>
                      {vote === 'left' ? 'Esquerda' : 'Direita'}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-[#B91C1C]">{stats.left}%</div>
                        <div className="text-sm font-medium text-gray-500 uppercase">Esquerda</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-3xl font-bold text-[#002B5C]">{stats.right}%</div>
                        <div className="text-sm font-medium text-gray-500 uppercase">Direita</div>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#B91C1C] transition-all duration-1000" style={{ width: `${stats.left}%` }} />
                      <div className="h-full bg-[#002B5C] transition-all duration-1000" style={{ width: `${stats.right}%` }} />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button 
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`, '_blank')}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </Button>
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
