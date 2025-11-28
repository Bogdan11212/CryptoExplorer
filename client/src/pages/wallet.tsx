import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetworkBadge } from "@/components/network-selector";
import { AddressDisplay } from "@/components/copy-button";
import { StatsCard } from "@/components/stats-card";
import { DetailRow } from "@/components/detail-row";
import { TransactionsTable, TableSkeleton } from "@/components/data-table";
import { ErrorState, LoadingState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { type WalletInfo, type TransactionInfo, type NetworkId } from "@shared/schema";
import { formatCurrency, formatCryptoAmount, formatDateTime, formatTimeAgo } from "@/lib/utils";

export default function WalletPage() {
  const params = useParams<{ network: string; address: string }>();
  const networkId = params.network as NetworkId;
  const address = params.address;
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);

  const { data: wallet, isLoading, error } = useQuery<WalletInfo>({
    queryKey: ["/api/wallet", networkId, address],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<TransactionInfo[]>({
    queryKey: ["/api/wallet", networkId, address, "transactions"],
    enabled: !!wallet,
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <LoadingState message="Loading wallet details..." />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="container px-4 py-8">
        <ErrorState
          title="Address not found"
          message={`Could not find address ${address?.slice(0, 16)}... on the ${networkId.toUpperCase()} network.`}
        />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">Address</h1>
              <NetworkBadge networkId={networkId} />
            </div>
            <p className="text-sm text-muted-foreground font-mono hidden sm:block">
              {wallet.address}
            </p>
            <p className="text-sm text-muted-foreground font-mono sm:hidden">
              {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <CardContent className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="text-3xl sm:text-4xl font-bold font-mono">
                  {formatCryptoAmount(wallet.balance, network.symbol)}
                </p>
                {wallet.balanceUsd && (
                  <p className="text-lg text-muted-foreground mt-1">
                    {formatCurrency(wallet.balanceUsd)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AddressDisplay address={wallet.address} truncate={false} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Transactions"
            value={wallet.transactionCount.toLocaleString()}
            icon={Activity}
          />
          <StatsCard
            title="Total Received"
            value={formatCryptoAmount(wallet.received, network.symbol)}
            icon={ArrowDownLeft}
          />
          <StatsCard
            title="Total Sent"
            value={formatCryptoAmount(wallet.sent, network.symbol)}
            icon={ArrowUpRight}
          />
          <StatsCard
            title="Last Active"
            value={wallet.lastSeen ? formatTimeAgo(wallet.lastSeen) : "---"}
            icon={Clock}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <DetailRow label="Address" mono>
                <AddressDisplay address={wallet.address} truncate={false} />
              </DetailRow>
              <DetailRow label="Network">
                <NetworkBadge networkId={networkId} />
              </DetailRow>
              {wallet.firstSeen && (
                <DetailRow label="First Seen">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(wallet.firstSeen)}
                  </div>
                </DetailRow>
              )}
              {wallet.lastSeen && (
                <DetailRow label="Last Seen">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(wallet.lastSeen)}
                  </div>
                </DetailRow>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {txLoading ? (
            <TableSkeleton rows={10} />
          ) : transactions && transactions.length > 0 ? (
            <TransactionsTable
              transactions={transactions}
              networkId={networkId}
              showViewAll={false}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No transactions found for this address</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
