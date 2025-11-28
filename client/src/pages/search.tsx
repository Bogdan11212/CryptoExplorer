import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { Search, Blocks, ArrowRightLeft, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/search-bar";
import { NetworkBadge } from "@/components/network-selector";
import { EmptyState, LoadingState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { detectSearchType, cn } from "@/lib/utils";
import { type NetworkId } from "@shared/schema";

interface SearchResult {
  type: "block" | "transaction" | "wallet";
  value: string;
  network: NetworkId;
  display: string;
}

const typeConfig = {
  block: {
    icon: Blocks,
    label: "Block",
    color: "bg-blue-500/10 text-blue-500",
  },
  transaction: {
    icon: ArrowRightLeft,
    label: "Transaction",
    color: "bg-purple-500/10 text-purple-500",
  },
  wallet: {
    icon: Wallet,
    label: "Address",
    color: "bg-green-500/10 text-green-500",
  },
};

export default function SearchPage() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const query = params.get("q") || "";
  const networkParam = params.get("network") as NetworkId || "btc";
  const { selectedNetwork } = useNetwork();

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const searchType = detectSearchType(query);

    setTimeout(() => {
      if (searchType === "unknown") {
        setSearchError("Could not determine search type. Please enter a valid block number, transaction hash, or wallet address.");
        setResults([]);
      } else {
        setResults([
          {
            type: searchType,
            value: query,
            network: networkParam || selectedNetwork,
            display: query,
          },
        ]);
      }
      setIsSearching(false);
    }, 500);
  }, [query, networkParam, selectedNetwork]);

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case "block":
        return `/block/${result.network}/${result.value}`;
      case "transaction":
        return `/tx/${result.network}/${result.value}`;
      case "wallet":
        return `/wallet/${result.network}/${result.value}`;
    }
  };

  return (
    <div className="container px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search Results</h1>

        <div className="mb-8">
          <SearchBar variant="hero" />
        </div>

        {query && (
          <p className="text-muted-foreground mb-6">
            Showing results for: <span className="font-mono text-foreground">{query}</span>
          </p>
        )}

        {isSearching ? (
          <LoadingState message="Searching..." />
        ) : searchError ? (
          <Card className="border-destructive/50">
            <CardContent className="flex items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Invalid Search</p>
                <p className="text-sm text-muted-foreground">{searchError}</p>
              </div>
            </CardContent>
          </Card>
        ) : results.length === 0 && query ? (
          <EmptyState
            icon="search"
            title="No results found"
            description={`We couldn't find any results matching "${query}"`}
          />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, i) => {
              const config = typeConfig[result.type];
              const Icon = config.icon;

              return (
                <Link key={i} href={getResultLink(result)}>
                  <Card className="hover-elevate cursor-pointer transition-all" data-testid={`search-result-${i}`}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          config.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                          <NetworkBadge networkId={result.network} />
                        </div>
                        <p className="font-mono text-sm truncate">{result.display}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : !query ? (
          <EmptyState
            icon="search"
            title="Enter a search query"
            description="Search for blocks, transactions, or wallet addresses across all supported networks."
          />
        ) : null}
      </div>
    </div>
  );
}
