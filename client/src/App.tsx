import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import POS from "@/pages/pos";
import Dashboard from "@/pages/dashboard";
import { PosProvider } from "./lib/pos-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={POS} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PosProvider>
        <Router />
        <Toaster />
      </PosProvider>
    </QueryClientProvider>
  );
}

export default App;
