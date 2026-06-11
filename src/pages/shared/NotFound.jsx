import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8f9ff' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: '#e5eeff' }}>
          <AlertTriangle size={36} color="#00236f" />
        </div>

        <div className="text-7xl font-bold mb-2" style={{ color: '#e5eeff' }}>404</div>
        <h1 className="text-2xl font-semibold mb-3" style={{ color: '#0b1c30' }}>Page Not Found</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#444651' }}>
          The page you're looking for doesn't exist or has been moved. Double-check the URL, or head back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary gap-2">
            <ArrowLeft size={16} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>

        <p className="mt-8 text-xs" style={{ color: '#757682' }}>
          Lost? Email us at{' '}
          <a href="mailto:hello@gigle.cm" className="hover:underline" style={{ color: '#00236f' }}>
            hello@gigle.cm
          </a>
        </p>
      </div>
    </div>
  )
}
