import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NetworkBadge } from "@/components/network-selector";
import { TransactionsTable, MobileTransactionCard, TableSkeleton } from "@/components/data-table";
import { ErrorState, EmptyState } from "@/components/empty-state";
import { useNetwork } from "@/lib/network-context";
import { type TransactionInfo } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const { selectedNetwork, getNetwork } = useNetwork();
  const network = getNetwork(selectedNetwork);
  const isMobile = useIsMobile();

  const { data: transactions, isLoading, error } = useQuery<TransactionInfo[]>({
    queryKey: ["/api/transactions", selectedNetwork, page],
  });

  const { data: stats } = useQuery<{ totalTransactions: number }>({
    queryKey: ["/api/stats", selectedNetwork],
  });

  const totalPages = Math.ceil((stats?.totalTransactions || 0) / 20);

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
              <NetworkBadge networkId={selectedNetwork} />
            </div>
            <p className="text-sm text-muted-foreground">
              {network.name} Network Transactions
            </p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="mb-6">
          <Badge variant="secondary" className="font-mono">
            Total: {stats.totalTransactions?.toLocaleString() || 0} transactions
          </Badge>
        </div>
      )}

      {isLoading ? (
        isMobile ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-muted rounded w-32" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <TableSkeleton rows={10} />
        )
      ) : error ? (
        <ErrorState
          title="Failed to load transactions"
          message="Could not fetch transaction data. Please try again."
        />
      ) : transactions && transactions.length > 0 ? (
        <>
          {isMobile ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <MobileTransactionCard key={tx.hash} tx={tx} networkId={selectedNetwork} />
              ))}
            </div>
          ) : (
            <TransactionsTable
              transactions={transactions}
              networkId={selectedNetwork}
              showViewAll={false}
            />
          )}

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} {totalPages > 0 && `of ${totalPages}`}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={transactions.length < 20}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          icon="empty"
          title="No transactions found"
          description="No transactions are available for this network."
        />
      )}
    </div>
  );
}
