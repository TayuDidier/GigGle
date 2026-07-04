import { supabase } from '../lib/supabase'

export async function getMyCredentials(profileId) {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addCredential(profileId, { fileUrl, fileName, docType, description }) {
  const { data, error } = await supabase
    .from('credentials')
    .insert({ profile_id: profileId, file_url: fileUrl, file_name: fileName, doc_type: docType, description })
    .select().single()
  if (error) throw error
  return data
}

export async function deleteCredential(id) {
  const { error } = await supabase.from('credentials').delete().eq('id', id)
  if (error) throw error
}

export async function adminGetVerifications(status) {
  const { data, error } = await supabase.rpc('admin_get_verifications', { p_status: status || null })
  if (error) throw error
  return data
}

export async function adminReviewVerification(profileId, { status, reason }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ verification_status: status, verification_rejection_reason: reason || null })
    .eq('id', profileId)
    .select().single()
  if (error) throw error
  return data
}
