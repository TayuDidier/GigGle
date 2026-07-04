const CONFIG = {
  open:             { label: 'Open',             bg: '#dcfce7', color: '#166534' },
  awaiting_funding: { label: 'Awaiting Payment', bg: '#fff7ed', color: '#c2410c' },
  in_progress:      { label: 'In Progress',      bg: '#dbeafe', color: '#1e40af' },
  completed:        { label: 'Completed',        bg: '#f3f4f6', color: '#374151' },
  cancelled:        { label: 'Cancelled',        bg: '#fee2e2', color: '#991b1b' },
}

export function JobStatusBadge({ status }) {
  const { label, bg, color } = CONFIG[status] || CONFIG.open
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color }}>
      {label}
    </span>
  )
}
