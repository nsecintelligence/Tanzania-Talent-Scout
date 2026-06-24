import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { useSession } from "@/lib/auth-store";
import { fetchPlayers, fetchVideos } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Video, Eye, MessageSquare, Bell, TrendingUp, Search, Send,
  Trophy, Plus, ShieldCheck, Brain, Star,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tanzania Talent Scout" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, trend }: { icon: React.ComponentType<{className?:string}>; label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        {trend && <span className="text-xs font-medium text-primary">{trend}</span>}
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const session = useSession();
  const nav = useNavigate();
  useEffect(() => {
    if (session === null) {
      const t = setTimeout(() => {
        // give auth-store a beat to hydrate, then redirect if still empty
        if (!sessionStorageHasUser()) nav({ to: "/auth" });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [session, nav]);

  if (!session) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to view your dashboard</h1>
          <Button className="mt-6" asChild><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary">{session.role} dashboard</div>
            <h1 className="font-display text-4xl font-bold">Karibu, {session.name.split(" ")[0]} 👋</h1>
            <div className="mt-1 text-xs text-muted-foreground">User ID: <code className="rounded bg-secondary px-1.5 py-0.5">{session.user.id}</code></div>
          </div>
          <Badge className="bg-primary/15 text-primary border border-primary/30">
            <ShieldCheck className="mr-1 h-3 w-3" /> Account active
          </Badge>
        </div>

        {session.role === "player" && <PlayerDash />}
        {session.role === "coach" && <CoachDash />}
        {session.role === "scout" && <ScoutDash />}
        {session.role === "club" && <ClubDash />}
        {session.role === "agent" && <ScoutDash />}
        {session.role === "admin" && <AdminDash />}
      </div>
      <SiteFooter />
    </div>
  );
}

function sessionStorageHasUser() {
  if (typeof window === "undefined") return false;
  // supabase persists session under sb-<ref>-auth-token
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
  }
  return false;
}

function PlayerDash() {
  const stats = { pace: 84, shooting: 78, passing: 81, dribbling: 85, defense: 52, physical: 74 };
  const { data: videos = [] } = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Star} label="AI rating" value="84" trend="+2" />
        <Stat icon={Eye} label="Profile views" value="1,420" trend="+18%" />
        <Stat icon={TrendingUp} label="National rank" value="#42" trend="↑ 6" />
        <Stat icon={MessageSquare} label="Scout inquiries" value="7" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Your performance" action={<Button size="sm" variant="ghost"><Brain className="mr-1 h-4 w-4" />AI report</Button>}>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(stats).map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                  <Progress value={v} className="h-2" />
                </div>
              ))}
            </div>
          </Section>
        </div>
        <Section title="Notifications" action={<Bell className="h-4 w-4 text-muted-foreground" />}>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between gap-3 border-b border-border/40 pb-2">
              <span>Welcome to Tanzania Talent Scout!</span><span className="text-xs text-muted-foreground">now</span>
            </li>
            <li className="flex justify-between gap-3 border-b border-border/40 pb-2">
              <span>Complete your profile to be discovered.</span><span className="text-xs text-muted-foreground">1m</span>
            </li>
          </ul>
        </Section>
      </div>

      <Section title="Recent videos" action={<Button size="sm" asChild><Link to="/videos"><Plus className="mr-1 h-4 w-4" />Upload</Link></Button>}>
        {videos.length === 0 ? (
          <div className="text-sm text-muted-foreground">No videos uploaded yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {videos.slice(0, 3).map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border border-border/60">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10 grid place-items-center text-primary">▶</div>
                <div className="p-3"><div className="text-sm font-semibold">{v.title}</div><div className="text-xs text-muted-foreground">{v.views} views</div></div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function CoachDash() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Players" value={String(players.length)} />
        <Stat icon={Video} label="Videos uploaded" value="—" />
        <Stat icon={MessageSquare} label="Scout inquiries" value="0" />
        <Stat icon={Trophy} label="Verified" value="Pending" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Squad" action={<Button size="sm"><Plus className="mr-1 h-4 w-4" />Add player</Button>}>
          <ul className="space-y-2">
            {players.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-accent/30">
                <Link to="/players/$id" params={{ id: p.id }} className="flex items-center gap-3">
                  <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.position} · Age {p.age}</div>
                  </div>
                </Link>
                <span className="font-display font-bold text-gradient-gold">{p.rating}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Inbox">
          <Button variant="outline" className="w-full" asChild><Link to="/messages">Open messages</Link></Button>
        </Section>

        <Section title="Quick actions">
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild><Link to="/videos"><Video className="mr-2 h-4 w-4" />Upload video</Link></Button>
            <Button variant="outline" className="justify-start" asChild><Link to="/discover"><Search className="mr-2 h-4 w-4" />Browse talent</Link></Button>
            <Button variant="outline" className="justify-start"><Brain className="mr-2 h-4 w-4" />Request AI analysis</Button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function ScoutDash() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Search} label="Searches" value="0" />
        <Stat icon={Star} label="Saved players" value="0" />
        <Stat icon={Send} label="Trials requested" value="0" />
        <Stat icon={MessageSquare} label="Conversations" value="0" />
      </div>

      <Section title="Top players right now" action={<Button size="sm" variant="ghost" asChild><Link to="/discover">View all</Link></Button>}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {players.slice(0, 4).map((p) => (
            <Link key={p.id} to="/players/$id" params={{ id: p.id }} className="rounded-lg border border-border/60 p-3 hover:border-primary/60">
              <img src={p.photo} alt="" className="aspect-square w-full rounded-md object-cover" />
              <div className="mt-2 text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.position} · {p.region}</div>
              <div className="mt-1 flex justify-between"><span className="text-xs text-muted-foreground">Rating</span><span className="font-bold text-gradient-gold">{p.rating}</span></div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ClubDash() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Pipeline" value="0" />
        <Stat icon={Send} label="Trial invites" value="0" />
        <Stat icon={Trophy} label="Signings YTD" value="0" />
        <Stat icon={Star} label="Watchlist" value="0" />
      </div>

      <Section title="Top targets">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {players.slice(0, 8).map((p) => (
            <Link key={p.id} to="/players/$id" params={{ id: p.id }} className="rounded-lg border border-border/60 p-3 hover:border-primary/60">
              <div className="flex items-center gap-2">
                <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div className="text-xs">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-muted-foreground">{p.position} · {p.rating}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AdminDash() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Users} label="Total players" value={String(players.length)} />
        <Stat icon={ShieldCheck} label="Pending verifications" value={String(players.filter(p => !p.verified).length)} />
        <Stat icon={Video} label="Videos" value="—" />
        <Stat icon={Trophy} label="Active clubs" value="—" />
      </div>
      <Section title="Pending verifications">
        <ul className="divide-y divide-border/60">
          {players.filter(p => !p.verified).slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.academy} · {p.region}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Reject</Button>
                <Button size="sm">Approve</Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
