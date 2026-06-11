import { supabase } from '../lib/supabase'

export async function getMessageHistory(jobId, myId = null, partnerId = null) {
  let query = supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  if (myId && partnerId) {
    // Show only messages in this two-party conversation, plus legacy null-recipient messages
    query = query.or(
      `and(sender_id.eq.${myId},recipient_id.eq.${partnerId}),` +
      `and(sender_id.eq.${partnerId},recipient_id.eq.${myId}),` +
      `recipient_id.is.null`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function sendMessage({ jobId, senderId, recipientId, content, imageUrl }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      job_id: jobId,
      sender_id: senderId,
      recipient_id: recipientId || null,
      content: content || null,
      image_url: imageUrl || null,
    })
    .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)')
    .single()
  if (error) throw error
  return data
}

export async function uploadChatImage(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('chat-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('chat-images').getPublicUrl(path)
  return data.publicUrl
}

export function subscribeToJobMessages(jobId, onMessage) {
  const channel = supabase
    .channel(`job-messages:${jobId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` },
      (payload) => onMessage(payload.new)
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
