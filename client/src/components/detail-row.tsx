import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export function DetailRow({ label, children, className, mono = false }: DetailRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0",
        className
      )}
    >
      <span className="text-sm text-muted-foreground font-medium mb-1 sm:mb-0">
        {label}
      </span>
      <span
        className={cn(
          "text-sm sm:text-base break-all",
          mono && "font-mono"
        )}
      >
        {children}
      </span>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("space-y-0", className)}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="bg-muted/30 rounded-lg px-4">{children}</div>
    </div>
  );
}
