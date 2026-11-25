export const site = {
  name: "Joint Labourers In Christ Int'l",
  shortName: "JLICI",
  tagline: "Equipping the saints together for souls",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "+234 806 141 2818",
  email: "info@jointlabourers.org",
  description:
    "Joint Labourers In Christ Int'l cares for frontline missionaries through prayer, partnership and meeting real needs in the field.",
};

export const mainNav = [
  { href: "/needs", label: "Needs" },
  { href: "/pray", label: "Pray" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About", soon: true },
  { href: "/missionaries", label: "Missionaries", soon: true },
  { href: "/transit-housing", label: "Transit Housing", soon: true },
  { href: "/contact", label: "Contact", soon: true },
] as const;

export const categoryLabels: Record<string, string> = {
  MEDICAL: "Medical",
  EDUCATION: "Children's education",
  HOUSING: "Housing & rent",
  FOOD_UPKEEP: "Food & upkeep",
  TRANSPORT: "Transport",
  MINISTRY_EQUIPMENT: "Ministry equipment",
  OUTREACH: "Outreach",
  EMERGENCY: "Emergency relief",
  FAMILY_WELFARE: "Family welfare",
  OTHER: "Other",
};
