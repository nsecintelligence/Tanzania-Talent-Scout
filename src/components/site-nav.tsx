import { Link, useNavigate } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Trophy, Menu, X, AlertTriangle, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auditLog } from "@/lib/security";

const publicLinks = [
  { to: "/discover", label: "Discover" },
  { to: "/academies", label: "Academies" },
  { to: "/videos", label: "Videos" },
  { to: "/rankings", label: "Rankings" },
] as const;

const privateLinks = [
  { to: "/messages", label: "Messages" },
  { to: "/dashboard", label: "Dashboard" },
] as const;


export function SiteNav() {
  const session = useSession();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [alertedAt, setAlertedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { setAlertedAt(null); return; }
    supabase.from("profiles").select("inactivity_alerted_at").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setAlertedAt(data?.inactivity_alerted_at ?? null));
  }, [session]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {alertedAt && (
        <div className="bg-destructive/15 px-4 py-2 text-center text-xs text-destructive">
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          Your account has been inactive for over a month. It will be deleted in ~30 days unless you stay active. Browse or update your profile to keep it.
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-tight">Tanzania Talent Scout</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">TTS Platform</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm text-foreground bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link to="/privacy" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground" title="Privacy & my data">
                <Shield className="h-4 w-4" />
              </Link>
              {session.role === "admin" && (
                <Link to="/security" className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent" title="Security dashboard">
                  Security
                </Link>
              )}
              <div className="text-right text-xs leading-tight">
                <div className="font-medium text-foreground">{session.name}</div>
                <div className="text-muted-foreground capitalize">{session.role}</div>
              </div>
              <Button variant="outline" size="sm" onClick={async () => {
                await auditLog("auth.signout", "user", session.user.id).catch(() => {});
                await signOut();
                nav({ to: "/" });
              }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav({ to: "/auth" })}>Sign in</Button>
              <Button size="sm" onClick={() => nav({ to: "/auth" })}>Join free</Button>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 lg:hidden">
          <div className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                {l.label}
              </Link>
            ))}
            {!session ? (
              <Button className="mt-2" onClick={() => { setOpen(false); nav({ to: "/auth" }); }}>Sign in / Join</Button>
            ) : (
              <Button variant="outline" className="mt-2" onClick={async () => { await signOut(); setOpen(false); nav({ to: "/" }); }}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">Tanzania Talent Scout</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The home of football talent discovery in Tanzania. Built for players, coaches, and clubs.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/discover" className="hover:text-primary">Discover players</Link></li>
            <li><Link to="/academies" className="hover:text-primary">Academies</Link></li>
            <li><Link to="/videos" className="hover:text-primary">Videos</Link></li>
            <li><Link to="/rankings" className="hover:text-primary">Rankings</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">For</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Players</li><li>Coaches & Academies</li><li>Scouts & Clubs</li><li>Agents</li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Dar es Salaam, Tanzania</li>
            <li>hello@tanzaniatalent.tz</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © 2026 Tanzania Talent Scout. All rights reserved.
      </div>
    </footer>
  );
}
