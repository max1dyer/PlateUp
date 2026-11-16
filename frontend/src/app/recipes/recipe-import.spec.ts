import { isEmptyDraft, parseRecipeText } from './recipe-import';

describe('parseRecipeText', () => {
  it('reads a caption with ingredient and step headings', () => {
    const draft = parseRecipeText(`🔥 Easy Garlic Butter Pasta! 🔥
Ready in 20 minutes, serves 2, 520 cal per serving

Ingredients:
- 8 oz spaghetti
- 3 tbsp butter
- 4 cloves garlic, minced
- ½ cup parmesan (grated)
- salt

Instructions:
1. Boil the pasta.
2) Melt the butter and fry the garlic.
Step 3: Toss everything together.

#pasta #easydinner @chefsam`);

    expect(draft.title).toBe('Easy Garlic Butter Pasta');
    expect(draft.ingredients).toEqual([
      { name: 'spaghetti', amount: 8, unit: 'oz' },
      { name: 'butter', amount: 3, unit: 'tbsp' },
      { name: 'cloves garlic', amount: 4, unit: 'piece' },
      { name: 'parmesan', amount: 0.5, unit: 'cup' },
      { name: 'salt', amount: null, unit: 'piece' },
    ]);
    expect(draft.steps).toEqual([
      'Boil the pasta.',
      'Melt the butter and fry the garlic.',
      'Toss everything together.',
    ]);
    expect(draft.tags).toEqual(['pasta', 'easydinner']);
    expect(draft.servings).toBe(2);
    expect(draft.prepTimeMinutes).toBe(20);
    expect(draft.calories).toBe(520);
  });

  it('reads amounts written as mixed numbers, fractions, and plural units', () => {
    const draft = parseRecipeText(
      'Oats\nIngredients\n1 1/2 cups oats\n3/4 tsp cinnamon\n2 ounces honey',
    );

    expect(draft.ingredients).toEqual([
      { name: 'oats', amount: 1.5, unit: 'cup' },
      { name: 'cinnamon', amount: 0.75, unit: 'tsp' },
      { name: 'honey', amount: 2, unit: 'oz' },
    ]);
  });

  it('reads an ingredient list given on the heading line', () => {
    const draft = parseRecipeText('Fried Rice\nIngredients: rice, eggs, soy sauce');

    expect(draft.ingredients.map((ingredient) => ingredient.name)).toEqual([
      'rice',
      'eggs',
      'soy sauce',
    ]);
  });

  it('falls back to known food words when the caption has no list', () => {
    const draft = parseRecipeText(
      'My go-to lunch\nJust toss chicken, rice and broccoli in a pan with some soy sauce. 1 hr 15 min',
    );

    expect(draft.title).toBe('My go-to lunch');
    expect(draft.ingredients.map((ingredient) => ingredient.name)).toEqual([
      'chicken',
      'rice',
      'broccoli',
      'soy sauce',
    ]);
    expect(draft.ingredients.every((ingredient) => ingredient.amount === null)).toBe(true);
    expect(draft.prepTimeMinutes).toBe(75);
  });

  it('leaves time, servings, and calories null when the text does not give them', () => {
    const draft = parseRecipeText('Toast\nIngredients\n2 slices bread');

    expect(draft.servings).toBeNull();
    expect(draft.prepTimeMinutes).toBeNull();
    expect(draft.calories).toBeNull();
  });

  it('reports text with no recipe in it as empty', () => {
    expect(isEmptyDraft(parseRecipeText('Had a great weekend at the beach!'))).toBe(true);
  });
});
