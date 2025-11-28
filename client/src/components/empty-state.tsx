import { Search, AlertCircle, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: "search" | "error" | "empty";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const icons = {
  search: Search,
  error: AlertCircle,
  empty: Inbox,
};

export function EmptyState({
  icon = "empty",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick} data-testid="button-empty-action">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-destructive/50", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" data-testid="button-retry">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
