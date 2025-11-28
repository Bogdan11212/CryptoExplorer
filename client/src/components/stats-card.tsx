import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-visible hover-elevate", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide font-medium">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 truncate">{value}</p>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 mt-2 text-xs font-medium",
                  trend.value > 0 ? "text-green-500" : trend.value < 0 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
