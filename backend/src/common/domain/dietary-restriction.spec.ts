import { DietaryRestriction, dietaryConflicts, ingredientBreaks } from './dietary-restriction';

describe('ingredientBreaks', () => {
  it.each([
    [DietaryRestriction.DairyFree, 'Whole milk'],
    [DietaryRestriction.DairyFree, 'Shredded cheddar cheese'],
    [DietaryRestriction.DairyFree, 'Unsalted butter'],
    [DietaryRestriction.Vegetarian, 'Chicken broth'],
    [DietaryRestriction.Vegetarian, 'Fish sauce'],
    [DietaryRestriction.Vegan, 'Eggs'],
    [DietaryRestriction.Vegan, 'Honey'],
    [DietaryRestriction.Pescatarian, 'Bacon'],
    [DietaryRestriction.GlutenFree, 'All-purpose flour'],
    [DietaryRestriction.GlutenFree, 'Spaghetti'],
    [DietaryRestriction.NutFree, 'Peanut butter'],
    [DietaryRestriction.NutFree, 'Mixed nuts'],
    [DietaryRestriction.EggFree, 'Mayonnaise'],
    [DietaryRestriction.ShellfishFree, 'Shrimp'],
  ])('%s is broken by "%s"', (restriction, name) => {
    expect(ingredientBreaks(restriction, name)).toBe(true);
  });

  it.each([
    [DietaryRestriction.DairyFree, 'Peanut butter'],
    [DietaryRestriction.DairyFree, 'Coconut milk'],
    [DietaryRestriction.DairyFree, 'Dairy-free cheese'],
    [DietaryRestriction.Vegetarian, 'Chickpeas'],
    [DietaryRestriction.Vegetarian, 'Vegan sausage'],
    [DietaryRestriction.Pescatarian, 'Salmon fillet'],
    [DietaryRestriction.EggFree, 'Eggplant'],
    [DietaryRestriction.GlutenFree, 'Rice noodles'],
    [DietaryRestriction.GlutenFree, 'Gluten-free bread'],
    [DietaryRestriction.NutFree, 'Nutmeg'],
    [DietaryRestriction.NutFree, 'Butternut squash'],
    [DietaryRestriction.NutFree, 'Coconut milk'],
    [DietaryRestriction.Vegan, 'Almond milk'],
  ])('%s is not broken by "%s"', (restriction, name) => {
    expect(ingredientBreaks(restriction, name)).toBe(false);
  });
});

describe('dietaryConflicts', () => {
  it('lists the ingredients that break each restriction and omits satisfied ones', () => {
    const conflicts = dietaryConflicts(['Rolled oats', 'Milk', 'Peanut butter']);

    expect(conflicts[DietaryRestriction.DairyFree]).toEqual(['Milk']);
    expect(conflicts[DietaryRestriction.NutFree]).toEqual(['Peanut butter']);
    expect(conflicts[DietaryRestriction.Vegan]).toEqual(['Milk']);
    expect(conflicts[DietaryRestriction.Vegetarian]).toBeUndefined();
    expect(conflicts[DietaryRestriction.GlutenFree]).toBeUndefined();
  });
});
