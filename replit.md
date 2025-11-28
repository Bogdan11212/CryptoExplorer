# CryptoExplorer - Multi-Chain Blockchain Explorer

## Overview

CryptoExplorer is a multi-chain blockchain explorer that enables users to search and view blockchain data across six major cryptocurrency networks: Bitcoin (BTC), Ethereum (ETH), BNB Chain, TRON (TRC-20), TON, and Litecoin (LTC). The application provides real-time market data, block information, transaction details, and wallet/address lookups with a modern, responsive interface inspired by Apple's design language and fintech platforms like Stripe and Coinbase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing (alternative to React Router)

**UI Component System**
- shadcn/ui component library (Radix UI primitives) configured in "new-york" style
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting light/dark/system modes with CSS variables
- Typography: SF Pro Display / Inter with JetBrains Mono for monospace data
- Design approach combines Apple HIG principles with fintech patterns (glassmorphism, data-first hierarchy)

**State Management**
- TanStack Query (React Query) for server state management, caching, and background refetching
- React Context for global state (network selection, theme preferences)
- Local component state with useState/useReducer for UI interactions

**Key Design Patterns**
- Component-first architecture with reusable UI primitives
- Mobile-first responsive design with dedicated mobile navigation patterns
- Toast notifications for user feedback
- Skeleton loaders for improved perceived performance

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- RESTful API design pattern
- HTTP server created using Node's built-in `http` module for potential WebSocket support

**API Structure**
- `/api/market` - Fetches cryptocurrency market data from Coinlore API
- `/api/blocks/:network` - Retrieves latest blocks for specified network
- `/api/transactions/:network` - Retrieves latest transactions
- `/api/block/:network/:blockId` - Individual block details
- `/api/transaction/:network/:txHash` - Transaction details
- `/api/wallet/:network/:address` - Wallet/address information
- `/api/stats/:network` - Network statistics (total blocks, transactions, avg block time)

**Data Layer**
- In-memory storage implementation (MemStorage) for user data
- Schema-first approach using Zod for runtime type validation
- Drizzle ORM configured for PostgreSQL (database provisioning expected)
- Database schema defined in `shared/schema.ts` for type sharing between client/server

**Multi-Network Support**
- Network configuration mapping for 6 blockchains (BTC, ETH, BNB, TRC-20, TON, LTC)
- Each network has associated coinloreId and blockcypherName identifiers
- Network-specific API routing and data transformation

### External Dependencies

**Blockchain Data APIs**
- **Coinlore API** (`api.coinlore.net`) - Primary source for cryptocurrency market data (price, market cap, 24h change, volume)
- **Blockchain.info API** (`blockchain.info`) - Bitcoin blockchain data
- **BlockCypher API** (`api.blockcypher.com/v1`) - Multi-chain blockchain data for BTC, ETH, LTC

**Database**
- PostgreSQL (via Neon serverless) - Production database for persistent storage
- Connection managed through Drizzle ORM
- Database URL expected via `DATABASE_URL` environment variable

**UI Component Dependencies**
- Radix UI component primitives (@radix-ui/*) - Accessible, unstyled components
- Lucide React - Icon library
- date-fns - Date formatting and manipulation
- class-variance-authority (CVA) - Component variant management
- embla-carousel-react - Carousel/slider functionality

**Development Tools**
- tsx - TypeScript execution for development
- esbuild - Server bundling for production
- ESLint/TypeScript - Code quality and type checking
- Replit-specific plugins for development environment integration

**Network Timeout Strategy**
- Custom `fetchWithTimeout` utility with 8-second default timeout to handle slow/unreliable blockchain API responses
- Graceful error handling for failed external API calls