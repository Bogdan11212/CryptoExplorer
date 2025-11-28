import { Link } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NetworkSelector } from "./network-selector";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <MobileNav />
            </SheetContent>
          </Sheet>

          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CE</span>
              </div>
              <span className="font-semibold text-lg hidden sm:inline">CryptoExplorer</span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <SearchBar variant="header" className="w-full max-w-lg" />
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <NetworkSelector />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="md:hidden border-t px-4 py-2">
        <SearchBar variant="header" className="w-full" />
      </div>

      <div className="lg:hidden border-t px-4 py-2 overflow-x-auto">
        <NetworkSelector />
      </div>
    </header>
  );
}
