

## User Analytics Tracking: Signups and CSV Uploads

### Overview
Add tracking for user signups and CSV upload status to understand user engagement and identify drop-off points.

### Database Changes

**1. Create `user_profiles` table:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  has_uploaded_csv BOOLEAN DEFAULT FALSE,
  first_csv_upload_at TIMESTAMPTZ,
  total_csv_uploads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Create trigger to auto-populate on signup:**
A database trigger will automatically create a profile row when a new user signs up via Supabase Auth.

**3. RLS policies:**
- Users can read/update their own profile
- Admins (you) can read all profiles

### Application Changes

**1. Update CSV upload flow (`src/lib/api.ts`):**
- When `saveUserStartups()` is called, also update `has_uploaded_csv = true` and increment `total_csv_uploads`

**2. Create Admin Analytics Page (`src/pages/AdminAnalytics.tsx`):**
- Protected page (only accessible to specific admin emails)
- Shows total signups count
- Shows users who uploaded CSV vs. didn't
- Shows conversion rate (signups -> uploads)
- Simple table of users with their status

**3. Add navigation to admin page:**
- Only visible to admin users in the header

### Admin Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Total Signups | Count of all user_profiles |
| Users with CSV Upload | Count where has_uploaded_csv = true |
| Users without Upload | Count where has_uploaded_csv = false |
| Conversion Rate | Percentage who uploaded |
| Recent Signups | Last 7 days |

### Implementation Steps

1. **Database migration**: Create `user_profiles` table with trigger
2. **Update API**: Modify `saveUserStartups()` to update profile
3. **Create Admin page**: New route `/admin` with analytics dashboard
4. **Add routing**: Protected admin route in App.tsx
5. **Update last_seen**: Track when users log in

### Critical Files for Implementation
- `src/lib/api.ts` - Add function to update profile on CSV upload
- `src/pages/AdminAnalytics.tsx` - New admin dashboard page (create)
- `src/App.tsx` - Add protected admin route
- `src/pages/Index.tsx` - Update last_seen on page load
- Database migration - Create user_profiles table with trigger

