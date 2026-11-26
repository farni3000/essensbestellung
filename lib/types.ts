import type { CategorySlug } from "./categories";

export type Ingredient = {
  amount: number | null;
  unit: string;
  name: string;
};

export type Recipe = {
  id: string;
  name: string;
  link: string;
  notes: string;
  categories: CategorySlug[];
  servings: number;
  ingredients: Ingredient[];
  lastCookedAt: string | null;
  cookCount: number;
  createdAt: string;
};

export type RecipeInput = {
  name: string;
  link: string;
  notes: string;
  categories: CategorySlug[];
  servings: number;
  ingredients: Ingredient[];
};

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SimpleResult = { ok: true } | { ok: false; error: string };
