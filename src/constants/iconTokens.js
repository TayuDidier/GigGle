// The 3 pastel/accent pairs Landing.jsx uses for boxed icons, plus the app's
// existing documented "alert" pair (DESIGN.md error-container) for negative/
// warning stats — every value here already exists elsewhere in the app.
export const ICON_TONES = {
  navy:   { bg: '#e5eeff', color: '#00236f' },
  green:  { bg: '#97f5cc', color: '#006c4e' },
  orange: { bg: '#fff3cd', color: '#ef9900' },
  alert:  { bg: '#ffdad6', color: '#ba1a1a' },
}

// Box size variants: tailwind box class, rounded class, default icon px.
export const ICON_BOX_SIZES = {
  logo: { box: 'w-8 h-8',   rounded: 'rounded-xl',  icon: 15 },
  sm:   { box: 'w-10 h-10', rounded: 'rounded-2xl', icon: 20 },
  md:   { box: 'w-12 h-12', rounded: 'rounded-2xl', icon: 22 },
  lg:   { box: 'w-20 h-20', rounded: 'rounded-2xl', icon: 36 },
}

// Bare (unboxed) inline icon sizes, by role.
export const ICON_SIZE = {
  metadata: 12,
  inline:   14,
  nav:      18,
  logoMark: 18,
}
