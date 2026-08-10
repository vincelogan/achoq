import { useEffect, useState } from "react";
import { Link } from "wouter";
import { QCoin } from "@/components/QsBalance";

const STORAGE_KEY = "achoq_onboarded_v1";

/**
 * Boas-vindas na primeira visita: proposta de valor em uma frase + o que
 * são os Qs (não valem dinheiro) + bônus de 100 Qs. Padrão Manifold enxuto.
 */
export default function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      /* localStorage indisponível */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={dismiss} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Bem-vindo ao AchoQ"
        >
          <div className="panel-exchange p-6 text-white text-center">
            <p className="text-4xl mb-2" aria-hidden="true">🇧🇷</p>
            <h2 className="text-xl font-black">Bem-vindo ao AchoQ</h2>
            <p className="text-blue-200 text-sm mt-1 font-medium">
              Sem apostas. Sem dinheiro. Só opinião.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Diga o que você acha que vai acontecer — política, economia, esportes — e veja
              em tempo real o que o Brasil pensa.
            </p>

            <div className="bg-qs/10 border border-qs/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <QCoin className="w-5 h-5" />
                <span className="font-bold text-foreground text-sm">Você começa com 100 Qs</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Qs são a moeda fictícia daqui: você ganha opinando, acertando previsões e
                voltando todo dia — e gasta em destaques e itens de perfil.{" "}
                <strong className="text-foreground/80">Não valem dinheiro e nunca vão valer.</strong>
              </p>
            </div>

            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>🗳️ <strong className="text-foreground/80">Opine</strong> — cada voto vale Qs</li>
              <li>🔥 <strong className="text-foreground/80">Volte amanhã</strong> — check-in diário paga cada vez mais</li>
              <li>🏆 <strong className="text-foreground/80">Suba na liga</strong> — ou crie um <Link href="/boloes" className="underline" onClick={dismiss}>bolão com amigos</Link></li>
            </ul>

            <Link
              href="/cadastro"
              onClick={dismiss}
              className="block w-full text-center py-3 rounded-xl bg-brand text-brand-foreground font-bold text-sm hover:bg-brand/90 transition-colors"
            >
              Criar conta e começar a opinar
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/entrar" onClick={dismiss} className="text-brand font-medium underline">
                Entrar
              </Link>
              {" · "}
              <button onClick={dismiss} className="underline">
                Só olhar por enquanto
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
