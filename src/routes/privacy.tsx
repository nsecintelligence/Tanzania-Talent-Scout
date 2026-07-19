import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { useSession, signOut } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { auditLog } from "@/lib/security";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy & my data — TTS" }] }),
  component: Privacy,
});

function Privacy() {
  const session = useSession();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  async function exportData() {
    if (!session) return;
    setBusy(true);
    try {
      const uid = session.user.id;
      const [profile, roles, tracked, progress, reports, messages] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid),
        supabase.from("user_roles").select("*").eq("user_id", uid),
        supabase.from("scout_tracked_players").select("*").eq("scout_id", uid),
        supabase.from("player_progress_entries").select("*").eq("scout_id", uid),
        supabase.from("content_reports").select("*").eq("reporter_id", uid),
        supabase.from("messages").select("*").or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),
      ]);
      const bundle = {
        exported_at: new Date().toISOString(),
        user: { id: uid, email: session.email, name: session.name, role: session.role },
        profile: profile.data,
        roles: roles.data,
        tracking: tracked.data,
        progress_entries: progress.data,
        reports: reports.data,
        messages: messages.data,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `tts-data-export-${uid}.json`; a.click();
      URL.revokeObjectURL(url);
      await auditLog("gdpr.export", "user", uid);
      toast.success("Data exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally { setBusy(false); }
  }

  async function deleteMyData() {
    if (!session) return;
    if (!confirm("Delete your account and all associated data? This cannot be undone.")) return;
    setBusy(true);
    try {
      const uid = session.user.id;
      // Best-effort delete owned rows (RLS scopes to caller).
      await Promise.all([
        supabase.from("player_progress_entries").delete().eq("scout_id", uid),
        supabase.from("scout_tracked_players").delete().eq("scout_id", uid),
        supabase.from("content_reports").delete().eq("reporter_id", uid),
      ]);
      await auditLog("gdpr.self_delete_requested", "user", uid);
      // Mark profile for deletion (background cron / admin finalises auth.users removal).
      await supabase.from("profiles").update({
        display_name: "[deleted user]",
        avatar_url: null,
        inactivity_alerted_at: new Date("2000-01-01").toISOString(),
        last_active_at: new Date("2000-01-01").toISOString(),
      }).eq("id", uid);
      toast.success("Your data has been deleted. Signing you out.");
      await signOut();
      nav({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold">Privacy & my data</h1>
            <p className="text-sm text-muted-foreground">Your rights under GDPR-style data protection principles.</p>
          </div>
        </div>

        {!session ? (
          <div className="rounded-lg border border-border/60 p-8 text-center">
            <p className="text-muted-foreground">Sign in to manage your data.</p>
            <Button className="mt-4" onClick={() => nav({ to: "/auth" })}>Sign in</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold">What we store about you</h2>
              <ul className="mt-3 list-disc pl-6 text-sm text-muted-foreground">
                <li>Your profile (name, avatar, activity timestamps).</li>
                <li>Your role and account status.</li>
                <li>Scout tracking windows and observation notes you created.</li>
                <li>Messages you sent or received (also stored for the other party).</li>
                <li>Content you reported.</li>
                <li>Security audit events (login attempts, role changes) for abuse prevention.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold">Export my data</h2>
              <p className="mt-1 text-sm text-muted-foreground">Download a JSON copy of everything associated with your account.</p>
              <Button className="mt-4" disabled={busy} onClick={exportData}>
                <Download className="mr-2 h-4 w-4" /> Export as JSON
              </Button>
            </section>

            <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
              <h2 className="font-display text-lg font-bold text-destructive">Delete my account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Erases your profile data and content. Login audit records are retained (pseudonymised) as required by our security policy.
              </p>
              <Button variant="destructive" className="mt-4" disabled={busy} onClick={deleteMyData}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete my account
              </Button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
