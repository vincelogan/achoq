import InstitutionalLayout from "@/components/InstitutionalLayout";
import { MousePointerClick, BarChart2, Bell, Ban, DollarSign, Bot, ShieldOff } from "lucide-react";
import { useEffect } from "react";

const faqData = [
  {
    question: "O que é o AchoQ?",
    answer: "O AchoQ é a primeira plataforma de expectativa coletiva do Brasil. Qualquer pessoa pode indicar o que acredita que vai acontecer em relação a temas relevantes como política, economia, esportes e entretenimento."
  },
  {
    question: "Como funciona o AchoQ?",
    answer: "Você escolhe uma enquete ativa, seleciona a opção que acredita ser o resultado futuro, e sua escolha é somada à expectativa coletiva. Os percentuais são atualizados em tempo real."
  },
  {
    question: "Preciso pagar para participar?",
    answer: "Não. O AchoQ é totalmente gratuito. Não há pagamento para participar, nem premiação financeira de qualquer tipo."
  },
  {
    question: "O AchoQ é uma plataforma de apostas?",
    answer: "Não. O AchoQ não constitui plataforma de apostas, jogos de azar ou negociação de ativos financeiros. Os resultados refletem apenas a opinião/expectativa dos usuários participantes."
  },
  {
    question: "O que os percentuais representam?",
    answer: "Os percentuais exibidos refletem exclusivamente a distribuição das escolhas feitas pelos participantes da plataforma. Eles não constituem probabilidade científica, garantia de resultado ou pesquisa eleitoral regulamentada."
  },
  {
    question: "O AchoQ é pesquisa eleitoral?",
    answer: "Não. O AchoQ não é pesquisa eleitoral regulamentada pelo TSE. É uma plataforma de participação aberta e espontânea onde qualquer pessoa pode registrar sua expectativa."
  },
  {
    question: "Posso votar mais de uma vez na mesma enquete?",
    answer: "Não. Cada usuário pode registrar apenas uma opinião por enquete, garantindo a integridade dos resultados."
  },
  {
    question: "Os dados são atualizados em tempo real?",
    answer: "Sim. Cada opinião registrada é imediatamente refletida nos percentuais exibidos, garantindo que você veja sempre a expectativa mais recente da comunidade."
  }
];

export default function ComoFunciona() {
  return (
    <InstitutionalLayout
      title="Como funciona o AchoQ"
      subtitle="Uma plataforma de expectativa coletiva em tempo real. Simples, transparente e sem intermediários."
      badge="Plataforma"
      breadcrumbs={[{ label: "Como Funciona" }]}
    >
      {/* Intro */}
      <div className="prose prose-gray max-w-none mb-12">
        <p className="text-lg text-muted-foreground leading-relaxed">
          O AchoQ é uma plataforma digital de <strong>expectativa coletiva em tempo real</strong>.
          Qualquer pessoa pode indicar o que acredita que vai acontecer em relação a temas
          relevantes — como política, economia, esportes e acontecimentos do cotidiano.
        </p>
      </div>

      {/* Como participar */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Como participar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: MousePointerClick,
              step: "01",
              title: "Escolha",
              desc: "Selecione uma pergunta ativa e indique a opção que você acredita que representa o resultado futuro.",
            },
            {
              icon: BarChart2,
              step: "02",
              title: "Veja",
              desc: "Sua escolha é somada à expectativa coletiva. O percentual é atualizado em tempo real.",
            },
            {
              icon: Bell,
              step: "03",
              title: "Acompanhe",
              desc: "Siga a evolução da expectativa conforme novos fatos surgem e mais pessoas participam.",
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono font-bold text-muted-foreground">{step}</span>
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* O que os números representam */}
      <div className="mb-12 bg-brand/5 border border-brand/15 rounded-xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-foreground mb-3">O que os números representam</h2>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          Os percentuais exibidos refletem <strong>exclusivamente a distribuição das escolhas
          feitas pelos participantes</strong> da plataforma. Eles não constituem:
        </p>
        <ul className="space-y-2">
          {[
            "Garantia de qualquer resultado",
            "Probabilidade científica ou estatística",
            "Recomendação de qualquer natureza",
            "Pesquisa eleitoral regulamentada pelo TSE",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldOff className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Atualização */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-3">Atualização em tempo real</h2>
        <p className="text-muted-foreground leading-relaxed">
          Os dados são atualizados continuamente conforme novas participações ocorrem.
          Cada opinião registrada é imediatamente refletida nos percentuais exibidos,
          garantindo que você veja sempre a opinião mais recente da comunidade.
        </p>
      </div>

      {/* Perguntas Frequentes */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqData.map(({ question, answer }, idx) => (
            <details key={idx} className="group bg-card border border-border rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-foreground font-semibold text-sm hover:bg-muted transition-colors">
                {question}
                <svg className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
            </details>
          ))}
        </div>
      </div>

      {/* FAQ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqData.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer
              }
            }))
          })
        }}
      />

      {/* Natureza da plataforma */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-6">Natureza da plataforma</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          O AchoQ é um ambiente de participação aberta e espontânea. A plataforma
          <strong> não possui</strong> nenhum dos seguintes elementos:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: DollarSign, label: "Pagamento para participar" },
            { icon: DollarSign, label: "Premiação financeira de qualquer tipo" },
            { icon: Ban, label: "Jogos de azar ou similar" },
            { icon: Bot, label: "Negociação de ativos financeiros" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 bg-muted border border-border rounded-lg px-4 py-3">
              <div className="w-7 h-7 bg-vote-a/10 rounded-md flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </InstitutionalLayout>
  );
}
