export type TrainingPackage = {
  id: string;
  name: string;
  shortName: string;
  sessions: number;
  price: number;
  deposit: number;
  featured?: boolean;
  eyebrow: string;
  description: string;
  bullets: string[];
};

export const packages: TrainingPackage[] = [
  {
    id: "first-clutch-up",
    name: "First Clutch-Up",
    shortName: "First Clutch-Up",
    sessions: 1,
    price: 120,
    deposit: 20,
    eyebrow: "LEVEL 01",
    description: "A private fundamentals session built around safe, repeatable clutch-up technique.",
    bullets: ["1 private session", "Fundamentals", "Clutch-up technique", "Rear-brake introduction"],
  },
  {
    id: "bp-starter",
    name: "BP Starter — 3 Sessions",
    shortName: "BP Starter",
    sessions: 3,
    price: 325,
    deposit: 20,
    eyebrow: "LEVEL 02",
    description: "Progressive one-on-one coaching with video feedback so each session builds on the last.",
    bullets: ["3 private sessions", "Progressive training", "Video review", "Technique refinement"],
  },
  {
    id: "balance-point-challenge",
    name: "Balance Point Challenge — 5 Sessions",
    shortName: "Balance Point Challenge",
    sessions: 5,
    price: 500,
    deposit: 20,
    featured: true,
    eyebrow: "THE CHALLENGE",
    description: "Five sessions. One goal. Find your balance point. Trust the process.",
    bullets: ["5 private sessions", "Full progression", "Technique correction", "Video review", "BPC certificate when standards are met"],
  },
  {
    id: "bpc-complete",
    name: "BPC Complete — 8 Sessions",
    shortName: "BPC Complete",
    sessions: 8,
    price: 750,
    deposit: 20,
    eyebrow: "LEVEL 04",
    description: "The full progression track from balance-point development into consistency, brake control, and longer controlled wheelies.",
    bullets: ["8 private sessions", "Balance point → consistency", "Brake control", "Longer controlled wheelies", "Advanced technique"],
  },
];

export function getPackage(id: string) {
  return packages.find((pkg) => pkg.id === id);
}
