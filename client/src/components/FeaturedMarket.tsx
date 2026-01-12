import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

export default function FeaturedMarket() {
  return (
    <section className="w-full py-20 bg-muted/30 border-b-2 border-black">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-block border-2 border-black bg-white px-3 py-1 neo-shadow">
              <span className="font-mono text-xs font-bold uppercase tracking-widest">Mercado em Destaque</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black uppercase leading-none">
              Quem vencerá as eleições presidenciais de 2026?
            </h2>
            
            <p className="text-lg font-mono text-muted-foreground">
              Este mercado será resolvido quando o Tribunal Superior Eleitoral (TSE) anunciar oficialmente o vencedor das eleições presidenciais de 2026.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-2 border-black bg-white neo-shadow">
                <div className="text-sm font-mono text-muted-foreground mb-1">Volume Total</div>
                <div className="text-2xl font-bold font-mono">R$ 12.4M</div>
              </div>
              <div className="p-4 border-2 border-black bg-white neo-shadow">
                <div className="text-sm font-mono text-muted-foreground mb-1">Data de Fim</div>
                <div className="text-2xl font-bold font-mono">Out 2026</div>
              </div>
            </div>
          </div>

          {/* Right Card - The Market */}
          <div className="flex-1 w-full">
            <Card className="border-2 border-black rounded-none neo-shadow overflow-hidden">
              <CardHeader className="border-b-2 border-black bg-gray-50 p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="font-mono text-sm uppercase text-muted-foreground">Probabilidades em Tempo Real</CardTitle>
                  <Info className="h-5 w-5 text-black" />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Chart Placeholder */}
                <div className="relative h-64 w-full bg-black border-b-2 border-black overflow-hidden group">
                  <img 
                    src="/images/market-chart-preview.jpg" 
                    alt="Market Trend Chart" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-black text-white px-2 py-1 font-mono text-xs border border-white/20">
                    Tendência 30 Dias
                  </div>
                </div>
                
                {/* Betting Options */}
                <div className="p-6 space-y-4 bg-white">
                  
                  {/* Option 1 */}
                  <div className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary flex items-center justify-center border-2 border-black">
                          <span className="font-bold text-white">D</span>
                        </div>
                        <div>
                          <div className="font-bold text-lg leading-none">Direita</div>
                          <div className="text-xs font-mono text-muted-foreground">Candidato da Coalizão</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">55%</div>
                        <div className="text-xs font-mono text-acid-green flex items-center justify-end gap-1">
                          <TrendingUp className="h-3 w-3" /> R$ 0,55
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-200 border border-black relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-primary w-[55%]"></div>
                    </div>
                    <Button className="w-full mt-3 font-mono font-bold border-2 border-black rounded-none bg-white hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 h-0 group-hover:h-10 overflow-hidden">
                      Comprar "Sim"
                    </Button>
                  </div>

                  {/* Option 2 */}
                  <div className="group relative pt-4 border-t-2 border-dashed border-gray-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-accent flex items-center justify-center border-2 border-black">
                          <span className="font-bold text-white">E</span>
                        </div>
                        <div>
                          <div className="font-bold text-lg leading-none">Esquerda</div>
                          <div className="text-xs font-mono text-muted-foreground">Candidato da Coalizão</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-accent">45%</div>
                        <div className="text-xs font-mono text-hot-pink flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3" /> R$ 0,45
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-200 border border-black relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-accent w-[45%]"></div>
                    </div>
                    <Button className="w-full mt-3 font-mono font-bold border-2 border-black rounded-none bg-white hover:bg-accent hover:text-white transition-all opacity-0 group-hover:opacity-100 h-0 group-hover:h-10 overflow-hidden">
                      Comprar "Sim"
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
