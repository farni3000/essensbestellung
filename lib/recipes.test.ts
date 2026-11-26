import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { RecipeInput } from "./types";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "essensbestellung-test-"));
process.env.ESSENSBESTELLUNG_DB = path.join(tempDir, "test.db");

const recipes = await import("./recipes");
const db = await import("./db");

const baseInput: RecipeInput = {
  name: "Tomatenpasta",
  link: "https://example.com/pasta",
  notes: "Alles zusammenrühren.",
  categories: ["normal", "alleine"],
  servings: 4,
  ingredients: [
    { amount: 500, unit: "g", name: "Spaghetti" },
    { amount: 1, unit: "", name: "Zwiebel" },
    { amount: 400, unit: "g", name: "Tomaten" },
  ],
};

afterAll(() => {
  db.getDb().close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("recipe repository", () => {
  it("creates, reads and lists recipes", () => {
    const id = recipes.createRecipe(baseInput);
    const recipe = recipes.getRecipe(id);

    expect(recipe).not.toBeNull();
    expect(recipe?.name).toBe("Tomatenpasta");
    expect(recipe?.categories).toEqual(["normal", "alleine"]);
    expect(recipe?.servings).toBe(4);
    expect(recipe?.ingredients).toEqual(baseInput.ingredients);
    expect(recipe?.cookCount).toBe(0);
    expect(recipe?.lastCookedAt).toBeNull();

    expect(recipes.listRecipes("normal").map((entry) => entry.id)).toContain(id);
    expect(recipes.listRecipes("zu-dritt")).toHaveLength(0);
    expect(recipes.getCategoryCounts()).toMatchObject({
      normal: 1,
      "zu-dritt": 0,
      alleine: 1,
    });
  });

  it("updates all recipe fields", () => {
    const id = recipes.createRecipe({ ...baseInput, name: "Alt" });
    const updated = recipes.updateRecipe(id, {
      ...baseInput,
      name: "Neu",
      categories: ["zu-dritt"],
      servings: 3,
      ingredients: [{ amount: 3, unit: "", name: "Kartoffeln" }],
      notes: "",
      link: "",
    });

    expect(updated).toBe(true);
    const recipe = recipes.getRecipe(id);
    expect(recipe?.name).toBe("Neu");
    expect(recipe?.categories).toEqual(["zu-dritt"]);
    expect(recipe?.servings).toBe(3);
    expect(recipe?.ingredients).toEqual([
      { amount: 3, unit: "", name: "Kartoffeln" },
    ]);
    expect(recipe?.notes).toBe("");
    expect(recipe?.link).toBe("");
  });

  it("marks cooking and undoes the last event", () => {
    const id = recipes.createRecipe({ ...baseInput, name: "Koch-Test" });

    const first = recipes.markCooked(id);
    expect(first).not.toBeNull();
    expect(recipes.getRecipe(id)?.cookCount).toBe(1);

    const second = recipes.markCooked(id);
    expect(second).not.toBeNull();
    expect(recipes.getRecipe(id)?.cookCount).toBe(2);

    expect(recipes.undoLastCook(id)).toBe(true);
    expect(recipes.getRecipe(id)?.cookCount).toBe(1);

    expect(recipes.undoLastCook(id)).toBe(true);
    expect(recipes.getRecipe(id)?.cookCount).toBe(0);

    expect(recipes.undoLastCook(id)).toBe(false);
  });

  it("returns a suggestion from the requested category", () => {
    const id = recipes.createRecipe({
      ...baseInput,
      name: "Vorschlag",
      categories: ["alleine"],
    });

    expect(recipes.listRecipes("alleine").map((entry) => entry.id)).toContain(id);
    const suggestion = recipes.getSuggestion("alleine");
    expect(suggestion).not.toBeNull();
    expect(suggestion?.categories).toContain("alleine");
  });

  it("deletes recipes and their relations", () => {
    const id = recipes.createRecipe({ ...baseInput, name: "Lösch-Test" });
    recipes.markCooked(id);

    expect(recipes.deleteRecipe(id)).toBe(true);
    expect(recipes.getRecipe(id)).toBeNull();
    expect(recipes.updateRecipe(id, baseInput)).toBe(false);
    expect(recipes.deleteRecipe(id)).toBe(false);
  });
});
