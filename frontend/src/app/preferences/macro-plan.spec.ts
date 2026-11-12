import { planMacros } from './macro-plan';

const NONE = { protein: null, carbohydrates: null, fat: null };

describe('planMacros', () => {
  it('is empty with no goals', () => {
    expect(planMacros(null, NONE)).toMatchObject({ status: 'empty', preview: null });
  });

  it('previews the missing macro from the calories left over', () => {
    // 2000 - 150*4 - 200*4 = 600 kcal of fat = 66 g (rounded down)
    const plan = planMacros(2000, { protein: 150, carbohydrates: 200, fat: null });

    expect(plan.preview).toEqual({ field: 'fat', value: 66 });
    expect(plan.status).toBe('balanced');
    expect(plan.caloriesByMacro).toEqual({ protein: 600, carbohydrates: 800, fat: 594 });
  });

  it('previews the total calories when only the macros are entered', () => {
    const plan = planMacros(null, { protein: 150, carbohydrates: 200, fat: 60 });

    expect(plan.preview).toEqual({ field: 'calories', value: 1940 });
    expect(plan.calories).toBe(1940);
    expect(plan.status).toBe('balanced');
  });

  it('reports how far the macros overshoot the calorie goal', () => {
    // 200*4 + 250*4 = 1800 kcal against a 1500 kcal goal
    const plan = planMacros(1500, { protein: 200, carbohydrates: 250, fat: null });

    expect(plan.status).toBe('over');
    expect(plan.overshoot).toBe(300);
    expect(plan.preview).toEqual({ field: 'fat', value: 0 });
  });

  it('reports calories left unassigned when all three macros fall short', () => {
    // 100*4 + 100*4 + 50*9 = 1250 kcal against 2000
    const plan = planMacros(2000, { protein: 100, carbohydrates: 100, fat: 50 });

    expect(plan.status).toBe('under');
    expect(plan.unassigned).toBe(750);
  });

  it('treats a shortfall under one gram of fat as balanced', () => {
    // 150*4 + 200*4 + 66*9 = 1994 kcal against 2000
    expect(planMacros(2000, { protein: 150, carbohydrates: 200, fat: 66 }).status).toBe('balanced');
  });

  it('is partial when two values are missing', () => {
    expect(planMacros(2000, { ...NONE, protein: 150 })).toMatchObject({
      status: 'partial',
      preview: null,
    });
    expect(planMacros(null, { ...NONE, protein: 150, fat: 60 }).status).toBe('partial');
  });
});
