

## Plan: Add "Try Demo" Onboarding for New Users

### Overview
When new users (who have no saved startups) land on the Settings page, instead of only showing a CSV uploader, we'll display a compelling "Try Demo" option that instantly loads 100 curated stealth startups. This lets VCs experience the full power of FundRadar without friction.

### New User Experience Flow

**Before (Current):**
```
Sign up → Settings → See empty CSV uploader → ???
```

**After (Proposed):**
```
Sign up → Settings → See "Try Demo" + "Upload Your Own" options
        ↓
   Click "Try Demo"
        ↓
   100 demo startups loaded → Auto-analyze → Dashboard with results
```

### Implementation Details

#### 1. Add Demo Data File
**File:** `src/data/demo_startups.json`

Convert the uploaded CSV to a JSON file containing 100 stealth startups with:
- Startup Name (name)
- Tagline (blurb) 
- Founder LinkedIn (linkedin)
- Keyword Tags (tags)

This keeps the demo data bundled with the app for instant loading.

#### 2. Update Settings View in Index.tsx
**File:** `src/pages/Index.tsx`

Replace the current empty-state uploader with a two-option layout:

```
┌─────────────────────────────────────────────────────────┐
│                   Get Started                            │
│                                                          │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │  🚀 Try Demo         │   │  📤 Upload Your Own     │  │
│  │                      │   │                         │  │
│  │  100 stealth founders│   │  Already have a list?   │  │
│  │  across 6 sectors    │   │  Upload your CSV        │  │
│  │                      │   │                         │  │
│  │  [Load Demo Data]    │   │  [Upload CSV]           │  │
│  └─────────────────────┘   └─────────────────────────┘  │
│                                                          │
│  ✓ SaaS, Biotech, DeepTech, Fintech, Food, Hardware     │
│  ✓ See trend clustering in action                       │
│  ✓ Explore filtering, scoring, and outreach             │
└─────────────────────────────────────────────────────────┘
```

**Key UI Changes:**
- Add a `loadDemoData()` function that imports the demo JSON
- Add loading state while demo data processes
- Show a subtle badge on demo data indicating it's sample data
- After loading demo, auto-trigger analysis and switch to Dashboard

#### 3. Add Helper Function in api.ts
**File:** `src/lib/api.ts`

Add a function to save demo startups (same as CSV save but marks as demo):
```typescript
export async function loadDemoStartups(): Promise<Startup[]> {
  // Import demo data
  // Save to user_startups table
  // Return the startups array
}
```

#### 4. Visual Indicators
When using demo data, show a small banner:
```
🧪 You're viewing demo data. Upload your own startups for personalized insights.
   [Upload My Startups] [Clear Demo]
```

This encourages users to eventually upload real data while letting them explore freely.

### File Changes Summary

| File | Change |
|------|--------|
| `src/data/demo_startups.json` | **NEW** - Demo startup data (100 entries) |
| `src/pages/Index.tsx` | Add demo loading option, two-column layout for new users |
| `src/lib/api.ts` | Add `loadDemoStartups()` helper function |

### User Journey

1. **New User Signs Up** → Lands on Settings page
2. **Sees Two Options**: "Try Demo" (prominent) and "Upload Your Own" (secondary)
3. **Clicks "Try Demo"** → 100 startups load instantly
4. **Auto-Analysis Runs** → Dashboard populates with clusters
5. **Explores Features**: Filtering, scoring, email outreach
6. **Gets Hooked** → Uploads their own CRM data

### Benefits

- **Zero friction onboarding**: One click to see value
- **Showcases full power**: Clustering, filtering, outreach all visible
- **Builds trust**: VCs see results before sharing their data
- **Reduces drop-off**: No CSV knowledge required upfront

### Critical Files for Implementation
- `src/pages/Index.tsx` - Add demo loading UI and logic for new users
- `src/data/demo_startups.json` - Demo startup data (100 entries from uploaded CSV)
- `src/lib/api.ts` - Helper function to load and save demo startups

