export const CATEGORY_SLUGS = ["normal", "zu-dritt", "alleine"] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export type Category = {
  slug: CategorySlug;
  label: string;
  tagline: string;
  description: string;
  image: string;
  imageAlt: string;
  emoji: string;
  accent: string;
  accentSoft: string;
  accentDark: string;
  defaultServings: number;
};

export const CATEGORIES: readonly Category[] = [
  {
    slug: "normal",
    label: "Normal",
    tagline: "Für den ganz normalen Hunger",
    description: "Alltagsküche, die einfach satt macht.",
    image: "/images/categories/normal.svg",
    imageAlt: "Illustration eines gedeckten Tisches mit zwei Tellern Pasta",
    emoji: "🍝",
    accent: "#E8503A",
    accentSoft: "#F9D9D2",
    accentDark: "#A93222",
    defaultServings: 4,
  },
  {
    slug: "zu-dritt",
    label: "Zu dritt",
    tagline: "Wenn noch zwei mitessen",
    description: "Gerichte, bei denen drei satt werden.",
    image: "/images/categories/zu-dritt.svg",
    imageAlt: "Illustration eines runden Tisches mit drei Tellern",
    emoji: "🍲",
    accent: "#6B7A3A",
    accentSoft: "#E9EDD3",
    accentDark: "#46521E",
    defaultServings: 3,
  },
  {
    slug: "alleine",
    label: "Alleine",
    tagline: "Nur für mich",
    description: "Kleine Portionen, große Lust.",
    image: "/images/categories/alleine.svg",
    imageAlt: "Illustration einer gemütlichen Portion für eine Person",
    emoji: "🍜",
    accent: "#D99A12",
    accentSoft: "#FBEAC3",
    accentDark: "#8A6205",
    defaultServings: 1,
  },
] as const;

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}
