import { Routes } from '@angular/router';
import { signedInGuard } from './core/signed-in.guard';
import { GroceryListPage } from './grocery-list/grocery-list-page';
import { HomePage } from './home/home-page';
import { InfoPage, InfoPageData } from './info/info-page';
import { PantryPage } from './pantry/pantry-page';
import { RecipeFormPage } from './recipes/recipe-form-page';
import { RecipeListPage } from './recipes/recipe-list-page';
import { RecipePage } from './recipes/recipe-page';
import { SavedRecipesPage } from './recipes/saved-recipes-page';
import { LoginPage } from './users/login-page';
import { ProfilePage } from './users/profile-page';

const ABOUT: InfoPageData = {
  title: 'About PlateUp',
  paragraphs: [
    'PlateUp helps students and busy households plan meals around what they already have: ' +
      'find or share recipes, keep a pantry, and turn any recipe into a grocery list sized ' +
      'for the people you are feeding.',
    'Built for RPI Software Design and Documentation by Matt Durcan, Max Dyer, Kartik ' +
      'Prabhu, and Will Shockey.',
  ],
};

const CONTACT: InfoPageData = {
  title: 'Contact Us',
  paragraphs: [
    'Found a bug or have an idea? Open an issue on the PlateUp GitHub repository and the ' +
      'team will take a look.',
  ],
};

const PLANNER: InfoPageData = {
  title: 'Meal Planner',
  paragraphs: [
    'The weekly meal planner is coming in the Beta release. You will be able to put ' +
      'recipes on days of the week and build one grocery list for the whole week.',
    'For now, open a recipe and use “Add all to Grocery” to shop for it.',
  ],
};

export const routes: Routes = [
  { path: 'login', component: LoginPage, title: 'Log in | PlateUp!' },
  { path: 'about', component: InfoPage, data: { page: ABOUT }, title: 'About | PlateUp!' },
  { path: 'contact', component: InfoPage, data: { page: CONTACT }, title: 'Contact | PlateUp!' },
  {
    path: '',
    canActivateChild: [signedInGuard],
    children: [
      { path: 'home', component: HomePage, title: 'Home | PlateUp!' },
      { path: 'recipes', component: RecipeListPage, title: 'Recipes | PlateUp!' },
      { path: 'recipes/new', component: RecipeFormPage, title: 'Upload Recipe | PlateUp!' },
      { path: 'recipes/:recipeId', component: RecipePage, title: 'Recipe | PlateUp!' },
      {
        path: 'recipes/:recipeId/edit',
        component: RecipeFormPage,
        title: 'Edit Recipe | PlateUp!',
      },
      { path: 'saved', component: SavedRecipesPage, title: 'Saved | PlateUp!' },
      { path: 'pantry', component: PantryPage, title: 'Pantry | PlateUp!' },
      { path: 'grocery', component: GroceryListPage, title: 'Grocery | PlateUp!' },
      {
        path: 'planner',
        component: InfoPage,
        data: { page: PLANNER },
        title: 'Planner | PlateUp!',
      },
      { path: 'profile', component: ProfilePage, title: 'Profile | PlateUp!' },
      { path: 'users/:userId', component: ProfilePage, title: 'Profile | PlateUp!' },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
