import { isCategorySlug } from "./categories";
import type { CategorySlug } from "./categories";
import type { Ingredient, RecipeInput } from "./types";

export type ValidationResult =
  | { ok: true; value: RecipeInput }
  | { ok: false; error: string };

const MAX_NAME_LENGTH = 120;
const MAX_LINK_LENGTH = 500;
const MAX_NOTES_LENGTH = 5000;
const MAX_INGREDIENT_LENGTH = 200;
const MAX_UNIT_LENGTH = 30;
const MAX_INGREDIENTS = 100;
const MAX_AMOUNT = 10000;
const MAX_SERVINGS = 20;

function normalizeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Returns `undefined` for an invalid value, `null` for "no amount" and a
 * positive number otherwise.
 */
function parseAmount(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    if (value <= 0 || value > MAX_AMOUNT) return undefined;
    return value;
  }

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;

  const fraction = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator === 0
    ) {
      return undefined;
    }
    const amount = numerator / denominator;
    if (amount <= 0 || amount > MAX_AMOUNT) return undefined;
    return amount;
  }

  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return undefined;

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    return undefined;
  }
  return amount;
}

function parseServings(value: unknown): number | null {
  if (value === null || value === undefined) return 4;
  if (value === "") return null;

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim().replace(",", "."))
        : Number.NaN;

  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_SERVINGS
  ) {
    return null;
  }

  return parsed;
}

function validateIngredient(raw: unknown): Ingredient | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "Ungültige Zutat." };
  }

  const data = raw as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return { error: "Trag bei jeder Zutat einen Namen ein." };
  if (name.length > MAX_INGREDIENT_LENGTH) {
    return { error: "Eine Zutat ist zu lang (max. 200 Zeichen)." };
  }

  const unit = typeof data.unit === "string" ? data.unit.trim() : "";
  if (unit.length > MAX_UNIT_LENGTH) {
    return { error: "Eine Einheit ist zu lang (max. 30 Zeichen)." };
  }

  const amount = parseAmount(data.amount);
  if (amount === undefined) {
    return {
      error: "Eine Menge ist ungültig. Bitte eine Zahl wie 4 oder 0,5 eintragen.",
    };
  }

  return { amount, unit, name };
}

export function validateRecipeInput(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Ungültige Eingabe." };
  }

  const data = raw as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return { ok: false, error: "Bitte gib dem Rezept einen Namen." };
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "Der Name ist zu lang (max. 120 Zeichen)." };
  }

  const rawCategories = Array.isArray(data.categories) ? data.categories : [];
  const categories: CategorySlug[] = [];
  for (const entry of rawCategories) {
    if (typeof entry === "string" && isCategorySlug(entry) && !categories.includes(entry)) {
      categories.push(entry);
    }
  }
  if (categories.length === 0) {
    return { ok: false, error: "Wähle mindestens eine Kategorie aus." };
  }

  const servings = parseServings(data.servings);
  if (servings === null) {
    return {
      ok: false,
      error: "Die Personenzahl muss eine ganze Zahl zwischen 1 und 20 sein.",
    };
  }

  const rawIngredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const ingredients: Ingredient[] = [];
  for (const entry of rawIngredients) {
    if (typeof entry === "object" && entry !== null) {
      const candidate = entry as Record<string, unknown>;
      const hasContent =
        (typeof candidate.name === "string" && candidate.name.trim() !== "") ||
        (typeof candidate.unit === "string" && candidate.unit.trim() !== "") ||
        (candidate.amount !== null &&
          candidate.amount !== undefined &&
          String(candidate.amount).trim() !== "");

      if (!hasContent) continue;

      const result = validateIngredient(entry);
      if ("error" in result) return { ok: false, error: result.error };
      ingredients.push(result);
      continue;
    }

    if (typeof entry === "string" && entry.trim()) {
      const result = validateIngredient({ name: entry, amount: null, unit: "" });
      if ("error" in result) return { ok: false, error: result.error };
      ingredients.push(result);
    }
  }
  if (ingredients.length === 0) {
    return { ok: false, error: "Trag mindestens eine Zutat ein." };
  }
  if (ingredients.length > MAX_INGREDIENTS) {
    return { ok: false, error: "Zu viele Zutaten (max. 100)." };
  }

  const notes = typeof data.notes === "string" ? data.notes.trim() : "";
  if (notes.length > MAX_NOTES_LENGTH) {
    return { ok: false, error: "Die Zubereitung ist zu lang (max. 5000 Zeichen)." };
  }

  const rawLink = typeof data.link === "string" ? data.link.trim() : "";
  if (rawLink.length > MAX_LINK_LENGTH) {
    return { ok: false, error: "Der Link ist zu lang." };
  }
  const link = normalizeLink(rawLink);
  if (link === null) {
    return { ok: false, error: "Der Link ist keine gültige Web-Adresse." };
  }

  return {
    ok: true,
    value: { name, link, notes, categories, servings, ingredients },
  };
}
