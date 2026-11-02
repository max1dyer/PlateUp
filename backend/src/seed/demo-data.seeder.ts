import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Unit } from '../common/domain/quantity';
import { CreateRecipeDto } from '../recipes/dto/create-recipe.dto';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { UsersService } from '../users/users.service';

/** Sample recipes, all by the demo chef. The first one also gets a review. */
const DEMO_RECIPES: readonly CreateRecipeDto[] = [
  {
    title: 'Garlic Butter Chicken and Rice',
    description: 'One-pan weeknight dinner: seared chicken in garlic butter over fluffy rice.',
    servings: 4,
    prepTimeMinutes: 35,
    ingredients: [
      { name: 'Chicken thighs', quantity: { amount: 1.5, unit: Unit.Pound } },
      { name: 'Long-grain rice', quantity: { amount: 1.5, unit: Unit.Cup } },
      { name: 'Butter', quantity: { amount: 3, unit: Unit.Tablespoon } },
      { name: 'Garlic cloves', quantity: { amount: 4, unit: Unit.Piece } },
      { name: 'Chicken broth', quantity: { amount: 750, unit: Unit.Milliliter } },
    ],
    steps: [
      'Season the chicken with salt and pepper.',
      'Sear the chicken in butter until golden, about 5 minutes per side, then set aside.',
      'Fry the garlic for 30 seconds, then stir in the rice and broth.',
      'Lay the chicken on top, cover, and simmer for 18 minutes until the rice is tender.',
    ],
    nutrition: { calories: 610, protein: 42, fat: 22, carbohydrates: 58 },
    visibility: RecipeVisibility.Public,
    tags: ['American', 'Comfort Food', 'High Protein'],
  },
  {
    title: 'Peanut Butter Overnight Oats',
    description: 'Five-minute breakfast you make the night before. Grab it from the fridge and go.',
    servings: 2,
    prepTimeMinutes: 5,
    ingredients: [
      { name: 'Rolled oats', quantity: { amount: 1, unit: Unit.Cup } },
      { name: 'Milk', quantity: { amount: 1, unit: Unit.Cup } },
      { name: 'Greek yogurt', quantity: { amount: 0.5, unit: Unit.Cup } },
      { name: 'Peanut butter', quantity: { amount: 2, unit: Unit.Tablespoon } },
      { name: 'Banana', quantity: { amount: 1, unit: Unit.Piece } },
    ],
    steps: [
      'Stir the oats, milk, yogurt, and peanut butter together in two jars.',
      'Slice the banana on top, cover, and refrigerate overnight.',
    ],
    nutrition: { calories: 420, protein: 20, fat: 14, carbohydrates: 55 },
    visibility: RecipeVisibility.Public,
    tags: ['Breakfast', 'Quick', 'Budget'],
  },
  {
    title: 'Tomato Basil Pasta',
    description: 'Pantry-friendly pasta with a quick fresh tomato sauce.',
    servings: 3,
    prepTimeMinutes: 25,
    ingredients: [
      { name: 'Spaghetti', quantity: { amount: 340, unit: Unit.Gram } },
      { name: 'Cherry tomatoes', quantity: { amount: 2, unit: Unit.Cup } },
      { name: 'Olive oil', quantity: { amount: 3, unit: Unit.Tablespoon } },
      { name: 'Garlic cloves', quantity: { amount: 3, unit: Unit.Piece } },
      { name: 'Fresh basil', quantity: { amount: 0.5, unit: Unit.Cup } },
      { name: 'Parmesan cheese', quantity: { amount: 0.25, unit: Unit.Cup } },
    ],
    steps: [
      'Boil the spaghetti in salted water until al dente.',
      'Meanwhile, soften the garlic in olive oil and add the halved tomatoes.',
      'Cook the tomatoes for 8 minutes until they burst, then season.',
      'Toss the pasta with the sauce, basil, and parmesan.',
    ],
    nutrition: { calories: 520, protein: 17, fat: 15, carbohydrates: 78 },
    visibility: RecipeVisibility.Public,
    tags: ['Italian', 'Vegetarian'],
  },
];

/**
 * TEMPORARY: fills the in-memory store with a sample author, reviewer, and
 * recipes on startup so the frontend has something to show. Remove (or limit
 * to development) once a real database is in place.
 */
@Injectable()
export class DemoDataSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoDataSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly recipesService: RecipesService,
  ) {}

  public async onApplicationBootstrap(): Promise<void> {
    const author = await this.usersService.register({
      username: 'demo-chef',
      displayName: 'Demo Chef',
      bio: 'Cooks simple, filling meals on a student budget.',
    });
    const reviewer = await this.usersService.register({
      username: 'demo-reviewer',
      displayName: 'Demo Reviewer',
    });

    const recipes = [];
    for (const dto of DEMO_RECIPES) {
      recipes.push(await this.recipesService.create(author.id, dto));
    }
    await this.recipesService.review(recipes[0].id, reviewer.id, {
      rating: 5,
      comment: 'Easy and the whole family loved it.',
    });

    this.logger.log(`Seeded ${recipes.length} demo recipes`);
  }
}
