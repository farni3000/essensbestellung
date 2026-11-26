import { describe, expect, it } from "vitest";
import { formatIngredientsForWhatsApp, formatLastCooked } from "./format";

const DAY = 86_400_000;
const HEADER = "🍽️ Essensbestellung! 🛒";
const NOW = new Date("2026-05-01T12:00:00.000Z").getTime();

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString();
}

describe("formatIngredientsForWhatsApp", () => {
  it("prepends the header and turns every ingredient into a bullet line", () => {
    expect(
      formatIngredientsForWhatsApp(["4 Möhren", "1 Zwiebel", "200 ml Sahne"]),
    ).toBe(`${HEADER}\n* 4 Möhren\n* 1 Zwiebel\n* 200 ml Sahne`);
  });

  it("returns an empty string without ingredients", () => {
    expect(formatIngredientsForWhatsApp([])).toBe("");
  });
});

describe("formatLastCooked", () => {
  it("handles never cooked", () => {
    expect(formatLastCooked(null, NOW)).toBe("noch nie gekocht");
  });

  it("handles just now, today and yesterday", () => {
    expect(formatLastCooked(new Date(NOW - 10_000).toISOString(), NOW)).toBe(
      "gerade eben gekocht",
    );
    expect(
      formatLastCooked(new Date(NOW - 5 * 60_000).toISOString(), NOW),
    ).toBe("heute gekocht");
    expect(formatLastCooked(daysAgo(1), NOW)).toBe("gestern gekocht");
  });

  it("handles days and weeks", () => {
    expect(formatLastCooked(daysAgo(3), NOW)).toBe("vor 3 Tagen gekocht");
    expect(formatLastCooked(daysAgo(14), NOW)).toBe("vor 2 Wochen gekocht");
  });
});
