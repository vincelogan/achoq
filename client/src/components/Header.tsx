import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary neo-border flex items-center justify-center">
              <span className="font-sans font-bold text-white text-xl">Q</span>
            </div>
            <span className="font-sans text-2xl font-bold tracking-tighter uppercase">AchoQ</span>
          </a>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/markets"><a className="font-mono text-sm font-bold hover:underline decoration-2 underline-offset-4">Mercados</a></Link>
          <Link href="/learn"><a className="font-mono text-sm font-bold hover:underline decoration-2 underline-offset-4">Como Funciona</a></Link>
          <Link href="/about"><a className="font-mono text-sm font-bold hover:underline decoration-2 underline-offset-4">Sobre</a></Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="hidden sm:flex font-mono font-bold border-2 border-black rounded-none hover:bg-accent hover:text-white transition-all neo-shadow-hover">
            Entrar
          </Button>
          <Button className="font-mono font-bold border-2 border-black rounded-none bg-primary text-white hover:bg-primary/90 neo-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_#000]">
            Criar Conta
          </Button>
        </div>
      </div>
    </header>
  );
}
