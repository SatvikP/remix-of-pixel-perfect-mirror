

## Add Demo Usage Tracking to User Profiles

### The Problem
Currently, the `user_profiles` table only tracks CSV uploads but not demo usage. When users click "Try Demo", we have no visibility into this behavior.

### Solution: Add Demo Tracking Columns

#### 1. Database Migration
Add new columns to `user_profiles`:

```sql
ALTER TABLE user_profiles 
ADD COLUMN has_tried_demo boolean DEFAULT false,
ADD COLUMN demo_loaded_at timestamp with time zone;
```

#### 2. Update loadDemoStartups() in api.ts
After loading demo data, update the user profile:

```typescript
// In loadDemoStartups(), after successfully inserting demo startups:
await supabase
  .from('user_profiles')
  .update({ 
    has_tried_demo: true, 
    demo_loaded_at: new Date().toISOString() 
  })
  .eq('user_id', user.id);
```

### What You'll Be Able to Query

After implementation, you can run queries like:

```sql
-- See all users who tried demo
SELECT email, demo_loaded_at, has_uploaded_csv 
FROM user_profiles 
WHERE has_tried_demo = true;

-- Users who tried demo but never uploaded their own data
SELECT email, demo_loaded_at 
FROM user_profiles 
WHERE has_tried_demo = true AND has_uploaded_csv = false;

-- Conversion rate: demo → real data
SELECT 
  COUNT(*) FILTER (WHERE has_tried_demo) as tried_demo,
  COUNT(*) FILTER (WHERE has_tried_demo AND has_uploaded_csv) as converted
FROM user_profiles;
```

### Files to Change

| File | Change |
|------|--------|
| Database migration | Add `has_tried_demo` and `demo_loaded_at` columns |
| `src/lib/api.ts` | Update profile after loading demo |
| `src/integrations/supabase/types.ts` | Auto-regenerated |

### Critical Files for Implementation
- `src/lib/api.ts` - Update `loadDemoStartups()` to track demo usage
- Database schema - Add new columns to `user_profiles` table

