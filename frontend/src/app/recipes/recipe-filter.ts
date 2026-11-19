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
  | 'trending'
  | 'newest'
  | 'rating'
  | 'popularity'
  | 'protein'
  | 'calories'
  | 'fat'
  | 'carbs'
  | 'cost'
  | 'ingredients'
  | 'time'
  | 'steps';

/** The sort the feed opens with (supplemental spec: "trending as the default sort"). */
export const DEFAULT_SORT: RecipeSort = 'trending';

/** Sort choices in the order the "Sort by" menu shows them. */
export const SORT_OPTIONS: readonly { value: RecipeSort; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popularity', label: 'Most reviewed' },
  { value: 'protein', label: 'Most protein' },
  { value: 'calories', label: 'Fewest calories' },
  { value: 'fat', label: 'Least fat' },
  { value: 'carbs', label: 'Fewest carbs' },
  { value: 'cost', label: 'Cheapest' },
  { value: 'ingredients', label: 'Fewest ingredients' },
  { value: 'time', label: 'Quickest' },
  { value: 'steps', label: 'Fewest steps' },
];

/** Days for a review's (or an upload's) weight in the trending score to halve. */
export const TRENDING_HALF_LIFE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * How "hot" a recipe is right now (story 2.13): each review adds its stars out of 5, and the upload
 * itself counts like one 5-star review, all fading by half every `TRENDING_HALF_LIFE_DAYS`. So a
 * well-rated recipe with recent reviews, or a brand-new one, ranks above an old favourite nobody
 * has reviewed lately. (Views are not tracked yet, so they don't count.)
 */
export function trendingScore(recipe: Recipe, now: Date = new Date()): number {
  const weight = (iso: string): number => {
    const ageDays = Math.max(0, now.getTime() - new Date(iso).getTime()) / MS_PER_DAY;
    return 0.5 ** (ageDays / TRENDING_HALF_LIFE_DAYS);
  };
  const reviews = recipe.reviews.reduce(
    (sum, review) => sum + (review.rating / 5) * weight(review.reviewedAt),
    0,
  );
  return reviews + weight(recipe.createdAt);
}

/** How each sort compares two recipes; a negative result puts `a` first. */
function comparators(now: Date): Record<RecipeSort, (a: Recipe, b: Recipe) => number> {
  return {
    trending: (a, b) => trendingScore(b, now) - trendingScore(a, now),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    // Unrated recipes go last.
    rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
    popularity: (a, b) => b.numRatings - a.numRatings,
    protein: (a, b) => b.nutrition.protein - a.nutrition.protein,
    calories: (a, b) => a.nutrition.calories - b.nutrition.calories,
    fat: (a, b) => a.nutrition.fat - b.nutrition.fat,
    carbs: (a, b) => a.nutrition.carbohydrates - b.nutrition.carbohydrates,
    cost: (a, b) => a.estimatedCostPerServing - b.estimatedCostPerServing,
    ingredients: (a, b) => a.ingredients.length - b.ingredients.length,
    time: (a, b) => a.prepTimeMinutes - b.prepTimeMinutes,
    steps: (a, b) => a.steps.length - b.steps.length,
  };
}

/**
 * A sorted copy of `recipes`. `reversed` flips the order (e.g. "Cheapest" becomes most expensive
 * first); ties are always broken newest first. `now` is only used by the trending sort.
 */
export function sortRecipes(
  recipes: readonly Recipe[],
  sort: RecipeSort,
  reversed = false,
  now: Date = new Date(),
): Recipe[] {
  const all = comparators(now);
  const compare = all[sort];
  const direction = reversed ? -1 : 1;
  // Sort a copy so the caller's array is not reordered; `||` falls back to newest first on a tie.
  return [...recipes].sort((a, b) => direction * compare(a, b) || all.newest(a, b));
}

/** The numbers the feed can be narrowed by: per-serving nutrition and the number of steps. */
export type RangeField = 'calories' | 'protein' | 'carbohydrates' | 'fat' | 'steps';

/** An inclusive range; null leaves that end open. */
export interface Range {
  min: number | null;
  max: number | null;
}

/** One range per field. */
export type RecipeRanges = Record<RangeField, Range>;

/** Range fields in the order the Filters panel shows them, with their labels and units. */
export const RANGE_FIELDS: readonly { value: RangeField; label: string; unit: string }[] = [
  { value: 'calories', label: 'Calories', unit: 'kcal' },
  { value: 'protein', label: 'Protein', unit: 'g' },
  { value: 'carbohydrates', label: 'Carbs', unit: 'g' },
  { value: 'fat', label: 'Fat', unit: 'g' },
  { value: 'steps', label: 'Steps', unit: '' },
];

/** Every range open: nothing filtered out. */
export const NO_RANGES: RecipeRanges = {
  calories: { min: null, max: null },
  protein: { min: null, max: null },
  carbohydrates: { min: null, max: null },
  fat: { min: null, max: null },
  steps: { min: null, max: null },
};

/** The recipe's value for a range field (nutrition is per serving). */
function valueOf(recipe: Recipe, field: RangeField): number {
  return field === 'steps' ? recipe.steps.length : recipe.nutrition[field];
}

/** How many range fields have a minimum or maximum set (for the Filters badge). */
export function activeRangeCount(ranges: RecipeRanges): number {
  return RANGE_FIELDS.filter(
    ({ value }) => ranges[value].min !== null || ranges[value].max !== null,
  ).length;
}

/** Recipes whose calories, macros, and step count all fall inside `ranges` (ends included). */
export function filterByRanges(recipes: readonly Recipe[], ranges: RecipeRanges): Recipe[] {
  return recipes.filter((recipe) =>
    RANGE_FIELDS.every(({ value }) => {
      const { min, max } = ranges[value];
      const amount = valueOf(recipe, value);
      return (min === null || amount >= min) && (max === null || amount <= max);
    }),
  );
}

/** True if one serving costs more than `maxCostPerServing` (never true without a budget). */
export function isOverBudget(recipe: Recipe, maxCostPerServing: number | null): boolean {
  return maxCostPerServing !== null && recipe.estimatedCostPerServing > maxCostPerServing;
}

/** Recipes within the budget per serving; all of them when there is no budget. */
export function filterByBudget(
  recipes: readonly Recipe[],
  maxCostPerServing: number | null,
): Recipe[] {
  return recipes.filter((recipe) => !isOverBudget(recipe, maxCostPerServing));
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
