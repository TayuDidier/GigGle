import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

  let body: { reference?: string; status?: string; amount?: string; currency?: string; operator?: string }
  try { body = await req.json() } catch { return new Response('Bad Request', { status: 400 }) }

  const { reference, status } = body
  if (!reference || !status) return new Response('Missing reference or status', { status: 400 })

  const db = createClient(SUPABASE_URL, SUPABASE_SVC_KEY)

  // Map CamPay status → our enum
  const paymentStatus = status === 'SUCCESSFUL' ? 'confirmed' : 'failed'

  const updates: Record<string, unknown> = {
    status:         paymentStatus,
    reference_code: reference,
  }
  if (paymentStatus === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  }

  const { error } = await db
    .from('payment_acknowledgments')
    .update(updates)
    .eq('transaction_ref', reference)

  if (error) {
    console.error('Webhook DB update failed:', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  return json({ received: true })
})
