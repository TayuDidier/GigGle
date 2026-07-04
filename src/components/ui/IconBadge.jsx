import { ICON_TONES, ICON_BOX_SIZES } from '../../constants/iconTokens'

export default function IconBadge({
  icon: Icon,
  tone = 'navy',
  size = 'sm',
  bg,
  color,
  iconSize,
  className = '',
  iconProps = {},
}) {
  const t = ICON_TONES[tone] || ICON_TONES.navy
  const s = ICON_BOX_SIZES[size] || ICON_BOX_SIZES.sm
  return (
    <div
      className={`${s.box} ${s.rounded} flex items-center justify-center shrink-0 ${className}`}
      style={{ background: bg || t.bg }}
    >
      <Icon size={iconSize || s.icon} color={color || t.color} {...iconProps} />
    </div>
  )
}
