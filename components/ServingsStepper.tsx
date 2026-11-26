"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { formatServingsLabel } from "@/lib/ingredients";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

export function ServingsStepper({
  value,
  base,
  resetTo = base,
  onChange,
}: {
  value: number;
  base: number;
  resetTo?: number;
  onChange: (servings: number) => void;
}) {
  const canReset = value !== resetTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Always rendered so the stepper keeps its position when reset appears. */}
      <button
        type="button"
        onClick={() => onChange(resetTo)}
        disabled={!canReset}
        aria-hidden={!canReset}
        tabIndex={canReset ? 0 : -1}
        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs font-extrabold text-ink-soft transition hover:bg-cream-deep hover:text-ink disabled:invisible`}
        title={`Zurück auf ${formatServingsLabel(resetTo)}`}
        aria-label="Zurücksetzen"
      >
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.6} />
        <span className="hidden sm:inline">Zurücksetzen</span>
      </button>

      <div className="inline-flex items-center overflow-hidden rounded-full border-2 border-ink bg-card shadow-[2px_2px_0_0_#2b2118]">
        <button
          type="button"
          onClick={() => onChange(Math.max(MIN_SERVINGS, value - 1))}
          disabled={value <= MIN_SERVINGS}
          className="grid h-9 w-9 place-items-center transition hover:bg-cream-deep disabled:opacity-35"
          aria-label="Weniger Personen"
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <span className="min-w-[5.5rem] px-1 text-center text-sm font-extrabold">
          {formatServingsLabel(value)}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(MAX_SERVINGS, value + 1))}
          disabled={value >= MAX_SERVINGS}
          className="grid h-9 w-9 place-items-center transition hover:bg-cream-deep disabled:opacity-35"
          aria-label="Mehr Personen"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
