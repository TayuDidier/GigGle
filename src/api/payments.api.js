import { supabase } from '../lib/supabase'

/**
 * Reads the escrow record for a job (one per job), or null if none yet.
 */
export async function getEscrowForJob(jobId) {
  const { data, error } = await supabase
    .from('escrows')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Escrow lifecycle statuses
// pending_funding — Fapshi collection initiated, waiting for employer to approve on phone
// held            — collection SUCCESSFUL, funds in platform float; job is in_progress
// releasing       — payout to worker initiated, waiting for confirmation
// released        — payout SUCCESSFUL, worker paid
// refunding       — refund payout to employer initiated (dispute)
// refunded        — refund SUCCESSFUL
// failed          — collection or payout declined / failed
export const ESCROW_STATUS = {
  PENDING_FUNDING: 'pending_funding',
  HELD:            'held',
  RELEASING:       'releasing',
  RELEASED:        'released',
  REFUNDING:       'refunding',
  REFUNDED:        'refunded',
  FAILED:          'failed',
}

export const PROVIDER_LABEL = { mtn_momo: 'MTN MoMo', orange_money: 'Orange Money' }
