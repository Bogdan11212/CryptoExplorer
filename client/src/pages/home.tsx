import { useQuery } from "@tanstack/react-query";
import { Blocks, ArrowRightLeft, Activity, Clock } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { MarketCard, MarketCardSkeleton } from "@/components/market-card";
import { BlocksTable, TransactionsTable, TableSkeleton } from "@/components/data-table";
import { StatsCard, StatsCardSkeleton } from "@/components/stats-card";
import { ErrorState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { type MarketData, type BlockInfo, type TransactionInfo, NETWORKS } from "@shared/schema";

export default function Home() {
  const { selectedNetwork, getNetwork } = useNetwork();
  const currentNetwork = getNetwork(selectedNetwork);

  const { data: marketData, isLoading: marketLoading, error: marketError } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
    refetchInterval: 30000,
  });

  const { data: blocksData, isLoading: blocksLoading, error: blocksError } = useQuery<BlockInfo[]>({
    queryKey: ["/api/blocks", selectedNetwork],
    refetchInterval: 15000,
  });

  const { data: txData, isLoading: txLoading, error: txError } = useQuery<TransactionInfo[]>({
    queryKey: ["/api/transactions", selectedNetwork],
    refetchInterval: 15000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{
    totalBlocks: number;
    totalTransactions: number;
    avgBlockTime: number;
    difficulty: string;
  }>({
    queryKey: ["/api/stats", selectedNetwork],
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container relative px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Multi-Chain Blockchain Explorer
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore blocks, transactions, and addresses across Bitcoin, Ethereum, BNB, TRON, TON, and Litecoin networks
            </p>
            <SearchBar variant="hero" className="mx-auto" />
          </div>
        </div>
      </section>

      <section className="container px-4 -mt-4">
        <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketLoading
            ? NETWORKS.map((n) => <MarketCardSkeleton key={n.id} />)
            : marketError
            ? <ErrorState title="Failed to load market data" className="col-span-full" />
            : marketData?.map((data) => {
                const network = NETWORKS.find(
                  (n) => n.coinloreId === data.id || n.symbol.toLowerCase() === data.symbol.toLowerCase()
                );
                if (!network) return null;
                return (
                  <MarketCard
                    key={network.id}
                    data={data}
                    networkId={network.id}
                  />
                );
              })}
        </div>
      </section>

      <section className="container px-4 mt-8">
        <h2 className="text-xl font-semibold mb-4">
          {currentNetwork.name} Network Stats
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Blocks"
                value={statsData?.totalBlocks?.toLocaleString() || "---"}
                icon={Blocks}
              />
              <StatsCard
                title="Total Transactions"
                value={statsData?.totalTransactions?.toLocaleString() || "---"}
                icon={ArrowRightLeft}
              />
              <StatsCard
                title="Avg Block Time"
                value={statsData?.avgBlockTime ? `${statsData.avgBlockTime}s` : "---"}
                icon={Clock}
              />
              <StatsCard
                title="Difficulty"
                value={statsData?.difficulty || "---"}
                icon={Activity}
              />
            </>
          )}
        </div>
      </section>

      <section className="container px-4 mt-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            {blocksLoading ? (
              <TableSkeleton rows={5} />
            ) : blocksError ? (
              <ErrorState title="Failed to load blocks" />
            ) : blocksData && blocksData.length > 0 ? (
              <BlocksTable blocks={blocksData.slice(0, 5)} networkId={selectedNetwork} />
            ) : (
              <TableSkeleton rows={5} />
            )}
          </div>

          <div>
            {txLoading ? (
              <TableSkeleton rows={5} />
            ) : txError ? (
              <ErrorState title="Failed to load transactions" />
            ) : txData && txData.length > 0 ? (
              <TransactionsTable
                transactions={txData.slice(0, 5)}
                networkId={selectedNetwork}
              />
            ) : (
              <TableSkeleton rows={5} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
