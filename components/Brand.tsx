import Link from "next/link";
import { ChefHat } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4"
      aria-label="Essensbestellung – zur Startseite"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-mustard text-ink shadow-[2px_2px_0_0_#2b2118] transition-transform group-hover:-rotate-6">
        <ChefHat className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span
        className={
          compact
            ? "font-display text-2xl font-extrabold tracking-tight"
            : "font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
        }
      >
        Essens<span className="text-tomato">bestellung</span>
      </span>
    </Link>
  );
}
