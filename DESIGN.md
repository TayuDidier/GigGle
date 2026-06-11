---
name: Reliant Direct
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c4e'
  on-secondary: '#ffffff'
  secondary-container: '#97f5cc'
  on-secondary-container: '#007353'
  tertiary: '#3e2400'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c3800'
  on-tertiary-container: '#ef9900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#97f5cc'
  secondary-fixed-dim: '#7bd8b1'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is centered on establishing immediate credibility and operational efficiency for an informal job marketplace. The brand personality is dependable, no-nonsense, and highly accessible, catering to a diverse demographic of workers and hirers who prioritize speed and security.

The visual style follows a **Modern Corporate** approach with a heavy emphasis on **Tactile Card-based UI**. By utilizing explicit boundaries and physical metaphors (subtle shadows and distinct containers), the interface provides clear affordances that guide users through the job posting and application lifecycle without ambiguity. The emotional goal is to reduce "transaction anxiety" through structured, clean, and professional visual cues.

## Colors

This design system utilizes a high-contrast palette designed for clarity and functional signaling:

- **Primary (Trust Blue):** Used for global navigation, headers, and primary branding elements to instill a sense of platform security.
- **Secondary/Success (Safety Green):** Reserved for "Verified" badges, successful application states, and completed payment indicators.
- **CTA (Action Orange):** A high-visibility accent used exclusively for primary actions like "Apply Now" or "Post a Job."
- **Neutral (Slate):** A scale of grays used for borders (`#E2E8F0`), secondary text, and background layering to ensure the interface remains grounded.

The system defaults to a **Light Mode** to maximize legibility in outdoor or high-glare environments where users may be accessing the app while on-site.

## Typography

The system uses **Inter** to provide a highly legible, systematic sans-serif experience. To ensure accessibility across all age groups and vision types, the base body size is set to a generous 16px.

- **Scale:** High contrast between headlines and body text helps users scan job listings quickly.
- **Weight:** Use Semi-Bold (600) and Bold (700) for headers to create a clear information hierarchy.
- **Legibility:** Line heights are intentionally loose (1.5x for body) to prevent text crowding in densly packed job descriptions.
- **Labels:** Small caps or increased letter spacing should be applied to `label-sm` for category tags and metadata.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Mobile views use a single-column fluid layout with 16px side margins. Desktop views transition to a max-width container (1280px) with a 12-column grid.

- **The 8px Rule:** All spatial increments are multiples of 8px to maintain visual rhythm.
- **Card Spacing:** Job cards in a list view should use `16px` (md) vertical spacing to ensure clear separation.
- **Touch Targets:** Any interactive element must maintain a minimum height of 48px for easy activation on mobile devices.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** combined with **Explicit Boundaries**.

- **Surface Levels:** The background uses a subtle off-white (`#F8FAFC`). Interactive cards use a pure white (`#FFFFFF`) surface.
- **Shadows:** A singular, consistent "sm" shadow (0 1px 2px 0 rgba(0, 0, 0, 0.05)) is applied to cards to lift them slightly from the canvas.
- **Borders:** All cards and input containers must use a `1px` solid border in `slate-200` (#E2E8F0). This creates a "contained" feeling that reinforces the platform's focus on structured data and security.
- **Active State:** On tap or hover, card elevation should shift to a "md" shadow with a primary-colored subtle border-glow.

## Shapes

The shape language is consistently **Rounded (0.5rem / 8px)** to strike a balance between professional geometry and approachable softness.

- **Standard Elements:** Buttons, inputs, and small modules use the base `rounded` (8px) radius.
- **Large Containers:** Job cards and modal sheets use `rounded-xl` (24px) to create a distinct, modern containerized look.
- **Badges:** Success/Status chips use a full pill-shape (999px) to differentiate them from interactive buttons.

## Components

### Buttons & Actions
- **Primary CTA:** Uses `Action Orange`, white text, and `rounded-lg`. Requires a subtle bottom-heavy shadow to appear "pressable."
- **Secondary Action:** Ghost style with `Trust Blue` border and text.

### Job Cards
- **Structure:** White background, `slate-200` border, `rounded-xl` corners. 
- **Header:** Features the job title in `headline-sm` and a `Secondary/Success` verified badge if applicable.
- **Footer:** Contains a clear price/wage label in `primary-color` and the primary CTA button.

### Form Fields
- **Inputs:** `16px` text, `12px` padding, and a `1px` border. In focus, the border transitions to `Trust Blue` with a 2px outer ring.
- **Labels:** Always visible above the input field (no floating labels) to ensure maximum cognitive clarity.

### Lists & Navigation
- **Job Feed:** A vertical stack of cards with `16px` gaps.
- **Bottom Nav (Mobile):** High-contrast icons with `label-sm` text labels, utilizing a backdrop-blur effect if layered over scrolling content.

### Feedback Elements
- **Status Chips:** Small, pill-shaped markers for "Urgent," "New," or "Part-time." Use low-saturation background tints with high-saturation text of the same hue.