import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Role } from "./mock-data";

export type Session = {
  user: User;
  name: string;
  email: string;
  role: Role;
} | null;

const listeners = new Set<(s: Session) => void>();
let current: Session = null;
let initialized = false;

async function load(user: User | null): Promise<Session> {
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const role = (roles?.[0]?.role as Role) ?? "player";
  const name =
    profile?.display_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Member";
  return { user, name, email: user.email ?? "", role };
}

let ready = false;
const readyListeners = new Set<(r: boolean) => void>();

function emit(s: Session) {
  current = s;
  listeners.forEach((l) => l(s));
  if (!ready) {
    ready = true;
    readyListeners.forEach((l) => l(true));
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth.getSession().then(async ({ data }) => {
    emit(await load(data.session?.user ?? null));
    if (data.session?.user) supabase.rpc("touch_activity").then(() => {});
  });
  supabase.auth.onAuthStateChange(async (_event, sess) => {
    emit(await load(sess?.user ?? null));
    if (sess?.user) supabase.rpc("touch_activity").then(() => {});
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  emit(null);
}

export function useSession(): Session {
  const [s, setS] = useState<Session>(current);
  useEffect(() => {
    init();
    setS(current);
    const l = (v: Session) => setS(v);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return s;
}

/** True once the initial session lookup has completed (client-side only). */
export function useAuthReady(): boolean {
  const [r, setR] = useState(ready);
  useEffect(() => {
    init();
    setR(ready);
    const l = (v: boolean) => setR(v);
    readyListeners.add(l);
    return () => { readyListeners.delete(l); };
  }, []);
  return r;
}

