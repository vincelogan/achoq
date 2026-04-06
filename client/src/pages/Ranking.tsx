import InstitutionalLayout from "@/components/InstitutionalLayout";
import { trpc } from "@/lib/trpc";
import { Trophy, Users, Activity, TrendingUp, Info, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Ranking() {
  const { data: markets, isLoading } = trpc.markets.list.useQuery();

  return (
    <InstitutionalLayout
      title="Ranking de Participação"
      subtitle="Acompanhe os mercados mais ativos e a distribuição de opiniões da comunidade AchoQ."
      badge="Comunidade"
      breadcrumbs={[{ label: "Ranking" }]}
    >
      {/* Aviso legal */}
      <div className="mb-10 bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Sobre o Ranking</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            O ranking do AchoQ destaca os mercados mais ativos e não representa desempenho
            financeiro, capacidade preditiva científica ou qualquer tipo de recompensa econômica.
            É apenas um indicador de atividade e engajamento dentro da plataforma.
          </p>
        </div>
      </div>

      {/* Mercados mais ativos */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          Mercados em Atividade
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {markets
              ?.sort((a, b) => b.stats.total - a.stats.total)
              .map((market, index) => (
                <Link
                  key={market.id}
                  href={`/mercado/${market.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer block"
                >
                  {/* Posição */}
                  <div className="flex items-center gap-4 md:w-12 shrink-0">
                    <span className={`text-2xl font-black font-mono ${
                      index === 0 ? "text-yellow-500" :
                      index === 1 ? "text-gray-400" :
                      index === 2 ? "text-amber-600" :
                      "text-gray-300"
                    }`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Info do mercado */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                        {market.category === "politica" ? "Política" : "Esportes"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug">
                      {market.title}
                    </h3>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {market.stats.total.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">opiniões</div>
                    </div>

                    {/* Mini barra */}
                    <div className="hidden md:flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#B91C1C]">{market.stats.pctA}%</span>
                        <span className="text-[#002B5C]">{market.stats.pctB}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#B91C1C]"
                          style={{ width: `${market.stats.pctA}%` }}
                        />
                        <div
                          className="h-full bg-[#002B5C]"
                          style={{ width: `${market.stats.pctB}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{market.optionA}</span>
                        <span>{market.optionB}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Critérios do ranking */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Critérios considerados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Activity,
              title: "Frequência",
              desc: "Número de participações registradas no mercado ao longo do tempo.",
            },
            {
              icon: Users,
              title: "Engajamento",
              desc: "Diversidade de participantes únicos que interagiram com o mercado.",
            },
            {
              icon: Trophy,
              title: "Relevância",
              desc: "Importância do tema para a comunidade, medida pelo volume de interações.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Aviso legal:</strong> O ranking do AchoQ não representa desempenho financeiro,
          não mede capacidade preditiva de forma científica e não implica qualquer tipo de
          recompensa econômica. É exclusivamente um indicador de atividade dentro da plataforma
          de opinião coletiva.
        </p>
      </div>
    </InstitutionalLayout>
  );
}
