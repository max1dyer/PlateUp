import { Unit } from '../grocery-list/grocery-list.models';

/** One ingredient found in pasted text. A null amount means the text did not give one. */
export interface DraftIngredient {
  name: string;
  amount: number | null;
  unit: Unit;
}

/**
 * A recipe guessed from text pasted from a social-media post (UC19). Anything the text did
 * not give is empty or null, so the form can mark it for the user to fill in.
 */
export interface RecipeDraft {
  title: string;
  ingredients: DraftIngredient[];
  steps: string[];
  tags: string[];
  servings: number | null;
  prepTimeMinutes: number | null;
  calories: number | null;
}

/** Words that name a unit, mapped to the unit. Checked against the word after an amount. */
const UNIT_WORDS: Record<string, Unit> = {
  g: 'g',
  gram: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  liter: 'l',
  litre: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  tbsp: 'tbsp',
  tbs: 'tbsp',
  tablespoon: 'tbsp',
  cup: 'cup',
  oz: 'oz',
  ounce: 'oz',
  lb: 'lb',
  pound: 'lb',
  can: 'can',
  jar: 'jar',
  bag: 'bag',
  box: 'box',
  bottle: 'bottle',
  carton: 'carton',
  tube: 'tube',
};

/** Common foods, used to find ingredients in a caption that has no ingredient list. */
// prettier-ignore
const FOOD_WORDS = [
  'chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'salmon', 'tuna', 'shrimp', 'tofu',
  'egg', 'milk', 'butter', 'cheese', 'parmesan', 'mozzarella', 'cream', 'yogurt',
  'rice', 'pasta', 'noodles', 'bread', 'tortilla', 'flour', 'oats', 'potato', 'quinoa',
  'onion', 'garlic', 'ginger', 'tomato', 'pepper', 'spinach', 'broccoli', 'carrot', 'mushroom',
  'zucchini', 'avocado', 'lettuce', 'cucumber', 'corn', 'beans', 'lemon', 'lime', 'banana',
  'apple', 'berries', 'sugar', 'honey', 'salt', 'olive oil', 'soy sauce', 'vinegar', 'cinnamon',
  'paprika', 'cumin', 'basil', 'cilantro', 'parsley', 'chocolate', 'vanilla',
];

const VULGAR_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
};
const AMOUNT = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])`;
const INGREDIENT_LINE = new RegExp(String.raw`^${AMOUNT}\s*([a-z]+\b\.?)?\s*(.*)$`, 'i');
/** A heading alone ("Ingredients", "Method (15 min)") or followed by ":" and text. */
const INGREDIENTS_HEADING =
  /^(?:ingredients?|what you(?:'ll)? need)\s*(?:\(.*?\))?\s*(?::\s*(.*))?$/i;
const STEPS_HEADING =
  /^(?:steps?|instructions?|method|directions?|how to make it)\s*(?:\(.*?\))?\s*(?::\s*(.*))?$/i;
/** A list marker at the start of a line: "-", "•", "*", "1.", "2)", "Step 3:". */
const LIST_MARKER = /^(?:[-•*·]|(?:step\s*)?\d+\s*[.):])\s*/i;
const NUMBERED = /^(?:step\s*)?\d+\s*[.):]\s*/i;

/** Builds a draft recipe from pasted text using simple rules; never throws. */
export function parseRecipeText(text: string): RecipeDraft {
  const tags = [...text.matchAll(/#(\w+)/g)].map((match) => match[1]);
  const lines = text
    .replace(/https?:\/\/\S+|[#@]\w+/g, '')
    .replace(/\p{Extended_Pictographic}|️/gu, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /[a-z]/i.test(line));

  let title = '';
  let section: 'intro' | 'ingredients' | 'steps' = 'intro';
  const ingredientLines: string[] = [];
  const steps: string[] = [];
  for (const line of lines) {
    const ingredientsHeading = INGREDIENTS_HEADING.exec(line);
    const stepsHeading = STEPS_HEADING.exec(line);
    if (ingredientsHeading) {
      section = 'ingredients';
      // "Ingredients: chicken, rice, soy sauce" on one line.
      ingredientLines.push(...(ingredientsHeading[1] ?? '').split(','));
    } else if (stepsHeading) {
      section = 'steps';
      steps.push(stepsHeading[1] ?? '');
    } else if (section === 'ingredients' && !NUMBERED.test(line)) {
      ingredientLines.push(line.replace(LIST_MARKER, ''));
    } else if (section === 'steps' || NUMBERED.test(line)) {
      steps.push(line.replace(LIST_MARKER, ''));
    } else if (!title) {
      title = line.replace(/[\s:!.,-]+$/, '').slice(0, 80);
    } else if (INGREDIENT_LINE.test(line.replace(LIST_MARKER, ''))) {
      // An unlabelled list such as "- 2 cups rice" before any heading.
      ingredientLines.push(line.replace(LIST_MARKER, ''));
    }
  }

  let ingredients = ingredientLines
    .map((line) => parseIngredientLine(line.trim()))
    .filter((ingredient) => ingredient.name.length > 0);
  if (ingredients.length === 0) {
    ingredients = findFoodWords(text);
  }
  return {
    title,
    ingredients,
    steps: steps.map((step) => step.trim()).filter((step) => step.length > 0),
    tags,
    servings: firstNumber(text, /(?:serves|servings?:?|makes)\s*(\d+)/i),
    prepTimeMinutes: minutes(text),
    calories: firstNumber(text, /(\d+)\s*(?:k?cals?|calories)\b|calories:?\s*(\d+)/i),
  };
}

/** True when a draft holds nothing that looks like a recipe. */
export function isEmptyDraft(draft: RecipeDraft): boolean {
  return draft.ingredients.length === 0 && draft.steps.length === 0;
}

/** Reads "1 1/2 cups rice", "½ tsp salt", or "3 eggs"; a line with no amount is just a name. */
function parseIngredientLine(line: string): DraftIngredient {
  const match = INGREDIENT_LINE.exec(line);
  if (!match) {
    return { name: cleanName(line), amount: null, unit: 'piece' };
  }
  const [, amountText, word = '', rest] = match;
  const unit = unitFor(word);
  return {
    name: cleanName(unit ? rest : `${word} ${rest}`),
    amount: parseAmount(amountText),
    unit: unit ?? 'piece',
  };
}

/** The unit a word names, allowing plurals and a trailing dot ("cups", "Tbsp.", "ounces"). */
function unitFor(word: string): Unit | undefined {
  const bare = word.toLowerCase().replace(/\.$/, '');
  return (
    UNIT_WORDS[bare] ?? UNIT_WORDS[bare.replace(/s$/, '')] ?? UNIT_WORDS[bare.replace(/es$/, '')]
  );
}

/** "1 1/2" -> 1.5, "3/4" -> 0.75, "2½" -> 2.5. */
function parseAmount(text: string): number {
  let total = 0;
  for (const part of text.trim().split(/\s+|(?=[½¼¾⅓⅔])/)) {
    const [top, bottom] = part.split('/');
    total += VULGAR_FRACTIONS[part] ?? (bottom ? Number(top) / Number(bottom) : Number(part));
  }
  return Math.round(total * 100) / 100;
}

/** Drops "of", notes in brackets, and anything after a comma ("onion, diced" -> "onion"). */
function cleanName(name: string): string {
  return name
    .replace(/^of\s+/i, '')
    .replace(/\(.*?\)/g, '')
    .split(',')[0]
    .trim();
}

/** Ingredients named anywhere in the text, with no amount, in the order they appear. */
function findFoodWords(text: string): DraftIngredient[] {
  const lower = text.toLowerCase();
  return FOOD_WORDS.map((food) => ({ food, at: lower.search(new RegExp(`\\b${food}`)) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(({ food }) => ({ name: food, amount: null, unit: 'piece' }));
}

/** "1 hr 15 min" -> 75, "20 minutes" -> 20; null when no time is given. */
function minutes(text: string): number | null {
  const hours = firstNumber(text, /(\d+)\s*(?:hours?|hrs?)\b/i) ?? 0;
  const mins = firstNumber(text, /(\d+)\s*(?:minutes?|mins?)\b/i) ?? 0;
  return hours * 60 + mins || null;
}

/** The number captured by the first match of `pattern` (in whichever group matched). */
function firstNumber(text: string, pattern: RegExp): number | null {
  const match = pattern.exec(text);
  return match ? Number(match[1] ?? match[2]) : null;
}

/** The platform a post link points at, or null when it is not one we recognize. */
export function platformOf(link: string): string | null {
  const host = /^https?:\/\/([^/]+)/i.exec(link.trim())?.[1].toLowerCase() ?? '';
  if (host.endsWith('tiktok.com')) {
    return 'TikTok';
  }
  if (host.endsWith('instagram.com')) {
    return 'Instagram';
  }
  return host.endsWith('youtube.com') || host === 'youtu.be' ? 'YouTube' : null;
}
