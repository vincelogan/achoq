import InstitutionalLayout from "@/components/InstitutionalLayout";
import { Link } from "wouter";
import { Shield, Eye, Share2, Cookie, Lock, UserCheck, Mail } from "lucide-react";

const LAST_UPDATE = "29 de março de 2026";

type PrivacySection = {
  number: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
};

const sections: PrivacySection[] = [
  {
    number: "1",
    icon: Eye,
    title: "Dados que coletamos",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          O AchoQ coleta apenas os dados estritamente necessários para o funcionamento da plataforma:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Dados de navegação", desc: "Páginas visitadas, tempo de acesso, dispositivo e navegador utilizados." },
            { label: "Endereço IP", desc: "Utilizado para fins de segurança, prevenção de fraudes e análise geográfica agregada." },
            { label: "Identificador anônimo", desc: "Gerado localmente no seu dispositivo para controle de participação única por mercado." },
            { label: "Dados voluntários", desc: "Informações fornecidas pelo usuário ao criar conta ou entrar em contato (ex: e-mail, nome)." },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-muted rounded-lg p-4 border border-border/50">
              <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: "2",
    icon: Shield,
    title: "Como usamos os dados",
    content: (
      <div className="space-y-2">
        <p className="text-muted-foreground leading-relaxed mb-3">
          Os dados coletados são utilizados exclusivamente para:
        </p>
        {[
          "Garantir o funcionamento correto da plataforma e de seus recursos.",
          "Melhorar a experiência do usuário com base em padrões de uso agregados.",
          "Prevenir fraudes, manipulações e acessos não autorizados.",
          "Cumprir obrigações legais e regulatórias aplicáveis.",
          "Analisar o desempenho técnico da plataforma.",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-green-500 mt-0.5 shrink-0 font-bold">✓</span>
            {item}
          </div>
        ))}
        <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
          Os dados <strong>não são utilizados</strong> para fins de marketing direto sem
          consentimento prévio, nem para criação de perfis individuais detalhados.
        </p>
      </div>
    ),
  },
  {
    number: "3",
    icon: Share2,
    title: "Compartilhamento de dados",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          <strong>Os dados dos usuários não são vendidos</strong> a terceiros em nenhuma hipótese.
          O compartilhamento ocorre apenas nas seguintes situações:
        </p>
        {[
          { title: "Obrigação legal", desc: "Quando exigido por autoridade judicial, administrativa ou regulatória competente, nos termos da legislação brasileira." },
          { title: "Fornecedores essenciais", desc: "Com prestadores de serviços técnicos indispensáveis à operação da plataforma (ex: hospedagem, banco de dados), sempre sob obrigação contratual de confidencialidade." },
          { title: "Proteção de direitos", desc: "Quando necessário para proteger os direitos, a propriedade ou a segurança do AchoQ, de seus usuários ou de terceiros." },
        ].map(({ title, desc }) => (
          <div key={title} className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    number: "4",
    icon: Cookie,
    title: "Cookies e tecnologias similares",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          O AchoQ utiliza cookies e tecnologias similares para:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { type: "Essenciais", desc: "Necessários para o funcionamento básico da plataforma. Não podem ser desativados.", color: "bg-emerald-500/10 border-emerald-500/30" },
            { type: "Desempenho", desc: "Coletam informações sobre como os usuários utilizam a plataforma, de forma anônima e agregada.", color: "bg-brand/10 border-blue-200" },
            { type: "Funcionais", desc: "Permitem que a plataforma lembre suas preferências e configurações entre sessões.", color: "bg-muted border-border" },
          ].map(({ type, desc, color }) => (
            <div key={type} className={`rounded-lg p-4 border ${color}`}>
              <p className="text-sm font-semibold text-foreground mb-1">{type}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
          A desativação de cookies essenciais pode afetar o funcionamento da plataforma.
        </p>
      </div>
    ),
  },
  {
    number: "5",
    icon: Lock,
    title: "Segurança dos dados",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        O AchoQ adota medidas técnicas e organizacionais adequadas para proteger os dados
        dos usuários contra acesso não autorizado, perda, destruição ou divulgação indevida.
        Isso inclui criptografia em trânsito (HTTPS/TLS), controles de acesso restritos e
        monitoramento de segurança. Apesar de nossos esforços, nenhum sistema é completamente
        inviolável, e o AchoQ não pode garantir segurança absoluta.
      </p>
    ),
  },
  {
    number: "6",
    icon: UserCheck,
    title: "Direitos do usuário (LGPD)",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          Nos termos da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018),
          o usuário tem os seguintes direitos em relação aos seus dados pessoais:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { right: "Acesso", desc: "Solicitar confirmação da existência de tratamento e acesso aos dados." },
            { right: "Correção", desc: "Solicitar a correção de dados incompletos, inexatos ou desatualizados." },
            { right: "Exclusão", desc: "Solicitar a eliminação dos dados tratados com base no consentimento." },
            { right: "Portabilidade", desc: "Solicitar a portabilidade dos dados a outro fornecedor de serviço." },
            { right: "Revogação", desc: "Revogar o consentimento para tratamento de dados a qualquer momento." },
            { right: "Informação", desc: "Ser informado sobre as entidades com as quais os dados foram compartilhados." },
          ].map(({ right, desc }) => (
            <div key={right} className="flex gap-3 bg-card border border-border rounded-lg p-3">
              <div className="w-6 h-6 bg-brand/10 rounded flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">→</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{right}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Para exercer seus direitos, entre em contato pelo e-mail indicado na seção 7.
          Responderemos em até 15 dias úteis.
        </p>
      </div>
    ),
  },
  {
    number: "7",
    icon: Mail,
    title: "Contato e Encarregado de Dados (DPO)",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          Para dúvidas, solicitações ou reclamações relacionadas à privacidade e ao tratamento
          de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
        </p>
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Canal de Privacidade</p>
          <p className="text-sm text-muted-foreground">
            E-mail:{" "}
            <a href="mailto:privacidade@achoq.com.br" className="text-blue-600 hover:underline">
              privacidade@achoq.com.br
            </a>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Prazo de resposta: até 15 dias úteis.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Você também pode registrar reclamações junto à Autoridade Nacional de Proteção de
          Dados (ANPD) em{" "}
          <a
            href="https://www.gov.br/anpd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            www.gov.br/anpd
          </a>.
        </p>
      </div>
    ),
  },
];

export default function Privacidade() {
  return (
    <InstitutionalLayout
      title="Política de Privacidade"
      subtitle="O AchoQ respeita sua privacidade e trata os dados de forma transparente, em conformidade com a LGPD."
      badge="Legal"
      breadcrumbs={[{ label: "Legal", href: "/legal" }, { label: "Política de Privacidade" }]}
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground">Última atualização: {LAST_UPDATE}</p>
        <Link href="/termos" className="text-xs text-blue-600 hover:underline">
          Ver também: Termos de Uso →
        </Link>
      </div>

      {/* Resumo executivo */}
      <div className="mb-10 bg-brand/5 border border-brand/15 rounded-xl p-6">
        <p className="text-sm font-semibold text-blue-800 mb-2">Resumo em linguagem simples</p>
        <ul className="space-y-1.5">
          {[
            "Não vendemos seus dados para ninguém.",
            "Coletamos apenas o mínimo necessário para a plataforma funcionar.",
            "Você pode solicitar a exclusão dos seus dados a qualquer momento.",
            "Usamos um identificador anônimo (sem nome ou e-mail) para controlar opiniões únicas.",
            "Seus direitos pela LGPD são integralmente respeitados.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
              <span className="font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Seções */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.number}
            id={`privacidade-${section.number}`}
            className="bg-card border border-border rounded-xl p-6 shadow-sm scroll-mt-24"
          >
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <section.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span>
                <span className="font-mono text-muted-foreground mr-1.5">{section.number}.</span>
                {section.title}
              </span>
            </h2>
            {section.content}
          </div>
        ))}
      </div>

      {/* Rodapé legal */}
      <div className="mt-10 bg-muted border border-border rounded-xl p-5">
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção
          de Dados (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.
          O AchoQ se reserva o direito de atualizá-la periodicamente.
        </p>
      </div>
    </InstitutionalLayout>
  );
}
