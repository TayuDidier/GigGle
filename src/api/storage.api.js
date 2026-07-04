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

const VERIFICATION_DOC_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
const VERIFICATION_DOC_MAX_SIZE = 5 * 1024 * 1024

function validateVerificationDoc(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!VERIFICATION_DOC_EXTS.includes(ext)) throw new Error('Only JPG, PNG, WebP or PDF files allowed')
  if (file.size > VERIFICATION_DOC_MAX_SIZE) throw new Error('File must be under 5MB')
  return ext
}

export async function uploadIdDocument(userId, file) {
  const ext = validateVerificationDoc(file)
  const path = `${userId}/id-document.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('verification-docs')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ id_document_url: path })
    .eq('user_id', userId)
  if (updateError) throw updateError

  return path
}

export async function uploadCredentialFile(userId, file) {
  const ext = validateVerificationDoc(file)
  const path = `${userId}/credential-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('verification-docs')
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  return path
}

export async function getSignedDocUrl(path) {
  const { data, error } = await supabase.storage
    .from('verification-docs')
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
