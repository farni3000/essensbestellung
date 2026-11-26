import { describe, expect, it } from "vitest";
import {
  NEVER_COOKED_WEIGHT,
  pickWeighted,
  recipeWeight,
  type WeightCandidate,
} from "./weighting";

const NOW = Date.parse("2026-05-01T12:00:00.000Z");
const DAY = 86_400_000;

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString();
}

const candidate = (id: string, lastCookedAt: string | null): WeightCandidate => ({
  id,
  lastCookedAt,
});

describe("recipeWeight", () => {
  it("gives never-cooked recipes the maximum weight", () => {
    expect(recipeWeight(null, NOW)).toBe(NEVER_COOKED_WEIGHT);
  });

  it("grows with the time since the last cooking", () => {
    expect(recipeWeight(daysAgo(0), NOW)).toBe(4);
    expect(recipeWeight(daysAgo(10), NOW)).toBe(144);
    expect(recipeWeight(daysAgo(30), NOW)).toBe(1024);
  });

  it("caps the age at one year", () => {
    expect(recipeWeight(daysAgo(400), NOW)).toBe(NEVER_COOKED_WEIGHT);
  });

  it("treats invalid dates like never cooked", () => {
    expect(recipeWeight("not-a-date", NOW)).toBe(NEVER_COOKED_WEIGHT);
  });
});

describe("pickWeighted", () => {
  it("returns null without candidates", () => {
    expect(pickWeighted([], { now: NOW })).toBeNull();
  });

  it("hard-excludes the most recently cooked recipe", () => {
    const recipes = [
      candidate("recent", daysAgo(0)),
      candidate("old", daysAgo(30)),
      candidate("never", null),
    ];

    expect(pickWeighted(recipes, { now: NOW, rng: () => 0 })?.id).toBe("old");
  });

  it("excludes the currently shown recipe when alternatives exist", () => {
    const recipes = [
      candidate("current", null),
      candidate("other", null),
    ];

    expect(
      pickWeighted(recipes, {
        now: NOW,
        rng: () => 0,
        excludeIds: ["current"],
      })?.id,
    ).toBe("other");
  });

  it("ignores the exclusion when only one recipe remains", () => {
    const recipes = [candidate("only", null)];
    expect(
      pickWeighted(recipes, { now: NOW, rng: () => 0.5, excludeIds: ["only"] })?.id,
    ).toBe("only");
  });

  it("falls back to the most recent recipe when it is the only option", () => {
    const recipes = [candidate("only", daysAgo(0))];
    expect(
      pickWeighted(recipes, { now: NOW, rng: () => 0.5 })?.id,
    ).toBe("only");
  });

  it("favours never-cooked recipes over freshly cooked ones", () => {
    const recipes = [
      candidate("fresh", daysAgo(0)),
      candidate("never", null),
    ];

    expect(pickWeighted(recipes, { now: NOW, rng: () => 0.99 })?.id).toBe(
      "never",
    );
  });

  it("still picks the most recent recipe if every one was cooked at the same time", () => {
    const recipes = [
      candidate("a", daysAgo(3)),
      candidate("b", daysAgo(3)),
    ];

    expect(pickWeighted(recipes, { now: NOW, rng: () => 0 })?.id).toBe("a");
  });
});
