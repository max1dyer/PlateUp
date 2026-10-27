import { Routes } from '@angular/router';
import { GroceryListPage } from './grocery-list/grocery-list-page';

export const routes: Routes = [
  { path: 'grocery', component: GroceryListPage, title: 'Grocery | PlateUp!' },
  // Other pages don't exist yet, so everything leads to the grocery list for now.
  { path: '**', redirectTo: 'grocery' },
];
