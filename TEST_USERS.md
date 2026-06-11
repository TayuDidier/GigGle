# GigGle — Test User Credentials

All accounts are on the live Supabase project (`omcakemsuifgfanvepbs`).
Email confirmation is **auto-enabled** — sign in immediately, no email needed.

---

## Employer Account

| Field        | Value                        |
|--------------|------------------------------|
| **Email**    | employer.test@gigle.cm       |
| **Password** | GigGle2026!                  |
| **Role**     | employer                     |
| **Name**     | Marie Nkomo                  |
| **Company**  | Nkomo Enterprises            |
| **City**     | Douala                       |
| **Phone**    | +237677001001                |

**Current state:**
- Onboarding completed ✓
- 1 job: "House cleaner needed for 3-bedroom apartment in Bonanjo" — 18,000 XAF — **In Progress**
- Job ID: `74846cf3-30eb-4f67-96ae-c6adcac7c826`
- Paul Tabi selected as worker
- 2 messages sent in chat

---

## Worker Account

| Field        | Value                |
|--------------|----------------------|
| **Email**    | worker.test@gigle.cm |
| **Password** | GigGle2026!          |
| **Role**     | worker               |
| **Name**     | Paul Tabi            |
| **City**     | Douala               |
| **Phone**    | +237655002002        |
| **Skills**   | Cleaning             |

**Current state:**
- Onboarding completed ✓
- Applied for Marie's cleaning job — **Accepted**
- 1 reply sent in chat (3 messages total in thread)

---

## Sign-in URL

```
http://localhost:5173/login        ← local dev
```

---

## What's ready to test next

| Flow | How |
|------|-----|
| Complete the job | Employer → Job Detail → mark as Completed |
| Submit payment | Employer Chat → Enter Payment Details → submit MTN MoMo ref |
| Confirm payment | Worker Chat → Confirm Receipt |
| Rate each other | Both sides → Rating form appears in chat after payment confirmed |
| Worker history | Worker → History → completed job should appear |

---

## Reset a test account
Go to [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/omcakemsuifgfanvepbs/auth/users) to delete and recreate any account.
