const DAY_MS = 86_400_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatLastCooked(
  lastCookedAt: string | null,
  now = Date.now(),
): string {
  if (!lastCookedAt) return "noch nie gekocht";

  const cooked = new Date(lastCookedAt);
  if (Number.isNaN(cooked.getTime())) return "noch nie gekocht";

  const diff = now - cooked.getTime();
  if (diff < 60_000) return "gerade eben gekocht";

  const dayDiff = Math.round(
    (startOfDay(new Date(now)) - startOfDay(cooked)) / DAY_MS,
  );

  if (dayDiff <= 0) return "heute gekocht";
  if (dayDiff === 1) return "gestern gekocht";
  if (dayDiff < 7) return `vor ${dayDiff} Tagen gekocht`;
  if (dayDiff < 60) {
    const weeks = Math.floor(dayDiff / 7);
    return weeks === 1 ? "vor einer Woche gekocht" : `vor ${weeks} Wochen gekocht`;
  }

  return `am ${new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(cooked)} gekocht`;
}

export function formatIngredientsForWhatsApp(ingredients: string[]): string {
  return ingredients.map((ingredient) => `* ${ingredient}`).join("\n");
}
