import { DietaryRestriction } from '../../common/domain/dietary-restriction';
import { DomainValidationError } from '../../common/errors/domain-validation.error';
import { DEFAULT_SERVINGS, UserPreferences } from './user-preferences';

describe('UserPreferences', () => {
  it('starts with default servings, no restrictions, and no goals', () => {
    expect(UserPreferences.defaults().toJSON()).toEqual({
      defaultServings: DEFAULT_SERVINGS,
      dietaryRestrictions: [],
      dailyCalories: null,
      macroSplit: null,
      dailyTargets: { calories: null, protein: null, carbohydrates: null, fat: null },
    });
  });

  it('with() returns a changed copy and leaves the original alone', () => {
    const original = UserPreferences.defaults();

    const changed = original.with({ defaultServings: 4 });

    expect(changed.defaultServings).toBe(4);
    expect(original.defaultServings).toBe(DEFAULT_SERVINGS);
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

  it('rejects a macro split that does not total 100%', () => {
    expect(() =>
      UserPreferences.defaults().with({
        macroSplit: { protein: 30, carbohydrates: 40, fat: 20 },
      }),
    ).toThrow('must add up to 100%');
  });

  it('rejects implausible daily calories', () => {
    expect(() => UserPreferences.defaults().with({ dailyCalories: 100 })).toThrow(
      DomainValidationError,
    );
  });

  it('derives daily macro grams from the calorie goal and split', () => {
    const prefs = UserPreferences.defaults().with({
      dailyCalories: 2000,
      macroSplit: { protein: 30, carbohydrates: 40, fat: 30 },
    });

    expect(prefs.dailyTargets).toEqual({
      calories: 2000,
      protein: 150,
      carbohydrates: 200,
      fat: 67,
    });
  });

  it('leaves macro grams null without a split', () => {
    const prefs = UserPreferences.defaults().with({ dailyCalories: 1800 });

    expect(prefs.dailyTargets).toEqual({
      calories: 1800,
      protein: null,
      carbohydrates: null,
      fat: null,
    });
  });
});
