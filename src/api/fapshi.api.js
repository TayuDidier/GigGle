import { supabase } from '../lib/supabase'

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return `Bearer ${session?.access_token}`
}

/**
 * Employer funds escrow — collects job.pay from the employer's wallet via Fapshi.
 * Returns { transId, status: 'pending_funding', gross_amount, commission_amount, payout_amount, provider }.
 */
export async function fundEscrow({ jobId, phoneNumber }) {
  const res = await fetch(`${EDGE_BASE}/fapshi-fund-escrow`, {
    method:  'POST',
    headers: { Authorization: await authHeader(), 'Content-Type': 'application/json' },
    body:    JSON.stringify({ job_id: jobId, phone_number: phoneNumber }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to fund escrow')
  return data
}

/**
 * Employer releases a held escrow — pays the worker (gross − commission) via Fapshi.
 * Returns { transId, status: 'releasing' }.
 */
export async function releaseEscrow({ jobId, workerPhone }) {
  const res = await fetch(`${EDGE_BASE}/fapshi-release`, {
    method:  'POST',
    headers: { Authorization: await authHeader(), 'Content-Type': 'application/json' },
    body:    JSON.stringify({ job_id: jobId, worker_phone: workerPhone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to release payout')
  return data
}

/**
 * Polls the active leg of an escrow and syncs terminal states back to the DB.
 * Returns { status: escrow_status | null }.
 */
export async function checkEscrowStatus(jobId) {
  const res = await fetch(`${EDGE_BASE}/fapshi-check-status?job_id=${jobId}`, {
    headers: { Authorization: await authHeader() },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Status check failed')
  return data
}
