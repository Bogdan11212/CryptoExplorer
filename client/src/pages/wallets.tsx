import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Wallet, Star, Plus, Trash2, ExternalLink, Crown, TrendingUp, Copy, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetwork } from "@/lib/network-context";
import { cn, truncateAddress, formatNumber } from "@/lib/utils";
import { type NetworkId, NETWORKS } from "@shared/schema";
import { NetworkIcon } from "@/components/crypto-icons";
import { useToast } from "@/hooks/use-toast";

interface SavedWallet {
  address: string;
  network: NetworkId;
  label: string;
  addedAt: string;
}

function validateWalletAddress(address: string, network: NetworkId): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Address cannot be empty" };
  }

  switch (network) {
    case "btc":
      if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed)) return { valid: true };
      if (/^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/.test(trimmed)) return { valid: true };
      return { valid: false, error: "Invalid Bitcoin address. Must start with 1, 3, or bc1" };
    
    case "eth":
    case "bnb":
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return { valid: true };
      return { valid: false, error: "Invalid address. Must be a 42-character hex string starting with 0x" };
    
    case "trc20":
      if (/^T[a-zA-Z0-9]{33}$/.test(trimmed)) return { valid: true };
      return { valid: false, error: "Invalid TRON address. Must start with T and be 34 characters" };
    
    case "ton":
      if (/^(EQ|UQ)[a-zA-Z0-9_-]{46,48}$/.test(trimmed)) return { valid: true };
      return { valid: false, error: "Invalid TON address. Must start with EQ or UQ" };
    
    case "ltc":
      if (/^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(trimmed)) return { valid: true };
      if (/^ltc1[a-zA-HJ-NP-Z0-9]{25,90}$/.test(trimmed)) return { valid: true };
      return { valid: false, error: "Invalid Litecoin address. Must start with L, M, or ltc1" };
    
    default:
      return { valid: false, error: "Unknown network" };
  }
}

interface TopWallet {
  rank: number;
  address: string;
  balance: string;
  balanceUsd: string;
  label?: string | null;
  type: "exchange" | "whale" | "contract" | "unknown";
}

const STORAGE_KEY = "crypto_explorer_saved_wallets";

const typeColors = {
  exchange: "bg-blue-500/10 text-blue-500",
  whale: "bg-purple-500/10 text-purple-500",
  contract: "bg-orange-500/10 text-orange-500",
  unknown: "bg-muted text-muted-foreground",
};

const typeLabels = {
  exchange: "Exchange",
  whale: "Whale",
  contract: "Contract",
  unknown: "Unknown",
};

function loadSavedWallets(): SavedWallet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSavedWallets(wallets: SavedWallet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

function TopWalletSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export default function WalletsPage() {
  const { selectedNetwork } = useNetwork();
  const { toast } = useToast();
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [newWalletNetwork, setNewWalletNetwork] = useState<NetworkId>(selectedNetwork);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"top" | "saved">("top");

  useEffect(() => {
    setSavedWallets(loadSavedWallets());
  }, []);

  const { data: topWallets = [], isLoading: topWalletsLoading, error: topWalletsError } = useQuery<TopWallet[]>({
    queryKey: [`/api/top-wallets/${selectedNetwork}`],
    staleTime: 60000,
  });

  const handleAddWallet = () => {
    if (!newWalletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    const validation = validateWalletAddress(newWalletAddress, newWalletNetwork);
    if (!validation.valid) {
      toast({
        title: "Invalid Address",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const newWallet: SavedWallet = {
      address: newWalletAddress.trim(),
      network: newWalletNetwork,
      label: newWalletLabel.trim() || "My Wallet",
      addedAt: new Date().toISOString(),
    };

    const exists = savedWallets.some(
      w => w.address.toLowerCase() === newWallet.address.toLowerCase() && w.network === newWallet.network
    );

    if (exists) {
      toast({
        title: "Already saved",
        description: "This wallet is already in your saved list",
        variant: "destructive",
      });
      return;
    }

    const updated = [...savedWallets, newWallet];
    setSavedWallets(updated);
    saveSavedWallets(updated);

    setNewWalletAddress("");
    setNewWalletLabel("");
    setIsAddDialogOpen(false);

    toast({
      title: "Wallet saved",
      description: "The wallet has been added to your saved list",
    });
  };

  const handleRemoveWallet = (address: string, network: NetworkId) => {
    const updated = savedWallets.filter(
      w => !(w.address.toLowerCase() === address.toLowerCase() && w.network === network)
    );
    setSavedWallets(updated);
    saveSavedWallets(updated);

    toast({
      title: "Wallet removed",
      description: "The wallet has been removed from your saved list",
    });
  };

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
    
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const filteredSavedWallets = savedWallets.filter(w => w.network === selectedNetwork);

  return (
    <div className="container px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Wallets</h1>
              <p className="text-sm text-muted-foreground">
                Top wallets and your saved addresses
              </p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-wallet">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Wallet</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Network</label>
                  <Select value={newWalletNetwork} onValueChange={(v) => setNewWalletNetwork(v as NetworkId)}>
                    <SelectTrigger data-testid="select-wallet-network">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NETWORKS.map(network => (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: network.color }}
                            >
                              <NetworkIcon networkId={network.id} className="w-3 h-3" />
                            </div>
                            {network.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Wallet Address</label>
                  <Input
                    placeholder="Enter wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    data-testid="input-wallet-address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Label (optional)</label>
                  <Input
                    placeholder="e.g. My Cold Wallet"
                    value={newWalletLabel}
                    onChange={(e) => setNewWalletLabel(e.target.value)}
                    data-testid="input-wallet-label"
                  />
                </div>
                <Button onClick={handleAddWallet} className="w-full" data-testid="button-save-wallet">
                  Save Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "top" | "saved")}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="top" className="gap-2" data-testid="tab-top-wallets">
              <Crown className="h-4 w-4" />
              Top Wallets
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2" data-testid="tab-saved-wallets">
              <Star className="h-4 w-4" />
              My Wallets
              {filteredSavedWallets.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {filteredSavedWallets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Top {NETWORKS.find(n => n.id === selectedNetwork)?.name} Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topWalletsLoading ? (
                  <>
                    <TopWalletSkeleton />
                    <TopWalletSkeleton />
                    <TopWalletSkeleton />
                    <TopWalletSkeleton />
                    <TopWalletSkeleton />
                  </>
                ) : topWalletsError || topWallets.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No top wallets data available</h3>
                    <p className="text-muted-foreground text-sm">
                      Top wallet data is temporarily unavailable for this network.
                      <br />
                      Try switching to Bitcoin, Ethereum, or Litecoin for real-time data.
                    </p>
                  </div>
                ) : (
                  topWallets.map((wallet) => {
                    const network = NETWORKS.find(n => n.id === selectedNetwork);
                    return (
                      <Link key={wallet.address} href={`/wallet/${selectedNetwork}/${wallet.address}`}>
                        <div
                          className="flex items-center gap-4 p-4 rounded-lg border hover-elevate cursor-pointer"
                          data-testid={`top-wallet-${wallet.rank}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                            #{wallet.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-sm truncate">
                                {truncateAddress(wallet.address, 8, 6)}
                              </span>
                              <Badge className={cn("text-xs", typeColors[wallet.type])}>
                                {typeLabels[wallet.type]}
                              </Badge>
                            </div>
                            {wallet.label && (
                              <p className="text-xs text-muted-foreground">{wallet.label}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${wallet.balanceUsd}</p>
                            <p className="text-xs text-muted-foreground">
                              {wallet.balance} {network?.symbol}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {filteredSavedWallets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Star className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No saved wallets</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Add wallets to track them easily
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Wallet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-muted-foreground" />
                    My {NETWORKS.find(n => n.id === selectedNetwork)?.name} Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredSavedWallets.map((wallet) => {
                    const network = NETWORKS.find(n => n.id === wallet.network);
                    return (
                      <div
                        key={`${wallet.network}-${wallet.address}`}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                        data-testid={`saved-wallet-${wallet.address.slice(0, 8)}`}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: network?.color }}
                        >
                          <NetworkIcon networkId={wallet.network} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{wallet.label}</p>
                          <p className="font-mono text-sm text-muted-foreground truncate">
                            {truncateAddress(wallet.address, 10, 8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyAddress(wallet.address)}
                            data-testid={`button-copy-${wallet.address.slice(0, 8)}`}
                          >
                            {copiedAddress === wallet.address ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/wallet/${wallet.network}/${wallet.address}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-${wallet.address.slice(0, 8)}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveWallet(wallet.address, wallet.network)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-remove-${wallet.address.slice(0, 8)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {savedWallets.filter(w => w.network !== selectedNetwork).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-muted-foreground">
                    Wallets on other networks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedWallets
                    .filter(w => w.network !== selectedNetwork)
                    .map((wallet) => {
                      const network = NETWORKS.find(n => n.id === wallet.network);
                      return (
                        <Link
                          key={`${wallet.network}-${wallet.address}`}
                          href={`/wallet/${wallet.network}/${wallet.address}`}
                        >
                          <div className="flex items-center gap-4 p-3 rounded-lg border opacity-75 hover:opacity-100 hover-elevate cursor-pointer">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: network?.color }}
                            >
                              <NetworkIcon networkId={wallet.network} className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{wallet.label}</p>
                              <p className="font-mono text-xs text-muted-foreground truncate">
                                {truncateAddress(wallet.address, 8, 6)} - {network?.symbol}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
