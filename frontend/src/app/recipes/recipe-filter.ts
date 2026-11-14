import { DietaryRestriction, restrictionLabel } from '../preferences/preferences.models';
import { Recipe } from './recipe.models';

/** Every tag used by `recipes`, without repeats (ignoring case), sorted. */
export function tagsOf(recipes: readonly Recipe[]): string[] {
  // Keep the first spelling seen for each tag, keyed case-insensitively.
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

/** The ways the recipe feed can be ordered. */
export type RecipeSort =
  'newest' | 'rating' | 'popularity' | 'protein' | 'calories' | 'ingredients' | 'time' | 'steps';

/** Sort choices in the order the "Sort by" menu shows them. */
export const SORT_OPTIONS: readonly { value: RecipeSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popularity', label: 'Most reviewed' },
  { value: 'protein', label: 'Most protein' },
  { value: 'calories', label: 'Fewest calories' },
  { value: 'ingredients', label: 'Fewest ingredients' },
  { value: 'time', label: 'Quickest' },
  { value: 'steps', label: 'Fewest steps' },
];

/** How each sort compares two recipes; a negative result puts `a` first. */
const COMPARATORS: Record<RecipeSort, (a: Recipe, b: Recipe) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  // Unrated recipes go last.
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  popularity: (a, b) => b.numRatings - a.numRatings,
  protein: (a, b) => b.nutrition.protein - a.nutrition.protein,
  calories: (a, b) => a.nutrition.calories - b.nutrition.calories,
  ingredients: (a, b) => a.ingredients.length - b.ingredients.length,
  time: (a, b) => a.prepTimeMinutes - b.prepTimeMinutes,
  steps: (a, b) => a.steps.length - b.steps.length,
};

/** A sorted copy of `recipes`; ties are broken newest first. */
export function sortRecipes(recipes: readonly Recipe[], sort: RecipeSort): Recipe[] {
  const compare = COMPARATORS[sort];
  // Sort a copy so the caller's array is not reordered; `||` falls back to newest first on a tie.
  return [...recipes].sort((a, b) => compare(a, b) || COMPARATORS.newest(a, b));
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
    // Tags compare ignoring case, matching how `tagsOf` merges them.
    const hasTag = tag === null || recipe.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (!hasTag) {
      return false;
    }
    if (needle.length === 0) {
      return true;
    }
    // Every piece of text the search box looks through.
    const haystack = [
      recipe.title,
      recipe.description,
      ...recipe.tags,
      ...recipe.ingredients.map((ingredient) => ingredient.name),
    ];
    return haystack.some((text) => text.toLowerCase().includes(needle));
  });
}

/** Which of `restrictions` the recipe breaks, in the order given. */
export function dietConflictsOf(
  recipe: Recipe,
  restrictions: readonly DietaryRestriction[],
): DietaryRestriction[] {
  return restrictions.filter((restriction) => recipe.dietaryConflicts[restriction] !== undefined);
}

/** Recipes that break none of `restrictions`. */
export function filterByDiet(
  recipes: readonly Recipe[],
  restrictions: readonly DietaryRestriction[],
): Recipe[] {
  return recipes.filter((recipe) => dietConflictsOf(recipe, restrictions).length === 0);
}

/**
 * Short warnings for a recipe card, e.g. "Not dairy-free (Milk, Butter)",
 * one per restriction in `restrictions` that the recipe breaks.
 */
export function dietWarnings(
  recipe: Recipe,
  restrictions: readonly DietaryRestriction[],
): string[] {
  return dietConflictsOf(recipe, restrictions).map((restriction) => {
    const ingredients = recipe.dietaryConflicts[restriction] ?? [];
    return `Not ${restrictionLabel(restriction).toLowerCase()} (${ingredients.join(', ')})`;
  });
}
