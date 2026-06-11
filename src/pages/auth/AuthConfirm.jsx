import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AuthConfirm() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleConfirm = async () => {
      // Supabase redirects with hash params on email confirm
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const searchParams = new URLSearchParams(window.location.search)

      const type = hashParams.get('type') || searchParams.get('type')
      const accessToken = hashParams.get('access_token')
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description')

      if (errorDesc) {
        setStatus('error')
        setMessage(decodeURIComponent(errorDesc))
        return
      }

      if (accessToken) {
        setStatus('success')
        setMessage('Your email has been confirmed! Redirecting to login...')
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      // Try to get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        setStatus('error')
        setMessage('Could not verify your email. The link may have expired.')
        return
      }

      setStatus('success')
      setMessage('Email confirmed! Redirecting...')
      setTimeout(() => navigate('/login'), 3000)
    }

    handleConfirm()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f8f9ff' }}>
      <div className="max-w-md w-full bg-white border border-outline-variant rounded-xl shadow-card p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-1 mb-6">
          <span className="text-2xl font-bold" style={{ color: '#00236f' }}>GigGle</span>
          <span className="text-xl" style={{ color: '#ef9900' }}>✦</span>
        </Link>

        {status === 'loading' && (
          <div className="py-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#444651' }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#97f5cc' }}>
              <CheckCircle size={28} color="#006c4e" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0b1c30' }}>Email Confirmed!</h2>
            <p className="text-sm mb-6" style={{ color: '#444651' }}>{message}</p>
            <Link to="/login" className="btn-primary w-full">Go to Login</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#ffdad6' }}>
              <AlertCircle size={28} color="#ba1a1a" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#0b1c30' }}>Verification Failed</h2>
            <p className="text-sm mb-6" style={{ color: '#444651' }}>{message}</p>
            <Link to="/login" className="btn-primary w-full">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  )
}
