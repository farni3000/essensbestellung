import type Database from "better-sqlite3";
import { CATEGORY_SLUGS } from "./categories";
import type { CategorySlug } from "./categories";
import { getDb } from "./db";
import type { Recipe, RecipeInput } from "./types";
import { pickWeighted } from "./weighting";

type RecipeRow = {
  id: string;
  name: string;
  link: string;
  notes: string;
  servings: number;
  created_at: string;
  last_cooked_at: string | null;
  cook_count: number;
};

type CategoryRow = {
  recipe_id: string;
  category: string;
};

type IngredientRow = {
  recipe_id: string;
  amount: number | null;
  unit: string;
  text: string;
};

const RECIPE_SELECT = `
  SELECT
    r.id,
    r.name,
    r.link,
    r.notes,
    r.servings,
    r.created_at,
    (SELECT MAX(cooked_at) FROM cook_events c WHERE c.recipe_id = r.id) AS last_cooked_at,
    (SELECT COUNT(*) FROM cook_events c WHERE c.recipe_id = r.id) AS cook_count
  FROM recipes r
`;

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}

function hydrate(rows: RecipeRow[]): Recipe[] {
  if (rows.length === 0) return [];

  const db = getDb();
  const ids = rows.map((row) => row.id);
  const marks = placeholders(ids.length);

  const categoryRows = db
    .prepare(
      `SELECT recipe_id, category FROM recipe_categories WHERE recipe_id IN (${marks})`,
    )
    .all(...ids) as CategoryRow[];

  const ingredientRows = db
    .prepare(
      `SELECT recipe_id, amount, unit, text FROM ingredients
       WHERE recipe_id IN (${marks})
       ORDER BY recipe_id, position ASC`,
    )
    .all(...ids) as IngredientRow[];

  const categoriesByRecipe = new Map<string, CategorySlug[]>();
  for (const row of categoryRows) {
    const categories = categoriesByRecipe.get(row.recipe_id) ?? [];
    categories.push(row.category as CategorySlug);
    categoriesByRecipe.set(row.recipe_id, categories);
  }

  const ingredientsByRecipe = new Map<string, Recipe["ingredients"]>();
  for (const row of ingredientRows) {
    const ingredients = ingredientsByRecipe.get(row.recipe_id) ?? [];
    ingredients.push({
      amount: row.amount === null ? null : Number(row.amount),
      unit: row.unit,
      name: row.text,
    });
    ingredientsByRecipe.set(row.recipe_id, ingredients);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    link: row.link,
    notes: row.notes,
    servings: Number(row.servings),
    createdAt: row.created_at,
    lastCookedAt: row.last_cooked_at,
    cookCount: Number(row.cook_count),
    categories: (categoriesByRecipe.get(row.id) ?? []).sort(
      (a, b) => CATEGORY_SLUGS.indexOf(a) - CATEGORY_SLUGS.indexOf(b),
    ),
    ingredients: ingredientsByRecipe.get(row.id) ?? [],
  }));
}

export function listRecipes(category?: CategorySlug): Recipe[] {
  const db = getDb();
  const rows = (
    category
      ? db
          .prepare(
            `${RECIPE_SELECT}
             WHERE EXISTS (
               SELECT 1 FROM recipe_categories rc
               WHERE rc.recipe_id = r.id AND rc.category = ?
             )
             ORDER BY r.name COLLATE NOCASE ASC`,
          )
          .all(category)
      : db.prepare(`${RECIPE_SELECT} ORDER BY r.name COLLATE NOCASE ASC`).all()
  ) as RecipeRow[];

  return hydrate(rows);
}

export function getRecipe(id: string): Recipe | null {
  const db = getDb();
  const row = db
    .prepare(`${RECIPE_SELECT} WHERE r.id = ?`)
    .get(id) as RecipeRow | undefined;

  if (!row) return null;
  return hydrate([row])[0] ?? null;
}

export function getCategoryCounts(): Record<CategorySlug, number> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT category, COUNT(*) AS count
       FROM recipe_categories
       GROUP BY category`,
    )
    .all() as Array<{ category: string; count: number }>;

  const counts = Object.fromEntries(
    CATEGORY_SLUGS.map((slug) => [slug, 0]),
  ) as Record<CategorySlug, number>;

  for (const row of rows) {
    if ((CATEGORY_SLUGS as readonly string[]).includes(row.category)) {
      counts[row.category as CategorySlug] = Number(row.count);
    }
  }

  return counts;
}

function insertRelations(
  recipeId: string,
  input: RecipeInput,
  insertCategory: Database.Statement,
  insertIngredient: Database.Statement,
): void {
  for (const category of input.categories) {
    insertCategory.run(recipeId, category);
  }
  input.ingredients.forEach((ingredient, index) => {
    insertIngredient.run(
      recipeId,
      index,
      ingredient.amount,
      ingredient.unit,
      ingredient.name,
    );
  });
}

export function createRecipe(input: RecipeInput): string {
  const db = getDb();
  const id = crypto.randomUUID();

  const insertRecipe = db.prepare(
    `INSERT INTO recipes (id, name, link, notes, servings, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertCategory = db.prepare(
    `INSERT INTO recipe_categories (recipe_id, category) VALUES (?, ?)`,
  );
  const insertIngredient = db.prepare(
    `INSERT INTO ingredients (recipe_id, position, amount, unit, text)
     VALUES (?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    insertRecipe.run(
      id,
      input.name,
      input.link,
      input.notes,
      input.servings,
      new Date().toISOString(),
    );
    insertRelations(id, input, insertCategory, insertIngredient);
  })();

  return id;
}

export function updateRecipe(id: string, input: RecipeInput): boolean {
  const db = getDb();

  const update = db.prepare(
    `UPDATE recipes SET name = ?, link = ?, notes = ?, servings = ? WHERE id = ?`,
  );
  const deleteCategories = db.prepare(
    `DELETE FROM recipe_categories WHERE recipe_id = ?`,
  );
  const deleteIngredients = db.prepare(
    `DELETE FROM ingredients WHERE recipe_id = ?`,
  );
  const insertCategory = db.prepare(
    `INSERT INTO recipe_categories (recipe_id, category) VALUES (?, ?)`,
  );
  const insertIngredient = db.prepare(
    `INSERT INTO ingredients (recipe_id, position, amount, unit, text)
     VALUES (?, ?, ?, ?, ?)`,
  );

  let changed = false;
  db.transaction(() => {
    const result = update.run(
      input.name,
      input.link,
      input.notes,
      input.servings,
      id,
    );
    if (result.changes === 0) return;

    deleteCategories.run(id);
    deleteIngredients.run(id);
    insertRelations(id, input, insertCategory, insertIngredient);
    changed = true;
  })();

  return changed;
}

export function deleteRecipe(id: string): boolean {
  const db = getDb();
  const result = db.prepare(`DELETE FROM recipes WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function markCooked(id: string): string | null {
  const db = getDb();
  const exists = db.prepare(`SELECT 1 FROM recipes WHERE id = ?`).get(id);
  if (!exists) return null;

  const cookedAt = new Date().toISOString();
  db.prepare(`INSERT INTO cook_events (recipe_id, cooked_at) VALUES (?, ?)`).run(
    id,
    cookedAt,
  );
  return cookedAt;
}

export function undoLastCook(id: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id FROM cook_events
       WHERE recipe_id = ?
       ORDER BY cooked_at DESC, id DESC
       LIMIT 1`,
    )
    .get(id) as { id: number } | undefined;

  if (!row) return false;
  db.prepare(`DELETE FROM cook_events WHERE id = ?`).run(row.id);
  return true;
}

export function getSuggestion(
  category: CategorySlug,
  excludeIds: string[] = [],
): Recipe | null {
  const recipes = listRecipes(category);
  return pickWeighted(recipes, { excludeIds });
}
