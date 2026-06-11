import { supabase } from '../lib/supabase'

export async function submitReport({ reporterId, reportedId, jobId, reason }) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, reported_id: reportedId || null, job_id: jobId || null, reason })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyReports(profileId) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      id, reason, status, admin_note, created_at, resolved_at,
      job:jobs(id, title),
      reported:profiles!reports_reported_id_fkey(id, full_name, role)
    `)
    .eq('reporter_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
