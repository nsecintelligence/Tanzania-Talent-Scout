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

export type Player = {
  id: string;
  name: string;
  photo: string;
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
  stats: { pace: number; shooting: number; passing: number; dribbling: number; defense: number; physical: number };
  achievements: string[];
};

const photos = [player1, player2, player3];
const positions = ["ST", "CAM", "CM", "CDM", "LW", "RW", "CB", "LB", "RB", "GK"];
const regions = ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Mbeya", "Tanga", "Zanzibar", "Morogoro"];
const academies = ["Azam Youth", "Yanga SC Academy", "Simba Academy", "JKT Tanzania", "Coastal Union Youth", "Mtibwa Sugar Academy"];
const names = [
  "Mbwana Samatta Jr","Aishi Manula","Hassan Dilunga","Simon Msuva","Bakari Mwamnyeto","Mudathir Yahya",
  "John Bocco","Feisal Salum","Himid Mao","Iddi Selemani","Mzamiru Yassin","Salum Abubakar",
  "Said Ndemla","Asante Kwasi","Yusuph Mhilu","Erasto Nyoni","Kelvin Yondani","Deus Kaseke",
];

export const PLAYERS: Player[] = names.map((name, i) => ({
  id: `p${i + 1}`,
  name,
  photo: photos[i % photos.length],
  position: positions[i % positions.length],
  age: 16 + (i % 12),
  height: 165 + ((i * 3) % 25),
  weight: 60 + ((i * 2) % 22),
  foot: (["Right", "Left", "Both"] as const)[i % 3],
  region: regions[i % regions.length],
  academy: academies[i % academies.length],
  rating: 65 + ((i * 7) % 28),
  potential: 75 + ((i * 5) % 22),
  verified: i % 3 === 0,
  stats: {
    pace: 60 + ((i * 11) % 35),
    shooting: 55 + ((i * 13) % 40),
    passing: 60 + ((i * 9) % 35),
    dribbling: 58 + ((i * 17) % 38),
    defense: 50 + ((i * 19) % 45),
    physical: 60 + ((i * 7) % 35),
  },
  achievements: [
    "U-17 National Team Call-up",
    "Top Scorer Regional League 2024",
    "Academy Player of the Year",
  ].slice(0, (i % 3) + 1),
}));

export const VIDEOS = [
  { id: "v1", title: "Match Highlights vs Simba Youth", player: "Mbwana Samatta Jr", duration: "3:42", views: 1240, type: "Match" },
  { id: "v2", title: "Training: Free Kick Drills", player: "Hassan Dilunga", duration: "5:18", views: 820, type: "Training" },
  { id: "v3", title: "Goalkeeper Reflexes Compilation", player: "Aishi Manula", duration: "2:51", views: 2310, type: "Highlights" },
  { id: "v4", title: "1v1 Dribbling Showcase", player: "Simon Msuva", duration: "4:07", views: 1875, type: "Highlights" },
  { id: "v5", title: "Full Match: Azam Youth vs JKT", player: "Bakari Mwamnyeto", duration: "92:00", views: 540, type: "Match" },
  { id: "v6", title: "Pre-season Fitness Test", player: "John Bocco", duration: "8:32", views: 410, type: "Training" },
];

export const MESSAGES = [
  { id: "m1", from: "Coach Mwita — Azam Youth", preview: "Interested in scheduling a trial for...", time: "2h", unread: true },
  { id: "m2", from: "Scout Kileo", preview: "Saw the highlights — impressive pace.", time: "1d", unread: true },
  { id: "m3", from: "Yanga Recruitment", preview: "Trial invitation: Saturday 10am", time: "3d", unread: false },
];

export const NOTIFICATIONS = [
  { id: "n1", text: "New trial invitation from Simba SC", time: "1h" },
  { id: "n2", text: "Your AI rating increased to 84", time: "5h" },
  { id: "n3", text: "3 scouts viewed your profile", time: "1d" },
];
