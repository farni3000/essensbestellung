import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatIngredient,
  formatIngredients,
  formatServingsLabel,
  scaleAmount,
} from "./ingredients";
import type { Ingredient } from "./types";

const carrots: Ingredient = { amount: 4, unit: "", name: "Möhren" };
const cream: Ingredient = { amount: 1, unit: "Becher", name: "Sahne" };
const mince: Ingredient = { amount: 500, unit: "g", name: "Hackfleisch" };
const jam: Ingredient = { amount: null, unit: "", name: "Preiselbeermarmelade" };
const salt: Ingredient = { amount: null, unit: "Prise", name: "Salz" };

describe("scaleAmount", () => {
  it("keeps the original amount for the base servings", () => {
    expect(scaleAmount(4, 4, 4)).toBe(4);
    expect(scaleAmount(550, 4, 4, "g")).toBe(550);
  });

  it("scales down weight and rounds to 5 grams", () => {
    expect(scaleAmount(500, 4, 1, "g")).toBe(125);
    expect(scaleAmount(500, 3, 1, "g")).toBe(165);
  });

  it("scales package units into quarters", () => {
    expect(scaleAmount(1, 4, 1, "Becher")).toBe(0.25);
    expect(scaleAmount(1, 3, 1, "Dose")).toBe(0.25);
    expect(scaleAmount(2, 4, 3, "Dose")).toBe(1.5);
  });

  it("scales countable ingredients in half steps", () => {
    expect(scaleAmount(2, 4, 1)).toBe(0.5);
    expect(scaleAmount(4, 4, 3)).toBe(3);
    expect(scaleAmount(3, 4, 1)).toBe(1);
  });

  it("scales up", () => {
    expect(scaleAmount(1, 1, 4, "Becher")).toBe(4);
    expect(scaleAmount(2, 3, 4)).toBe(2.5);
  });
});

describe("formatAmount", () => {
  it("formats whole numbers and German decimals", () => {
    expect(formatAmount(4)).toBe("4");
    expect(formatAmount(1.5)).toBe("1 ½");
    expect(formatAmount(0.5)).toBe("½");
    expect(formatAmount(0.25)).toBe("¼");
    expect(formatAmount(0.75)).toBe("¾");
    expect(formatAmount(0.33)).toBe("0,33");
  });
});

describe("formatIngredient", () => {
  it("formats the base amounts unchanged", () => {
    expect(formatIngredient(carrots, 4, 4)).toBe("4 Möhren");
    expect(formatIngredient(mince, 4, 4)).toBe("500 g Hackfleisch");
  });

  it("scales amounts to the selected servings", () => {
    expect(formatIngredient(mince, 1, 4)).toBe("125 g Hackfleisch");
    expect(formatIngredient(cream, 1, 4)).toBe("¼ Becher Sahne");
    expect(formatIngredient(carrots, 3, 4)).toBe("3 Möhren");
  });

  it("leaves ingredients without an amount untouched", () => {
    expect(formatIngredient(jam, 1, 4)).toBe("Preiselbeermarmelade");
    expect(formatIngredient(jam, 8, 4)).toBe("Preiselbeermarmelade");
    expect(formatIngredient(salt, 1, 4)).toBe("Prise Salz");
  });

  it("formats a whole ingredient list", () => {
    expect(formatIngredients([carrots, cream, jam], 1, 4)).toEqual([
      "1 Möhren",
      "¼ Becher Sahne",
      "Preiselbeermarmelade",
    ]);
  });
});

describe("formatServingsLabel", () => {
  it("uses the singular for one person", () => {
    expect(formatServingsLabel(1)).toBe("1 Person");
    expect(formatServingsLabel(4)).toBe("4 Personen");
  });
});
