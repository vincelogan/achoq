import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Code-splitting por rota: apenas a Home entra no bundle inicial
const Busca = lazy(() => import("./pages/Busca"));
const Categoria = lazy(() => import("./pages/Categoria"));
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Metodologia = lazy(() => import("./pages/Metodologia"));
const Legal = lazy(() => import("./pages/Legal"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Admin = lazy(() => import("./pages/Admin"));
const MarketDetail = lazy(() => import("./pages/MarketDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" aria-label="Carregando..." />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/busca" component={Busca} />
        <Route path="/categoria/:categoria" component={Categoria} />
        <Route path="/como-funciona" component={ComoFunciona} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/metodologia" component={Metodologia} />
        <Route path="/legal" component={Legal} />
        <Route path="/termos" component={Termos} />
        <Route path="/privacidade" component={Privacidade} />
        <Route path="/mercado/:slug" component={MarketDetail} />
        <Route path="/admin" component={Admin} />
        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
