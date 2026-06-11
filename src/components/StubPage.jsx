import { Link } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'

export default function StubPage({ title, description, backTo, backLabel }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f8f9ff' }}>
      <div className="w-full max-w-lg">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium hover:underline"
            style={{ color: '#00236f' }}
          >
            <ArrowLeft size={15} />
            {backLabel || 'Back'}
          </Link>
        )}

        <div className="bg-white border border-outline-variant rounded-xl shadow-card p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-semibold" style={{ color: '#0b1c30' }}>{title}</h1>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: '#fff3cd', color: '#c47d00' }}>
              <Clock size={12} />
              Coming Soon
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#444651' }}>{description}</p>

          <div className="mt-6 p-4 rounded-lg border border-dashed" style={{ borderColor: '#c5c5d3', background: '#f8f9ff' }}>
            <p className="text-xs text-center" style={{ color: '#757682' }}>
              This page is under construction and will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
