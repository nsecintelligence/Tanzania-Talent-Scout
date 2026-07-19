# Cybersecurity Features for Tanzania Talent Scout

A curated set of features that map to real cybersecurity domains (AuthN/AuthZ, cryptography, monitoring, incident response, secure SDLC). Each item lists what to build and which skill it demonstrates so you can defend it in your viva.

## 1. Strong Authentication & Account Protection
- **MFA (TOTP)**: Enrol with QR code, verify 6-digit codes on login. *Skill: MFA, RFC 6238.*
- **Leaked-password check (HIBP k-anonymity)**: Block passwords found in breaches during signup/reset. *Skill: k-anonymity, secure password policy.*
- **Password strength meter + zxcvbn scoring** with server-side re-check. *Skill: entropy, defense-in-depth.*
- **Brute-force / credential stuffing protection**: Per-IP + per-account rate limits, exponential backoff, CAPTCHA after N failures. *Skill: rate limiting, abuse prevention.*
- **Device / session management page**: List active sessions, revoke individually, force-logout everywhere. *Skill: session hygiene.*

## 2. Authorization & Access Control
- **RBAC audit**: Document the 6 roles, prove every table has RLS + policies, add automated tests that a `player` cannot read another player's private fields. *Skill: least privilege, RLS.*
- **Object-level authorization tests** (IDOR): Attempt `/players/:id` mutations as wrong role and assert 403. *Skill: OWASP A01.*
- **Signed-URL scope check** for videos (already partly there): short TTL, per-user audit log on issuance. *Skill: capability-based access.*

## 3. Input Validation & Injection Defense
- **Zod schemas everywhere** (client + server) with strict lengths, allowed charsets. *Skill: input validation.*
- **DOMPurify** on any rendered user text (messages, bios). *Skill: XSS prevention.*
- **File upload hardening**: MIME sniffing (magic bytes), extension allowlist, max size, re-encode filenames, scan with ClamAV-style hash blocklist. *Skill: unrestricted file upload (OWASP).*

## 4. Cryptography
- **End-to-end-ish encryption for direct messages**: AES-GCM in the browser with per-conversation key wrapped by user public keys (WebCrypto). *Skill: hybrid crypto, key management.*
- **Field-level encryption** for sensitive PII (phone, DOB) using pgsodium or app-layer AES-GCM with a KMS-held key. *Skill: encryption at rest beyond disk.*
- **Signed webhook verification** (HMAC-SHA256, timing-safe compare) on the inactivity-check endpoint. *Skill: webhook security.*

## 5. Security Headers & Transport
- Add CSP (nonce-based), HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/COEP via the root response. *Skill: browser security model.*
- **SRI** on any third-party script. *Skill: supply-chain integrity.*

## 6. Monitoring, Logging & Incident Response
- **Audit log table** (append-only, hash-chained rows so tampering is detectable) for auth events, role changes, deletions, admin actions. *Skill: tamper-evident logging.*
- **Admin security dashboard**: failed logins, new-device logins, flagged accounts, geo-IP anomalies. *Skill: SOC-style monitoring.*
- **Anomaly alerts**: notify user on new-country login, mass-download of videos, sudden role change.

## 7. Privacy & Compliance
- **GDPR-style Data Subject Requests**: export my data (JSON) + delete my account (already partial via inactivity — add self-service).
- **Consent + cookie banner** with granular categories.
- **Data retention policy page** and automated purge jobs.

## 8. Abuse & Content Safety
- **Report user / content** flow feeding a moderation queue with admin actions and an immutable audit trail.
- **Rate-limited messaging** to stop spam.

## 9. Secure SDLC Artifacts (great for the report)
- **Threat model** (STRIDE) diagram for the app.
- **OWASP ASVS L2 checklist** with pass/fail per control.
- **Dependency scanning** (bun audit / Snyk) run in CI, screenshots in appendix.
- **SAST** with Semgrep rules; **DAST** with OWASP ZAP baseline scan against the preview URL.
- **Pen-test chapter**: perform Burp Suite tests for the OWASP Top 10 on your own app and document findings + fixes.

## 10. Bonus Wow-Factors
- **Passkeys (WebAuthn)** as a passwordless option — very current and demo-friendly.
- **Anti-CSRF verification** on state-changing server functions with double-submit token.
- **Honeypot admin route** that logs and bans anyone hitting it.
- **Verifiable player identity**: sign player profile snapshots with an Ed25519 key so scouts can verify authenticity.

---

## Suggested scope for a strong final-year submission
Pick ~6 that give breadth across domains:
1. MFA (TOTP) + Passkeys
2. Session management page
3. Rate limiting + brute-force protection
4. Encrypted DMs (WebCrypto)
5. Tamper-evident audit log + admin security dashboard
6. Full security headers + CSP
7. Threat model + ASVS checklist + ZAP/Semgrep reports in the written report

## What I need from you before planning code
1. **Which of the 10 groups do you want to actually build?** (pick any subset)
2. **Any hard constraints from your supervisor** (specific standard like ISO 27001 / NIST / OWASP ASVS, or required tools)?
3. **Do you want the written-report artifacts** (threat model, ASVS checklist, ZAP report) scaffolded as markdown in the repo too?

Reply with your picks and I'll turn them into an implementation plan.
