import { Routes } from '@angular/router';
import { ContactPage } from './contact/contact-page/contact-page';
import { signedInGuard } from './core/signed-in.guard';
import { GroceryListPage } from './grocery-list/grocery-list-page/grocery-list-page';
import { HomePage } from './home/home-page/home-page';
import { InfoPage, InfoPageData } from './info/info-page/info-page';
import { PantryPage } from './pantry/pantry-page/pantry-page';
import { PreferencesPage } from './preferences/preferences-page/preferences-page';
import { RecipeFormPage } from './recipes/recipe-form-page/recipe-form-page';
import { RecipeListPage } from './recipes/recipe-list-page/recipe-list-page';
import { RecipePage } from './recipes/recipe-page/recipe-page';
import { SavedRecipesPage } from './recipes/saved-recipes-page/saved-recipes-page';
import { LoginPage } from './users/login-page/login-page';
import { ProfilePage } from './users/profile-page/profile-page';

/** Text for the about page. */
const ABOUT: InfoPageData = {
  title: 'About PlateUp',
  paragraphs: [
    'PlateUp started with a simple problem: cooking with a roommate meant keeping track of ' +
      'multiple recipes, grocery lists, and planners across too many different notes, lists, ' +
      'and spreadsheets. We wanted one place where everything could work together, so we built ' +
      'PlateUp.',
    'PlateUp is designed to make cooking and meal planning easier by bringing your recipes, ' +
      'pantry, grocery lists, and weekly planner into one app. We strive to create an app ' +
      'beneficial to any cook, whether you want something trendy, budget-friendly, or ' +
      'protein-dense. You can discover recipes from other users, save your favorites, and find ' +
      'something new based on your dietary needs, ingredients you already have, and more. When ' +
      'you find a recipe you like, PlateUp can add it to your meal plan and automatically add ' +
      'ingredients you need to your grocery list.',
    'We also wanted cooking to be something people could share. Users can upload their own ' +
      'recipes, share grocery and pantry lists between household members, follow other cooks, ' +
      'and leave reviews. Whether you are planning meals for yourself or with others, PlateUp is ' +
      'here to make the process easier to manage.',
    "Our team's primary goal is to build high-quality software that is intuitive, reliable, " +
      'and genuinely useful. We are developing PlateUp to make the everyday process of deciding ' +
      'what to cook easier, more organized, budget-aware, and enjoyable.',
  ],
};

/** Placeholder text for the planner page until the meal planner is built. */
const PLANNER: InfoPageData = {
  title: 'Meal Planner',
  paragraphs: [
    'The weekly meal planner is coming in the Beta release. You will be able to put ' +
      'recipes on days of the week and build one grocery list for the whole week.',
    'For now, open a recipe and use “Add all to Grocery” to shop for it.',
  ],
};

/**
 * Every page of the app. Login, About, and Contact are open to everyone; the rest sit under
 * `signedInGuard`, which sends visitors who are not signed in to the login page first.
 */
export const routes: Routes = [
  { path: 'login', component: LoginPage, title: 'Log in | PlateUp!' },
  { path: 'about', component: InfoPage, data: { page: ABOUT }, title: 'About | PlateUp!' },
  { path: 'contact', component: ContactPage, title: 'Contact | PlateUp!' },
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
      { path: 'preferences', component: PreferencesPage, title: 'Preferences | PlateUp!' },
      { path: 'users/:userId', component: ProfilePage, title: 'Profile | PlateUp!' },
      // Signed-in visitors to the bare address land on the home page.
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  // Unknown addresses fall back to the home page (which still requires sign-in).
  { path: '**', redirectTo: 'home' },
];
