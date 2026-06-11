import { supabase } from '../lib/supabase'

export async function submitRating({ jobId, raterId, ratedId, score, reviewText }) {
  const { data, error } = await supabase
    .from('ratings')
    .insert({ job_id: jobId, rater_id: raterId, rated_id: ratedId, score, review_text: reviewText || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRatingsForUser(profileId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('*, rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url, role)')
    .eq('rated_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function checkExistingRating(jobId, raterId) {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('job_id', jobId)
    .eq('rater_id', raterId)
    .maybeSingle()
  if (error) throw error
  return data
}
