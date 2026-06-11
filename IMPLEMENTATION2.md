# GigGle — Implementation Summary

**Stack:** React 18 + Vite + Tailwind CSS + ShadCN/UI + Supabase + PostGIS + Leaflet.js  
**Currency:** XAF · **Roles:** Worker, Employer, Admin · **Region:** Douala, Yaounde, Bafoussam, Bamenda, Buea

---

## System Architecture (3-Tier)

```
+------------------------------------------------------------------+
|  PRESENTATION LAYER                                              |
|  React 18 SPA · Tailwind CSS · ShadCN/UI · Leaflet.js           |
|  Deployed: Vercel CDN                                            |
+------------------------------------------------------------------+
|  APPLICATION LOGIC LAYER                                         |
|  Supabase Auth (JWT) · PostgREST (auto REST API)                 |
|  Supabase Realtime (WebSocket per job_id) · Supabase Storage     |
|  PostGIS RPC → ST_DWithin radius queries                         |
+------------------------------------------------------------------+
|  DATA LAYER                                                      |
|  PostgreSQL 15 + PostGIS · Row Level Security (RLS)              |
|  7 tables + triggers + spatial indexes · Supabase managed cloud  |
+------------------------------------------------------------------+
```

**Data Flow:** Browser → Supabase Auth (JWT) → PostgREST CRUD (RLS enforced) → PostGIS RPC (radius) → Realtime WS (messages) → Storage (avatars)

---

## Database (7 Tables)

| Table | Key Fields |
|---|---|
| `profiles` | user_id, role[worker/employer/admin], full_name, location(PostGIS), rating_average, is_suspended |
| `jobs` | employer_id, title, category, pay(XAF), location(PostGIS), status[open/in_progress/completed/cancelled] |
| `applications` | job_id, worker_id, status[pending/accepted/rejected], cover_note |
| `messages` | job_id, sender_id, content (realtime channel per job) |
| `ratings` | job_id, rater_id, rated_id, score(1-5), review_text |
| `payment_acknowledgments` | job_id, reference_code, provider[mtn_momo/orange_money], status[submitted/confirmed] |
| `reports` | reporter_id, reported_id, reason, status[open/resolved/dismissed] |

**Key triggers:** auto-create profile on register · auto-reject other applicants when one accepted · recalculate rating_average on new rating

---

## 7 Core Modules

1. **Auth & Roles** — Supabase Auth + JWT; role stored in profiles; ProtectedRoute guards per role; auto-redirect on mismatch
2. **Job Browse** — Browser GPS → PostGIS `ST_DWithin` RPC → radius + category filters → Leaflet map + card list
3. **Applications** — Worker applies (unique per job) → Employer selects one → DB trigger auto-rejects others + sets job `in_progress`
4. **Real-Time Chat** — Supabase Realtime channel `job:{id}`; messages persist in DB; unlocked only after worker selected; RLS blocks non-participants
5. **Ratings** — Post-completion only; 1–5 stars + optional text; DB trigger recalculates profile average instantly
6. **Payments (MVP)** — Employer pays via MTN MoMo/Orange Money externally → submits reference code in app → worker confirms receipt → unlocks ratings
7. **Admin Dashboard** — Analytics KPIs, user suspend/reinstate, content moderation, dispute queue

---

## Routes (Role-Protected)

### Public
| Path | Page | Purpose |
|---|---|---|
| `/` | Landing | Value proposition + CTA to register |
| `/login` | Login | Email + password sign in |
| `/register` | Register | Sign up with role selection (Worker / Employer) |
| `/auth/forgot-password` | Forgot Password | Trigger Supabase password reset email |
| `/auth/reset-password` | Reset Password | Handles reset link redirect; new password form |
| `/auth/confirm` | Email Confirm | Handles Supabase email verification redirect; shows success/error |

### Worker (role = worker)
| Path | Page | Purpose |
|---|---|---|
| `/worker/dashboard` | Dashboard | Activity overview — active job, recent applications, rating |
| `/worker/onboarding` | Onboarding | **First-login only** — set location, bio, skills before browsing unlocks |
| `/worker/browse` | Browse Jobs | Map + list with radius & category filters |
| `/worker/jobs/:id` | Job Detail | Full job view + Apply button |
| `/worker/applications` | My Applications | All applications with status (pending / accepted / rejected) |
| `/worker/history` | Job History | Completed gigs, total earnings summary, past ratings received |
| `/worker/jobs/:id/chat` | Active Job Chat | Real-time chat + job status + payment confirmation |
| `/worker/profile` | Edit Profile | Edit own name, bio, phone, location, avatar |
| `/worker/notifications` | Notifications | Selected for job, new message, payment submitted alerts |
| `/worker/settings` | Settings | Change password, delete account |

### Employer (role = employer)
| Path | Page | Purpose |
|---|---|---|
| `/employer/dashboard` | Dashboard | All posted jobs overview with status badges |
| `/employer/onboarding` | Onboarding | **First-login only** — set location, company/name, contact |
| `/employer/post-job` | Post Job | Create new job listing with map location picker |
| `/employer/jobs/:id` | Job Detail | View own job posting — description, status, payment info |
| `/employer/jobs/:id/edit` | Edit Job | Edit job before a worker is selected |
| `/employer/jobs/:id/applicants` | Manage Applicants | Review applicant profiles, select worker |
| `/employer/jobs/:id/chat` | Active Job Chat | Real-time chat + mark complete + submit payment reference |
| `/employer/profile` | Edit Profile | Edit own name, bio, phone, location, avatar |
| `/employer/notifications` | Notifications | New applicant, message received, worker confirmed payment alerts |
| `/employer/settings` | Settings | Change password, delete account |

### Shared (authenticated, any role)
| Path | Page | Purpose |
|---|---|---|
| `/profile/:id` | Public Profile | View any user's public profile — name, rating, reviews, job history |
| `/report/:targetId` | File Report | Submit a dispute/report against a user or job listing |
| `/404` | Not Found | Invalid routes and deleted job/profile links |

### Admin (role = admin)
| Path | Page | Purpose |
|---|---|---|
| `/admin/dashboard` | Dashboard | KPI cards — total users, jobs, completed gigs, open reports |
| `/admin/users` | Users | Full user table with suspend / reinstate controls |
| `/admin/jobs` | Jobs | All job listings with moderation controls |
| `/admin/reports` | Reports | Dispute queue — open, resolved, dismissed |

---

## Sprint Plan

| Sprint | Duration | Goal | Key Deliverables |
|---|---|---|---|
| **0 Setup** | 3 days | Scaffold | Supabase project, Vite app, all deps installed, folder structure, GitHub + Vercel linked |
| **1 Auth & Profiles** | 2 weeks | Login/Register | Auth flow, forgot/reset password, email confirm handler, onboarding wizard, profile edit, avatar upload, protected routes |
| **2 Job Loop** | 3 weeks | Browse & Apply | Job post form with map, PostGIS radius browse, apply button, applicant selection |
| **3 Messaging, Ratings & Payments** | 2 weeks | Trust Layer | Realtime chat, job completion flow, star ratings, payment reference submission, notifications, job history, report filing |
| **4 Admin, Settings & Deploy** | 2 weeks | Ship it | Admin console, settings page, public profile page, 404 page, full test pass, Vercel prod deploy, CI/CD |

---

## Key Tech Decisions

| Choice | Why |
|---|---|
| Supabase over custom backend | Zero server ops; auth + realtime + storage built in; free tier covers MVP |
| PostGIS RPC over app-layer filtering | Native spatial index; sub-100ms on millions of rows |
| Reference-code payments (MVP) | MTN MoMo/Orange Money business APIs need registration; ref codes work day one |
| TanStack Query | Automatic caching + background refetch; critical for 3G performance |
| React Hook Form + Zod | Uncontrolled inputs (fast on low-end phones) + type-safe runtime validation |
