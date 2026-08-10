import { Link } from "wouter";
import { Instagram, Linkedin } from "lucide-react";
import { Wordmark } from "./Header";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-border py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4 w-fit" aria-label="AchoQ — início">
              <Wordmark />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              A bolsa de opiniões do Brasil. Sem apostas, sem dinheiro — só opinião.
            </p>
            <p className="text-xs text-muted-foreground mt-3 max-w-xs leading-relaxed">
              Não é pesquisa eleitoral. Não constitui plataforma de apostas.
              Os resultados refletem a opinião/expectativa dos usuários participantes.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/como-funciona" className="text-muted-foreground hover:text-brand transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/ranking" className="text-muted-foreground hover:text-brand transition-colors">
                  Ranking
                </Link>
              </li>
              <li>
                <Link href="/boloes" className="text-muted-foreground hover:text-brand transition-colors">
                  Bolões
                </Link>
              </li>
              <li>
                <Link href="/sugerir" className="text-muted-foreground hover:text-brand transition-colors">
                  Sugerir enquete
                </Link>
              </li>
              <li>
                <Link href="/metodologia" className="text-muted-foreground hover:text-brand transition-colors">
                  Metodologia
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal" className="text-muted-foreground hover:text-brand transition-colors">
                  Informações Legais
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-muted-foreground hover:text-brand transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-muted-foreground hover:text-brand transition-colors">
                  Privacidade (LGPD)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 AchoQ — Uma empresa Nexar. Todos os direitos reservados.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="https://x.com/achoq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-brand transition-colors"
              aria-label="X"
            >
              <XIcon className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/AchoQ.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-brand transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com/company/achoq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-brand transition-colors"
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
