import { z } from "zod";

export type NetworkId = 'btc' | 'eth' | 'bnb' | 'trc20' | 'ton' | 'ltc';

export interface Network {
  id: NetworkId;
  name: string;
  symbol: string;
  color: string;
  icon: string;
  coinloreId: string;
  blockchairName: string;
}

export const NETWORKS: Network[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', icon: '₿', coinloreId: '90', blockchairName: 'bitcoin' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'Ξ', coinloreId: '80', blockchairName: 'ethereum' },
  { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F', icon: 'B', coinloreId: '2710', blockchairName: 'bnb' },
  { id: 'trc20', name: 'TRON', symbol: 'TRX', color: '#FF0013', icon: 'T', coinloreId: '2713', blockchairName: 'tron' },
  { id: 'ton', name: 'TON', symbol: 'TON', color: '#0098EA', icon: '◎', coinloreId: '54683', blockchairName: 'ton' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', color: '#BFBBBB', icon: 'Ł', coinloreId: '1', blockchairName: 'litecoin' },
];

export const marketDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  price_usd: z.string(),
  percent_change_24h: z.string(),
  percent_change_7d: z.string(),
  market_cap_usd: z.string(),
  volume24: z.number().or(z.string()),
  csupply: z.string().optional(),
  tsupply: z.string().optional(),
});

export type MarketData = z.infer<typeof marketDataSchema>;

export interface BlockInfo {
  height: number;
  hash: string;
  time: string;
  transactionCount: number;
  size: number;
  miner?: string;
  reward?: string;
  difficulty?: string;
  nonce?: string;
  merkleRoot?: string;
}

export interface TransactionInfo {
  hash: string;
  blockHeight: number;
  time: string;
  from: string[];
  to: string[];
  value: string;
  fee: string;
  confirmations: number;
  status: 'confirmed' | 'pending' | 'failed';
  inputCount?: number;
  outputCount?: number;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  balance: string;
  value: string;
}

export interface NFTInfo {
  id: string;
  name: string;
  collection: string;
  image: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  balanceUsd?: string;
  transactionCount: number;
  firstSeen?: string;
  lastSeen?: string;
  received: string;
  sent: string;
  tokens?: TokenInfo[];
  nfts?: NFTInfo[];
}

export interface SearchResult {
  type: 'block' | 'transaction' | 'wallet';
  value: string;
  network: NetworkId;
}

export interface NetworkStats {
  blocks: number;
  transactions: number;
  difficulty?: string;
  hashrate?: string;
  avgBlockTime?: number;
  avgFee?: string;
  mempoolSize?: number;
}
