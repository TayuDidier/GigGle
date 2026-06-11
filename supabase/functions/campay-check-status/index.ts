import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CAMPAY_BASE = Deno.env.get('CAMPAY_USE_DEMO') === 'true'
  ? 'https://demo.campay.net/api'
  : 'https://www.campay.net/api'

const CAMPAY_TOKEN       = Deno.env.get('CAMPAY_TOKEN')              ?? ''
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_ANON_KEY  = Deno.env.get('SUPABASE_ANON_KEY')         ?? ''
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // ── Auth ─────────────────────────────────────────────────────────────────
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

  // Fetch our payment record
  const { data: payment } = await db
    .from('payment_acknowledgments')
    .select('transaction_ref, status, amount, provider, phone_number')
    .eq('job_id', jobId)
    .maybeSingle()

  // No payment initiated yet
  if (!payment) return json({ status: null })

  // Already terminal — return DB state immediately (avoid unnecessary CamPay call)
  if (payment.status === 'confirmed' || payment.status === 'failed') {
    return json({ status: payment.status })
  }

  // Still pending — ask CamPay for current state
  if (!payment.transaction_ref) return json({ status: 'pending' })

  let campayStatus: string
  try {
    const res  = await fetch(`${CAMPAY_BASE}/transaction/${payment.transaction_ref}/`, {
      headers: { Authorization: `Token ${CAMPAY_TOKEN}` },
    })
    const data = await res.json()
    campayStatus = data.status ?? 'PENDING'
  } catch {
    // CamPay unreachable — return our cached status without erroring the client
    return json({ status: 'pending' })
  }

  // Sync terminal states back to DB
  if (campayStatus === 'SUCCESSFUL' || campayStatus === 'FAILED') {
    const newStatus = campayStatus === 'SUCCESSFUL' ? 'confirmed' : 'failed'
    await db
      .from('payment_acknowledgments')
      .update({
        status:         newStatus,
        reference_code: payment.transaction_ref,
        ...(newStatus === 'confirmed' ? { confirmed_at: new Date().toISOString() } : {}),
      })
      .eq('job_id', jobId)

    return json({ status: newStatus })
  }

  return json({ status: 'pending' })
})
