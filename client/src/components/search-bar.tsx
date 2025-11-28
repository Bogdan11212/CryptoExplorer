import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/lib/network-context";
import { detectSearchType, cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: "hero" | "header";
  className?: string;
}

export function SearchBar({ variant = "header", className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();
  const { selectedNetwork } = useNetwork();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    const searchType = detectSearchType(query.trim());

    try {
      switch (searchType) {
        case "block":
          setLocation(`/block/${selectedNetwork}/${query.trim()}`);
          break;
        case "transaction":
          setLocation(`/tx/${selectedNetwork}/${query.trim()}`);
          break;
        case "wallet":
          setLocation(`/wallet/${selectedNetwork}/${query.trim()}`);
          break;
        default:
          setLocation(`/search?q=${encodeURIComponent(query.trim())}&network=${selectedNetwork}`);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, selectedNetwork, setLocation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
  };

  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "relative flex items-center w-full",
        isHero ? "max-w-2xl" : "max-w-md",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center w-full rounded-lg border transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary",
          isHero
            ? "bg-card/80 backdrop-blur-xl border-border/50 shadow-lg"
            : "bg-muted/50 border-transparent"
        )}
      >
        <Search
          className={cn(
            "absolute left-3 text-muted-foreground",
            isHero ? "h-5 w-5" : "h-4 w-4"
          )}
        />
        <Input
          type="search"
          placeholder="Search blocks, transactions, addresses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="input-search"
          className={cn(
            "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            isHero ? "h-14 pl-11 pr-24 text-base" : "h-10 pl-10 pr-16 text-sm"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            data-testid="button-clear-search"
            className="absolute right-12 h-6 w-6 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          data-testid="button-search"
          className={cn(
            "absolute right-1.5 rounded-md",
            isHero ? "h-10 px-4" : "h-7 px-3 text-xs"
          )}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </div>
  );
}
