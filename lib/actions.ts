"use server";

import { revalidatePath } from "next/cache";
import { CATEGORY_SLUGS, isCategorySlug } from "./categories";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  getSuggestion,
  markCooked,
  undoLastCook,
  updateRecipe,
} from "./recipes";
import type { Recipe, SaveResult, SimpleResult } from "./types";
import { validateRecipeInput } from "./validation";

function revalidateRecipe(recipeId?: string): void {
  revalidatePath("/");
  for (const category of CATEGORY_SLUGS) {
    revalidatePath(`/k/${category}`);
  }
  if (recipeId) revalidatePath(`/rezept/${recipeId}`);
}

export async function saveRecipeAction(
  recipeId: string | null,
  rawInput: unknown,
): Promise<SaveResult> {
  const result = validateRecipeInput(rawInput);
  if (!result.ok) return result;

  if (recipeId) {
    const updated = updateRecipe(recipeId, result.value);
    if (!updated) return { ok: false, error: "Rezept nicht gefunden." };
    revalidateRecipe(recipeId);
    return { ok: true, id: recipeId };
  }

  const id = createRecipe(result.value);
  revalidateRecipe(id);
  return { ok: true, id };
}

export async function deleteRecipeAction(recipeId: string): Promise<SimpleResult> {
  if (typeof recipeId !== "string" || !recipeId) {
    return { ok: false, error: "Rezept nicht gefunden." };
  }

  const deleted = deleteRecipe(recipeId);
  if (!deleted) return { ok: false, error: "Rezept nicht gefunden." };

  revalidateRecipe();
  return { ok: true };
}

export async function markCookedAction(
  recipeId: string,
): Promise<{ ok: true; recipe: Recipe } | { ok: false; error: string }> {
  if (typeof recipeId !== "string" || !recipeId) {
    return { ok: false, error: "Rezept nicht gefunden." };
  }

  const lastCookedAt = markCooked(recipeId);
  if (!lastCookedAt) return { ok: false, error: "Rezept nicht gefunden." };

  const recipe = getRecipe(recipeId);
  if (!recipe) return { ok: false, error: "Rezept nicht gefunden." };

  revalidateRecipe(recipeId);
  return { ok: true, recipe };
}

export async function undoCookAction(
  recipeId: string,
): Promise<
  { ok: true; undone: boolean; recipe: Recipe | null } | { ok: false; error: string }
> {
  if (typeof recipeId !== "string" || !recipeId) {
    return { ok: false, error: "Rezept nicht gefunden." };
  }

  const undone = undoLastCook(recipeId);
  const recipe = getRecipe(recipeId);
  revalidateRecipe(recipeId);
  return { ok: true, undone, recipe };
}

export async function suggestAction(
  category: string,
  excludeIds: string[] = [],
): Promise<Recipe | null> {
  if (!isCategorySlug(category)) return null;
  const safeExcludeIds = Array.isArray(excludeIds)
    ? excludeIds.filter((id): id is string => typeof id === "string")
    : [];
  return getSuggestion(category, safeExcludeIds);
}
