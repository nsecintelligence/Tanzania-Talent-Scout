import { useEffect, useState } from "react";
import type { Role } from "./mock-data";

const KEY = "tts_auth";

export type Session = { name: string; email: string; role: Role } | null;

function read(): Session {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function signIn(s: NonNullable<Session>) {
  localStorage.setItem(KEY, JSON.stringify(s));
  emit();
}
export function signOut() {
  localStorage.removeItem(KEY);
  emit();
}

export function useSession(): Session {
  const [s, setS] = useState<Session>(null);
  useEffect(() => {
    setS(read());
    const l = () => setS(read());
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return s;
}
