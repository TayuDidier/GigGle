# GigGle Escrow Payments — Implementation Plan (Fapshi)

Status: DRAFT — awaiting sign-off before implementation. Build against Fapshi **sandbox** first, switch to live last.

---

## 1. Verified Fapshi API facts (checked against docs.fapshi.com, June 2026)

**Base URLs**
- Sandbox: `https://sandbox.fapshi.com` (confirmed in OpenAPI spec)
- Live: `https://live.fapshi.com` (confirm exact host on dashboard before go-live)

**Auth** — per-service headers, NOT a bearer token (this differs from CamPay):
- `apiuser: <service api user>`
- `apikey: <service api key>`

**⚠️ Two separate services required.** A Fapshi service is *either* collection-enabled *or* payout-enabled — "a payout service cannot simultaneously collect payments." So we need **two credential pairs**:
- Collection service → used by `direct-pay` (pull money from employer)
- Payout service → used by `payout` (send money to worker)

**Endpoints we use**

| Op | Method / Path | Key request body | Response |
|---|---|---|---|
| Collect from employer | `POST /direct-pay` | `amount`(int ≥100), `phone`("67XXXXXXX" 9-digit local), `medium`("mobile money"\|"orange money", omit=auto), `externalId`, `message` | `{ message, transId, dateInitiated }` |
| Pay worker | `POST /payout` | same shape (`amount`, `phone`, `medium`, `externalId`, `message`) | `{ message, transId, dateInitiated }` |
| Poll status | `GET /payment-status/{transId}` | — | `{ transId, status, transType, amount, revenue, externalId, financialTransId, reason, dateConfirmed }` |

- **Status values:** `CREATED → PENDING → SUCCESSFUL | FAILED | EXPIRED`. Direct-pay/payout never expire — terminal state is SUCCESSFUL or FAILED.
- **`revenue`** = amount after Fapshi's own fee is deducted (matters for our float math — see §3).
- **Status poll rate limit:** 6 req/min per transId (current 5s polling is fine; webhook preferred).
- **Phone format is 9-digit local `67XXXXXXX`** — NOT the `237…` 12-digit form the current CamPay code produces. Normalization must change.
- **`medium` mapping:** `"mobile money"` = MTN, `"orange money"` = Orange.

**Webhook**
- Configured per service on the Fapshi dashboard (one for collection service, one for payout service).
- Fires on SUCCESSFUL / FAILED / EXPIRED; payload = the payment-status response body.
- Security: if a secret is set on the dashboard, every webhook includes header `x-wh-secret` = that secret. We verify by comparing.

**Activation gotchas (do early — they gate go-live):**
- `direct-pay` is disabled by default on **live**; must be activated via Fapshi support.
- `payout` on live requires emailing support with the Live API User of the payout service.
- Both work in sandbox without that.

---

## 2. Target escrow flow (collect-at-hire)

```
Employer selects applicant
        │  (accept application)
        ▼
  job: awaiting_funding   ← NEW state; trigger no longer jumps to in_progress
        │
Employer funds escrow  ──POST /direct-pay──►  Fapshi pulls from employer phone
        │                                     webhook/poll: SUCCESSFUL
        ▼
  escrow: held           job: in_progress     ← worker now knows money is secured
        │
   ...work happens...
        │
Employer marks complete  →  job: completed
        │
Employer releases        ──POST /payout──►   Fapshi sends to worker phone
        │                                     webhook/poll: SUCCESSFUL
        ▼
  escrow: released        worker paid (payout_amount = gross − commission)
        │
   both parties rate
```

Dispute path: if work isn't confirmed / a report is filed, escrow stays `held`; an admin resolves → release to worker **or** refund to employer (`payout` back to employer phone).

---

## 3. Decisions (LOCKED)

1. **Commission: worker bears it.** Employer pays the posted `job.pay`; worker receives `job.pay − commission`. Rate **7%**, configurable via `GIGGLE_COMMISSION_RATE`. → `gross_amount = job.pay`, `commission_amount = round(job.pay * 0.07)`, `payout_amount = gross − commission`.
2. **Release: manual, employer-triggered.** Employer clicks "Release" after marking the job completed; admin can override in disputes. (No auto-release.)
3. **Worker payout number:** reuse `profiles.phone`, prefilled and confirmable on the release receipt screen. (No separate `momo_number` column for MVP.)

**Note (not blocking):** Fapshi's own fee reduces the float on both the collect and payout legs. Fine for the sandbox demo; for live, the 7% must exceed combined Fapshi fees or GigGle loses money per job. Revisit rate before go-live.

---

## 4. Phase 0 — Fapshi sandbox setup (manual, you do this)

- [ ] Create Fapshi account, open the **sandbox** dashboard.
- [ ] Create a **collection** service → copy its `apiuser` / `apikey`.
- [ ] Create a **payout** service → copy its `apiuser` / `apikey`.
- [ ] Set webhook URL on **both** services → `https://omcakemsuifgfanvepbs.supabase.co/functions/v1/fapshi-webhook`, and set the same `x-wh-secret` secret on both.
- [ ] Set Supabase Edge secrets:
  - `FAPSHI_BASE_URL=https://sandbox.fapshi.com`
  - `FAPSHI_COLLECT_APIUSER`, `FAPSHI_COLLECT_APIKEY`
  - `FAPSHI_PAYOUT_APIUSER`, `FAPSHI_PAYOUT_APIKEY`
  - `FAPSHI_WEBHOOK_SECRET`
  - `GIGGLE_COMMISSION_RATE=0.07`

---

## 5. Phase 1 — Schema migration  (`supabase/005_escrow.sql`)

- [ ] New enum `escrow_status`: `pending_funding`, `held`, `releasing`, `released`, `refunding`, `refunded`, `failed`.
- [ ] Add `awaiting_funding` to `job_status` enum (Postgres `ALTER TYPE ... ADD VALUE`).
- [ ] New table `public.escrows`:
  - `id`, `job_id` (UNIQUE FK), `employer_id`, `worker_id`
  - `gross_amount` int, `commission_amount` int, `payout_amount` int, `currency` default `'XAF'`
  - `status escrow_status` default `pending_funding`
  - `collection_trans_id`, `collection_status`, `employer_phone`, `provider_in`
  - `payout_trans_id`, `payout_status`, `worker_phone`, `provider_out`
  - `failure_reason`, `funded_at`, `released_at`, `created_at`, `updated_at`
  - indexes on `job_id`, `collection_trans_id`, `payout_trans_id`.
- [ ] RLS: employer (owner) and selected worker can `SELECT` their job's escrow; **no client INSERT/UPDATE** — only the service-role Edge Functions write.
- [ ] Modify `reject_other_applications()` trigger: on accept, set job to **`awaiting_funding`** (+ `selected_worker_id`) instead of `in_progress`. Job → `in_progress` happens only when the webhook marks escrow `held`.
- [ ] Keep `payment_acknowledgments` table for now (don't drop) so nothing breaks mid-migration; mark deprecated. Remove in a later cleanup migration once escrow is verified.
- [ ] Decision: apply via `mcp__supabase__apply_migration` to project `omcakemsuifgfanvepbs`.

---

## 6. Phase 2 — Edge Functions  (replace `campay-*` with `fapshi-*`)

Shared helper module `_shared/fapshi.ts`: base URL, header builder per service, `normPhone` → 9-digit local, `detectMedium`.

- [ ] **`fapshi-fund-escrow`** (replaces `campay-initiate`)
  - Auth employer; verify job ownership + a worker is selected + job is `awaiting_funding`.
  - Compute `commission_amount`/`payout_amount` from `job.pay` and `GIGGLE_COMMISSION_RATE`.
  - Call collection service `POST /direct-pay` from employer phone, `externalId = job_id`.
  - Upsert `escrows` row → `pending_funding` with `collection_trans_id`.
  - Return `{ transId, status: 'pending_funding' }`.
- [ ] **`fapshi-release`** (NEW — the missing payout leg)
  - Auth employer (or admin); require escrow `held` + job `completed`.
  - Call payout service `POST /payout` to worker phone for `payout_amount`, `externalId = job_id`.
  - Set escrow `releasing` with `payout_trans_id`; return transId.
- [ ] **`fapshi-webhook`** (replaces `campay-webhook`)
  - Verify `x-wh-secret` header == `FAPSHI_WEBHOOK_SECRET` (reject otherwise).
  - Look up escrow by `collection_trans_id` OR `payout_trans_id` (use `transType` to disambiguate).
  - Collection SUCCESSFUL → escrow `held`, set `funded_at`, set job `in_progress`.
  - Payout SUCCESSFUL → escrow `released`, set `released_at`.
  - FAILED → escrow `failed` + `failure_reason`. Idempotent (ignore if already terminal).
- [ ] **`fapshi-check-status`** (replaces `campay-check-status`) — poll fallback when webhook is delayed; polls `/payment-status/{transId}` for the active leg and applies the same transitions.
- [ ] Update `src/api/campay.api.js` → `fapshi.api.js`: `fundEscrow()`, `releaseEscrow()`, `checkEscrowStatus()`.
- [ ] Update `src/api/payments.api.js` → read from `escrows`; expose `getEscrowForJob(jobId)`.

---

## 7. Phase 3 — UI screens (two adaptive, two-sided)

- [ ] **Employer escrow screen** — evolve `SubmitPayment.jsx` → `EscrowPayment.jsx`. Two phases driven by escrow/job state:
  - *Fund phase* (job `awaiting_funding`): "Secure payment to start the job" — employer phone input, commission breakdown (You pay X · GigGle fee Z · Worker receives Y), `direct-pay`, poll to `held`.
  - *Release phase* (job `completed`, escrow `held`): "Release X to {worker}" button → `payout`, poll to `released`.
  - Reuse existing PENDING/CONFIRMED/FAILED phase UI; change phone normalization to 9-digit.
- [ ] **Worker receipt screen** — evolve `ConfirmPayment.jsx`:
  - escrow `held`: "Payment secured 🔒 — {employer} has funded {payout_amount} XAF in escrow. You'll receive it when the job is completed." (replaces the misleading old "acknowledge" step).
  - escrow `released`: "You've been paid — {payout_amount} XAF sent to {worker_phone}. Fapshi ref {payout_trans_id}." → proceed to rating.
  - escrow `failed`: contact/dispute path.
- [ ] **`EmployerJobDetail.jsx`** step cards: relabel Step 1 from "Submit Payment Reference" to escrow-aware ("Fund escrow" at hire / "Release payment" at completion); gate rating on escrow `released`.
- [ ] **`ManageApplicants.jsx`**: after accepting an applicant, route to the fund-escrow screen (job is now `awaiting_funding`, not yet started).
- [ ] Worker payout number confirmation on the release receipt (prefill `profiles.phone`).

---

## 8. Phase 4 — Verify in sandbox (before live)

- [ ] `npm run build` clean (0 errors) after each phase.
- [ ] Full happy path with Fapshi sandbox test numbers: select worker → fund → held → in_progress → complete → release → released → both rate.
- [ ] Edge cases: failed collection (retry), failed payout (admin refund), page refresh mid-flow (state rehydrates from DB), webhook replay (idempotent), wrong `x-wh-secret` rejected.
- [ ] Confirm job never reaches `in_progress` without `held` escrow; worker never sees "paid" without a real `payout_trans_id`.

---

## 9. Go-live (later, separate task)

- [ ] Email Fapshi support to enable live `direct-pay` and live `payout`.
- [ ] Swap Edge secrets to live credentials + `FAPSHI_BASE_URL=https://live.fapshi.com`.
- [ ] Drop deprecated `payment_acknowledgments` in a cleanup migration.

---

## Review

**Implemented (build passing, 0 errors):**
- **Schema** — `005_escrow.sql` applied to remote as `005_escrow_enums` + `006_escrow_table`: `escrow_status` enum, `awaiting_funding` job state, `escrows` table + RLS (parties read-only; service-role writes), and the accept-application trigger now sets `awaiting_funding` instead of `in_progress`.
- **Edge Functions** (`supabase/functions/`): `_shared/fapshi.ts` (two-service auth, 9-digit phone norm, direct-pay/payout/status helpers), `fapshi-fund-escrow`, `fapshi-release`, `fapshi-webhook` (x-wh-secret verified, leg-aware + idempotent), `fapshi-check-status`. Old `campay-*` functions deleted.
- **API layer**: new `src/api/fapshi.api.js` (`fundEscrow`/`releaseEscrow`/`checkEscrowStatus`); `payments.api.js` now reads `escrows` (`getEscrowForJob`, `ESCROW_STATUS`, `PROVIDER_LABEL`); `campay.api.js` deleted; `queryKeys.payments` → `queryKeys.escrows`.
- **UI**: employer screen (`SubmitPayment.jsx`) is now a two-phase escrow screen (fund → release); worker screen (`ConfirmPayment.jsx`) shows secured → on-the-way → paid; `EmployerJobDetail` (awaiting_funding block, escrow-aware Step 1 release + Step 2 gating + secured note), `ManageApplicants` (accept routes to funding, `awaiting_funding` treated as selected), `EmployerChat`/`WorkerChat` banners, `RateWorker`/`RateEmployer` gating, `WorkerNotifications` + `useNotificationCount`. No "CamPay" strings remain anywhere in `src/`.

**Remaining (blocked on you):**
1. **Deploy the 4 Edge Functions** — the Supabase MCP disconnected and the CLI isn't logged in (401). Run:
   ```
   supabase login
   supabase functions deploy fapshi-fund-escrow  --project-ref omcakemsuifgfanvepbs
   supabase functions deploy fapshi-release       --project-ref omcakemsuifgfanvepbs
   supabase functions deploy fapshi-check-status  --project-ref omcakemsuifgfanvepbs
   supabase functions deploy fapshi-webhook       --project-ref omcakemsuifgfanvepbs --no-verify-jwt
   ```
   `--no-verify-jwt` on the webhook only — Fapshi has no Supabase JWT; it's secured by `x-wh-secret`. The other three keep JWT verification (called from the app with the user session).
2. **Sandbox happy-path test** (after deploy): select worker → fund → held → in_progress → complete → release → released → both rate. Sandbox mobile-money outcomes are random, so retry to land a SUCCESSFUL; use the `fapshi`-medium test emails for deterministic pass/fail if needed.
