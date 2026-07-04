import { BadgeCheck } from 'lucide-react'

// DESIGN.md "Secondary/Success" (Safety Green) — reserved for Verified badges.
const CONFIG = {
  approved: { label: 'Verified', bg: '#97f5cc', color: '#006c4e' },
}

export function VerifiedBadge({ status }) {
  const config = CONFIG[status]
  if (!config) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      <BadgeCheck size={13} />
      {config.label}
    </span>
  )
}
