# FundRadar 🎯

**AI-Powered Startup Trend Analysis for Venture Capital Investors**

🔗 **Live App**: [fundradar.lovable.app](https://fundradar.lovable.app)

FundRadar helps VCs identify high-potential startups by analyzing real-time market trends from 350+ daily EU startup news articles. Using AI-powered clustering and a configurable scoring algorithm, it matches your startup portfolio against emerging trends to surface investment opportunities.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Trend Analysis** | Clusters 350+ daily news articles into hierarchical sectors using Gemini 3 Flash |
| **Investment Scoring** | Calculates scores (0-100) based on trend alignment, market timing, and sector fit |
| **Multi-Source Scraping** | 22 EU startup news sources with Lightpanda (primary) and Firecrawl (fallback) |
| **Founder Analysis** | LinkedIn profile enrichment via Dust AI Agent for stealth founder discovery |
| **Configurable Scoring** | Customize metric weights across Market, Startup, and Trend categories |
| **Domain Filtering** | Filter results by sectors (biotech, fintech, saas, deeptech, climate, etc.) |
| **Data Persistence** | User startup data saved and preserved across sessions with RLS security |

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev) | 18.3 | UI framework with hooks |
| [TypeScript](https://typescriptlang.org) | 5.x | Type safety |
| [Vite](https://vitejs.dev) | 5.x | Build tool and dev server |
| [Tailwind CSS](https://tailwindcss.com) | 3.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | - | Component library (Radix UI primitives) |
| [React Router DOM](https://reactrouter.com) | 6.x | Client-side routing |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state management |
| [Recharts](https://recharts.org) | 2.x | Data visualization |
| [date-fns](https://date-fns.org) | 3.x | Date utilities |
| [Lucide React](https://lucide.dev) | 0.462 | Icon library |

### Backend (Lovable Cloud)

| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Relational database with RLS policies |
| Deno | Edge function runtime (TypeScript) |
| Lovable AI Gateway | AI model access (Gemini, GPT) without API keys |

### External Integrations

| Service | Purpose |
|---------|---------|
| [Lightpanda](https://lightpanda.io) | Primary web scraping (Puppeteer-based, JavaScript rendering) |
| [Firecrawl](https://firecrawl.dev) | Alternative/fallback scraper |
| [Dust AI](https://dust.tt) | LinkedIn profile analysis agent |
| Google OAuth | Authentication provider |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ React 18    │  │ TanStack    │  │ React       │  │ Tailwind + shadcn   │ │
│  │ + TypeScript│  │ Query       │  │ Router      │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD (Supabase)                             │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │   PostgreSQL     │  │   Supabase Auth  │  │      Edge Functions        │ │
│  │                  │  │                  │  │         (Deno)             │ │
│  │  • articles      │  │  • Email/Pass    │  │                            │ │
│  │  • user_startups │  │  • Google OAuth  │  │  • cluster-startups        │ │
│  │  • user_profiles │  │                  │  │  • scrape-lightpanda       │ │
│  │  • user_roles    │  │                  │  │  • scrape-sifted-daily     │ │
│  │                  │  │                  │  │  • scrape-articles         │ │
│  │  (RLS enabled)   │  │                  │  │  • analyze-linkedin        │ │
│  └──────────────────┘  └──────────────────┘  │  • send-outreach-email     │ │
│                                              └────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Lightpanda  │  │ Firecrawl   │  │ Dust AI     │  │ Lovable AI Gateway  │ │
│  │ (Scraping)  │  │ (Fallback)  │  │ (LinkedIn)  │  │ (Gemini/GPT)        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄 Database Schema

### Tables

#### `articles`
Stores scraped news articles from EU startup sources.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `source` | text | News source name |
| `url` | text | Article URL |
| `title` | text | Article title |
| `excerpt` | text | Article summary |
| `authors` | text[] | List of authors |
| `section` | text | Article section/category |
| `tags` | text[] | Article tags |
| `is_pro` | boolean | Premium content flag |
| `published_date` | timestamptz | Publication date |
| `created_at` | timestamptz | Record creation time |

#### `user_startups`
User-uploaded startup data with Row Level Security.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner user ID (RLS) |
| `name` | text | Startup name |
| `website` | text | Company website |
| `blurb` | text | Company description |
| `tags` | text | Keywords/categories |
| `linkedin` | text | LinkedIn URL |
| `location` | text | HQ location |
| `maturity` | text | Stage (pre-seed, seed, series-a, etc.) |
| `amount_raised` | text | Funding amount |
| `business_type` | text | Business model (saas, biotech, etc.) |

#### `user_profiles`
Tracks user engagement and feature usage.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Auth user reference |
| `email` | text | User email |
| `has_uploaded_csv` | boolean | CSV upload flag |
| `has_tried_demo` | boolean | Demo usage flag |
| `has_analyzed` | boolean | Analysis completion flag |
| `total_csv_uploads` | integer | Upload counter |

#### `user_roles`
Role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Auth user reference |
| `role` | app_role | 'admin' or 'user' |

---

## ⚡ Edge Functions

### `cluster-startups`
**The core AI analysis engine.**

1. **Phase 1 - Cluster Identification**: Sends scraped articles to Gemini 3 Flash to identify ~20 hierarchical trend clusters
2. **Phase 2 - Startup Matching**: Matches startups to clusters and calculates investment scores

```typescript
// Scoring calculation
investmentScore = (trendAlignment * weight1) + 
                  (marketTiming * weight2) + 
                  (sectorFit * weight3) +
                  (marketMomentum) + 
                  (fundingClimate)
```

### `scrape-lightpanda`
Primary scraper using Puppeteer via Lightpanda Cloud WebSocket. Handles JavaScript-heavy sites.

### `scrape-sifted-daily`
Automated daily scraper for 22 EU news sources:
- Sifted, Tech.eu, EU-Startups, TechCrunch Europe
- The Next Web, VentureBeat, TechRound
- UKTN, Arctic Startup, Silicon Canals
- And 12 more...

### `scrape-articles`
Firecrawl-based scraper as alternative/fallback option.

### `analyze-linkedin-profiles`
Dust AI agent integration for LinkedIn profile enrichment:
- Past experience extraction
- Current location
- Industry tagging
- Investment signal analysis

### `send-outreach-email`
Email outreach functionality for contacting founders.

---

## 📊 Scoring System

### Investment Score Breakdown (0-100)

The scoring algorithm runs in two phases:

#### Phase 1: Cluster Analysis
AI analyzes 350+ articles and creates hierarchical clusters:
- **Parent Categories**: biotech, saas, hardware, food, fintech, marketplace, deeptech, climate
- **Trend Clusters**: ~20 specific trends with `trendScore` (0-100)

#### Phase 2: Startup Scoring

| Metric | Range | Description |
|--------|-------|-------------|
| **Trend Alignment** | 0-40 | How well startup keywords match trending clusters |
| **Market Timing** | 0-30 | Signals of market readiness and momentum |
| **Sector Fit** | 0-30 | Quality of parent category match |
| **Market Momentum** | 0-15 | Derived from average cluster trend scores |
| **Funding Climate** | 0-10 | Inferred from sector activity levels |

### Weight Customization
Weights can be adjusted in `src/lib/scoring-config.ts`:

```typescript
// Default weights by business type
SCORING_WEIGHTS_BY_TYPE = {
  saas: { trendAlignment: 40, marketTiming: 35, sectorFit: 25 },
  biotech: { trendAlignment: 25, marketTiming: 25, sectorFit: 50 },
  // ...
}
```

---

## 📁 Project Structure

```
fundradar/
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── ClusterOverview.tsx
│   │   ├── EnhancedStartupsTable.tsx
│   │   ├── FileUploader.tsx
│   │   ├── FoundersAnalysis.tsx
│   │   ├── HierarchicalClusters.tsx
│   │   ├── ScoreAnalysis.tsx
│   │   ├── ScoringConfigurator.tsx
│   │   ├── ScrapeSettings.tsx
│   │   ├── StartupDetailModal.tsx
│   │   └── StatsCards.tsx
│   │
│   ├── contexts/
│   │   └── ProcessingContext.tsx  # Long-running task state
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-notifications.ts
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   ├── api.ts            # Supabase API functions
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── scoring-config.ts # Metric configuration
│   │   └── utils.ts          # Utilities
│   │
│   ├── pages/
│   │   ├── Index.tsx         # Main dashboard
│   │   ├── Auth.tsx          # Authentication
│   │   ├── Story.tsx         # Company story
│   │   └── NotFound.tsx
│   │
│   ├── data/
│   │   ├── demo_startups.json
│   │   └── sifted_articles.json
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts     # Auto-generated client
│           └── types.ts      # Auto-generated types
│
├── supabase/
│   ├── config.toml           # Supabase configuration
│   ├── migrations/           # Database migrations
│   └── functions/
│       ├── cluster-startups/
│       ├── scrape-lightpanda/
│       ├── scrape-sifted-daily/
│       ├── scrape-articles/
│       ├── analyze-linkedin-profiles/
│       └── send-outreach-email/
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd fundradar

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

The following are auto-configured by Lovable Cloud:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

### Edge Function Secrets

Configure in Lovable Cloud → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `LIGHTPANDA_TOKEN` | Lightpanda Cloud API token |
| `FIRECRAWL_API_KEY` | Firecrawl scraper API key |
| `DUST_API_KEY` | Dust AI API key |
| `DUST_WORKSPACE_ID` | Dust workspace ID |
| `DUST_AGENT_ID` | Dust agent ID for LinkedIn analysis |
| `RESEND_API_KEY` | Resend email API key |
| `LOVABLE_API_KEY` | Auto-configured for AI gateway |

---

## 👤 User Flows

### New User Flow
1. **Sign Up** → Create account (email/password or Google)
2. **Upload CSV** → Import startup portfolio
3. **Auto-Analyze** → AI clusters articles and scores startups
4. **View Dashboard** → Explore trends and rankings

### Returning User Flow
1. **Login** → Authenticate
2. **View Results** → Previously analyzed data persists
3. **Re-Analyze** → Optionally refresh with latest trends

### Demo Flow
1. **Try Demo** → One-click demo data load
2. **Explore** → See analysis in action
3. **Upload Own** → Replace with real portfolio

---

## 🌐 Deployment

### Frontend
Deployed via Lovable's publish feature:
1. Click **Publish** button in Lovable editor
2. Frontend deployed to `fundradar.lovable.app`

### Backend
- **Edge Functions**: Auto-deploy on code changes
- **Database**: Managed by Lovable Cloud
- **Migrations**: Applied automatically

---

## 🔒 Security

- **Row Level Security (RLS)**: All user data tables protected
- **Authentication**: Supabase Auth with email confirmation
- **Secrets**: Stored securely in Lovable Cloud
- **API Keys**: Never exposed to client

---

## 📝 License

Private project. All rights reserved.

---

## 🤝 Contributing

This is a private project managed through [Lovable](https://lovable.dev).

---

Built with ❤️ using [Lovable](https://lovable.dev)
