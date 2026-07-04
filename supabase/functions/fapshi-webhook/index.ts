import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Fapshi webhook — fires on SUCCESSFUL / FAILED / EXPIRED for both the collection
// and payout legs. Payload matches the payment-status response. Authenticated via
// the x-wh-secret header (set on the service's dashboard config).
//
// Transitions (leg-aware and idempotent):
//   Collection SUCCESSFUL : pending_funding -> held   (+ job -> in_progress)
//   Collection FAILED     : pending_funding -> failed
//   Payout     SUCCESSFUL : held|releasing  -> released
//   Payout     FAILED     : held|releasing  -> failed

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WEBHOOK_SECRET   = Deno.env.get('FAPSHI_WEBHOOK_SECRET')     ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wh-secret',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

type EscrowRow = {
  id: string; job_id: string; status: string
  collection_trans_id: string | null; payout_trans_id: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // Verify the webhook secret.
  const secret = req.headers.get('x-wh-secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  let body: { transId?: string; status?: string; transType?: string; externalId?: string; reason?: string }
  try { body = await req.json() } catch { return new Response('Bad Request', { status: 400 }) }

  const { transId, status, transType, externalId, reason } = body
  if (!transId || !status) return new Response('Missing transId or status', { status: 400 })

  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  const isPayout  = String(transType ?? '').toLowerCase() === 'payout'
  const matchCol  = isPayout ? 'payout_trans_id' : 'collection_trans_id'

  // Match by the leg's transaction id; fall back to externalId (= job_id).
  let escrow: EscrowRow | null = null
  const byTrans = await db.from('escrows').select('id, job_id, status, collection_trans_id, payout_trans_id')
    .eq(matchCol, transId).maybeSingle()
  escrow = byTrans.data as EscrowRow | null
  if (!escrow && externalId) {
    const byJob = await db.from('escrows').select('id, job_id, status, collection_trans_id, payout_trans_id')
      .eq('job_id', externalId).maybeSingle()
    escrow = byJob.data as EscrowRow | null
  }
  if (!escrow) return json({ received: true, note: 'no matching escrow' })

  const now = new Date().toISOString()

  if (isPayout) {
    if (!['held', 'releasing'].includes(escrow.status)) {
      return json({ received: true, note: `ignored payout webhook in status ${escrow.status}` })
    }
    if (status === 'SUCCESSFUL') {
      await db.from('escrows').update({
        status: 'released', payout_status: 'SUCCESSFUL', payout_trans_id: transId,
        released_at: now, updated_at: now,
      }).eq('id', escrow.id)
    } else if (status === 'FAILED' || status === 'EXPIRED') {
      await db.from('escrows').update({
        status: 'failed', payout_status: status, failure_reason: reason ?? 'Payout failed', updated_at: now,
      }).eq('id', escrow.id)
    }
    return json({ received: true })
  }

  // Collection leg
  if (escrow.status !== 'pending_funding') {
    return json({ received: true, note: `ignored collection webhook in status ${escrow.status}` })
  }
  if (status === 'SUCCESSFUL') {
    await db.from('escrows').update({
      status: 'held', collection_status: 'SUCCESSFUL', collection_trans_id: transId,
      funded_at: now, updated_at: now,
    }).eq('id', escrow.id)
    await db.from('jobs').update({ status: 'in_progress' }).eq('id', escrow.job_id)
  } else if (status === 'FAILED' || status === 'EXPIRED') {
    await db.from('escrows').update({
      status: 'failed', collection_status: status, failure_reason: reason ?? 'Collection failed', updated_at: now,
    }).eq('id', escrow.id)
  }
  return json({ received: true })
})
