import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

type Breadcrumb = { label: string; href?: string };

type InstitutionalLayoutProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  badge?: string;
  children: React.ReactNode;
};

export default function InstitutionalLayout({
  title,
  subtitle,
  breadcrumbs,
  badge,
  children,
}: InstitutionalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1">
        {/* Hero da página */}
        <section className="w-full py-10 md:py-16 bg-muted/60 border-b border-border/50">
          <div className="container max-w-4xl mx-auto">
            {breadcrumbs && (
              <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                <Link href="/" className="hover:text-foreground/80 transition-colors">Início</Link>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-foreground/80 transition-colors">{crumb.label}</Link>
                    ) : (
                      <span className="text-muted-foreground">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {badge && (
              <span className="inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-3 py-1 rounded-full mb-3">
                {badge}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-muted-foreground max-w-2xl">{subtitle}</p>
            )}
          </div>
        </section>

        {/* Conteúdo */}
        <section className="w-full py-10 md:py-14">
          <div className="container max-w-4xl mx-auto">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
