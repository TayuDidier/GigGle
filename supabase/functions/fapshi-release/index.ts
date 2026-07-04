import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  CORS, json, normPhone, isValidLocalPhone, detectProvider, mediumFor, fapshiPayout,
} from '../_shared/fapshi.ts'

// Employer releases a held escrow: pay the worker (gross - commission) via Fapshi
// /payout. On success the escrow sits 'releasing'; the webhook (or poll) flips it
// to 'released'.

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
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  let body: { job_id?: string; worker_phone?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const { job_id, worker_phone } = body
  if (!job_id) return json({ error: 'job_id is required' }, 400)

  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  const { data: profile } = await db.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return json({ error: 'Profile not found' }, 404)

  const { data: escrow } = await db.from('escrows').select('*').eq('job_id', job_id).maybeSingle()
  if (!escrow)                            return json({ error: 'No escrow found for this job' }, 404)
  if (escrow.employer_id !== profile.id)  return json({ error: 'Forbidden' }, 403)
  if (['releasing', 'released'].includes(escrow.status))
    return json({ error: 'Payout is already in progress or completed' }, 409)
  if (escrow.status !== 'held')           return json({ error: 'Escrow is not funded/held yet' }, 400)

  const { data: job } = await db.from('jobs').select('id, status, title').eq('id', job_id).single()
  if (!job || job.status !== 'completed') return json({ error: 'Job must be completed before release' }, 400)

  // Worker payout number: use the one supplied on the release screen, else fall
  // back to the worker's profile phone.
  let phone = normPhone(worker_phone ?? '')
  if (!phone) {
    const { data: worker } = await db.from('profiles').select('phone').eq('id', escrow.worker_id).single()
    phone = normPhone(worker?.phone ?? '')
  }
  if (!isValidLocalPhone(phone))     return json({ error: 'A valid worker mobile money number is required' }, 400)
  if (escrow.payout_amount < 100)    return json({ error: 'Payout amount is below the 100 XAF minimum' }, 400)

  // ── Fapshi /payout (send to worker) ──
  const provider = detectProvider(phone)
  const result = await fapshiPayout({
    amount:     escrow.payout_amount,
    phone,
    medium:     mediumFor(provider),
    externalId: job_id,
    message:    `GigGle payout — ${job.title}`,
  })
  if (!result.ok) return json({ error: result.error }, 502)

  const { error: dbErr } = await db.from('escrows').update({
    status:          'releasing',
    payout_trans_id: result.transId,
    payout_status:   'PENDING',
    worker_phone:    phone,
    provider_out:    provider,
    updated_at:      new Date().toISOString(),
  }).eq('job_id', job_id)
  if (dbErr) return json({ error: dbErr.message }, 500)

  return json({ transId: result.transId, status: 'releasing' })
})
