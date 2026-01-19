

## Plan: Stealth Founders LinkedIn Analysis with Dust Agent

### Overview
Build a new flow for analyzing stealth founder LinkedIn profiles using a Dust Agent, then matching them against market trends from your existing article database.

### New Data Flow

```
CSV Upload (Name, LinkedIn)
        ↓
    Parse CSV
        ↓
   [Analyze Button]
        ↓
  Dust Agent API (for each profile)
        ↓
  Fetch enriched data:
  - Past Experience
  - Current Location
  - Industry Tags
  - Notes
        ↓
  Match against market trends
  (existing cluster-startups logic)
        ↓
  Display in Founders Table:
  Name | Past_Experience | Location | Industry_Tag | LinkedIn_URL | Notes
```

---

### Step 1: Add Dust API Secret
**Action**: Use `add_secret` tool to request `DUST_API_KEY`

You'll also need to provide:
- **Workspace ID**: Your Dust workspace identifier
- **Agent ID**: The `configurationId` of your LinkedIn analysis agent

These can be stored as additional secrets or hardcoded in the edge function.

---

### Step 2: Create New Type for Stealth Founders
**File**: `src/lib/types.ts`

Add new interface:
```typescript
export interface StealthFounder {
  name: string;
  linkedinUrl: string;
  // Enriched fields from Dust Agent
  pastExperience?: string;
  currentLocation?: string;
  industryTag?: string;
  notes?: string;
  // For trend matching
  investmentScore?: number;
  matchedTrends?: string[];
}
```

---

### Step 3: Create Dust Agent Edge Function
**File**: `supabase/functions/analyze-linkedin-profiles/index.ts`

This function will:
1. Receive an array of `{name, linkedinUrl}` profiles
2. For each profile, call Dust Agent API:
   - Create conversation
   - Send LinkedIn URL with analysis prompt
   - Poll for agent response
   - Parse structured output
3. Return enriched founder data

**Dust API Flow**:
```
POST /conversations → Get conversation ID
POST /conversations/{cId}/messages → Send LinkedIn URL + mention agent
GET /conversations/{cId} (poll) → Get agent response
```

**Agent Prompt Template**:
```
Analyze this LinkedIn profile and extract:
- Past Experience: Key roles and companies
- Current Location: City/Country
- Industry Tags: Relevant sectors (comma-separated)
- Notes: Key insights for investors

Return as JSON: {pastExperience, currentLocation, industryTag, notes}
```

---

### Step 4: Update CSV Parser for Founders Format
**File**: `src/lib/api.ts`

Add new function:
```typescript
export function parseFoundersCSV(csvText: string): StealthFounder[] {
  // Parse CSV with columns: Name, LinkedIn
  // Return array of {name, linkedinUrl}
}
```

---

### Step 5: Create New Page/Component for Founders Flow
**Option A**: Add a new tab "Founders" alongside Settings/Dashboard
**Option B**: Add a toggle in Settings to switch between "Startups" and "Founders" mode

**New Component**: `src/components/FoundersAnalysis.tsx`
- CSV upload for founders (Name, LinkedIn columns)
- "Analyze Profiles" button
- Progress indicator (X of Y profiles analyzed)
- Results table with enriched data

---

### Step 6: Create Founders Results Table
**File**: `src/components/FoundersTable.tsx`

Table columns:
| Column | Source |
|--------|--------|
| Name | CSV input |
| Past Experience | Dust Agent |
| Location | Dust Agent |
| Industry Tag | Dust Agent |
| LinkedIn URL | CSV input (clickable) |
| Notes | Dust Agent |
| Trend Score | (Optional) Market trend matching |

---

### Step 7: (Optional) Trend Matching for Founders
Reuse existing `cluster-startups` logic to:
1. Convert founder industry tags to startup-like format
2. Match against article clusters
3. Add trend correlation score to founders table

---

### Database Changes (Optional)
If you want to persist founder analyses:
```sql
CREATE TABLE user_founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  past_experience TEXT,
  current_location TEXT,
  industry_tag TEXT,
  notes TEXT,
  investment_score INTEGER,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_founders ENABLE ROW LEVEL SECURITY;
-- RLS policies similar to user_startups
```

---

### UI Flow Summary

1. **Upload**: User uploads CSV with `Name, LinkedIn` columns
2. **Validate**: Show preview of parsed founders
3. **Analyze**: Click button to trigger Dust Agent analysis
4. **Progress**: Show "Analyzing 1 of 10..." with spinner
5. **Results**: Display enriched table with all columns
6. **Export**: (Optional) Download as CSV with enriched data

---

### Critical Files for Implementation

| File | Purpose |
|------|---------|
| `supabase/functions/analyze-linkedin-profiles/index.ts` | Dust Agent API integration |
| `src/lib/types.ts` | Add StealthFounder interface |
| `src/lib/api.ts` | Add parseFoundersCSV and analyzeFounders functions |
| `src/components/FoundersAnalysis.tsx` | Main UI component for founders flow |
| `src/components/FoundersTable.tsx` | Results table with enriched data |
| `src/pages/Index.tsx` | Add navigation for new Founders tab |

---

### Required Secrets
- `DUST_API_KEY` - Your Dust workspace API key
- (Hardcoded in function) `DUST_WORKSPACE_ID` - Your workspace ID
- (Hardcoded in function) `DUST_AGENT_ID` - Your LinkedIn analyzer agent ID

---

### Rate Limiting Considerations
- Dust API may have rate limits
- Implement sequential processing with delays between profiles
- Add retry logic for failed requests
- Show user-friendly progress ("Analyzing profile 3 of 15...")

