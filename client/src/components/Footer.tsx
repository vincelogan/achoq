import { Link } from "wouter";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex flex-col leading-none mb-4">
              <span className="font-sans text-2xl font-black tracking-tighter text-black">AchoQ</span>
              <span className="font-mono text-[10px] text-gray-500 tracking-wide uppercase">powered by Nexar</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs">
              Primeira plataforma de opinião coletiva do Brasil.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold uppercase text-sm mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/how-it-works" className="hover:text-black transition-colors">Como funciona</Link></li>
              <li><Link href="/ranking" className="hover:text-black transition-colors">Ranking</Link></li>
              <li><Link href="/methodology" className="hover:text-black transition-colors">Metodologia</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold uppercase text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-black transition-colors">Termos de Uso</Link></li>
              <li><Link href="/privacy" className="hover:text-black transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            © 2026 AchoQ. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-black transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="text-gray-400 hover:text-black transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="text-gray-400 hover:text-black transition-colors"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
