

# Plan: Create Comprehensive README Documentation

## Overview

This plan creates a detailed README.md file that explains the FundRadar project - an AI-powered startup trend analysis platform designed for venture capital investors. The README will document all technologies, architecture, features, and setup instructions.

## README Structure

### 1. Project Header and Overview
- Project name, tagline, and live URL
- Brief description of what FundRadar does
- Key value proposition for investors

### 2. Features Section
- **AI-Powered Trend Analysis**: Clusters 350+ daily news articles into hierarchical sectors
- **Startup Scoring**: Investment scores based on trend alignment, market timing, and sector fit
- **Multi-Source Scraping**: 22 EU startup news sources with Lightpanda/Firecrawl providers
- **Founder Analysis**: LinkedIn profile enrichment via Dust AI Agent
- **Configurable Scoring**: Customizable metric weights across Market, Startup, and Trend categories
- **Domain Filtering**: Filter results by sectors (biotech, fintech, saas, etc.)
- **Data Persistence**: User startup data saved and preserved across sessions

### 3. Technology Stack

**Frontend:**
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling |
| shadcn/ui | Component library (Radix UI primitives) |
| React Router DOM | Client-side routing |
| TanStack Query | Server state management |
| Recharts | Data visualization |
| date-fns | Date utilities |

**Backend (Lovable Cloud / Supabase):**
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Edge Functions |
| PostgreSQL | Database with RLS policies |
| Deno | Edge function runtime |
| Lovable AI Gateway | AI model access (Gemini, GPT) |

**External Integrations:**
| Service | Purpose |
|---------|---------|
| Lightpanda | Primary web scraping (Puppeteer-based) |
| Firecrawl | Alternative scraper |
| Dust AI | LinkedIn profile analysis agent |
| Google OAuth | Authentication provider |

### 4. Architecture Diagram (ASCII)

```
+---------------------+     +----------------------+     +------------------+
|     Frontend        |     |    Edge Functions    |     |   External APIs  |
|  (React + Vite)     |     |       (Deno)         |     |                  |
+---------------------+     +----------------------+     +------------------+
         |                           |                          |
         v                           v                          v
+-------------------------------------------------------------------+
|                        Supabase (Lovable Cloud)                    |
|  +-------------+  +---------------+  +---------------------------+ |
|  | PostgreSQL  |  | Auth (Google) |  | Edge Functions            | |
|  | - articles  |  | - Email/Pass  |  | - cluster-startups        | |
|  | - user_     |  |               |  | - scrape-lightpanda       | |
|  |   startups  |  |               |  | - scrape-sifted-daily     | |
|  | - user_     |  |               |  | - scrape-articles         | |
|  |   profiles  |  |               |  | - analyze-linkedin        | |
|  +-------------+  +---------------+  | - send-outreach-email     | |
|                                      +---------------------------+ |
+-------------------------------------------------------------------+
```

### 5. Database Schema

**Tables:**
- `articles`: Scraped news articles with metadata (source, tags, authors, excerpt)
- `user_startups`: User-uploaded startup data with RLS per user
- `user_profiles`: User engagement tracking (signup, demo usage, analysis flags)
- `user_roles`: Role-based access control (admin, user)

### 6. Edge Functions Documentation

| Function | Description |
|----------|-------------|
| `cluster-startups` | AI clustering using Gemini 3 Flash - creates hierarchical trend clusters and calculates investment scores |
| `scrape-lightpanda` | Puppeteer-based scraping via Lightpanda Cloud WebSocket |
| `scrape-sifted-daily` | Daily scraper for 22 EU news sources |
| `scrape-articles` | Firecrawl-based article scraping |
| `analyze-linkedin-profiles` | Dust AI agent integration for founder enrichment |
| `send-outreach-email` | Email outreach functionality |

### 7. Scoring System Explanation

**Investment Score Calculation:**
1. **Phase 1 - Cluster Identification**: AI analyzes articles into ~20 hierarchical clusters with trend scores
2. **Phase 2 - Startup Matching**: Startups matched to clusters based on keywords, tags, and business type

**Core Metrics (0-100 total):**
- Trend Alignment (0-40): How well startup aligns with trending clusters
- Market Timing (0-30): Market readiness signals
- Sector Fit (0-30): Quality of sector match

**Derived Metrics:**
- Market Momentum (0-15): Based on average cluster trend scores
- Funding Climate (0-10): Inferred from sector activity

### 8. Project Structure

```
src/
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives
│   ├── HierarchicalClusters.tsx
│   ├── EnhancedStartupsTable.tsx
│   ├── ScoringConfigurator.tsx
│   ├── ScoreAnalysis.tsx
│   └── ...
├── contexts/            # React contexts
│   └── ProcessingContext.tsx  # Long-running task state
├── hooks/               # Custom hooks
├── lib/                 # Utilities and API functions
│   ├── api.ts           # Supabase API calls
│   ├── types.ts         # TypeScript interfaces
│   ├── scoring-config.ts
│   └── utils.ts
├── pages/               # Route components
│   ├── Index.tsx        # Main dashboard
│   ├── Auth.tsx         # Authentication
│   └── Story.tsx        # Company story
├── data/                # Static data
│   ├── demo_startups.json
│   └── sifted_articles.json
└── integrations/
    └── supabase/        # Auto-generated Supabase types

supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migrations
└── functions/           # Deno edge functions
    ├── cluster-startups/
    ├── scrape-lightpanda/
    ├── scrape-sifted-daily/
    ├── scrape-articles/
    ├── analyze-linkedin-profiles/
    └── send-outreach-email/
```

### 9. Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

**Edge Function Secrets (configured in Lovable Cloud):**
- `LIGHTPANDA_TOKEN` - Lightpanda Cloud authentication
- `FIRECRAWL_API_KEY` - Firecrawl scraper access
- `DUST_API_KEY`, `DUST_WORKSPACE_ID`, `DUST_AGENT_ID` - Dust AI integration
- `LOVABLE_API_KEY` - Lovable AI Gateway for Gemini/GPT models
- `RESEND_API_KEY` - Email sending

### 10. Getting Started / Local Development

```bash
# Clone and install
git clone <repo-url>
cd fundradar
npm install

# Start development server
npm run dev
```

### 11. Key User Flows

1. **New User Flow**: Sign up → Upload CSV → Auto-analyze → View Dashboard
2. **Returning User Flow**: Login → View persisted results or re-analyze
3. **Demo Flow**: Try demo data → See analysis → Upload own data

### 12. Deployment

- Frontend: Deployed via Lovable publish
- Backend: Edge functions auto-deploy on code changes
- Database: Managed by Lovable Cloud

---

## Critical Files for Implementation

- `README.md` - The file to create/replace with comprehensive documentation
- `src/pages/Index.tsx` - Main application flow reference
- `supabase/functions/cluster-startups/index.ts` - Core AI logic documentation
- `src/lib/types.ts` - Type definitions to document
- `src/lib/scoring-config.ts` - Scoring system configuration

---

## Implementation Notes

The README will be approximately 300-400 lines, covering:
- High-level project overview
- Complete technology stack
- Architecture diagrams
- Database schema
- All edge functions
- Scoring algorithm explanation
- Project structure
- Setup instructions
- Environment configuration

