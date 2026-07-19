import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { useSession } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle2, Flag, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security dashboard — TTS" }] }),
  component: SecurityDashboard,
});

type LoginAttempt = { id: number; created_at: string; email_hash: string; success: boolean; reason: string | null; user_agent: string | null };
type AuditRow = { id: number; created_at: string; actor_id: string | null; action: string; target_type: string | null; target_id: string | null; metadata: Record<string, unknown>; row_hash: string };
type Report = { id: string; created_at: string; reporter_id: string; target_type: string; target_id: string; reason: string; details: string | null; status: string };

function SecurityDashboard() {
  const session = useSession();
  const nav = useNavigate();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === null) return; // wait for hydration
    if (session && session.role !== "admin") {
      toast.error("Admins only");
      nav({ to: "/dashboard" });
      return;
    }
    if (!session) return;
    (async () => {
      const [a, b, c, v] = await Promise.all([
        supabase.from("login_attempts").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("audit_logs").select("*").order("id", { ascending: false }).limit(100),
        supabase.from("content_reports").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.rpc("verify_audit_chain"),
      ]);
      setAttempts((a.data as LoginAttempt[]) ?? []);
      setAudit((b.data as AuditRow[]) ?? []);
      setReports((c.data as Report[]) ?? []);
      setChainOk(!v.error && ((v.data as unknown[])?.length ?? 0) === 0);
      setLoading(false);
    })();
  }, [session, nav]);

  if (!session || session.role !== "admin") {
    return <div className="min-h-screen"><SiteNav /><div className="p-10 text-center text-muted-foreground">Checking access…</div></div>;
  }

  const failed24h = attempts.filter((x) => !x.success && Date.now() - new Date(x.created_at).getTime() < 86400000).length;
  const success24h = attempts.filter((x) => x.success && Date.now() - new Date(x.created_at).getTime() < 86400000).length;
  const openReports = reports.filter((r) => r.status === "open").length;

  async function resolveReport(id: string, status: "resolved" | "rejected") {
    const { error } = await supabase.from("content_reports")
      .update({ status, resolved_by: session!.user.id, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.rpc("append_audit_log", { _action: `report.${status}`, _target_type: "report", _target_id: id, _metadata: {} as never });
    setReports((rs) => rs.map((r) => r.id === id ? { ...r, status } : r));
    toast.success(`Report ${status}`);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold">Security dashboard</h1>
            <p className="text-sm text-muted-foreground">Login attempts, audit trail, moderation queue.</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard icon={AlertTriangle} label="Failed logins (24h)" value={failed24h} tone={failed24h > 20 ? "danger" : "muted"} />
          <StatCard icon={Activity} label="Successful logins (24h)" value={success24h} />
          <StatCard icon={Flag} label="Open reports" value={openReports} tone={openReports > 0 ? "warn" : "muted"} />
          <StatCard
            icon={chainOk === false ? AlertTriangle : CheckCircle2}
            label="Audit chain"
            value={chainOk === null ? "…" : chainOk ? "Intact" : "TAMPERED"}
            tone={chainOk === false ? "danger" : "ok"}
          />
        </div>

        <Tabs defaultValue="attempts">
          <TabsList>
            <TabsTrigger value="attempts">Login attempts</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="attempts" className="mt-4">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">When</th><th className="p-3 text-left">Email hash</th><th className="p-3 text-left">Result</th><th className="p-3 text-left">Reason</th></tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading…</td></tr> :
                    attempts.map((a) => (
                      <tr key={a.id} className="border-t border-border/60">
                        <td className="p-3">{new Date(a.created_at).toLocaleString()}</td>
                        <td className="p-3 font-mono text-xs">{a.email_hash.slice(0, 12)}…</td>
                        <td className="p-3">{a.success ? <Badge>ok</Badge> : <Badge variant="destructive">fail</Badge>}</td>
                        <td className="p-3 text-muted-foreground">{a.reason ?? "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">When</th><th className="p-3 text-left">Actor</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Target</th><th className="p-3 text-left">Hash</th></tr>
                </thead>
                <tbody>
                  {audit.map((r) => (
                    <tr key={r.id} className="border-t border-border/60">
                      <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-3 font-mono text-xs">{r.actor_id ? r.actor_id.slice(0, 8) : "—"}</td>
                      <td className="p-3"><Badge variant="outline">{r.action}</Badge></td>
                      <td className="p-3 text-muted-foreground">{r.target_type ?? "—"} {r.target_id ? `· ${r.target_id.slice(0,12)}` : ""}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{r.row_hash.slice(0, 10)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <div className="grid gap-3">
              {reports.length === 0 && <div className="rounded-lg border border-border/60 p-8 text-center text-muted-foreground">No reports</div>}
              {reports.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{r.target_type}</Badge>
                        <Badge variant={r.status === "open" ? "destructive" : "secondary"}>{r.status}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 font-medium">{r.reason}</div>
                      {r.details && <div className="mt-1 text-sm text-muted-foreground">{r.details}</div>}
                      <div className="mt-1 text-xs text-muted-foreground">Target: {r.target_id}</div>
                    </div>
                    {r.status === "open" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => resolveReport(r.id, "resolved")}>Resolve</Button>
                        <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, "rejected")}>Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "muted" }: { icon: React.ComponentType<{className?:string}>; label: string; value: number | string; tone?: "muted"|"ok"|"warn"|"danger" }) {
  const toneClass = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-500" : tone === "ok" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      <div className={`mt-3 font-display text-3xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
