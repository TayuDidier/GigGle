import { supabase } from '../lib/supabase'

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

export async function getProfileById(profileId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(profileId, updates) {
  // If updates contain lat/lng, convert to PostGIS WKT
  const payload = { ...updates }
  if (updates.lat !== undefined && updates.lng !== undefined) {
    payload.location = `POINT(${updates.lng} ${updates.lat})`
    delete payload.lat
    delete payload.lng
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', profileId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeOnboarding(profileId, updates) {
  return updateProfile(profileId, { ...updates, onboarding_done: true })
}

export async function getWorkersNearLocation({ lat, lng, radiusKm = 20, limit = 40 }) {
  const { data, error } = await supabase.rpc('get_workers_near_location', {
    lat, lng, radius_km: radiusKm, p_limit: limit,
  })
  if (error) throw error
  return data
}

export async function getRatingsForProfile(profileId) {
  const { data, error } = await supabase
    .from('ratings')
    .select(`*, rater:profiles!ratings_rater_id_fkey(id, full_name, avatar_url, role)`)
    .eq('rated_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
