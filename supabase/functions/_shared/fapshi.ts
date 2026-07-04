// Shared Fapshi helpers for GigGle escrow Edge Functions.
//
// Fapshi uses two SEPARATE services — one collection-enabled (direct-pay),
// one payout-enabled (payout) — each with its own apiuser/apikey. A single
// service cannot do both. Auth is via apiuser/apikey HEADERS (not a bearer token).
// Phone numbers are the 9-digit local Cameroonian form (e.g. 6XXXXXXXX).

const BASE = Deno.env.get('FAPSHI_BASE_URL') ?? 'https://sandbox.fapshi.com'

const COLLECT = {
  apiuser: Deno.env.get('FAPSHI_COLLECT_APIUSER') ?? '',
  apikey:  Deno.env.get('FAPSHI_COLLECT_APIKEY')  ?? '',
}
const PAYOUT = {
  apiuser: Deno.env.get('FAPSHI_PAYOUT_APIUSER') ?? '',
  apikey:  Deno.env.get('FAPSHI_PAYOUT_APIKEY')  ?? '',
}

export type FapshiMedium = 'mobile money' | 'orange money'
export type DbProvider   = 'mtn_momo' | 'orange_money'
export type FapshiStatus = 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Fapshi expects the 9-digit local form (strip a 237 country code if present).
export function normPhone(raw: string): string {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('237') && d.length === 12) return d.slice(3)
  return d
}

export function isValidLocalPhone(phone: string): boolean {
  return /^6\d{8}$/.test(phone)
}

// Detect MTN vs Orange from the Cameroonian prefix.
export function detectProvider(localPhone: string): DbProvider {
  const pfx = parseInt(localPhone.slice(0, 3), 10)
  if ((pfx >= 650 && pfx <= 659) || (pfx >= 670 && pfx <= 689)) return 'mtn_momo'
  return 'orange_money'
}

export function mediumFor(provider: DbProvider): FapshiMedium {
  return provider === 'mtn_momo' ? 'mobile money' : 'orange money'
}

type InitBody = { amount: number; phone: string; medium: FapshiMedium; externalId: string; message: string }
type InitResult = { ok: boolean; transId?: string; error?: string }

// POST /direct-pay (collection service) — pull money from the payer's wallet.
export function fapshiDirectPay(body: InitBody): Promise<InitResult> {
  return callInit('/direct-pay', COLLECT, body)
}

// POST /payout (payout service) — send money to the recipient's wallet.
export function fapshiPayout(body: InitBody): Promise<InitResult> {
  return callInit('/payout', PAYOUT, body)
}

async function callInit(
  path: string,
  creds: { apiuser: string; apikey: string },
  body: InitBody,
): Promise<InitResult> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { apiuser: creds.apiuser, apikey: creds.apikey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({})) as { transId?: string; message?: string; error?: string }
    if (!res.ok || !data.transId) {
      return { ok: false, error: data.message ?? data.error ?? `Fapshi request to ${path} failed` }
    }
    return { ok: true, transId: data.transId }
  } catch (err) {
    return { ok: false, error: `Fapshi unreachable: ${(err as Error).message}` }
  }
}

// GET /payment-status/{transId} — authenticate with the service that owns the
// transaction (collection creds for collections, payout creds for payouts).
export async function fapshiStatus(
  transId: string,
  leg: 'collection' | 'payout',
): Promise<{ status: FapshiStatus | null; reason?: string }> {
  const creds = leg === 'payout' ? PAYOUT : COLLECT
  try {
    const res = await fetch(`${BASE}/payment-status/${transId}`, {
      headers: { apiuser: creds.apiuser, apikey: creds.apikey },
    })
    const data = await res.json().catch(() => ({})) as { status?: FapshiStatus; reason?: string }
    return { status: data.status ?? null, reason: data.reason }
  } catch {
    return { status: null }
  }
}
