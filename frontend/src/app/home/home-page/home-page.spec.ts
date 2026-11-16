import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { addDays, today } from '../../core/calendar-date';
import { GroceryListsService } from '../../grocery-list/grocery-lists.service';
import { PantryItem } from '../../pantry/pantry.models';
import { pantryItem } from '../../pantry/pantry.fixtures';
import { PantryService } from '../../pantry/pantry.service';
import { RecipesService } from '../../recipes/recipes.service';
import { HomePage } from './home-page';

describe('HomePage', () => {
  async function render(pantry: PantryItem[]): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        { provide: RecipesService, useValue: { getRecipes: () => of([]) } },
        { provide: PantryService, useValue: { getItems: () => of(pantry) } },
        { provide: GroceryListsService, useValue: { getLists: () => of([]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('alerts about expiring pantry items and links to the pantry', async () => {
    const page = await render([
      pantryItem({ id: 'a', name: 'Milk', expiresOn: addDays(today(), 2) }),
      pantryItem({ id: 'b', name: 'Rice', expiresOn: addDays(today(), 60) }),
    ]);

    const alert = page.querySelector('.expiry-alert') as HTMLAnchorElement;
    expect(alert.textContent).toContain(
      '1 item in your pantry has expired or expires within 7 days.',
    );
    expect(alert.getAttribute('href')).toBe('/pantry');
  });

  it('shows no alert when nothing is expiring', async () => {
    const page = await render([pantryItem({ name: 'Rice', expiresOn: null })]);

    expect(page.querySelector('.expiry-alert')).toBeNull();
    expect(page.querySelector('.summary')?.textContent).toContain('1 item in your pantry');
  });
});
