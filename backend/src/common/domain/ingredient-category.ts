/**
 * Store sections used to group grocery items (and later pantry items).
 * Declaration order is the display order; `Other` is the default.
 */
export enum IngredientCategory {
  Protein = 'protein',
  Produce = 'produce',
  Dairy = 'dairy',
  Carbs = 'carbs',
  Baking = 'baking',
  OilSauce = 'oil-sauce',
  Spices = 'spices',
  Frozen = 'frozen',
  Snacks = 'snacks',
  Drinks = 'drinks',
  Other = 'other',
}

/** Keywords that place an ingredient in a store section; checked in this order. */
const CATEGORY_KEYWORDS: readonly [IngredientCategory, readonly string[]][] = [
  [IngredientCategory.Frozen, ['frozen']],
  [
    IngredientCategory.OilSauce,
    [
      'oil',
      'sauce',
      'vinegar',
      'ketchup',
      'mayo',
      'mustard',
      'dressing',
      'salsa',
      'honey',
      'syrup',
      'broth',
      'stock',
    ],
  ],
  // Names that would otherwise match a later keyword ("butter", "egg").
  [IngredientCategory.Snacks, ['peanut butter']],
  [IngredientCategory.Produce, ['eggplant']],
  [IngredientCategory.Dairy, ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'egg']],
  [
    IngredientCategory.Protein,
    [
      'chicken',
      'beef',
      'pork',
      'turkey',
      'bacon',
      'sausage',
      'ham',
      'salmon',
      'tuna',
      'fish',
      'shrimp',
      'tofu',
      'steak',
      'lamb',
      'bean',
      'lentil',
    ],
  ],
  [
    IngredientCategory.Spices,
    [
      'salt',
      'black pepper',
      'peppercorn',
      'pepper flakes',
      'cumin',
      'paprika',
      'oregano',
      'basil',
      'thyme',
      'cinnamon',
      'chili powder',
      'spice',
      'seasoning',
      'nutmeg',
    ],
  ],
  [
    IngredientCategory.Baking,
    ['flour', 'sugar', 'baking', 'yeast', 'vanilla', 'cocoa', 'chocolate chip'],
  ],
  [
    IngredientCategory.Carbs,
    [
      'rice',
      'pasta',
      'noodle',
      'bread',
      'tortilla',
      'oat',
      'quinoa',
      'potato',
      'spaghetti',
      'bun',
      'cereal',
    ],
  ],
  [
    IngredientCategory.Produce,
    [
      'garlic',
      'onion',
      'tomato',
      'lettuce',
      'spinach',
      'carrot',
      'pepper',
      'apple',
      'banana',
      'lemon',
      'lime',
      'avocado',
      'broccoli',
      'cucumber',
      'celery',
      'mushroom',
      'berry',
      'berries',
      'herb',
      'cilantro',
      'parsley',
      'ginger',
      'zucchini',
      'kale',
      'fruit',
    ],
  ],
  [IngredientCategory.Drinks, ['juice', 'soda', 'coffee', 'tea', 'water', 'wine']],
  [IngredientCategory.Snacks, ['chip', 'cracker', 'nut', 'pretzel', 'popcorn', 'cookie']],
];

/**
 * Best guess at the store section for a free-text ingredient name, so items
 * generated from a recipe are grouped sensibly. Users can change it afterwards.
 */
export function guessCategory(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => lower.includes(keyword)),
  );
  return match ? match[0] : IngredientCategory.Other;
}
