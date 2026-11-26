"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dices, Loader2, Plus, Sparkles } from "lucide-react";
import { Brand } from "@/components/Brand";
import { RecipeCard } from "@/components/RecipeCard";
import { SuggestionModal } from "@/components/SuggestionModal";
import { Toast } from "@/components/Toast";
import { markCookedAction, suggestAction, undoCookAction } from "@/lib/actions";
import type { Category } from "@/lib/categories";
import { celebrate } from "@/lib/celebrate";
import type { Recipe } from "@/lib/types";

export function CategoryView({
  category,
  recipes,
}: {
  category: Category;
  recipes: Recipe[];
}) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<Recipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cooked, setCooked] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [cookPending, setCookPending] = useState(false);
  const [quickCookId, setQuickCookId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function roll(excludeCurrent: boolean, openModal: boolean) {
    if (recipes.length === 0) {
      setToast("Leg zuerst ein Rezept in dieser Kategorie an.");
      return;
    }

    setRolling(true);
    const excludeIds =
      excludeCurrent && suggestion ? [suggestion.id] : [];
    const next = await suggestAction(category.slug, excludeIds);
    setRolling(false);

    if (!next) {
      setToast("Ich habe gerade keine Alternative gefunden.");
      return;
    }

    if (excludeCurrent && suggestion && next.id === suggestion.id) {
      setToast("Das ist gerade das einzige Rezept in dieser Kategorie.");
    }

    setSuggestion(next);
    setCooked(false);
    if (openModal) setModalOpen(true);
  }

  async function handleCooked() {
    if (!suggestion) return;
    setCookPending(true);
    const result = await markCookedAction(suggestion.id);
    setCookPending(false);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    setSuggestion(result.recipe);
    setCooked(true);
    void celebrate();
    setToast(`„${result.recipe.name}“ als gekocht markiert.`);
    router.refresh();
  }

  async function handleUndo() {
    if (!suggestion) return;
    const result = await undoCookAction(suggestion.id);
    if (!result.ok) {
      setToast(result.error);
      return;
    }

    if (result.recipe) setSuggestion(result.recipe);
    setCooked(false);
    setToast("Doch nicht gekocht – ist wieder voll in der Auswahl.");
    router.refresh();
  }

  async function handleQuickCook(id: string) {
    setQuickCookId(id);
    const result = await markCookedAction(id);
    setQuickCookId(null);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    void celebrate();
    setToast(`„${result.recipe.name}“ als gekocht markiert.`);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Brand compact />
        <Link href="/" className="btn btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" strokeWidth={2.6} />
          Alle Kategorien
        </Link>
      </header>

      <section className="mt-8 flex flex-wrap items-end justify-between gap-5 sm:mt-10">
        <div>
          <span
            className="chip border-transparent"
            style={{
              backgroundColor: category.accentSoft,
              color: category.accentDark,
            }}
          >
            {category.emoji} Kategorie
          </span>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-none sm:text-6xl">
            {category.label}
          </h1>
          <p className="mt-2 font-medium text-ink-soft">{category.tagline}</p>
        </div>
        <Link
          href={`/rezept/neu?kategorie=${category.slug}`}
          className="btn btn-secondary"
        >
          <Plus className="h-4 w-4" strokeWidth={2.8} />
          Neues Rezept
        </Link>
      </section>

      <section
        className="relative mt-7 overflow-hidden rounded-[2rem] border-2 border-ink p-6 shadow-[6px_6px_0_0_#2b2118] sm:p-8"
        style={{ backgroundColor: category.accentSoft }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-8 rotate-12 text-[9rem] opacity-[0.09]"
        >
          🎲
        </span>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Keine Lust auf Entscheidungen?
            </p>
            <p className="mt-1 max-w-md text-sm font-medium text-ink-soft">
              Der Würfel bevorzugt, was lange nicht dran war – das zuletzt
              gekochte Gericht pausiert.
            </p>
          </div>
          <button
            type="button"
            onClick={() => roll(false, true)}
            disabled={rolling || recipes.length === 0}
            title={
              recipes.length === 0
                ? "Leg zuerst ein Rezept in dieser Kategorie an."
                : undefined
            }
            className="btn btn-primary w-full px-6 py-4 text-base sm:w-auto"
          >
            {rolling ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Dices className="h-5 w-5" strokeWidth={2.6} />
            )}
            {rolling ? "Würfle …" : "Vorschlag würfeln"}
          </button>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="recipe-list-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft">
              Deine Sammlung
            </p>
            <h2
              id="recipe-list-heading"
              className="mt-1 font-display text-3xl font-extrabold"
            >
              Alle Rezepte
            </h2>
          </div>
          <span className="chip">
            {recipes.length} {recipes.length === 1 ? "Rezept" : "Rezepte"}
          </span>
        </div>

        {recipes.length === 0 ? (
          <div className="card-hard mt-5 px-6 py-12 text-center sm:py-16">
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-ink text-4xl shadow-[3px_3px_0_0_#2b2118]"
              style={{ backgroundColor: category.accentSoft }}
            >
              {category.emoji}
            </div>
            <h3 className="mt-5 font-display text-3xl font-extrabold">
              Noch ganz schön leer hier
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">
              Leg dein erstes Rezept für „{category.label}“ an – mit Zutaten,
              Link und allem, was du brauchst.
            </p>
            <Link
              href={`/rezept/neu?kategorie=${category.slug}`}
              className="btn btn-primary mt-6"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.6} />
              Erstes Rezept anlegen
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                servings={category.defaultServings}
                onQuickCook={handleQuickCook}
                quickCookPending={quickCookId === recipe.id}
              />
            ))}
          </div>
        )}
      </section>

      {modalOpen && suggestion ? (
        <SuggestionModal
          category={category}
          recipe={suggestion}
          cooked={cooked}
          rolling={rolling}
          cookPending={cookPending}
          onClose={() => setModalOpen(false)}
          onReroll={() => roll(true, false)}
          onCooked={handleCooked}
          onUndo={handleUndo}
        />
      ) : null}

      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}
