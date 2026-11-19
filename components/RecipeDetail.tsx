"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { CopyIngredientsButton } from "@/components/CopyIngredientsButton";
import { RecipeForm } from "@/components/RecipeForm";
import { Toast } from "@/components/Toast";
import { deleteRecipeAction, markCookedAction, undoCookAction } from "@/lib/actions";
import { getCategory } from "@/lib/categories";
import { celebrate } from "@/lib/celebrate";
import { formatLastCooked } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [override, setOverride] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState(false);
  const [cookPending, setCookPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Optimistic result of the last cook action, until the refreshed props
  // (or an explicit reset after editing) take over again.
  const current = override ?? recipe;

  const primarySlug = current.categories[0];
  const primaryCategory = primarySlug ? getCategory(primarySlug) : undefined;
  const backHref = primarySlug ? `/k/${primarySlug}` : "/";

  async function handleCooked() {
    setCookPending(true);
    const result = await markCookedAction(current.id);
    setCookPending(false);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    setOverride(result.recipe);
    void celebrate();
    setToast("Gekocht! Guten Appetit.");
    router.refresh();
  }

  async function handleUndo() {
    const result = await undoCookAction(current.id);
    if (!result.ok) {
      setToast(result.error);
      return;
    }

    if (result.recipe) setOverride(result.recipe);
    setToast(
      result.undone
        ? "Doch nicht gekocht – ist wieder voll in der Auswahl."
        : "Es gibt keinen Kochvorgang zum Rückgängigmachen.",
    );
    router.refresh();
  }

  async function handleDelete() {
    setDeletePending(true);
    const result = await deleteRecipeAction(current.id);
    setDeletePending(false);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between gap-3">
        <Brand compact />
        <Link href={backHref} className="btn btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" strokeWidth={2.6} />
          Zurück
        </Link>
      </header>

      {editing ? (
        <section className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="chip bg-mustard/30">Bearbeiten</span>
              <h1 className="mt-3 font-display text-4xl font-extrabold leading-none sm:text-5xl">
                {current.name}
              </h1>
            </div>
          </div>
          <div className="mt-7">
            <RecipeForm
              initial={current}
              mode="edit"
              onSaved={() => {
                setOverride(null);
                setEditing(false);
                setToast("Rezept gespeichert.");
                router.refresh();
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        </section>
      ) : (
        <>
          <section className="mt-8 overflow-hidden rounded-[2rem] border-2 border-ink bg-card shadow-[6px_6px_0_0_#2b2118]">
            <div className="relative h-36 border-b-2 border-ink sm:h-48">
              {primaryCategory ? (
                <Image
                  src={primaryCategory.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60rem, 100vw"
                  className="object-cover"
                  priority
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 flex flex-wrap gap-1.5">
                {current.categories.map((slug) => {
                  const category = getCategory(slug);
                  if (!category) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/k/${slug}`}
                      className="rounded-full border-2 border-ink bg-card px-2.5 py-1 text-[11px] font-extrabold shadow-[2px_2px_0_0_#2b2118] transition hover:-translate-y-0.5"
                    >
                      {category.emoji} {category.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-balance font-display text-4xl font-extrabold leading-[0.95] sm:text-6xl">
                    {current.name}
                  </h1>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cream-deep/70 px-3 py-1.5 text-xs font-extrabold text-ink-soft">
                    <Clock className="h-4 w-4" strokeWidth={2.4} />
                    {formatLastCooked(current.lastCookedAt)}
                    {current.cookCount > 0
                      ? ` · ${current.cookCount}× gekocht`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CopyIngredientsButton ingredients={current.ingredients} />
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="btn btn-secondary"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2.6} />
                    Bearbeiten
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
            <section className="card-hard p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold">Zutaten</h2>
                <span className="chip">
                  {current.ingredients.length}{" "}
                  {current.ingredients.length === 1 ? "Zutat" : "Zutaten"}
                </span>
              </div>
              <ul className="mt-3 divide-y divide-ink/10">
                {current.ingredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient}-${index}`}
                    className="flex items-baseline gap-3 py-2.5 text-[15px]"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: primaryCategory?.accent ?? "#E8503A",
                      }}
                    />
                    {ingredient}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="space-y-5">
              <section
                className="card-hard p-5 sm:p-6"
                style={{
                  backgroundColor: primaryCategory?.accentSoft ?? "#FFFDF8",
                }}
              >
                <h2 className="font-display text-2xl font-extrabold">
                  Schon gekocht?
                </h2>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  Ein Klick und das Rezept macht erst mal Pause.
                </p>
                <button
                  type="button"
                  onClick={handleCooked}
                  disabled={cookPending}
                  className="btn btn-primary mt-4 w-full py-3.5"
                >
                  {cookPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  )}
                  Gekocht!
                </button>
                {current.cookCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="btn btn-ghost mt-2 w-full text-sm"
                  >
                    <Undo2 className="h-4 w-4" strokeWidth={2.4} />
                    Doch nicht gekocht
                  </button>
                ) : null}
              </section>

              {current.link ? (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-soft flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-ink"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-deep">
                    <ExternalLink className="h-5 w-5" strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                      Originalrezept
                    </span>
                    <span className="block truncate text-sm font-bold">
                      {current.link}
                    </span>
                  </span>
                </a>
              ) : null}

              {current.notes ? (
                <section className="card-soft p-5">
                  <h2 className="font-display text-2xl font-extrabold">
                    Zubereitung
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {current.notes}
                  </p>
                </section>
              ) : null}

              <section className="px-1">
                {confirmDelete ? (
                  <div className="rounded-2xl border-2 border-tomato/30 bg-tomato/10 p-4">
                    <p className="text-sm font-extrabold text-tomato-dark">
                      Rezept wirklich löschen?
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deletePending}
                        className="btn btn-primary text-sm"
                      >
                        {deletePending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                        )}
                        Ja, löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="btn btn-ghost text-sm"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="btn btn-ghost text-sm text-tomato-dark"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                    Rezept löschen
                  </button>
                )}
              </section>
            </aside>
          </div>
        </>
      )}

      {toast ? <Toast message={toast} onDone={() => setToast(null)} /> : null}
    </main>
  );
}
