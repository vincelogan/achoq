import InstitutionalLayout from "@/components/InstitutionalLayout";
import { PieChart, Database, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function Metodologia() {
  return (
    <InstitutionalLayout
      title="Metodologia"
      subtitle="Como o AchoQ calcula e exibe os percentuais de expectativa coletiva."
      badge="Transparência"
      breadcrumbs={[{ label: "Metodologia" }]}
    >
      {/* Intro */}
      <div className="mb-10">
        <p className="text-lg text-gray-600 leading-relaxed">
          O AchoQ utiliza um modelo simples e transparente de <strong>agregação de opinião</strong>.
          Não há algoritmos ocultos, ponderações secretas ou ajustes editoriais nos percentuais exibidos.
        </p>
      </div>

      {/* Formação dos percentuais */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-gray-500" />
          Formação dos percentuais
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <p className="text-gray-600 leading-relaxed">
            Para cada pergunta ativa na plataforma:
          </p>
          <ul className="space-y-3">
            {[
              "Cada participação corresponde a uma escolha entre duas opções (A ou B).",
              "O percentual exibido corresponde à proporção de escolhas de cada lado sobre o total de participações.",
              "Não há ponderação por perfil demográfico, região ou qualquer outro critério.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-600">{item}</span>
              </li>
            ))}
          </ul>

          {/* Exemplo visual */}
          <div className="mt-6 bg-gray-50 rounded-lg p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Exemplo ilustrativo</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Total de participações</span>
                <span className="font-mono font-bold text-gray-900">100</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#B91C1C] font-medium">Opção A (60 opiniões)</span>
                <span className="font-mono font-bold text-[#B91C1C]">60%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#002B5C] font-medium">Opção B (40 opiniões)</span>
                <span className="font-mono font-bold text-[#002B5C]">40%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex mt-2">
                <div className="h-full bg-[#B91C1C]" style={{ width: "60%" }} />
                <div className="h-full bg-[#002B5C]" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Origem dos dados */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-500" />
          Origem dos dados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Participação espontânea de usuários da plataforma" },
            { label: "Ambiente digital aberto, sem convite ou seleção prévia" },
            { label: "Ausência de amostragem controlada ou estratificada" },
          ].map(({ label }, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center mb-3">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Limitações */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Limitações declaradas
        </h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-3">
          <p className="text-sm text-amber-800 font-medium mb-4">
            Os dados do AchoQ possuem as seguintes limitações que o usuário deve conhecer:
          </p>
          {[
            "Não seguem metodologia estatística de pesquisa eleitoral regulamentada.",
            "Não utilizam amostragem representativa da população brasileira.",
            "Não garantem precisão preditiva sobre qualquer evento futuro.",
            "Podem refletir viés de seleção dos participantes da plataforma.",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-sm text-amber-700">{item}</span>
            </div>
          ))}
          <p className="text-sm text-amber-800 font-medium mt-4 pt-4 border-t border-amber-200">
            Os resultados devem ser interpretados como <strong>indicadores de percepção coletiva</strong>,
            e não como projeções oficiais ou científicas.
          </p>
        </div>
      </div>

      {/* Resolução de eventos */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resolução de eventos</h2>
        <p className="text-gray-600 leading-relaxed">
          Quando aplicável, os desfechos dos eventos são definidos com base em
          <strong> fontes públicas e verificáveis</strong> — como resultados eleitorais oficiais
          divulgados pelo TSE, resultados esportivos divulgados pelas entidades competentes
          (FIFA, CBF), ou outros registros públicos de referência. O AchoQ se reserva o direito
          de encerrar ou arquivar mercados conforme os eventos se concretizem.
        </p>
      </div>
    </InstitutionalLayout>
  );
}
