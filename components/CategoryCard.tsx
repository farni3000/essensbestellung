import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/categories";

export function CategoryCard({
  category,
  count,
  index,
}: {
  category: Category;
  count: number;
  index: number;
}) {
  return (
    <div
      className="animate-rise"
      style={{ animationDelay: `${120 + index * 100}ms` }}
    >
      <Link
        href={`/k/${category.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-2 border-ink bg-card shadow-[6px_6px_0_0_#2b2118] transition-all duration-300 hover:-translate-y-2 hover:shadow-[10px_10px_0_0_#2b2118]"
        style={
          {
            "--accent": category.accent,
            "--accent-soft": category.accentSoft,
            "--accent-dark": category.accentDark,
          } as CSSProperties
        }
      >
        <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink bg-cream-deep">
          <Image
            src={category.image}
            alt={category.imageAlt}
            fill
            priority={index === 0}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
          />
          <span className="absolute left-4 top-4 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-extrabold shadow-[2px_2px_0_0_#2b2118]">
            {count === 0
              ? "Noch leer"
              : `${count} ${count === 1 ? "Rezept" : "Rezepte"}`}
          </span>
          <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-[var(--accent-soft)] text-2xl shadow-[2px_2px_0_0_#2b2118]">
            {category.emoji}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="font-display text-4xl font-extrabold leading-none">
            {category.label}
          </h2>
          <p className="mt-2 text-sm font-extrabold text-[var(--accent-dark)]">
            {category.tagline}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {category.description}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold">
            Rezepte ansehen
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2.8}
            />
          </span>
        </div>
      </Link>
    </div>
  );
}
