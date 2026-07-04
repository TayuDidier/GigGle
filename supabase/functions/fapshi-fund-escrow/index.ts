import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  CORS, json, normPhone, isValidLocalPhone, detectProvider, mediumFor, fapshiDirectPay,
} from '../_shared/fapshi.ts'

// Employer funds escrow: collect job.pay from the employer's wallet via Fapshi.
// On success the escrow sits 'pending_funding'; the webhook (or poll) flips it to
// 'held' and advances the job to 'in_progress'.

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')         ?? ''
const SUPABASE_SVC_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const COMMISSION_RATE   = Number(Deno.env.get('GIGGLE_COMMISSION_RATE') ?? '0.07')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  let body: { job_id?: string; phone_number?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { job_id, phone_number } = body
  if (!job_id || !phone_number) return json({ error: 'job_id and phone_number are required' }, 400)

  const phone = normPhone(phone_number)
  if (!isValidLocalPhone(phone)) {
    return json({ error: 'Invalid phone number — use a Cameroonian number, e.g. 6XXXXXXXX' }, 400)
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  const { data: profile } = await db.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return json({ error: 'Profile not found' }, 404)

  // Job must be awaiting funding, owned by this employer, with a worker selected.
  const { data: job } = await db
    .from('jobs')
    .select('id, employer_id, selected_worker_id, pay, title, status')
    .eq('id', job_id)
    .single()
  if (!job)                              return json({ error: 'Job not found' }, 404)
  if (job.employer_id !== profile.id)    return json({ error: 'Forbidden' }, 403)
  if (!job.selected_worker_id)           return json({ error: 'No worker selected for this job' }, 400)
  if (job.status !== 'awaiting_funding') return json({ error: 'Job is not awaiting funding' }, 400)

  const gross = Math.round(Number(job.pay))
  if (gross < 100) return json({ error: 'Job pay is below the 100 XAF minimum' }, 400)
  const commission = Math.round(gross * COMMISSION_RATE)
  const payout     = gross - commission

  // Block a duplicate active escrow (allow retry only after a failed one).
  const { data: existing } = await db
    .from('escrows').select('id, status').eq('job_id', job_id).maybeSingle()
  if (existing && ['pending_funding', 'held', 'releasing', 'released'].includes(existing.status)) {
    return json({ error: 'An escrow is already active for this job' }, 409)
  }

  // ── Fapshi /direct-pay (collection from employer) ──
  const provider = detectProvider(phone)
  const result = await fapshiDirectPay({
    amount:     gross,
    phone,
    medium:     mediumFor(provider),
    externalId: job_id,
    message:    `GigGle escrow — ${job.title}`,
  })
  if (!result.ok) return json({ error: result.error }, 502)

  const { error: dbErr } = await db.from('escrows').upsert({
    job_id,
    employer_id:         profile.id,
    worker_id:           job.selected_worker_id,
    gross_amount:        gross,
    commission_amount:   commission,
    payout_amount:       payout,
    status:              'pending_funding',
    collection_trans_id: result.transId,
    collection_status:   'PENDING',
    employer_phone:      phone,
    provider_in:         provider,
    updated_at:          new Date().toISOString(),
  }, { onConflict: 'job_id' })
  if (dbErr) return json({ error: dbErr.message }, 500)

  return json({
    transId:           result.transId,
    status:            'pending_funding',
    gross_amount:      gross,
    commission_amount: commission,
    payout_amount:     payout,
    provider,
  })
})
