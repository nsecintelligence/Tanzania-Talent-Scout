# Security & Threat Model — Tanzania Talent Scout

_This document supports the final-year project report. It maps every
security control implemented in the codebase to a recognised standard
(OWASP Top 10 2021, OWASP ASVS 4.0.3, NIST SP 800-63B)._

## 1. System overview

Tanzania Talent Scout (TTS) is a SaaS platform that connects six roles —
`admin`, `coach`, `player`, `scout`, `club`, `agent` — around football
talent discovery. The stack is:

- **Client**: React 19 + TanStack Start on Cloudflare Workers (SSR)
- **Data**: Supabase Postgres with Row-Level Security
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Storage**: Supabase Storage, private `media` bucket, signed URLs

## 2. Assets

| Asset | Sensitivity | Where |
|---|---|---|
| User credentials | Critical | Supabase Auth (bcrypt + Argon2) |
| Session tokens | Critical | Browser `localStorage`, JWT-signed |
| Player PII (name, DOB, contact) | High | `players`, `profiles` tables |
| Uploaded videos | Medium | `media` bucket (signed URL, 6h TTL) |
| Scout observations | Medium | `player_progress_entries` (RLS: owner-only) |
| Direct messages | Medium | `messages` table (RLS: participant-only) |
| Audit log | Critical (integrity) | `audit_logs` (append-only, hash-chained) |

## 3. STRIDE threat model

| Threat | Vector | Mitigation |
|---|---|---|
| **S**poofing user | Credential stuffing | Login-attempt logging + 5-in-15-min lockout, HIBP breach check, OAuth |
| **S**poofing role | Client-side role tampering | Roles in separate `user_roles` table; `has_role()` SECURITY DEFINER; all RLS uses server-side check |
| **T**ampering with data | Direct DB writes bypassing RLS | RLS enabled on every user-facing table; service-role key never leaves server |
| **T**ampering with audit | Insider edits logs | `audit_logs` has no INSERT/UPDATE/DELETE policy; inserts only via `append_audit_log` RPC; SHA-256 hash chain verifiable with `verify_audit_chain()` |
| **R**epudiation | User denies action | All auth events, role changes, deletions, reports written to hash-chained audit log |
| **I**nformation disclosure | XSS / IDOR / broken RLS | CSP with nonce-free strict src list; no `dangerouslySetInnerHTML` on user content; RLS scoped to `auth.uid()`; signed URLs; owner-only progress entries |
| **I**nformation disclosure — PII in logs | Plaintext emails in DB | `login_attempts` stores only SHA-256(email); IP hashed too |
| **D**enial of service | Brute force, spam | Rate-limited sign-in, rate-limited messaging (planned), input length caps |
| **E**levation of privilege | Client sets `role=admin` | Roles decoupled; `handle_new_user()` restricts trigger metadata; admin routes gated by `has_role` + client redirect |

## 4. OWASP Top 10 (2021) mapping

| ID | Risk | Control in TTS |
|---|---|---|
| A01 Broken Access Control | RLS everywhere, `has_role()`, `_authenticated` route gate, admin gate on `/security` |
| A02 Cryptographic Failures | HTTPS forced (HSTS), Supabase encrypts at rest, passwords Argon2, audit log SHA-256 chain |
| A03 Injection | Parameterised Supabase client (no raw SQL from client), Zod validation on all inputs |
| A04 Insecure Design | Threat model documented (this file), least-privilege roles |
| A05 Security Misconfiguration | Security headers set in `src/server.ts` (CSP, HSTS, XCTO, Referrer, Permissions-Policy, X-Frame-Options) |
| A06 Vulnerable Components | `bun audit` in dependencies, TanStack Start & React 19 (latest majors) |
| A07 Identification & Auth Failures | HIBP check on signup, password strength meter, lockout after 5 failed attempts / 15 min, OAuth |
| A08 Software & Data Integrity | Hash-chained audit log; SRI where third-party JS is used |
| A09 Security Logging & Monitoring | `audit_logs`, `login_attempts`, admin `/security` dashboard, inactivity cron |
| A10 SSRF | No user-controlled server-side fetches; HIBP URL prefix is derived client-side |

## 5. OWASP ASVS 4.0.3 — Level 2 checklist (excerpt)

| Control | Status |
|---|---|
| V2.1.1 Passwords ≥ 8 chars | Enforced by Zod (`passwordSchema`) |
| V2.1.7 Breach-check on set | HIBP k-anonymity call in `isPasswordPwned()` |
| V2.2.1 Anti-automation | 5-failure-per-15-min lockout via `recent_failed_logins` RPC |
| V3.4.1 Cookie hardening | Supabase JWT in `localStorage`; no cookie attack surface |
| V4.1.1 Access control enforced server-side | Postgres RLS |
| V5.1.3 Input validation | Zod schemas (`signUpSchema`, `signInSchema`, `reportSchema`) |
| V7.1.1 Logging of security events | `audit_logs` append-only |
| V8.3.4 Data retention | Inactivity cron deletes accounts after ~60 days |
| V10.2.1 Security headers | CSP, HSTS, X-Frame-Options, Referrer-Policy set globally |
| V13.2.1 API auth | `requireSupabaseAuth` middleware |
| V14.4.1 Sensitive data not in URLs | Session in JWT, never in query string |

## 6. Incident response

1. **Detect** — admin monitors `/security` dashboard daily. Failed-login spike triggers review.
2. **Verify integrity** — run `verify_audit_chain()` RPC. Non-empty result = tampering.
3. **Contain** — rotate Supabase service role key; force-invalidate all sessions via Supabase Auth.
4. **Eradicate** — patch, revoke compromised keys, disable affected accounts.
5. **Recover** — restore from PITR (Supabase point-in-time recovery).
6. **Learn** — write post-mortem, add regression test / rule.

## 7. Cryptography inventory

| Purpose | Algorithm | Where |
|---|---|---|
| Password storage | Argon2id (Supabase Auth) | Managed |
| Session tokens | HS256 JWT | Supabase Auth |
| Transport | TLS 1.3 | Cloudflare edge |
| Audit chain | SHA-256 | `append_audit_log` PL/pgSQL |
| Pseudonymisation | SHA-256 (email, IP) | `login_attempts` |
| HIBP breach check | SHA-1 k-anonymity (5-char prefix) | client only |

## 8. Data classification & retention

| Class | Examples | Retention |
|---|---|---|
| Auth events | login_attempts | 90 days |
| Audit events | audit_logs | indefinite (integrity chain) |
| User profile | profiles | until self-delete or 60d inactivity |
| Uploaded media | videos in `media` bucket | until owner deletes |
| Reports | content_reports | 12 months post-resolution |

## 9. Known residual risks / accepted

- Content-Security-Policy uses `'unsafe-inline'` for script/style because
  TanStack Start injects hydration scripts inline. Mitigate later with a
  nonce.
- Video signed URLs are 6h TTL — shorter TTL reduces convenience.
- Account self-delete anonymises the row but does not remove `auth.users`
  (requires service-role call); an admin cron finalises this.
