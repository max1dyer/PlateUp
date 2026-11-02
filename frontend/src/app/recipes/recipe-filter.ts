import { Recipe } from './recipe.models';

/** Every tag used by `recipes`, without repeats (ignoring case), sorted. */
export function tagsOf(recipes: readonly Recipe[]): string[] {
  const byKey = new Map<string, string>();
  recipes
    .flatMap((recipe) => recipe.tags)
    .forEach((tag) => {
      if (!byKey.has(tag.toLowerCase())) {
        byKey.set(tag.toLowerCase(), tag);
      }
    });
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Recipes whose title, description, tags, or ingredients contain `search`
 * (ignoring case), and that have `tag` when one is chosen.
 */
export function filterRecipes(
  recipes: readonly Recipe[],
  search: string,
  tag: string | null,
): Recipe[] {
  const needle = search.trim().toLowerCase();
  return recipes.filter((recipe) => {
    const hasTag = tag === null || recipe.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (!hasTag) {
      return false;
    }
    if (needle.length === 0) {
      return true;
    }
    const haystack = [
      recipe.title,
      recipe.description,
      ...recipe.tags,
      ...recipe.ingredients.map((ingredient) => ingredient.name),
    ];
    return haystack.some((text) => text.toLowerCase().includes(needle));
  });
}
