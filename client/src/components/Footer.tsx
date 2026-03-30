import { Link } from "wouter";
import { Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex flex-col leading-none mb-4 w-fit">
              <span className="font-sans text-2xl font-black tracking-tighter text-black">AchoQ</span>
              <span className="font-mono text-[10px] text-gray-500 tracking-wide uppercase">powered by Nexar</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Primeira plataforma de opinião coletiva do Brasil. Simples, transparente e sem apostas.
            </p>
            <p className="text-xs text-gray-400 mt-3 max-w-xs leading-relaxed">
              Não é pesquisa eleitoral. Não é plataforma de apostas.
              Os resultados refletem apenas a opinião dos participantes.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/como-funciona" className="text-gray-500 hover:text-black transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="text-gray-500 hover:text-black transition-colors">
                  Ranking
                </Link>
              </li>
              <li>
                <Link href="/metodologia" className="text-gray-500 hover:text-black transition-colors">
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
                <Link href="/legal" className="text-gray-500 hover:text-black transition-colors">
                  Informações Legais
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-gray-500 hover:text-black transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-gray-500 hover:text-black transition-colors">
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
              © 2026 AchoQ. Todos os direitos reservados.
            </p>
            <span className="hidden md:block text-gray-200">|</span>
            <p className="text-xs text-gray-400">
              CNPJ: a definir
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-black transition-colors"
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
