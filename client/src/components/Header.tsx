import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LogOut, Menu, User, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import QsBalance, { QCoin } from "./QsBalance";
import NotificationBell from "./NotificationBell";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { clearFingerprint } from "@/hooks/useFingerprint";

/**
 * Wordmark do rebrand "Pregão": tipográfico, com o Q renderizado como a
 * própria moeda Q — a marca carrega a economia da casa (sem depender de
 * asset externo no CDN antigo).
 */
export function Wordmark({ tagline = true }: { tagline?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="flex items-center font-display text-[1.35rem] font-bold tracking-tight text-foreground">
        Acho
        <QCoin className="w-[1.15em] h-[1.15em] ml-0.5 shadow-[0_0_10px_color-mix(in_srgb,var(--qs)_45%,transparent)]" />
      </span>
      {tagline && (
        <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
          Bolsa de opiniões
        </span>
      )}
    </span>
  );
}

const navLinks = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/ranking", label: "Ranking" },
  { href: "/liga", label: "Liga" },
  { href: "/loja", label: "Loja" },
];

function AccountMenu() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Volta a agir como visitante anônimo (não com a identidade da conta
      // que acabou de sair) e recarrega — mesmo motivo do login: o
      // fingerprint em memória dos componentes já montados não muda sozinho.
      clearFingerprint();
      utils.auth.me.invalidate();
      window.location.assign("/");
    },
  });

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Link href="/entrar">
        <Button size="sm" variant="outline" className="text-sm font-medium">
          Entrar
        </Button>
      </Link>
    );
  }

  const label = user?.name || user?.email || "Conta";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Menu da conta">
          <span className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            <User className="w-4 h-4" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">{label}</div>
        <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-500 focus:text-red-600">
          <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="AchoQ — início">
          <Wordmark />
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
          <NotificationBell />
          <ThemeToggle />
          <AccountMenu />
        </nav>

        {/* Mobile: saldo + sino + toggle de tema + conta + menu */}
        <div className="flex items-center gap-1 md:hidden">
          <QsBalance />
          <NotificationBell />
          <ThemeToggle />
          <AccountMenu />
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
