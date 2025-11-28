import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { NetworkProvider } from "@/lib/network-context";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/mobile-nav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BlockPage from "@/pages/block";
import BlocksPage from "@/pages/blocks";
import TransactionPage from "@/pages/transaction";
import TransactionsPage from "@/pages/transactions";
import WalletPage from "@/pages/wallet";
import WalletsPage from "@/pages/wallets";
import SearchPage from "@/pages/search";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blocks" component={BlocksPage} />
      <Route path="/block/:network/:blockId" component={BlockPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/tx/:network/:txHash" component={TransactionPage} />
      <Route path="/wallet/:network/:address" component={WalletPage} />
      <Route path="/wallets" component={WalletsPage} />
      <Route path="/search" component={SearchPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <NetworkProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Header />
              <main>
                <Router />
              </main>
              <BottomNav />
            </div>
            <Toaster />
          </TooltipProvider>
        </NetworkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
