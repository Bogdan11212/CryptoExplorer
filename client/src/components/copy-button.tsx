import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { copyToClipboard, cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className={cn("h-6 w-6", className)}
          data-testid="button-copy"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface HashDisplayProps {
  hash: string;
  truncate?: boolean;
  className?: string;
}

export function HashDisplay({ hash, truncate = true, className }: HashDisplayProps) {
  const displayHash = truncate
    ? `${hash.slice(0, 10)}...${hash.slice(-8)}`
    : hash;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <code className="font-mono text-sm">{displayHash}</code>
      <CopyButton value={hash} />
    </div>
  );
}

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  className?: string;
}

export function AddressDisplay({ address, truncate = true, className }: AddressDisplayProps) {
  const displayAddress = truncate
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <code className="font-mono text-sm">{displayAddress}</code>
      <CopyButton value={address} />
    </div>
  );
}
