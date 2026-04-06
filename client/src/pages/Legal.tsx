import InstitutionalLayout from "@/components/InstitutionalLayout";
import { Link } from "wouter";
import { Scale, ShieldCheck, FileText, AlertTriangle, ExternalLink } from "lucide-react";

const LAST_UPDATE = "29 de março de 2026";

export default function Legal() {
  return (
    <InstitutionalLayout
      title="Informações Legais"
      subtitle="Entenda a natureza jurídica do AchoQ e os limites da plataforma."
      badge="Legal"
      breadcrumbs={[{ label: "Legal" }]}
    >
      <div className="mb-6 text-xs text-gray-400">
        Última atualização: {LAST_UPDATE}
      </div>

      {/* Natureza do serviço */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Natureza do serviço</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-600 mb-4 leading-relaxed">
            O AchoQ é uma plataforma digital de participação aberta que permite aos usuários
            expressarem sua opinião sobre eventos futuros. A plataforma:
          </p>
          <ul className="space-y-3">
            {[
              { ok: false, text: "Não realiza jogos de azar de qualquer natureza" },
              { ok: false, text: "Não intermedia jogos de azar ou atividades reguladas pela Lei nº 14.790/2023" },
              { ok: false, text: "Não oferece qualquer tipo de retorno financeiro aos participantes" },
              { ok: false, text: "Não constitui, opera ou se equipara a instituição financeira" },
              { ok: false, text: "Não negocia ativos financeiros, tokens ou criptoativos" },
              { ok: true, text: "É um serviço gratuito de expressão de opinião coletiva" },
            ].map(({ ok, text }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 text-sm font-bold ${ok ? "text-green-500" : "text-red-400"}`}>
                  {ok ? "✓" : "✗"}
                </span>
                <span className="text-sm text-gray-600">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pesquisa eleitoral */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pesquisa eleitoral</h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            O AchoQ <strong>não é instituto de pesquisa</strong> e não realiza pesquisas eleitorais
            regulamentadas nos termos da Lei nº 9.504/1997 (Lei das Eleições) e das resoluções
            do Tribunal Superior Eleitoral (TSE).
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Os dados exibidos na plataforma não possuem caráter científico ou estatístico
            representativo e não devem ser confundidos com pesquisas eleitorais registradas.
            Para consultar pesquisas eleitorais oficiais, acesse o{" "}
            <a
              href="https://www.tse.jus.br"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-900 inline-flex items-center gap-1"
            >
              portal do TSE <ExternalLink className="w-3 h-3" />
            </a>.
          </p>
        </div>
      </div>

      {/* Uso de informações */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Uso das informações</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-600 mb-4 leading-relaxed">
            As informações apresentadas na plataforma AchoQ:
          </p>
          <ul className="space-y-2">
            {[
              "Possuem caráter exclusivamente informativo e participativo.",
              "Refletem apenas a opinião dos usuários que participaram voluntariamente.",
              "Não devem ser utilizadas como base exclusiva para decisões de qualquer natureza.",
              "Não constituem aconselhamento político, financeiro, jurídico ou de qualquer outra natureza profissional.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 mt-0.5 shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Responsabilidade */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Limitação de responsabilidade</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-600 mb-4 leading-relaxed">
            O AchoQ não se responsabiliza por:
          </p>
          <ul className="space-y-2">
            {[
              "Decisões tomadas com base nas informações exibidas na plataforma.",
              "Interpretações incorretas dos dados ou percentuais apresentados.",
              "Danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso da plataforma.",
              "Interrupções temporárias de serviço por razões técnicas ou de manutenção.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-400 mt-0.5 shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Links para outros documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/termos"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all group"
        >
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-black">Termos de Uso</p>
            <p className="text-xs text-gray-500 mt-0.5">Regras de uso da plataforma</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
        </Link>
        <Link
          href="/privacidade"
          className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all group"
        >
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-black">Política de Privacidade</p>
            <p className="text-xs text-gray-500 mt-0.5">Como tratamos seus dados</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
        </Link>
      </div>
    </InstitutionalLayout>
  );
}
