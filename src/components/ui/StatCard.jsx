import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import IconBadge from './IconBadge'
import { ICON_TONES } from '../../constants/iconTokens'

export default function StatCard({
  icon,
  label,
  value,
  sub,
  to,
  tone = 'navy',
  bg,
  color,
}) {
  const accent = color || (ICON_TONES[tone] || ICON_TONES.navy).color
  const content = (
    <div
      className="bg-white rounded-2xl p-5 border flex items-start gap-4 hover:shadow-lg transition-all duration-200 group"
      style={{ borderColor: '#e4e4ef' }}
    >
      <IconBadge icon={icon} tone={tone} bg={bg} color={color} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold" style={{ color: accent }}>{value ?? '—'}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: '#0b1c30' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{sub}</p>}
      </div>
      {to && (
        <ArrowRight size={16} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: accent }} />
      )}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}
