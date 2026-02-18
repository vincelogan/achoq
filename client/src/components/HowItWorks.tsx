import { CheckCircle2, BarChart3, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "Escolha",
    description: "Selecione o que você acredita que vai acontecer no futuro.",
    color: "text-[#D60000]"
  },
  {
    icon: BarChart3,
    title: "Veja",
    description: "Visualize o percentual agregado da opinião coletiva em tempo real.",
    color: "text-[#0047FF]"
  },
  {
    icon: TrendingUp,
    title: "Acompanhe",
    description: "Siga a evolução da expectativa conforme novos fatos surgem.",
    color: "text-black"
  }
];

export default function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 border-y border-gray-200">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Como funciona
          </h2>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Simples, transparente e direto. Sem intermediários.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className={`p-4 rounded-full bg-gray-50 ${step.color}`}>
                <step.icon className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
