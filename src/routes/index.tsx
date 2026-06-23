import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerCard } from "@/components/player-card";
import { PLAYERS } from "@/lib/mock-data";
import { ArrowRight, Brain, Search, Trophy, Video, Users, Sparkles, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tanzania Talent Scout — Discover football talent" },
      { name: "description", content: "AI-powered football talent discovery across Tanzania. For players, coaches, scouts and clubs." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const featured = PLAYERS.slice(0, 8);
  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 pitch-grid opacity-40" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 md:gap-6">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit bg-gold/10 text-gold border border-gold/30">
              <Sparkles className="mr-1 h-3 w-3" /> AI-powered scouting
            </Badge>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Tanzania's next <span className="text-gradient-gold">football stars</span>, discovered here.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              The all-in-one platform connecting players, coaches, academies, scouts, clubs and agents across Tanzania —
              powered by AI video analysis and verified profiles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">Join free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/discover">Browse talent</Link>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6">
              {[
                { k: "1,240+", v: "Players" },
                { k: "180+", v: "Academies" },
                { k: "65+", v: "Scouts & Clubs" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-bold text-gradient-gold md:text-3xl">{s.k}</dt>
                  <dd className="text-xs uppercase tracking-widest text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/30 via-transparent to-gold/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60">
              <img src={hero} alt="Tanzanian footballer at golden hour" width={1600} height={1024} className="h-full w-full object-cover" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Featured talent</div>
                  <div className="font-display text-lg font-bold">Mbwana Samatta Jr · 18 · ST</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-gradient-gold">87</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">What we do</div>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Everything you need to spot, grow and sign talent</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Brain, title: "AI video analysis", desc: "Detect movement, calculate speed, measure passing accuracy and generate scouting reports." },
            { icon: Search, title: "Smart discovery", desc: "Filter by age, position, region and rating. Save players and build watchlists." },
            { icon: Video, title: "Match & training video", desc: "Upload, tag and stream highlights. Auto-generate reels." },
            { icon: Trophy, title: "National rankings", desc: "Live national, regional, age-group and position rankings." },
            { icon: ShieldCheck, title: "Verified profiles", desc: "Verified coaches, academies and players you can trust." },
            { icon: Users, title: "Connect & recruit", desc: "Messaging, trial invitations and full recruitment pipelines." },
          ].map((f) => (
            <div key={f.title} className="group rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PLAYERS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Featured talent</div>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">This week's top-rated players</h2>
          </div>
          <Button variant="ghost" asChild><Link to="/discover">See all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-gold/10 p-10 md:p-16">
          <div className="absolute inset-0 pitch-grid opacity-30" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl font-bold md:text-5xl">Your shot starts here.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you're a player chasing the dream or a club hunting the next big thing — Tanzania Talent Scout is your home pitch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/auth">Create your profile</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/discover">Explore players</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
