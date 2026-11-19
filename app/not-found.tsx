import Link from "next/link";
import { ArrowLeft, CookingPot } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-ink bg-mustard/40 text-5xl shadow-[4px_4px_0_0_#2b2118]">
        <CookingPot className="h-12 w-12" strokeWidth={1.8} />
      </div>
      <h1 className="mt-6 font-display text-5xl font-extrabold">
        Hier kocht niemand.
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Diese Seite gibt es nicht (mehr). Vielleicht wurde das Rezept gelöscht
        oder der Link ist vertippt.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.6} />
        Zur Startseite
      </Link>
    </main>
  );
}
