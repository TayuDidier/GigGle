import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Send, CreditCard, CheckCircle, Star, Flag, ImagePlus, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getJobById } from '../../api/jobs.api'
import { getPaymentForJob } from '../../api/payments.api'
import { useMessages } from '../../hooks/useMessages'
import { queryKeys } from '../../constants/queryKeys'

function MessageBubble({ msg, isOwn }) {
  const time = new Date(msg.created_at).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isOwn && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mr-2 mt-1"
          style={{ background: '#e5eeff', color: '#00236f' }}>
          {msg.sender?.avatar_url
            ? <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            : (msg.sender?.full_name?.charAt(0) || '?')}
        </div>
      )}
      <div className="max-w-[72%]">
        <div
          className="rounded-2xl overflow-hidden"
          style={isOwn
            ? { background: '#ef9900', borderBottomRightRadius: '4px' }
            : { background: '#fff', border: '1px solid #e4e4ef', borderBottomLeftRadius: '4px' }
          }
        >
          {msg.image_url && (
            <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
              <img
                src={msg.image_url}
                alt="shared"
                className="block w-full"
                style={{ maxHeight: '240px', objectFit: 'cover' }}
              />
            </a>
          )}
          {msg.content && (
            <p className="px-3 py-2 text-sm leading-relaxed"
              style={{ color: isOwn ? '#fff' : '#0b1c30' }}>
              {msg.content}
            </p>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`} style={{ color: '#888' }}>{time}</p>
      </div>
    </div>
  )
}

export default function WorkerChat() {
  const { id: jobId } = useParams()
  const { profile } = useAuth()
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const { data: job } = useQuery({
    queryKey: queryKeys.jobs.byId(jobId),
    queryFn: () => getJobById(jobId),
    enabled: !!jobId,
  })

  // The worker's conversation partner is always the employer
  const employerId = job?.employer?.id

  const { messages, isLoading: messagesLoading, send, sendImage, sending, sendError } =
    useMessages(jobId, profile?.id, employerId)

  const { data: payment } = useQuery({
    queryKey: queryKeys.payments.forJob(jobId),
    queryFn: () => getPaymentForJob(jobId),
    enabled: !!jobId && job?.status === 'completed',
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return
    if (imageFile) {
      await sendImage(imageFile, input)
      clearImage()
    } else {
      await send(input)
    }
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const employer    = job?.employer
  const isOpen      = job?.status === 'open'
  const isCompleted = job?.status === 'completed'
  const canChat     = job?.status === 'open' || job?.status === 'in_progress' || job?.status === 'completed'

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 shrink-0" style={{ background: '#fff', borderColor: '#e4e4ef' }}>
        <Link to="/worker/applications" className="p-1 rounded-lg" style={{ color: '#00236f' }}>
          <ChevronLeft size={20} />
        </Link>
        {employer && (
          <>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: '#e5eeff', color: '#00236f' }}>
              {employer.avatar_url
                ? <img src={employer.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                : employer.full_name?.charAt(0)
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: '#0b1c30' }}>{employer.full_name}</p>
              <p className="text-xs truncate" style={{ color: '#888' }}>
                {isOpen ? 'Pre-selection · ' : ''}{job?.title}
              </p>
            </div>
            <Link
              to={`/complaint/new?jobId=${jobId}&userId=${employer.id}`}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0"
              style={{ color: '#ba1a1a', background: '#fee2e2' }}
            >
              <Flag size={13} />
              Report
            </Link>
          </>
        )}
      </div>

      {/* Pre-selection notice */}
      {isOpen && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs text-center shrink-0"
          style={{ background: '#e5eeff', color: '#00236f', border: '1px solid #c7d7fd' }}>
          Pre-selection chat — the employer can message you before making their decision
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: '#f8f9ff' }}>
        {messagesLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: '#888' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === profile?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Post-completion banners */}
      {isCompleted && payment?.status === 'pending' && (
        <div className="mx-4 mb-2 px-4 py-3 rounded-xl flex items-center gap-3 shrink-0"
          style={{ background: '#fff8e6', border: '1px solid #f0c040' }}>
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0"
            style={{ borderColor: '#ef9900', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: '#0b1c30' }}>
            Payment in progress — waiting for employer approval…
          </span>
        </div>
      )}

      {isCompleted && payment?.status === 'confirmed' && (
        <div className="mx-4 mb-2 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shrink-0"
          style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={14} color="#166534" />
            <span style={{ color: '#166534' }}>Payment confirmed</span>
          </div>
          <Link to={`/worker/jobs/${jobId}/rate`}
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white shrink-0"
            style={{ background: '#006c4e' }}>
            <Star size={12} className="inline mr-1" />Rate →
          </Link>
        </div>
      )}

      {/* Input area */}
      {canChat && (
        <div className="border-t shrink-0" style={{ background: '#fff', borderColor: '#e4e4ef' }}>
          {/* Image preview */}
          {imagePreview && (
            <div className="px-4 pt-3 flex items-start gap-2">
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded-xl border"
                  style={{ borderColor: '#c5c5d3' }} />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#ba1a1a' }}
                >
                  <X size={11} color="white" />
                </button>
              </div>
              <span className="text-xs pt-1" style={{ color: '#888' }}>Add a caption (optional)</span>
            </div>
          )}

          <div className="px-4 py-3 flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity border"
              style={{ borderColor: '#c5c5d3', color: '#444651' }}
              title="Send image"
            >
              <ImagePlus size={18} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={imageFile ? 'Add a caption…' : 'Type a message…'}
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2"
              style={{ borderColor: '#c5c5d3', minHeight: '44px', maxHeight: '120px' }}
            />
            {sendError && <p className="text-xs" style={{ color: '#ba1a1a' }}>{sendError}</p>}
            <button
              onClick={handleSend}
              disabled={sending || (!input.trim() && !imageFile)}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
              style={{ background: '#00236f' }}
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={18} color="white" />
              }
            </button>
          </div>
        </div>
      )}

      {!canChat && (
        <div className="px-4 py-3 text-center text-sm border-t shrink-0"
          style={{ color: '#888', background: '#fff', borderColor: '#e4e4ef' }}>
          This job is {job?.status === 'cancelled' ? 'cancelled' : 'closed'} — chat is no longer available.
        </div>
      )}
    </div>
  )
}
