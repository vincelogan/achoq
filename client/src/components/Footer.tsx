import { Link } from "wouter";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-2 border-black pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2">
            <Link href="/">
              <a className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 bg-black flex items-center justify-center">
                  <span className="font-sans font-bold text-white text-xl">Q</span>
                </div>
                <span className="font-sans text-2xl font-bold tracking-tighter uppercase">AchoQ</span>
              </a>
            </Link>
            <p className="font-mono text-sm text-muted-foreground max-w-sm mb-6">
              O primeiro mercado de previsão do Brasil focado em inteligência coletiva e dados reais.
            </p>
            <div className="flex gap-4">
              <a href="#" className="h-10 w-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold uppercase mb-6 border-b-2 border-black inline-block pb-1">Plataforma</h4>
            <ul className="space-y-4 font-mono text-sm">
              <li><Link href="/markets"><a className="hover:underline decoration-2 underline-offset-4">Mercados</a></Link></li>
              <li><Link href="/learn"><a className="hover:underline decoration-2 underline-offset-4">Como Funciona</a></Link></li>
              <li><Link href="/fees"><a className="hover:underline decoration-2 underline-offset-4">Taxas</a></Link></li>
              <li><Link href="/leaderboard"><a className="hover:underline decoration-2 underline-offset-4">Ranking</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold uppercase mb-6 border-b-2 border-black inline-block pb-1">Legal</h4>
            <ul className="space-y-4 font-mono text-sm">
              <li><Link href="/terms"><a className="hover:underline decoration-2 underline-offset-4">Termos de Uso</a></Link></li>
              <li><Link href="/privacy"><a className="hover:underline decoration-2 underline-offset-4">Privacidade</a></Link></li>
              <li><Link href="/compliance"><a className="hover:underline decoration-2 underline-offset-4">Compliance</a></Link></li>
              <li><Link href="/responsible-gaming"><a className="hover:underline decoration-2 underline-offset-4">Jogo Responsável</a></Link></li>
            </ul>
          </div>
          
        </div>
        
        <div className="border-t-2 border-black pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground">
            © 2026 AchoQ. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-acid-green rounded-full animate-pulse"></div>
            <span className="font-mono text-xs font-bold uppercase">Sistema Operacional</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
