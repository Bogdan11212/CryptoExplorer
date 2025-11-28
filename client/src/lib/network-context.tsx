import { createContext, useContext, useState } from "react";
import { type NetworkId, NETWORKS } from "@shared/schema";

type NetworkContextType = {
  selectedNetwork: NetworkId;
  setSelectedNetwork: (network: NetworkId) => void;
  getNetwork: (id: NetworkId) => typeof NETWORKS[0];
  networks: typeof NETWORKS;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>("btc");

  const getNetwork = (id: NetworkId) => {
    return NETWORKS.find((n) => n.id === id) || NETWORKS[0];
  };

  return (
    <NetworkContext.Provider
      value={{
        selectedNetwork,
        setSelectedNetwork,
        getNetwork,
        networks: NETWORKS,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
