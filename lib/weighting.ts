const DAY_MS = 86_400_000;
const MAX_WEIGHTED_DAYS = 365;

/**
 * Weight grows with the time since the recipe was last cooked.
 * Never-cooked recipes get the same weight as a recipe cooked a year ago,
 * so they are strongly favoured without making everything else invisible.
 */
export const NEVER_COOKED_WEIGHT = (MAX_WEIGHTED_DAYS + 2) ** 2;

export type WeightCandidate = {
  id: string;
  lastCookedAt: string | null;
};

export function recipeWeight(lastCookedAt: string | null, now = Date.now()): number {
  if (!lastCookedAt) return NEVER_COOKED_WEIGHT;

  const cookedAt = Date.parse(lastCookedAt);
  if (Number.isNaN(cookedAt)) return NEVER_COOKED_WEIGHT;

  const days = Math.max(0, (now - cookedAt) / DAY_MS);
  return (Math.min(days, MAX_WEIGHTED_DAYS) + 2) ** 2;
}

/**
 * Picks a recipe with recency-based weights.
 *
 * - The most recently cooked recipe in the pool is hard-excluded as long as
 *   another option exists (the promised "definitely not again right away").
 * - `excludeIds` additionally removes recipes from the draw (e.g. the recipe
 *   that is currently shown) when alternatives remain.
 */
export function pickWeighted<T extends WeightCandidate>(
  candidates: readonly T[],
  options: { now?: number; rng?: () => number; excludeIds?: readonly string[] } = {},
): T | null {
  if (candidates.length === 0) return null;

  const now = options.now ?? Date.now();
  const rng = options.rng ?? Math.random;
  const excludeIds = new Set(options.excludeIds ?? []);

  let pool = candidates.filter((candidate) => !excludeIds.has(candidate.id));
  if (pool.length === 0) pool = [...candidates];

  let latestCookedAt: string | null = null;
  for (const candidate of pool) {
    if (!candidate.lastCookedAt) continue;
    if (
      latestCookedAt === null ||
      Date.parse(candidate.lastCookedAt) > Date.parse(latestCookedAt)
    ) {
      latestCookedAt = candidate.lastCookedAt;
    }
  }

  if (latestCookedAt !== null) {
    const withoutMostRecent = pool.filter(
      (candidate) => candidate.lastCookedAt !== latestCookedAt,
    );
    if (withoutMostRecent.length > 0) pool = withoutMostRecent;
  }

  const weights = pool.map((candidate) => recipeWeight(candidate.lastCookedAt, now));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    return pool[Math.floor(rng() * pool.length)] ?? pool[0];
  }

  let ticket = rng() * total;
  for (let index = 0; index < pool.length; index += 1) {
    ticket -= weights[index];
    if (ticket < 0) return pool[index];
  }

  return pool[pool.length - 1];
}
