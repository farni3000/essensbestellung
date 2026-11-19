"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { saveRecipeAction } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import type { CategorySlug } from "@/lib/categories";
import type { Recipe } from "@/lib/types";

type IngredientRow = { key: string; value: string };

function createKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function RecipeForm({
  initial,
  mode,
  defaultCategory,
  onSaved,
  onCancel,
}: {
  initial?: Recipe;
  mode: "create" | "edit";
  defaultCategory?: CategorySlug;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [categories, setCategories] = useState<CategorySlug[]>(() => {
    if (initial && initial.categories.length > 0) return initial.categories;
    if (defaultCategory) return [defaultCategory];
    return [];
  });
  const [rows, setRows] = useState<IngredientRow[]>(() => {
    const values =
      initial && initial.ingredients.length > 0
        ? initial.ingredients
        : ["", "", ""];
    return values.map((value) => ({ key: createKey(), value }));
  });
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleCategory(slug: CategorySlug) {
    setCategories((previous) =>
      previous.includes(slug)
        ? previous.filter((entry) => entry !== slug)
        : [...previous, slug],
    );
  }

  function addRow(at?: number) {
    const key = createKey();
    setRows((previous) => {
      const next = [...previous];
      next.splice(at ?? next.length, 0, { key, value: "" });
      return next;
    });
    setFocusKey(key);
  }

  function removeRow(key: string) {
    setRows((previous) => {
      if (previous.length === 1) return [{ key: createKey(), value: "" }];
      return previous.filter((row) => row.key !== key);
    });
  }

  function updateRow(key: string, value: string) {
    setRows((previous) =>
      previous.map((row) => (row.key === key ? { ...row, value } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Bitte gib dem Rezept einen Namen.");
      return;
    }

    setPending(true);
    const result = await saveRecipeAction(initial?.id ?? null, {
      name,
      link,
      notes,
      categories,
      ingredients: rows.map((row) => row.value),
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (mode === "create") {
      router.push(`/rezept/${result.id}`);
      router.refresh();
      return;
    }

    onSaved?.(result.id);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="card-hard p-5 sm:p-7">
        <div>
          <label htmlFor="recipe-name" className="label">
            Name
          </label>
          <input
            id="recipe-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Cremige Tomatenpasta"
            className="field text-lg font-bold"
            autoFocus={mode === "create"}
            maxLength={120}
          />
        </div>

        <fieldset className="mt-5">
          <legend className="label">Kategorien</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const active = categories.includes(category.slug);
              return (
                <button
                  key={category.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(category.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-2 text-sm font-extrabold transition-all duration-150"
                  style={{
                    backgroundColor: active ? category.accentDark : "#FFFDF8",
                    color: active ? "#FFFDF8" : "#2B2118",
                    boxShadow: active ? "2px 2px 0 0 #2B2118" : "none",
                  }}
                >
                  <span>{category.emoji}</span>
                  {category.label}
                  {active ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="card-hard p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Zutaten</h2>
            <p className="text-sm text-ink-soft">
              Menge einfach direkt in die Zeile schreiben.
            </p>
          </div>
          <span className="text-xs font-bold text-ink-soft">
            Enter fügt eine Zeile hinzu
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {rows.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-deep text-xs font-extrabold text-ink-soft"
              >
                {index + 1}
              </span>
              <input
                value={row.value}
                onChange={(event) => updateRow(row.key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addRow(index + 1);
                  }
                }}
                placeholder={
                  ["z. B. 4 Möhren", "1 Zwiebel", "200 ml Sahne"][index % 3]
                }
                aria-label={`Zutat ${index + 1}`}
                className="field"
                autoFocus={focusKey === row.key}
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="btn btn-ghost btn-icon shrink-0 text-ink-soft"
                aria-label={`Zutat ${index + 1} entfernen`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addRow()}
          className="btn btn-secondary mt-4 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.8} />
          Zutat hinzufügen
        </button>
      </section>

      <section className="card-hard space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="recipe-link" className="label">
            Link zum Rezept <span className="normal-case">(optional)</span>
          </label>
          <input
            id="recipe-link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://www.chefkoch.de/rezepte/..."
            className="field"
            inputMode="url"
            maxLength={500}
          />
        </div>

        <div>
          <label htmlFor="recipe-notes" className="label">
            Zubereitung / Notizen <span className="normal-case">(optional)</span>
          </label>
          <textarea
            id="recipe-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            placeholder="Was muss ich beim Kochen beachten?"
            className="field resize-y"
            maxLength={5000}
          />
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border-2 border-tomato/30 bg-tomato/10 px-4 py-3 text-sm font-bold text-tomato-dark"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            disabled={pending}
          >
            <X className="h-4 w-4" strokeWidth={2.6} />
            Abbrechen
          </button>
        ) : (
          <Link href="/" className="btn btn-ghost">
            <X className="h-4 w-4" strokeWidth={2.6} />
            Abbrechen
          </Link>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" strokeWidth={2.6} />
          )}
          {pending
            ? "Speichere …"
            : mode === "create"
              ? "Rezept speichern"
              : "Änderungen speichern"}
        </button>
      </div>
    </form>
  );
}
