import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/CategoryView";
import { getCategory, isCategorySlug } from "@/lib/categories";
import { listRecipes } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const found = getCategory(category);
  return {
    title: found ? `${found.label} – Essensbestellung` : "Essensbestellung",
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  if (!isCategorySlug(slug)) notFound();

  const category = getCategory(slug);
  if (!category) notFound();

  const recipes = listRecipes(slug);

  return <CategoryView category={category} recipes={recipes} />;
}
