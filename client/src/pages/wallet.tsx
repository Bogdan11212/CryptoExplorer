import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Activity, Clock, Coins, Image, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NetworkBadge } from "@/components/network-selector";
import { AddressDisplay } from "@/components/copy-button";
import { StatsCard } from "@/components/stats-card";
import { DetailRow } from "@/components/detail-row";
import { TransactionsTable, TableSkeleton } from "@/components/data-table";
import { ErrorState, LoadingState, EmptyState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { type WalletInfo, type TransactionInfo, type NetworkId } from "@shared/schema";
import { formatCurrency, formatCryptoAmount, formatDateTime, formatTimeAgo, cn, truncateAddress } from "@/lib/utils";
import { NetworkIcon } from "@/components/crypto-icons";
import { useToast } from "@/hooks/use-toast";

export default function WalletPage() {
  const params = useParams<{ network: string; address: string }>();
  const networkId = params.network as NetworkId;
  const address = params.address;
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: wallet, isLoading, error } = useQuery<WalletInfo>({
    queryKey: ["/api/wallet", networkId, address],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<TransactionInfo[]>({
    queryKey: ["/api/wallet", networkId, address, "transactions"],
    enabled: !!wallet,
  });

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address || "");
      setCopiedAddress(true);
      toast({ title: "Copied!", description: "Address copied to clipboard" });
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy address", variant: "destructive" });
    }
  };

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

  const tokens = wallet.tokens || [];
  const nfts = wallet.nfts || [];

  return (
    <div className="container px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: network.color }}
            >
              <NetworkIcon networkId={networkId} className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Wallet Details</h1>
            <NetworkBadge networkId={networkId} />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-mono">
              {truncateAddress(wallet.address, 12)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyAddress}
              data-testid="button-copy-address"
            >
              {copiedAddress ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/20 mb-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="transactions" className="gap-2" data-testid="tab-transactions">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2" data-testid="tab-tokens">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Tokens</span>
            {tokens.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tokens.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="nfts" className="gap-2" data-testid="tab-nfts">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">NFTs</span>
            {nfts.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {nfts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2" data-testid="tab-details">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <TableSkeleton rows={10} />
              ) : transactions && transactions.length > 0 ? (
                <TransactionsTable
                  transactions={transactions}
                  networkId={networkId}
                  showViewAll={false}
                />
              ) : (
                <EmptyState
                  icon="empty"
                  title="No transactions found"
                  description="This address has no transaction history yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Token Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tokens.length > 0 ? (
                <div className="space-y-3">
                  {tokens.map((token, index) => (
                    <div
                      key={`${token.symbol}-${index}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover-elevate"
                      data-testid={`token-${token.symbol}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">
                          {parseFloat(token.balance).toLocaleString()} {token.symbol}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${parseFloat(token.value).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="empty"
                  title="No tokens found"
                  description="This address doesn't hold any tokens"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                NFT Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nfts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nfts.map((nft, index) => (
                    <div
                      key={`${nft.id}-${index}`}
                      className="rounded-lg border overflow-hidden hover-elevate cursor-pointer"
                      data-testid={`nft-${nft.id}`}
                    >
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Image className="h-12 w-12 text-primary/50" />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">{nft.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{nft.collection}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="empty"
                  title="No NFTs found"
                  description="This address doesn't own any NFTs"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <DetailRow label="Address" mono>
                  <AddressDisplay address={wallet.address} truncate={false} />
                </DetailRow>
                <DetailRow label="Network">
                  <NetworkBadge networkId={networkId} />
                </DetailRow>
                <DetailRow label="Balance" mono>
                  {formatCryptoAmount(wallet.balance, network.symbol)}
                </DetailRow>
                <DetailRow label="Total Received" mono>
                  {formatCryptoAmount(wallet.received, network.symbol)}
                </DetailRow>
                <DetailRow label="Total Sent" mono>
                  {formatCryptoAmount(wallet.sent, network.symbol)}
                </DetailRow>
                <DetailRow label="Transaction Count">
                  {wallet.transactionCount.toLocaleString()}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
