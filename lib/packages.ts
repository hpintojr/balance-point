export type TrainingPackage = {
  id: string;
  name: string;
  shortName: string;
  sessions: number;
  durationMinutes: number;
  price: number;
  deposit: number;
  featured?: boolean;
  eyebrow: string;
  description: string;
  bullets: string[];
};

export const packages: TrainingPackage[] = [
  {
    id: "standard-private-lesson",
    name: "1hr Standard Private Lesson",
    shortName: "Standard Private Lesson",
    sessions: 1,
    durationMinutes: 60,
    price: 170,
    deposit: 20,
    featured: true,
    eyebrow: "MOST BOOKED",
    description: "One hour of one-on-one coaching. Ride the school's R3 trainer bike or your own motorcycle — your choice at booking.",
    bullets: ["60-minute private session", "Use the school's R3 or your own bike", "Clutch-up, rear-brake, balance-point coaching", "Video feedback"],
  },
  {
    id: "personal-bike-express",
    name: "1hr Personal-Bike Express Session",
    shortName: "Personal-Bike Express Session",
    sessions: 1,
    durationMinutes: 60,
    price: 120,
    deposit: 20,
    eyebrow: "BRING YOUR OWN BIKE",
    description: "A focused one-hour session on your own motorcycle — a lower rate since you're supplying the bike.",
    bullets: ["60-minute private session", "Ride your own motorcycle", "Same one-on-one coaching", "Best rate for riders who already own a bike"],
  },
  {
    id: "extended-personal-bike-session",
    name: "2.5hr Extended Personal-Bike Session",
    shortName: "Extended Personal-Bike Session",
    sessions: 1,
    durationMinutes: 150,
    price: 250,
    deposit: 20,
    eyebrow: "GO DEEPER",
    description: "Two and a half hours of extended coaching time on your own motorcycle for riders ready to put in extra reps.",
    bullets: ["150-minute private session", "Ride your own motorcycle", "Extended reps and correction time", "Most coaching time per session"],
  },
];

export function getPackage(id: string) {
  return packages.find((pkg) => pkg.id === id);
}
