import { Link, useLocation } from "wouter";
import { Home, Blocks, ArrowRightLeft, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetwork } from "@/lib/network-context";
import { NetworkIcon } from "./crypto-icons";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/blocks", label: "Blocks", icon: Blocks },
  { href: "/transactions", label: "TXs", icon: ArrowRightLeft },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/search", label: "Search", icon: Search },
];

export function MobileNav() {
  const [location] = useLocation();
  const { getNetwork, selectedNetwork } = useNetwork();
  const network = getNetwork(selectedNetwork);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold">CE</span>
          </div>
          <div>
            <h2 className="font-semibold">CryptoExplorer</h2>
            <p className="text-xs text-muted-foreground">
              {network.name} Network
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    data-testid={`link-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: network.color }}
          >
            <NetworkIcon networkId={selectedNetwork} className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{network.name}</p>
            <p className="text-xs text-muted-foreground">Active Network</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                data-testid={`link-bottom-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
