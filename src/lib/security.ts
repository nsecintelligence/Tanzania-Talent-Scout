// Client-side security helpers: hashing, HIBP, Zod schemas, audit logging.
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ---- Hashing ------------------------------------------------------------
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashEmail(email: string): Promise<string> {
  return sha256Hex(email.trim().toLowerCase());
}

// ---- HIBP (k-anonymity) --------------------------------------------------
// Sends only the first 5 chars of the SHA-1 to HIBP. The rest never leaves
// the browser. https://haveibeenpwned.com/API/v3#PwnedPasswords
export async function isPasswordPwned(password: string): Promise<number> {
  try {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-1", bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return 0;
    const text = await res.text();
    for (const line of text.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix) return parseInt(count, 10) || 0;
    }
    return 0;
  } catch {
    return 0; // fail-open: don't block signup if HIBP unreachable
  }
}

// ---- Zod schemas ---------------------------------------------------------
export const emailSchema = z
  .string()
  .trim()
  .min(3, "Email is too short")
  .max(254, "Email is too long")
  .email("Enter a valid email");

// NIST 800-63B: min 8, allow all printable; reject only very-weak / breached.
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "Password too long");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name required")
  .max(80, "Name too long")
  .regex(/^[\p{L}\p{M} .'-]+$/u, "Letters, spaces, apostrophes and hyphens only");

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required").max(128),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(3, "Say why").max(100),
  details: z.string().trim().max(1000).optional(),
  target_type: z.enum(["player", "video", "message", "user"]),
  target_id: z.string().trim().min(1).max(100),
});

// zxcvbn-lite password strength (score 0..4)
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"] as const;
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: labels[s] };
}

// ---- Login-attempt & audit logging --------------------------------------
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  reason?: string,
) {
  const email_hash = await hashEmail(email);
  await supabase.from("login_attempts").insert({
    email_hash,
    success,
    reason: reason ?? null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
  });
  return email_hash;
}

export async function recentFailedLogins(email: string, windowMinutes = 15): Promise<number> {
  const email_hash = await hashEmail(email);
  const { data } = await supabase.rpc("recent_failed_logins", {
    _email_hash: email_hash,
    _window_minutes: windowMinutes,
  });
  return (data as number | null) ?? 0;
}

export async function auditLog(
  action: string,
  target_type?: string,
  target_id?: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.rpc("append_audit_log", {
    _action: action,
    _target_type: target_type ?? null,
    _target_id: target_id ?? null,
    _metadata: metadata as never,
  });
}

// Rate-limit config
export const RATE_LIMIT = {
  maxFailuresBeforeLockout: 5,
  windowMinutes: 15,
} as const;
