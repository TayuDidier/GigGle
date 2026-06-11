import { CATEGORIES } from '../../constants/categories'

export function CategoryBadge({ value, size = 'md' }) {
  const cat = CATEGORIES.find(c => c.value === value) || { label: value, emoji: '💼' }
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-3 py-1', lg: 'text-sm px-3 py-1.5' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizes[size]}`}
      style={{ background: '#e5eeff', color: '#00236f' }}>
      <span>{cat.emoji}</span>
      <span>{cat.label}</span>
    </span>
  )
}
