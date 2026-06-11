import { supabase } from '../lib/supabase'

export async function confirmPayment({ paymentId, confirmedBy }) {
  const { data, error } = await supabase
    .from('payment_acknowledgments')
    .update({ status: 'confirmed', confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPaymentForJob(jobId) {
  const { data, error } = await supabase
    .from('payment_acknowledgments')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Payment lifecycle statuses
// pending   — CamPay collection initiated, waiting for employer to approve on phone
// confirmed — CamPay confirmed debit (via webhook or poll sync); worker has acknowledged
// failed    — CamPay debit was declined or timed out
export const PAYMENT_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  FAILED:    'failed',
}
