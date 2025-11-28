import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Blocks, Clock, Hash, Database, Pickaxe, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { NetworkBadge } from "@/components/network-selector";
import { HashDisplay } from "@/components/copy-button";
import { DetailRow, DetailSection } from "@/components/detail-row";
import { TransactionsTable, TableSkeleton } from "@/components/data-table";
import { ErrorState, LoadingState } from "@/components/empty-state";
import { type BlockInfo, type TransactionInfo, type NetworkId } from "@shared/schema";
import { formatDateTime, formatNumber } from "@/lib/utils";

export default function BlockPage() {
  const params = useParams<{ network: string; blockId: string }>();
  const networkId = params.network as NetworkId;
  const blockId = params.blockId;

  const { data: block, isLoading, error } = useQuery<BlockInfo>({
    queryKey: ["/api/block", networkId, blockId],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<TransactionInfo[]>({
    queryKey: ["/api/block", networkId, blockId, "transactions"],
    enabled: !!block,
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <LoadingState message="Loading block details..." />
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="container px-4 py-8">
        <ErrorState
          title="Block not found"
          message={`Could not find block ${blockId} on the ${networkId.toUpperCase()} network.`}
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
            <Blocks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">
                Block #{block.height.toLocaleString()}
              </h1>
              <NetworkBadge networkId={networkId} />
            </div>
            <p className="text-sm text-muted-foreground">Block Details</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <DetailRow label="Block Height" mono>
                <span className="font-semibold">#{block.height.toLocaleString()}</span>
              </DetailRow>
              <DetailRow label="Block Hash" mono>
                <HashDisplay hash={block.hash} truncate={false} />
              </DetailRow>
              <DetailRow label="Timestamp">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDateTime(block.time)}
                </div>
              </DetailRow>
              <DetailRow label="Transactions">
                <Badge variant="secondary" className="font-mono">
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  {block.transactionCount} transactions
                </Badge>
              </DetailRow>
              <DetailRow label="Size">
                <span className="font-mono">{(block.size / 1024).toFixed(2)} KB</span>
              </DetailRow>
              {block.miner && (
                <DetailRow label="Miner" mono>
                  <Link href={`/wallet/${networkId}/${block.miner}`}>
                    <span className="text-primary hover:underline">
                      {block.miner.slice(0, 12)}...{block.miner.slice(-8)}
                    </span>
                  </Link>
                </DetailRow>
              )}
              {block.reward && (
                <DetailRow label="Block Reward" mono>
                  {block.reward}
                </DetailRow>
              )}
              {block.difficulty && (
                <DetailRow label="Difficulty" mono>
                  {block.difficulty}
                </DetailRow>
              )}
              {block.nonce && (
                <DetailRow label="Nonce" mono>
                  {block.nonce}
                </DetailRow>
              )}
              {block.merkleRoot && (
                <DetailRow label="Merkle Root" mono>
                  <HashDisplay hash={block.merkleRoot} />
                </DetailRow>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Block Transactions</h2>
          {txLoading ? (
            <TableSkeleton rows={5} />
          ) : transactions && transactions.length > 0 ? (
            <TransactionsTable
              transactions={transactions}
              networkId={networkId}
              showViewAll={false}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No transactions in this block</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link href={`/block/${networkId}/${block.height - 1}`}>
            <Button variant="outline" disabled={block.height <= 0} data-testid="button-prev-block">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Block
            </Button>
          </Link>
          <Link href={`/block/${networkId}/${block.height + 1}`}>
            <Button variant="outline" data-testid="button-next-block">
              Next Block
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
