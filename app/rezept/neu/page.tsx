import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/Brand";
import { RecipeForm } from "@/components/RecipeForm";
import { isCategorySlug } from "@/lib/categories";
import type { CategorySlug } from "@/lib/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neues Rezept – Essensbestellung",
};

type PageProps = {
  searchParams: Promise<{ kategorie?: string }>;
};

export default async function NewRecipePage({ searchParams }: PageProps) {
  const { kategorie } = await searchParams;
  const defaultCategory: CategorySlug | undefined =
    kategorie && isCategorySlug(kategorie) ? kategorie : undefined;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between gap-3">
        <Brand compact />
        <Link href="/" className="btn btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" strokeWidth={2.6} />
          Startseite
        </Link>
      </header>

      <section className="mt-10">
        <span className="chip bg-mustard/30">Neues Rezept</span>
        <h1 className="mt-3 font-display text-5xl font-extrabold leading-none sm:text-6xl">
          Was gibt&apos;s Neues?
        </h1>
        <p className="mt-3 max-w-xl font-medium text-ink-soft">
          Ein Name, die Zutaten und – wenn du magst – Link und
          Zubereitungsnotizen. Fertig.
        </p>
      </section>

      <div className="mt-8">
        <RecipeForm mode="create" defaultCategory={defaultCategory} />
      </div>
    </main>
  );
}
