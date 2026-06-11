import { supabase } from '../lib/supabase'

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return `Bearer ${session?.access_token}`
}

/**
 * Initiates a CamPay mobile money collection from the employer's phone.
 * Returns { transaction_ref, ussd_code, operator, status: 'pending' }.
 */
export async function initiatePayment({ jobId, phoneNumber, amount }) {
  const res = await fetch(`${EDGE_BASE}/campay-initiate`, {
    method:  'POST',
    headers: { Authorization: await authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, phone_number: phoneNumber, amount }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Payment initiation failed')
  return data
}

/**
 * Checks the current status of a payment for a given job.
 * Returns { status: 'pending' | 'confirmed' | 'failed' | null }.
 * Also syncs CamPay state back to DB when a terminal state is reached.
 */
export async function checkPaymentStatus(jobId) {
  const res = await fetch(`${EDGE_BASE}/campay-check-status?job_id=${jobId}`, {
    headers: { Authorization: await authHeader() },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Status check failed')
  return data
}
