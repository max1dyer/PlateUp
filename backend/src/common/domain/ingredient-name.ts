/**
 * Ingredient identity while names are free text: two names are the same
 * ingredient if they match ignoring case and extra spaces ("eggs " = "Eggs").
 * Plurals don't match. Kept in one place so an ingredient catalogue or API
 * can replace it later.
 */
export function isSameIngredient(a: string, b: string): boolean {
  const first = normalize(a);
  return first.length > 0 && first === normalize(b);
}

function normalize(name: string): string {
  return typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}
