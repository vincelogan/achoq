import InstitutionalLayout from "@/components/InstitutionalLayout";
import { Link } from "wouter";

const LAST_UPDATE = "29 de março de 2026";

type Section = {
  number: string;
  title: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    number: "1",
    title: "Aceitação dos Termos",
    content: (
      <p className="text-gray-600 leading-relaxed">
        Ao acessar ou utilizar a plataforma AchoQ, o usuário declara ter lido, compreendido e
        concordado integralmente com os presentes Termos de Uso. Caso não concorde com qualquer
        disposição aqui contida, o usuário deve abster-se de utilizar a plataforma.
        O uso continuado da plataforma após eventuais alterações nos Termos implica aceitação
        das novas condições.
      </p>
    ),
  },
  {
    number: "2",
    title: "Elegibilidade",
    content: (
      <p className="text-gray-600 leading-relaxed">
        O usuário declara possuir capacidade legal plena para utilizar o serviço, nos termos
        do Código Civil Brasileiro (Lei nº 10.406/2002). Menores de 18 anos somente poderão
        utilizar a plataforma com a supervisão e o consentimento de seus responsáveis legais.
        O AchoQ não se responsabiliza pelo uso indevido por pessoas sem capacidade legal.
      </p>
    ),
  },
  {
    number: "3",
    title: "Uso da Plataforma",
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          O usuário se compromete a utilizar a plataforma de forma lícita e de boa-fé.
          É expressamente vedado:
        </p>
        <ul className="space-y-2">
          {[
            "Utilizar a plataforma para fins ilícitos ou contrários à ordem pública e aos bons costumes.",
            "Manipular ou tentar manipular resultados por qualquer meio, incluindo opiniões coordenadas ou automatizadas.",
            "Utilizar robôs, scripts, automações ou qualquer mecanismo não humano sem autorização expressa e prévia.",
            "Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte da plataforma.",
            "Interferir no funcionamento técnico da plataforma ou de sua infraestrutura.",
            "Reproduzir, distribuir ou explorar comercialmente o conteúdo da plataforma sem autorização.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-red-400 mt-0.5 shrink-0 font-bold">✗</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: "4",
    title: "Natureza da Participação",
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          A participação no AchoQ é voluntária e gratuita. O usuário reconhece expressamente que:
        </p>
        <ul className="space-y-2">
          {[
            "A participação é gratuita e não gera qualquer direito financeiro, crédito ou remuneração.",
            "A plataforma não constitui, em nenhuma hipótese, investimento ou jogo de azar.",
            "Os percentuais exibidos são meros indicadores de opinião coletiva, sem valor preditivo garantido.",
            "Nenhuma participação gera obrigação contratual entre o usuário e o AchoQ.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5 shrink-0 font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    number: "5",
    title: "Moderação de Conteúdo",
    content: (
      <p className="text-gray-600 leading-relaxed">
        O AchoQ se reserva o direito de remover conteúdos, suspender ou encerrar contas de
        usuários que violem estes Termos, sem necessidade de aviso prévio e sem que isso gere
        qualquer direito de indenização. A plataforma também pode encerrar ou arquivar mercados
        a qualquer momento, a seu exclusivo critério.
      </p>
    ),
  },
  {
    number: "6",
    title: "Limitação de Responsabilidade",
    content: (
      <div className="space-y-3">
        <p className="text-gray-600 leading-relaxed">
          O AchoQ não garante e não se responsabiliza por:
        </p>
        <ul className="space-y-2">
          {[
            "A precisão, completude ou atualidade dos resultados exibidos.",
            "A disponibilidade contínua e ininterrupta da plataforma.",
            "Danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso da plataforma.",
            "Decisões tomadas pelo usuário com base nas informações disponibilizadas.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-gray-400 mt-0.5 shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-gray-600 leading-relaxed mt-2">
          O uso da plataforma é feito por conta e risco exclusivo do usuário.
        </p>
      </div>
    ),
  },
  {
    number: "7",
    title: "Propriedade Intelectual",
    content: (
      <p className="text-gray-600 leading-relaxed">
        Todo o conteúdo da plataforma AchoQ — incluindo marca, logotipo, design, textos,
        código-fonte e demais elementos — é protegido por direitos de propriedade intelectual
        nos termos da Lei nº 9.610/1998 (Lei de Direitos Autorais) e da Lei nº 9.279/1996
        (Lei de Propriedade Industrial). É vedada qualquer reprodução, distribuição ou uso
        sem autorização expressa e prévia.
      </p>
    ),
  },
  {
    number: "8",
    title: "Privacidade",
    content: (
      <p className="text-gray-600 leading-relaxed">
        O tratamento de dados pessoais dos usuários é regido pela{" "}
        <Link href="/privacidade" className="text-blue-600 hover:underline">
          Política de Privacidade
        </Link>{" "}
        do AchoQ, elaborada em conformidade com a Lei Geral de Proteção de Dados
        (LGPD — Lei nº 13.709/2018).
      </p>
    ),
  },
  {
    number: "9",
    title: "Alterações nos Termos",
    content: (
      <p className="text-gray-600 leading-relaxed">
        O AchoQ se reserva o direito de alterar estes Termos a qualquer momento, mediante
        publicação da versão atualizada na plataforma. Recomenda-se que o usuário verifique
        periodicamente esta página. O uso continuado da plataforma após a publicação de
        alterações constitui aceitação das novas condições.
      </p>
    ),
  },
  {
    number: "10",
    title: "Lei Aplicável e Foro",
    content: (
      <p className="text-gray-600 leading-relaxed">
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito
        o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes
        destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
      </p>
    ),
  },
];

export default function Termos() {
  return (
    <InstitutionalLayout
      title="Termos de Uso"
      subtitle="Leia atentamente antes de utilizar a plataforma AchoQ."
      badge="Legal"
      breadcrumbs={[{ label: "Legal", href: "/legal" }, { label: "Termos de Uso" }]}
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-gray-400">Última atualização: {LAST_UPDATE}</p>
        <Link href="/privacidade" className="text-xs text-blue-600 hover:underline">
          Ver também: Política de Privacidade →
        </Link>
      </div>

      {/* Índice */}
      <div className="mb-10 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Índice</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {sections.map((s) => (
            <a
              key={s.number}
              href={`#termo-${s.number}`}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors py-0.5"
            >
              <span className="font-mono text-gray-400 mr-2">{s.number}.</span>
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Seções */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.number}
            id={`termo-${section.number}`}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm scroll-mt-24"
          >
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-xs font-mono font-bold text-gray-500 shrink-0">
                {section.number}
              </span>
              {section.title}
            </h2>
            {section.content}
          </div>
        ))}
      </div>

      {/* Contato */}
      <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-sm text-gray-500">
          Dúvidas sobre estes Termos? Entre em contato:{" "}
          <a href="mailto:contato@achoq.com.br" className="text-blue-600 hover:underline">
            contato@achoq.com.br
          </a>
        </p>
      </div>
    </InstitutionalLayout>
  );
}
