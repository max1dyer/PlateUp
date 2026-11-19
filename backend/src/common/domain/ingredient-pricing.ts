import { Dimension, Quantity, Unit } from './quantity';
import { IngredientCategory, guessCategory } from './ingredient-category';

/**
 * Rough retail prices (US dollars) for one ingredient: per kilogram and/or per piece.
 * Liquids use the per-kilogram price per litre (water density), which is close enough for an
 * estimate.
 */
interface PriceEntry {
  perKg?: number;
  perPiece?: number;
}

/** Grams assumed for one piece when only a weight price is known, and the reverse. */
const GRAMS_PER_PIECE = 150;
/** Price of one store package (bag, can, jar, ...), whatever is in it. */
const PRICE_PER_PACKAGE = 3.5;

/**
 * Name keywords and their prices, checked in order so more specific names ("peanut butter",
 * "olive oil", "chicken broth") win over shorter ones ("butter", "oil", "chicken").
 */
const NAMED_PRICES: readonly [readonly string[], PriceEntry][] = [
  [['broth', 'stock'], { perKg: 3 }],
  [['peanut butter'], { perKg: 8 }],
  [['buttermilk'], { perKg: 2 }],
  [['olive oil'], { perKg: 14 }],
  [['eggplant'], { perKg: 4, perPiece: 2 }],
  [['parmesan'], { perKg: 30 }],
  [['cherry tomato'], { perKg: 7 }],
  [['garlic'], { perKg: 10, perPiece: 0.15 }],
  [['egg'], { perPiece: 0.35 }],
  [['banana'], { perKg: 1.5, perPiece: 0.3 }],
  [['lemon', 'lime'], { perPiece: 0.6 }],
  [['avocado'], { perPiece: 1.5 }],
  [['apple'], { perKg: 4.5, perPiece: 0.8 }],
  [['onion'], { perKg: 2.5, perPiece: 0.8 }],
  [['tomato'], { perKg: 5, perPiece: 0.6 }],
  [['potato'], { perKg: 2.2, perPiece: 0.5 }],
  [['carrot'], { perKg: 2.5, perPiece: 0.25 }],
  [['bell pepper'], { perKg: 6, perPiece: 1.2 }],
  [['basil', 'cilantro', 'parsley', 'herb', 'mint'], { perKg: 15 }],
  [['salmon', 'shrimp', 'steak'], { perKg: 20 }],
  [['beef', 'lamb'], { perKg: 13 }],
  [['bacon'], { perKg: 13 }],
  [['chicken', 'turkey', 'pork', 'sausage', 'ham'], { perKg: 8.8 }],
  [['tuna', 'fish'], { perKg: 14 }],
  [['tofu'], { perKg: 5 }],
  [['butter'], { perKg: 11 }],
  [['cheese'], { perKg: 15 }],
  [['yogurt', 'yoghurt'], { perKg: 5 }],
  [['cream'], { perKg: 6 }],
  [['milk'], { perKg: 1.1 }],
  [['oil'], { perKg: 9 }],
  [['honey', 'maple syrup'], { perKg: 15 }],
  [['rice'], { perKg: 3 }],
  [['pasta', 'spaghetti', 'noodle'], { perKg: 3.5 }],
  [['oat'], { perKg: 4 }],
  [['quinoa'], { perKg: 9 }],
  [['bread', 'tortilla', 'bun'], { perKg: 5, perPiece: 0.5 }],
  [['flour'], { perKg: 1.5 }],
  [['sugar'], { perKg: 2 }],
  [['salt'], { perKg: 2 }],
  [['water'], { perKg: 0 }],
];

/** Fallback prices for ingredients no keyword matches, by the store section they would go in. */
const CATEGORY_PRICES: Record<IngredientCategory, PriceEntry> = {
  [IngredientCategory.Protein]: { perKg: 10 },
  [IngredientCategory.Produce]: { perKg: 4, perPiece: 0.75 },
  [IngredientCategory.Dairy]: { perKg: 6 },
  [IngredientCategory.Carbs]: { perKg: 3 },
  [IngredientCategory.Baking]: { perKg: 4 },
  [IngredientCategory.OilSauce]: { perKg: 8 },
  [IngredientCategory.Spices]: { perKg: 40 },
  [IngredientCategory.Frozen]: { perKg: 5 },
  [IngredientCategory.Snacks]: { perKg: 10 },
  [IngredientCategory.Drinks]: { perKg: 2 },
  [IngredientCategory.Other]: { perKg: 6, perPiece: 0.75 },
};

/** The price entry for a free-text ingredient name: a keyword match, else its category. */
function priceEntryFor(name: string): PriceEntry {
  const lower = name.toLowerCase();
  const named = NAMED_PRICES.find(([keywords]) => keywords.some((word) => lower.includes(word)));
  return named ? named[1] : CATEGORY_PRICES[guessCategory(name)];
}

/** Rounds to whole cents. */
function toCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

/**
 * PLACEHOLDER pricing (issue #39): an estimated cost in US dollars for `quantity` of the
 * ingredient `name`, from a built-in table of rough retail prices. Story 2.5 replaces this with
 * per-user prices backed by a retail pricing API; callers only depend on this function, so that
 * change stays in this file.
 *
 * Mass and volume use the per-kilogram price (1 ml is treated as 1 g), counts the per-piece price,
 * and store packages a flat price each. When an ingredient has only one of the two prices, a piece
 * is assumed to weigh `GRAMS_PER_PIECE`.
 */
export function estimateCost(name: string, quantity: Quantity): number {
  const entry = priceEntryFor(name);
  switch (quantity.dimension) {
    case Dimension.Package:
      return toCents(quantity.amount * PRICE_PER_PACKAGE);
    case Dimension.Count: {
      const perPiece = entry.perPiece ?? ((entry.perKg ?? 0) * GRAMS_PER_PIECE) / 1000;
      return toCents(quantity.amount * perPiece);
    }
    default: {
      const baseUnit = quantity.dimension === Dimension.Mass ? Unit.Gram : Unit.Milliliter;
      const grams = quantity.convertTo(baseUnit).amount;
      const perKg = entry.perKg ?? ((entry.perPiece ?? 0) * 1000) / GRAMS_PER_PIECE;
      return toCents((grams / 1000) * perKg);
    }
  }
}
