import { Link } from "wouter";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-sans text-2xl font-black tracking-tighter text-black">AchoQ</span>
          <span className="font-mono text-[10px] text-gray-500 tracking-wide uppercase">powered by Nexar</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/how-it-works" className="font-sans text-sm font-medium hover:text-primary transition-colors">Como funciona</Link>
          <Link href="/ranking" className="font-sans text-sm font-medium hover:text-primary transition-colors">Ranking</Link>
          <Link href="/methodology" className="font-sans text-sm font-medium hover:text-primary transition-colors">Metodologia</Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Future Login Button */}
        </div>
      </div>
    </header>
  );
}
