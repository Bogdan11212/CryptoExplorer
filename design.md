# Design Guidelines: Cryptocurrency Blockchain Explorer

## Design Approach
**Hybrid Approach**: Combining Apple HIG principles (iOS 26 aesthetic) with modern fintech design patterns (Stripe, Coinbase, Etherscan). Focus on data clarity with visual polish.

**Key References**:
- Apple HIG for glassmorphism, blur effects, and gesture-friendly interfaces
- Etherscan for blockchain data hierarchy and table patterns
- Stripe Dashboard for clean data presentation and color-coded status indicators

## Core Design Principles
1. **Data-First Hierarchy**: Critical blockchain data (hashes, amounts, timestamps) takes visual priority
2. **Effortless Network Switching**: Prominent, always-visible network selector
3. **Scan-Friendly Tables**: Dense information presented with clear visual breaks
4. **Touch-Optimized**: 44px minimum touch targets, generous spacing for mobile

## Typography System
**Font Family**: SF Pro Display (Apple aesthetic) or Inter (fallback)
- **Headings (H1)**: 32px/40px, weight 700, tight letter-spacing
- **Headings (H2)**: 24px/32px, weight 600
- **Data Labels**: 14px/20px, weight 500, uppercase, tracking-wide
- **Primary Data**: 16px/24px, weight 400 (addresses, hashes use monospace)
- **Monospace Data**: SF Mono or JetBrains Mono for addresses, hashes, amounts

## Layout System
**Spacing Units**: Tailwind scale - use 2, 3, 4, 6, 8, 12, 16 units consistently
- **Component Padding**: p-6 (desktop), p-4 (mobile)
- **Section Spacing**: mb-8 to mb-12 between major sections
- **Card Gaps**: gap-4 for grids, gap-6 for larger breakpoints

**Container Strategy**:
- Max-width: 1280px (max-w-7xl) for main content
- Full-width tables on mobile, contained on desktop
- Sidebar navigation: 280px fixed on desktop, drawer on mobile

## Component Library

### Navigation
- **Top Bar**: Glassmorphic header (backdrop-blur-xl) with search bar, network selector, theme toggle
- **Network Switcher**: Segmented control with 6 network icons (BTC, ETH, BNB, TRC-20, TON, LTC)
- **Mobile Nav**: Bottom tab bar with 4 primary actions (Home, Search, Recent, Settings)

### Data Display
- **Stat Cards**: Glassmorphic cards (bg-white/5, backdrop-blur-md, border-white/10) displaying market cap, price, 24h change
- **Transaction Tables**: 
  - Alternating row backgrounds (subtle)
  - Sticky header on scroll
  - Hash truncation with copy button
  - Status badges (confirmed/pending) with dot indicators
  - Responsive: card layout on mobile, table on desktop
- **Detail Pages**: Two-column layout (labels left, values right) for block/transaction/wallet details

### Interactive Elements
- **Search Bar**: Prominent, centered on homepage, persistent in header on other pages
  - Placeholder: "Search blocks, transactions, addresses..."
  - Auto-detect input type (block number, tx hash, wallet address)
- **Copy Buttons**: Icon-only, appears on hover for hashes/addresses
- **Network Pills**: Colored labels (BTC: orange, ETH: purple, BNB: yellow, etc.)

### iOS 26 Effects
- **Glassmorphism**: Primary surfaces use backdrop-blur-xl with white/5-10 backgrounds
- **Gradient Accents**: Subtle gradients on CTAs and active states (not dominant)
- **Blur Backgrounds**: Frosted glass effect on modals, dropdowns, sticky elements
- **Smooth Transitions**: 200-300ms ease-out for all state changes
- **Micro-interactions**: Scale transforms (scale-95 to scale-100) on button press

## Visual Hierarchy for Data
1. **Critical Info** (largest, boldest): Transaction amounts, wallet balances, block numbers
2. **Supporting Info** (medium): Timestamps, fees, confirmations
3. **Technical Details** (smallest, monospace): Hashes, addresses (truncated with expand)
4. **Status Indicators**: Color-coded badges (green: confirmed, yellow: pending, red: failed)

## Mobile Optimization
- **Touch Targets**: Minimum 44px height for all interactive elements
- **Swipe Actions**: Swipe transaction rows for quick actions (copy, share)
- **Collapsible Tables**: Stack columns vertically on mobile, show most critical data first
- **Bottom Sheet Modals**: Use native iOS-style bottom sheets for filters and details
- **Haptic Feedback Indicators**: Visual cues for tap states (scale, opacity changes)

## Theme System
**Dark Theme (Default)**:
- Background: #0a0a0a to #1a1a1a gradient
- Surface: rgba(255,255,255,0.05) with backdrop-blur
- Text: #ffffff (primary), #a0a0a0 (secondary)
- Accents: Network-specific colors

**Light Theme**:
- Background: #f5f5f7 to #ffffff gradient
- Surface: rgba(255,255,255,0.8) with backdrop-blur
- Text: #1d1d1f (primary), #6e6e73 (secondary)

## Images
**No hero images** - This is a data-focused web application, not a marketing site. Use:
- Network logo icons (SVG) in navigation and cards
- Status indicator icons (check, clock, alert)
- Empty state illustrations for search results

## Accessibility
- WCAG AA contrast ratios (4.5:1 for text)
- Keyboard navigation for all interactive elements
- Screen reader labels for icon-only buttons
- Focus indicators with 2px outline offset
