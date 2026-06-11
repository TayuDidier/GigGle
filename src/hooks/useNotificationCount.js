import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useWorkerNotificationCount(profileId) {
  return useQuery({
    queryKey: ['worker-notif-count', profileId],
    queryFn: async () => {
      if (!profileId) return 0
      const [appsRes, paymentsRes] = await Promise.all([
        // Accepted applications the worker hasn't acted on yet
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('worker_id', profileId)
          .eq('status', 'accepted'),
        // Submitted payments waiting for the worker to confirm
        supabase
          .from('payment_acknowledgments')
          .select('id, job:jobs!payment_acknowledgments_job_id_fkey(selected_worker_id)')
          .eq('status', 'submitted'),
      ])
      const waitingPayments = (paymentsRes.data || []).filter(
        p => p.job?.selected_worker_id === profileId
      ).length
      return (appsRes.count || 0) + waitingPayments
    },
    enabled: !!profileId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export function useEmployerNotificationCount(profileId) {
  return useQuery({
    queryKey: ['employer-notif-count', profileId],
    queryFn: async () => {
      if (!profileId) return 0
      // Open jobs for this employer
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('employer_id', profileId)
        .eq('status', 'open')
      if (!jobs?.length) return 0
      const jobIds = jobs.map(j => j.id)
      // Pending applications on those jobs
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'pending')
      return count || 0
    },
    enabled: !!profileId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}
