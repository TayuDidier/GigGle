import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, Users, MessageSquare, CheckCircle, Briefcase } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

async function getEmployerNotifications(profileId) {
  const [appsRes, msgsRes, completedRes] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, created_at, worker:profiles!applications_worker_id_fkey(id, full_name), job:jobs!applications_job_id_fkey(id, title, employer_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('messages')
      .select('id, content, created_at, job_id, job:jobs(id, title, employer_id), sender:profiles!messages_sender_id_fkey(id, full_name)')
      .neq('sender_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('jobs')
      .select('id, title, status, updated_at')
      .eq('employer_id', profileId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  const notifs = []

  for (const app of appsRes.data || []) {
    if (app.job?.employer_id !== profileId) continue
    notifs.push({
      id: `app-${app.id}`,
      type: 'application',
      title: `New application from ${app.worker?.full_name || 'A worker'}`,
      body: app.job?.title || '',
      link: `/employer/jobs/${app.job?.id}/applicants`,
      time: app.created_at,
    })
  }

  for (const msg of msgsRes.data || []) {
    if (msg.job?.employer_id !== profileId) continue
    notifs.push({
      id: `msg-${msg.id}`,
      type: 'message',
      title: `New message from ${msg.sender?.full_name || 'Worker'}`,
      body: msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content,
      link: `/employer/jobs/${msg.job_id}/chat`,
      time: msg.created_at,
    })
  }

  for (const job of completedRes.data || []) {
    notifs.push({
      id: `completed-${job.id}`,
      type: 'completed',
      title: 'Job completed',
      body: `${job.title} — submit payment reference to close out.`,
      link: `/employer/jobs/${job.id}/chat`,
      time: job.updated_at,
    })
  }

  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
}

const iconMap = {
  application: <Users size={18} color="#00236f" />,
  message: <MessageSquare size={18} color="#00236f" />,
  completed: <CheckCircle size={18} color="#006c4e" />,
}

const bgMap = {
  application: '#eff4ff',
  message: '#eff4ff',
  completed: '#dcfce7',
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

export default function EmployerNotifications() {
  const { profile } = useAuth()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['employer-notifications', profile?.id],
    queryFn: () => getEmployerNotifications(profile.id),
    enabled: !!profile?.id,
    refetchInterval: 30000,
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-6" style={{ background: '#f8f9ff', minHeight: '100%' }}>
      <div className="flex items-center gap-2 mb-6">
        <Bell size={20} style={{ color: '#00236f' }} />
        <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>Notifications</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#00236f', borderTopColor: 'transparent' }} />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e5eeff' }}>
            <Briefcase size={28} color="#00236f" />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: '#0b1c30' }}>All caught up</p>
          <p className="text-sm" style={{ color: '#888' }}>No notifications yet. Post a job to get applicants.</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n) => {
          const inner = (
            <div className="card flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: bgMap[n.type] || '#f0f0f0' }}>
                {iconMap[n.type]}
              </div>
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
