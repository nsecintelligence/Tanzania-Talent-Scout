import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ROLES, type Role } from "@/lib/mock-data";
import { signIn } from "@/lib/auth-store";
import { Mail, Phone, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Tanzania Talent Scout" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("player");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(method: string) {
    signIn({ name: name || "Demo User", email: email || "demo@tts.tz", role });
    toast.success(`Signed in via ${method}`);
    nav({ to: "/dashboard" });
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
          <div className="md:hidden mb-6">
            <h1 className="font-display text-2xl font-bold">Sign in</h1>
            <Label className="mt-4 mb-2 block">I am a</Label>
            <select
              className="w-full rounded-md border border-border bg-input p-2"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email"><Mail className="mr-1 h-4 w-4" />Email</TabsTrigger>
              <TabsTrigger value="phone"><Phone className="mr-1 h-4 w-4" />Phone</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hassan Mwita" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" placeholder="••••••••" className="mt-1.5" />
              </div>
              <Button className="w-full" onClick={() => submit("Email")}>Continue with Email</Button>
            </TabsContent>

            <TabsContent value="phone" className="mt-6 space-y-4">
              <div>
                <Label htmlFor="ph">Phone number</Label>
                <Input id="ph" placeholder="+255 7XX XXX XXX" className="mt-1.5" />
              </div>
              <Button className="w-full" onClick={() => submit("Phone")}>Send OTP</Button>
            </TabsContent>

            <TabsContent value="google" className="mt-6">
              <Button variant="outline" className="w-full" onClick={() => submit("Google")}>
                Continue with Google
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Demo only — no real Google account required.
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
