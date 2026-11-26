"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Clock,
  Link2,
  Loader2,
  Users,
} from "lucide-react";
import { getCategory } from "@/lib/categories";
import { formatLastCooked } from "@/lib/format";
import { formatIngredients, formatServingsLabel } from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";

export function RecipeCard({
  recipe,
  servings = recipe.servings,
  onQuickCook,
  quickCookPending,
}: {
  recipe: Recipe;
  servings?: number;
  onQuickCook: (id: string) => void;
  quickCookPending: boolean;
}) {
  const formattedIngredients = formatIngredients(
    recipe.ingredients,
    servings,
    recipe.servings,
  );
  const extraIngredients = Math.max(0, formattedIngredients.length - 3);

  return (
    <article className="flex flex-col overflow-hidden rounded-[1.6rem] border-2 border-ink bg-card shadow-[4px_4px_0_0_#2b2118] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2b2118]">
      <Link href={`/rezept/${recipe.id}`} className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-balance font-display text-2xl font-extrabold leading-tight">
            {recipe.name}
          </h3>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-ink-soft"
            strokeWidth={2.4}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {recipe.categories.map((slug) => {
            const category = getCategory(slug);
            if (!category) return null;
            return (
              <span
                key={slug}
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                style={{
                  backgroundColor: category.accentSoft,
                  color: category.accentDark,
                }}
              >
                {category.emoji} {category.label}
              </span>
            );
          })}
        </div>

        <ul className="mt-3 space-y-1 text-sm leading-snug text-ink-soft">
          {formattedIngredients.slice(0, 3).map((ingredient, index) => (
            <li key={`${ingredient}-${index}`} className="flex gap-2">
              <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" />
              <span className="min-w-0 truncate">{ingredient}</span>
            </li>
          ))}
        </ul>
        {extraIngredients > 0 ? (
          <p className="mt-1.5 pl-3.5 text-xs font-bold text-ink-soft">
            + {extraIngredients} weitere
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-[11px] font-bold text-ink-soft">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep/60 px-2.5 py-1">
            <Users className="h-3.5 w-3.5" strokeWidth={2.4} />
            {formatServingsLabel(servings)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep/60 px-2.5 py-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
            {formatLastCooked(recipe.lastCookedAt)}
          </span>
          {recipe.link ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep/60 px-2.5 py-1">
              <Link2 className="h-3.5 w-3.5" strokeWidth={2.4} />
              Rezept-Link
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t-2 border-ink/10 bg-cream/40 px-4 py-2.5">
        <span className="text-xs font-bold text-ink-soft">
          {recipe.cookCount === 0
            ? "noch nie gekocht"
            : `${recipe.cookCount}× gekocht`}
        </span>
        <button
          type="button"
          onClick={() => onQuickCook(recipe.id)}
          disabled={quickCookPending}
          className="btn btn-ghost px-3 py-2 text-xs"
        >
          {quickCookPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-olive" strokeWidth={3} />
          )}
          Gekocht
        </button>
      </div>
    </article>
  );
}
