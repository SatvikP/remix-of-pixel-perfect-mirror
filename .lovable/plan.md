

## Plan: Add Domain Filter to Dashboard View

### Problem
Currently, users must navigate to Settings to change domain filters, then return to Dashboard to see filtered results. This creates unnecessary friction, especially for power users who want to quickly explore different sectors.

### Solution
Add an inline domain filter dropdown directly in the Dashboard header, next to the results title. This allows instant filtering without leaving the view.

### Current Flow (Friction)
```
Dashboard → See results → Want to filter by Fintech → Go to Settings → 
→ Find Scoring Config → Expand → Select domain → Go back to Dashboard
```

### Proposed Flow (Instant)
```
Dashboard → Click domain filter dropdown → Select "Fintech" → Results update instantly
```

### Implementation Details

#### 1. Create New Component: `DomainFilter.tsx`
**File:** `src/components/DomainFilter.tsx`

A lightweight, reusable domain filter component with:
- Multi-select popover using existing Popover/Badge components
- Selected domains shown as removable chips
- "Clear all" action
- Compact design for header placement

```tsx
interface DomainFilterProps {
  selectedDomains: DomainOption[];
  onDomainsChange: (domains: DomainOption[]) => void;
}
```

#### 2. Update Dashboard View in Index.tsx
**File:** `src/pages/Index.tsx`

Replace the current passive filter indicator (lines 730-746) with the new interactive `DomainFilter` component:

**Before (read-only display):**
```tsx
{selectedDomains.length > 0 && (
  <span>🔍 X domains filtered [Clear]</span>
)}
```

**After (interactive dropdown):**
```tsx
<DomainFilter 
  selectedDomains={selectedDomains}
  onDomainsChange={handleDomainsChange}
/>
```

#### 3. Keep ScoringConfigurator Domain Filter (Optional)
The Settings page can keep its domain filter for users who prefer configuring everything in one place. Both will share the same state via `selectedDomains` and `handleDomainsChange`.

### UI Design

```
┌────────────────────────────────────────────────────────────┐
│  Results    [Filter by domain ▾]  [Fintech ✕] [SaaS ✕]    │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Select domains:                                       │ │
│  │ ☑ Hardware & Robotics    ☑ Fintech                   │ │
│  │ ☐ SaaS & Software        ☐ Biotech & Health          │ │
│  │ ☐ DeepTech               ☐ Climate & Energy          │ │
│  │ ☐ Marketplace            ☐ Other                     │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/DomainFilter.tsx` | **NEW** - Reusable domain filter component |
| `src/pages/Index.tsx` | Replace passive filter indicator with interactive DomainFilter |

### Benefits

- **Zero navigation**: Filter without leaving the Dashboard
- **Instant feedback**: See filtered results immediately
- **Discoverable**: Prominent placement makes the feature obvious
- **Consistent**: Uses same state/logic as Settings filter

### Critical Files for Implementation
- `src/components/DomainFilter.tsx` - New reusable domain filter component
- `src/pages/Index.tsx` - Add DomainFilter to Dashboard header (lines 727-757)
- `src/lib/scoring-config.ts` - Import DOMAIN_OPTIONS for the filter options

