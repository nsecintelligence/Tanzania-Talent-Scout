import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession, useAuthReady } from "@/lib/auth-store";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import type { Role } from "@/lib/mock-data";

export function AuthGate({
  children,
  roles,
  title = "Sign in to continue",
  description = "This page is only available to signed-in members.",
}: {
  children: React.ReactNode;
  roles?: Role[];
  title?: string;
  description?: string;
}) {
  const session = useSession();
  const ready = useAuthReady();
  const nav = useNavigate();

  useEffect(() => {
    if (ready && !session) {
      const t = setTimeout(() => nav({ to: "/auth" }), 1200);
      return () => clearTimeout(t);
    }
  }, [ready, session, nav]);

  if (!ready) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="grid place-items-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <Button className="mt-6" asChild><Link to="/auth">Sign in / Join free</Link></Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (roles && !roles.includes(session.role)) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Not authorised</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account role ({session.role}) cannot access this area.
          </p>
          <Button className="mt-6" variant="outline" asChild><Link to="/dashboard">Back to dashboard</Link></Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
