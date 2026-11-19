import Link from "next/link";
import { Dices, Sparkles } from "lucide-react";
import { Brand } from "@/components/Brand";
import { CategoryCard } from "@/components/CategoryCard";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/recipes";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const counts = getCategoryCounts();
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Brand />
        <Link
          href="/rezept/neu"
          className="btn btn-secondary px-3 text-sm sm:px-5"
          aria-label="Neues Rezept"
        >
          <Sparkles className="h-4 w-4 text-mustard-dark" strokeWidth={2.6} />
          <span className="hidden sm:inline">Neues Rezept</span>
        </Link>
      </header>

      <section className="relative mx-auto mt-12 max-w-4xl text-center sm:mt-16">
        <span
          aria-hidden="true"
          className="animate-float-soft absolute -left-2 top-6 hidden text-4xl sm:block"
        >
          🍅
        </span>
        <span
          aria-hidden="true"
          className="animate-float-soft absolute -right-1 top-16 hidden text-3xl [animation-delay:1.4s] sm:block"
        >
          🥬
        </span>
        <span
          aria-hidden="true"
          className="animate-float-soft absolute -right-6 top-0 hidden text-2xl [animation-delay:2.2s] md:block"
        >
          🧄
        </span>

        <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] shadow-[2px_2px_0_0_#2b2118] animate-rise">
          <span className="h-2 w-2 rounded-full bg-tomato" />
          Die Kochidee-Maschine
        </div>

        <div className="relative mt-6 pb-4">
          <h1 className="animate-rise whitespace-nowrap font-display text-[clamp(2.05rem,9.4vw,7.6rem)] font-extrabold leading-[0.92] tracking-tight [animation-delay:80ms]">
            Essens<span className="text-tomato">bestellung</span>
          </h1>
          <svg
            aria-hidden="true"
            viewBox="0 0 600 26"
            fill="none"
            className="absolute bottom-0 left-1/2 h-4 w-[72%] -translate-x-1/2 text-mustard sm:h-5"
            preserveAspectRatio="none"
          >
            <path
              d="M5 17C92 6 187 22 302 13C416 4 511 19 595 8"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="mx-auto mt-5 max-w-xl text-balance text-base font-medium text-ink-soft animate-rise [animation-delay:160ms] sm:text-lg">
          Was kochen wir heute? Wähle die Runde – und lass den Würfel entscheiden,
          was zuletzt viel zu lange nicht auf dem Teller war.
        </p>
      </section>

      <section
        aria-label="Kategorien"
        className="mt-12 grid gap-6 sm:mt-16 md:grid-cols-3"
      >
        {CATEGORIES.map((category, index) => (
          <CategoryCard
            key={category.slug}
            category={category}
            count={counts[category.slug]}
            index={index}
          />
        ))}
      </section>

      <section className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-3 text-center sm:mt-12">
        <div className="flex items-center gap-2 rounded-full border-2 border-ink/15 bg-card/70 px-4 py-2 text-sm font-bold text-ink-soft">
          <Dices className="h-4 w-4 text-tomato" strokeWidth={2.8} />
          {total === 0
            ? "Noch keine Rezepte – leg einfach dein erstes an."
            : "Vorschläge sind gewichtet: Lange nicht gekocht kommt zuerst, das letzte Gericht pausiert."}
        </div>
        {total === 0 ? (
          <Link href="/rezept/neu" className="btn btn-primary sm:hidden">
            <Sparkles className="h-4 w-4" strokeWidth={2.6} />
            Erstes Rezept anlegen
          </Link>
        ) : null}
      </section>
    </main>
  );
}
