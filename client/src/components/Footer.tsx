import { Link } from "wouter";
import { Instagram, Linkedin } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/achoq-logo-q-transparent_c7177ac9.png";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <img src={LOGO_URL} alt="AchoQ" className="h-11 w-11 object-contain" />
              <div className="flex flex-col leading-none">
                <span className="font-sans text-xl font-black tracking-tight text-[#1a4971]">AchoQ</span>
                <span className="font-sans text-[9px] text-gray-400 tracking-wide">Expectativa Coletiva</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              A primeira plataforma de expectativa coletiva do Brasil. Veja o que o Brasil acha agora!
            </p>
            <p className="text-xs text-gray-400 mt-3 max-w-xs leading-relaxed">
              Não é pesquisa eleitoral. Não constitui plataforma de apostas.
              Os resultados refletem a opinião dos usuários participantes.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/como-funciona" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Ranking
                </Link>
              </li>
              <li>
                <Link href="/metodologia" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Metodologia
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Informações Legais
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-gray-500 hover:text-[#1a4971] transition-colors">
                  Privacidade (LGPD)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-xs text-gray-400">
              © 2026 AchoQ — Uma empresa Nexar. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="https://x.com/achoq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#1a4971] transition-colors"
              aria-label="X"
            >
              <XIcon className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/AchoQ.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#1a4971] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/company/achoq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#1a4971] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
