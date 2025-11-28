
# CryptoExplorer 🔍

> Multi-chain blockchain explorer for real-time cryptocurrency data across 6 major networks

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express)](https://expressjs.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/bogdan11212/CryptoExplorer)

## 📋 Overview

CryptoExplorer is a modern, full-stack blockchain explorer that provides real-time access to blockchain data across six major cryptocurrency networks. Built with a focus on data clarity, performance, and user experience, it combines Apple's design philosophy with fintech industry best practices.

### Supported Networks

| Network | Symbol | Features |
|---------|--------|----------|
| **Bitcoin** | BTC | Block explorer, transaction tracking, wallet lookup |
| **Ethereum** | ETH | Smart contract data, gas tracking, address monitoring |
| **BNB Chain** | BNB | BSC network data, token transfers |
| **TRON** | TRC-20 | TRC-20 token support, smart contracts |
| **TON** | TON | The Open Network blockchain data |
| **Litecoin** | LTC | Fast block times, transaction history |

## ✨ Key Features

### 🔎 Search & Discovery
- **Universal Search**: Auto-detect and search blocks, transactions, and wallet addresses
- **Multi-Network Support**: Switch seamlessly between 6 blockchain networks
- **Real-time Updates**: Automatic data refresh every 15-30 seconds

### 📊 Data Visualization
- **Market Data Cards**: Live cryptocurrency prices, market cap, 24h changes
- **Block Explorer**: Detailed block information with miner data, timestamps, and transaction counts
- **Transaction Tracking**: Complete transaction history with status indicators
- **Wallet Analysis**: Address balance tracking and transaction history

### 🎨 User Experience
- **Apple-Inspired Design**: Glassmorphism effects, smooth animations, blur backgrounds
- **Responsive Layout**: Mobile-first design with touch-optimized interfaces
- **Theme Support**: Light/Dark/System theme modes
- **Accessibility**: WCAG AA compliant with keyboard navigation

## 🏗️ Technical Architecture

### Frontend Stack

```
React 18 + TypeScript
├── UI Framework: shadcn/ui (Radix UI primitives)
├── Styling: Tailwind CSS with custom design tokens
├── Routing: Wouter (lightweight client-side routing)
├── State Management: TanStack Query (React Query)
├── Build Tool: Vite
└── Icons: Lucide React
```

**Key Technologies:**
- **TypeScript**: Full type safety across the application
- **React Query**: Server state management with automatic caching and background refetching
- **Tailwind CSS**: Utility-first styling with custom theme system
- **Wouter**: Minimal routing solution (< 1.5KB)

### Backend Stack

```
Node.js + Express + TypeScript
├── API Layer: RESTful endpoints
├── Database: PostgreSQL via Drizzle ORM
├── Data Sources: Coinlore API, BlockCypher API, Blockchain.info
├── Storage: In-memory caching with database persistence
└── Build: esbuild for production bundling
```

**API Endpoints:**
```
GET /api/market                          - Market data for all networks
GET /api/blocks/:network                 - Latest blocks
GET /api/transactions/:network           - Latest transactions
GET /api/block/:network/:blockId         - Block details
GET /api/transaction/:network/:txHash    - Transaction details
GET /api/wallet/:network/:address        - Wallet information
GET /api/stats/:network                  - Network statistics
GET /api/top-wallets/:network           - Top wallet addresses
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │  TanStack    │  │   Routing    │  │
│  │  (shadcn/ui) │  │    Query     │  │   (Wouter)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Express API   │
                    │   (Port 5000)   │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│  Coinlore API  │  │ BlockCypher API│  │ Blockchain  │
│ (Market Data)  │  │ (Block Data)   │  │    .info    │
└────────────────┘  └────────────────┘  └─────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (optional, uses in-memory storage by default)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/bogdan11212/CryptoExplorer.git
cd cryptoexplorer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables** (optional)
```bash
# For database connection
DATABASE_URL=your_postgresql_connection_string
```

4. **Run development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
cryptoexplorer/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── data-table.tsx # Blockchain data tables
│   │   │   ├── market-card.tsx
│   │   │   ├── search-bar.tsx
│   │   │   └── network-selector.tsx
│   │   ├── pages/             # Route pages
│   │   │   ├── home.tsx
│   │   │   ├── blocks.tsx
│   │   │   ├── transactions.tsx
│   │   │   └── wallet.tsx
│   │   ├── lib/               # Utilities and contexts
│   │   │   ├── network-context.tsx
│   │   │   ├── theme.tsx
│   │   │   └── queryClient.ts
│   │   └── hooks/             # Custom React hooks
│   └── index.html
├── server/                     # Backend Express server
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route handlers
│   ├── storage.ts             # Data persistence layer
│   └── vite.ts                # Vite middleware
├── shared/
│   └── schema.ts              # Shared TypeScript types
├── design_guidelines.md       # UI/UX design system
└── package.json
```

## 🎨 Design System

The application follows a hybrid design approach combining:

- **Apple HIG Principles**: Glassmorphism, blur effects, fluid animations
- **Fintech Patterns**: Data-first hierarchy (inspired by Stripe, Coinbase, Etherscan)
- **Typography**: SF Pro Display / Inter with JetBrains Mono for monospace data
- **Color System**: Network-specific accent colors with dark/light theme support

### Component Library

- **Stat Cards**: Glassmorphic cards with backdrop blur
- **Transaction Tables**: Responsive tables with sticky headers and alternating rows
- **Search Bar**: Prominent, auto-detecting search with network context
- **Network Pills**: Color-coded network indicators
- **Mobile Nav**: Bottom tab bar for mobile, drawer navigation

See [design_guidelines.md](./design_guidelines.md) for complete design specifications.

## 🌐 API Integration

### External APIs

**Coinlore API** (`api.coinlore.net`)
- Market data (price, market cap, volume, 24h changes)
- Multi-currency support
- No authentication required

**BlockCypher API** (`api.blockcypher.com`)
- Block data for BTC, ETH, LTC
- Transaction details
- Address information
- Rate limit: 200 requests/hour (free tier)

**Blockchain.info API** (`blockchain.info`)
- Bitcoin-specific data
- Backup data source
- No rate limits

### Error Handling

- 8-second timeout for all external API calls
- Graceful fallbacks for failed requests
- User-friendly error states with retry options

## 🔧 Configuration

### Network Configuration

Networks are configured in `shared/schema.ts`:

```typescript
export const NETWORKS = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    color: "#f7931a",
    coinloreId: "90",
    blockcypherName: "btc"
  },
  // ... other networks
];
```

### Theme Configuration

Themes use CSS variables defined in `client/src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

## 🚢 Deployment

### Production Deployment

Production configuration:
- Build: `npm run build`
- Start: `npm run start`
- Port: 5000

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (optional)
- `NODE_ENV`: Set to `production` for production builds

## 📊 Performance Optimizations

- **Code Splitting**: Automatic route-based code splitting with Vite
- **Caching**: React Query automatic caching and background refetching
- **Lazy Loading**: Component-level lazy loading for improved initial load
- **Image Optimization**: SVG icons for network logos
- **Skeleton Loaders**: Improved perceived performance during data fetching

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **TanStack Query** for powerful data fetching
- **Coinlore** and **BlockCypher** for blockchain data APIs
- **Radix UI** for accessible component primitives

## 📞 Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/bogdan11212/CryptoExplorer/issues)
- Contact: [ceo@idevs.fun](mailto:ceo@idevs.fun)

---

**Built with ❤️ by iDevs**
