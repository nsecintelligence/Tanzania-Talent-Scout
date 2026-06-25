import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { fetchPlayers, fetchVideos, resolveVideoUrl, type VideoRow } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Videos — Tanzania Talent Scout" }] }),
  component: Videos,
});

function UploadDialog() {
  const session = useSession();
  const qc = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Highlights");
  const [duration, setDuration] = useState("");
  const [playerId, setPlayerId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function submit() {
    if (!session) return toast.error("Sign in first");
    if (!title || !file) return toast.error("Title and video file required");
    if (file.size > 200 * 1024 * 1024) return toast.error("Max file size is 200MB");
    setBusy(true);
    setProgress(5);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${session.user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      setProgress(80);
      const { error } = await supabase.from("videos").insert({
        title,
        kind,
        duration: duration || null,
        url: path, // store storage path; resolve to signed URL on playback
        uploaded_by: session.user.id,
        player_id: playerId || null,
      });
      if (error) throw error;
      setProgress(100);
      toast.success("Video uploaded");
      setOpen(false);
      setTitle(""); setFile(null); setDuration(""); setPlayerId("");
      qc.invalidateQueries({ queryKey: ["videos"] });
      qc.invalidateQueries({ queryKey: ["player-videos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); setProgress(0); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" />Upload video</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload a new video</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Match highlights vs Simba Youth" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-input p-2 text-sm">
                <option>Highlights</option><option>Match</option><option>Training</option>
              </select>
            </div>
            <div><Label>Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3:42" /></div>
          </div>
          <div><Label>Tag player (optional)</Label>
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-input p-2 text-sm">
              <option value="">— none —</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.position}</option>)}
            </select>
          </div>
          <div><Label>Video file (mp4/webm, max 200MB)</Label><Input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          {busy && (
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <Button onClick={submit} disabled={busy} className="w-full">{busy ? "Uploading…" : "Upload"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VideoPlayerDialog({ video, open, onOpenChange }: { video: VideoRow | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (open && video) {
      setSrc(null);
      resolveVideoUrl(video.url).then((u) => { if (active) setSrc(u); });
      // increment views (best-effort)
      supabase.from("videos").update({ views: (video.views ?? 0) + 1 }).eq("id", video.id).then(() => {});
    }
    return () => { active = false; };
  }, [open, video]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{video?.title}</DialogTitle></DialogHeader>
        {src ? (
          <video src={src} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted text-muted-foreground">Loading video…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function VideoGrid({ videos }: { videos: VideoRow[] }) {
  const [active, setActive] = useState<VideoRow | null>(null);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <button key={v.id} onClick={() => setActive(v)} className="group overflow-hidden rounded-xl border border-border/60 bg-card text-left transition hover:border-primary/60">
            <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-card to-gold/10">
              <div className="absolute inset-0 pitch-grid opacity-40" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-110">
                  <Play className="h-6 w-6 fill-current" />
                </div>
              </div>
              <Badge className="absolute left-3 top-3 bg-background/80 text-foreground">{v.kind}</Badge>
              {v.duration && <div className="absolute bottom-3 right-3 rounded bg-background/80 px-2 py-0.5 text-xs backdrop-blur">{v.duration}</div>}
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold leading-tight">{v.title}</h3>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(v.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(v.views ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <VideoPlayerDialog video={active} open={!!active} onOpenChange={(o) => !o && setActive(null)} />
    </>
  );
}

function Videos() {
  const session = useSession();
  const { data: videos = [], isLoading } = useQuery({ queryKey: ["videos"], queryFn: fetchVideos });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-bold">Match & training videos</h1>
            <p className="text-muted-foreground">AI-tagged highlights, full matches and training sessions.</p>
          </div>
          {session && <UploadDialog />}
        </div>

        {isLoading ? (
          <div className="mt-10 text-muted-foreground">Loading videos…</div>
        ) : videos.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No videos yet. {session ? "Upload the first one!" : "Sign in to upload."}
          </div>
        ) : (
          <div className="mt-8"><VideoGrid videos={videos} /></div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
