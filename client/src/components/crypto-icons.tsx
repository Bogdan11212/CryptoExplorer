import { type NetworkId } from "@shared/schema";

interface CryptoIconProps {
  className?: string;
}

export function BitcoinIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="Bitcoin"
    >
      <path d="M23.03 14.12c.4-2.68-1.64-4.13-4.43-5.1l.9-3.63-2.21-.55-.88 3.54c-.58-.14-1.18-.28-1.78-.41l.89-3.56-2.21-.55-.9 3.63c-.48-.11-.95-.22-1.41-.33l-3.05-.76-.59 2.36s1.64.38 1.6.4c.9.22 1.06.82 1.03 1.29l-1.04 4.16c.06.02.14.04.23.08-.07-.02-.15-.04-.23-.06l-1.45 5.83c-.11.27-.39.68-1.02.52.02.03-1.6-.4-1.6-.4l-1.1 2.53 2.88.72c.54.13 1.06.27 1.58.4l-.92 3.67 2.21.55.9-3.64c.6.16 1.19.31 1.76.45l-.9 3.61 2.21.55.92-3.66c3.78.72 6.62.43 7.82-3 .96-2.75-.05-4.34-2.04-5.38 1.45-.33 2.54-1.29 2.84-3.25zM19.1 19.7c-.68 2.75-5.31 1.26-6.81.89l1.21-4.87c1.5.37 6.31 1.12 5.6 3.98zm.69-5.63c-.62 2.5-4.47 1.23-5.72.92l1.1-4.42c1.25.31 5.27.89 4.62 3.5z"/>
    </svg>
  );
}

export function EthereumIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="Ethereum"
    >
      <path d="M16 2l-.35.6v18.1l.35.35 8-4.73L16 2z" opacity=".6"/>
      <path d="M16 2l-8 14.32 8 4.73V2z"/>
      <path d="M16 22.84l-.2.24v6.13l.2.57 8-11.27-8 4.33z" opacity=".6"/>
      <path d="M16 29.78v-6.94l-8-4.33 8 11.27z"/>
      <path d="M16 21.05l8-4.73-8-3.64v8.37z" opacity=".2"/>
      <path d="M8 16.32l8 4.73v-8.37l-8 3.64z" opacity=".6"/>
    </svg>
  );
}

export function BnbIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="BNB"
    >
      <path d="M16 4l3.54 3.54-6.18 6.18-3.54-3.54L16 4zM22.18 10.18l3.54 3.54-3.54 3.54-3.54-3.54 3.54-3.54zM6.28 10.18l3.54 3.54-3.54 3.54-3.54-3.54 3.54-3.54zM16 16.36l3.54 3.54L16 23.44l-3.54-3.54L16 16.36zM16 28l-6.18-6.18 3.54-3.54L16 21.1l2.64-2.64 3.54 3.36L16 28z"/>
    </svg>
  );
}

export function TronIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="TRON"
    >
      <path d="M27.43 6.74L7.32 3.21a.63.63 0 00-.67.3L3.1 9.61a.64.64 0 00.17.82l12.25 9.44a.63.63 0 00.96-.17l10.2-12a.63.63 0 00-.25-.96l-2 .04L16 17.3 6.54 9.9l13.82 2.14L27.43 6.74z"/>
      <path d="M16.3 19.95l-.28.32-1.47 11a.63.63 0 001.07.52l10.51-12.42c.28-.33 0-.87-.42-.82l-9.41.4z"/>
    </svg>
  );
}

export function TonIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="TON"
    >
      <path d="M16 3.5L3 13.5h7.5L16 28.5l5.5-15H29L16 3.5zM12.5 15L16 24l3.5-9H12.5z"/>
      <path d="M16 3.5L3 13.5h26L16 3.5z" opacity=".6"/>
    </svg>
  );
}

export function LitecoinIcon({ className }: CryptoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-label="Litecoin"
    >
      <path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm2.2 17.6H10.8l.8-3.2-2 .8.4-1.6 2-.8 1.6-6.4-2 .8.4-1.6 2-.8 2-8h4l-1.6 6.4 2-.8-.4 1.6-2 .8-1.6 6.4h5.6l-.8 3.2z"/>
    </svg>
  );
}

export const CryptoIcons: Record<NetworkId, (props: CryptoIconProps) => JSX.Element> = {
  btc: BitcoinIcon,
  eth: EthereumIcon,
  bnb: BnbIcon,
  trc20: TronIcon,
  ton: TonIcon,
  ltc: LitecoinIcon,
};

interface NetworkIconProps {
  networkId: NetworkId;
  className?: string;
}

export function NetworkIcon({ networkId, className }: NetworkIconProps) {
  const Icon = CryptoIcons[networkId];
  return <Icon className={className} />;
}
