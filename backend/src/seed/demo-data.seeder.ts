import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Unit } from '../common/domain/quantity';
import { RecipeVisibility } from '../recipes/entities/recipe.entity';
import { RecipesService } from '../recipes/recipes.service';
import { UsersService } from '../users/users.service';

/**
 * TEMPORARY: fills the in-memory store with a sample author, reviewer, and
 * recipe on startup so the frontend has something to show. Remove (or limit
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
    });
    const reviewer = await this.usersService.register({
      username: 'demo-reviewer',
      displayName: 'Demo Reviewer',
    });

    const recipe = await this.recipesService.create(author.id, {
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
    });
    await this.recipesService.review(recipe.id, reviewer.id, {
      rating: 5,
      comment: 'Easy and the whole family loved it.',
    });

    this.logger.log(`Seeded demo recipe ${recipe.id}`);
  }
}
