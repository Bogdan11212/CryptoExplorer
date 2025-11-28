import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { Search, Blocks, ArrowRightLeft, Wallet, FileCode, AlertCircle, Filter, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/search-bar";
import { NetworkBadge } from "@/components/network-selector";
import { EmptyState, LoadingState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { detectSearchType, cn, truncateHash } from "@/lib/utils";
import { type NetworkId, NETWORKS } from "@shared/schema";
import { NetworkIcon } from "@/components/crypto-icons";

type SearchType = "all" | "block" | "transaction" | "wallet" | "contract";

interface SearchResult {
  type: "block" | "transaction" | "wallet" | "contract";
  value: string;
  network: NetworkId;
  display: string;
  subtitle?: string;
}

const typeConfig = {
  block: {
    icon: Blocks,
    label: "Block",
    color: "bg-blue-500/10 text-blue-500",
    borderColor: "border-blue-500/30",
  },
  transaction: {
    icon: ArrowRightLeft,
    label: "Transaction",
    color: "bg-purple-500/10 text-purple-500",
    borderColor: "border-purple-500/30",
  },
  wallet: {
    icon: Wallet,
    label: "Address",
    color: "bg-green-500/10 text-green-500",
    borderColor: "border-green-500/30",
  },
  contract: {
    icon: FileCode,
    label: "Contract",
    color: "bg-orange-500/10 text-orange-500",
    borderColor: "border-orange-500/30",
  },
};

const filterTabs = [
  { id: "all" as SearchType, label: "All", icon: Globe },
  { id: "block" as SearchType, label: "Blocks", icon: Blocks },
  { id: "transaction" as SearchType, label: "Transactions", icon: ArrowRightLeft },
  { id: "wallet" as SearchType, label: "Wallets", icon: Wallet },
  { id: "contract" as SearchType, label: "Contracts", icon: FileCode },
];

export default function SearchPage() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const query = params.get("q") || "";
  const networkParam = params.get("network") as NetworkId | null;
  const { selectedNetwork, networks } = useNetwork();

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SearchType>("all");
  const [searchAllNetworks, setSearchAllNetworks] = useState(true);
  const [selectedSearchNetwork, setSelectedSearchNetwork] = useState<NetworkId>(networkParam || selectedNetwork);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const searchType = detectSearchType(query);
    const networksToSearch = searchAllNetworks ? networks : [{ id: selectedSearchNetwork }];

    setTimeout(() => {
      if (searchType === "unknown") {
        const possibleResults: SearchResult[] = [];
        
        networksToSearch.forEach(network => {
          if (/^[a-fA-F0-9]+$/.test(query) && query.length >= 10) {
            possibleResults.push({
              type: "transaction",
              value: query,
              network: network.id as NetworkId,
              display: truncateHash(query, 20),
              subtitle: "Possible transaction hash",
            });
          }
          
          if (query.length >= 20) {
            possibleResults.push({
              type: "wallet",
              value: query,
              network: network.id as NetworkId,
              display: truncateHash(query, 20),
              subtitle: "Possible wallet address",
            });
          }

          if (query.length >= 30 && /^(0x)?[a-fA-F0-9]+$/.test(query)) {
            possibleResults.push({
              type: "contract",
              value: query,
              network: network.id as NetworkId,
              display: truncateHash(query, 20),
              subtitle: "Possible contract address",
            });
          }
        });

        if (possibleResults.length === 0) {
          setSearchError("Could not determine search type. Please enter a valid block number, transaction hash, wallet address, or contract address.");
          setResults([]);
        } else {
          setResults(possibleResults);
        }
      } else {
        const allResults: SearchResult[] = [];
        
        networksToSearch.forEach(network => {
          allResults.push({
            type: searchType === "wallet" ? "wallet" : searchType,
            value: query,
            network: network.id as NetworkId,
            display: searchType === "block" ? `Block #${query}` : truncateHash(query, 20),
            subtitle: searchType === "block" ? "Block height" : searchType === "wallet" ? "Wallet address" : "Transaction hash",
          });

          if (searchType === "wallet" && /^(0x)?[a-fA-F0-9]{40}$/.test(query)) {
            allResults.push({
              type: "contract",
              value: query,
              network: network.id as NetworkId,
              display: truncateHash(query, 20),
              subtitle: "Could also be a smart contract",
            });
          }
        });
        
        setResults(allResults);
      }
      setIsSearching(false);
    }, 500);
  }, [query, selectedSearchNetwork, searchAllNetworks, networks]);

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case "block":
        return `/block/${result.network}/${result.value}`;
      case "transaction":
        return `/tx/${result.network}/${result.value}`;
      case "wallet":
      case "contract":
        return `/wallet/${result.network}/${result.value}`;
    }
  };

  const filteredResults = activeFilter === "all" 
    ? results 
    : results.filter(r => r.type === activeFilter);

  const resultCountByType = {
    all: results.length,
    block: results.filter(r => r.type === "block").length,
    transaction: results.filter(r => r.type === "transaction").length,
    wallet: results.filter(r => r.type === "wallet").length,
    contract: results.filter(r => r.type === "contract").length,
  };

  return (
    <div className="container px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Universal Search</h1>
            <p className="text-sm text-muted-foreground">Search across all networks and data types</p>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar variant="hero" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant={searchAllNetworks ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchAllNetworks(true)}
            className="gap-2"
            data-testid="button-search-all-networks"
          >
            <Globe className="h-4 w-4" />
            All Networks
          </Button>
          
          <div className="flex flex-wrap gap-1.5">
            {NETWORKS.map(network => (
              <Button
                key={network.id}
                variant={!searchAllNetworks && selectedSearchNetwork === network.id ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSearchAllNetworks(false);
                  setSelectedSearchNetwork(network.id);
                }}
                className="gap-1.5"
                data-testid={`button-search-network-${network.id}`}
              >
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: network.color }}
                >
                  <NetworkIcon networkId={network.id} className="w-3 h-3" />
                </div>
                <span className="hidden sm:inline">{network.symbol}</span>
              </Button>
            ))}
          </div>
        </div>

        {query && (
          <>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Filter className="h-4 w-4" />
                  <span>Searching for:</span>
                  <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">{query}</code>
                  <Badge variant="secondary" className="ml-auto">
                    {searchAllNetworks ? "All Networks" : NETWORKS.find(n => n.id === selectedSearchNetwork)?.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as SearchType)} className="mb-6">
              <TabsList className="w-full grid grid-cols-5 h-auto">
                {filterTabs.map(tab => {
                  const count = resultCountByType[tab.id];
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex-col gap-1 py-3 data-[state=active]:bg-primary/10"
                      data-testid={`tab-filter-${tab.id}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <TabIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </div>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </>
        )}

        {isSearching ? (
          <LoadingState message="Searching across all networks..." />
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
        ) : filteredResults.length === 0 && query ? (
          <EmptyState
            icon="search"
            title="No results found"
            description={`We couldn't find any ${activeFilter === "all" ? "results" : activeFilter + "s"} matching "${query}"`}
          />
        ) : filteredResults.length > 0 ? (
          <div className="space-y-3">
            {filteredResults.map((result, i) => {
              const config = typeConfig[result.type];
              const Icon = config.icon;
              const network = NETWORKS.find(n => n.id === result.network);

              return (
                <Link key={`${result.network}-${result.type}-${i}`} href={getResultLink(result)}>
                  <Card 
                    className={cn(
                      "hover-elevate cursor-pointer transition-all border-l-4",
                      config.borderColor
                    )} 
                    data-testid={`search-result-${i}`}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          config.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                          {network && (
                            <div 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: network.color }}
                            >
                              <NetworkIcon networkId={result.network} className="w-3 h-3" />
                              <span>{network.symbol}</span>
                            </div>
                          )}
                        </div>
                        <p className="font-mono text-sm truncate">{result.display}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : !query ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What can you search?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {Object.entries(typeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className={cn("flex items-start gap-3 p-3 rounded-lg", config.color)}>
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">{config.label}s</p>
                      <p className="text-xs opacity-80">
                        {type === "block" && "Search by block number or hash"}
                        {type === "transaction" && "Search by transaction hash"}
                        {type === "wallet" && "Search by wallet address"}
                        {type === "contract" && "Search by contract address"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {!query && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Supported Networks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {NETWORKS.map(network => (
                <Card key={network.id} className="hover-elevate">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: network.color }}
                    >
                      <NetworkIcon networkId={network.id} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{network.name}</p>
                      <p className="text-xs text-muted-foreground">{network.symbol}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
