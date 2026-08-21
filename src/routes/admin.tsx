import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { AuthGate } from "@/components/auth-gate";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlayers, fetchVideos, fetchAcademies, resolveVideoUrl } from "@/lib/api";
import { auditLog } from "@/lib/security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Video, ShieldCheck, Building2, Trash2, Pencil, Check, X, Search, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Tanzania Talent Scout" },
      { name: "description", content: "Manage players, approvals, videos and academies across the Tanzania Talent Scout platform." },
      { property: "og:title", content: "Admin panel — Tanzania Talent Scout" },
      { property: "og:description", content: "Approve players, moderate videos and manage academies." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate roles={["admin"]} title="Admin access only" description="Sign in with an administrator account to manage the platform.">
      <AdminPanel />
    </AuthGate>
  ),
});

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function AdminPanel() {
  const qc = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  const { data: videos = [] } = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });
  const { data: academies = [] } = useQuery({ queryKey: ["academies"], queryFn: fetchAcademies });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Player | null>(null);
  const [playing, setPlaying] = useState<{ title: string; url: string } | null>(null);

  const pending = players.filter((p) => !p.verified);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? players.filter((p) => p.name.toLowerCase().includes(s) || p.region.toLowerCase().includes(s)) : players;
  }, [players, q]);

  async function setVerified(p: Player, verified: boolean) {
    const { error } = await supabase.from("players").update({ verified }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await auditLog(verified ? "player.approve" : "player.unapprove", "player", p.id).catch(() => {});
    qc.invalidateQueries({ queryKey: ["players"] });
    toast.success(`${p.name} ${verified ? "approved" : "set to pending"}`);
  }

  async function deletePlayer(p: Player) {
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("players").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    await auditLog("player.delete", "player", p.id).catch(() => {});
    qc.invalidateQueries({ queryKey: ["players"] });
    toast.success("Player deleted");
  }

  async function deleteVideo(id: string, title: string) {
    if (!confirm(`Delete video "${title}"?`)) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await auditLog("video.delete", "video", id).catch(() => {});
    qc.invalidateQueries({ queryKey: ["videos"] });
    toast.success("Video deleted");
  }

  async function setAcademyVerified(id: string, verified: boolean) {
    const { error } = await supabase.from("academies").update({ verified }).eq("id", id);
    if (error) return toast.error(error.message);
    await auditLog(verified ? "academy.approve" : "academy.unapprove", "academy", id).catch(() => {});
    qc.invalidateQueries({ queryKey: ["academies"] });
    toast.success("Academy updated");
  }

  async function play(url: string, title: string) {
    const resolved = await resolveVideoUrl(url);
    setPlaying({ title, url: resolved });
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary">Administration</div>
            <h1 className="font-display text-4xl font-bold">Admin panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Approve members, manage player records, moderate videos and academies.</p>
          </div>
          <Button variant="outline" asChild><Link to="/security"><ShieldCheck className="mr-2 h-4 w-4" />Security dashboard</Link></Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={Users} label="Players" value={String(players.length)} />
          <Stat icon={ShieldCheck} label="Pending approval" value={String(pending.length)} />
          <Stat icon={Video} label="Videos" value={String(videos.length)} />
          <Stat icon={Building2} label="Academies" value={String(academies.length)} />
        </div>

        <Tabs defaultValue="approvals" className="mt-8">
          <TabsList>
            <TabsTrigger value="approvals">Approvals ({pending.length})</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="academies">Academies</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              {pending.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Nothing waiting for approval.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {pending.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <Link to="/players/$id" params={{ id: p.id }} className="flex items-center gap-3">
                        <img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <div className="text-sm font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.position} · Age {p.age} · {p.academy} · {p.region}</div>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => deletePlayer(p)}><X className="mr-1 h-4 w-4" />Reject</Button>
                        <Button size="sm" onClick={() => setVerified(p, true)}><Check className="mr-1 h-4 w-4" />Approve</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="players" className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or region…" className="max-w-sm" />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr className="border-b border-border/60">
                    <th className="p-3">Player</th><th className="p-3">Pos</th><th className="p-3">Age</th>
                    <th className="p-3">Rating</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/40 last:border-0">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <img src={p.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.region} · {p.sex}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{p.position}</td>
                      <td className="p-3">{p.age}</td>
                      <td className="p-3 font-bold">{p.rating}</td>
                      <td className="p-3">
                        {p.verified
                          ? <Badge className="border border-primary/30 bg-primary/15 text-primary">Approved</Badge>
                          : <Badge variant="outline">Pending</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" onClick={() => setVerified(p, !p.verified)}>
                            {p.verified ? "Unapprove" : "Approve"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deletePlayer(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              {videos.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No videos uploaded yet.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {videos.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <div className="text-sm font-semibold">{v.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {v.kind} · {v.duration ?? "—"} · {v.views} views · {new Date(v.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => play(v.url, v.title)}><PlayCircle className="mr-1 h-4 w-4" />Review</Button>
                        <Button size="sm" variant="outline" onClick={() => deleteVideo(v.id, v.title)}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="academies" className="mt-5">
            <div className="rounded-xl border border-border/60 bg-card">
              <ul className="divide-y divide-border/60">
                {academies.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.kind} · {a.region ?? "Tanzania"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.verified
                        ? <Badge className="border border-primary/30 bg-primary/15 text-primary">Verified</Badge>
                        : <Badge variant="outline">Unverified</Badge>}
                      <Button size="sm" variant="outline" onClick={() => setAcademyVerified(a.id, !a.verified)}>
                        {a.verified ? "Revoke" : "Verify"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditPlayerDialog player={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["players"] })} />

      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{playing?.title}</DialogTitle></DialogHeader>
          {playing && <video src={playing.url} controls className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

function EditPlayerDialog({ player, onClose, onSaved }: { player: Player | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", position: "", age: 18, rating: 70, potential: 80, region: "" });
  const [saving, setSaving] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (player && loadedFor !== player.id) {
    setLoadedFor(player.id);
    setForm({
      name: player.name, position: player.position, age: player.age,
      rating: player.rating, potential: player.potential, region: player.region,
    });
  }

  async function save() {
    if (!player) return;
    setSaving(true);
    const { error } = await supabase.from("players").update({
      name: form.name.trim(),
      position: form.position.trim(),
      age: Number(form.age),
      rating: Number(form.rating),
      potential: Number(form.potential),
      region: form.region.trim(),
    }).eq("id", player.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await auditLog("player.update", "player", player.id).catch(() => {});
    onSaved();
    onClose();
    toast.success("Player updated");
  }

  return (
    <Dialog open={!!player} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit player</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Position</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Rating</Label><Input type="number" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div><Label>Potential</Label><Input type="number" value={form.potential} onChange={(e) => setForm({ ...form, potential: Number(e.target.value) })} /></div>
          </div>
          <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
