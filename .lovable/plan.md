

## Data Persistence for User Startups

I'll implement a system to persist uploaded CSV data so returning users see their dashboard immediately without re-uploading.

### Database Schema

Create a new `user_startups` table:

```sql
CREATE TABLE user_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  tags TEXT,
  linkedin TEXT,
  blurb TEXT,
  location TEXT,
  maturity TEXT,
  amount_raised TEXT,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for user data isolation
ALTER TABLE user_startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own startups" 
  ON user_startups FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own startups" 
  ON user_startups FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own startups" 
  ON user_startups FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own startups" 
  ON user_startups FOR DELETE 
  USING (auth.uid() = user_id);
```

### Implementation Steps

**1. API Functions (src/lib/api.ts)**
- Add `saveUserStartups(startups: Startup[])` - saves parsed CSV to database
- Add `fetchUserStartups()` - retrieves user's saved startups
- Add `deleteUserStartups()` - clears user's startups (for re-upload)

**2. Index.tsx Changes**
- On mount: fetch user's saved startups from database
- If startups exist: automatically run the clustering/analysis
- On CSV upload + process: save startups to database
- Add a "Clear My Data" button to allow re-uploading a new CSV

### User Flow After Implementation

**First-time user:**
1. Logs in → sees upload screen
2. Uploads CSV → processes → sees dashboard
3. Startups are saved to database

**Returning user:**
1. Logs in → startups auto-loaded from database
2. Clustering runs automatically
3. Sees dashboard immediately (no upload needed)
4. Can use "Clear Data" to upload a new CSV

### Critical Files for Implementation
- `src/lib/api.ts` - Add database functions for startup CRUD operations
- `src/pages/Index.tsx` - Add auto-load logic and save-on-process
- `src/lib/types.ts` - No changes needed, Startup type already complete
- Database migration - Create `user_startups` table with RLS policies

