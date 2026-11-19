"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Clock,
  Dices,
  ExternalLink,
  Loader2,
  Undo2,
  X,
} from "lucide-react";
import { CopyIngredientsButton } from "@/components/CopyIngredientsButton";
import type { Category } from "@/lib/categories";
import { getCategory } from "@/lib/categories";
import { formatLastCooked } from "@/lib/format";
import type { Recipe } from "@/lib/types";

export function SuggestionModal({
  category,
  recipe,
  cooked,
  rolling,
  cookPending,
  onClose,
  onReroll,
  onCooked,
  onUndo,
}: {
  category: Category;
  recipe: Recipe;
  cooked: boolean;
  rolling: boolean;
  cookPending: boolean;
  onClose: () => void;
  onReroll: () => void;
  onCooked: () => void;
  onUndo: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Vorschlag schließen"
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestion-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border-2 border-ink bg-card shadow-[8px_8px_0_0_#2b2118] outline-none animate-pop sm:rounded-[2rem]"
      >
        <div className="relative h-36 shrink-0 overflow-hidden border-b-2 border-ink sm:h-44">
          <Image
            src={category.image}
            alt=""
            fill
            sizes="(min-width: 640px) 42rem, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border-2 border-ink bg-card px-3 py-1 text-xs font-extrabold shadow-[2px_2px_0_0_#2b2118]">
            Dein Vorschlag
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-card text-ink shadow-[2px_2px_0_0_#2b2118] transition hover:-translate-y-0.5"
            aria-label="Dialog schließen"
          >
            <X className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="chip border-transparent"
              style={{
                backgroundColor: category.accentSoft,
                color: category.accentDark,
              }}
            >
              {category.emoji} {category.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep/70 px-2.5 py-1 text-[11px] font-extrabold text-ink-soft">
              <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
              {formatLastCooked(recipe.lastCookedAt)}
            </span>
            {recipe.cookCount > 0 ? (
              <span className="text-[11px] font-bold text-ink-soft">
                {recipe.cookCount}× gekocht
              </span>
            ) : null}
          </div>

          <h2
            id="suggestion-title"
            className="mt-3 text-balance font-display text-4xl font-extrabold leading-none sm:text-5xl"
          >
            {recipe.name}
          </h2>

          <div className="mt-6 rounded-2xl border-2 border-ink/10 bg-cream/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink-soft">
                Zutaten
              </h3>
              <CopyIngredientsButton
                ingredients={recipe.ingredients}
                className="btn btn-secondary px-3 py-2 text-xs"
                label="Für WhatsApp kopieren"
              />
            </div>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient}-${index}`}
                  className="flex gap-2 text-sm leading-snug"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category.accent }}
                  />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {recipe.notes ? (
            <section className="mt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink-soft">
                Zubereitung
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {recipe.notes}
              </p>
            </section>
          ) : null}

          {recipe.categories.length > 1 ? (
            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-ink-soft">
                Auch in:
              </span>
              {recipe.categories
                .filter((slug) => slug !== category.slug)
                .map((slug) => {
                  const other = getCategory(slug);
                  if (!other) return null;
                  return (
                    <span
                      key={slug}
                      className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                      style={{
                        backgroundColor: other.accentSoft,
                        color: other.accentDark,
                      }}
                    >
                      {other.label}
                    </span>
                  );
                })}
            </div>
          ) : null}

          {recipe.link ? (
            <a
              href={recipe.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary mt-5 text-sm"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2.4} />
              Zum Originalrezept
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
            </a>
          ) : null}
        </div>

        <div className="shrink-0 border-t-2 border-ink/10 bg-card/95 p-4 backdrop-blur sm:p-5">
          {cooked ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-olive/25 bg-olive/10 px-4 py-3 text-sm font-extrabold text-olive-dark">
                <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
                Als gekocht markiert – kommt so bald nicht wieder.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onUndo}
                  className="btn btn-secondary flex-1"
                >
                  <Undo2 className="h-4 w-4" strokeWidth={2.4} />
                  Doch nicht gekocht
                </button>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Schließen
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCooked}
                disabled={cookPending}
                className="btn btn-primary min-w-[10rem] flex-1 py-3.5"
              >
                {cookPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" strokeWidth={3} />
                )}
                Gekocht!
              </button>
              <button
                type="button"
                onClick={onReroll}
                disabled={rolling}
                className="btn btn-secondary"
              >
                {rolling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Dices className="h-4 w-4" strokeWidth={2.6} />
                )}
                Nochmal
              </button>
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Später
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
