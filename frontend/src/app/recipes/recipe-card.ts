import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from './recipe.models';
import { SaveButton } from './save-button';

/** Summary of one recipe in a feed or list, linking to its full page. */
@Component({
  selector: 'app-recipe-card',
  imports: [RouterLink, SaveButton],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css',
})
export class RecipeCard {
  public readonly recipe = input.required<Recipe>();
  /** Alternates the card colour like the grocery list's category cards. */
  public readonly green = input(false);
}
