import { Info } from "lucide-react";

export default function Methodology() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Metodologia
          </h2>
          <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            O AchoQ é uma plataforma digital de participação aberta. Os percentuais representam a distribuição das escolhas realizadas pelos participantes.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="flex flex-col space-y-4 p-6 bg-muted rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-brand" />
              <h3 className="text-xl font-bold">O que somos</h3>
            </div>
            <p className="text-muted-foreground">
              Uma plataforma de expectativa coletiva que agrega a opinião dos usuários sobre eventos futuros.
            </p>
          </div>

          <div className="flex flex-col space-y-4 p-6 bg-muted rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-vote-a" />
              <h3 className="text-xl font-bold">O que não somos</h3>
            </div>
            <p className="text-muted-foreground">
              Não somos uma pesquisa eleitoral registrada. Não constituímos plataforma de investimento ou mercado financeiro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
