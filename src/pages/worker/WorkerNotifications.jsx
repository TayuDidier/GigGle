import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle, XCircle, MessageSquare, CreditCard, Briefcase } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { queryKeys } from '../../constants/queryKeys'
import IconBadge from '../../components/ui/IconBadge'

async function getWorkerNotifications(profileId) {
  const [appsRes, msgsRes, escrowsRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, created_at, job:jobs(id, title)')
      .eq('worker_id', profileId)
      .in('status', ['accepted', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('messages')
      .select('id, content, created_at, job_id, job:jobs(id, title), sender:profiles!messages_sender_id_fkey(id, full_name)')
      .neq('sender_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('escrows')
      .select('id, status, payout_amount, funded_at, released_at, updated_at, job:jobs(id, title)')
      .eq('worker_id', profileId)
      .in('status', ['held', 'released'])
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  const notifs = []

  for (const app of appsRes.data || []) {
    notifs.push({
      id: `app-${app.id}`,
      type: app.status === 'accepted' ? 'accepted' : 'rejected',
      title: app.status === 'accepted' ? 'Application accepted!' : 'Application not selected',
      body: app.job?.title || 'A job',
      link: app.status === 'accepted' ? `/worker/jobs/${app.job?.id}/chat` : null,
      time: app.created_at,
    })
  }

  for (const msg of msgsRes.data || []) {
    notifs.push({
      id: `msg-${msg.id}`,
      type: 'message',
      title: `New message from ${msg.sender?.full_name || 'Employer'}`,
      body: msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content,
      link: `/worker/jobs/${msg.job_id}/chat`,
      time: msg.created_at,
    })
  }

  for (const esc of escrowsRes.data || []) {
    const released = esc.status === 'released'
    notifs.push({
      id: `esc-${esc.id}`,
      type: 'payment',
      title: released ? "You've been paid 🎉" : 'Payment secured in escrow 🔒',
      body: `${Number(esc.payout_amount).toLocaleString('fr-CM')} XAF ${released ? 'received' : 'held for you'} — ${esc.job?.title}`,
      link: `/worker/jobs/${esc.job?.id}/confirm-payment`,
      time: released ? (esc.released_at || esc.updated_at) : (esc.funded_at || esc.updated_at),
    })
  }

  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
}

const iconMap = {
  accepted: CheckCircle,
  rejected: XCircle,
  message: MessageSquare,
  payment: CreditCard,
}

const toneMap = {
  accepted: 'green',
  rejected: 'alert',
  message: 'navy',
  payment: 'orange',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function WorkerNotifications() {
  const { profile } = useAuth()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['worker-notifications', profile?.id],
    queryFn: () => getWorkerNotifications(profile.id),
    enabled: !!profile?.id,
    refetchInterval: 30000,
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <div className="flex items-center gap-2 mb-6">
        <IconBadge icon={Bell} tone="navy" size="sm" />
        <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Notifications</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16">
          <IconBadge icon={Briefcase} tone="navy" size="md" className="mx-auto mb-4" />
          <p className="text-base font-semibold mb-1" style={{ color: '#0b1c30' }}>All caught up</p>
          <p className="text-sm" style={{ color: '#888' }}>No notifications yet. Apply for jobs to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n) => {
          const inner = (
            <div className="card flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer">
              <IconBadge icon={iconMap[n.type] || Bell} tone={toneMap[n.type] || 'navy'} size="sm" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#0b1c30' }}>{n.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#666' }}>{n.body}</p>
              </div>
              <span className="text-xs shrink-0 ml-2 mt-1" style={{ color: '#aaa' }}>{timeAgo(n.time)}</span>
            </div>
          )
          return n.link
            ? <Link key={n.id} to={n.link}>{inner}</Link>
            : <div key={n.id}>{inner}</div>
        })}
      </div>
    </div>
  )
}
