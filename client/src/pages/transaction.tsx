import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, ArrowRightLeft, Clock, Hash, Coins, Fuel, CheckCircle, AlertCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NetworkBadge } from "@/components/network-selector";
import { HashDisplay, AddressDisplay } from "@/components/copy-button";
import { DetailRow } from "@/components/detail-row";
import { ErrorState, LoadingState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { type TransactionInfo, type NetworkId } from "@shared/schema";
import { formatDateTime, formatCryptoAmount, cn } from "@/lib/utils";

const statusConfig = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  pending: {
    label: "Pending",
    icon: Hourglass,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

export default function TransactionPage() {
  const params = useParams<{ network: string; txHash: string }>();
  const networkId = params.network as NetworkId;
  const txHash = params.txHash;
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);

  const { data: tx, isLoading, error } = useQuery<TransactionInfo>({
    queryKey: ["/api/transaction", networkId, txHash],
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <LoadingState message="Loading transaction details..." />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="container px-4 py-8">
        <ErrorState
          title="Transaction not found"
          message={`Could not find transaction ${txHash?.slice(0, 16)}... on the ${networkId.toUpperCase()} network.`}
        />
      </div>
    );
  }

  const status = statusConfig[tx.status];
  const StatusIcon = status.icon;

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
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">Transaction</h1>
              <NetworkBadge networkId={networkId} />
              <Badge className={cn("border", status.className)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {tx.hash.slice(0, 16)}...{tx.hash.slice(-12)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <DetailRow label="Transaction Hash" mono>
                <HashDisplay hash={tx.hash} truncate={false} />
              </DetailRow>
              <DetailRow label="Status">
                <Badge className={cn("border", status.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </DetailRow>
              <DetailRow label="Block">
                <Link href={`/block/${networkId}/${tx.blockHeight}`}>
                  <span className="text-primary hover:underline font-mono">
                    #{tx.blockHeight.toLocaleString()}
                  </span>
                </Link>
              </DetailRow>
              <DetailRow label="Timestamp">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDateTime(tx.time)}
                </div>
              </DetailRow>
              <DetailRow label="Confirmations">
                <Badge variant="secondary" className="font-mono">
                  {tx.confirmations.toLocaleString()} confirmations
                </Badge>
              </DetailRow>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-2xl font-bold font-mono">
                    {formatCryptoAmount(tx.value, network.symbol)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction Fee</p>
                  <p className="text-lg font-mono">
                    {formatCryptoAmount(tx.fee, network.symbol)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Gas & Inputs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tx.inputCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Input Count</p>
                    <p className="text-lg font-mono">{tx.inputCount}</p>
                  </div>
                )}
                {tx.outputCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Output Count</p>
                    <p className="text-lg font-mono">{tx.outputCount}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>From / To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                  From ({tx.from.length} address{tx.from.length > 1 ? "es" : ""})
                </p>
                <div className="space-y-2">
                  {tx.from.map((addr, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <Link href={`/wallet/${networkId}/${addr}`}>
                        <span className="font-mono text-sm text-primary hover:underline">
                          {addr.slice(0, 12)}...{addr.slice(-8)}
                        </span>
                      </Link>
                      <AddressDisplay address={addr} truncate />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                  To ({tx.to.length} address{tx.to.length > 1 ? "es" : ""})
                </p>
                <div className="space-y-2">
                  {tx.to.map((addr, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <Link href={`/wallet/${networkId}/${addr}`}>
                        <span className="font-mono text-sm text-primary hover:underline">
                          {addr.slice(0, 12)}...{addr.slice(-8)}
                        </span>
                      </Link>
                      <AddressDisplay address={addr} truncate />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
