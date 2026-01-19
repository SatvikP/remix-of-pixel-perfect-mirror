

## Get Started Landing Page for Auth

### Overview
Add a "Get Started" landing page that appears before the login/signup form on the `/auth` route. The page will replicate the exact design from your screenshot with a "Get Started" button that transitions to the login form.

### Design Elements to Implement

**From the screenshot:**
- **Logo**: "FundRadar" in bold white text at the top
- **Main headline**: "Stop guessing which startups to call this week"
- **Subheadline**: "Identify *early signals* before trends hit mainstream" (with "early signals" in italics)
- **Three bullet points with checkmarks**:
  - Works with your CRM (500+ potential investments)
  - We track market trends in real-time
  - Get weekly: "Top 5 startups to talk to + why"
- **Footer text**: "Built for Seed-Series A VCs tracking 500+ startups."
- **Background**: Gradient from dark navy/blue at top to light purple/lavender at bottom
- **Get Started button**: Prominent CTA button

### Implementation Approach

**Option 1 (Recommended): Use local state to toggle between views**
- Add a `showGetStarted` state (default: `true`)
- When `true`, show the landing page with "Get Started" button
- When "Get Started" is clicked, set state to `false` to reveal the login form
- Keeps everything on the same route (`/auth`)

### Component Structure Changes

**Modify `src/pages/Auth.tsx`:**

1. Add new state: `const [showGetStarted, setShowGetStarted] = useState(true);`

2. Create a `GetStartedView` component/section containing:
   - FundRadar logo (using the existing Sparkles icon + text)
   - Main headline with proper typography
   - Subheadline with italic emphasis on "early signals"
   - Three feature bullet points using Check icons from lucide-react
   - Footer tagline
   - "Get Started" button that calls `setShowGetStarted(false)`

3. Use the same gradient background as the current auth page (dark navy to purple gradient)

4. Add smooth transition/animation between views (optional fade effect)

### Styling Details

- Background: Linear gradient from `#050414` (dark navy) at top to `#9b8ec7` (lavender) at bottom
- Text colors: White for headings, slightly muted white for body text
- Font sizes: Large for headline (~2.5rem), medium for subheadline (~1.25rem)
- Check icons: White with subtle styling
- Button: White background with dark text (matching existing auth button style)

### Implementation Steps

1. **Add state and imports**: Add `showGetStarted` state and `Check` icon import from lucide-react
2. **Create landing content**: Build the "Get Started" view with all text and styling from the screenshot
3. **Conditional rendering**: Show landing page when `showGetStarted` is true, login form when false
4. **Add smooth transition**: Optional CSS transition between the two views
5. **Test flow**: Verify the complete flow from landing to login to app

### Critical Files for Implementation
- `src/pages/Auth.tsx` - Main file to modify with the new landing view and state toggle

