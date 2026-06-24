import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { fetchPlayers } from "@/lib/api";
import type { Player } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Trophy } from "lucide-react";

export const Route = createFileRoute("/rankings")({
  head: () => ({ meta: [{ title: "Rankings — Tanzania Talent Scout" }] }),
  component: Rankings,
});

function RankTable({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No players in this ranking yet.</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Player</th>
            <th className="px-4 py-3 text-left">Position</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Academy</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">Region</th>
            <th className="px-4 py-3 text-right">Rating</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id} className="border-t border-border/60 hover:bg-accent/30">
              <td className="px-4 py-3 font-display font-bold">
                {i < 3 ? <span className="text-gradient-gold">{i + 1}</span> : i + 1}
              </td>
              <td className="px-4 py-3">
                <Link to="/players/$id" params={{ id: p.id }} className="flex items-center gap-3 font-medium hover:text-primary">
                  <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <span>{p.name}</span>
                  {p.verified && <BadgeCheck className="h-4 w-4 text-gold" />}
                </Link>
              </td>
              <td className="px-4 py-3"><Badge variant="outline">{p.position}</Badge></td>
              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{p.academy}</td>
              <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{p.region}</td>
              <td className="px-4 py-3 text-right font-display text-lg font-bold text-gradient-gold">{p.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rankings() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold/15 text-gold"><Trophy className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-4xl font-bold">Rankings</h1>
            <p className="text-muted-foreground">Live national, regional, age-group and positional leaderboards.</p>
          </div>
        </div>

        <Tabs defaultValue="national" className="mt-8">
          <TabsList>
            <TabsTrigger value="national">National</TabsTrigger>
            <TabsTrigger value="regional">Regional · Dar es Salaam</TabsTrigger>
            <TabsTrigger value="age">U-20</TabsTrigger>
            <TabsTrigger value="position">Strikers</TabsTrigger>
          </TabsList>
          <TabsContent value="national" className="mt-6"><RankTable players={sorted} /></TabsContent>
          <TabsContent value="regional" className="mt-6"><RankTable players={sorted.filter(p => p.region === "Dar es Salaam")} /></TabsContent>
          <TabsContent value="age" className="mt-6"><RankTable players={sorted.filter(p => p.age <= 20)} /></TabsContent>
          <TabsContent value="position" className="mt-6"><RankTable players={sorted.filter(p => p.position === "ST")} /></TabsContent>
        </Tabs>
      </div>
      <SiteFooter />
    </div>
  );
}
