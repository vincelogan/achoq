import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import QsBalance from "./QsBalance";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/logowhite_07ee886e.png";

const navLinks = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/ranking", label: "Ranking" },
  { href: "/loja", label: "Loja" },
  { href: "/legal", label: "Legal" },
];

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="AchoQ" className="h-11 w-11 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-sans text-xl font-black tracking-tight text-brand">AchoQ</span>
            <span className="font-sans text-[9px] text-muted-foreground tracking-wide">Expectativa Coletiva</span>
          </div>
        </Link>

        {/* Busca Desktop */}
        <div className="hidden lg:block flex-1 max-w-xs mx-6">
          <SearchBar />
        </div>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-sans text-sm font-medium transition-colors ${
                location === href
                  ? "text-brand border-b-2 border-brand pb-0.5"
                  : "text-muted-foreground hover:text-brand"
              }`}
            >
              {label}
            </Link>
          ))}
          <QsBalance />
          <ThemeToggle />
        </nav>

        {/* Mobile: saldo + toggle de tema + menu */}
        <div className="flex items-center gap-1 md:hidden">
          <QsBalance />
          <ThemeToggle />
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-card">
          <div className="container pt-3">
            <SearchBar />
          </div>
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location === href
                    ? "bg-muted text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-brand"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
