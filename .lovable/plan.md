

## Plan: Fix Auto-Analysis Running on Every Login

### Problem
Every time a user logs in, the analysis re-runs automatically because:
1. `result` is `null` on page load (not persisted)
2. The `useEffect` on lines 292-304 triggers if `savedStartups.length > 0 && !result`
3. This erases/rebuilds the dashboard unnecessarily

### Solution: Track Analysis State in User Profile

Add a simple flag to track whether the user has already run an analysis, then only auto-run for first-time users.

---

### Step 1: Add `has_analyzed` Flag to `user_profiles` Table
**Database Migration**

Add a new boolean column `has_analyzed` (default: false) to track if the user has completed at least one analysis.

```sql
ALTER TABLE user_profiles 
ADD COLUMN has_analyzed BOOLEAN DEFAULT false;
```

---

### Step 2: Update API to Track Analysis State
**File:** `src/lib/api.ts`

- Add `setHasAnalyzed()` function to update the flag after first analysis
- Add `fetchUserProfile()` function to get the full profile including `has_analyzed`

---

### Step 3: Modify Auto-Analysis Logic
**File:** `src/pages/Index.tsx`

**Current logic (lines 292-304):**
```javascript
// Runs every time if savedStartups exist and result is null
if (savedStartups.length > 0 && !result && processingStep === 'idle') {
  processStartups(savedStartups);
}
```

**New logic:**
```javascript
// Only auto-run if:
// 1. User has saved startups
// 2. User has NOT analyzed before (first time after upload)
// 3. No current result
if (
  savedStartups.length > 0 && 
  !result && 
  !hasAnalyzed &&  // NEW: Check if never analyzed before
  processingStep === 'idle'
) {
  processStartups(savedStartups);
}
```

---

### Step 4: Set Flag After Successful Analysis
**File:** `src/pages/Index.tsx`

In `processStartups()`, after successful clustering:
```javascript
setResult(clusterResult);
setProcessingStep('complete');
setActiveView('dashboard');

// NEW: Mark user as having analyzed
await setHasAnalyzed();
```

---

### Step 5: Update UI for Returning Users
**File:** `src/pages/Index.tsx`

For returning users who have `has_analyzed = true` but no current results:
- Show Dashboard view with a "Run Analysis" button instead of auto-running
- Add clear messaging: "Your data is saved. Click to generate fresh insights."

---

### Updated User Flow

```
FIRST LOGIN (no data):
├── Show Settings → "Try Demo" or "Upload CSV"

AFTER FIRST UPLOAD/DEMO:
├── has_analyzed = false, savedStartups exist
├── AUTO-RUN analysis (one time)
├── Set has_analyzed = true
├── Show Dashboard

RETURNING USER (subsequent logins):
├── has_analyzed = true, savedStartups exist
├── NO auto-run
├── Show Settings with message: "Your startups are saved"
├── User can click "Analyze" button to run manually
└── Or switch to Dashboard tab (if they want to re-analyze first)
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `has_analyzed` column to `user_profiles` |
| `src/lib/api.ts` | Add `fetchUserProfile()`, `setHasAnalyzed()` functions |
| `src/pages/Index.tsx` | Modify auto-analysis effect, add `hasAnalyzed` state |
| `src/integrations/supabase/types.ts` | Auto-updated by Supabase |

---

### Critical Files for Implementation
- `src/pages/Index.tsx` - Core auto-analysis logic (lines 292-304) and processStartups callback
- `src/lib/api.ts` - API functions for fetching/updating user profile
- `supabase/migrations/` - Database migration for new column
- `src/integrations/supabase/types.ts` - Pattern reference for Supabase types

