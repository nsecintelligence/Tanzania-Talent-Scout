import { supabase } from "@/integrations/supabase/client";
import { pickPhoto, type Player, type PlayerStats } from "./mock-data";

type DbPlayerRow = {
  id: string;
  name: string;
  position: string;
  age: number;
  height_cm: number | null;
  weight_kg: number | null;
  foot: string | null;
  sex: string | null;
  region: string | null;
  rating: number;
  potential: number;
  verified: boolean;
  stats: PlayerStats | null;
  achievements: string[] | null;
  photo_url: string | null;
  bio: string | null;
  academy_id: string | null;
  academies?: { name: string } | null;
};

const DEFAULT_STATS: PlayerStats = {
  pace: 70, shooting: 70, passing: 70, dribbling: 70, defense: 60, physical: 70,
};

export function mapPlayer(row: DbPlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    photo: pickPhoto(row.id, row.photo_url),
    position: row.position,
    age: row.age,
    height: row.height_cm ?? 175,
    weight: row.weight_kg ?? 70,
    foot: (row.foot as "Left" | "Right" | "Both") ?? "Right",
    sex: (row.sex as "male" | "female") ?? "male",
    region: row.region ?? "Tanzania",
    academy: row.academies?.name ?? "Free agent",
    rating: row.rating,
    potential: row.potential,
    verified: row.verified,
    stats: row.stats ?? DEFAULT_STATS,
    achievements: row.achievements ?? [],
    bio: row.bio ?? undefined,
  };
}

export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*, academies(name)")
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapPlayer(r as unknown as DbPlayerRow));
}

export async function fetchPlayer(id: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*, academies(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPlayer(data as unknown as DbPlayerRow) : null;
}

export type Academy = {
  id: string;
  name: string;
  kind: string;
  region: string | null;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
};

export async function fetchAcademies(): Promise<Academy[]> {
  const { data, error } = await supabase
    .from("academies")
    .select("*")
    .order("verified", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as Academy[];
}

export type VideoRow = {
  id: string;
  title: string;
  url: string;
  kind: string;
  duration: string | null;
  views: number;
  player_id: string | null;
  created_at: string;
};

export async function fetchVideos(): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VideoRow[];
}

export async function fetchPlayerVideos(playerId: string): Promise<VideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VideoRow[];
}

// Resolve a stored URL to a playable URL. If the stored value is a storage path
// (no protocol) or an expired signed URL, mint a fresh signed URL.
export async function resolveVideoUrl(stored: string): Promise<string> {
  try {
    const u = new URL(stored);
    // Signed URL: refresh if it'll expire soon
    if (u.pathname.includes("/object/sign/")) {
      const idx = u.pathname.indexOf("/media/");
      if (idx === -1) return stored;
      const path = u.pathname.slice(idx + "/media/".length);
      const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 6);
      return data?.signedUrl ?? stored;
    }
    return stored;
  } catch {
    // Not a URL — treat as storage path
    const { data } = await supabase.storage.from("media").createSignedUrl(stored, 60 * 60 * 6);
    return data?.signedUrl ?? stored;
  }
}
