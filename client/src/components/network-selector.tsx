import { useNetwork } from "@/lib/network-context";
import { cn } from "@/lib/utils";
import { type NetworkId } from "@shared/schema";

const networkColors: Record<NetworkId, string> = {
  btc: "bg-orange-500",
  eth: "bg-indigo-500",
  bnb: "bg-yellow-500",
  trc20: "bg-red-500",
  ton: "bg-sky-500",
  ltc: "bg-gray-400",
};

const networkHoverColors: Record<NetworkId, string> = {
  btc: "hover:bg-orange-500/20",
  eth: "hover:bg-indigo-500/20",
  bnb: "hover:bg-yellow-500/20",
  trc20: "hover:bg-red-500/20",
  ton: "hover:bg-sky-500/20",
  ltc: "hover:bg-gray-400/20",
};

const networkActiveColors: Record<NetworkId, string> = {
  btc: "bg-orange-500/20 ring-orange-500",
  eth: "bg-indigo-500/20 ring-indigo-500",
  bnb: "bg-yellow-500/20 ring-yellow-500",
  trc20: "bg-red-500/20 ring-red-500",
  ton: "bg-sky-500/20 ring-sky-500",
  ltc: "bg-gray-400/20 ring-gray-400",
};

export function NetworkSelector() {
  const { selectedNetwork, setSelectedNetwork, networks } = useNetwork();

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 backdrop-blur-sm rounded-lg">
      {networks.map((network) => {
        const isActive = selectedNetwork === network.id;
        return (
          <button
            key={network.id}
            onClick={() => setSelectedNetwork(network.id)}
            data-testid={`button-network-${network.id}`}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isActive
                ? cn(networkActiveColors[network.id], "ring-1")
                : cn(
                    "text-muted-foreground",
                    networkHoverColors[network.id],
                    "hover:text-foreground"
                  )
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold",
                networkColors[network.id]
              )}
            >
              {network.icon}
            </span>
            <span className="hidden sm:inline">{network.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NetworkBadge({ networkId }: { networkId: NetworkId }) {
  const { getNetwork } = useNetwork();
  const network = getNetwork(networkId);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
        networkColors[networkId],
        "text-white"
      )}
      data-testid={`badge-network-${networkId}`}
    >
      <span>{network.icon}</span>
      <span>{network.symbol}</span>
    </span>
  );
}
