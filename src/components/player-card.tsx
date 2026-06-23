import { Link } from "@tanstack/react-router";
import type { Player } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin } from "lucide-react";

export function PlayerCard({ player }: { player: Player }) {
  return (
    <Link
      to="/players/$id"
      params={{ id: player.id }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={player.photo}
          alt={player.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground">{player.position}</Badge>
          {player.verified && (
            <Badge variant="outline" className="border-gold/60 bg-gold/10 text-gold">
              <BadgeCheck className="mr-1 h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-background/80 px-2 py-1 text-center backdrop-blur">
          <div className="text-lg font-bold leading-none text-gradient-gold">{player.rating}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">AI rating</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-lg font-bold leading-tight">{player.name}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Age {player.age}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{player.region}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
