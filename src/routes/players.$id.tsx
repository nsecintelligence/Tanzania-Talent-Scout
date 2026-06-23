import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PLAYERS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BadgeCheck, MapPin, Share2, MessageSquare, Send, Brain, Award, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/players/$id")({
  loader: ({ params }) => {
    const player = PLAYERS.find((p) => p.id === params.id);
    if (!player) throw notFound();
    return { player };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.player.name ?? "Player"} — Tanzania Talent Scout` }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Player not found</h1>
        <Button asChild className="mt-6"><Link to="/discover">Back to discover</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <Button onClick={reset} className="mt-6">Try again</Button>
      </div>
    </div>
  ),
  component: PlayerProfile,
});

function PlayerProfile() {
  const { player } = Route.useLoaderData();
  const statEntries = Object.entries(player.stats) as [string, number][];

  return (
    <div className="min-h-screen">
      <SiteNav />

      <div className="relative border-b border-border/60">
        <div className="absolute inset-0 pitch-grid opacity-30" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <img src={player.photo} alt={player.name} className="aspect-[3/4] w-full object-cover" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">{player.position}</Badge>
              {player.verified && (
                <Badge variant="outline" className="border-gold/60 bg-gold/10 text-gold">
                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                </Badge>
              )}
              <Badge variant="outline">{player.academy}</Badge>
            </div>
            <h1 className="mt-3 font-display text-5xl font-extrabold">{player.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Age {player.age}</span>
              <span>{player.height} cm · {player.weight} kg</span>
              <span>{player.foot} foot</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {player.region}</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
                <div className="font-display text-3xl font-bold text-gradient-gold">{player.rating}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI rating</div>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                <div className="font-display text-3xl font-bold text-primary">{player.potential}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Potential</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="font-display text-3xl font-bold">#{Math.floor(100 - player.rating / 2)}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nat. rank</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => toast.success("Trial invitation sent")}><Send className="mr-1.5 h-4 w-4" />Send trial invite</Button>
              <Button variant="outline" onClick={() => toast.success("Message sent to coach")}><MessageSquare className="mr-1.5 h-4 w-4" />Contact coach</Button>
              <Button variant="outline" onClick={() => toast.success("Profile link copied")}><Share2 className="mr-1.5 h-4 w-4" />Share</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="stats">
          <TabsList>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {statEntries.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{k}</span>
                    <span className="font-display text-2xl font-bold">{v}</span>
                  </div>
                  <Progress value={v} className="mt-3 h-2" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
              <div className="flex items-center gap-2 text-primary"><Brain className="h-5 w-5" /><span className="font-semibold">AI Scouting Report</span></div>
              <h3 className="mt-3 font-display text-2xl font-bold">Strengths & weaknesses</h3>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary">Strengths</div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>• Exceptional acceleration over first 5 meters</li>
                    <li>• High passing accuracy under pressure (87%)</li>
                    <li>• Strong positional awareness in final third</li>
                    <li>• Composed shooting from outside the box</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-destructive">To improve</div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>• Aerial duels — needs strength work</li>
                    <li>• Off-ball defensive tracking</li>
                    <li>• Weak-foot finishing consistency</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 rounded-lg border border-border/60 bg-card p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Summary</div>
                <p className="mt-1 text-sm">
                  Video analysis across 6 recent matches shows top-end pace of 32.4 km/h, average passing accuracy of 87% and shooting efficiency of 41%.
                  Movement model classifies as a modern, vertical {player.position} with strong potential for top-flight football.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[1,2,3].map((i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                  <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-gold/10">
                    <div className="absolute inset-0 grid place-items-center text-primary">▶</div>
                    <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 text-xs">3:42</div>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold">Match highlights #{i}</div>
                    <div className="text-xs text-muted-foreground">vs Simba Youth · 1.2k views</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid gap-3 md:grid-cols-2">
              {player.achievements.map((a: string, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold/10 text-gold">
                    {i % 2 ? <Trophy className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                  </div>
                  <span className="font-medium">{a}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SiteFooter />
    </div>
  );
}
