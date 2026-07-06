# GigGle — Live Test Accounts

These are the **active accounts used for all testing from here onward** (on the live
Supabase project `omcakemsuifgfanvepbs`). Email confirmation is auto-enabled — sign in
immediately, no email step needed.

---

## Accounts

### 👔 Employer
| Field | Value |
| --- | --- |
| **Email** | tayudidier01@gmail.com |
| **Password** | 12345678 |
| **Role** | employer |
| **Name** | Didier |
| **City** | Buea |
| **Profile ID** | `5fe4c45c-d163-4ae4-9c65-089e2fd18ee1` |
| **Verification** | approved ✓ |

### 🧰 Worker
| Field | Value |
| --- | --- |
| **Email** | tayudidier03@gmail.com |
| **Password** | 123456 |
| **Role** | worker |
| **Name** | New User |
| **City** | Buea |
| **Profile ID** | `6ca824da-e09b-4b7f-9865-699b81b408dd` |
| **Verification** | approved ✓ |

### 🛡️ Admin
| Field | Value |
| --- | --- |
| **Email** | tayudidier3@gmail.com |
| **Password** | 123456 |
| **Role** | admin |
| **Name** | Admin |
| **Profile ID** | `f568e9f3-baf8-4d03-a9c5-7bfcb976789b` |

> Note: `jobs.employer_id` references `profiles.id` (not the auth user id). The employer's
> profile id above is what owns all seeded jobs.

---

## Seeded jobs (10, posted by the Employer)

All are `status = 'open'` and appear in Browse Jobs. The worker is based in **Buea**, so
Buea jobs show at the default 10 km radius; widen to 25 km to reach Limbe, or switch the
city selector to Douala.

| City | Count | Categories |
| --- | --- | --- |
| **Buea** | 4 | cleaning, tutoring, delivery, gardening |
| **Douala** | 3 | repairs, moving, cooking |
| **Limbe** | 3 | event_labor, caregiving, digital_services |

Distances from Buea: Buea ~0 km · Limbe ~15 km · Douala ~60 km.

---

## Sign-in URL

```
http://localhost:5173/login        ← local dev
https://giggle-jobs.vercel.app/login   ← production
```

---

## Reset / manage accounts

[Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/omcakemsuifgfanvepbs/auth/users)
