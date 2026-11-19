import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";
import { getRecipe } from "@/lib/recipes";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipe(id);
  return {
    title: recipe ? `${recipe.name} – Essensbestellung` : "Rezept – Essensbestellung",
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
