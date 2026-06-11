import { supabase } from '../lib/supabase'

export async function applyForJob({ jobId, workerId, coverNote }) {
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, worker_id: workerId, cover_note: coverNote })
    .select().single()
  if (error) throw error
  return data
}

export async function getMyApplications(workerId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`*, job:jobs(id, title, category, pay, city, status, employer:profiles!jobs_employer_id_fkey(id, full_name, avatar_url, rating_average))`)
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getJobApplicants(jobId) {
  const { data, error } = await supabase
    .from('applications')
    .select(`*, worker:profiles!applications_worker_id_fkey(id, full_name, bio, avatar_url, rating_average, rating_count, city, phone, location)`)
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function acceptApplicant(applicationId) {
  const { data, error } = await supabase
    .from('applications')
    .update({ status: 'accepted' })
    .eq('id', applicationId)
    .select().single()
  if (error) throw error
  return data
}

export async function checkExistingApplication(jobId, workerId) {
  const { data } = await supabase
    .from('applications')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('worker_id', workerId)
    .maybeSingle()
  return data
}
