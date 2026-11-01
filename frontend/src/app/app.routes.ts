import { Routes } from '@angular/router';
import { GroceryListPage } from './grocery-list/grocery-list-page';
import { RecipeListPage } from './recipes/recipe-list-page';
import { RecipePage } from './recipes/recipe-page';

export const routes: Routes = [
  { path: 'recipes', component: RecipeListPage, title: 'Recipes | PlateUp!' },
  { path: 'recipes/:recipeId', component: RecipePage, title: 'Recipe | PlateUp!' },
  { path: 'grocery', component: GroceryListPage, title: 'Grocery | PlateUp!' },
  // Other pages don't exist yet, so everything else leads to the recipes for now.
  { path: '**', redirectTo: 'recipes' },
];
