import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { fetchAcademies } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin, Building2, Shield } from "lucide-react";

export const Route = createFileRoute("/academies")({
  head: () => ({
    meta: [
      { title: "Academies & Clubs — Tanzania Talent Scout" },
      { name: "description", content: "Browse verified football academies and clubs across Tanzania." },
    ],
  }),
  component: Academies,
});

function Academies() {
  const { data: items = [], isLoading } = useQuery({ queryKey: ["academies"], queryFn: fetchAcademies });

  const academies = items.filter((a) => a.kind === "academy");
  const clubs = items.filter((a) => a.kind === "club");

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><Building2 className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-4xl font-bold">Academies & Clubs</h1>
            <p className="text-muted-foreground">The institutions building Tanzania's next generation of football talent.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 text-muted-foreground">Loading…</div>
        ) : (
          <>
            <Section title="Academies" icon={<Shield className="h-4 w-4" />} list={academies} />
            <Section title="Clubs" icon={<Building2 className="h-4 w-4" />} list={clubs} />
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function Section({ title, icon, list }: { title: string; icon: React.ReactNode; list: { id: string; name: string; region: string | null; description: string | null; verified: boolean }[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">{icon}{title} <span className="text-sm font-normal text-muted-foreground">({list.length})</span></h2>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No {title.toLowerCase()} yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <div key={a.id} className="group rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/60 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary font-display text-lg font-bold">
                  {a.name.charAt(0)}
                </div>
                {a.verified && (
                  <Badge variant="outline" className="border-gold/60 bg-gold/10 text-gold">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold leading-tight">{a.name}</h3>
              {a.region && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{a.region}
                </div>
              )}
              {a.description && <p className="mt-3 text-sm text-muted-foreground">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
