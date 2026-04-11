import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Activity } from "lucide-react";

type Market = {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  stats: { yes: number; no: number; total: number };
};

const markets: Market[] = [
  {
    id: "copa-2026",
    title: "Você acha que o Brasil vai ganhar a Copa do Mundo 2026?",
    category: "Esportes",
    icon: Trophy,
    stats: { yes: 68, no: 32, total: 45120 }
  },
  {
    id: "neymar-copa",
    title: "Você acha que Neymar vai ser convocado para a Copa?",
    category: "Esportes",
    icon: Activity,
    stats: { yes: 82, no: 18, total: 52300 }
  }
];

export default function OtherMarkets() {
  const [votes, setVotes] = useState<Record<string, "yes" | "no">>({});

  const handleVote = (marketId: string, choice: "yes" | "no") => {
    setVotes(prev => ({ ...prev, [marketId]: choice }));
  };

  return (
    <section className="w-full py-8 md:py-12 bg-white border-t border-gray-100">
      <div className="container px-4 md:px-6 max-w-4xl mx-auto">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Outros Mercados em Destaque
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market) => {
            const hasVoted = !!votes[market.id];
            const vote = votes[market.id];

            return (
              <div key={market.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                  <market.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{market.category}</span>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex-1">
                    {market.title}
                  </h3>

                  <AnimatePresence mode="wait">
                    {!hasVoted ? (
                      <motion.div 
                        key="voting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 gap-3 mt-auto"
                      >
                        <button 
                          onClick={() => handleVote(market.id, "yes")}
                          className="group relative w-full bg-white border border-gray-200 hover:border-[#002B5C] transition-all duration-200 rounded-lg p-3 flex flex-col items-center hover:shadow-sm"
                        >
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#002B5C] transition-colors mb-1">Acho que sim</span>
                          <span className="text-lg font-mono font-bold text-gray-500 group-hover:text-[#002B5C]">{market.stats.yes}%</span>
                        </button>

                        <button 
                          onClick={() => handleVote(market.id, "no")}
                          className="group relative w-full bg-white border border-gray-200 hover:border-[#B91C1C] transition-all duration-200 rounded-lg p-3 flex flex-col items-center hover:shadow-sm"
                        >
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#B91C1C] transition-colors mb-1">Acho que não</span>
                          <span className="text-lg font-mono font-bold text-gray-500 group-hover:text-[#B91C1C]">{market.stats.no}%</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-auto space-y-4"
                      >
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100">
                          <span className="text-xs text-gray-500">Sua opinião:</span>
                          <span className={`font-bold uppercase text-xs px-2 py-1 rounded ${vote === 'yes' ? 'bg-[#002B5C]/10 text-[#002B5C]' : 'bg-[#B91C1C]/10 text-[#B91C1C]'}`}>
                            Acho que {vote === 'yes' ? 'sim' : 'não'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <div className="text-xl font-bold text-[#002B5C]">{market.stats.yes}%</div>
                              <div className="text-xs font-medium text-gray-500 uppercase">Sim</div>
                            </div>
                            <div className="space-y-1 text-right">
                              <div className="text-xl font-bold text-[#B91C1C]">{market.stats.no}%</div>
                              <div className="text-xs font-medium text-gray-500 uppercase">Não</div>
                            </div>
                          </div>

                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-[#002B5C] transition-all duration-1000" style={{ width: `${market.stats.yes}%` }} />
                            <div className="h-full bg-[#B91C1C] transition-all duration-1000" style={{ width: `${market.stats.no}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
