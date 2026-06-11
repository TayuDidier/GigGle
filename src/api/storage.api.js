import { supabase } from '../lib/supabase'

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) throw new Error('Only JPG, PNG or WebP images allowed')
  if (file.size > 2 * 1024 * 1024) throw new Error('Image must be under 2MB')

  const fileName = `${userId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)

  // Bust cache with timestamp
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId)
  if (updateError) throw updateError

  return publicUrl
}
