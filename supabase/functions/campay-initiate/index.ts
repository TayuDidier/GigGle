import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CAMPAY_BASE = Deno.env.get('CAMPAY_USE_DEMO') === 'true'
  ? 'https://demo.campay.net/api'
  : 'https://www.campay.net/api'

const CAMPAY_TOKEN       = Deno.env.get('CAMPAY_TOKEN') ?? ''
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY  = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SVC_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Normalise Cameroonian phone number to 237XXXXXXXXX (12 digits)
function normPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('237') && d.length === 12) return d
  if (d.length === 9) return `237${d}`
  return d
}

// Detect MTN vs Orange from Cameroonian number prefix
function detectProvider(phone: string): 'mtn_momo' | 'orange_money' {
  const local = phone.replace(/^237/, '')
  const pfx   = parseInt(local.slice(0, 3), 10)
  // MTN: 650-659, 670-679, 680-689
  if ((pfx >= 650 && pfx <= 659) || (pfx >= 670 && pfx <= 689)) return 'mtn_momo'
  // Orange: 690-699, 655-659
  return 'orange_money'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // ── Auth ────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { job_id: string; phone_number: string; amount: number }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { job_id, phone_number, amount } = body
  if (!job_id || !phone_number || !amount) {
    return json({ error: 'job_id, phone_number and amount are required' }, 400)
  }

  const phone = normPhone(phone_number)
  if (phone.length !== 12) {
    return json({ error: 'Invalid phone number — use format 6XXXXXXXX or 2376XXXXXXXX' }, 400)
  }

  // ── Admin DB client ──────────────────────────────────────────────────────
  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  // Resolve employer profile
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return json({ error: 'Profile not found' }, 404)

  // Verify job: must be completed and owned by this employer
  const { data: job } = await db
    .from('jobs')
    .select('id, employer_id, selected_worker_id, pay, title, status')
    .eq('id', job_id)
    .single()
  if (!job)                            return json({ error: 'Job not found' }, 404)
  if (job.employer_id !== profile.id)  return json({ error: 'Forbidden' }, 403)
  if (job.status !== 'completed')      return json({ error: 'Job must be completed before payment' }, 400)

  // Block duplicate active payments
  const { data: existing } = await db
    .from('payment_acknowledgments')
    .select('id, status')
    .eq('job_id', job_id)
    .maybeSingle()
  if (existing && ['pending', 'submitted', 'confirmed'].includes(existing.status)) {
    return json({ error: 'A payment is already in progress for this job' }, 409)
  }

  // ── Call CamPay /collect/ ────────────────────────────────────────────────
  const provider = detectProvider(phone)
  let campay: { reference?: string; ussd_code?: string; operator?: string; detail?: string; message?: string }

  try {
    const res = await fetch(`${CAMPAY_BASE}/collect/`, {
      method:  'POST',
      headers: {
        Authorization:  `Token ${CAMPAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:             String(Math.round(amount)),
        currency:           'XAF',
        from:               phone,
        description:        `GigGle — ${job.title}`,
        external_reference: job_id,
      }),
    })
    campay = await res.json()
    if (!res.ok || !campay.reference) {
      return json({ error: campay.detail ?? campay.message ?? 'CamPay collection request failed' }, 502)
    }
  } catch (err) {
    return json({ error: `CamPay unreachable: ${(err as Error).message}` }, 502)
  }

  // ── Persist pending payment record ───────────────────────────────────────
  const { error: dbErr } = await db
    .from('payment_acknowledgments')
    .upsert(
      {
        job_id,
        transaction_ref: campay.reference,
        reference_code:  null,
        phone_number:    phone,
        provider,
        amount:          Math.round(amount),
        submitted_by:    profile.id,
        status:          'pending',
        initiated_at:    new Date().toISOString(),
        submitted_at:    new Date().toISOString(),
      },
      { onConflict: 'job_id' }
    )
  if (dbErr) return json({ error: dbErr.message }, 500)

  return json({
    transaction_ref: campay.reference,
    ussd_code:       campay.ussd_code ?? null,
    operator:        campay.operator  ?? provider,
    status:          'pending',
  })
})
