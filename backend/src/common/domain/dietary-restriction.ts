/**
 * Diets and allergies a user can ask the feed to respect (spec 3.1, UC10).
 * Declaration order is the display order.
 */
export enum DietaryRestriction {
  Vegetarian = 'vegetarian',
  Vegan = 'vegan',
  Pescatarian = 'pescatarian',
  GlutenFree = 'gluten-free',
  DairyFree = 'dairy-free',
  EggFree = 'egg-free',
  NutFree = 'nut-free',
  ShellfishFree = 'shellfish-free',
}

/** Which ingredients break a restriction, and phrases that look like a match but are not. */
interface RestrictionRule {
  /** Whole words (plurals included) that mean the ingredient breaks the restriction. */
  forbidden: readonly string[];
  /** Phrases removed before matching, e.g. "peanut butter" is not dairy. */
  safe: readonly string[];
  /** Labels that clear the whole ingredient, e.g. "vegan sausage". */
  exempt: readonly string[];
}

/** Ingredient keyword lists shared by several restrictions below. */
const SHELLFISH = ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop'];
const FISH = ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchovy', 'anchovies', 'sardine'];
const MEAT = [
  'chicken',
  'beef',
  'pork',
  'turkey',
  'bacon',
  'sausage',
  'ham',
  'steak',
  'lamb',
  'veal',
  'duck',
  'venison',
  'prosciutto',
  'pepperoni',
  'salami',
  'chorizo',
  'meat',
  'meatball',
  'gelatin',
  'lard',
];
const DAIRY = [
  'milk',
  'buttermilk',
  'butter',
  'cheese',
  'cream',
  'yogurt',
  'yoghurt',
  'ghee',
  'whey',
  'parmesan',
  'mozzarella',
  'cheddar',
  'ricotta',
  'feta',
  'mascarpone',
  'custard',
];
const EGG = ['egg', 'mayo', 'mayonnaise', 'meringue'];
const PLANT_BASED = ['plant-based', 'vegan', 'vegetarian', 'veggie', 'meatless'];
const NON_DAIRY = [
  'peanut butter',
  'almond butter',
  'cashew butter',
  'nut butter',
  'apple butter',
  'cocoa butter',
  'coconut milk',
  'coconut cream',
  'almond milk',
  'oat milk',
  'soy milk',
  'rice milk',
  'cashew milk',
  'cream of tartar',
];

/** The matching rules for each restriction, built from the keyword lists above. */
const RULES: Record<DietaryRestriction, RestrictionRule> = {
  [DietaryRestriction.Vegetarian]: {
    forbidden: [...MEAT, ...FISH, ...SHELLFISH],
    safe: [],
    exempt: PLANT_BASED,
  },
  [DietaryRestriction.Vegan]: {
    forbidden: [...MEAT, ...FISH, ...SHELLFISH, ...DAIRY, ...EGG, 'honey'],
    safe: [...NON_DAIRY, 'eggplant'],
    exempt: ['plant-based', 'vegan'],
  },
  [DietaryRestriction.Pescatarian]: {
    forbidden: MEAT,
    safe: [],
    exempt: PLANT_BASED,
  },
  [DietaryRestriction.GlutenFree]: {
    forbidden: [
      'flour',
      'wheat',
      'bread',
      'breadcrumb',
      'panko',
      'pasta',
      'spaghetti',
      'macaroni',
      'penne',
      'noodle',
      'couscous',
      'barley',
      'rye',
      'bulgur',
      'semolina',
      'farro',
      'seitan',
      'tortilla',
      'pita',
      'bun',
      'bagel',
      'cracker',
      'croissant',
      'soy sauce',
      'beer',
    ],
    safe: [
      'gluten-free',
      'rice flour',
      'almond flour',
      'coconut flour',
      'corn tortilla',
      'rice noodle',
      'rice noodles',
      'buckwheat',
    ],
    exempt: ['gluten-free'],
  },
  [DietaryRestriction.DairyFree]: {
    forbidden: DAIRY,
    safe: NON_DAIRY,
    exempt: ['dairy-free', 'non-dairy', 'vegan', 'plant-based'],
  },
  [DietaryRestriction.EggFree]: {
    forbidden: EGG,
    safe: ['eggplant'],
    exempt: ['egg-free', 'vegan', 'plant-based'],
  },
  [DietaryRestriction.NutFree]: {
    forbidden: [
      'nut',
      'peanut',
      'almond',
      'cashew',
      'walnut',
      'pecan',
      'pistachio',
      'hazelnut',
      'macadamia',
      'praline',
      'nutella',
      'marzipan',
    ],
    safe: ['nutmeg', 'butternut', 'coconut', 'water chestnut', 'nutritional yeast'],
    exempt: ['nut-free'],
  },
  [DietaryRestriction.ShellfishFree]: { forbidden: SHELLFISH, safe: [], exempt: [] },
};

/** A `RestrictionRule` with its word lists turned into regular expressions. */
interface CompiledRule {
  forbidden: RegExp;
  exempt: RegExp | null;
  safe: readonly string[];
}

/** Compiled once: each word list as a single whole-word pattern (plurals included). */
const COMPILED = new Map<DietaryRestriction, CompiledRule>(
  Object.values(DietaryRestriction).map((restriction) => {
    const rule = RULES[restriction];
    return [
      restriction,
      {
        forbidden: wholeWords(rule.forbidden) as RegExp,
        exempt: wholeWords(rule.exempt),
        safe: rule.safe,
      },
    ];
  }),
);

/**
 * Whether an ingredient (by its free-text name) breaks `restriction`. This
 * is a keyword match on the name, so it is an estimate, not allergy advice.
 */
export function ingredientBreaks(restriction: DietaryRestriction, ingredientName: string): boolean {
  const rule = COMPILED.get(restriction) as CompiledRule;
  let name = ingredientName.toLowerCase();
  // An exempt label ("vegan", "gluten-free", ...) clears the whole ingredient.
  if (rule.exempt?.test(name)) {
    return false;
  }
  // Blank out safe phrases first so their words can't match, e.g. "peanut butter" no longer
  // contains "butter".
  for (const phrase of rule.safe) {
    name = name.split(phrase).join(' ');
  }
  return rule.forbidden.test(name);
}

/**
 * For each restriction a set of ingredients breaks, the names of the
 * ingredients that break it. Restrictions they satisfy are left out.
 */
export function dietaryConflicts(
  ingredientNames: readonly string[],
): Partial<Record<DietaryRestriction, string[]>> {
  const conflicts: Partial<Record<DietaryRestriction, string[]>> = {};
  for (const restriction of Object.values(DietaryRestriction)) {
    const breaking = ingredientNames.filter((name) => ingredientBreaks(restriction, name));
    if (breaking.length > 0) {
      conflicts[restriction] = breaking;
    }
  }
  return conflicts;
}

/**
 * Builds one regex matching any of `words` as a whole word, with an optional "s" or
 * "es" plural. Returns null for an empty list so callers can skip the test.
 */
function wholeWords(words: readonly string[]): RegExp | null {
  if (words.length === 0) {
    return null;
  }
  const alternatives = words.map(escapeRegExp).join('|');
  return new RegExp(`\\b(?:${alternatives})(?:s|es)?\\b`);
}

/** Escapes regex metacharacters so a keyword is matched literally. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
