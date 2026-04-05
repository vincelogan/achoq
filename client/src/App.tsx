import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ComoFunciona from "./pages/ComoFunciona";
import Ranking from "./pages/Ranking";
import Metodologia from "./pages/Metodologia";
import Legal from "./pages/Legal";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Admin from "./pages/Admin";
import MarketDetail from "./pages/MarketDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
