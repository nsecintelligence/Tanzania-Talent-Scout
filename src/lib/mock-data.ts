import player1 from "@/assets/player1.jpg";
import player2 from "@/assets/player2.jpg";
import player3 from "@/assets/player3.jpg";

export type Role = "admin" | "coach" | "player" | "scout" | "club" | "agent";

export const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "player", label: "Player", desc: "Build your profile and get discovered" },
  { value: "coach", label: "Coach / Academy", desc: "Manage your team and players" },
  { value: "scout", label: "Scout", desc: "Discover talent across Tanzania" },
  { value: "club", label: "Club Representative", desc: "Recruit players for your club" },
  { value: "agent", label: "Agent", desc: "Represent players professionally" },
  { value: "admin", label: "Super Admin", desc: "Platform administration" },
];

export const FALLBACK_PHOTOS = [player1, player2, player3];

export type PlayerStats = {
  pace: number; shooting: number; passing: number;
  dribbling: number; defense: number; physical: number;
};

// Display shape used across the UI. Built from the `players` table.
export type Player = {
  id: string;
  name: string;
  photo: string;          // resolved url (db photo_url or fallback)
  position: string;
  age: number;
  height: number;
  weight: number;
  foot: "Left" | "Right" | "Both";
  region: string;
  academy: string;
  rating: number;
  potential: number;
  verified: boolean;
  stats: PlayerStats;
  achievements: string[];
  bio?: string;
};

export function pickPhoto(seed: string, photoUrl: string | null | undefined) {
  if (photoUrl) return photoUrl;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACK_PHOTOS[h % FALLBACK_PHOTOS.length];
}
