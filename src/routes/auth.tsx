import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ROLES, type Role } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Mail, Trophy, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  signUpSchema, signInSchema, isPasswordPwned, passwordStrength,
  recordLoginAttempt, recentFailedLogins, auditLog, RATE_LIMIT,
} from "@/lib/security";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Tanzania Talent Scout" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [role, setRole] = useState<Role>("player");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureRole(userId: string) {
    await supabase.from("user_roles").insert({ user_id: userId, role }).select();
  }

  async function emailSubmit() {
    if (!email || !password) return toast.error("Enter email and password");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0], role },
          },
        });
        if (error) throw error;
        if (data.user) {
          // trigger creates profile + role from metadata; ensure role row exists for OAuth path too
          await ensureRole(data.user.id).catch(() => {});
        }
        toast.success("Account created — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // tokens received — assign role if first time
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: existing } = await supabase
          .from("user_roles").select("id").eq("user_id", data.user.id).limit(1);
        if (!existing?.length) await ensureRole(data.user.id);
      }
      toast.success("Signed in with Google");
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
        <div className="hidden md:flex md:flex-col md:justify-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold">Welcome to TTS</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Join Tanzania's home for football talent. Pick your role to get started — your dashboard will be tailored for you.
          </p>
          <div className="mt-8 grid gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  role === r.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="font-semibold">{r.label}</div>
                <div className="text-sm text-muted-foreground">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <div className="mb-6 flex gap-2">
            <Button variant={mode === "signup" ? "default" : "outline"} size="sm" onClick={() => setMode("signup")}>Create account</Button>
            <Button variant={mode === "signin" ? "default" : "outline"} size="sm" onClick={() => setMode("signin")}>Sign in</Button>
          </div>

          <div className="md:hidden mb-6">
            <Label className="mb-2 block">I am a</Label>
            <select
              className="w-full rounded-md border border-border bg-input p-2"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email"><Mail className="mr-1 h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hassan Mwita" className="mt-1.5" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-1.5" />
              </div>
              <Button className="w-full" disabled={loading} onClick={emailSubmit}>
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="google" className="mt-6">
              <Button variant="outline" className="w-full" disabled={loading} onClick={google}>
                Continue with Google
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                A profile will be created using your Google account info.
              </p>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
