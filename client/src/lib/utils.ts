import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string, decimals = 2): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "0";

  if (n >= 1e12) {
    return `${(n / 1e12).toFixed(decimals)}T`;
  } else if (n >= 1e9) {
    return `${(n / 1e9).toFixed(decimals)}B`;
  } else if (n >= 1e6) {
    return `${(n / 1e6).toFixed(decimals)}M`;
  } else if (n >= 1e3) {
    return `${(n / 1e3).toFixed(decimals)}K`;
  }
  return n.toFixed(decimals);
}

export function formatCurrency(num: number | string, decimals = 2): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatCryptoAmount(amount: string | number, symbol: string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return `0 ${symbol}`;

  if (n < 0.00001) {
    return `${n.toExponential(4)} ${symbol}`;
  } else if (n < 1) {
    return `${n.toFixed(8)} ${symbol}`;
  } else if (n < 1000) {
    return `${n.toFixed(4)} ${symbol}`;
  }
  return `${formatNumber(n)} ${symbol}`;
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function truncateHash(hash: string, length = 16): string {
  if (hash.length <= length) return hash;
  const half = Math.floor(length / 2);
  return `${hash.slice(0, half)}...${hash.slice(-half)}`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getPercentageColor(percent: number | string): string {
  const p = typeof percent === "string" ? parseFloat(percent) : percent;
  if (p > 0) return "text-green-500";
  if (p < 0) return "text-red-500";
  return "text-muted-foreground";
}

export function detectSearchType(query: string): "block" | "transaction" | "wallet" | "unknown" {
  const trimmed = query.trim();

  if (/^\d+$/.test(trimmed)) {
    return "block";
  }

  if (/^(0x)?[a-fA-F0-9]{64}$/.test(trimmed)) {
    return "transaction";
  }

  if (
    /^(0x)?[a-fA-F0-9]{40}$/.test(trimmed) ||
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed) ||
    /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/.test(trimmed) ||
    /^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(trimmed) ||
    /^ltc1[a-zA-HJ-NP-Z0-9]{25,90}$/.test(trimmed) ||
    /^T[a-zA-Z0-9]{33}$/.test(trimmed) ||
    /^(EQ|UQ)[a-zA-Z0-9_-]{46,48}$/.test(trimmed) ||
    /^bnb[a-z0-9]{38,42}$/.test(trimmed) ||
    /^0x[a-fA-F0-9]{40}$/.test(trimmed)
  ) {
    return "wallet";
  }

  return "unknown";
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
