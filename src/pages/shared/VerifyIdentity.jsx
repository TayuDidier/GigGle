import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Clock, AlertCircle, Upload, FileText, Trash2, BadgeCheck } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadIdDocument, uploadCredentialFile } from '../../api/storage.api'
import { getMyCredentials, addCredential, deleteCredential } from '../../api/verifications.api'
import { queryKeys } from '../../constants/queryKeys'
import IconBadge from '../../components/ui/IconBadge'
import { ICON_SIZE } from '../../constants/iconTokens'

const DOC_TYPES = [
  { value: 'certificate', label: 'Certificate / Diploma' },
  { value: 'photo_proof', label: 'Photo of past work' },
  { value: 'reference_note', label: 'Reference / recommendation' },
  { value: 'other', label: 'Other' },
]

const STATUS_BANNER = {
  unverified: { icon: ShieldCheck, bg: '#e5eeff', color: '#00236f', title: 'Verify your identity', body: 'Submit a photo of your national ID or passport. An admin will review it before you can {roleLabel}.' },
  pending: { icon: Clock, bg: '#dbeafe', color: '#1e40af', title: 'Verification pending', body: 'Your document is under review. This usually takes a short while — check back soon.' },
  approved: { icon: BadgeCheck, bg: '#97f5cc', color: '#006c4e', title: "You're verified", body: 'Your identity has been confirmed. You have full access to the platform.' },
  rejected: { icon: AlertCircle, bg: '#ffdad6', color: '#ba1a1a', title: 'Verification rejected', body: null },
}

export default function VerifyIdentity() {
  const { user, profile, refetchProfile } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const credFileInputRef = useRef(null)

  const [idFile, setIdFile] = useState(null)
  const [idError, setIdError] = useState('')
  const [submittingId, setSubmittingId] = useState(false)

  const [credFile, setCredFile] = useState(null)
  const [credDocType, setCredDocType] = useState('certificate')
  const [credDescription, setCredDescription] = useState('')
  const [credError, setCredError] = useState('')

  const status = profile?.verification_status || 'unverified'
  const banner = STATUS_BANNER[status]
  const roleLabel = profile?.role === 'employer' ? 'post jobs' : 'browse and apply to jobs'
  const canSubmitId = status === 'unverified' || status === 'rejected'

  const { data: credentials = [] } = useQuery({
    queryKey: queryKeys.credentials.forProfile(profile?.id),
    queryFn: () => getMyCredentials(profile.id),
    enabled: !!profile?.id,
  })

  const addCredentialMutation = useMutation({
    mutationFn: ({ fileUrl, fileName, docType, description }) =>
      addCredential(profile.id, { fileUrl, fileName, docType, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.forProfile(profile.id) })
      setCredFile(null)
      setCredDescription('')
      if (credFileInputRef.current) credFileInputRef.current.value = ''
    },
  })

  const deleteCredentialMutation = useMutation({
    mutationFn: (id) => deleteCredential(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.credentials.forProfile(profile.id) }),
  })

  async function handleSubmitId() {
    if (!idFile || !user?.id || submittingId) return
    setSubmittingId(true)
    setIdError('')
    try {
      await uploadIdDocument(user.id, idFile)
      await refetchProfile()
      setIdFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setIdError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmittingId(false)
    }
  }

  async function handleAddCredential() {
    if (!credFile || !user?.id || addCredentialMutation.isPending) return
    setCredError('')
    try {
      const path = await uploadCredentialFile(user.id, credFile)
      addCredentialMutation.mutate({ fileUrl: path, fileName: credFile.name, docType: credDocType, description: credDescription.trim() || null })
    } catch (err) {
      setCredError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <h1 className="text-xl font-bold mb-1" style={{ color: '#0b1c30' }}>Identity Verification</h1>
      <p className="text-sm mb-6" style={{ color: '#444651' }}>
        Verification is required before you can {roleLabel}.
      </p>

      {/* Status banner */}
      <div className="card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: banner.bg }}>
            <banner.icon size={18} color={banner.color} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>{banner.title}</p>
            <p className="text-sm mt-0.5" style={{ color: '#444651' }}>
              {status === 'rejected'
                ? (profile?.verification_rejection_reason || 'Please resubmit your document.')
                : banner.body.replace('{roleLabel}', roleLabel)}
            </p>
          </div>
        </div>
      </div>

      {/* ID document upload */}
      {canSubmitId && (
        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-3">
            <IconBadge icon={FileText} tone="navy" size="sm" />
            <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>National ID or Passport</h2>
          </div>

          {idError && (
            <div className="mb-3 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#ba1a1a' }}>{idError}</div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => { setIdFile(e.target.files?.[0] || null); setIdError('') }}
          />

          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2 mb-2">
            <Upload size={16} />
            {idFile ? 'Change file' : 'Choose file'}
          </button>

          {idFile && <p className="text-sm mb-3" style={{ color: '#444651' }}>{idFile.name}</p>}
          <p className="text-xs mb-4" style={{ color: '#444651' }}>JPG, PNG, WebP or PDF — max 5MB</p>

          <button
            type="button"
            onClick={handleSubmitId}
            disabled={!idFile || submittingId}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submittingId ? 'Submitting...' : 'Submit for review'}
          </button>
        </div>
      )}

      {/* Optional experience / skills documents */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold" style={{ color: '#0b1c30' }}>Experience &amp; skills</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e5eeff', color: '#00236f' }}>Optional</span>
        </div>
        <p className="text-sm mb-4" style={{ color: '#444651' }}>
          Add certificates or informal proof of past work — a diploma, a training certificate, or photos of jobs you've done. This doesn't affect verification, but helps build trust with employers.
        </p>

        {credentials.length > 0 && (
          <div className="space-y-2 mb-4">
            {credentials.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border" style={{ borderColor: '#e4e4ef' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={ICON_SIZE.inline} style={{ color: '#00236f' }} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#0b1c30' }}>{c.file_name || 'Document'}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{DOC_TYPES.find(t => t.value === c.doc_type)?.label || 'Other'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCredentialMutation.mutate(c.id)}
                  disabled={deleteCredentialMutation.isPending}
                  className="p-1.5 shrink-0"
                  style={{ color: '#ba1a1a' }}
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {credError && (
          <div className="mb-3 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#ffdad6', color: '#ba1a1a' }}>{credError}</div>
        )}

        <div className="space-y-3 pt-3 border-t" style={{ borderColor: '#e4e4ef' }}>
          <div>
            <label className="label">Document type</label>
            <select className="input-field" value={credDocType} onChange={(e) => setCredDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Description <span style={{ color: '#444651' }}>(optional)</span></label>
            <input
              className="input-field"
              placeholder="e.g. Electrical wiring certificate, 2023"
              value={credDescription}
              onChange={(e) => setCredDescription(e.target.value)}
              maxLength={300}
            />
          </div>

          <input
            ref={credFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => { setCredFile(e.target.files?.[0] || null); setCredError('') }}
          />

          <button type="button" onClick={() => credFileInputRef.current?.click()} className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            {credFile ? credFile.name : 'Choose file'}
          </button>

          <button
            type="button"
            onClick={handleAddCredential}
            disabled={!credFile || addCredentialMutation.isPending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {addCredentialMutation.isPending ? 'Uploading...' : 'Add document'}
          </button>
        </div>
      </div>
    </div>
  )
}
