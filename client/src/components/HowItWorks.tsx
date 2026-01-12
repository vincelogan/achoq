import { ArrowRight } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Escolha um Evento",
    description: "Navegue por mercados de Política, Economia ou Esportes. Encontre um evento onde você tem uma opinião forte.",
    icon: "/images/icon-politics.png",
    color: "bg-primary"
  },
  {
    id: "02",
    title: "Compre suas Ações",
    description: "Se você acha que um resultado vai acontecer, compre 'Sim'. O preço reflete a probabilidade atual (ex: R$ 0,60 = 60%).",
    icon: "/images/icon-economy.png",
    color: "bg-acid-green"
  },
  {
    id: "03",
    title: "Negocie ou Aguarde",
    description: "Venda suas posições a qualquer momento para realizar lucros ou cortar perdas, ou espere até o fim do evento.",
    icon: "/images/icon-sports.png",
    color: "bg-hot-pink"
  },
  {
    id: "04",
    title: "Receba o Prêmio",
    description: "Se sua previsão estiver correta quando o mercado for resolvido, cada ação sua valerá exatamente R$ 1,00.",
    icon: null, // Special case for last step
    color: "bg-black text-white"
  }
];

export default function HowItWorks() {
  return (
    <section className="w-full py-20 md:py-32 bg-white border-b-2 border-black">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="inline-block border-2 border-black bg-acid-green px-3 py-1 neo-shadow mb-4 rotate-[1deg]">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-black">Tutorial Rápido</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase leading-none">
              Como Funciona <br/> o <span className="text-primary">AchoQ</span>?
            </h2>
          </div>
          <p className="max-w-md text-lg font-mono text-muted-foreground text-right md:text-left">
            Simples, transparente e direto. Sem intermediários complicados, apenas você e o mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-[2px] bg-black -z-10 -translate-x-1/2">
                  <div className="absolute right-0 -top-[5px] w-3 h-3 bg-black rotate-45"></div>
                </div>
              )}
              
              <div className={`h-full border-2 border-black p-6 flex flex-col justify-between neo-shadow group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] group-hover:shadow-[8px_8px_0px_0px_#000] transition-all duration-200 bg-white`}>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-4xl font-black font-mono opacity-20 ${step.id === '04' ? 'text-black' : ''}`}>{step.id}</span>
                    {step.icon ? (
                      <div className="w-12 h-12 border-2 border-black p-1">
                        <img src={step.icon} alt={step.title} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 border-2 border-black bg-acid-green flex items-center justify-center">
                        <span className="font-bold text-2xl text-black">$</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold uppercase mb-3">{step.title}</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="mt-6 lg:hidden flex justify-center">
                    <ArrowRight className="h-6 w-6 text-black rotate-90" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
