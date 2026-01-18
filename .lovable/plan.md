

## Authentication System Plan

I'll build a clean, professional login page with Google OAuth and email/password signup that matches your current app design.

### Overview

The login page will feature:
- **Google Sign-in button** (primary option, prominent placement)
- **Email/Password signup** (secondary option with form)
- **Toggle between Login and Sign Up modes**
- **Clean, centered card design** matching your existing UI patterns

### Implementation Steps

#### 1. Create Auth Page (`src/pages/Auth.tsx`)
- Build a centered card layout with your app branding (Sparkles icon + title)
- Add Google OAuth button (styled prominently)
- Add a divider with "or continue with email"
- Email/password form with validation using zod
- Toggle between "Sign In" and "Sign Up" modes
- Error handling with toast notifications
- Automatic redirect to "/" when authenticated

#### 2. Update App Router (`src/App.tsx`)
- Add `/auth` route for the new authentication page

#### 3. Protect Index Page (`src/pages/Index.tsx`)
- Add authentication check on mount
- Redirect unauthenticated users to `/auth`
- Add user session state management
- Add logout button in the header
- Display user email in the header

#### 4. Enable Auto-Confirm for Email Signups
- Configure auth settings to auto-confirm email signups for easier testing

### UI Design

The auth page will feature:
- **Header**: App logo + "Startup Clustering Tool" title
- **Google button**: Full-width, dark background, Google icon
- **Divider**: "or continue with email"
- **Form fields**: Email input + Password input
- **Submit button**: "Sign In" / "Create Account" depending on mode
- **Mode toggle**: "Don't have an account? Sign up" link

### Security Considerations
- Input validation with zod for email format and password requirements
- Proper error handling without exposing sensitive details
- Session persistence using Supabase auth
- `emailRedirectTo` configured for signup flow

### Critical Files for Implementation
- `src/pages/Auth.tsx` - New authentication page (to be created)
- `src/pages/Index.tsx` - Add auth check and logout functionality
- `src/App.tsx` - Add /auth route
- `src/integrations/supabase/client.ts` - Already configured Supabase client

