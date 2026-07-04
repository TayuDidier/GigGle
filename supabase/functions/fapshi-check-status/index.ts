import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS, json, fapshiStatus } from '../_shared/fapshi.ts'

// Poll fallback for when the webhook is delayed. Reads the active leg's status
// from Fapshi and syncs terminal states back to the DB. Returns the escrow status.

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')         ?? ''
const SUPABASE_SVC_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const jobId = new URL(req.url).searchParams.get('job_id')
  if (!jobId) return json({ error: 'Missing job_id' }, 400)

  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  const { data: escrow } = await db.from('escrows').select('*').eq('job_id', jobId).maybeSingle()
  if (!escrow) return json({ status: null })

  // Terminal — return cached state, no Fapshi call.
  if (['released', 'refunded', 'failed'].includes(escrow.status)) {
    return json({ status: escrow.status })
  }

  const now = () => new Date().toISOString()

  // Collection leg in flight
  if (escrow.status === 'pending_funding' && escrow.collection_trans_id) {
    const { status, reason } = await fapshiStatus(escrow.collection_trans_id, 'collection')
    if (status === 'SUCCESSFUL') {
      await db.from('escrows').update({
        status: 'held', collection_status: 'SUCCESSFUL', funded_at: now(), updated_at: now(),
      }).eq('id', escrow.id)
      await db.from('jobs').update({ status: 'in_progress' }).eq('id', escrow.job_id)
      return json({ status: 'held' })
    }
    if (status === 'FAILED' || status === 'EXPIRED') {
      await db.from('escrows').update({
        status: 'failed', collection_status: status, failure_reason: reason ?? 'Collection failed', updated_at: now(),
      }).eq('id', escrow.id)
      return json({ status: 'failed' })
    }
    return json({ status: 'pending_funding' })
  }

  // Payout leg in flight
  if (escrow.status === 'releasing' && escrow.payout_trans_id) {
    const { status, reason } = await fapshiStatus(escrow.payout_trans_id, 'payout')
    if (status === 'SUCCESSFUL') {
      await db.from('escrows').update({
        status: 'released', payout_status: 'SUCCESSFUL', released_at: now(), updated_at: now(),
      }).eq('id', escrow.id)
      return json({ status: 'released' })
    }
    if (status === 'FAILED' || status === 'EXPIRED') {
      await db.from('escrows').update({
        status: 'failed', payout_status: status, failure_reason: reason ?? 'Payout failed', updated_at: now(),
      }).eq('id', escrow.id)
      return json({ status: 'failed' })
    }
    return json({ status: 'releasing' })
  }

  return json({ status: escrow.status })
})
