import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, Mail } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { completeAuthAndRedirect } from "@/hooks/useAuth";
import { getGoogleAuthStartUrl } from "@/const";

function getReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnPath");
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

/** Atende tanto /entrar quanto /cadastro — mesma tela, aba inicial diferente. */
export default function Entrar() {
  const [location] = useLocation();
  const isSignupRoute = location === "/cadastro";
  const [mode, setMode] = useState<"login" | "cadastro">(isSignupRoute ? "cadastro" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const fingerprint = useFingerprint();
  const returnPath = getReturnPath();

  useEffect(() => {
    document.title = `${mode === "login" ? "Entrar" : "Criar conta"} | AchoQ`;
  }, [mode]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (user) => completeAuthAndRedirect(user?.fingerprint, returnPath),
    onError: (err) => setError(err.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (user) => completeAuthAndRedirect(user?.fingerprint, returnPath),
    onError: (err) => setError(err.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, password, fingerprint: fingerprint || undefined });
    }
  };

  const googleUrl = getGoogleAuthStartUrl(returnPath, fingerprint || undefined);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-foreground">
              {mode === "login" ? "Entrar no AchoQ" : "Criar sua conta"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login"
                ? "Entre para opinar e acompanhar seus Qs em qualquer dispositivo."
                : "Rápido: e-mail e senha, ou 1 clique no Google. Sem apostas, sem dinheiro — só opinião."}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <a
              href={googleUrl}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.5 26.7 37.4 24 37.4c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9 40.3 16 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.2 5.2C40.6 36 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z" />
              </svg>
              Continuar com Google
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/80 mb-1 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="voce@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/80 mb-1 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={mode === "cadastro" ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder={mode === "cadastro" ? "Mínimo 8 caracteres" : "Sua senha"}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-vote-a bg-vote-a/10 px-3 py-2 rounded-md">{error}</p>}

              <Button type="submit" disabled={isPending} className="w-full bg-brand hover:bg-brand/90 text-white">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "login" ? (
                <>Ainda não tem conta?{" "}
                  <button type="button" onClick={() => { setMode("cadastro"); setError(""); }} className="text-brand font-medium hover:underline">
                    Criar conta
                  </button>
                </>
              ) : (
                <>Já tem conta?{" "}
                  <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-brand font-medium hover:underline">
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link href="/" className="hover:text-foreground/80 transition-colors">← Voltar ao site</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
