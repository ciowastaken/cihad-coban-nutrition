export const membershipTiers = ["standard", "pro", "clinic"] as const;

export type MembershipTier = (typeof membershipTiers)[number];

export type MembershipPlan = {
  tier: MembershipTier;
  name: string;
  price: number;
  description: string;
  features: string[];
};

export const membershipPlans: Record<MembershipTier, MembershipPlan> = {
  standard: {
    tier: "standard",
    name: "Standart",
    price: 349,
    description: "Temel takip ve düzenli program kullanımı için.",
    features: ["Ayda 2 yeni program", "PDF indirme", "Öğün, kilo ve su takibi"],
  },
  pro: {
    tier: "pro",
    name: "PRO",
    price: 699,
    description: "Daha sık plan oluşturan ve ayrıntılı analiz isteyenler için.",
    features: ["Ayda 20 yeni program", "Gelişmiş makro raporları", "Öncelikli destek"],
  },
  clinic: {
    tier: "clinic",
    name: "Klinik",
    price: 1299,
    description: "Diyetisyenle yoğun çalışan ve sınırsız kullanım isteyenler için.",
    features: ["Sınırsız program", "Özel program atama", "Öncelikli diyetisyen iletişimi"],
  },
};

export function isMembershipTier(value: string | undefined): value is MembershipTier {
  return value === "standard" || value === "pro" || value === "clinic";
}

