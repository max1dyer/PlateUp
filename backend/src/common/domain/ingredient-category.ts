/**
 * Store sections used to group grocery items (and later pantry items).
 * Declaration order is the display order; `Other` is the default.
 */
export enum IngredientCategory {
  Produce = 'produce',
  Protein = 'protein',
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
