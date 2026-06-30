import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { PlayerCard } from "@/components/player-card";
import { fetchPlayers } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover players — Tanzania Talent Scout" }] }),
  component: Discover,
});

const positions = ["All", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const regions = ["All", "Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Mbeya", "Tanga", "Zanzibar", "Morogoro"];

function Discover() {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const [region, setRegion] = useState("All");
  const [sex, setSex] = useState<"All" | "male" | "female">("All");
  const [age, setAge] = useState<[number, number]>([15, 30]);
  const [minRating, setMinRating] = useState(60);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  const results = useMemo(() => players.filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
    (pos === "All" || p.position === pos) &&
    (region === "All" || p.region === region) &&
    (sex === "All" || p.sex === sex) &&
    p.age >= age[0] && p.age <= age[1] &&
    p.rating >= minRating
  ), [players, q, pos, region, sex, age, minRating]);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-4xl font-bold">Discover players</h1>
          <p className="text-muted-foreground">Filter Tanzania's talent pool by position, region, age and AI rating.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 rounded-xl border border-border/60 bg-card p-5 h-fit lg:sticky lg:top-20">
            <div>
              <Label>Search</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Player name" className="pl-9" />
              </div>
            </div>
            <div>
              <Label>Position</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {positions.map((p) => (
                  <button key={p} onClick={() => setPos(p)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${pos === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Region</Label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-input p-2 text-sm">
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <Label>Sex</Label>
              <div className="mt-2 flex gap-1.5">
                {(["All","male","female"] as const).map((s) => (
                  <button key={s} onClick={() => setSex(s)} className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${sex === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between"><Label>Age</Label><span className="text-xs text-muted-foreground">{age[0]}–{age[1]}</span></div>
              <Slider min={15} max={35} step={1} value={age} onValueChange={(v) => setAge([v[0], v[1]] as [number, number])} className="mt-3" />
            </div>
            <div>
              <div className="flex justify-between"><Label>Min AI rating</Label><span className="text-xs text-muted-foreground">{minRating}+</span></div>
              <Slider min={50} max={95} step={1} value={[minRating]} onValueChange={(v) => setMinRating(v[0])} className="mt-3" />
            </div>
          </aside>

          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${results.length} player${results.length !== 1 ? "s" : ""} found`}
            </div>
            {!isLoading && results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No players match your filters. <Link to="/discover" className="text-primary">Reset</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {results.map((p) => <PlayerCard key={p.id} player={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
