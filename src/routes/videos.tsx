import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { VIDEOS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Play, Eye } from "lucide-react";

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Videos — Tanzania Talent Scout" }] }),
  component: Videos,
});

function Videos() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Match & training videos</h1>
        <p className="text-muted-foreground">AI-tagged highlights, full matches and training sessions.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v) => (
            <div key={v.id} className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-primary/60">
              <div className="relative aspect-video bg-gradient-to-br from-primary/30 via-card to-gold/10">
                <div className="absolute inset-0 pitch-grid opacity-40" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-110">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                </div>
                <Badge className="absolute left-3 top-3 bg-background/80 text-foreground">{v.type}</Badge>
                <div className="absolute bottom-3 right-3 rounded bg-background/80 px-2 py-0.5 text-xs backdrop-blur">{v.duration}</div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold leading-tight">{v.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{v.player}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{v.views.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
