import type { Ingredient } from "./types";

const WEIGHT_UNITS = new Set(["g", "kg"]);
const VOLUME_UNITS = new Set(["ml", "l"]);
const SPOON_UNITS = new Set(["el", "tl", "prise", "prisen", "msp"]);
const PACKAGE_UNITS = new Set([
  "dose",
  "dosen",
  "becher",
  "packung",
  "packungen",
  "päckchen",
  "glas",
  "gläser",
  "tube",
  "tuben",
  "bund",
  "bünde",
  "stange",
  "stangen",
  "zehe",
  "zehen",
]);

const FRACTIONS: Record<string, string> = {
  "0.25": "¼",
  "0.5": "½",
  "0.75": "¾",
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Rounds a scaled amount in a unit-aware way. The minimum stays above zero so
 * a tiny portion never shows "0 Möhren" or "0 Becher Sahne".
 */
export function roundScaledAmount(amount: number, unit: string): number {
  const normalized = normalizeUnit(unit);

  if (WEIGHT_UNITS.has(normalized) || VOLUME_UNITS.has(normalized)) {
    if (normalized === "kg" || normalized === "l") {
      return Math.max(0.01, roundTo(amount, 0.01));
    }
    if (amount >= 20) return Math.max(1, roundTo(amount, 5));
    return Math.max(1, roundTo(amount, 1));
  }

  if (SPOON_UNITS.has(normalized) || PACKAGE_UNITS.has(normalized)) {
    return Math.max(0.25, roundTo(amount, 0.25));
  }

  return Math.max(0.5, roundTo(amount, 0.5));
}

export function scaleAmount(
  amount: number,
  fromServings: number,
  toServings: number,
  unit = "",
): number {
  if (amount <= 0) return amount;
  if (fromServings === toServings) return amount;

  const safeFrom = fromServings > 0 ? fromServings : 1;
  const safeTo = toServings > 0 ? toServings : 1;
  return roundScaledAmount((amount * safeTo) / safeFrom, unit);
}

export function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0";

  const whole = Math.floor(rounded);
  const fraction = Math.round((rounded - whole) * 100) / 100;
  const fractionLabel = FRACTIONS[String(fraction)];

  if (fractionLabel) {
    return whole > 0 ? `${whole} ${fractionLabel}` : fractionLabel;
  }

  if (Number.isInteger(rounded)) return String(rounded);

  return rounded
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(/\.$/, "")
    .replace(".", ",");
}

export function formatIngredient(
  ingredient: Ingredient,
  targetServings: number,
  baseServings: number,
): string {
  if (ingredient.amount === null) {
    return ingredient.unit
      ? `${ingredient.unit} ${ingredient.name}`.trim()
      : ingredient.name;
  }

  const amount = scaleAmount(
    ingredient.amount,
    baseServings,
    targetServings,
    ingredient.unit,
  );
  const amountText = ingredient.unit
    ? `${formatAmount(amount)} ${ingredient.unit}`
    : formatAmount(amount);

  return `${amountText} ${ingredient.name}`.trim();
}

export function formatIngredients(
  ingredients: Ingredient[],
  targetServings: number,
  baseServings: number,
): string[] {
  return ingredients.map((ingredient) =>
    formatIngredient(ingredient, targetServings, baseServings),
  );
}

export function formatServingsLabel(servings: number): string {
  return servings === 1 ? "1 Person" : `${servings} Personen`;
}
