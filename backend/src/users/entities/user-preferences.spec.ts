import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { DEFAULT_SERVINGS, UserPreferences, deriveDailyTargets } from './user-preferences';

const NO_MACROS = { protein: null, carbohydrates: null, fat: null };

describe('UserPreferences', () => {
  it('starts with default servings, no restrictions, and no goals', () => {
    expect(UserPreferences.defaults().toJSON()).toEqual({
      defaultServings: DEFAULT_SERVINGS,
      dietaryRestrictions: [],
      dailyCalories: null,
      macroGoals: NO_MACROS,
      dailyTargets: { calories: null, protein: null, carbohydrates: null, fat: null },
    });
  });

  it('with() returns a changed copy and leaves the original alone', () => {
    const original = UserPreferences.defaults();

    const changed = original.with({ defaultServings: 4 });

    expect(changed.defaultServings).toBe(4);
    expect(original.defaultServings).toBe(DEFAULT_SERVINGS);
  });

  it('with() merges macro goals one macro at a time', () => {
    const prefs = UserPreferences.defaults()
      .with({ macroGoals: { protein: 150 } })
      .with({ macroGoals: { fat: 70 } });

    expect(prefs.macroGoals).toEqual({ protein: 150, carbohydrates: null, fat: 70 });
    expect(prefs.with({ macroGoals: { protein: null } }).macroGoals.protein).toBeNull();
  });

  it('rejects servings outside 1-50', () => {
    expect(() => UserPreferences.defaults().with({ defaultServings: 0 })).toThrow(
      DomainValidationError,
    );
    expect(() => UserPreferences.defaults().with({ defaultServings: 51 })).toThrow(
      DomainValidationError,
    );
  });

  it('drops repeated restrictions, keeps display order, and rejects unknown ones', () => {
    const prefs = UserPreferences.defaults().with({
      dietaryRestrictions: [
        DietaryRestriction.NutFree,
        DietaryRestriction.Vegan,
        DietaryRestriction.NutFree,
      ],
    });
    expect(prefs.dietaryRestrictions).toEqual([
      DietaryRestriction.Vegan,
      DietaryRestriction.NutFree,
    ]);

    expect(() =>
      UserPreferences.defaults().with({
        dietaryRestrictions: ['carnivore' as DietaryRestriction],
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects negative, fractional, or huge gram goals', () => {
    const attempt = (protein: number) => () =>
      UserPreferences.defaults().with({ macroGoals: { protein } });

    expect(attempt(-1)).toThrow('Protein (g)');
    expect(attempt(12.5)).toThrow(DomainValidationError);
    expect(attempt(1001)).toThrow(DomainValidationError);
  });

  it('rejects implausible daily calories', () => {
    expect(() => UserPreferences.defaults().with({ dailyCalories: 100 })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts macros that overshoot the calorie goal (the page warns instead)', () => {
    const prefs = UserPreferences.defaults().with({
      dailyCalories: 1500,
      macroGoals: { protein: 200, carbohydrates: 200, fat: 100 },
    });

    expect(prefs.dailyTargets.calories).toBe(1500);
  });
});

describe('deriveDailyTargets', () => {
  it('keeps every goal the user set', () => {
    expect(deriveDailyTargets(2000, { protein: 150, carbohydrates: 200, fat: 60 })).toEqual({
      calories: 2000,
      protein: 150,
      carbohydrates: 200,
      fat: 60,
    });
  });

  it('totals the calories when all three macros are set and calories are not', () => {
    // 150*4 + 200*4 + 60*9 = 1940
    expect(deriveDailyTargets(null, { protein: 150, carbohydrates: 200, fat: 60 }).calories).toBe(
      1940,
    );
  });

  it('fills the one missing macro with the calories left over, rounded down', () => {
    // 2000 - 150*4 - 200*4 = 600 kcal of fat = 66.7 g
    expect(deriveDailyTargets(2000, { protein: 150, carbohydrates: 200, fat: null }).fat).toBe(66);
    // 2000 - 200*4 - 60*9 = 660 kcal of protein = 165 g
    expect(deriveDailyTargets(2000, { protein: null, carbohydrates: 200, fat: 60 }).protein).toBe(
      165,
    );
  });

  it('gives 0 g to the missing macro when the others already overshoot', () => {
    expect(deriveDailyTargets(1000, { protein: 200, carbohydrates: 100, fat: null }).fat).toBe(0);
  });

  it('derives nothing when two or more values are missing', () => {
    expect(deriveDailyTargets(2000, { ...NO_MACROS, protein: 150 })).toEqual({
      calories: 2000,
      protein: 150,
      carbohydrates: null,
      fat: null,
    });
    expect(deriveDailyTargets(null, { ...NO_MACROS, protein: 150, fat: 60 }).calories).toBeNull();
  });
});
