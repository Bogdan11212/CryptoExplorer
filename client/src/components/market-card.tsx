import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type MarketData, type NetworkId } from "@shared/schema";
import { formatCurrency, formatNumber, getPercentageColor, cn } from "@/lib/utils";
import { NetworkIcon } from "./crypto-icons";

interface MarketCardProps {
  data: MarketData;
  networkId: NetworkId;
}

const networkColors: Record<NetworkId, string> = {
  btc: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  eth: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
  bnb: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
  trc20: "from-red-500/20 to-red-600/5 border-red-500/20",
  ton: "from-sky-500/20 to-sky-600/5 border-sky-500/20",
  ltc: "from-gray-400/20 to-gray-500/5 border-gray-400/20",
};

const networkIconColors: Record<NetworkId, string> = {
  btc: "bg-orange-500",
  eth: "bg-indigo-500",
  bnb: "bg-yellow-500",
  trc20: "bg-red-500",
  ton: "bg-sky-500",
  ltc: "bg-gray-400",
};

export function MarketCard({ data, networkId }: MarketCardProps) {
  const change24h = parseFloat(data.percent_change_24h);
  const isPositive = change24h > 0;
  const isNegative = change24h < 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Card
      className={cn(
        "overflow-visible border bg-gradient-to-br transition-all duration-300",
        networkColors[networkId],
        "hover-elevate"
      )}
      data-testid={`card-market-${networkId}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                networkIconColors[networkId]
              )}
            >
              <NetworkIcon networkId={networkId} className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">{data.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{data.symbol}</p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isPositive
                ? "bg-green-500/10 text-green-500"
                : isNegative
                ? "bg-red-500/10 text-red-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(change24h).toFixed(2)}%</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {formatCurrency(data.price_usd)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Market Cap</p>
              <p className="text-sm font-medium">${formatNumber(data.market_cap_usd)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Volume 24h</p>
              <p className="text-sm font-medium">${formatNumber(data.volume24)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <div className="mt-4 space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
