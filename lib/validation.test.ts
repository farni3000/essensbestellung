import { describe, expect, it } from "vitest";
import { validateRecipeInput } from "./validation";

const base = {
  name: "Tomatenpasta",
  link: "chefkoch.de/rezepte/123",
  notes: "  Alles in einen Topf.  ",
  categories: ["normal", "zu-dritt"],
  servings: 4,
  ingredients: [
    { amount: " 4 ", unit: "", name: "  Möhren " },
    { amount: "", unit: "", name: "" },
    { amount: "200", unit: "ml", name: "Sahne" },
  ],
};

describe("validateRecipeInput", () => {
  it("trims, dedupes and normalises valid input", () => {
    const result = validateRecipeInput({
      ...base,
      name: "  Tomatenpasta  ",
      categories: ["normal", "normal", "alleine", "unbekannt"],
      ingredients: [
        { amount: " 4 ", unit: "", name: "  Möhren " },
        { amount: "", unit: "", name: "" },
        { amount: "200", unit: " ml ", name: "Sahne" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.name).toBe("Tomatenpasta");
    expect(result.value.categories).toEqual(["normal", "alleine"]);
    expect(result.value.servings).toBe(4);
    expect(result.value.ingredients).toEqual([
      { amount: 4, unit: "", name: "Möhren" },
      { amount: 200, unit: "ml", name: "Sahne" },
    ]);
    expect(result.value.notes).toBe("Alles in einen Topf.");
    expect(result.value.link).toBe("https://chefkoch.de/rezepte/123");
  });

  it("accepts decimal and fraction amounts", () => {
    const result = validateRecipeInput({
      ...base,
      ingredients: [
        { amount: "0,5", unit: "Becher", name: "Sahne" },
        { amount: "1/2", unit: "TL", name: "Salz" },
        { amount: "", unit: "Prise", name: "Pfeffer" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.ingredients).toEqual([
      { amount: 0.5, unit: "Becher", name: "Sahne" },
      { amount: 0.5, unit: "TL", name: "Salz" },
      { amount: null, unit: "Prise", name: "Pfeffer" },
    ]);
  });

  it("rejects a missing name", () => {
    const result = validateRecipeInput({ ...base, name: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = validateRecipeInput({ ...base, categories: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty ingredient list", () => {
    const result = validateRecipeInput({
      ...base,
      ingredients: [
        { amount: "", unit: "", name: "" },
        { amount: " ", unit: "", name: " " },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an ingredient without a name", () => {
    const result = validateRecipeInput({
      ...base,
      ingredients: [{ amount: "4", unit: "g", name: "" }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid amounts", () => {
    for (const amount of ["abc", "-1", "0", "1/0", "10001"]) {
      const result = validateRecipeInput({
        ...base,
        ingredients: [{ amount, unit: "g", name: "Mehl" }],
      });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects invalid servings", () => {
    for (const servings of ["0", "21", "2,5", "abc", ""]) {
      const result = validateRecipeInput({ ...base, servings });
      expect(result.ok).toBe(false);
    }
  });

  it("defaults missing servings to four", () => {
    const result = validateRecipeInput({ ...base, servings: undefined });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.servings).toBe(4);
  });

  it("rejects an invalid link", () => {
    const result = validateRecipeInput({ ...base, link: "javascript:alert(1)" });
    expect(result.ok).toBe(false);
  });

  it("allows an empty link", () => {
    const result = validateRecipeInput({ ...base, link: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.link).toBe("");
  });
});
