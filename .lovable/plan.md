

## Add Navigation Between Upload and Results Dashboard

### Problem
Currently, when a user has saved startups, the app automatically processes them and shows results. Users cannot easily switch between the upload/settings view and the results dashboard without clearing their data.

### Solution
Add a view mode toggle that allows users to switch between "Settings" (upload/configuration) and "Dashboard" (results) views, and disable auto-processing.

### Implementation Steps

**1. Add View State Management**
- Add a new state variable: `activeView: 'settings' | 'dashboard'`
- Default to `'dashboard'` if user has saved startups, otherwise `'settings'`
- Remove auto-processing behavior (delete the `autoProcess` useEffect)

**2. Add Navigation Tabs in Header**
- Add tab buttons or toggle in the header to switch between views
- "Settings" tab - shows upload, scraper settings, scoring configuration
- "Dashboard" tab - shows results (only enabled if results exist or can be generated)

**3. Add Manual "Analyze" Button**
- When user is on Settings view with saved startups, show an "Analyze Startups" button
- This replaces the auto-processing behavior and gives users control

**4. Update View Logic**
- Settings view: Always shows upload area, scrape settings, scoring config
- Dashboard view: Shows results if available, or prompts to run analysis first

### UI Changes

**Header Navigation:**
```
[Settings] [Dashboard]     user@email.com [Sign Out]
```

**Settings View:**
- Article status card
- Scrape settings
- Scoring configuration  
- File uploader (if no saved startups)
- OR "You have X saved startups" with "Re-analyze" button
- "Clear Data" option

**Dashboard View:**
- Stats cards
- Hierarchical clusters
- Startups table
- If no results yet: "Run analysis from Settings to see results"

### Critical Files for Implementation
- `src/pages/Index.tsx` - Add view state, navigation tabs, remove auto-process, update conditional rendering
- `src/components/ui/tabs.tsx` - May use existing tabs component for navigation

