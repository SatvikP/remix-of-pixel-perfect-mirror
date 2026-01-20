

## Fix Results Persistence Across Navigation

### Problem
When a logged-in user navigates from Dashboard to "Our Story" and back, they lose sight of their results because:
1. The `activeView` state resets to `'settings'` on every component remount
2. There's no URL parameter handling to restore the correct view
3. The `result` data IS persisted in ProcessingContext, but the UI doesn't show it

### Solution
Implement URL-based view state management using React Router's `useSearchParams`. This approach:
- Syncs `activeView` with the URL (e.g., `/?view=dashboard`)
- Survives page navigation and browser refresh
- Works seamlessly with the existing notification click handlers
- Provides shareable/bookmarkable view states

### Implementation Details

#### 1. Update `src/pages/Index.tsx`

**Add URL Parameter Handling:**
```typescript
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

// Replace useState for activeView with URL-based state
const [searchParams, setSearchParams] = useSearchParams();
const viewParam = searchParams.get('view');

// Derive activeView from URL, defaulting smartly based on state
const activeView = useMemo(() => {
  if (viewParam === 'dashboard' || viewParam === 'founders' || viewParam === 'settings') {
    return viewParam;
  }
  // If result exists, default to dashboard; otherwise settings
  return result ? 'dashboard' : 'settings';
}, [viewParam, result]);

// Create a setter function that updates URL params
const setActiveView = useCallback((view: 'settings' | 'dashboard' | 'founders') => {
  setSearchParams({ view });
}, [setSearchParams]);
```

**Remove the old useState line:**
```typescript
// DELETE THIS LINE:
const [activeView, setActiveView] = useState<'settings' | 'dashboard' | 'founders'>('settings');
```

**Update handleProcessStartups to use URL navigation:**
```typescript
// Change from:
setActiveView('dashboard');
// To:
setSearchParams({ view: 'dashboard' });
```

#### 2. Update navigation buttons to use setSearchParams

The existing `setActiveView` calls will work since we're replacing it with a function of the same signature.

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Replace `useState` for `activeView` with `useSearchParams` hook, add smart defaulting logic |

### Benefits
- Results persist visually when navigating back from Story page
- URL reflects current view state (bookmarkable)
- Notification clicks work correctly with `/?view=dashboard`
- Browser back/forward buttons work as expected
- No additional API calls or re-analysis triggered

### Critical Files for Implementation
- `src/pages/Index.tsx` - Main file to modify, replace activeView state management with URL-based approach

