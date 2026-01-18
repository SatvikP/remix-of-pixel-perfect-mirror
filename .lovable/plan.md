

## Auth Page Redesign with Oxaley-like Design System

I'll transform the login page to use the elegant dark-to-indigo gradient background with the sophisticated color palette you've provided.

### Design Changes Overview

**Background Transformation:**
- Replace the plain `bg-background` with the hero gradient: `radial-gradient` from deep ink (#050414) through indigo (#17155D) to periwinkle (#6B63CC)
- Add subtle glow effect for depth

**Card Styling:**
- Semi-transparent white card with blur backdrop for glassmorphism effect
- Subtle border using `rgba(255,255,255,0.18)` for on-dark surfaces
- Increased border radius to `lg` (16px) per the design system

**Color Updates:**
- Primary text on dark: `#FFFFFF`
- Secondary text on dark: `rgba(255,255,255,0.62)`
- Keep the existing font family (Inter) as requested

**Button Styling:**
- Google button: Ghost style with transparent background and white border
- Submit button: Solid white background with dark text (primary button style)
- Pill-shaped buttons with `rounded-full`

**Form Elements:**
- Input fields with dark backgrounds and light text
- Subtle borders matching the design system
- Focus ring using the periwinkle color

### Implementation Steps

1. **Update Auth.tsx styling:**
   - Apply gradient background to the page container
   - Restyle the Card with glassmorphism (backdrop blur, semi-transparent)
   - Update text colors to use on-dark palette
   - Restyle buttons to match the design system
   - Update input fields for dark theme
   - Add subtle animations for hover states

2. **CSS Variables (optional):**
   - Could add custom CSS variables for the design tokens if we want reusability

### Visual Result

The login page will feature:
- Deep indigo-to-black gradient background with subtle glow
- Floating glass-like card with blur effect
- Crisp white text and labels
- Elegant pill-shaped buttons
- Professional, modern SaaS aesthetic matching the Oxaley reference

### Critical Files for Implementation
- `src/pages/Auth.tsx` - Main styling changes for the login page
- `src/index.css` - Optional: Add custom CSS variables for the design tokens

