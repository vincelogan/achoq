import { CheckCircle2, BarChart3, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "Escolha",
    description: "Selecione o que você acredita que vai acontecer no futuro.",
    color: "text-vote-a"
  },
  {
    icon: BarChart3,
    title: "Veja",
    description: "Visualize o percentual agregado da expectativa coletiva em tempo real.",
    color: "text-brand"
  },
  {
    icon: TrendingUp,
    title: "Acompanhe",
    description: "Siga a evolução da expectativa conforme novos fatos surgem.",
    color: "text-foreground"
  }
];

export default function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted border-y border-border">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Como funciona
          </h2>
          <p className="max-w-[600px] text-muted-foreground text-sm md:text-base">
            Simples, transparente e direto. Sem intermediários.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4 p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-all duration-200">
              <div className={`p-3 rounded-lg bg-muted border border-border/50 ${step.color}`}>
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
