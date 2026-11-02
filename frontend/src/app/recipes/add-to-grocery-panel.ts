import { Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { errorMessage } from '../core/api';
import { ToastService } from '../core/toast.service';
import { GroceryList } from '../grocery-list/grocery-list.models';
import { GroceryListsService } from '../grocery-list/grocery-lists.service';
import { Recipe } from './recipe.models';

/** Value of the list picker that means "make a new list". */
export const NEW_LIST = 'new';

/**
 * Generates grocery items from a recipe at the chosen servings (UC6): pick an
 * existing list or name a new one, then add every scaled ingredient at once.
 */
@Component({
  selector: 'app-add-to-grocery-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './add-to-grocery-panel.html',
  styleUrl: './add-to-grocery-panel.css',
})
export class AddToGroceryPanel implements OnInit {
  public readonly recipe = input.required<Recipe>();
  public readonly servings = input.required<number>();
  public readonly closed = output<void>();

  protected readonly newList = NEW_LIST;
  protected readonly lists = signal<GroceryList[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    listId: new FormControl(NEW_LIST, { nonNullable: true }),
    newListName: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private readonly groceryLists: GroceryListsService,
    private readonly toasts: ToastService,
    private readonly router: Router,
  ) {}

  public ngOnInit(): void {
    this.form.controls.newListName.setValue(this.recipe().title);
    this.groceryLists.getLists().subscribe({
      next: (lists) => {
        this.lists.set(lists);
        if (lists.length > 0) {
          this.form.controls.listId.setValue(lists[0].id);
        }
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }

  protected add(): void {
    const { listId, newListName } = this.form.getRawValue();
    if (listId === NEW_LIST && newListName.trim().length === 0) {
      this.error.set('Name the new list.');
      return;
    }
    const targetId: Observable<string> =
      listId === NEW_LIST
        ? this.groceryLists.createList(newListName).pipe(map((list) => list.id))
        : of(listId);
    this.saving.set(true);
    this.error.set(null);
    targetId
      .pipe(switchMap((id) => this.groceryLists.addRecipe(id, this.recipe().id, this.servings())))
      .subscribe({
        next: (list) => {
          this.saving.set(false);
          this.toasts.success(
            `Added ${this.recipe().ingredients.length} ingredients to ${list.name}`,
          );
          void this.router.navigate(['/grocery'], { queryParams: { list: list.id } });
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(error));
        },
      });
  }
}
