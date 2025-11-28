import { Link } from "wouter";
import { ExternalLink, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HashDisplay, AddressDisplay } from "./copy-button";
import { type BlockInfo, type TransactionInfo, type NetworkId } from "@shared/schema";
import { formatTimeAgo, formatCryptoAmount, cn } from "@/lib/utils";
import { useNetwork } from "@/lib/network-context";

interface BlocksTableProps {
  blocks: BlockInfo[];
  networkId: NetworkId;
  showViewAll?: boolean;
}

export function BlocksTable({ blocks, networkId, showViewAll = true }: BlocksTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-semibold">Latest Blocks</CardTitle>
        {showViewAll && (
          <Link href="/blocks">
            <Button variant="ghost" size="sm" data-testid="link-view-all-blocks">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Block</TableHead>
                <TableHead className="hidden sm:table-cell">Hash</TableHead>
                <TableHead className="text-center">Txns</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((block) => (
                <TableRow key={block.hash} className="hover-elevate" data-testid={`row-block-${block.height}`}>
                  <TableCell>
                    <Link href={`/block/${networkId}/${block.height}`}>
                      <span className="font-mono font-medium text-primary hover:underline">
                        #{block.height.toLocaleString()}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <HashDisplay hash={block.hash} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-mono">
                      {block.transactionCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {formatTimeAgo(block.time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionsTableProps {
  transactions: TransactionInfo[];
  networkId: NetworkId;
  showViewAll?: boolean;
}

export function TransactionsTable({ transactions, networkId, showViewAll = true }: TransactionsTableProps) {
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-lg font-semibold">Latest Transactions</CardTitle>
        {showViewAll && (
          <Link href="/transactions">
            <Button variant="ghost" size="sm" data-testid="link-view-all-transactions">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hash</TableHead>
                <TableHead className="hidden md:table-cell">From</TableHead>
                <TableHead className="hidden md:table-cell">To</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.hash} className="hover-elevate" data-testid={`row-tx-${tx.hash.slice(0, 8)}`}>
                  <TableCell>
                    <Link href={`/tx/${networkId}/${tx.hash}`}>
                      <span className="font-mono text-sm text-primary hover:underline">
                        {tx.hash.slice(0, 10)}...
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tx.from[0] && (
                      <Link href={`/wallet/${networkId}/${tx.from[0]}`}>
                        <span className="font-mono text-sm hover:text-primary">
                          {tx.from[0].slice(0, 8)}...
                        </span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tx.to[0] && (
                      <Link href={`/wallet/${networkId}/${tx.to[0]}`}>
                        <span className="font-mono text-sm hover:text-primary">
                          {tx.to[0].slice(0, 8)}...
                        </span>
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCryptoAmount(tx.value, network.symbol)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {formatTimeAgo(tx.time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface MobileTransactionCardProps {
  tx: TransactionInfo;
  networkId: NetworkId;
}

export function MobileTransactionCard({ tx, networkId }: MobileTransactionCardProps) {
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);

  return (
    <Card className="hover-elevate" data-testid={`card-tx-${tx.hash.slice(0, 8)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/tx/${networkId}/${tx.hash}`}>
            <span className="font-mono text-sm text-primary hover:underline">
              {tx.hash.slice(0, 12)}...{tx.hash.slice(-8)}
            </span>
          </Link>
          <Badge
            variant={tx.status === "confirmed" ? "default" : "secondary"}
            className={cn(
              tx.status === "confirmed" && "bg-green-500/10 text-green-500 border-green-500/20"
            )}
          >
            {tx.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <Link href={`/wallet/${networkId}/${tx.from[0]}`}>
              <span className="font-mono hover:text-primary">
                {tx.from[0]?.slice(0, 8)}...
              </span>
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <Link href={`/wallet/${networkId}/${tx.to[0]}`}>
              <span className="font-mono hover:text-primary">
                {tx.to[0]?.slice(0, 8)}...
              </span>
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value</span>
            <span className="font-mono font-medium">
              {formatCryptoAmount(tx.value, network.symbol)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{formatTimeAgo(tx.time)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MobileBlockCardProps {
  block: BlockInfo;
  networkId: NetworkId;
}

export function MobileBlockCard({ block, networkId }: MobileBlockCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-block-${block.height}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/block/${networkId}/${block.height}`}>
            <span className="font-mono text-lg font-semibold text-primary hover:underline">
              #{block.height.toLocaleString()}
            </span>
          </Link>
          <Badge variant="secondary" className="font-mono">
            {block.transactionCount} txns
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash</span>
            <HashDisplay hash={block.hash} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span className="font-mono">{(block.size / 1024).toFixed(2)} KB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{formatTimeAgo(block.time)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
