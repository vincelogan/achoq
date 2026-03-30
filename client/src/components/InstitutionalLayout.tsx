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
    <div className="min-h-screen flex flex-col bg-white text-black font-sans">
      <Header />
      <main className="flex-1">
        {/* Hero da página */}
        <section className="w-full py-10 md:py-16 bg-gray-50/60 border-b border-gray-100">
          <div className="container max-w-4xl mx-auto">
            {breadcrumbs && (
              <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                <Link href="/" className="hover:text-gray-700 transition-colors">Início</Link>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-gray-700 transition-colors">{crumb.label}</Link>
                    ) : (
                      <span className="text-gray-600">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {badge && (
              <span className="inline-block text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full mb-3">
                {badge}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-gray-500 max-w-2xl">{subtitle}</p>
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
