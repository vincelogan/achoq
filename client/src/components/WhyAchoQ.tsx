import { Check } from "lucide-react";

export default function WhyAchoQ() {
  return (
    <section className="w-full py-20 bg-black text-white border-b-2 border-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <h2 className="text-4xl md:text-6xl font-black uppercase leading-none mb-8">
              Por que o <span className="text-acid-green">AchoQ</span>?
            </h2>
            <p className="text-xl font-mono text-gray-400 mb-12 max-w-lg">
              "AchoQ não é apenas um jogo, é inteligência coletiva."
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 border-2 border-white bg-primary flex items-center justify-center neo-shadow shadow-white">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase mb-2">Dados Reais</h3>
                  <p className="font-mono text-gray-400">
                    Onde há dinheiro envolvido, a informação é mais precisa. Pesquisas erram, o mercado ajusta.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 border-2 border-white bg-hot-pink flex items-center justify-center neo-shadow shadow-white">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase mb-2">Transparência Total</h3>
                  <p className="font-mono text-gray-400">
                    Todas as transações são auditáveis. Sem caixas pretas, sem algoritmos ocultos.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 border-2 border-white bg-acid-green flex items-center justify-center neo-shadow shadow-white">
                  <Check className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold uppercase mb-2">Interface Simples</h3>
                  <p className="font-mono text-gray-400">
                    Feito para o brasileiro. Sem termos complicados de Wall Street, sem barreiras técnicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative h-full min-h-[400px] border-2 border-white p-4 neo-shadow shadow-white bg-zinc-900">
            <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-8 border border-white/20">
              <div className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-acid-green to-hot-pink animate-pulse">
                100%
              </div>
              <div className="text-2xl font-mono uppercase tracking-widest mb-8">
                Colateralizado
              </div>
              <p className="font-mono text-sm text-gray-400 max-w-xs">
                Cada ação é garantida por fundos reais. Se você ganha, o dinheiro já está lá esperando por você.
              </p>
            </div>
            
            {/* Decorative Grid */}
            <div className="absolute top-0 right-0 w-20 h-20 border-l-2 border-b-2 border-white/20"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-r-2 border-t-2 border-white/20"></div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
