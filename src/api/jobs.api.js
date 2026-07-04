import { supabase } from '../lib/supabase'

export async function getJobsWithinRadius({ lat, lng, radiusKm = 10, category = null, limit = 50, offset = 0 }) {
  const { data, error } = await supabase.rpc('get_jobs_within_radius', {
    lat, lng, radius_km: radiusKm,
    p_category: category || null,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw error
  return data
}

export async function getMyJobsAsEmployer(employerId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, selected_worker:profiles!jobs_selected_worker_id_fkey(id, full_name, avatar_url, rating_average)`)
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveJobAsWorker(workerId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url, rating_average)`)
    .eq('selected_worker_id', workerId)
    .eq('status', 'in_progress')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createJob(payload) {
  const body = { ...payload }
  if (payload.lat !== undefined && payload.lng !== undefined) {
    body.location = `POINT(${payload.lng} ${payload.lat})`
    delete body.lat
    delete body.lng
  }
  const { data, error } = await supabase.from('jobs').insert(body).select().single()
  if (error) throw error
  return data
}

export async function updateJobStatus(jobId, status) {
  const { data, error } = await supabase
    .from('jobs').update({ status }).eq('id', jobId).select().single()
  if (error) throw error
  return data
}

export async function getJobById(jobId) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url, rating_average, city), selected_worker:profiles!jobs_selected_worker_id_fkey(id, full_name, avatar_url, rating_average, phone)`)
    .eq('id', jobId)
    .single()
  if (error) throw error
  return data
}

export async function deleteJob(jobId) {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}

export async function updateJob(jobId, updates) {
  const { data, error } = await supabase.from('jobs').update(updates).eq('id', jobId).select().single()
  if (error) throw error
  return data
}
