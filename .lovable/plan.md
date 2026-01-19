

## Connect Domain Filter to Dashboard

### Overview
Wire up the domain filter dropdown in ScoringConfigurator to actually filter the clusters and startups displayed in the dashboard. When users select domains (e.g., "Fintech", "SaaS & Software"), only clusters and startups matching those domains will be shown.

### Current State
- **ScoringConfigurator** already has domain filter UI with `selectedDomains` and `onDomainsChange` props
- **Index.tsx** renders the ScoringConfigurator but doesn't pass the domain props
- **HierarchicalClusters** and **EnhancedStartupsTable** don't currently receive filtered data

### Domain Mapping
The domain options need to map to parent categories:

| Domain Option (scoring-config) | Parent Category (types.ts) |
|-------------------------------|---------------------------|
| `hardware-robotics` | `hardware` |
| `saas-software` | `saas` |
| `deeptech` | `deeptech` |
| `fintech` | `fintech` |
| `biotech-health` | `biotech` |
| `climate-energy` | `climate` |
| `marketplace` | `marketplace` |
| `other` | `other` |

### Implementation Steps

#### 1. Add domain state to Index.tsx
- Create `selectedDomains` state in Index.tsx
- Pass `selectedDomains` and `onDomainsChange` to ScoringConfigurator
- Persist domain selections to localStorage (like scoring config)

#### 2. Create domain-to-category mapping utility
- Add a helper function in `scoring-config.ts` to map domain values to ParentCategory values
- Example: `'biotech-health'` maps to `'biotech'`

#### 3. Filter clusters based on selected domains
- In Index.tsx, create a `filteredClusters` computed value
- If no domains selected, show all clusters
- If domains selected, filter clusters where `parentCategory` matches any selected domain

#### 4. Filter startups based on filtered clusters
- Create `filteredStartupMatches` that only includes startups matching the filtered clusters
- Startups match if any of their cluster matches are in the filtered clusters list

#### 5. Pass filtered data to dashboard components
- Pass `filteredClusters` to HierarchicalClusters
- Pass `filteredStartupMatches` to EnhancedStartupsTable
- Update StatsCards if needed to show filtered counts

#### 6. Add visual feedback
- Show active filter indicator in the dashboard header
- Add a "Clear Filters" button when domains are selected

### File Changes

#### src/lib/scoring-config.ts
- Add `domainToParentCategory` mapping function

#### src/pages/Index.tsx
- Add `selectedDomains` state with localStorage persistence
- Add filtering logic using `useMemo`
- Pass domain props to ScoringConfigurator
- Pass filtered data to dashboard components
- Add filter indicator in dashboard view

### Critical Files for Implementation
- `src/pages/Index.tsx` - Main orchestration: state, filtering logic, passing filtered data
- `src/lib/scoring-config.ts` - Add domain-to-category mapping utility
- `src/components/ScoringConfigurator.tsx` - Already has UI, just needs props passed
- `src/lib/types.ts` - Reference for ParentCategory type definitions
- `src/components/HierarchicalClusters.tsx` - Will receive filtered clusters (no changes needed)

